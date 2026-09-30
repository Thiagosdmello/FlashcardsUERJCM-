// Monta o HTML final: shell (CSS + markup estático) → #decks-data → #app-code.
// Saídas: dist/flashcards-ct.html (artifact) e test/test.html (cópia com documento completo para o Playwright).
const fs = require('fs');
const path = require('path');
const R = p => path.join(__dirname, '..', p);

const LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
  '<rect x="12" y="7" width="24" height="32" rx="4" fill="#ffffff" stroke="rgba(15,27,48,.25)" stroke-width="1" transform="rotate(-16 24 24)"/>' +
  '<rect x="12" y="8" width="24" height="32" rx="4" fill="#3d85d8" transform="rotate(-5 24 24)"/>' +
  '<rect x="13" y="9" width="24" height="32" rx="4" fill="#d9aa4a" stroke="#0f1b30" stroke-width="1" transform="rotate(7 24 24)"/>' +
  '<text x="25" y="30" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="13" fill="#0f1b30" transform="rotate(7 24 24)">CT</text></svg>';

function arred(n) {
  const f = x => x.toLocaleString('pt-BR');
  if (n < 20) return String(n);
  if (n < 1000) return '+' + f(Math.floor(n / 10) * 10);
  return '+' + f(Math.floor(n / 1000) * 1000);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const WEB = process.argv.includes('--web');
// .env local (opcional): SUPABASE_URL / SUPABASE_ANON_KEY — na Vercel vêm do painel
try { fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch (e) { /* sem .env */ } // build para Vercel: gera public/ (index.html completo + PWA + config.js)
const argDecks = (() => { const i = process.argv.indexOf('--decks'); return i > 0 ? process.argv[i + 1] : null; })();
function build() {
  const shell = fs.readFileSync(R('src/shell.html'), 'utf8');
  const decks = JSON.parse(fs.readFileSync(argDecks ? path.resolve(argDecks) : R('src/decks.json'), 'utf8'));
  let logic = fs.readFileSync(R('src/logic.js'), 'utf8');
  const cfgPath = R('src/config.js');
  if (fs.existsSync(cfgPath)) logic = fs.readFileSync(cfgPath, 'utf8') + '\n' + logic;
  logic += '\n;boot();\n';
  if (/<\/script/i.test(logic)) throw new Error('logic.js contém </script>');

  const nc = decks.reduce((a, d) => a + d.subs.reduce((b, s) => b + s.cards.length, 0), 0);
  const ns = decks.reduce((a, d) => a + d.subs.length, 0);
  const stats = `<div><b>${arred(nc)}</b><span>flashcards</span></div>${ns > decks.length ? `<div><b>${arred(ns)}</b><span>subtemas</span></div>` : ''}<div><b>${decks.length}</b><span>temas</span></div><div><b>FSRS-5</b><span>revisão espaçada</span></div>`;
  const chip = d => `<span>${esc(d.ic)} ${esc(d.nome.replace(/^🆕\s*/, ''))}</span>`;
  const temas = decks.map(chip).join('');
  const json = JSON.stringify(decks).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');

  // replace com função para não interpretar "$" do conteúdo
  const out = shell
    .replace(/\{\{LOGO\}\}/g, () => LOGO)
    .replace('{{LANDING_STATS}}', () => stats)
    .replace('{{LANDING_TEMAS}}', () => temas)
    .replace('{{DECKS_JSON}}', () => json)
    .replace('{{APP_CODE}}', () => logic);

  fs.mkdirSync(R('dist'), { recursive: true });
  fs.mkdirSync(R('test'), { recursive: true });
  if (!argDecks && !WEB) fs.writeFileSync(R('dist/flashcards-ct.html'), out); // com fixture, só gera o test.html
  const full = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + out + '</body></html>';
  if (!WEB) fs.writeFileSync(R('test/test.html'), full); // sempre copia depois do build
  if (WEB) buildWeb(out);
  console.log(`build ok${WEB ? ' (web → public/)' : ''}${argDecks ? ' (fixture de teste → só test/test.html)' : ''} · ${decks.length} temas · ${ns} subtemas · ${nc} cartas · ${(out.length / 1024).toFixed(0)} KB`);
}
// ---- build web (Vercel/GitHub Pages): documento completo, PWA e config do Supabase por variável de ambiente ----
function buildWeb(out) {
  const pub = R('public');
  fs.rmSync(pub, { recursive: true, force: true });
  fs.mkdirSync(path.join(pub, 'vendor'), { recursive: true });
  const corte = out.indexOf('<template id="logo-tpl">');
  const head = out.slice(0, corte), body = out.slice(corte);
  const versao = Date.now().toString(36);
  const html = '<!doctype html>\n<html lang="pt-BR" data-theme="dark">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
    '<meta name="description" content="Flashcards de revisão para a prova de R+ Clínica Médica da UERJ, com revisão espaçada FSRS-5.">\n' +
    '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" href="icon-192.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n' +
    '<script src="config.js"></script>\n<script src="vendor/supabase.js"></script>\n' + head + '</head>\n<body>\n' + body +
    '\n<script>if(\'serviceWorker\' in navigator&&location.protocol===\'https:\'){addEventListener(\'load\',function(){navigator.serviceWorker.register(\'sw.js\').catch(function(){})})}</script>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(pub, 'index.html'), html);
  // config.js: SUPABASE_URL e SUPABASE_ANON_KEY (variáveis de ambiente da Vercel). Sem elas, o app roda só local.
  const env = k => process.env[k] || process.env['NEXT_PUBLIC_' + k] || process.env['VITE_' + k] || '';
  const url = env('SUPABASE_URL'), key = env('SUPABASE_ANON_KEY');
  fs.writeFileSync(path.join(pub, 'config.js'), '// Gerado no build. Chave anônima (pública) do Supabase; a segurança vem das políticas RLS.\n' +
    'window.CTFC_CLOUD = ' + (url && key ? JSON.stringify({ url, anonKey: key }) : 'null') + ';\n');
  fs.writeFileSync(path.join(pub, 'sw.js'), fs.readFileSync(R('web/sw.js'), 'utf8').replace('__BUILD__', versao));
  for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) fs.copyFileSync(R('web/' + f), path.join(pub, f));
  fs.copyFileSync(R('web/vendor/supabase.js'), path.join(pub, 'vendor', 'supabase.js'));
  console.log('public/ pronto · Supabase ' + (url && key ? 'ATIVO (' + url + ')' : 'desligado (sem SUPABASE_URL/SUPABASE_ANON_KEY → modo local)'));
}
build();
