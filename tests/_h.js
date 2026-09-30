// Utilitários comuns das suítes Playwright.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FILE = 'file://' + path.join(__dirname, '..', 'test', 'test.html');

function suite(nome) {
  const res = { nome, ok: 0, fail: 0, erros: [] };
  const t = async (desc, fn) => {
    try { await fn(); res.ok++; }
    catch (e) { res.fail++; res.erros.push(desc + ' → ' + (e && e.message ? e.message.split('\n')[0] : e)); }
  };
  const fim = () => {
    console.log(`\n[${nome}] ${res.ok} passaram, ${res.fail} falharam`);
    res.erros.forEach(e => console.log('  ✗ ' + e));
    const out = path.join(__dirname, 'results');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, nome.replace(/\W+/g, '_') + '.json'), JSON.stringify(res, null, 1));
    return res;
  };
  return { t, fim, res };
}
function assert(c, msg) { if (!c) throw new Error(msg || 'falhou'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'diferente') + `: esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); }

async function abrir(opts = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 860 }, hasTouch: !!opts.touch, isMobile: !!opts.mobile });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  page.on('dialog', d => { erros.push('DIALOG ' + d.type()); d.dismiss(); });
  if (opts.clock) await page.clock.install({ time: opts.clock });
  await page.goto(FILE);
  return { browser, ctx, page, erros };
}
async function cadastrar(page, nome = 'Thiago Teste', email = 'teste@ct.com', senha = 'segredo1') {
  await page.click('.ld [data-go="signup"]');
  await page.fill('#su-nome', nome); await page.fill('#su-email', email); await page.fill('#su-pass', senha);
  await page.click('#f-signup button[type=submit]');
  await page.waitForSelector('body.in-app');
}
// estuda n cartas da sessão atual com a nota g (clicando pela interface)
async function responderN(page, n, g = 3) {
  for (let i = 0; i < n; i++) {
    if (!(await page.$('.btn-show'))) break;
    await page.click('.btn-show');
    await page.click(`.gb.g${g}`);
  }
}
// Suítes que não testam o freemium rodam com acesso total (conta marcada como admin).
async function liberarTudo(page) { await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('ctfc:adm') || '[]'); a.push(U.email); localStorage.setItem('ctfc:adm', JSON.stringify(a)); render(); }); }
module.exports = { liberarTudo, suite, assert, eq, abrir, cadastrar, responderN, FILE };
