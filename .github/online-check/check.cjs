// Temporary: how long does joining by invite link take, with the real internet?
const { chromium } = require('playwright');
const base = 'http://localhost:4173/penalty-club/';
(async () => {
  const b = await chromium.launch();
  console.log('page load only:'); { const P = await (await b.newContext()).newPage(); const t = Date.now(); await P.goto(base); await P.waitForFunction(() => window.__pcNetLog && window.__pcNetLog.some((x) => x.includes('page ready'))); console.log('  page ready after', (Date.now() - t) / 1000, 's', await P.evaluate(() => window.__pcNetLog)); await P.context().close(); }
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
    console.log('  friend timeline:', JSON.stringify(await B.evaluate(() => window.__pcNetLog)));
    console.log('  host timeline  :', JSON.stringify((await A.evaluate(() => window.__pcNetLog)).slice(-8)));
    await A.context().close(); await B.context().close();
  }
  await b.close();
})();
