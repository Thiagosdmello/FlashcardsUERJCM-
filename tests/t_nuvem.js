// Suíte: modo nuvem (Supabase) com um cliente Supabase SIMULADO injetado antes do app carregar.
// Confere cadastro, login, confirmação por e-mail, sincronização nos dois sentidos e modo offline.
const { suite, assert, eq, FILE } = require('./_h');
const { chromium } = require('playwright');

// fake do supabase-js v2 (só o que o app usa); o "banco" fica em window.__db e pode ser pré-carregado
function instalarFake(opts) {
  window.CTFC_CLOUD = { url: 'https://exemplo.supabase.co', anonKey: 'anon-publica' };
  const db = window.__db = { users: opts.users || {}, progresso: opts.progresso || {}, upserts: 0, offline: false, confirmar: !!opts.confirmar, session: null };
  const sess = u => ({ user: u, access_token: 'tok' });
  window.supabase = { createClient: () => ({
    auth: {
      async signUp({ email, password, options }) {
        if (db.users[email]) return { data: {}, error: { message: 'User already registered' } };
        const u = { id: 'uid-' + email, email, created_at: '2026-09-30T10:00:00Z', user_metadata: (options && options.data) || {} };
        db.users[email] = { u, password };
        if (db.confirmar) return { data: { user: u, session: null }, error: null };
        db.session = sess(u); return { data: { user: u, session: db.session }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const r = db.users[email];
        if (!r || r.password !== password) return { data: {}, error: { message: 'Invalid login credentials' } };
        db.session = sess(r.u); return { data: { user: r.u, session: db.session }, error: null };
      },
      async getSession() { return { data: { session: db.session } }; },
      async signOut() { db.session = null; return { error: null }; },
    },
    from(tab) {
      return {
        select() { return { eq(col, v) { return { async maybeSingle() {
          if (db.offline) throw new Error('Failed to fetch');
          const d = db.progresso[v]; return { data: d ? { dados: d, atualizado_em: 'x' } : null, error: null };
        } }; } }; },
        async upsert(row) {
          if (db.offline) return { error: { message: 'Failed to fetch' } };
          db.upserts++; db.progresso[row.user_id] = JSON.parse(JSON.stringify(row.dados)); return { error: null };
        },
      };
    },
  }) };
}
async function abrirNuvem(opts = {}) {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  await page.addInitScript(instalarFake, opts);
  await page.goto(FILE);
  return { browser, page, erros };
}

(async () => {
  const { t, fim } = suite('nuvem supabase');
  let { browser, page, erros } = await abrirNuvem();
  await t('modo nuvem detectado: tela de login fala em nuvem', async () => {
    eq(await page.evaluate(() => !!NUVEM), true);
    await page.click('.ld [data-go="signup"]');
    assert((await page.textContent('#au-nota')).includes('nuvem'), 'nota');
  });
  await t('cadastro na nuvem entra no app com o nome do metadata', async () => {
    await page.fill('#su-nome', 'Thiago Mello'); await page.fill('#su-email', 'T@ct.com'); await page.fill('#su-pass', 'segredo1');
    await page.click('#f-signup button[type=submit]');
    await page.waitForSelector('body.in-app');
    assert((await page.textContent('.pg-h h1')).endsWith('Thiago'), 'saudação');
    eq(await page.evaluate(() => U.id), 'uid-t@ct.com');
    eq(await page.evaluate(() => localStorage.getItem('ctfc:users')), null); // conta não fica no aparelho
  });
  await t('responder cartas envia o progresso para a nuvem (com debounce)', async () => {
    await page.evaluate(() => { estudar('sub:card-ic'); });
    for (let i = 0; i < 3; i++) { await page.click('.btn-show'); await page.click('.gb.g3'); }
    await page.waitForTimeout(1900);
    const r = await page.evaluate(() => [window.__db.upserts, Object.keys(window.__db.progresso['uid-t@ct.com'].cards).length]);
    assert(r[0] >= 1 && r[0] <= 2, 'upserts ' + r[0]); eq(r[1], 3);
  });
  await t('Perfil mostra "Sincronizado"', async () => {
    await page.click('.st-x'); await page.click('#sb [data-nav="perfil"]');
    assert((await page.textContent('[data-k="sync"]')).includes('Sincronizado'), await page.textContent('[data-k="sync"]'));
  });
  await t('sem internet: fica salvo no aparelho e avisa; volta a enviar quando reconecta', async () => {
    await page.evaluate(() => { window.__db.offline = true; P.fav.push('card-ic-b1'); salvarProg(); });
    await page.waitForTimeout(1900);
    await page.evaluate(() => { render(); });
    assert((await page.textContent('[data-k="sync"]')).includes('Sem conexão'), 'aviso offline');
    await page.evaluate(() => { window.__db.offline = false; dispatchEvent(new Event('online')); });
    await page.waitForTimeout(300);
    eq(await page.evaluate(() => window.__db.progresso['uid-t@ct.com'].fav.join()), 'card-ic-b1');
  });
  await t('sair encerra a sessão da nuvem', async () => {
    await page.click('#sb [data-act="sair"]');
    eq(await page.evaluate(() => window.__db.session), null);
    assert(await page.isVisible('#landing'), 'landing');
  });
  await t('senha errada mostra erro em português', async () => {
    await page.click('.ld [data-go="login"]');
    await page.fill('#li-email', 't@ct.com'); await page.fill('#li-pass', 'errada1'); await page.click('#f-login button[type=submit]');
    await page.waitForFunction(() => document.getElementById('li-err').textContent.length > 0);
    eq(await page.textContent('#li-err'), 'E-mail ou senha incorretos.');
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close();

  // outro aparelho: a nuvem tem progresso mais novo → baixa ao entrar
  const remoto = { v: 1, atualizado: 9e12, cards: { 'card-has-b1': { s: 3, d: 5, due: 9e12, reps: 1, lapses: 0, ts: 1 } }, log: { '2026-09-29': { rev: 7, ok: 7, nov: 7 } }, plano: { meta: 25, dias: [1, 2, 3], prova: null, prioridade: [] }, fav: [], listas: [], own: [], trof: {}, genero: null };
  ({ browser, page, erros } = await abrirNuvem({ users: { 'ana@ct.com': { u: { id: 'uid-ana', email: 'ana@ct.com', created_at: '2026-01-01T00:00:00Z', user_metadata: { nome: 'Ana' } }, password: 'segredo1' } }, progresso: { 'uid-ana': remoto } }));
  await t('novo aparelho: baixa o progresso mais recente da nuvem', async () => {
    await page.click('.ld [data-go="login"]');
    await page.fill('#li-email', 'ana@ct.com'); await page.fill('#li-pass', 'segredo1'); await page.click('#f-login button[type=submit]');
    await page.waitForSelector('body.in-app'); await page.waitForTimeout(200);
    eq(await page.evaluate(() => P.plano.meta), 25);
    eq(await page.evaluate(() => revisoesTotais()), 7);
    eq(await page.evaluate(() => localStorage.getItem('ctfc:prog:ana@ct.com') !== null), true);
  });
  await t('reabrir o app com sessão ativa entra direto', async () => {
    const r = await page.evaluate(() => { document.body.classList.remove('in-app'); iniciarNuvem(); return new Promise(res => setTimeout(() => res(document.body.classList.contains('in-app')), 100)); });
    eq(r, true);
  });
  await browser.close();

  // confirmação de e-mail ligada no Supabase
  ({ browser, page, erros } = await abrirNuvem({ confirmar: true }));
  await t('com confirmação de e-mail: avisa para confirmar e não entra', async () => {
    await page.click('.ld [data-go="signup"]');
    await page.fill('#su-nome', 'Bia'); await page.fill('#su-email', 'bia@ct.com'); await page.fill('#su-pass', 'segredo1');
    await page.click('#f-signup button[type=submit]');
    await page.waitForFunction(() => document.getElementById('su-err').textContent.length > 0);
    assert((await page.textContent('#su-err')).includes('link de confirmação'), await page.textContent('#su-err'));
    eq(await page.evaluate(() => document.body.classList.contains('in-app')), false);
  });
  await browser.close();
  fim();
})();
