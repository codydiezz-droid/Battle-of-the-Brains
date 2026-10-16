import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three"

/**
 * The hero"s "bridge": a stream of light flowing along an arc that mirrors the
 * OneBridge logo, blue on the left and orange on the right, with a field of
 * faint points behind it. Loaded on demand from HeroBridge, never on the
 * critical path.
 */

// Arc endpoints and control points (a cubic Bezier, like the logo"s span).
const P0 = new Vector3(-7.2, -2.1, 0)
const P1 = new Vector3(-3.2, 3.6, 0.4)
const P2 = new Vector3(3.2, 3.6, -0.4)
const P3 = new Vector3(7.2, -2.1, 0)
const GOLD = new Color("#ffb81c")
const COPPER = new Color("#ff7a3d")
// Where the two halves meet: a pale light instead of a muddy mix.
const MID = new Color("#fff2d4")

function bezier(t: number, out: Vector3) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  out.set(
    a * P0.x + b * P1.x + c * P2.x + d * P3.x,
    a * P0.y + b * P1.y + c * P2.y + d * P3.y,
    a * P0.z + b * P1.z + c * P2.z + d * P3.z,
  )
  return out
}

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float pixelRatio;
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pixelRatio * (64.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, glow * glow * vAlpha);
  }
`

export interface BridgeSceneHandle {
  start: () => void
  stop: () => void
  setPointer: (x: number, y: number) => void
  setScroll: (progress: number) => void
  dispose: () => void
}

export function createBridgeScene(canvas: HTMLCanvasElement, options: { still: boolean; compact: boolean }): BridgeSceneHandle {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" })
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75)
  renderer.setPixelRatio(pixelRatio)

  const scene = new Scene()
  const camera = new PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0.4, 17)

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { pixelRatio: { value: pixelRatio } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  // 1. The flowing span.
  const flowCount = options.compact ? 1600 : 3400
  const flowPos = new Float32Array(flowCount * 3)
  const flowCol = new Float32Array(flowCount * 3)
  const flowSize = new Float32Array(flowCount)
  const flowAlpha = new Float32Array(flowCount)
  const seed = new Float32Array(flowCount) // starting position along the arc
  const speed = new Float32Array(flowCount)
  const spread = new Float32Array(flowCount * 3) // offset from the centre line
  for (let i = 0; i < flowCount; i++) {
    seed[i] = Math.random()
    speed[i] = 0.025 + Math.random() * 0.045
    // Most points hug the centre line so the span reads as one bright ribbon.
    const r = Math.pow(Math.random(), 3) * 0.6
    const a = Math.random() * Math.PI * 2
    spread[i * 3] = (Math.random() - 0.5) * 0.25
    spread[i * 3 + 1] = Math.cos(a) * r
    spread[i * 3 + 2] = Math.sin(a) * r * 1.6
    flowSize[i] = 0.6 + Math.random() * 1.6
    flowAlpha[i] = 0.5 + Math.random() * 0.5
  }
  const flowGeo = new BufferGeometry()
  flowGeo.setAttribute("position", new BufferAttribute(flowPos, 3))
  flowGeo.setAttribute("color", new BufferAttribute(flowCol, 3))
  flowGeo.setAttribute("size", new BufferAttribute(flowSize, 1))
  flowGeo.setAttribute("alpha", new BufferAttribute(flowAlpha, 1))
  const flow = new Points(flowGeo, material)

  // 2. Two glowing anchors where the span meets the ground.
  const anchorCount = options.compact ? 260 : 520
  const anchorPos = new Float32Array(anchorCount * 3)
  const anchorCol = new Float32Array(anchorCount * 3)
  const anchorSize = new Float32Array(anchorCount)
  const anchorAlpha = new Float32Array(anchorCount)
  for (let i = 0; i < anchorCount; i++) {
    const left = i % 2 === 0
    const base = left ? P0 : P3
    const c = left ? GOLD : COPPER
    const r = Math.pow(Math.random(), 1.8) * 1.1
    const a = Math.random() * Math.PI * 2
    anchorPos[i * 3] = base.x + Math.cos(a) * r
    anchorPos[i * 3 + 1] = base.y + (Math.random() - 0.6) * 0.5
    anchorPos[i * 3 + 2] = base.z + Math.sin(a) * r
    anchorCol[i * 3] = c.r
    anchorCol[i * 3 + 1] = c.g
    anchorCol[i * 3 + 2] = c.b
    anchorSize[i] = 0.8 + Math.random() * 2.2
    anchorAlpha[i] = 0.25 + Math.random() * 0.5
  }
  const anchorGeo = new BufferGeometry()
  anchorGeo.setAttribute("position", new BufferAttribute(anchorPos, 3))
  anchorGeo.setAttribute("color", new BufferAttribute(anchorCol, 3))
  anchorGeo.setAttribute("size", new BufferAttribute(anchorSize, 1))
  anchorGeo.setAttribute("alpha", new BufferAttribute(anchorAlpha, 1))
  const anchors = new Points(anchorGeo, material)

  // 3. A quiet field of points for depth.
  const dustCount = options.compact ? 350 : 700
  const dustPos = new Float32Array(dustCount * 3)
  const dustCol = new Float32Array(dustCount * 3)
  const dustSize = new Float32Array(dustCount)
  const dustAlpha = new Float32Array(dustCount)
  const pale = new Color("#d8c7a3")
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 34
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 18
    dustPos[i * 3 + 2] = -4 - Math.random() * 16
    dustCol[i * 3] = pale.r
    dustCol[i * 3 + 1] = pale.g
    dustCol[i * 3 + 2] = pale.b
    dustSize[i] = 0.6 + Math.random() * 1.4
    dustAlpha[i] = 0.08 + Math.random() * 0.22
  }
  const dustGeo = new BufferGeometry()
  dustGeo.setAttribute("position", new BufferAttribute(dustPos, 3))
  dustGeo.setAttribute("color", new BufferAttribute(dustCol, 3))
  dustGeo.setAttribute("size", new BufferAttribute(dustSize, 1))
  dustGeo.setAttribute("alpha", new BufferAttribute(dustAlpha, 1))
  const dust = new Points(dustGeo, material)

  scene.add(dust, anchors, flow)

  // Shift the bridge right on wide screens so the headline sits on clear space.
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // Wide screens: the span sits to the right of the headline.
    // Tall screens: a smaller span floats in the space above the text.
    const wide = w / h > 1.15
    const s = wide ? 0.64 : 0.28
    flow.position.x = anchors.position.x = wide ? 4.4 : 0
    flow.position.y = anchors.position.y = wide ? -0.9 : 4.9
    flow.scale.setScalar(s)
    anchors.scale.setScalar(s)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  const target = { x: 0, y: 0 }
  let scroll = 0
  const point = new Vector3()
  const colour = new Color()

  function update(time: number) {
    for (let i = 0; i < flowCount; i++) {
      const t = (seed[i] + time * speed[i]) % 1
      bezier(t, point)
      // Narrow the stream near the anchors, widen it at mid-span.
      const swell = 0.35 + Math.sin(t * Math.PI) * 0.65
      flowPos[i * 3] = point.x + spread[i * 3]
      flowPos[i * 3 + 1] = point.y + spread[i * 3 + 1] * swell
      flowPos[i * 3 + 2] = point.z + spread[i * 3 + 2] * swell
      if (t < 0.5) colour.copy(GOLD).lerp(MID, t * 2)
      else colour.copy(MID).lerp(COPPER, (t - 0.5) * 2)
      flowCol[i * 3] = colour.r
      flowCol[i * 3 + 1] = colour.g
      flowCol[i * 3 + 2] = colour.b
    }
    flowGeo.attributes.position.needsUpdate = true
    flowGeo.attributes.color.needsUpdate = true

    dust.rotation.y = time * 0.01
    // Gentle parallax from the pointer, and a slow tilt as the page scrolls.
    camera.position.x += (target.x * 1.4 - camera.position.x) * 0.04
    camera.position.y += (0.4 + target.y * 0.8 - scroll * 2 - camera.position.y) * 0.04
    camera.position.z = 17 + scroll * 4
    camera.lookAt(0, 0.4 - scroll * 1.5, 0)
    renderer.render(scene, camera)
  }

  let frame = 0
  let running = false
  const t0 = performance.now()
  const loop = () => {
    update((performance.now() - t0) / 1000)
    frame = requestAnimationFrame(loop)
  }

  if (options.still) update(4)

  return {
    start() {
      if (running || options.still) return
      running = true
      frame = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      cancelAnimationFrame(frame)
    },
    setPointer(x, y) {
      target.x = x
      target.y = y
    },
    setScroll(p) {
      scroll = p
      if (options.still) update(4)
    },
    dispose() {
      cancelAnimationFrame(frame)
      ro.disconnect()
      flowGeo.dispose()
      anchorGeo.dispose()
      dustGeo.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}
