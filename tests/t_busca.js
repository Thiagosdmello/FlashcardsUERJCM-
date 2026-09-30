// Suíte: busca, sessão de tema (sem teto do plano) e prioridade.
const { liberarTudo, suite, assert, eq, abrir, cadastrar, responderN } = require('./_h');

(async () => {
  const { t, fim } = suite('busca tema prioridade');
  const { browser, page, erros } = await abrir();
  await cadastrar(page, 'Livre', 'livre@ct.com'); // conta grátis
  const digitar = async (sel, txt) => { await page.fill(sel, ''); await page.type(sel, txt, { delay: 5 }); await page.waitForTimeout(260); };
  const unico = async termo => page.evaluate(q => { const n = norm(q); return DECKS.flatMap(d => d.subs.flatMap(s => s.cards)).filter(c => norm(semTags(c.f) + ' ' + semTags(c.v)).includes(n)).length; }, termo);

  await t('menos de 2 letras não busca', async () => {
    await digitar('#busca-home', 'c');
    assert((await page.textContent('#sres-home')).includes('pelo menos 2'), 'buscou');
  });
  await t('sem acento e sem maiúsculas acha o subtema', async () => {
    await digitar('#busca-home', 'INSUFICIENCIA');
    const t1 = await page.textContent('#sres-home [data-hit-sub="card-ic"]');
    assert(t1.includes('Insuficiência cardíaca'), t1);
    assert(await page.$('#sres-home [data-hit-sub="card-ic"] mark'), 'sem destaque');
  });
  await t('o campo não perde o foco nem é recriado ao atualizar resultados (debounce)', async () => {
    await page.evaluate(() => { document.getElementById('busca-home').__marca = 1; });
    await page.focus('#busca-home'); await page.keyboard.type(' card', { delay: 20 });
    await page.waitForTimeout(260);
    eq(await page.evaluate(() => document.activeElement.id), 'busca-home');
    eq(await page.evaluate(() => document.getElementById('busca-home').__marca), 1);
    eq(await page.inputValue('#busca-home'), 'INSUFICIENCIA card');
  });
  await t('debounce de 150 ms: não atualiza a cada tecla', async () => {
    await page.fill('#busca-home', '');
    await page.evaluate(() => { window.__muda = 0; new MutationObserver(() => window.__muda++).observe(document.getElementById('sres-home'), { childList: true }); });
    await page.type('#busca-home', 'hipertensao', { delay: 20 });
    await page.waitForTimeout(260);
    eq(await page.evaluate(() => window.__muda), 1);
  });
  await t('carta liberada aparece com texto; termo único', async () => {
    eq(await unico('cardicb2'), 1);
    await digitar('#busca-home', 'cardicb2');
    const h = await page.$$eval('#sres-home [data-hit-card]', e => e.map(x => x.dataset.hitCard));
    eq(h.join(), 'card-ic-b2');
    assert((await page.textContent('#sres-home')).includes('carta de base 2'), 'sem texto');
  });
  await t('busca no verso também (e só verso de carta liberada aparece)', async () => {
    eq(await unico('emergpcrb3'), 1);
    await digitar('#busca-home', 'emergpcrb3');
    assert((await page.textContent('#sres-home')).includes('no verso'), 'sem indicação do verso');
  });
  await t('limites: até 12 subtemas e 20 cartas', async () => {
    await digitar('#busca-home', 'teste');
    eq(await page.$$eval('#sres-home [data-hit-card]', e => e.length), 20);
    const subs = await page.evaluate(() => buscar('a', 'home'));
    eq(subs, null);
    const n = await page.evaluate(() => { const r = buscar('ca', 'home'); return r.subs.length <= 12 && r.cards.length <= 20; });
    assert(n, 'estourou limite');
  });
  await t('"Ver carta" abre só aquela carta', async () => {
    await digitar('#busca-home', 'cardicb2');
    await page.click('[data-hit-card="card-ic-b2"] [data-act="study"]');
    eq(await page.getAttribute('.flash', 'data-card'), 'card-ic-b2'); eq(await page.evaluate(() => S.total), 1);
    await page.click('.st-x');
  });
  await t('busca no UERJ R+ CM: todos os resultados liberados, sem cadeado e sem ano', async () => {
    await page.click('#sb [data-nav="uerj"]');
    await digitar('#busca-uerj', 'trauma');
    assert(await page.$('#sres-uerj [data-hit-sub="cir-trauma"]'), 'não achou');
    const txt = await page.textContent('#sres-uerj');
    assert(!/⭐|🔒|UERJ 20/.test(txt), txt);
  });
  await t('texto buscado é escapado (sem HTML injetado)', async () => {
    await page.click('#sb [data-nav="home"]');
    await digitar('#busca-home', '<img src=x onerror=window.__x=1>');
    eq(await page.evaluate(() => window.__x), undefined);
  });
  // sessão de tema não usa o teto do plano (bug real)
  await t('sessão de tema com meta 10 e meta já cumprida: todas as vencidas + até 60 novas', async () => {
    await page.evaluate(() => { P.plano.meta = 10; P.log[hoje()] = { rev: 50, ok: 50, nov: 0 }; salvarProg(); });
    eq(await page.evaluate(() => montarFila('hoje').length), 0);
    const n = await page.evaluate(() => montarFila('tema:card').length); eq(n, 32);
    const r = await page.evaluate(() => { const ids = DECK.card.subs[0].cards.slice(0, 3).map(c => c.id); ids.forEach(id => P.cards[id] = { s: 1, d: 5, due: Date.now() - 1, reps: 1, lapses: 0, ts: Date.now() - 864e5 }); const f = montarFila('tema:card'); return [f.length, f.slice(0, 3).join()]; });
    eq(r[0], 32); eq(r[1], 'card-ic-b1,card-ic-b2,card-ic-b3');
    eq(await page.evaluate(() => NOVAS_POR_ALVO), 60);
  });
  await t('prioridade manual muda a ordem das novas em "Estudar agora"', async () => {
    await page.evaluate(() => { P.cards = {}; P.log = {}; P.plano.meta = 40; P.plano.prioridade = ['cir-trauma']; salvarProg(); });
    eq(await page.evaluate(() => montarFila('hoje')[0]), 'cir-trauma-b1');
    await page.evaluate(() => { P.plano.prioridade = []; salvarProg(); });
    eq(await page.evaluate(() => montarFila('hoje')[0]), 'card-ic-b1');
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close();
  fim();
})();
