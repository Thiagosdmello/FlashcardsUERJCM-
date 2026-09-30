// Validação estática do conteúdo (seção 3): ids únicos e estáveis, cartas de base, tamanhos, macetes, pesos e regras de SVG.
// Uso: node tools/validate_content.js [arquivo.json]
const fs = require('fs'); const path = require('path');
const arq = process.argv[2] || path.join(__dirname, '..', 'src', 'decks.json');
const decks = JSON.parse(fs.readFileSync(arq, 'utf8'));
const erros = [], avisos = [];
const ids = new Map(); const E = (id, m) => erros.push(id + ': ' + m); const A = (id, m) => avisos.push(id + ': ' + m);
function checaSvg(id, html) {
  const svgs = html.match(/<svg[\s\S]*?<\/svg>/gi) || [];
  svgs.forEach((sv, k) => {
    const tag = sv.match(/<svg[^>]*>/i)[0]; const r = id + ' svg' + (k + 1);
    if (!/class="dg"/.test(tag)) E(r, 'sem class="dg"');
    if (/\s(width|height)=/.test(tag)) E(r, 'svg com width/height');
    const vb = /viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/.exec(tag);
    if (!vb) E(r, 'sem viewBox'); else if (+vb[1] < 320 || +vb[1] > 360) E(r, 'viewBox com largura ' + vb[1] + ' (use 320–360)');
    if (/\sid=/.test(sv)) E(r, 'usa id=');
    if (/<(defs|marker|style|img)\b/i.test(sv)) E(r, 'usa <defs>/<marker>/<style>/<img>');
    (sv.match(/<line\b[^>]*>/gi) || []).forEach(l => { ['x1', 'y1', 'x2', 'y2'].forEach(a => { if (!new RegExp('\\s' + a + '="').test(l)) E(r, '<line> sem ' + a); }); });
  });
}
decks.forEach(d => {
  if (!['estagio', 'residencia', 'uerj'].includes(d.trilha)) E(d.id, 'trilha inválida');
  if (d.fs && !d.subs.some(s => s.id === d.fs)) E(d.id, 'fs aponta para subtema inexistente');
  const atu = d.id.startsWith('atu');
  d.subs.forEach(s => {
    if (ids.has(s.id)) E(s.id, 'id de subtema repetido'); ids.set(s.id, 1);
    if (!(s.p >= 1 && s.p <= 5 && Number.isInteger(s.p))) E(s.id, 'peso p fora de 1–5');
    const base = s.cards.filter(c => c.b);
    if (atu) { if (base.length) E(s.id, 'Atualizações não têm cartas de base'); if (s.p !== 4) E(s.id, 'Atualizações usam p:4'); }
    else if (base.length !== 6 && !(d.trilha === 'uerj' && base.length === 0)) E(s.id, base.length + ' cartas de base (esperado 6)');
    base.forEach((c, i) => {
      if (c.id !== s.id + '-b' + (i + 1)) E(c.id, 'id de base fora do padrão (esperado ' + s.id + '-b' + (i + 1) + ')');
      if (s.cards[i] !== c) E(c.id, 'carta de base fora do início do subtema');
      const n = c.v.length; if (n < 60 || n > 350) A(c.id, 'verso de base com ' + n + ' caracteres (alvo 60–350)');
      if (/<(table|svg)/i.test(c.v)) E(c.id, 'carta de base com tabela/SVG');
    });
    s.cards.forEach(c => {
      if (ids.has(c.id)) E(c.id, 'id de carta repetido'); ids.set(c.id, 1);
      if (atu && !new RegExp('^' + s.id + '-\\d+$').test(c.id)) E(c.id, 'id de Atualizações fora do padrão atu-<sub>-<n>');
      if (!c.f || !c.v) E(c.id, 'frente ou verso vazio');
      // limite de 1400 vale para o texto + HTML; o markup do diagrama SVG é medido à parte (máx. 3000 por diagrama)
      const semSvg = c.v.replace(/<svg[\s\S]*?<\/svg>/gi, '');
      if (semSvg.length > 1400) E(c.id, 'verso com ' + semSvg.length + ' caracteres fora do SVG (máx. 1400)');
      (c.v.match(/<svg[\s\S]*?<\/svg>/gi) || []).forEach(sv => { if (sv.length > 3000) E(c.id, 'SVG com ' + sv.length + ' caracteres (máx. 3000)'); });
      if (c.ex && !/^<b>(Macete|Armadilha):<\/b>/.test(c.ex)) E(c.id, 'macete deve começar com <b>Macete:</b> ou <b>Armadilha:</b>');
      if (d.trilha === 'uerj' && !(Array.isArray(c.y) && c.y.length && c.y.every(y => y >= 2022 && y <= 2026))) E(c.id, 'ano de origem (y) ausente ou inválido');
      if ((c.v.match(/<table/g) || []).length !== (c.v.match(/<\/table>/g) || []).length) E(c.id, 'tabela mal fechada');
      checaSvg(c.id, c.v);
    });
  });
});
const nC = decks.reduce((a, d) => a + d.subs.reduce((b, s) => b + s.cards.length, 0), 0);
console.log(`[conteúdo] ${decks.length} temas · ${decks.reduce((a, d) => a + d.subs.length, 0)} subtemas · ${nC} cartas · ${erros.length} erros · ${avisos.length} avisos`);
erros.slice(0, 50).forEach(e => console.log('  ✗ ' + e)); avisos.slice(0, 20).forEach(a => console.log('  ! ' + a));
process.exit(erros.length ? 1 : 0);
