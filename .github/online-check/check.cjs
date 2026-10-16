// Temporary: how long does joining by invite link take, with the real internet?
const { chromium } = require('playwright');
const base = 'http://localhost:4173/penalty-club/';
(async () => {
  const b = await chromium.launch();
  for (let i = 1; i <= 3; i++) {
    const A = await (await b.newContext()).newPage();
    const B = await (await b.newContext()).newPage();
    await A.goto(base); await A.click('#open-online'); await A.fill('#nick', 'Host'); await A.click('#create-game');
    const code = (await A.textContent('#lobby-code')).trim();
    await A.waitForTimeout(3000);
    const t0 = Date.now();
    await B.goto(base + '?join=' + code);
    const ok = await B.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2, null, { timeout: 30000 }).then(() => true).catch(() => false);
    const tb = (Date.now() - t0) / 1000;
    const okA = await A.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2, null, { timeout: 30000 }).then(() => true).catch(() => false);
    const ta = (Date.now() - t0) / 1000;
    console.log(`run ${i}: friend sees host ${ok ? tb.toFixed(2) + ' s' : 'NEVER'} · host sees friend ${okA ? ta.toFixed(2) + ' s' : 'NEVER'} (from opening the invite link)`);
    console.log('  friend diag:', await B.textContent('#lobby-diag'));
    await A.context().close(); await B.context().close();
  }
  await b.close();
})();
