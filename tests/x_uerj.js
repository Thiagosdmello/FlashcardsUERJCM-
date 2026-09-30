// Verificação do conteúdo real UERJ R+ CM no app montado (test.html com src/decks.json).
const { suite, assert, eq, abrir, cadastrar, liberarTudo } = require('./_h');
(async () => {
  const { t, fim } = suite('uerj conteudo real');
  const { browser, page, erros } = await abrir();
  await cadastrar(page, 'Thiago', 'thiago@ct.com'); await liberarTudo(page);
  await t('um tópico só: menu sem Estágio/Residência', async () => {
    const n = await page.$$eval('#sb .nav .navi', e => e.map(x => x.dataset.nav).join(','));
    eq(n, 'home,uerj,meus,plano,stats,perfil');
  });
  await t('todas as cartas têm ano de origem e todos os temas estão no tópico', async () => {
    const r = await page.evaluate(() => [DECKS.every(d => d.trilha === 'uerj'), Object.values(CARD).every(i => Array.isArray(i.c.y) && i.c.y.length)]);
    eq(r.join(), 'true,true');
  });
  await t('ranking: Hematologia 1º (25 tópicos), total 155', async () => {
    await page.click('#sb [data-nav="uerj"]');
    assert((await page.textContent('.fq-r[data-freq]')).includes('Hematologia'), 'ordem');
    assert((await page.textContent('#freq .sec-t')).includes('155 tópicos'), 'total');
    eq(await page.$$eval('.fq-r', e => e.length), 11);
  });
  await t('organização só por tema: um bloco por tema, sem lista de subtemas', async () => {
    eq(await page.evaluate(() => DECKS.every(d => d.subs.length === 1)), true);
    await page.click('.fq-r[data-freq="hem"]');
    eq(await page.$('.subs'), null);
    const ids = await page.evaluate(() => DECK.hem.subs[0].cards.map(c => c.id.split('-').slice(0, 2).join('-')));
    // cartas do mesmo assunto ficam juntas: cada prefixo aparece num trecho contínuo
    const vistos = new Set(); let ok = true; ids.forEach((p, i) => { if (i && p !== ids[i - 1] && vistos.has(p)) ok = false; vistos.add(p); });
    eq(ok, true);
  });
  await t('nenhum ano aparece no app (carta, tema, painel, busca)', async () => {
    await page.click('#sb [data-nav="uerj"]');
    assert(!/20(22|23|24|25|26)|'2[2-6]/.test(await page.textContent('#main')), 'ano na tela do tópico');
    await page.evaluate(() => { estudar('tema:nef'); S.shown = true; render(); });
    assert(!/UERJ 20/.test(await page.textContent('.fl-meta')), 'ano na carta');
    eq(await page.textContent('.fl-meta span'), 'Nefrologia');
    await page.click('.st-x');
  });
  await t('sem cartas de base: botões de Revisão rápida ocultos', async () => {
    await page.click('#sb [data-nav="uerj"]');
    eq(await page.$('[data-alvo^="base:"]'), null);
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close(); fim();
})();
