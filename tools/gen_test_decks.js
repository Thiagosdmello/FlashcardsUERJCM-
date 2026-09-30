// Gera tests/fixture_decks.json: cartas FICTÍCIAS [TESTE] usadas só pelas suítes de teste (dados estáveis).
// Não toca no conteúdo real (src/decks.json, gerado por tools/gen_uerj.js).
const fs = require('fs');
const path = require('path');

const BASE_Q = ['O que é?', 'Por que acontece / quem tem?', 'Como se manifesta?', 'Como se confirma?', 'O que se faz?', 'O número / sinal de alarme'];
const TIPOS = ['rápida', 'conduta', 'conduta', 'rápida', 'síntese', 'conduta', 'rápida', 'conduta', 'rápida', 'conduta'];

function tabela(tok) {
  return '<table><thead><tr><th>Critério</th><th>Valor</th><th>Pontos</th></tr></thead><tbody>' +
    '<tr><td>Item A (' + tok + ')</td><td>&gt; 100</td><td>1</td></tr>' +
    '<tr><td>Item B</td><td>&lt; 90</td><td>2</td></tr>' +
    '<tr><td>Item C</td><td>presente</td><td>1</td></tr></tbody></table>';
}
function svg() {
  return '<svg class="dg" viewBox="0 0 340 120">' +
    '<rect x="10" y="40" width="90" height="40" rx="8" fill="#3d85d8"/>' +
    '<text x="55" y="64" text-anchor="middle" font-size="10" fill="#ffffff">Etapa 1</text>' +
    '<line x1="100" y1="60" x2="125" y2="60" stroke="#9fb2cf" stroke-width="2"/>' +
    '<rect x="125" y="40" width="90" height="40" rx="8" fill="#d9aa4a"/>' +
    '<text x="170" y="64" text-anchor="middle" font-size="10" fill="#0f1b30">Etapa 2</text>' +
    '<line x1="215" y1="60" x2="240" y2="60" stroke="#9fb2cf" stroke-width="2"/>' +
    '<rect x="240" y="40" width="90" height="40" rx="8" fill="#3fb98a"/>' +
    '<text x="285" y="64" text-anchor="middle" font-size="10" fill="#0f1b30">Etapa 3</text>' +
    '</svg>';
}

function sub(id, nome, p, opts = {}) {
  const cards = [];
  const tok = id.replace(/-/g, '');
  if (!opts.semBase) {
    BASE_Q.forEach((q, i) => {
      cards.push({ id: `${id}-b${i + 1}`, b: 1,
        f: `[TESTE] ${nome}: ${q}`,
        v: `Resposta curta fictícia da carta de base ${i + 1} de <b>${nome}</b>. Serve só para testar o fluxo. Token ${tok}b${i + 1}.` });
    });
  }
  const n = opts.n || 10;
  for (let i = 1; i <= n; i++) {
    const c = { id: opts.semBase ? `${id}-${i}` : `${id}-${i}`,
      f: `[TESTE] ${nome} — carta ${TIPOS[(i - 1) % TIPOS.length]} ${i}`,
      v: `Verso fictício ${i} de ${nome}. Token ${tok}c${i}.` };
    if (i === 3) c.v += '<br><br>' + tabela(tok);
    if (i === 5) c.v = `Fluxo fictício de ${nome} (token ${tok}c5):` + svg();
    if (i === 7) c.v += '<ul><li>Primeiro ponto de exemplo</li><li>Segundo ponto com <b>número 42</b></li></ul>';
    if (i % 3 === 0) c.ex = '<b>Macete:</b> gancho mnemônico de exemplo para a carta ' + i + '.';
    if (i === 8) c.ex = '<b>Armadilha:</b> erro comum de exemplo para a carta ' + i + '.';
    cards.push(c);
  }
  return { id, nome, p, cards };
}

const DECKS = [
  { id: 'card', nome: 'Cardiologia', ic: '❤️', trilha: 'estagio', fs: 'card-ic',
    desc: 'Insuficiência cardíaca, hipertensão, coronariopatias e arritmias.',
    subs: [sub('card-ic', 'Insuficiência cardíaca', 5), sub('card-has', 'Hipertensão arterial', 4)] },
  { id: 'emerg', nome: 'Emergência', ic: '🚨', trilha: 'estagio', fs: 'emerg-pcr',
    desc: 'PCR, choque, via aérea e o paciente grave na porta.',
    subs: [sub('emerg-pcr', 'PCR e ACLS', 5), sub('emerg-choque', 'Choque', 4)] },
  { id: 'derm', nome: 'Dermatologia', ic: '🧴', trilha: 'estagio', fs: null,
    desc: 'Lesões elementares, farmacodermias e dermatoses frequentes.',
    subs: [sub('derm-psor', 'Psoríase', 2, { n: 4 })] },
  { id: 'atu', nome: '🆕 Atualizações', ic: '🆕', trilha: 'estagio', fs: 'atu-card',
    desc: 'Mudanças de diretriz dos últimos ~2 anos.',
    subs: [sub('atu-card', 'Cardiologia', 4, { semBase: true, n: 2 })] },
  { id: 'cir', nome: 'Cirurgia', ic: '🔪', trilha: 'residencia', restrito: true, fs: 'cir-abd',
    desc: 'Abdome agudo, trauma e pré/pós-operatório.',
    subs: [sub('cir-abd', 'Abdome agudo', 5), sub('cir-trauma', 'Trauma (ATLS)', 5)] },
];
// Atualizações: ids atu-<sub>-<n>
DECKS[3].subs[0].cards.forEach((c, i) => { c.id = `atu-card-${i + 1}`; });

DECKS.forEach((d, i) => {
  d.trilha = 'uerj'; delete d.restrito;
  d.freq = { 2022: 3 - i % 2, 2023: i % 3, 2024: 2, 2025: 1, 2026: i % 2 };
  d.subs.forEach(s => s.cards.forEach(c => { c.y = [2022 + (c.id.length % 5)]; }));
});
fs.writeFileSync(path.join(__dirname, '..', 'tests', 'fixture_decks.json'), JSON.stringify(DECKS));
const n = DECKS.reduce((a, d) => a + d.subs.reduce((b, s) => b + s.cards.length, 0), 0);
console.log('fixture_decks.json:', DECKS.length, 'temas,', DECKS.reduce((a, d) => a + d.subs.length, 0), 'subtemas,', n, 'cartas');
