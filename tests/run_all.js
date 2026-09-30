// Roda todas as suítes em sequência (build + cópia para test.html antes) e soma os resultados.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
execSync('node tools/build_app.js', { cwd: root, stdio: 'inherit' }); // artifact real (dist)
execSync('node tools/build_app.js --decks tests/fixture_decks.json', { cwd: root, stdio: 'inherit' }); // test.html com dados de fixture (estáveis) para as suítes
const suites = fs.readdirSync(__dirname).filter(f => /^t_.*\.js$/.test(f)).sort();
let ok = 0, fail = 0;
for (const s of suites) {
  try { execSync('node ' + s, { cwd: __dirname, stdio: 'inherit', timeout: 900000 }); } catch (e) { console.log('!! suíte ' + s + ' abortou'); fail++; }
}
for (const f of fs.readdirSync(path.join(__dirname, 'results'))) {
  const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'results', f), 'utf8')); ok += r.ok; fail += r.fail;
}
// verificações de conteúdo e layout no conteúdo REAL (reconstrói test.html com src/decks.json)
execSync('node tools/build_app.js', { cwd: root, stdio: 'inherit' });
const extra = [['uerj', 'node tests/x_uerj.js', root], ['conteúdo', 'node tools/validate_content.js', root], ['svg', 'node tests/svg_check.js', root], ['responsividade', 'node tests/audit_resp.js', root], ['duplicatas', 'node tools/dup_check.js', root]];
const decks = JSON.parse(fs.readFileSync(path.join(root, 'src', 'decks.json'), 'utf8'));
const soTeste = decks.every(d => d.subs.every(s => s.cards.every(c => c.f.startsWith('[TESTE]'))));
for (const [nome, cmd, cwd] of extra) {
  let okx = true; try { execSync(cmd, { cwd, stdio: 'inherit', timeout: 900000 }); } catch (e) { okx = false; }
  if (nome === 'duplicatas' && soTeste) { console.log('  (conteúdo ainda é o fictício [TESTE], gerado por molde: pares parecidos são esperados; não conta como falha)'); continue; }
  if (nome === 'uerj') continue; // conta pelo results/*.json abaixo
  if (okx) ok++; else fail++;
}
{ const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'results', 'uerj_conteudo_real.json'), 'utf8')); ok += r.ok; fail += r.fail; }
console.log(`\n== TOTAL: ${ok} passaram, ${fail} falharam (${suites.length} suítes) ==`);
process.exit(fail ? 1 : 0);
