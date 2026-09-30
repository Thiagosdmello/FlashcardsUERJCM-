// Monta src/decks.json a partir de content/*.js (tópico UERJ R+ CM).
// - id da carta = <subtema>-<chave>  (estável)
// - organização só por tema (um bloco por tema); peso pelo ranking de frequência do tema
// - freq: tópicos anotados por ano em cada tema (contagem manual das anotações, uma por questão/tópico)
const fs = require('fs'); const path = require('path');
const R = p => path.join(__dirname, '..', p);
const ORDEM = ['hem', 'inf', 'endo', 'reu', 'gas', 'card', 'neu', 'onc', 'pne', 'nef', 'uti'];
// Tópicos anotados por tema e ano (cada bloco de anotação = uma questão/tópico da prova).
const FREQ = {
  hem: { 2022: 7, 2023: 7, 2024: 6, 2025: 3, 2026: 2 },
  inf: { 2022: 4, 2023: 3, 2024: 6, 2025: 5, 2026: 2 },
  endo: { 2022: 5, 2023: 3, 2024: 1, 2025: 4, 2026: 6 },
  reu: { 2022: 1, 2023: 3, 2024: 6, 2025: 4, 2026: 3 },
  gas: { 2022: 5, 2023: 3, 2024: 3, 2025: 2, 2026: 3 },
  card: { 2022: 4, 2023: 0, 2024: 2, 2025: 4, 2026: 3 },
  neu: { 2022: 4, 2023: 3, 2024: 1, 2025: 2, 2026: 3 },
  onc: { 2022: 3, 2023: 4, 2024: 5, 2025: 0, 2026: 0 },
  pne: { 2022: 1, 2023: 2, 2024: 4, 2025: 2, 2026: 0 },
  nef: { 2022: 0, 2023: 2, 2024: 3, 2025: 1, 2026: 3 },
  uti: { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 2 },
};
const tot = id => Object.values(FREQ[id]).reduce((a, b) => a + b, 0);
const top4 = ORDEM.slice().sort((a, b) => tot(b) - tot(a)).slice(0, 4);

const decks = ORDEM.map(id => require(R('content/' + id + '.js')))
  .sort((a, b) => tot(b.id) - tot(a.id));
const ids = new Set();
// Organização só por tema: cada tema vira um bloco único; as cartas de um mesmo assunto continuam juntas (ordem do arquivo).
// Os ids das cartas continuam <assunto>-<chave> (estáveis).
decks.forEach((d, i) => {
  d.trilha = 'uerj';
  d.freq = FREQ[d.id];
  const cards = [];
  d.subs.forEach(s => s.cards.forEach(c => {
    const id = s.id + '-' + c.k;
    if (ids.has(id)) throw new Error('id repetido: ' + id);
    ids.add(id);
    const o = { id, f: c.f, v: c.v, y: c.y }; // y (ano) fica só nos dados, não aparece no app
    if (c.ex) o.ex = c.ex;
    cards.push(o);
  }));
  const rank = i; // decks já ordenados por frequência
  d.subs = [{ id: d.id, nome: d.nome, p: rank < 3 ? 5 : rank < 6 ? 4 : rank < 9 ? 3 : 2, cards }];
  d.fs = d.id;
});
fs.writeFileSync(R('src/decks.json'), JSON.stringify(decks));

const nC = decks.reduce((a, d) => a + d.subs.reduce((b, s) => b + s.cards.length, 0), 0);
const nS = decks.reduce((a, d) => a + d.subs.length, 0);
console.log(`UERJ R+ CM: ${decks.length} temas · ${nS} subtemas · ${nC} cartas`);
decks.forEach(d => {
  const n = d.subs.reduce((a, s) => a + s.cards.length, 0);
  console.log(`  ${d.nome.padEnd(20)} ${String(tot(d.id)).padStart(3)} tópicos · ${String(d.subs.length).padStart(2)} subtemas · ${String(n).padStart(3)} cartas · ${Object.entries(FREQ[d.id]).map(([y, v]) => y.slice(2) + ':' + v).join(' ')}`);
});
const anos = {}; decks.forEach(d => Object.entries(d.freq).forEach(([y, v]) => { anos[y] = (anos[y] || 0) + v; }));
console.log('  por ano:', JSON.stringify(anos));
