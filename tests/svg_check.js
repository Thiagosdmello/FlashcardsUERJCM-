// Validador de SVG renderizado: desenha cada diagrama do conteúdo no Chromium e mede se o texto cabe
// (dentro do viewBox e, quando o texto está sobre um retângulo, com folga ≥ 3 px de cada lado = 6 px no total).
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const arq = process.argv[2] || path.join(__dirname, '..', 'src', 'decks.json');
const decks = JSON.parse(fs.readFileSync(arq, 'utf8'));
const itens = [];
decks.forEach(d => d.subs.forEach(s => s.cards.forEach(c => { (c.v.match(/<svg[\s\S]*?<\/svg>/gi) || []).forEach((sv, k) => itens.push({ id: c.id + (k ? '#' + (k + 1) : ''), sv })); })));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent('<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"><style>body{font-family:Poppins,Arial,sans-serif}svg.dg{width:360px}svg text{font-family:Poppins,Arial,sans-serif}</style></head><body><div id=w></div></body></html>');
  await p.waitForTimeout(400);
  const probs = await p.evaluate(itens => {
    const out = [];
    // Sem acesso ao Google Fonts, o Chromium mede com a fonte reserva (mais estreita que a Poppins): compensa 12%.
    const K = document.fonts.check('10px Poppins') ? 1 : 1.12;
    for (const it of itens) {
      const w = document.getElementById('w'); w.innerHTML = it.sv; const svg = w.querySelector('svg');
      const vb = svg.viewBox.baseVal;
      const rects = [...svg.querySelectorAll('rect')].map(r => r.getBBox());
      svg.querySelectorAll('text').forEach(t => {
        const b0 = t.getBBox(); const txt = t.textContent.trim();
        const anc = t.getAttribute('text-anchor'); const wK = b0.width * K;
        const bb = { width: wK, height: b0.height, y: b0.y, x: anc === 'middle' ? b0.x - (wK - b0.width) / 2 : anc === 'end' ? b0.x - (wK - b0.width) : b0.x };
        if (bb.x < vb.x - .5 || bb.y < vb.y - .5 || bb.x + bb.width > vb.x + vb.width + .5 || bb.y + bb.height > vb.y + vb.height + .5) out.push(it.id + ': "' + txt + '" sai do viewBox');
        const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
        const dono = rects.filter(r => cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height).sort((a, b) => a.width * a.height - b.width * b.height)[0];
        if (dono && (bb.x < dono.x + 3 || bb.x + bb.width > dono.x + dono.width - 3)) out.push(it.id + ': "' + txt + '" não cabe na caixa (' + bb.width.toFixed(0) + ' px de texto em ' + dono.width.toFixed(0) + ' px)');
        const fs_ = parseFloat(t.getAttribute('font-size') || '10');
        if (dono && txt.length * 5.3 * fs_ / 10 + 6 > dono.width) out.push(it.id + ': "' + txt + '" estoura a regra de 5,3 px/caractere');
      });
    }
    return out;
  }, itens);
  await b.close();
  console.log(`[svg] ${itens.length} diagramas renderizados · ${probs.length} problemas`);
  probs.slice(0, 50).forEach(x => console.log('  ✗ ' + x));
  process.exit(probs.length ? 1 : 0);
})();
