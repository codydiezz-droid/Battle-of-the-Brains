// Temporary: two separate browsers try to meet online through each network, with the real internet.
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:4173/penalty-club/';
(async () => {
  const b = await chromium.launch();
  for (const only of ['', 'mqtt', 'relay', 'nostr,torrent', 'nostr', 'torrent']) {
    const A = await (await b.newContext()).newPage();
    const B = await (await b.newContext()).newPage();
    const errs = [];
    for (const [n, p] of [['A', A], ['B', B]]) { p.on('pageerror', (e) => errs.push(n + ': ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(n + ' console: ' + m.text().slice(0, 140)); }); }
    const url = base + (only ? `?only=${only}` : '');
    await A.goto(url); await B.goto(url);
    await A.click('#open-online'); await A.fill('#nick', 'Host'); await A.click('#create-game');
    await A.waitForSelector('#lobby:not([hidden])', { timeout: 30000 });
    const code = (await A.textContent('#lobby-code')).trim();
    await B.click('#open-online'); await B.fill('#nick', 'Guest'); await B.fill('#join-code', code); await B.click('#join-game');
    await B.waitForSelector('#lobby:not([hidden])', { timeout: 30000 });
    const t0 = Date.now();
    const ok = await A.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2, null, { timeout: 60000 }).then(() => true).catch(() => false);
    const okB = await B.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2, null, { timeout: 5000 }).then(() => true).catch(() => false);
    console.log(`\n=== route: ${only || 'ALL'} → ${ok && okB ? `CONNECTED in ${((Date.now() - t0) / 1000).toFixed(1)} s` : `NOT connected (host sees guest: ${ok}, guest sees host: ${okB})`}`);
    console.log('host diag :', await A.textContent('#lobby-diag'));
    console.log('guest diag:', await B.textContent('#lobby-diag'));
    if (errs.length) console.log('errors:', errs.slice(0, 6));
    await A.context().close(); await B.context().close();
  }
  await b.close();
})();
