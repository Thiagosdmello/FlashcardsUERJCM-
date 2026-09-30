// Suíte: streak, troféus e recordes.
// Teste principal: responde cartas PELA INTERFACE com relógio simulado, dia a dia,
// e compara cada número da tela com um espelho independente (calculado aqui, sem usar o código do app).
const { liberarTudo, suite, assert, eq, abrir, cadastrar } = require('./_h');

const MARCOS = [3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
// ---- espelho independente ----
const ymd = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
function espelho(estudados /* Map<ymd, nCartas> */, agora) {
  const dia = off => { const d = new Date(agora); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return ymd(d); };
  let off = estudados.has(dia(0)) ? 0 : -1, n = 0;
  while (estudados.has(dia(off))) { n++; off--; }
  const ks = [...estudados.keys()].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  const next = k => { const y = Math.floor(k / 1e4), m = Math.floor(k / 100) % 100, d = k % 100; const x = new Date(y, m - 1, d + 1, 12); return ymd(x); };
  ks.forEach(k => { run = prev !== null && next(prev) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  const prox = MARCOS.find(m => m > n) || null;
  return { streak: n, best, dias: ks.length, maisDia: Math.max(0, ...estudados.values()), faltam: prox ? prox - n : null };
}

(async () => {
  const { t, fim } = suite('streak trofeus');
  const T0 = new Date(2026, 9, 1, 9, 0, 0); // qui 01/10/2026 09:00
  const { browser, page, erros } = await abrir({ clock: T0 });
  await cadastrar(page, 'Mariana Souza', 'mari@ct.com'); await liberarTudo(page);
  await page.evaluate(() => { P.plano.meta = 500; salvarProg(); render(); }); // teto alto: a sessão nunca acaba por meta

  const estudados = new Map();
  let agora = T0.getTime();
  const avancar = async ms => { await page.clock.fastForward(ms); agora += ms; };
  const resgatarTodos = async () => { let n = 0; while (await page.$('[data-act="resgatar"]')) { await page.click('[data-act="resgatar"]'); n++; } return n; };
  const lerTela = async () => {
    await resgatarTodos();
    const fogoSb = await page.$eval('#sb', e => { const f = e.querySelector('.fire'); return f ? +f.textContent.replace(/\D/g, '') : 0; });
    await page.click('#sb [data-nav="perfil"]'); await resgatarTodos();
    const r = await page.evaluate(() => ({
      stk: +document.querySelector('#p-streak [data-k="streak"]').textContent,
      faltam: document.querySelector('#p-streak [data-k="faltam"]') ? +document.querySelector('#p-streak [data-k="faltam"]').textContent : null,
      seq: parseInt(document.querySelector('[data-rec="seq"] b').textContent),
      dias: +document.querySelector('[data-rec="dias"] b').textContent.replace(/\D/g, ''),
      maisDia: +document.querySelector('[data-rec="dia"] b').textContent.replace(/\D/g, ''),
    }));
    r.fogoSb = fogoSb; return r;
  };
  const conferir = async (rot) => {
    const e = espelho(estudados, agora); const s = await lerTela();
    eq(s.fogoSb, e.streak, rot + ' 🔥 barra lateral'); eq(s.stk, e.streak, rot + ' 🔥 perfil');
    eq(s.seq, e.best, rot + ' maior sequência'); eq(s.dias, e.dias, rot + ' dias estudados');
    eq(s.maisDia, e.maisDia, rot + ' mais cartas num dia'); eq(s.faltam, e.faltam, rot + ' faltam');
  };
  const estudarPelaUI = async (n, checarSemModal) => {
    await page.click('#sb [data-nav="uerj"]'); await resgatarTodos();
    await page.click('.tc[data-deck="card"] [data-alvo="tema:card"]');
    for (let i = 0; i < n; i++) {
      await page.click('.btn-show'); await page.click('.gb.g3');
      if (checarSemModal) assert(!(await page.$('.mdl-bg')), 'modal de troféu interrompeu a sessão');
    }
    await page.click('.st-x');
    const k = ymd(new Date(agora)); estudados.set(k, (estudados.get(k) || 0) + n);
  };

  // padrão de 26 dias: 1 = estuda, 0 = pula. Cartas por dia variam.
  const padrao = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const qtd = i => 1 + (i * 7) % 5;
  await t('dia a dia (26 dias) pela interface: tela = espelho', async () => {
    for (let i = 0; i < padrao.length; i++) {
      await conferir('dia ' + (i + 1) + ' antes');
      if (padrao[i]) {
        await estudarPelaUI(qtd(i), true);
        await conferir('dia ' + (i + 1) + ' depois');
        if (i % 4 === 0) { await estudarPelaUI(1, true); await conferir('dia ' + (i + 1) + ' 2ª sessão (não soma dia)'); }
      }
      await avancar(24 * 3600e3);
    }
  });
  await t('troféus de 3, 5 e 10 foram resgatados (maior sequência 10)', async () => {
    const tr = await page.evaluate(() => Object.keys(P.trof).map(Number).sort((a, b) => a - b));
    eq(tr.join(), '3,5,10');
  });
  await t('virada da meia-noite com app aberto (dia estudado → segue contando)', async () => {
    // agora: dia 27, 09:00, sem estudo. Estuda, vai para 23:59:40 e deixa o relógio passar da meia-noite.
    await estudarPelaUI(2);
    await page.click('#sb [data-nav="home"]');
    const n = espelho(estudados, agora).streak;
    await avancar((14 * 3600 + 59 * 60 + 40) * 1000);
    eq(await page.$eval('#sb .fire', e => +e.textContent.replace(/\D/g, '')), n, 'antes da virada');
    assert((await page.textContent('#box-hoje')).includes('(2 feitas)'), 'feitas antes');
    await avancar(60e3); // 00:00:40 do dia seguinte — nenhum clique
    eq(await page.$eval('#sb .fire', e => +e.textContent.replace(/\D/g, '')), n, 'depois da virada (conta a partir de ontem)');
    assert((await page.textContent('#box-hoje')).includes('(0 feitas)'), 'contador do dia não zerou sozinho');
    await conferir('pós-virada');
  });
  await t('virada da meia-noite após dia sem estudo zera a sequência sem clique', async () => {
    await page.click('#sb [data-nav="home"]');
    await avancar((23 * 3600 + 59 * 60) * 1000); // 23:59:40 do dia sem estudo
    const n = espelho(estudados, agora).streak; assert(n > 0, 'deveria ainda contar ontem');
    eq(await page.$eval('#sb .fire', e => +e.textContent.replace(/\D/g, '')), n);
    await avancar(60e3);
    eq(await page.$('#sb .fire'), null, 'selo 🔥 deveria sumir');
    eq(espelho(estudados, agora).streak, 0);
    await conferir('pós-virada zerada');
  });
  await t('fita dos últimos 7 dias marca os dias estudados', async () => {
    await page.click('#sb [data-nav="perfil"]');
    const marc = await page.$$eval('#fita i', els => els.map(e => e.classList.contains('on') ? 1 : 0).join(''));
    let exp = ''; for (let i = 6; i >= 0; i--) { const d = new Date(agora); d.setHours(12); d.setDate(d.getDate() - i); exp += estudados.has(ymd(d)) ? 1 : 0; }
    eq(marc, exp);
  });
  await browser.close();

  // ---- troféus: modal ao abrir, fila, resgatar, persistência, reset ----
  const b2 = await abrir({ clock: new Date(2026, 9, 1, 9) });
  const p2 = b2.page;
  await cadastrar(p2, 'João Pedro', 'jp@ct.com'); await liberarTudo(p2);
  await t('fila de troféus ao abrir o app, com 🏆 RESGATAR TROFÉU', async () => {
    await p2.evaluate(() => { for (let i = 1; i <= 16; i++) P.log[addDias(hoje(), -i)] = { rev: 3, ok: 3, nov: 3 }; salvarProg(); });
    await p2.reload();
    await p2.waitForSelector('.conq-m');
    assert((await p2.textContent('.conq-m')).includes('1 de 4'), 'fila errada');
    const nomes = [];
    while (await p2.$('[data-act="resgatar"]')) { nomes.push(await p2.textContent('.conq-m h2')); eq((await p2.textContent('[data-act="resgatar"]')).trim(), '🏆 RESGATAR TROFÉU'); await p2.click('[data-act="resgatar"]'); }
    eq(nomes.join('|'), 'Calouro dos Flashcards|Aprendiz Dedicado|Interno Focado|Plantonista Assíduo');
  });
  await t('modal de conquista não fecha clicando fora', async () => {
    await p2.evaluate(() => { P.log[addDias(hoje(), -17)] = { rev: 1, ok: 1, nov: 1 }; for (let i = 18; i <= 20; i++) P.log[addDias(hoje(), -i)] = { rev: 1, ok: 1, nov: 1 }; salvarProg(); render(); });
    await p2.waitForSelector('.conq-m');
    await p2.mouse.click(5, 5);
    assert(await p2.$('.conq-m'), 'fechou');
    await p2.keyboard.press('Escape');
    assert(await p2.$('.conq-m'), 'fechou com Esc');
    await p2.click('[data-act="resgatar"]');
  });
  await t('gênero inferido e trocável', async () => {
    const g = await p2.evaluate(() => ['Mariana', 'Beatriz', 'Luca', 'Thiago', 'Isabel', 'Luiz', 'Ana Clara', 'Rafaela', 'Gabriel', 'Michele'].map(generoInferido).join(''));
    eq(g, 'ffmmfmffmf');
    await p2.click('#sb [data-nav="perfil"]');
    await p2.click('[data-act="setGen"][data-g="f"]');
    await p2.click('[data-nav="trofeus"]');
    assert((await p2.textContent('.tr[data-marco="20"]')).includes('Residente Disciplinada'), 'nome feminino');
  });
  await t('bloqueados: silhueta com "?", "???", "faltam N"', async () => {
    const t25 = await p2.textContent('.tr[data-marco="25"]');
    assert(t25.includes('???') && /faltam \d+/.test(t25), t25);
    assert(await p2.$('.tr[data-marco="25"] svg.bloq'), 'sem silhueta');
    eq(await p2.$$eval('.tr:not(.lk)', e => e.length), 5);
  });
  await t('14 SVGs de troféu, ids únicos por marco, material crescente', async () => {
    const r = await p2.evaluate(() => {
      const ids = []; const cores = [];
      MARCOS.forEach(m => { const d = document.createElement('div'); d.innerHTML = svgTrofeu(m); d.querySelectorAll('[id]').forEach(x => ids.push(x.id)); cores.push(d.querySelector('stop').getAttribute('stop-color')); });
      return { ids, uniq: new Set(ids).size, cores };
    });
    eq(r.uniq, r.ids.length, 'ids repetidos');
    eq(new Set(r.cores).size, 7, 'deveriam ser 7 materiais');
  });
  await t('troféus evoluem por camadas (mais elementos a cada faixa)', async () => {
    const n = await p2.evaluate(() => MARCOS.map(m => { const d = document.createElement('div'); d.innerHTML = svgTrofeu(m); return d.querySelector('svg').querySelectorAll('path,rect,circle,ellipse,line').length; }));
    for (let i = 1; i < n.length; i++) assert(n[i] >= n[i - 1], 'regrediu em ' + MARCOS[i] + ': ' + n.join(','));
    assert(n[13] > n[0] * 4, n.join(','));
  });
  await t('recordes: acerto do dia exige 20 cartas e fica ≤ 100%', async () => {
    await p2.evaluate(() => { P.log[addDias(hoje(), -30)] = { rev: 19, ok: 19, nov: 0 }; P.log[addDias(hoje(), -31)] = { rev: 25, ok: 30, nov: 0 }; P.log[addDias(hoje(), -32)] = { rev: 40, ok: 30, nov: 0 }; salvarProg(); render(); });
    eq(await p2.textContent('[data-rec="acerto"] b'), '100%');
    await p2.evaluate(() => { P.log[addDias(hoje(), -31)] = { rev: 25, ok: 20, nov: 0 }; salvarProg(); render(); });
    eq(await p2.textContent('[data-rec="acerto"] b'), '80%');
  });
  await t('recordes: semana mais forte (segunda a domingo) e mais novas', async () => {
    const r = await p2.evaluate(() => { P.log = {}; P.log['2026-09-21'] = { rev: 10, ok: 5, nov: 4 }; P.log['2026-09-27'] = { rev: 30, ok: 5, nov: 9 }; P.log['2026-09-28'] = { rev: 35, ok: 5, nov: 1 }; salvarProg(); render(); return [document.querySelector('[data-rec="semana"]').textContent, document.querySelector('[data-rec="novas"] b').textContent]; });
    assert(r[0].includes('40') && r[0].includes('21/09/2026'), r[0]); eq(r[1], '9');
  });
  await t('troféu resgatado fica para sempre (reset e sequência quebrada)', async () => {
    await p2.click('#sb [data-nav="perfil"]'); await p2.click('[data-act="zerar"]'); await p2.click('.mdl .btn-d');
    eq((await p2.evaluate(() => Object.keys(P.trof).length)), 5);
    await p2.click('[data-nav="trofeus"]'); eq(await p2.$$eval('.tr:not(.lk)', e => e.length), 5);
  });
  await t('sem erros de script', async () => { eq(erros.concat(b2.erros).length, 0, erros.concat(b2.erros).join(' | ')); });
  await b2.browser.close();
  fim();
})();
