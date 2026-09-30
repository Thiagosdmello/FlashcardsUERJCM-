// Auditoria de responsividade: 7 larguras × todas as telas.
// Mede estouro horizontal, alvos de toque < 44 px (em telas ≤ 820 px) e texto cortado.
const { chromium } = require('playwright');
const { FILE } = require('./_h');
const fs = require('fs');
const LARG = [360, 390, 430, 768, 1024, 1366, 1920];
// Telas independentes dos dados: usam o primeiro tema/subtema e a primeira carta com tabela e com SVG do conteúdo carregado.
const SUB0 = 'DECKS[0].subs[0].id';
const CTAB = 'Object.keys(CARD).find(i=>/<table/.test(CARD[i].c.v))';
const CSVG = 'Object.keys(CARD).find(i=>/<svg/.test(CARD[i].c.v))';
const TELAS = [
  ['landing', null], ['login', null], ['home', 'go("home")'], ['uerj', 'go("uerj")'], ['tema', 'go("uerj",DECKS[0].id)'],
  ['meus', 'go("meus")'], ['meus-baralho', 'go("meus",P.own[0].id)'],
  ['plano', 'go("plano")'], ['ordem', 'go("ordem")'], ['stats', 'go("stats")'], ['perfil', 'go("perfil")'], ['trofeus', 'go("trofeus")'],
 ['estudo-frente', 'estudar("sub:"+' + SUB0 + ')'],
  ['estudo-verso-tabela', 'estudar("sub:"+' + SUB0 + ');S.fila.unshift(' + CTAB + ');S.shown=true;render()'],
  ['estudo-svg', 'estudar("sub:"+' + SUB0 + ');S.fila.unshift(' + CSVG + ');S.shown=true;render()'],
  ['fim', 'estudar("sub:"+' + SUB0 + ');S.n=3;S.ok=2;S.g=[1,0,2,0];S.dur=42000;go("fim",null,{force:true})'],
  ['sessao', 'estudar("sub:"+' + SUB0 + ');S.n=3;S.ok=2;S.g=[1,0,2,0];S.dur=42000;go("sessao",null,{force:true})'], ['busca', 'go("home");BUSCA_Q.home="sindrome";render()'],
  ['modal', 'go("home");showModal("<h2>Janela</h2><p>Texto de teste com um nome bem comprido Insuficiênciacardíacacongestivadescompensada</p><div class=m-acts><button class=\\"btn btn-o\\">Cancelar</button><button class=\\"btn btn-p\\">OK</button></div>")'],
];
(async () => {
  const browser = await chromium.launch();
  const probs = []; let n = 0;
  for (const w of LARG) {
    const mob = w <= 820;
    const ctx = await browser.newContext({ viewport: { width: w, height: mob ? 820 : 900 }, hasTouch: mob, isMobile: mob && w < 500, reducedMotion: 'reduce' }); // sem animação: medir o tamanho final
    const page = await ctx.newPage();
    await page.goto(FILE);
    await page.evaluate(() => {
      localStorage.clear();
      cadastrar('Maria Eduarda Albuquerque Figueiredo', 'maria.eduarda.albuquerque.figueiredo@hospitaluniversitario.com.br', 'segredo1');
      localStorage.setItem('ctfc:adm', JSON.stringify(['maria.eduarda.albuquerque.figueiredo@hospitaluniversitario.com.br']));
    });
    for (const [nome, js] of TELAS) {
      await page.evaluate(() => { try { closeModal(true); } catch (e) {} });
      if (nome === 'landing') { await page.evaluate(() => { localStorage.removeItem('ctfc:sess'); U = null; document.documentElement.classList.remove('logged'); mostrar('landing'); }); }
      else if (nome === 'login') { await page.evaluate(() => mostrar('login')); }
      else {
        await page.evaluate(js0 => {
          localStorage.setItem('ctfc:adm', JSON.stringify(['maria.eduarda.albuquerque.figueiredo@hospitaluniversitario.com.br']));
          if (!U) { localStorage.setItem('ctfc:sess', JSON.stringify('maria.eduarda.albuquerque.figueiredo@hospitaluniversitario.com.br')); entrarNoApp(); }
          if (!P.own.length) { P.own.push({ id: 'obA', nome: 'Baralho com um nome extremamente longo para testar a quebra de linha', cards: [{ id: 'own-a', f: 'Frente sem espaços: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', v: 'Verso', own: true }] });
            P.listas.push({ id: 'l1', nome: 'Lista com nome muito longo para ver se quebra direito', cards: ['card-ic-b1'] });
            for (let i = 0; i < 20; i++) P.log[addDias(hoje(), -i)] = { rev: 30 + i, ok: 25, nov: 8 };
            P.plano.prova = addDias(hoje(), 40); P.plano.prioridade = ['card-has', 'emerg-choque'];
            localStorage.setItem('ctfc:admlog', JSON.stringify([{ dt: hoje(), email: 'aluno.com.email.bem.comprido@faculdade.edu.br', trilha: 'residencia', plano: 'anual', code: 'CT-R-20270930-ABCDEF' }]));
            salvarProg(); }
          closeModal(true);
          new Function(js0)();
          document.querySelectorAll('.mdl-bg').forEach(x => { if (!x.querySelector('h2') || x.querySelector('h2').textContent !== 'Janela') x.remove(); });
        }, js);
      }
      await page.waitForTimeout(60);
      n++;
      const r = await page.evaluate(({ mob }) => {
        const out = [];
        const ov = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        if (ov > 0) out.push('estouro horizontal de ' + ov + 'px');
        const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
        const vw = document.documentElement.clientWidth;
        document.querySelectorAll('body *').forEach(el => {
          if (!vis(el)) return;
          const b = el.getBoundingClientRect();
          if (el.closest('.tbl,.ld-deck,svg,.mdl-bg .code')) return;
          if (b.right > vw + 1 && getComputedStyle(el).position !== 'fixed') out.push('passa da tela: ' + el.tagName.toLowerCase() + '.' + [...el.classList].join('.') + ' (' + Math.round(b.right) + '>' + vw + ')');
          if (mob && el.matches('button,a.btn,input:not([type=hidden]),select,textarea,[role=switch]') && !el.closest('.chart')) {
            if (b.height < 43.5 || (b.width < 43.5 && !el.matches('input,select,textarea'))) out.push('alvo pequeno: ' + el.tagName.toLowerCase() + '.' + [...el.classList].join('.') + ' "' + (el.textContent || el.id).trim().slice(0, 20) + '" ' + Math.round(b.width) + '×' + Math.round(b.height));
          }
          const s = getComputedStyle(el);
          if (el.children.length === 0 && el.textContent.trim() && s.overflow !== 'visible' && s.textOverflow !== 'ellipsis' && (el.scrollWidth > el.clientWidth + 1) && !el.matches('input,textarea,select,code,.code')) out.push('texto cortado: ' + el.tagName.toLowerCase() + '.' + [...el.classList].join('.') + ' "' + el.textContent.trim().slice(0, 24) + '"');
        });
        return [...new Set(out)].slice(0, 12);
      }, { mob });
      r.forEach(p => probs.push(w + 'px · ' + nome + ' · ' + p));
    }
    await ctx.close();
  }
  await browser.close();
  fs.mkdirSync(__dirname + '/results', { recursive: true });
  fs.writeFileSync(__dirname + '/results/audit_resp.txt', probs.join('\n'));
  console.log(`[responsividade] ${n} combinações (${LARG.length} larguras × ${TELAS.length} telas) · ${probs.length} problemas`);
  probs.slice(0, 60).forEach(p => console.log('  ✗ ' + p));
  process.exit(probs.length ? 1 : 0);
})();
