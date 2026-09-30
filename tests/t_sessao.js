// Suíte: desfazer ("Cartão anterior"), estatística da sessão, revisão rápida, atalhos configuráveis.
const { liberarTudo, suite, assert, eq, abrir, cadastrar, responderN } = require('./_h');

(async () => {
  const { t, fim } = suite('desfazer sessao atalhos');
  const { browser, page, erros } = await abrir({ clock: new Date(2026, 8, 30, 10) });
  await cadastrar(page); await liberarTudo(page);
  const est = () => page.evaluate(() => ({ fila: S.fila.slice(), n: S.n, g: S.g.slice(), log: P.log[hoje()] ? JSON.parse(JSON.stringify(P.log[hoje()])) : null, cards: JSON.parse(JSON.stringify(P.cards)) }));

  await t('"Cartão anterior" começa desabilitado e tem classe própria (.st-undo ≠ .st-x)', async () => {
    await page.evaluate(() => estudar('sub:card-ic'));
    assert(await page.isDisabled('.st-undo'), 'habilitado sem resposta');
    eq(await page.$$eval('.st-undo', e => e.length), 1); eq(await page.$$eval('.st-x', e => e.length), 1);
    assert(!(await page.getAttribute('.st-undo', 'class')).includes('st-x'), 'classe compartilhada');
  });
  await t('desfaz a última resposta: fila, estado da carta e log do dia voltam iguais', async () => {
    await responderN(page, 2, 3);
    const antes = await est(); const id = antes.fila[0];
    await page.click('.btn-show'); await page.click('.gb.g4');
    await page.click('.st-undo');
    const dep = await est();
    eq(JSON.stringify(dep), JSON.stringify(antes));
    eq(await page.getAttribute('.flash', 'data-card'), id);
    assert(await page.isVisible('.fl-back'), 'deveria voltar com a resposta aberta');
  });
  await t('só um nível: depois de desfazer, o botão desabilita', async () => { assert(await page.isDisabled('.st-undo'), 'segue habilitado'); });
  await t('desfazer um "Errei" tira a carta reinserida da fila', async () => {
    await page.click('.gb.g3'); // responde a carta reaberta
    const antes = await est();
    await page.click('.btn-show'); await page.click('.gb.g1');
    await page.click('.st-undo');
    eq(JSON.stringify((await est()).fila), JSON.stringify(antes.fila));
  });
  await t('desfazer carta já revisada restaura s/d/due/reps anteriores', async () => {
    await page.evaluate(() => { const id = 'card-ic-b1'; P.cards[id] = { s: 5, d: 6, due: Date.now() - 1000, reps: 2, lapses: 0, ts: Date.now() - 5 * 864e5 }; S.fila.unshift(id); S.shown = false; render(); });
    const antes = await page.evaluate(() => JSON.stringify(P.cards['card-ic-b1']));
    await page.click('.btn-show'); await page.click('.gb.g2');
    assert((await page.evaluate(() => JSON.stringify(P.cards['card-ic-b1']))) !== antes, 'não mudou');
    await page.click('.st-undo');
    eq(await page.evaluate(() => JSON.stringify(P.cards['card-ic-b1'])), antes);
  });
  await t('desfazer também funciona na tela de fim de sessão', async () => {
    await page.click('.gb.g3');
    const resto = await page.evaluate(() => S.fila.length);
    await responderN(page, resto, 3);
    assert(await page.isVisible('text=Sessão concluída'), 'não concluiu');
    const n = await page.evaluate(() => S.n);
    await page.click('.st-undo');
    assert(await page.isVisible('.flash'), 'não voltou para a carta');
    eq(await page.evaluate(() => S.n), n - 1);
    await page.click('.gb.g3');
  });
  await t('estatísticas DA SESSÃO: revisadas, % de acerto, tempo e distribuição', async () => {
    await page.evaluate(() => { estudar('sub:emerg-choque'); });
    const notas = [3, 1, 4, 2, 3, 3];
    for (const g of notas) { await page.click('.btn-show'); await page.clock.fastForward(10000); await page.click('.gb.g' + g); }
    await page.click('.st-x');
    await page.click('[data-act="verSessao"]');
    eq(await page.textContent('[data-k="rev"]'), '6');
    eq(await page.textContent('[data-k="pct"]'), '83%'); // 5 de 6
    assert(/^1 min 0[0-2] s$/.test(await page.textContent('[data-k="tempo"]')), 'tempo'); // 6 × 10 s simulados + tempo real dos cliques
    eq(await page.$$eval('.dist [data-g]', e => e.map(x => x.textContent).join(',')), '1,1,3,1');
    await page.click('text=Estatísticas gerais');
    assert(await page.$('#st-kpi'), 'botão não abriu as gerais');
  });
  await t('revisão rápida: só base, ordem b1→b6, ignora SRS e teto, mas conta no progresso', async () => {
    await page.evaluate(() => { P.plano.meta = 5; salvarProg(); });
    const f = await page.evaluate(() => filaBase('base:tema:emerg'));
    eq(f.join(), ['pcr', 'choque'].flatMap(s => [1, 2, 3, 4, 5, 6].map(i => 'emerg-' + s + '-b' + i)).join());
    const logAntes = await page.evaluate(() => P.log[hoje()].rev);
    await page.click('#sb [data-nav="home"]');
    await page.click('.tc[data-deck="emerg"] [data-alvo="base:tema:emerg"]');
    eq(await page.evaluate(() => S.total), 12);
    await responderN(page, 12, 3);
    eq(await page.evaluate(() => P.log[hoje()].rev), logAntes + 12);
    assert(await page.evaluate(() => P.cards['emerg-choque-b6'].reps >= 1), 'não agendou');
  });
  await t('revisão rápida: botão mostra a contagem de base', async () => {
    await page.click('#sb [data-nav="home"]');
    eq((await page.textContent('.tc[data-deck="card"] [data-alvo="base:tema:card"]')).trim(), '⚡ Revisão rápida · 12 cartas');
  });

  // ---- atalhos configuráveis ----
  await t('Perfil: capturar nova tecla para "Mostrar resposta"', async () => {
    await page.click('#sb [data-nav="perfil"]');
    await page.click('[data-act="kbCap"][data-a="show"]');
    assert((await page.textContent('[data-a="show"]')).includes('Aperte'), 'sem estado de captura');
    await page.keyboard.press('j');
    eq(await page.textContent('[data-a="show"]'), 'J');
    eq(await page.evaluate(() => JSON.parse(localStorage.getItem('ctfc:keys')).show), 'j');
  });
  await t('Esc cancela a captura', async () => {
    await page.click('[data-act="kbCap"][data-a="g1"]'); await page.keyboard.press('Escape');
    eq(await page.textContent('[data-a="g1"]'), '1');
  });
  await t('tecla duplicada é recusada', async () => {
    await page.click('[data-act="kbCap"][data-a="g1"]'); await page.keyboard.press('2');
    assert((await page.textContent('.toast')).includes('já é usada'), 'sem aviso');
    assert((await page.textContent('[data-a="g1"]')).includes('Aperte'), 'saiu da captura');
    await page.keyboard.press('q'); eq(await page.textContent('[data-a="g1"]'), 'Q');
  });
  await t('novas teclas funcionam no estudo; as antigas não', async () => {
    await page.evaluate(() => estudar('sub:card-has'));
    await page.keyboard.press(' '); assert(!(await page.isVisible('.fl-back')), 'Espaço ainda mostra');
    await page.keyboard.press('j'); assert(await page.isVisible('.fl-back'), 'J não mostrou');
    const n = await page.evaluate(() => S.n);
    await page.keyboard.press('1'); eq(await page.evaluate(() => S.n), n, '1 ainda dá nota');
    await page.keyboard.press('q'); eq(await page.evaluate(() => S.g[0]), 1, 'Q não deu Errei');
  });
  await t('atalhos desativados em campo de texto', async () => {
    await page.evaluate(() => { const i = document.createElement('input'); i.id = 'tmp-in'; document.body.appendChild(i); });
    await page.focus('#tmp-in'); await page.keyboard.press('j');
    assert(!(await page.isVisible('.fl-back')), 'mostrou digitando');
    await page.evaluate(() => document.getElementById('tmp-in').remove());
    await page.click('.st-x');
  });
  await t('"Restaurar padrão" pede confirmação', async () => {
    await page.click('#sb [data-nav="perfil"]'); await page.click('[data-act="kbReset"]');
    assert(await page.$('.mdl'), 'sem confirmação');
    await page.click('.mdl .btn-o'); eq(await page.textContent('[data-a="show"]'), 'J');
    await page.click('[data-act="kbReset"]'); await page.click('.mdl .btn-p');
    eq(await page.textContent('[data-a="show"]'), 'Espaço'); eq(await page.evaluate(() => localStorage.getItem('ctfc:keys')), null);
  });
  await t('atalhos salvos no aparelho (valem para outra conta no mesmo navegador)', async () => {
    await page.evaluate(() => localStorage.setItem('ctfc:keys', JSON.stringify({ show: 'k' })));
    await page.click('#sb [data-act="sair"]');
    await cadastrar(page, 'Outra Pessoa', 'outra@ct.com');
    await page.click('#sb [data-nav="perfil"]');
    eq(await page.textContent('[data-a="show"]'), 'K');
    await page.evaluate(() => localStorage.removeItem('ctfc:keys'));
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close();

  const m = await abrir({ viewport: { width: 390, height: 800 }, touch: true, mobile: true });
  await cadastrar(m.page);
  await t('atalhos ocultos no celular', async () => {
    await m.page.click('#bn [data-nav="perfil"]');
    assert(!(await m.page.isVisible('#p-atalhos')), 'seção visível no celular');
  });
  await m.browser.close();
  fim();
})();
