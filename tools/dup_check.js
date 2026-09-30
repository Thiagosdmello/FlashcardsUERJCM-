// Duplicatas DENTRO do mesmo subtema (entre especialidades a repetição é proposital).
// Similaridade = 65% Jaccard de palavras + 35% Jaccard de bigramas de palavras; limiar 0,50.
// Uso: node tools/dup_check.js [arquivo.json]  (padrão: src/decks.json). Sai com código 1 se achar pares.
const fs = require('fs'); const path = require('path');
const LIMIAR = 0.50;
const arq = process.argv[2] || path.join(__dirname, '..', 'src', 'decks.json');
const decks = JSON.parse(fs.readFileSync(arq, 'utf8'));
const STOP = new Set('a o e de da do das dos em no na nos nas um uma para por com que se ao aos as os ou mais menos como qual quais ser sao e é'.split(' '));
const limpa = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palavras = s => limpa(s).split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w));
const jac = (A, B) => { if (!A.size && !B.size) return 0; let i = 0; A.forEach(x => { if (B.has(x)) i++; }); return i / (A.size + B.size - i); };
function perfil(c) { const w = palavras(c.f + ' ' + c.v); const bi = new Set(); for (let i = 0; i < w.length - 1; i++) bi.add(w[i] + ' ' + w[i + 1]); return { w: new Set(w), bi }; }
const sim = (a, b) => 0.65 * jac(a.w, b.w) + 0.35 * jac(a.bi, b.bi);
let pares = [], comp = 0;
decks.forEach(d => d.subs.forEach(s => {
  const pf = s.cards.map(perfil);
  for (let i = 0; i < pf.length; i++) for (let j = i + 1; j < pf.length; j++) { comp++; const x = sim(pf[i], pf[j]); if (x >= LIMIAR) pares.push({ sub: s.id, a: s.cards[i].id, b: s.cards[j].id, x: +x.toFixed(2) }); }
}));
pares.sort((p, q) => q.x - p.x);
console.log(`[dup_check] ${comp} comparações · ${pares.length} pares ≥ ${LIMIAR}`);
pares.slice(0, 40).forEach(p => console.log(`  ${p.x}  ${p.a}  ×  ${p.b}`));
if (require.main === module) process.exit(pares.length ? 1 : 0);
module.exports = { sim, perfil };
