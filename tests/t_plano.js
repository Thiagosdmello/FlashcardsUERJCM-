// Suíte: plano de estudo, estatísticas gerais, favoritos/listas, Meus flashcards (Fase 2).
const { liberarTudo, suite, assert, eq, abrir, cadastrar, responderN } = require('./_h');

(async () => {
  const { t, fim } = suite('plano stats listas');
  // relógio fixo: quarta-feira 30/09/2026 10:00
  const { browser, page, erros } = await abrir({ clock: new Date(2026, 8, 30, 10, 0) });
  await cadastrar(page); await liberarTudo(page);

  await t('plano padrão: meta 40, todos os dias, sem prova', async () => {
    const p = await page.evaluate(() => P.plano);
    eq(p.meta, 40); eq(p.dias.length, 7); eq(p.prova, null); eq(p.prioridade.length, 0);
  });
  await t('chip de meta 20 muda "Estudar agora"', async () => {
    await page.click('#sb [data-nav="plano"]');
    await page.click('#pl-metas [data-v="20"]');
    await page.click('#sb [data-nav="home"]');
    assert((await page.textContent('#box-hoje')).replace(/\s+/g, ' ').includes('20 novas · meta de 20/dia'), 'meta não aplicada');
  });
  await t('meta "outro" valida 5–500', async () => {
    await page.click('#sb [data-nav="plano"]');
    await page.click('[data-act="plMetaOutro"]');
    await page.fill('#ask-in', '3'); await page.click('.mdl .btn-p');
    assert((await page.textContent('#ask-err')).includes('entre 5 e 500'), 'aceitou 3');
    await page.fill('#ask-in', '37'); await page.click('.mdl .btn-p');
    eq(await page.evaluate(() => P.plano.meta), 37);
    assert((await page.textContent('[data-act="plMetaOutro"]')).includes('37'), 'chip outro sem valor');
  });
  await t('dia de folga: não cobra, mas deixa "Estudar mesmo assim"', async () => {
    await page.click('#pl-dias [data-d="3"]'); // quarta = hoje
    await page.click('#sb [data-nav="home"]');
    const s = await page.textContent('#box-hoje');
    assert(s.includes('folga') && s.includes('Estudar mesmo assim'), s);
    await page.click('#box-hoje [data-alvo="hoje"]');
    assert(await page.isVisible('.flash'), 'não abriu sessão');
    await page.click('.st-x');
    await page.click('#sb [data-nav="plano"]');
    await page.click('#pl-dias [data-d="3"]');
  });
  await t('não deixa ficar sem dia de estudo', async () => {
    await page.evaluate(() => { P.plano.dias = [2]; salvarProg(); render(); });
    await page.click('#pl-dias [data-d="2"]');
    eq(await page.evaluate(() => P.plano.dias.length), 1);
    await page.evaluate(() => { P.plano.dias = [0, 1, 2, 3, 4, 5, 6]; salvarProg(); render(); });
  });
  await t('fatorNovas = 0,6 com menos de 60 revisões', async () => { eq(await page.evaluate(() => fatorNovas()), 0.6); });
  await t('fatorNovas = nov/rev dos últimos 14 dias quando ≥ 60', async () => {
    const f = await page.evaluate(() => {
      const bak = JSON.stringify(P.log);
      P.log = {}; P.log[addDias(hoje(), -2)] = { rev: 50, ok: 40, nov: 10 }; P.log[addDias(hoje(), -5)] = { rev: 30, ok: 20, nov: 20 }; P.log[addDias(hoje(), -20)] = { rev: 500, ok: 1, nov: 500 };
      const r = fatorNovas(); P.log = JSON.parse(bak); return r;
    });
    eq(f, 30 / 80);
  });
  await t('previsão de término e diagnóstico com data de prova', async () => {
    await page.evaluate(() => { P.plano.meta = 10; salvarProg(); render(); });
    // 90 novas acessíveis (estágio: 32+32+10+2 = 76 + ... ) → conferir pelo próprio número da tela
    await page.fill('#pl-prova', '2026-10-03'); await page.dispatchEvent('#pl-prova', 'change');
    const restam = +(await page.textContent('[data-k="restam"]')).replace(/\D/g, '');
    eq(restam, 108); // acesso total (admin)
    // 10 × 0,6 = 6 novas/dia → 18 dias (hoje conta) → termina 17/10/2026
    eq(await page.textContent('[data-k="fim"]'), '17/10/2026');
    const d = await page.textContent('[data-k="diag"]');
    assert(d.includes('não termina') && d.includes('60/dia'), d); // 108 / 3 dias / 0,6 = 60 (sem erro de ponto flutuante)
    await page.fill('#pl-prova', '2026-12-20'); await page.dispatchEvent('#pl-prova', 'change');
    assert((await page.textContent('[data-k="diag"]')).includes('No ritmo'), 'diagnóstico positivo');
  });
  await t('cronograma dos próximos 7 dias', async () => {
    const rows = await page.$$eval('#pl-crono tbody tr', r => r.map(x => x.textContent));
    eq(rows.length, 7); assert(rows[0].startsWith('Hoje'), rows[0]);
  });
  await t('ordem de estudo: prioridade manual ↑ ↓ ✕ e select agrupado por tema', async () => {
    await page.click('[data-nav="ordem"]');
    const grupos = await page.$$eval('#prio-add optgroup', g => g.map(x => x.label));
    assert(grupos.includes('Cardiologia') && grupos.includes('Emergência'), grupos.join());
    await page.selectOption('#prio-add', 'emerg-choque'); await page.click('[data-act="prAdd"]');
    await page.selectOption('#prio-add', 'card-has'); await page.click('[data-act="prAdd"]');
    eq((await page.evaluate(() => P.plano.prioridade)).join(), 'emerg-choque,card-has');
    await page.click('[data-act="prUp"][data-id="card-has"]');
    eq((await page.evaluate(() => P.plano.prioridade)).join(), 'card-has,emerg-choque');
    const primeiro = await page.textContent('#ordem-final .li:first-child');
    assert(primeiro.includes('📌') && primeiro.includes('Hipertensão'), primeiro);
    await page.click('[data-act="prDel"][data-id="emerg-choque"]');
    eq((await page.evaluate(() => P.plano.prioridade)).join(), 'card-has');
  });
  await t('ordem das novas: prioridade → peso desc → didática', async () => {
    const ids = await page.evaluate(() => ordenarNovas(idsDe('hoje')).slice(0, 18));
    eq(ids[0], 'card-has-b1'); eq(ids[15], 'card-has-10');
    eq(ids[16], 'card-ic-b1'); // peso 5, primeiro tema
    const w = await page.evaluate(() => { const o = ordenarNovas(idsDe('hoje')); return [o.indexOf('emerg-pcr-b1'), o.indexOf('emerg-choque-b1'), o.indexOf('atu-card-1'), o.indexOf('derm-psor-b1')]; });
    assert(w[0] < w[1] && w[1] < w[2] && w[2] < w[3], w.join());
  });
  await t('"Estudar agora" segue a ordem do plano', async () => {
    await page.evaluate(() => { P.plano.meta = 40; salvarProg(); });
    await page.click('#sb [data-nav="home"]'); await page.click('#box-hoje [data-alvo="hoje"]');
    eq(await page.getAttribute('.flash', 'data-card'), 'card-has-b1');
  });
  await t('favoritar na carta e ver no Perfil', async () => {
    await page.click('.fl-acts [data-act="fav"]');
    eq((await page.evaluate(() => P.fav)).join(), 'card-has-b1');
    await page.click('.st-x');
    await page.click('#sb [data-nav="perfil"]');
    assert((await page.textContent('[data-lista="fav"]')).includes('1 carta'), 'favoritos no perfil');
  });
  await t('listas: criar pela carta, limite de 10', async () => {
    await page.click('#sb [data-nav="uerj"]'); await page.click('.tc[data-deck="emerg"] [data-alvo="tema:emerg"]');
    await page.click('.fl-acts [data-act="addlista"]');
    await page.fill('#lt-nome', 'Revisar <b>PCR</b>'); await page.click('[data-act="ltCriar"]');
    const l = await page.evaluate(() => P.listas);
    eq(l.length, 1); eq(l[0].cards[0], 'emerg-pcr-b1');
    await page.click('[data-act="ltToggle"]'); eq(await page.evaluate(() => P.listas[0].cards.length), 0);
    await page.click('[data-act="ltToggle"]'); eq(await page.evaluate(() => P.listas[0].cards.length), 1);
    await page.click('.mdl [data-act="fecharModal"]');
    await page.evaluate(() => { for (let i = 0; i < 12; i++) if (P.listas.length < MAX_LISTAS) P.listas.push({ id: 'l' + i, nome: 'L' + i, cards: [] }); salvarProg(); });
    await page.click('.st-x'); await page.click('#sb [data-nav="perfil"]');
    assert(await page.isDisabled('[data-act="novaLista"]'), 'botão não travou no limite');
    const html = await page.innerHTML('#p-favs');
    assert(html.includes('Revisar &lt;b&gt;PCR&lt;/b&gt;'), 'nome da lista não escapado');
  });
  await t('estudar lista pelo Perfil', async () => {
    await page.click('[data-lista="' + (await page.evaluate(() => P.listas[0].id)) + '"] [data-act="study"]');
    eq(await page.evaluate(() => S.total), 1); await page.click('.st-x');
  });
  await t('Meus flashcards: criar baralho, carta com HTML é escapada (XSS)', async () => {
    await page.click('#sb [data-nav="meus"]');
    await page.click('[data-act="ownNovo"]'); await page.fill('#ask-in', 'Doses'); await page.click('.mdl .btn-p');
    await page.fill('#own-f', '<img src=x onerror="window.__xss=1">Dose de <b>adrenalina</b>?');
    await page.fill('#own-v', '1 mg\n<script>window.__xss=2</script>');
    await page.click('#own-form button[type=submit]');
    const o = await page.evaluate(() => P.own[0].cards[0]); eq(o.own, true);
    await page.click('[data-alvo^="own:"]');
    await page.click('.btn-show');
    eq(await page.evaluate(() => window.__xss), undefined);
    assert(!(await page.$('.flash img')) && !(await page.$('.flash b')), 'HTML renderizado');
    assert((await page.textContent('.fl-front')).includes('<b>adrenalina</b>'), 'texto sumiu');
    await page.click('.gb.g3');
  });
  await t('Meus flashcards: limite de 30 baralhos', async () => {
    await page.click('#sb [data-nav="meus"]');
    await page.evaluate(() => { while (P.own.length < 30) P.own.push({ id: 'ob' + P.own.length, nome: 'B' + P.own.length, cards: [] }); salvarProg(); render(); });
    assert(await page.isDisabled('[data-act="ownNovo"]'), 'não travou em 30');
  });
  await t('excluir carta própria limpa progresso e favoritos', async () => {
    const id = await page.evaluate(() => { const id = P.own[0].cards[0].id; P.fav.push(id); salvarProg(); go('meus', P.own[0].id); return id; });
    await page.click('[data-act="ownCardDel"]');
    const r = await page.evaluate(i => [!!P.cards[i], P.fav.includes(i)], id); eq(r.join(), 'false,false');
  });
  await t('estatísticas gerais: KPIs, gráfico de 7 dias, domínio por tema', async () => {
    await page.click('#sb [data-nav="stats"]');
    const rev = await page.evaluate(() => revisoesTotais());
    eq(+(await page.textContent('[data-k="rev"]')).replace(/\D/g, ''), rev);
    eq(await page.$$eval('.chart rect', r => r.length), 7);
    eq(await page.textContent('.chart text[data-dia="' + (await page.evaluate(() => hoje())) + '"]'), String(rev));
    assert(await page.$('#st-dom [data-deck="card"]'), 'sem domínio');
  });
  await t('zerar progresso preserva plano, troféus, gênero e listas', async () => {
    await page.evaluate(() => { P.trof = { 3: '2026-09-01' }; P.genero = 'f'; salvarProg(); });
    await page.click('#sb [data-nav="perfil"]'); await page.click('[data-act="zerar"]'); await page.click('.mdl .btn-d');
    const p = await page.evaluate(() => P);
    eq(Object.keys(p.cards).length, 0); eq(Object.keys(p.log).length, 0);
    eq(p.plano.meta, 40); eq(p.trof[3], '2026-09-01'); eq(p.genero, 'f'); assert(p.listas.length === 10, 'listas');
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close();
  fim();
})();
