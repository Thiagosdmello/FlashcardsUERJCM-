// Suíte: cartas de base / revisão rápida / acesso aberto (sem planos).
const { suite, assert, eq, abrir, cadastrar, responderN } = require('./_h');
(async () => {
  const { t, fim } = suite('base e acesso aberto');
  const { browser, page, erros } = await abrir();
  await cadastrar(page, 'Carla Dias', 'carla@ct.com'); // conta comum, sem nada especial
  await t('conta comum tem todas as cartas liberadas', async () => {
    eq(await page.evaluate(() => Object.keys(CARD).every(liberada)), true);
    eq(await page.evaluate(() => montarFila('sub:card-has').length), 16);
  });
  await t('não existe tela, botão ou menção de Premium, planos ou administrador', async () => {
    for (const v of ['home', 'uerj', 'perfil']) {
      await page.evaluate(v => { go(v); }, v);
      const txt = await page.textContent('#main');
      assert(!/Premium|Assinar|administrador|código de acesso|plano grátis/i.test(txt), v + ': ' + txt.slice(0, 80));
      eq(await page.$('.lockb'), null);
    }
    await page.evaluate(() => { go('premium'); });
    assert(await page.$('#box-hoje'), 'rota premium deveria cair no Início');
  });
  await t('fim da sessão mostra "Sessão concluída" (sem anúncio)', async () => {
    await page.evaluate(() => { estudar('sub:card-ic'); });
    await responderN(page, 16, 3);
    // Errei não foi usado → sessão acaba
    assert(await page.isVisible('text=Sessão concluída'), 'sem tela de fim');
  });
  await t('revisão rápida: só base, ordem b1→b6, ignora SRS e teto', async () => {
    await page.evaluate(() => { P.plano.meta = 5; salvarProg(); });
    const f = await page.evaluate(() => filaBase('base:tema:emerg'));
    eq(f.join(), ['pcr', 'choque'].flatMap(s => [1, 2, 3, 4, 5, 6].map(i => 'emerg-' + s + '-b' + i)).join());
    await page.click('#sb [data-nav="uerj"]');
    eq((await page.textContent('.tc[data-deck="card"] [data-alvo="base:tema:card"]')).trim(), '⚡ Revisão rápida · 12 cartas');
    await page.click('.tc[data-deck="emerg"] [data-alvo="base:tema:emerg"]');
    eq(await page.evaluate(() => S.total), 12);
    const antes = await page.evaluate(() => (P.log[hoje()] || {}).rev || 0);
    await responderN(page, 12, 3);
    eq(await page.evaluate(() => P.log[hoje()].rev), antes + 12);
  });
  await t('tema sem cartas de base esconde a Revisão rápida', async () => {
    await page.click('#sb [data-nav="uerj"]');
    eq(await page.$('.tc[data-deck="atu"] [data-alvo^="base:"]'), null);
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close(); fim();
})();
