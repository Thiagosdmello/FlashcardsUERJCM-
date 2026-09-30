// Suíte: app geral (landing, conta, navegação, tema, estudo básico).
const { liberarTudo, suite, assert, eq, abrir, cadastrar, responderN } = require('./_h');
const fs = require('fs');
const path = require('path');

(async () => {
  const { t, fim } = suite('app geral');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'logic.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'flashcards-ct.html'), 'utf8');

  await t('sem alert/confirm/prompt no código', () => { assert(!/\b(alert|confirm|prompt)\s*\(/.test(src), 'achei chamada proibida'); });
  await t('ordem do arquivo: shell → decks-data → app-code', () => {
    const a = html.indexOf('id="landing"'), b = html.indexOf('id="decks-data"'), c = html.indexOf('id="app-code"');
    assert(a > 0 && a < b && b < c, 'ordem errada');
  });
  await t('script de tema no topo, antes do <style>', () => { assert(html.indexOf("ctfc:theme") < html.indexOf('<style>'), 'script depois do style'); });

  const { browser, page, erros } = await abrir();
  await t('landing visível antes do login com estatísticas arredondadas', async () => {
    assert(await page.isVisible('#landing'), 'landing oculta');
    const s = await page.textContent('#ld-stats');
    assert(/\+100\s*flashcards/.test(s), 'stats: ' + s);
  });
  await t('tema escuro é o padrão', async () => { eq(await page.getAttribute('html', 'data-theme'), 'dark'); });
  await t('cadastro valida e-mail', async () => {
    await page.click('.ld [data-go="signup"]');
    await page.fill('#su-nome', 'Ana'); await page.fill('#su-email', 'ruim'); await page.fill('#su-pass', '123456');
    await page.evaluate(() => { document.getElementById('su-email').type = 'text'; });
    await page.click('#f-signup button[type=submit]');
    assert((await page.textContent('#su-err')).includes('E-mail'), 'sem erro');
    await page.click('#auth [data-go="landing"]');
  });
  await t('cadastro entra no app com saudação', async () => {
    await cadastrar(page); await liberarTudo(page);
    const h = await page.textContent('.pg-h h1');
    assert(/^(Bom dia|Boa tarde|Boa noite), Thiago$/.test(h), h);
  });
  await t('senha salva só como hash SHA-256', async () => {
    const u = await page.evaluate(() => localStorage.getItem('ctfc:users'));
    assert(!u.includes('segredo1') && /"h":"[0-9a-f]{64}"/.test(u), u);
  });
  await t('"Estudar agora" mostra revisar/novas/meta', async () => {
    const s = await page.textContent('#box-hoje');
    assert(/0 para revisar · 40 novas · meta de 40\/dia \(0 feitas\)/.test(s.replace(/\s+/g, ' ')), s);
  });
  await t('menu tem as 7 entradas', async () => {
    const itens = await page.$$eval('#sb .nav .navi', els => els.map(e => e.children[1].textContent.trim()));
    eq(itens.join('|'), 'Início|UERJ R+ CM|Meus flashcards|Meu plano|Estatísticas|Perfil');
  });
  await t('navega para UERJ R+ CM → tema → subtemas', async () => {
    await page.click('#sb [data-nav="uerj"]');
    await page.click('.tc[data-deck="card"] .tc-h');
    const n = await page.$$eval('.sr', els => els.length); eq(n, 2);
    assert(await page.isVisible('.sr[data-sub="card-ic"] [data-alvo="base:sub:card-ic"]'), 'sem ⚡ Base');
  });
  await t('Atualizações não mostra Revisão rápida (0 cartas de base)', async () => {
    await page.click('#sb [data-nav="uerj"]');
    assert(!(await page.$('.tc[data-deck="atu"] [data-alvo^="base:"]')), 'botão de base apareceu');
    assert(await page.$('.tc[data-deck="card"] [data-alvo="base:tema:card"]'), 'card sem base');
  });
  await t('switch da barra lateral troca o tema e persiste', async () => {
    await page.click('#sb [data-tema-tgl]');
    eq(await page.getAttribute('html', 'data-theme'), 'light');
    eq(await page.evaluate(() => localStorage.getItem('ctfc:theme')), 'light');
    await page.reload();
    eq(await page.getAttribute('html', 'data-theme'), 'light');
    await page.click('#sb [data-nav="perfil"]');
    assert(await page.$('[data-tema-set="light"].on'), 'botão do perfil não sincronizado');
    await page.click('[data-tema-set="dark"]');
    eq(await page.getAttribute('#sb [data-tema-tgl]', 'aria-checked'), 'true');
  });
  await t('tema aplicado antes da primeira pintura', async () => {
    await page.evaluate(() => localStorage.setItem('ctfc:theme', 'light'));
    await page.route('**/*', r => r.continue());
    const p2 = await page.context().newPage();
    // registra o tema no instante em que o primeiro <style> entra no DOM (antes de qualquer pintura estilizada)
    await p2.addInitScript(() => {
      new MutationObserver((ms, ob) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeName === 'STYLE' && !window.__t) { window.__t = document.documentElement.getAttribute('data-theme') || 'nenhum'; ob.disconnect(); } })
        .observe(document, { childList: true, subtree: true });
    });
    await p2.goto(page.url());
    eq(await p2.evaluate(() => window.__t), 'light');
    await p2.close();
    await page.evaluate(() => localStorage.setItem('ctfc:theme', 'dark'));
  });
  await t('sessão de subtema: frente → resposta → 4 notas', async () => {
    await page.reload();
    await page.click('#sb [data-nav="uerj"]');
    await page.click('.tc[data-deck="card"] .tc-h');
    await page.click('[data-alvo="sub:card-ic"]');
    assert(await page.isVisible('.flash .fl-front'), 'sem frente');
    assert(!(await page.isVisible('.fl-back')), 'verso visível cedo');
    await page.click('.btn-show');
    assert(await page.isVisible('.fl-back'), 'verso não abriu');
    eq(await page.$$eval('.gb', b => b.length), 4);
    const txt = await page.$$eval('.gb', b => b.map(x => x.childNodes[0].textContent).join('|'));
    eq(txt, 'Errei|Difícil|Bom|Fácil');
  });
  await t('primeira carta é b1 (ordem didática)', async () => { eq(await page.getAttribute('.flash', 'data-card'), 'card-ic-b1'); });
  await t('Bom agenda carta nova para 3 dias (FSRS-5)', async () => {
    await page.click('.gb.g3');
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('ctfc:prog:teste@ct.com')).cards['card-ic-b1']);
    eq(st.s, 3.173); eq(st.reps, 1);
    eq(Math.round((st.due - st.ts) / 864e5), 3);
  });
  await t('Errei faz a carta voltar na mesma sessão', async () => {
    const id = await page.getAttribute('.flash', 'data-card');
    await page.click('.btn-show'); await page.click('.gb.g1');
    const fila = await page.evaluate(() => S.fila.slice(0, 5));
    assert(fila.includes(id) && fila[0] !== id, JSON.stringify(fila));
    const st = await page.evaluate(i => P.cards[i], id);
    assert(st.due - st.ts <= 60000, 'due > 1 min');
  });
  await t('sessão de subtema traz todas as 16 cartas (não usa teto do plano)', async () => {
    const tot = await page.evaluate(() => S.total); eq(tot, 16);
  });
  await t('verso com tabela ganha rolagem própria', async () => {
    await page.evaluate(() => { S.fila.unshift('card-ic-3'); S.shown = true; render(); });
    assert(await page.$('.vs .tbl > table'), 'tabela sem .tbl');
    await page.evaluate(() => { S.fila.shift(); S.shown = false; render(); });
  });
  await t('Encerrar leva ao fim da sessão e às estatísticas da sessão', async () => {
    await page.click('.st-x');
    assert(await page.isVisible('text=Sessão concluída'), 'sem tela de fim');
    await page.click('[data-act="verSessao"]');
    eq(await page.textContent('#sess-kpi [data-k="rev"]'), '2');
    eq(await page.textContent('[data-g="1"]'), '1');
  });
  await t('log do dia registra rev/ok/nov', async () => {
    const l = await page.evaluate(() => P.log[hoje()]);
    eq(l.rev, 2); eq(l.ok, 1); eq(l.nov, 2);
  });
  await t('"Estudar agora" respeita a meta e conta feitas', async () => {
    await page.click('#sb [data-nav="home"]');
    const s = (await page.textContent('#box-hoje')).replace(/\s+/g, ' ');
    assert(/meta de 40\/dia \(2 feitas\)/.test(s), s);
    await page.click('[data-alvo="hoje"]');
    const tot = await page.evaluate(() => S.total); eq(tot, 38);
    await page.click('.st-x');
  });
  await t('sair e entrar de novo mantém progresso', async () => {
    await page.click('#sb [data-act="sair"]');
    assert(await page.isVisible('#landing'), 'sem landing');
    await page.click('.ld [data-go="login"]');
    await page.fill('#li-email', 'teste@ct.com'); await page.fill('#li-pass', 'errada1');
    await page.click('#f-login button[type=submit]');
    assert((await page.textContent('#li-err')).includes('incorretos'), 'aceitou senha errada');
    await page.fill('#li-pass', 'segredo1'); await page.click('#f-login button[type=submit]');
    await page.waitForSelector('body.in-app');
    eq(await page.evaluate(() => P.log[hoje()].rev), 2);
  });
  await t('sem erros de script nem diálogos nativos', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close();

  // celular
  const m = await abrir({ viewport: { width: 360, height: 740 }, touch: true, mobile: true });
  await t('celular: barra inferior visível e sem rolagem horizontal', async () => {
    await cadastrar(m.page, 'Maria', 'm@ct.com'); await liberarTudo(m.page);
    assert(await m.page.isVisible('#bn'), 'sem barra inferior');
    assert(!(await m.page.isVisible('#sb')), 'barra lateral visível');
    const ov = await m.page.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert(ov <= 0, 'overflow ' + ov);
  });
  await t('celular: botões de nota ≥ 44px', async () => {
    await m.page.click('#bn [data-nav="uerj"]');
    await m.page.click('.tc[data-deck="emerg"] [data-alvo="tema:emerg"]');
    await m.page.click('.btn-show');
    const hs = await m.page.$$eval('.gb', b => b.map(x => x.getBoundingClientRect().height));
    assert(hs.every(h => h >= 44), hs.join(','));
    assert(!(await m.page.isVisible('.gb kbd')), 'atalho visível no celular');
  });
  await m.browser.close();
  fim();
})();
