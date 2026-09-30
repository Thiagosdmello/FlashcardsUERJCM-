// Suíte: FSRS-5 (comparado com ts-fsrs 4.7.1, referência independente do open-spaced-repetition)
// + atalhos de teclado (Fase 5 acrescenta os testes de configuração).
const { liberarTudo, suite, assert, eq, abrir, cadastrar } = require('./_h');
const { FSRSAlgorithm, generatorParameters, default_w } = require('ts-fsrs');

const REF = new FSRSAlgorithm(generatorParameters({ enable_fuzz: false, request_retention: 0.9, maximum_interval: 3650 }));
const near = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

(async () => {
  const { t, fim } = suite('fsrs');
  const { browser, page, erros } = await abrir();
  await cadastrar(page); await liberarTudo(page);
  const W = await page.evaluate(() => FSRS_W);

  await t('19 pesos padrão idênticos aos publicados', () => { eq(W.length, 19); W.forEach((w, i) => assert(w === default_w[i], 'peso ' + i)); });
  for (let g = 1; g <= 4; g++) {
    await t('estado inicial nota ' + g, async () => {
      const r = await page.evaluate(g => ({ s: FSRS.initS(g), d: FSRS.initD(g) }), g);
      assert(near(r.s, REF.init_stability(g)), 's ' + r.s + ' vs ' + REF.init_stability(g));
      assert(near(r.d, REF.init_difficulty(g)) || near(r.d, Math.min(10, Math.max(1, REF.init_difficulty(g)))), 'd ' + r.d + ' vs ' + REF.init_difficulty(g));
    });
  }
  const casos = [];
  for (const d of [1.5, 5, 8.7]) for (const s of [0.5, 3, 25, 180]) for (const el of [1, 4, 30]) for (let g = 1; g <= 4; g++) casos.push({ d, s, el, g });
  await t('transições de revisão (144 casos: s e d) batem com ts-fsrs', async () => {
    const mine = await page.evaluate(cs => cs.map(c => {
      const now = Date.UTC(2026, 0, 10, 15); const st = { s: c.s, d: c.d, reps: 3, lapses: 0, ts: now - c.el * 864e5, due: now };
      return FSRS.next(st, c.g, now);
    }), casos);
    const falhas = [];
    casos.forEach((c, i) => {
      const r = REF.forgetting_curve(c.el, c.s);
      const dRef = REF.next_difficulty(c.d, c.g);
      let sRef = c.g === 1 ? Math.min(REF.next_forget_stability(c.d, c.s, r), c.s / Math.exp(W[17] * W[18])) : REF.next_recall_stability(c.d, c.s, r, c.g);
      const ns = REF.next_state({ stability: c.s, difficulty: c.d }, c.el, c.g);
      if (!near(mine[i].d, dRef) || !near(mine[i].d, ns.difficulty)) falhas.push('d ' + JSON.stringify(c) + ' ' + mine[i].d + '≠' + ns.difficulty);
      if (!near(mine[i].s, sRef) || !near(mine[i].s, ns.stability, 2e-3)) falhas.push('s ' + JSON.stringify(c) + ' ' + mine[i].s + '≠' + ns.stability);
    });
    assert(!falhas.length, falhas.slice(0, 3).join(' ; ') + ' (' + falhas.length + ')');
  });
  await t('estabilidade de curto prazo (mesmo dia) bate com ts-fsrs', async () => {
    for (const s of [0.4, 3, 12]) for (let g = 1; g <= 4; g++) {
      const m = await page.evaluate(([s, g]) => FSRS.sShort(s, g), [s, g]);
      assert(near(m, REF.next_short_term_stability(s, g)), s + '/' + g);
    }
  });
  await t('retrievability calculada antes de atualizar (curva de esquecimento)', async () => {
    for (const [tt, s] of [[1, 1], [10, 3], [100, 20]]) {
      const m = await page.evaluate(([tt, s]) => FSRS.retr(tt, s), [tt, s]);
      assert(near(m, REF.forgetting_curve(tt, s)), tt + '/' + s);
    }
  });
  await t('intervalo com retenção 90% = estabilidade; teto 3650 dias', async () => {
    for (const s of [0.4, 3.173, 15.7, 88]) eq(await page.evaluate(s => FSRS.ivl(s), s), REF.next_interval(s, 0));
    eq(await page.evaluate(() => FSRS.ivl(99999)), 3650);
  });
  await t('reps e lapses: Errei conta lapso só em carta já vista', async () => {
    const r = await page.evaluate(() => { const n = Date.now(); const a = FSRS.next(undefined, 1, n); const b = FSRS.next(Object.assign({}, a, { ts: n - 3 * 864e5 }), 1, n); return [a.lapses, b.lapses, b.reps]; });
    eq(r.join(','), '0,1,2');
  });
  await t('dificuldade limitada a 1–10', async () => {
    const r = await page.evaluate(() => { let st = FSRS.next(undefined, 1, 0); for (let i = 1; i < 30; i++) st = FSRS.next(st, 1, i * 3 * 864e5); let e = FSRS.next(undefined, 4, 0); for (let i = 1; i < 30; i++) e = FSRS.next(e, 4, i * 900 * 864e5); return [st.d, e.d]; });
    assert(r[0] <= 10 && r[0] >= 1 && r[1] >= 1 && r[1] <= 10, r.join(','));
  });
  await t('atalhos padrão: Espaço mostra, 1–4 dão nota', async () => {
    await page.evaluate(() => { estudar('sub:card-has'); });
    await page.keyboard.press(' ');
    assert(await page.isVisible('.fl-back'), 'Espaço não mostrou');
    await page.keyboard.press('4');
    const st = await page.evaluate(() => P.cards['card-has-b1']);
    eq(st.s, 15.6911); // FSRS_W[3] arredondado a 4 casas
  });
  await t('atalho ignorado com tecla segurada (repeat)', async () => {
    const antes = await page.evaluate(() => S.n);
    await page.keyboard.press(' ');
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', repeat: true, bubbles: true })));
    eq(await page.evaluate(() => S.n), antes);
  });
  await t('atalho ignorado com modal aberto', async () => {
    const antes = await page.evaluate(() => S.n);
    await page.evaluate(() => { showModal('<p>teste</p>'); });
    await page.keyboard.press('3');
    eq(await page.evaluate(() => S.n), antes);
    await page.keyboard.press('Escape');
    assert(!(await page.$('.mdl-bg')), 'modal não fechou com Esc');
  });
  await t('sem erros de script', async () => { eq(erros.length, 0, erros.join(' | ')); });
  await browser.close();
  fim();
})();
