// Gera os ícones do PWA (web/*.png) a partir do logo CT de build_app.js. Uso: node tools/make_icons.js
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'build_app.js'), 'utf8');
const LOGO = eval(src.match(/const LOGO = ('[\s\S]*?<\/svg>');/)[1]);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [n, sz, pad] of [['icon-192.png', 192, .16], ['icon-512.png', 512, .16], ['icon-maskable-512.png', 512, .26], ['apple-touch-icon.png', 180, .14]]) {
    const w = Math.round(sz * (1 - 2 * pad));
    await p.setViewportSize({ width: sz, height: sz });
    await p.setContent('<html><body style="margin:0;background:#0f1b30;display:grid;place-items:center;width:' + sz + 'px;height:' + sz + 'px"><div style="width:' + w + 'px;height:' + w + 'px">' + LOGO.replace('<svg ', '<svg style="width:100%;height:100%" ') + '</div></body></html>');
    await p.screenshot({ path: path.join(__dirname, '..', 'web', n) });
  }
  await b.close(); console.log('ícones gerados em web/');
})();
