'use strict';
/* =====================================================================
   Flashcards CT dos Acadêmicos — lógica do app
   Fonte: src/logic.js  ·  montado por tools/build_app.js
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. Dados e índices
   --------------------------------------------------------------------- */
let DECKS = [];
try { DECKS = JSON.parse(document.getElementById('decks-data').textContent); } catch (e) { DECKS = []; }
const CARD = {}, SUB = {}, DECK = {};
DECKS.forEach((d, di) => {
  d._i = di; DECK[d.id] = d;
  d.subs.forEach((s, si) => {
    s._i = si; SUB[s.id] = { s, d };
    s.cards.forEach((c, ci) => { c._i = ci; CARD[c.id] = { c, s, d }; });
  });
});

/* ---------------------------------------------------------------------
   2. Utilidades
   --------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC_MAP[c]);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const semTags = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const fmt = n => Number(n || 0).toLocaleString('pt-BR');
const pl = (n, um, varios) => fmt(n) + ' ' + (n === 1 ? um : varios);
const DAY = 864e5;
function dk(t) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function hoje() { return dk(Date.now()); }
function tsDe(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).getTime(); }
function addDias(key, n) { const [y, m, d] = key.split('-').map(Number); return dk(new Date(y, m - 1, d + n).getTime()); }
function fimHoje() { return tsDe(addDias(hoje(), 1)); }
function diaSemana(key) { return new Date(tsDe(key)).getDay(); }
function difDias(a, b) { return Math.round((tsDe(b) - tsDe(a)) / DAY); }
function dataBR(key) { if (!key) return '—'; const [y, m, d] = key.split('-'); return d + '/' + m + '/' + y; }
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LETRA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
function arredondaMarketing(n) {
  if (n < 20) return String(n);
  if (n < 1000) return '+' + fmt(Math.floor(n / 10) * 10);
  return '+' + fmt(Math.floor(n / 1000) * 1000);
}
function uid(p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------------------------------------------------------------------
   3. Armazenamento (sempre em try/catch) e SHA-256
   --------------------------------------------------------------------- */
const LS = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* sem armazenamento */ } },
  raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  setRaw(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } },
};
const K = { users: 'ctfc:users', sess: 'ctfc:sess', theme: 'ctfc:theme', keys: 'ctfc:keys', adm: 'ctfc:adm', admlog: 'ctfc:admlog' };
const kProg = e => 'ctfc:prog:' + e;

function sha256(msg) {
  const Kc = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const bytes = new TextEncoder().encode(String(msg));
  const len = bytes.length, bitLen = len * 8;
  const nBlocks = ((len + 9 + 63) >> 6);
  const w8 = new Uint8Array(nBlocks * 64); w8.set(bytes); w8[len] = 0x80;
  const dv = new DataView(w8.buffer);
  dv.setUint32(w8.length - 4, bitLen >>> 0); dv.setUint32(w8.length - 8, Math.floor(bitLen / 4294967296));
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let b = 0; b < nBlocks; b++) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(b * 64 + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + Kc[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const mj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + bb) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(x => x.toString(16).padStart(8, '0')).join('');
}

/* ---------------------------------------------------------------------
   4. Janelas próprias (o iframe não permite alert/confirm/prompt)
   --------------------------------------------------------------------- */
let MODAL = null;
function showModal(html, opts = {}) {
  closeModal(true);
  const bg = document.createElement('div');
  bg.className = 'mdl-bg';
  bg.innerHTML = '<div class="mdl' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  document.body.appendChild(bg);
  MODAL = { bg, onClose: opts.onClose || null, dismiss: opts.dismiss !== false };
  if (MODAL.dismiss) bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
  const f = bg.querySelector('[autofocus]') || bg.querySelector('input,select,textarea');
  if (f) setTimeout(() => f.focus(), 0);
  return bg.firstChild;
}
function closeModal(silent) {
  if (!MODAL) return;
  const m = MODAL; MODAL = null; m.bg.remove();
  if (!silent && m.onClose) m.onClose();
}
function modalAberto() { return !!MODAL; }
// ask({titulo, msg(html), input:{type,ph,val}, botoes:[{t,v,cls}], validar(txt)->erro|null}) -> Promise
function ask(o) {
  const botoes = o.botoes || [{ t: 'OK', v: true, cls: 'btn-p' }];
  return new Promise(res => {
    const el = showModal(
      '<h2>' + esc(o.titulo || '') + '</h2>' +
      (o.msg ? '<div class="muted">' + o.msg + '</div>' : '') +
      (o.input ? '<input class="inp" id="ask-in" type="' + esc(o.input.type || 'text') + '" placeholder="' + esc(o.input.ph || '') + '" value="' + esc(o.input.val || '') + '" autocomplete="off"' + (o.input.max ? ' maxlength="' + o.input.max + '"' : '') + '>' : '') +
      '<div class="err" id="ask-err"></div>' +
      '<div class="m-acts">' + botoes.map((b, i) => '<button class="btn ' + (b.cls || 'btn-o') + '" data-i="' + i + '" type="button">' + esc(b.t) + '</button>').join('') + '</div>',
      { dismiss: o.dismiss !== false, onClose: () => res(null), wide: o.wide });
    const inp = el.querySelector('#ask-in');
    const pick = i => {
      const b = botoes[i];
      if (inp && b.v !== null && b.v !== false && o.validar) {
        const erro = o.validar(inp.value);
        if (erro) { el.querySelector('#ask-err').textContent = erro; inp.focus(); return; }
      }
      if (MODAL) MODAL.onClose = null;
      closeModal();
      res(inp ? (b.v === null || b.v === false ? null : { v: b.v, txt: inp.value }) : b.v);
    };
    $$('[data-i]', el).forEach(b => { b.onclick = () => pick(+b.dataset.i); });
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); let i = botoes.findIndex(b => /btn-(p|g)/.test(b.cls || '')); if (i < 0) i = botoes.length - 1; pick(i); }
      });
    }
  });
}
let toastT = null;
function toast(msg, ms = 2400) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  clearTimeout(toastT);
  toastT = setTimeout(() => t.remove(), ms);
}
async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); toast('Copiado'); return true; }
  catch (e) {
    const r = document.createRange(); const el = $('[data-copy-src]');
    if (el) { r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Selecionei o texto: use Ctrl+C / Copiar'); return false;
  }
}

/* ---------------------------------------------------------------------
   5. Tema claro/escuro
   --------------------------------------------------------------------- */
let THEME = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
function setTema(t) {
  THEME = t === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', THEME);
  LS.setRaw(K.theme, THEME);
  syncTemaUI();
}
function syncTemaUI() {
  $$('[data-tema-tgl]').forEach(b => b.setAttribute('aria-checked', THEME === 'dark' ? 'true' : 'false'));
  $$('[data-tema-set]').forEach(b => b.classList.toggle('on', b.dataset.temaSet === THEME));
  const mt = $('meta[name="theme-color"]'); if (mt) mt.setAttribute('content', THEME === 'light' ? '#f2f5fa' : '#0f1b30');
}
// O app manda no próprio tema: se algo externo trocar o atributo, restaura a escolha salva.
try {
  new MutationObserver(() => {
    if (document.documentElement.getAttribute('data-theme') !== THEME) document.documentElement.setAttribute('data-theme', THEME);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
} catch (e) { /* sem observer */ }

/* ---------------------------------------------------------------------
   6. Conta local
   --------------------------------------------------------------------- */
let U = null;   // usuário logado {nome,email,criado}
let P = null;   // progresso do usuário
function hashSenha(email, senha) { return sha256('ctfc|' + email + '|' + senha); }
function usuarios() { return LS.get(K.users, {}) || {}; }
function cadastrar(nome, email, senha) {
  nome = String(nome || '').trim().replace(/\s+/g, ' ');
  email = String(email || '').trim().toLowerCase();
  if (nome.length < 2) return 'Informe seu nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.';
  if (String(senha || '').length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  const us = usuarios();
  if (us[email]) return 'Já existe uma conta com esse e-mail neste aparelho. Use Entrar.';
  us[email] = { nome, email, h: hashSenha(email, senha), criado: hoje() };
  if (!LS.set(K.users, us)) return 'Não consegui salvar neste navegador (armazenamento bloqueado).';
  LS.set(K.sess, email);
  return null;
}
function entrar(email, senha) {
  email = String(email || '').trim().toLowerCase();
  const u = usuarios()[email];
  if (!u || u.h !== hashSenha(email, senha)) return 'E-mail ou senha incorretos.';
  LS.set(K.sess, email);
  return null;
}
function sair() {
  if (S) S = null;
  if (NUVEM) { enviarAgora(); try { NUVEM.auth.signOut(); } catch (e) { /* offline */ } }
  LS.del(K.sess);
  document.documentElement.classList.remove('logged');
  U = null; P = null;
  mostrar('landing');
}

/* ---------------------------------------------------------------------
   7. Progresso
   --------------------------------------------------------------------- */
function progPadrao() {
  return { v: 1, cards: {}, log: {}, plano: { meta: 40, dias: [0, 1, 2, 3, 4, 5, 6], prova: null, prioridade: [] },
    fav: [], listas: [], own: [], trof: {}, genero: null };
}
function carregarProg(email) { return normalizarProg(LS.get(kProg(email), {})); }
function salvarProg() {
  if (!U || !P) return;
  P.atualizado = Date.now();
  LS.set(kProg(U.email), P);
  if (NUVEM) agendarEnvio();
}
function normalizarProg(p0) {
  const p = Object.assign(progPadrao(), p0 || {});
  p.plano = Object.assign(progPadrao().plano, p.plano || {});
  ['fav', 'listas', 'own'].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
  ['cards', 'log', 'trof'].forEach(k => { if (!p[k] || typeof p[k] !== 'object') p[k] = {}; });
  return p;
}
function logDia(key) { const k = key || hoje(); if (!P.log[k]) P.log[k] = { rev: 0, ok: 0, nov: 0, g: [0, 0, 0, 0] }; return P.log[k]; }
function feitasHoje() { const l = P.log[hoje()]; return l ? l.rev : 0; }
function revisoesTotais() { return Object.values(P.log).reduce((a, l) => a + (l.rev || 0), 0); }

/* ---------------------------------------------------------------------
   8. FSRS-5 (pesos padrão do open-spaced-repetition)
   --------------------------------------------------------------------- */
const FSRS_W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const FSRS_RET = 0.9, FSRS_MAX = 3650, FSRS_DECAY = -0.5, FSRS_FACTOR = 19 / 81;
const FSRS = {
  clampD: d => Math.min(10, Math.max(1, d)),
  retr: (t, s) => Math.pow(1 + FSRS_FACTOR * t / s, FSRS_DECAY),
  ivl(s) { const i = s / FSRS_FACTOR * (Math.pow(FSRS_RET, 1 / FSRS_DECAY) - 1); return Math.min(FSRS_MAX, Math.max(1, Math.round(i))); },
  initS: g => Math.max(0.1, FSRS_W[g - 1]),
  initD(g) { return FSRS.clampD(FSRS_W[4] - Math.exp(FSRS_W[5] * (g - 1)) + 1); },
  nextD(d, g) {
    const d1 = d - FSRS_W[6] * (g - 3) * (10 - d) / 9;
    const alvo = FSRS_W[4] - Math.exp(FSRS_W[5] * 3) + 1; // D0(Fácil)
    return FSRS.clampD(FSRS_W[7] * alvo + (1 - FSRS_W[7]) * d1);
  },
  sRecall(d, s, r, g) {
    const hp = g === 2 ? FSRS_W[15] : 1, eb = g === 4 ? FSRS_W[16] : 1;
    return s * (1 + Math.exp(FSRS_W[8]) * (11 - d) * Math.pow(s, -FSRS_W[9]) * (Math.exp(FSRS_W[10] * (1 - r)) - 1) * hp * eb);
  },
  sForget(d, s, r) {
    const f = FSRS_W[11] * Math.pow(d, -FSRS_W[12]) * (Math.pow(s + 1, FSRS_W[13]) - 1) * Math.exp(FSRS_W[14] * (1 - r));
    return Math.min(f, s / Math.exp(FSRS_W[17] * FSRS_W[18]));
  },
  sShort: (s, g) => s * Math.exp(FSRS_W[17] * (g - 3 + FSRS_W[18])),
  // st: estado atual (ou undefined para carta nova); g: 1..4; now: ms
  next(st, g, now) {
    let s, d, reps, lapses;
    if (!st || !st.reps) { s = FSRS.initS(g); d = FSRS.initD(g); reps = 1; lapses = 0; }
    else {
      const el = Math.max(0, (now - st.ts) / DAY);
      const r = FSRS.retr(el, st.s);             // retrievability ANTES de atualizar s e d
      if (dk(now) === dk(st.ts)) s = FSRS.sShort(st.s, g);  // revisão no mesmo dia
      else s = g === 1 ? FSRS.sForget(st.d, st.s, r) : FSRS.sRecall(st.d, st.s, r, g);
      d = FSRS.nextD(st.d, g); reps = st.reps + 1; lapses = (st.lapses || 0) + (g === 1 ? 1 : 0);
    }
    s = Math.min(36500, Math.max(0.01, s));
    const due = g === 1 ? now + 60e3 : now + FSRS.ivl(s) * DAY;
    return { s: +s.toFixed(4), d: +d.toFixed(4), due, reps, lapses, ts: now };
  },
};
function rotuloIvl(st, g) {
  if (g === 1) return '<1 min';
  const n = FSRS.next(st, g, Date.now()); const dias = Math.round((n.due - Date.now()) / DAY);
  if (dias < 30) return dias + ' d';
  if (dias < 365) return (Math.round(dias / 3) / 10).toFixed(1).replace('.', ',') + ' m';
  return (Math.round(dias / 36.5) / 10).toFixed(1).replace('.', ',') + ' a';
}

/* ---------------------------------------------------------------------
   9. Acesso: ver seção ACESSO (tudo liberado)
   --------------------------------------------------------------------- */
function decksTrilha(t) { return DECKS.filter(d => d.trilha === t); }
function decksVisiveis() { return DECKS.filter(deckVisivel); }

/* ---------------------------------------------------------------------
   10. Cartas próprias, cartas e filas
   --------------------------------------------------------------------- */
function ownMap() { const m = {}; P.own.forEach(dk_ => dk_.cards.forEach(c => { m[c.id] = { c, deck: dk_ }; })); return m; }
function infoCarta(id) {
  if (CARD[id]) return { c: CARD[id].c, s: CARD[id].s, d: CARD[id].d, own: false };
  const o = ownMap()[id]; if (o) return { c: o.c, s: null, d: null, own: true, deckOwn: o.deck };
  return null;
}
const isNova = id => { const st = P.cards[id]; return !st || !st.reps; };
const isDue = id => { const st = P.cards[id]; return !!(st && st.reps && st.due < fimHoje()); };
function idsDe(alvo) {
  const [tipo, arg] = [alvo.split(':')[0], alvo.slice(alvo.indexOf(':') + 1)];
  const deCards = arr => arr.map(c => c.id);
  if (tipo === 'hoje' || tipo === 'venc' || tipo === 'mais10') {
    const ids = []; decksVisiveis().forEach(d => d.subs.forEach(s => s.cards.forEach(c => ids.push(c.id))));
    P.own.forEach(o => o.cards.forEach(c => ids.push(c.id)));
    return ids;
  }
  if (tipo === 'tema') { const d = DECK[arg]; return d ? d.subs.flatMap(s => deCards(s.cards)) : []; }
  if (tipo === 'sub') { const s = SUB[arg]; return s ? deCards(s.s.cards) : []; }
  if (tipo === 'card') return CARD[arg] ? [arg] : [];   // carta aberta pela busca
  if (tipo === 'fav') return P.fav.filter(id => infoCarta(id));
  if (tipo === 'lista') { const l = P.listas.find(x => x.id === arg); return l ? l.cards.filter(id => infoCarta(id)) : []; }
  if (tipo === 'own') { const o = P.own.find(x => x.id === arg); return o ? deCards(o.cards) : []; }
  return [];
}
// ordem das novas: prioridade manual → peso desc → ordem didática (tema, subtema, carta)
function chaveOrdem(id) {
  const i = CARD[id]; const pr = P.plano.prioridade || [];
  if (!i) return [1e6, 0, 1e6, 0, 0];
  const pi = pr.indexOf(i.s.id);
  return [pi < 0 ? 1e5 : pi, -(i.s.p || 1), i.d._i, i.s._i, i.c._i];
}
function ordenarNovas(ids) {
  const ks = new Map(ids.map(id => [id, chaveOrdem(id)]));
  return ids.slice().sort((a, b) => { const x = ks.get(a), y = ks.get(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; });
}
const NOVAS_POR_ALVO = 60;
function restanteHoje() { return Math.max(0, (P.plano.meta || 40) - feitasHoje()); }
function resumoHoje() {
  const ids = idsDe('hoje').filter(liberada);
  const venc = ids.filter(isDue);
  const novas = ids.filter(isNova);
  const r = restanteHoje();
  const v = Math.min(venc.length, r);
  const n = Math.min(novas.length, Math.max(0, r - v));
  return { venc: venc.length, vencHoje: v, novas: n, novasDisp: novas.length, r, meta: P.plano.meta, feitas: feitasHoje() };
}
function filaBase(alvo) {
  const partes = alvo.split(':'); // base:all | base:tema:<id> | base:sub:<id>
  let subs = [];
  if (partes[1] === 'all') subs = decksVisiveis().flatMap(d => d.subs);
  else if (partes[1] === 'tema' && DECK[partes[2]]) subs = DECK[partes[2]].subs;
  else if (partes[1] === 'sub' && SUB[partes[2]]) subs = [SUB[partes[2]].s];
  const ids = [];
  subs.forEach(s => { s.cards.filter(c => c.b).sort((a, b) => ordBase(a.id) - ordBase(b.id)).forEach(c => ids.push(c.id)); });
  return ids.filter(liberada);
}
function ordBase(id) { const m = /-b(\d+)$/.exec(id); return m ? +m[1] : 99; }
function contaBase(escopo) { // escopo: deck ou sub
  const subs = escopo.subs ? escopo.subs : [escopo];
  return subs.reduce((a, s) => a + s.cards.filter(c => c.b).length, 0);
}
function montarFila(alvo) {
  if (alvo.startsWith('base:')) return filaBase(alvo);
  const ids = idsDe(alvo).filter(liberada);
  const venc = ids.filter(isDue).sort((a, b) => P.cards[a].due - P.cards[b].due);
  const novas = ordenarNovas(ids.filter(isNova));
  if (alvo === 'hoje') {
    const r = restanteHoje(); if (r <= 0) return [];
    const v = venc.slice(0, r); return v.concat(novas.slice(0, r - v.length));
  }
  if (alvo === 'venc') return venc;
  if (alvo === 'mais10') return novas.slice(0, 10);
  if (alvo.startsWith('card:')) return ids;
  // sessão de tema/subtema/lista: NÃO usa o teto diário do plano
  return venc.concat(novas.slice(0, NOVAS_POR_ALVO));
}
function progressoDe(escopo) {
  const cards = escopo.subs ? escopo.subs.flatMap(s => s.cards) : escopo.cards;
  const vistas = cards.filter(c => !isNova(c.id)).length;
  return { total: cards.length, vistas, pct: cards.length ? Math.round(vistas / cards.length * 100) : 0 };
}

/* ---------------------------------------------------------------------
   11. Navegação e casca
   --------------------------------------------------------------------- */
const NAV = [
  ['home', '🏠', 'Início', 'Início'],
  ['uerj', '🎯', 'UERJ R+ CM', 'R+ CM'],
  ['meus', '🗂️', 'Meus flashcards', 'Meus'],
  ['plano', '📅', 'Meu plano', 'Plano'],
  ['stats', '📊', 'Estatísticas', 'Stats'],
  ['perfil', '👤', 'Perfil', 'Perfil'],
];
let V = { view: 'home', arg: null };
const LOGO = () => ($('#logo-tpl') ? $('#logo-tpl').innerHTML : '');
function mostrar(tela) {
  const b = document.body;
  b.classList.remove('in-app', 'in-auth');
  if (tela === 'app') b.classList.add('in-app');
  if (tela === 'login' || tela === 'signup') {
    b.classList.add('in-auth');
    $('#tab-login').classList.toggle('on', tela === 'login');
    $('#tab-signup').classList.toggle('on', tela === 'signup');
    $('#f-login').hidden = tela !== 'login'; $('#f-signup').hidden = tela !== 'signup';
    setTimeout(() => { const f = $(tela === 'login' ? '#li-email' : '#su-nome'); if (f) f.focus(); }, 0);
  }
  window.scrollTo(0, 0);
}
function fogoN() { return typeof streak === 'function' ? streak() : 0; }
function renderCasca() {
  const n = fogoN();
  const fogo = n > 0 ? '<span class="fire" title="Sequência de dias">🔥' + n + '</span>' : '';
  const ativo = navAtivo();
  $('#sb').innerHTML =
    '<div class="logo">' + LOGO() + '<div><b>Flashcards CT</b><small>dos Acadêmicos</small></div></div>' +
    '<nav class="nav">' + NAV.map(([id, ic, nome]) => '<button type="button" class="navi' + (ativo === id ? ' on' : '') + '" data-nav="' + id + '"><span class="ic">' + ic + '</span><span>' + nome + '</span>' + (id === 'home' ? fogo : '') + '</button>').join('') + '</nav>' +
    '<div class="sb-foot">' +
      '<div class="sw"><span>🌙 Tema escuro</span><button type="button" class="tgl" role="switch" data-tema-tgl aria-label="Tema escuro" aria-checked="' + (THEME === 'dark') + '"></button></div>' +
      '<button type="button" class="navi" data-act="sair"><span class="ic">↩</span><span>Sair</span></button>' +
      '<p class="sig small">@ctdosacademicos</p>' +
    '</div>';
  $('#bn').innerHTML = NAV.map(([id, ic, , curto]) => '<button type="button" class="' + (ativo === id ? 'on' : '') + '" data-nav="' + id + '" aria-label="' + curto + '"><span class="ic">' + ic + '</span>' + (id === 'home' && n > 0 ? '<span class="fire">🔥' + n + '</span>' : '') + '<span>' + curto + '</span></button>').join('');
}
function navAtivo() {
  const v = V.view;
  if (v === 'study' || v === 'fim' || v === 'sessao') return S && S.origem ? S.origem : 'home';
  if (v === 'trofeus') return 'perfil';
  if (v === 'ordem') return 'plano';
  return v;
}
function go(view, arg = null, opts = {}) {
  if (V.view === 'study' && view !== 'study' && S && !S.fim && !opts.force) { encerrarSessao(); }
  if (typeof pararCaptura === 'function' && CAPTURA) pararCaptura();
  V = { view, arg };
  render();
  if (!opts.keepScroll) window.scrollTo(0, 0);
}
function render() {
  if (!U) return;
  renderCasca();
  const fn = TELAS[V.view] || TELAS.home;
  $('#main').innerHTML = fn(V.arg) || '';
  depoisRender();
}
function depoisRender() {
  // tabelas do verso ganham rolagem própria
  $$('.vs table').forEach(t => { if (!t.parentElement.classList.contains('tbl')) { const w = document.createElement('div'); w.className = 'tbl'; t.parentNode.insertBefore(w, t); w.appendChild(t); } });
  syncTemaUI();
  if (typeof depoisRenderExtra === 'function') depoisRenderExtra();
}
const TELAS = {};

/* ---------------------------------------------------------------------
   12. Telas
   --------------------------------------------------------------------- */
function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function primeiroNome() { return (U.nome || '').split(' ')[0]; }
function boxEstudarAgora() {
  const r = resumoHoje();
  const dia = diaSemana(hoje());
  const folga = !(P.plano.dias || []).includes(dia);
  const linha = '<b class="num">' + fmt(r.venc) + '</b> para revisar · <b class="num">' + fmt(r.novas) + '</b> novas · meta de ' + fmt(r.meta) + '/dia (' + fmt(r.feitas) + ' feitas)';
  let titulo = 'Estudar agora', botoes = '';
  if (folga) {
    titulo = 'Hoje é dia de folga 🌴';
    botoes = '<button class="btn btn-o" data-act="study" data-alvo="hoje" type="button">Estudar mesmo assim</button>';
  } else if (r.r <= 0) {
    titulo = 'Meta de hoje cumprida ✓';
    botoes = (r.venc ? '<button class="btn btn-p" data-act="study" data-alvo="venc" type="button">Revisar vencidas (' + fmt(r.venc) + ')</button>' : '') +
      '<button class="btn btn-o" data-act="study" data-alvo="mais10" type="button">+10 novas</button>';
  } else if (r.vencHoje + r.novas === 0) {
    titulo = 'Tudo em dia'; botoes = '<span class="muted small">Sem cartas pendentes agora.</span>';
  } else {
    botoes = '<button class="btn btn-p" data-act="study" data-alvo="hoje" type="button">▶ Estudar agora</button>';
  }
  return '<section class="hero-st" id="box-hoje"><div><h2>' + titulo + '</h2><p class="st-line">' + linha + '</p></div><div class="row">' + botoes + '</div></section>';
}
function cardTema(d) {
  const pg = progressoDe(d), nb = contaBase(d);
  return '<article class="tc" data-deck="' + esc(d.id) + '">' +
    '<button class="tc-h" type="button" data-nav="uerj" data-arg="' + esc(d.id) + '"><div class="tc-ic">' + esc(d.ic) + '</div><div style="min-width:0"><h3>' + esc(d.nome) + '</h3><p>' + (d.subs.length > 1 ? pl(d.subs.length, 'subtema', 'subtemas') + ' · ' : '') + pl(pg.total, 'carta', 'cartas') + '</p>' + (d.freq ? '<p class="tc-freq">' + pl(totFreq(d), 'tópico anotado', 'tópicos anotados') + '</p>' : '') + '</div></button>' +
    '<div class="tc-bar" title="' + pg.pct + '% vistas"><i style="width:' + pg.pct + '%"></i></div>' +
    '<div class="tc-acts"><button class="btn btn-p btn-sm" type="button" data-act="study" data-alvo="tema:' + esc(d.id) + '">Estudar tema</button>' +
    (nb ? '<button class="btn btn-q btn-sm" type="button" data-act="study" data-alvo="base:tema:' + esc(d.id) + '">⚡ Revisão rápida · ' + nb + ' cartas</button>' : '') + '</div></article>';
}
TELAS.home = () => {
  const decks = decksVisiveis();
  return '<header class="pg-h"><h1>' + saudacao() + ', ' + esc(primeiroNome()) + '</h1><p>Seu estudo de hoje em um toque.</p></header>' +
    (typeof caixaBusca === 'function' ? caixaBusca('home') : '') +
    boxEstudarAgora() +
    '<section class="sec-t"><h2>Seus temas</h2>' + (contaBaseTotal() ? '<button class="btn btn-q btn-sm" type="button" data-act="study" data-alvo="base:all">⚡ Revisão rápida geral</button>' : '') + '</section>' +
    '<div class="tg">' + decks.map(cardTema).join('') + '</div>' +
    '<p class="sig">@ctdosacademicos</p>';
};
function contaBaseTotal() { return decksVisiveis().reduce((a, d) => a + contaBase(d), 0); }
// ---- Tópico UERJ R+ CM: ranking dos temas mais presentes nas anotações ----
const SO_TEMAS = () => DECKS.every(d => d.subs.length === 1);
function nomeSub(sb, d) { return d.subs.length === 1 ? d.nome : d.nome + ' · ' + sb.nome; }
function totFreq(d) { return d.freq ? Object.values(d.freq).reduce((a, b) => a + b, 0) : 0; }
function painelFreq() {
  const ds = DECKS.filter(d => d.freq).slice().sort((a, b) => totFreq(b) - totFreq(a));
  if (!ds.length) return '';
  const max = Math.max(...ds.map(totFreq)), tot = ds.reduce((a, d) => a + totFreq(d), 0);
  return '<section class="card" id="freq"><div class="sec-t"><h2>Temas mais presentes nas suas anotações</h2><span class="muted small">' + fmt(tot) + ' tópicos anotados</span></div>' +
    '<div class="fq">' + ds.map((d, i) => '<button type="button" class="fq-r" data-nav="uerj" data-arg="' + esc(d.id) + '" data-freq="' + esc(d.id) + '"><span class="fq-n"><b class="num">' + (i + 1) + '.</b> ' + esc(d.nome) + '</span><span class="fq-b"><i style="width:' + Math.round(totFreq(d) / max * 100) + '%"></i></span><b class="num fq-v">' + totFreq(d) + '</b></button>').join('') + '</div></section>';
}
TELAS.uerj = arg => {
  if (arg && DECK[arg]) return telaTema(DECK[arg]);
  const decks = decksVisiveis().slice().sort((a, b) => totFreq(b) - totFreq(a));
  return '<header class="pg-h"><h1>🎯 UERJ R+ Clínica Médica</h1><p>Flashcards feitos a partir das suas anotações das provas de R+ CM da UERJ.</p></header>' +
    (typeof caixaBusca === 'function' ? caixaBusca('uerj') : '') + painelFreq() +
    '<section class="sec-t"><h2>Temas</h2></section><div class="tg">' + decks.map(cardTema).join('') + '</div>';
};
function estrelas(p) { return '<span class="pw" title="Peso de prova ' + p + '/5" aria-label="Peso ' + p + ' de 5">' + '★'.repeat(p) + '<span style="opacity:.3">' + '★'.repeat(5 - p) + '</span></span>'; }
function telaTema(d) {
  const nb = contaBase(d), pg = progressoDe(d);
  return '<button class="back" type="button" data-nav="uerj">← UERJ R+ CM</button>' +
    '<header class="pg-h"><h1>' + esc(d.ic) + ' ' + esc(d.nome) + '</h1><p>' + esc(d.desc || '') + '</p></header>' +
    '<div class="row"><button class="btn btn-p" type="button" data-act="study" data-alvo="tema:' + esc(d.id) + '">Estudar tema</button>' +
    (nb ? '<button class="btn btn-q" type="button" data-act="study" data-alvo="base:tema:' + esc(d.id) + '">⚡ Revisão rápida · ' + nb + ' cartas</button>' : '') +
    '<span class="muted small">' + pg.vistas + ' de ' + pg.total + ' cartas vistas</span></div>' +
    (d.subs.length > 1 ? '<div class="subs">' + d.subs.map(s => linhaSub(s, d)).join('') + '</div>' : '');
}
function linhaSub(s, d) {
  const pg = progressoDe(s), nb = contaBase(s), tr = subTrancado(s);
  const venc = s.cards.filter(c => isDue(c.id) && liberada(c.id)).length;
  return '<div class="sr" data-sub="' + esc(s.id) + '"><div class="sr-n"><h3>' + esc(s.nome) + (tr ? ' <span class="lockb">⭐ Premium</span>' : '') + '</h3><p>' + estrelas(s.p) + ' · <span class="num">' + pl(s.cards.length, 'carta', 'cartas') + '</span> · ' + pg.vistas + ' vistas' + (venc ? ' · <b>' + venc + ' para revisar</b>' : '') + '</p></div>' +
    '<div class="sr-a"><button class="btn btn-p btn-sm" type="button" data-act="study" data-alvo="sub:' + esc(s.id) + '">' + (tr ? '⭐ Estudar' : 'Estudar') + '</button>' +
    (nb ? '<button class="btn btn-q btn-sm" type="button" data-act="study" data-alvo="base:sub:' + esc(s.id) + '">⚡ Base</button>' : '') + '</div></div>';
}

// Perfil: seções em ordem fixa; cada fase registra a sua em PSEC.
const PSEC = {};
const PERFIL_ORDEM = ['id', 'streak', 'recordes', 'genero', 'aparencia', 'atalhos', 'plano', 'favs', 'zerar', 'sair'];
TELAS.perfil = () => '<header class="pg-h"><h1>Perfil</h1></header>' + PERFIL_ORDEM.map(k => PSEC[k] ? PSEC[k]() : '').join('');
PSEC.id = () => '<section class="card" id="p-id"><dl class="kv"><dt>Nome</dt><dd>' + esc(U.nome) + '</dd><dt>E-mail</dt><dd>' + esc(U.email) + '</dd><dt>Membro desde</dt><dd>' + dataBR(U.criado) + '</dd>' +
  '<dt>Revisões totais</dt><dd class="num" data-k="revtot">' + fmt(revisoesTotais()) + '</dd><dt>Progresso</dt><dd data-k="sync">' + textoSync() + '</dd></dl></section>';
PSEC.aparencia = () => secAparencia();
PSEC.sair = () => '<section class="card"><div class="row"><button class="btn btn-o" type="button" data-act="sair">Sair da conta</button><span class="sp"></span><span class="sig small">@ctdosacademicos</span></div></section>';
function secAparencia() {
  return '<section class="card"><h2>Aparência</h2><div class="row" style="margin-top:12px"><button class="chip" type="button" data-tema-set="dark">🌙 Escuro</button><button class="chip" type="button" data-tema-set="light">☀️ Claro</button></div></section>';
}

/* ---------------------------------------------------------------------
   13. Sessão de estudo
   --------------------------------------------------------------------- */
let S = null;
function nomeAlvo(alvo) {
  const [t, a, b] = alvo.split(':');
  if (t === 'hoje') return 'Estudo de hoje';
  if (t === 'venc') return 'Revisões vencidas';
  if (t === 'mais10') return 'Novas extras';
  if (t === 'tema') return DECK[a] ? DECK[a].nome : 'Tema';
  if (t === 'sub') return SUB[a] ? SUB[a].s.nome : 'Subtema';
  if (t === 'base') return '⚡ Revisão rápida' + (a === 'tema' && DECK[b] ? ' · ' + DECK[b].nome : a === 'sub' && SUB[b] ? ' · ' + SUB[b].s.nome : '');
  if (t === 'fav') return 'Favoritos';
  if (t === 'card') return CARD[a] ? CARD[a].s.nome : 'Carta';
  if (t === 'lista') { const l = P.listas.find(x => x.id === a); return l ? l.nome : 'Lista'; }
  if (t === 'own') { const o = P.own.find(x => x.id === a); return o ? o.nome : 'Meu baralho'; }
  return 'Estudo';
}
function estudar(alvo) {
  const fila = montarFila(alvo);
  if (!fila.length) {
    if (alvo === 'hoje' && restanteHoje() <= 0) toast('Meta de hoje já cumprida.');
    else toast('Nada para estudar aqui agora. Volte mais tarde.');
    return;
  }
  S = { alvo, origem: navAtivo(), fila, total: fila.length, ini: Date.now(), n: 0, ok: 0, g: [0, 0, 0, 0], shown: false, undo: null, base: alvo.startsWith('base:'), fim: false, trofPend: false };
  go('study', null, { force: true });
}
function encerrarSessao() { if (S) { S.fim = true; } }
TELAS.study = () => {
  if (!S || !S.fila.length) return TELAS.home();
  const id = S.fila[0]; const inf = infoCarta(id);
  if (!inf) { S.fila.shift(); return TELAS.study(); }
  const c = inf.c; const st = P.cards[id];
  const feitas = S.n, rest = S.fila.length;
  const pct = Math.round(feitas / (feitas + rest) * 100);
  const meta = inf.own ? '<span>🗂️ ' + esc(inf.deckOwn.nome) + '</span>' : '<span>' + esc(nomeSub(inf.s, inf.d)) + '</span>';
  const fav = P.fav.includes(id);
  const frente = inf.own ? esc(c.f) : c.f;
  const verso = inf.own ? esc(c.v).replace(/\n/g, '<br>') : c.v;
  return '<div class="study">' +
    '<div class="st-top"><button type="button" class="st-x" data-act="encerrar">✕ Encerrar</button>' +
    '<div class="st-pr"><span class="num">' + esc(nomeAlvo(S.alvo)) + ' · ' + rest + ' restantes</span><div class="st-bar"><i style="width:' + pct + '%"></i></div></div>' +
    '<button type="button" class="st-undo" data-act="undo"' + (S.undo ? '' : ' disabled') + '>↩ Cartão anterior</button></div>' +
    '<article class="flash" data-card="' + esc(id) + '">' +
      '<div class="fl-meta">' + meta + (c.b ? '<span class="tagb">Base</span>' : '') + (isNova(id) ? '<span class="tagn">Nova</span>' : '') + '</div>' +
      '<div class="fl-acts"><button type="button" class="' + (fav ? 'on' : '') + '" data-act="fav" data-id="' + esc(id) + '" aria-label="Favoritar" title="Favoritar">' + (fav ? '❤' : '♡') + '</button><button type="button" data-act="addlista" data-id="' + esc(id) + '" aria-label="Adicionar a lista" title="Adicionar a lista">+</button></div>' +
      '<div class="fl-front">' + frente + '</div>' +
      '<div class="fl-back"' + (S.shown ? '' : ' hidden') + '><div class="vs">' + verso + '</div>' + (c.ex ? '<div class="ex">' + c.ex + '</div>' : '') + '</div>' +
    '</article>' +
    '<div class="st-bot">' + (S.shown
      ? '<div class="grades">' + [['Errei', 1], ['Difícil', 2], ['Bom', 3], ['Fácil', 4]].map(([t, g]) => '<button type="button" class="gb g' + g + '" data-act="nota" data-g="' + g + '">' + t + '<small>' + rotuloIvl(st, g) + ' <kbd class="desk-only">' + esc(nomeTecla(teclaDe('g' + g))) + '</kbd></small></button>').join('') + '</div>'
      : '<button type="button" class="btn btn-p btn-show" data-act="mostrar">Mostrar resposta <kbd class="desk-only" style="color:inherit;border-color:rgba(255,255,255,.4)">' + esc(nomeTecla(teclaDe('show'))) + '</kbd></button>') +
    '</div></div>';
};
function mostrarResposta() {
  if (!S || S.shown || V.view !== 'study') return;
  S.shown = true; render();
  const b = $('.fl-back'); if (b && b.scrollIntoView && b.getBoundingClientRect().top > innerHeight * .6) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function responder(g) {
  if (!S || !S.shown || V.view !== 'study' || !S.fila.length) return;
  const id = S.fila[0]; const now = Date.now(); const dia = hoje();
  // snapshot para "Cartão anterior" (um nível)
  S.undo = { fila: S.fila.slice(), n: S.n, ok: S.ok, g: S.g.slice(), id, st: P.cards[id] ? Object.assign({}, P.cards[id]) : undefined,
    dia, log: P.log[dia] ? JSON.parse(JSON.stringify(P.log[dia])) : undefined };
  const nova = isNova(id);
  P.cards[id] = FSRS.next(P.cards[id], g, now);
  const l = logDia(dia); l.rev++; if (g > 1) l.ok++; if (nova) l.nov++; if (!l.g) l.g = [0, 0, 0, 0]; l.g[g - 1]++;
  S.n++; if (g > 1) S.ok++; S.g[g - 1]++;
  S.fila.shift();
  if (g === 1 && !S.base) S.fila.splice(Math.min(3, S.fila.length), 0, id); // volta na mesma sessão
  S.shown = false;
  salvarProg();
  if (typeof aposResponder === 'function') aposResponder(id);
  if (!S.fila.length) return finalizar();
  render();
}
function desfazer() {
  if (!S || !S.undo) return;
  const u = S.undo;
  S.fila = u.fila; S.n = u.n; S.ok = u.ok; S.g = u.g;
  if (u.st) P.cards[u.id] = u.st; else delete P.cards[u.id];
  if (u.log) P.log[u.dia] = u.log; else delete P.log[u.dia];
  S.undo = null; S.shown = true; S.fim = false;
  salvarProg();
  V = { view: 'study', arg: null }; render();
}
function finalizar() {
  S.fim = true; S.dur = Date.now() - S.ini;
  go('fim', null, { force: true });
}
TELAS.fim = () => {
  if (!S) return TELAS.home();
  const pct = S.n ? Math.min(100, Math.round(S.ok / S.n * 100)) : 0;
  return '<div class="card done"><div class="big">🎉</div><h2>Sessão concluída</h2><p class="muted">' + pl(S.n, 'carta revisada', 'cartas revisadas') + ' · ' + pct + '% de acerto</p>' +
    (S.undo ? '<button type="button" class="st-undo" data-act="undo">↩ Cartão anterior</button>' : '') +
    '<div class="row" style="justify-content:center"><button class="btn btn-p" type="button" data-act="verSessao">Ver estatísticas</button><button class="btn btn-o" type="button" data-nav="home">Voltar ao início</button></div></div>';
};
TELAS.sessao = () => {
  if (!S) return TELAS.home();
  const pct = S.n ? Math.min(100, Math.round(S.ok / S.n * 100)) : 0;
  const seg = Math.round((S.dur || 0) / 1000);
  const tempo = seg < 60 ? seg + ' s' : Math.floor(seg / 60) + ' min ' + String(seg % 60).padStart(2, '0') + ' s';
  const cores = ['var(--bad)', 'var(--hard)', 'var(--blue2)', 'var(--ok)'];
  const max = Math.max(1, ...S.g);
  return '<header class="pg-h"><h1>Estatísticas da sessão</h1><p>' + esc(nomeAlvo(S.alvo)) + '</p></header>' +
    '<div class="grid3" id="sess-kpi"><div class="kpi"><b class="num" data-k="rev">' + S.n + '</b><span>Revisadas</span></div><div class="kpi"><b class="num" data-k="pct">' + pct + '%</b><span>Acerto</span></div><div class="kpi"><b class="num" data-k="tempo">' + tempo + '</b><span>Tempo</span></div></div>' +
    '<section class="card"><h2>Distribuição das notas</h2><div class="dist" style="margin-top:12px">' + ['Errei', 'Difícil', 'Bom', 'Fácil'].map((t, i) => '<div class="dr"><span>' + t + '</span><div class="db"><i style="width:' + Math.round(S.g[i] / max * 100) + '%;background:' + cores[i] + '"></i></div><b class="num" data-g="' + (i + 1) + '">' + S.g[i] + '</b></div>').join('') + '</div></section>' +
    '<div class="row"><button class="btn btn-p" type="button" data-nav="stats">Estatísticas gerais</button><button class="btn btn-o" type="button" data-nav="home">Voltar ao início</button></div>';
};

/* ---------------------------------------------------------------------
   14. Atalhos de teclado (padrão; configuráveis na Fase 5)
   --------------------------------------------------------------------- */
const KEYS_PADRAO = { show: ' ', g1: '1', g2: '2', g3: '3', g4: '4' };
function atalhos() { return Object.assign({}, KEYS_PADRAO, LS.get(K.keys, {}) || {}); }
function teclaDe(acao) { return atalhos()[acao]; }
function nomeTecla(k) { if (k === ' ') return 'Espaço'; if (k === 'Enter') return 'Enter'; if (k && k.startsWith('Arrow')) return { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[k] || k; return k && k.length === 1 ? k.toUpperCase() : (k || '—'); }
let CAPTURA = null;
document.addEventListener('keydown', e => {
  if (CAPTURA) { CAPTURA(e); return; }
  if (e.key === 'Escape' && MODAL) { if (MODAL.dismiss) closeModal(); return; }
  if (e.repeat || MODAL) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (V.view !== 'study' || !S) return;
  const k = atalhos();
  const igual = (a, b) => a === b || (a && b && a.length === 1 && a.toLowerCase() === String(b).toLowerCase());
  if (!S.shown && igual(e.key, k.show)) { e.preventDefault(); mostrarResposta(); return; }
  if (S.shown) { for (let g = 1; g <= 4; g++) if (igual(e.key, k['g' + g])) { e.preventDefault(); responder(g); return; } }
});

/* ---------------------------------------------------------------------
   15. Ações (delegação de cliques)
   --------------------------------------------------------------------- */
const ACT = {
  sair: () => sair(),
  study: el => estudar(el.dataset.alvo),
  mostrar: () => mostrarResposta(),
  nota: el => responder(+el.dataset.g),
  undo: () => desfazer(),
  encerrar: async () => {
    if (!S) return go('home');
    if (S.n === 0) { S = null; return go('home', null, { force: true }); }
    S.fim = true; S.dur = Date.now() - S.ini;
    go('fim', null, { force: true });
  },
  verSessao: () => go('sessao', null, { force: true }),
  fav: el => { toggleFav(el.dataset.id); },
  addlista: el => { if (typeof escolherLista === 'function') escolherLista(el.dataset.id); else toast('Listas chegam na próxima fase.'); },
};
function toggleFav(id) {
  const i = P.fav.indexOf(id);
  if (i >= 0) P.fav.splice(i, 1); else P.fav.unshift(id);
  salvarProg();
  const b = $('.fl-acts [data-act="fav"]');
  if (b) { const on = P.fav.includes(id); b.classList.toggle('on', on); b.textContent = on ? '❤' : '♡'; }
  toast(P.fav.includes(id) ? 'Adicionada aos favoritos' : 'Removida dos favoritos', 1500);
}
document.addEventListener('click', e => {
  const tt = e.target.closest('[data-tema-tgl]');
  if (tt) { setTema(THEME === 'dark' ? 'light' : 'dark'); return; }
  const ts = e.target.closest('[data-tema-set]');
  if (ts) { setTema(ts.dataset.temaSet); return; }
  const gg = e.target.closest('[data-go]');
  if (gg) { mostrar(gg.dataset.go); return; }
  const nv = e.target.closest('[data-nav]');
  if (nv && U) { go(nv.dataset.nav, nv.dataset.arg || null); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act] && !a.disabled) { ACT[a.dataset.act](a, e); }
});

/* ---------------------------------------------------------------------
   15b. Nuvem (Supabase): login e sincronização do progresso
   Ativa só quando a página tem window.CTFC_CLOUD = {url, anonKey} (config.js) e a biblioteca supabase-js.
   Sem isso (ex.: artifact), o app funciona 100% local, como antes.
   Tabela: public.progresso (user_id, dados jsonb, atualizado_em) com RLS — ver supabase/migrations.
   Regra de conflito: vence a versão com P.atualizado mais recente (última gravação).
   --------------------------------------------------------------------- */
const NUVEM = (() => {
  try {
    const c = window.CTFC_CLOUD;
    if (c && c.url && c.anonKey && window.supabase && window.supabase.createClient)
      return window.supabase.createClient(c.url, c.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  } catch (e) { /* sem nuvem */ }
  return null;
})();
const SYNC = { estado: 'local', pendente: false, t: null, ultimo: null };
function traduzErro(err) {
  const m = String((err && err.message) || err || '');
  if (/already registered|already exists/i.test(m)) return 'Já existe uma conta com esse e-mail. Use Entrar.';
  if (/invalid login|invalid credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/password/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/fetch|network|failed/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet.';
  return 'Não foi possível concluir: ' + m;
}
async function cadastrarNuvem(nome, email, senha) {
  nome = String(nome || '').trim().replace(/\s+/g, ' ');
  email = String(email || '').trim().toLowerCase();
  if (nome.length < 2) return { erro: 'Informe seu nome.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: 'E-mail inválido.' };
  if (String(senha || '').length < 6) return { erro: 'A senha precisa ter pelo menos 6 caracteres.' };
  try {
    const { data, error } = await NUVEM.auth.signUp({ email, password: senha, options: { data: { nome } } });
    if (error) return { erro: traduzErro(error) };
    if (!data.session) return { aviso: 'Conta criada. Enviamos um link de confirmação para ' + email + '. Confirme e depois use Entrar.' };
    return { user: data.user };
  } catch (e) { return { erro: traduzErro(e) }; }
}
async function entrarNuvem(email, senha) {
  email = String(email || '').trim().toLowerCase();
  try {
    const { data, error } = await NUVEM.auth.signInWithPassword({ email, password: senha });
    if (error) return { erro: traduzErro(error) };
    return { user: data.user };
  } catch (e) { return { erro: traduzErro(e) }; }
}
function usuarioDe(user) {
  const email = String(user.email || '').toLowerCase();
  const md = user.user_metadata || {};
  return { nome: md.nome || email.split('@')[0], email, criado: user.created_at ? dk(Date.parse(user.created_at)) : hoje(), id: user.id };
}
function entrarNoAppNuvem(user) {
  U = usuarioDe(user); P = carregarProg(U.email);
  LS.set(K.sess, U.email);
  document.documentElement.classList.add('logged');
  mostrar('app');
  V = { view: 'home', arg: null };
  render();
  if (typeof aoAbrirApp === 'function') aoAbrirApp();
  puxarNuvem();
}
async function puxarNuvem() {
  if (!NUVEM || !U || !U.id) return;
  SYNC.estado = 'sincronizando';
  try {
    const { data, error } = await NUVEM.from('progresso').select('dados, atualizado_em').eq('user_id', U.id).maybeSingle();
    if (error) throw error;
    const remoto = data && data.dados;
    if (remoto && (remoto.atualizado || 0) > (P.atualizado || 0)) {
      P = normalizarProg(remoto); LS.set(kProg(U.email), P);
      if (V.view !== 'study') render();
    } else if (!remoto || (P.atualizado || 0) > (remoto.atualizado || 0)) {
      if (P.atualizado) await enviarAgora();
    }
    SYNC.estado = 'ok'; SYNC.ultimo = Date.now();
  } catch (e) { SYNC.estado = 'offline'; }
  atualizarSyncUI();
}
function agendarEnvio() { SYNC.pendente = true; clearTimeout(SYNC.t); SYNC.t = setTimeout(enviarAgora, 1500); }
async function enviarAgora() {
  clearTimeout(SYNC.t);
  if (!NUVEM || !U || !U.id || !P) return;
  SYNC.pendente = true;
  try {
    const { error } = await NUVEM.from('progresso').upsert({ user_id: U.id, dados: P, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    SYNC.pendente = false; SYNC.estado = 'ok'; SYNC.ultimo = Date.now();
  } catch (e) { SYNC.estado = 'offline'; }
  atualizarSyncUI();
}
function textoSync() {
  if (!NUVEM) return 'Só neste aparelho';
  if (SYNC.estado === 'offline') return '⚠️ Sem conexão — salvo no aparelho, envio quando a internet voltar';
  if (SYNC.pendente || SYNC.estado === 'sincronizando') return '☁️ Sincronizando…';
  return '☁️ Sincronizado' + (SYNC.ultimo ? ' às ' + new Date(SYNC.ultimo).toTimeString().slice(0, 5) : '');
}
function atualizarSyncUI() { const el = $('[data-k="sync"]'); if (el) el.textContent = textoSync(); }
function iniciarNuvem() {
  const nota = $('#au-nota'); if (nota) nota.textContent = 'Sua conta fica na nuvem: entre em qualquer aparelho e continue de onde parou.';
  if (LS.get(K.sess, null)) document.documentElement.classList.add('logged');
  NUVEM.auth.getSession().then(({ data }) => {
    if (data && data.session) entrarNoAppNuvem(data.session.user);
    else { LS.del(K.sess); document.documentElement.classList.remove('logged'); mostrar('landing'); }
  }).catch(() => {
    // sem internet: se já havia sessão neste aparelho, abre com o progresso salvo localmente
    const email = LS.get(K.sess, null);
    if (email) { U = { nome: email.split('@')[0], email, criado: hoje(), id: null }; P = carregarProg(email); mostrar('app'); render(); }
    else mostrar('landing');
  });
  window.addEventListener('online', () => { if (SYNC.pendente) enviarAgora(); else puxarNuvem(); });
  document.addEventListener('visibilitychange', () => {
    if (!U) return;
    if (document.visibilityState === 'hidden') { if (SYNC.pendente) enviarAgora(); }
    else if (V.view !== 'study') puxarNuvem();
  });
}

/* ---------------------------------------------------------------------
   16. Início
   --------------------------------------------------------------------- */
function entrarNoApp() {
  const email = LS.get(K.sess, null);
  const u = email && usuarios()[email];
  if (!u) { LS.del(K.sess); document.documentElement.classList.remove('logged'); mostrar('landing'); return false; }
  U = u; P = carregarProg(u.email);
  document.documentElement.classList.add('logged');
  mostrar('app');
  V = { view: 'home', arg: null };
  render();
  if (typeof aoAbrirApp === 'function') aoAbrirApp();
  return true;
}
function atualizarLanding() {
  const nc = DECKS.reduce((a, d) => a + d.subs.reduce((b, s) => b + s.cards.length, 0), 0);
  const ns = DECKS.reduce((a, d) => a + d.subs.length, 0);
  const el = $('#ld-stats');
  if (el) el.innerHTML = '<div><b>' + arredondaMarketing(nc) + '</b><span>flashcards</span></div>' + (ns > DECKS.length ? '<div><b>' + arredondaMarketing(ns) + '</b><span>subtemas</span></div>' : '') + '<div><b>' + DECKS.length + '</b><span>temas</span></div><div><b>FSRS-5</b><span>revisão espaçada</span></div>';
}
function boot() {
  $('#tab-login').onclick = () => mostrar('login');
  $('#tab-signup').onclick = () => mostrar('signup');
  const ocupado = (f, on) => { const b = $('button[type=submit]', f); if (b) { b.dataset.t = b.dataset.t || b.textContent; b.disabled = on; b.textContent = on ? 'Aguarde…' : b.dataset.t; } };
  $('#f-login').addEventListener('submit', async e => {
    e.preventDefault();
    if (NUVEM) {
      ocupado(e.target, true);
      const r = await entrarNuvem($('#li-email').value, $('#li-pass').value);
      ocupado(e.target, false);
      $('#li-err').textContent = r.erro || '';
      if (r.user) { $('#li-pass').value = ''; entrarNoAppNuvem(r.user); }
      return;
    }
    const err = entrar($('#li-email').value, $('#li-pass').value);
    $('#li-err').textContent = err || '';
    if (!err) { $('#li-pass').value = ''; entrarNoApp(); }
  });
  $('#f-signup').addEventListener('submit', async e => {
    e.preventDefault();
    if (NUVEM) {
      ocupado(e.target, true);
      const r = await cadastrarNuvem($('#su-nome').value, $('#su-email').value, $('#su-pass').value);
      ocupado(e.target, false);
      $('#su-err').textContent = r.erro || r.aviso || '';
      $('#su-err').style.color = r.aviso ? 'var(--ok)' : '';
      if (r.user) { $('#su-pass').value = ''; entrarNoAppNuvem(r.user); }
      return;
    }
    const err = cadastrar($('#su-nome').value, $('#su-email').value, $('#su-pass').value);
    $('#su-err').textContent = err || '';
    if (!err) { $('#su-pass').value = ''; entrarNoApp(); }
  });
  atualizarLanding();
  syncTemaUI();
  if (NUVEM) { iniciarNuvem(); return; }
  if (LS.get(K.sess, null)) entrarNoApp(); else mostrar('landing');
}

/* =====================================================================
   FASE 2 — Plano de estudo, estatísticas, favoritos/listas, Meus flashcards
   ===================================================================== */
const METAS = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150];
const MAX_LISTAS = 10, MAX_OWN = 30, MAX_OWN_CARDS = 500;
// fração novas/revisões dos últimos 14 dias; 0,6 enquanto houver menos de 60 revisões
function fatorNovas(ref) {
  const base = ref || hoje(); let nov = 0, rev = 0;
  for (let i = 0; i < 14; i++) { const l = P.log[addDias(base, -i)]; if (l) { nov += l.nov || 0; rev += l.rev || 0; } }
  if (rev < 60) return 0.6;
  return Math.min(1, Math.max(0.05, nov / rev));
}
function novasRestantes() { return idsDe('hoje').filter(liberada).filter(isNova).length; }
function previsao() {
  const pl = P.plano, dias = pl.dias || [];
  const restam = novasRestantes(), f = fatorNovas();
  const porDia = Math.max(1, Math.round((pl.meta || 40) * f));
  const out = { restam, f, porDia, fim: null, diasProva: null, metaNec: null, ok: null };
  if (!dias.length) return out;
  let k = hoje(), r = restam, guard = 0;
  if (r <= 0) out.fim = hoje();
  else {
    while (guard++ < 4000) { if (dias.includes(diaSemana(k))) { r -= porDia; if (r <= 0) break; } k = addDias(k, 1); }
    out.fim = k;
  }
  if (pl.prova && pl.prova >= hoje()) {
    let n = 0; for (let x = hoje(); x < pl.prova; x = addDias(x, 1)) if (dias.includes(diaSemana(x))) n++;
    out.diasProva = n;
    out.ok = out.fim <= addDias(pl.prova, -1) || restam === 0;
    out.metaNec = n ? Math.ceil(restam / n / f - 1e-9) : null;
  }
  return out;
}
function cronograma(n = 7) {
  const pl = P.plano, dias = pl.dias || [];
  const ids = idsDe('hoje').filter(liberada);
  const rs = resumoHoje();
  let novasDisp = rs.novasDisp;
  const linhas = [];
  for (let i = 0; i < n; i++) {
    const key = addDias(hoje(), i); const estudo = dias.includes(diaSemana(key));
    let rev, nov;
    if (i === 0) { rev = rs.venc; nov = estudo ? rs.novas : 0; }
    else {
      const a = tsDe(key), b = tsDe(addDias(key, 1));
      rev = ids.filter(id => { const st = P.cards[id]; return st && st.reps && st.due >= a && st.due < b; }).length;
      nov = estudo ? Math.min(novasDisp, Math.max(0, pl.meta - rev)) : 0;
    }
    novasDisp = Math.max(0, novasDisp - nov);
    linhas.push({ key, estudo, rev, nov });
  }
  return linhas;
}
TELAS.plano = () => {
  const pl = P.plano; const pv = previsao();
  const metaChips = METAS.map(m => '<button type="button" class="chip' + (pl.meta === m ? ' on' : '') + '" data-act="plMeta" data-v="' + m + '">' + m + '</button>').join('') +
    '<button type="button" class="chip' + (METAS.includes(pl.meta) ? '' : ' on') + '" data-act="plMetaOutro">' + (METAS.includes(pl.meta) ? 'Outro' : 'Outro: ' + pl.meta) + '</button>';
  const diasChips = DIAS_CURTO.map((d, i) => '<button type="button" class="chip' + (pl.dias.includes(i) ? ' on' : '') + '" data-act="plDia" data-d="' + i + '" aria-pressed="' + pl.dias.includes(i) + '">' + d + '</button>').join('');
  let prev = '<p class="muted">Faltam <b class="num" data-k="restam">' + fmt(pv.restam) + '</b> cartas novas. No seu ritmo (≈' + pv.porDia + ' novas por dia de estudo) você termina em <b data-k="fim">' + dataBR(pv.fim) + '</b>.</p>';
  if (!pl.dias.length) prev = '<p class="muted">Escolha ao menos um dia de estudo para calcular a previsão.</p>';
  if (pl.prova && pv.ok !== null) {
    prev += pv.ok
      ? '<div class="banner" style="background:rgba(63,191,140,.12);border-color:rgba(63,191,140,.35)" data-k="diag">✅ No ritmo: você termina antes da prova (' + dataBR(pl.prova) + ').</div>'
      : '<div class="banner" data-k="diag">⚠️ No ritmo atual você não termina até ' + dataBR(pl.prova) + '. Com ' + pl2(pv.diasProva) + ' de estudo até lá, a meta precisa ser de cerca de <b>' + fmt(pv.metaNec || 0) + '/dia</b>.</div>';
  } else if (pl.prova && pl.prova < hoje()) prev += '<div class="banner">A data da prova já passou. Atualize ou limpe.</div>';
  const cr = cronograma();
  return '<header class="pg-h"><h1>📅 Meu plano</h1><p>Sua meta diária decide o que entra em "Estudar agora".</p></header>' +
    '<section class="card"><h2>Meta diária</h2><p class="muted small" style="margin:4px 0 12px">Conta o total do dia: revisões vencidas primeiro, novas no que sobrar.</p><div class="chips" id="pl-metas">' + metaChips + '</div></section>' +
    '<section class="card"><h2>Dias de estudo</h2><p class="muted small" style="margin:4px 0 12px">Em dia de folga o app não cobra, mas deixa "Estudar mesmo assim".</p><div class="chips" id="pl-dias">' + diasChips + '</div></section>' +
    '<section class="card"><h2>Data da prova</h2><div class="row" style="margin:12px 0"><input class="inp" type="date" id="pl-prova" data-change="plProva" value="' + esc(pl.prova || '') + '" min="' + hoje() + '" style="max-width:220px">' + (pl.prova ? '<button class="btn btn-o btn-sm" type="button" data-act="plProvaLimpar">Limpar</button>' : '') + '</div><div id="pl-prev" style="display:flex;flex-direction:column;gap:10px">' + prev + '</div></section>' +
    '<section class="card"><div class="sec-t"><h2>Ordem das novas</h2><button class="btn btn-o btn-sm" type="button" data-nav="ordem">Ver ordem de estudo</button></div><p class="muted small" style="margin-top:6px">Sua prioridade manual primeiro' + (pl.prioridade.length ? ' (' + pl.prioridade.length + ' subtemas)' : '') + ', depois o peso de prova e a ordem didática.</p></section>' +
    '<section class="card"><h2>Próximos dias</h2><div class="vs" style="margin-top:10px"><div class="tbl"><table id="pl-crono"><thead><tr><th>Dia</th><th>Revisões</th><th>Novas</th><th>Total</th></tr></thead><tbody>' +
    cr.map((l, i) => '<tr><td>' + (i === 0 ? 'Hoje' : DIAS_CURTO[diaSemana(l.key)] + ' ' + l.key.slice(8) + '/' + l.key.slice(5, 7)) + (l.estudo ? '' : ' <span class="pill">folga</span>') + '</td><td class="num">' + l.rev + '</td><td class="num">' + l.nov + '</td><td class="num"><b>' + (l.rev + l.nov) + '</b></td></tr>').join('') +
    '</tbody></table></div></div></section>';
};
function pl2(n) { return pl(n, 'dia', 'dias'); }
function salvarPlano() { salvarProg(); render(); }
Object.assign(ACT, {
  plMeta: el => { P.plano.meta = +el.dataset.v; salvarPlano(); },
  plMetaOutro: async () => {
    const r = await ask({ titulo: 'Meta diária', msg: 'Quantas cartas por dia? (de 5 a 500)', input: { type: 'number', val: String(P.plano.meta) },
      botoes: [{ t: 'Cancelar', v: null }, { t: 'Salvar', v: true, cls: 'btn-p' }],
      validar: v => { const n = Math.round(+v); return n >= 5 && n <= 500 ? null : 'Use um número entre 5 e 500.'; } });
    if (r) { P.plano.meta = Math.round(+r.txt); salvarPlano(); }
  },
  plDia: el => {
    const d = +el.dataset.d; const a = P.plano.dias; const i = a.indexOf(d);
    if (i >= 0) { if (a.length === 1) { toast('Deixe pelo menos um dia de estudo.'); return; } a.splice(i, 1); } else a.push(d);
    a.sort(); salvarPlano();
  },
  plProvaLimpar: () => { P.plano.prova = null; salvarPlano(); },
});
const CHG = {
  plProva: el => { P.plano.prova = el.value || null; salvarPlano(); },
};
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHG[el.dataset.change]) CHG[el.dataset.change](el, e); });

/* ---- Ordem de estudo (prioridade manual) ---- */
function subsOrdenados() {
  const pr = P.plano.prioridade || [];
  const subs = decksVisiveis().flatMap(d => d.subs.map(s => ({ s, d })));
  return subs.sort((a, b) => {
    const pa = pr.indexOf(a.s.id), pb = pr.indexOf(b.s.id);
    const ka = [pa < 0 ? 1e5 : pa, -a.s.p, a.d._i, a.s._i], kb = [pb < 0 ? 1e5 : pb, -b.s.p, b.d._i, b.s._i];
    for (let i = 0; i < 4; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return 0;
  });
}
TELAS.ordem = () => {
  const pr = (P.plano.prioridade || []).filter(id => SUB[id]);
  const lista = pr.length ? pr.map((id, i) => { const { s, d } = SUB[id]; return '<div class="li" data-prio="' + esc(id) + '"><b class="num">' + (i + 1) + '.</b><span class="t">' + esc(s.nome) + (d.subs.length > 1 ? ' <small class="muted">· ' + esc(d.nome) + '</small>' : '') + '</span>' +
      '<button class="btn btn-o btn-sm" type="button" data-act="prUp" data-id="' + esc(id) + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir">↑</button>' +
      '<button class="btn btn-o btn-sm" type="button" data-act="prDown" data-id="' + esc(id) + '"' + (i === pr.length - 1 ? ' disabled' : '') + ' aria-label="Descer">↓</button>' +
      '<button class="btn btn-d btn-sm" type="button" data-act="prDel" data-id="' + esc(id) + '" aria-label="Remover">✕</button></div>'; }).join('')
    : '<p class="muted small">Nenhuma prioridade manual. Segue o peso de prova.</p>';
  const opts = SO_TEMAS() ? DECKS.filter(d => !pr.includes(d.subs[0].id)).map(d => '<option value="' + esc(d.subs[0].id) + '">' + esc(d.nome) + '</option>').join('') : decksVisiveis().map(d => { const os = d.subs.filter(s => !pr.includes(s.id)); return os.length ? '<optgroup label="' + esc(d.nome) + '">' + os.map(s => '<option value="' + esc(s.id) + '">' + esc(s.nome) + '</option>').join('') + '</optgroup>' : ''; }).join('');
  const ordem = subsOrdenados().map(({ s, d }, i) => {
    const nov = s.cards.filter(c => isNova(c.id) && liberada(c.id)).length;
    return '<div class="li"><b class="num">' + (i + 1) + '.</b><span class="t">' + (pr.includes(s.id) ? '📌 ' : '') + esc(s.nome) + (d.subs.length > 1 ? ' <small class="muted">· ' + esc(d.nome) + '</small>' : '') + '</span>' + estrelas(s.p) + '<span class="pill num">' + nov + ' novas</span></div>';
  }).join('');
  return '<button class="back" type="button" data-nav="plano">← Meu plano</button>' +
    '<header class="pg-h"><h1>Ordem de estudo</h1><p>Prioridade manual primeiro, depois peso de prova (★) e ordem didática.</p></header>' +
    '<section class="card"><h2>Minha prioridade</h2><div class="lst" id="prio-lista" style="margin-top:12px">' + lista + '</div>' +
    (opts ? '<div class="row" style="margin-top:14px"><select class="inp" id="prio-add" style="flex:1 1 240px;min-width:0">' + opts + '</select><button class="btn btn-p" type="button" data-act="prAdd">Adicionar</button></div>' : '') + '</section>' +
    '<section class="card"><h2>Ordem resultante</h2><div class="lst" id="ordem-final" style="margin-top:12px">' + ordem + '</div></section>';
};
Object.assign(ACT, {
  prAdd: () => { const v = $('#prio-add') && $('#prio-add').value; if (v && !P.plano.prioridade.includes(v)) { P.plano.prioridade.push(v); salvarProg(); render(); } },
  prDel: el => { P.plano.prioridade = P.plano.prioridade.filter(x => x !== el.dataset.id); salvarProg(); render(); },
  prUp: el => { const a = P.plano.prioridade, i = a.indexOf(el.dataset.id); if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; salvarProg(); render(); } },
  prDown: el => { const a = P.plano.prioridade, i = a.indexOf(el.dataset.id); if (i >= 0 && i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; salvarProg(); render(); } },
});

/* ---- Estatísticas gerais ---- */
function dominadas() { return Object.values(P.cards).filter(st => st.reps && st.s >= 21).length; }
function vistasTot() { return Object.values(P.cards).filter(st => st.reps).length; }
function graficoDias(n = 7) {
  const dias = []; for (let i = n - 1; i >= 0; i--) { const k = addDias(hoje(), -i); dias.push({ k, v: (P.log[k] && P.log[k].rev) || 0 }); }
  const max = Math.max(5, ...dias.map(d => d.v));
  const W = 340, H = 160, top = 18, base = 128, bw = 30, gap = (W - 20 - n * bw) / (n - 1);
  const topo = Math.ceil(max / 5) * 5;
  let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Revisões nos últimos ' + n + ' dias">';
  [0, .5, 1].forEach(f => { const y = base - (base - top) * f; s += '<line class="grid" x1="10" y1="' + y + '" x2="' + (W - 10) + '" y2="' + y + '"/>'; });
  dias.forEach((d, i) => {
    const x = 10 + i * (bw + gap), h = Math.round((base - top) * d.v / topo), y = base - h;
    s += '<rect class="bar' + (i === n - 1 ? ' today' : '') + '" x="' + x.toFixed(1) + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, d.v ? 2 : 0) + '" rx="5"/>';
    s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 5) + '" text-anchor="middle" data-dia="' + d.k + '">' + d.v + '</text>';
    s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle">' + (i === n - 1 ? 'Hoje' : DIAS_CURTO[diaSemana(d.k)]) + '</text>';
  });
  return s + '</svg>';
}
TELAS.stats = () => {
  const tot = Object.values(P.log).reduce((a, l) => ({ rev: a.rev + (l.rev || 0), ok: a.ok + (l.ok || 0) }), { rev: 0, ok: 0 });
  const acerto = tot.rev ? Math.min(100, Math.round(tot.ok / tot.rev * 100)) : 0;
  const diasEst = Object.values(P.log).filter(l => l.rev > 0).length;
  const dom = decksVisiveis().map(d => {
    const cards = d.subs.flatMap(s => s.cards); const vis = cards.filter(c => !isNova(c.id)).length; const dm = cards.filter(c => { const st = P.cards[c.id]; return st && st.reps && st.s >= 21; }).length;
    const pv = cards.length ? Math.round(vis / cards.length * 100) : 0, pd = cards.length ? Math.round(dm / cards.length * 100) : 0;
    return '<div class="dr" data-deck="' + esc(d.id) + '"><span class="wrap-any">' + esc(d.ic) + ' ' + esc(d.nome) + '</span><div class="db" title="' + pv + '% vistas · ' + pd + '% dominadas" style="position:relative"><i style="width:' + pv + '%;background:var(--sf2);position:absolute;inset:0 auto 0 0;border:1px solid var(--blue)"></i><i style="width:' + pd + '%;background:var(--blue);position:relative"></i></div><b class="num">' + pd + '%</b></div>';
  }).join('');
  return '<header class="pg-h"><h1>📊 Estatísticas</h1><p>Seu histórico neste aparelho.</p></header>' +
    '<div class="grid3" id="st-kpi">' +
      '<div class="kpi"><b class="num" data-k="streak">🔥 ' + fogoN() + '</b><span>Dias seguidos</span></div>' +
      '<div class="kpi"><b class="num" data-k="rev">' + fmt(tot.rev) + '</b><span>Revisões totais</span></div>' +
      '<div class="kpi"><b class="num" data-k="acerto">' + acerto + '%</b><span>Acerto geral</span></div>' +
      '<div class="kpi"><b class="num" data-k="vistas">' + fmt(vistasTot()) + '</b><span>Cartas vistas</span></div>' +
      '<div class="kpi"><b class="num" data-k="dom">' + fmt(dominadas()) + '</b><span>Dominadas (estabilidade ≥ 21 dias)</span></div>' +
      '<div class="kpi"><b class="num" data-k="dias">' + fmt(diasEst) + '</b><span>Dias estudados</span></div>' +
    '</div>' +
    '<section class="card"><h2>Últimos 7 dias</h2><div style="margin-top:10px;max-width:560px">' + graficoDias(7) + '</div></section>' +
    '<section class="card"><h2>Domínio por tema</h2><p class="muted small" style="margin:4px 0 12px">Barra clara: vistas · barra azul: dominadas.</p><div class="dist" id="st-dom" style="--c:1">' + dom.replace(/grid-template-columns/g, '') + '</div></section>';
};

/* ---- Favoritos e listas ---- */
function previewCarta(id, n = 90) {
  const i = infoCarta(id); if (!i) return '';
  const t = i.own ? String(i.c.f) : semTags(i.c.f); return esc(t.length > n ? t.slice(0, n - 1) + '…' : t);
}
function escolherLista(id) {
  const html = () => '<h2>Adicionar a lista</h2><div class="lst" id="lt-lista">' +
    (P.listas.length ? P.listas.map(l => { const tem = l.cards.includes(id); return '<button type="button" class="li btn" style="justify-content:flex-start;font-weight:500" data-act="ltToggle" data-l="' + esc(l.id) + '" data-id="' + esc(id) + '"><span>' + (tem ? '✅' : '➕') + '</span><span class="t" style="text-align:left">' + esc(l.nome) + '</span><span class="pill num">' + l.cards.length + '</span></button>'; }).join('') : '<p class="muted small">Você ainda não tem listas.</p>') +
    '</div>' + (P.listas.length < MAX_LISTAS ? '<div class="row"><input class="inp" id="lt-nome" placeholder="Nome da nova lista" maxlength="40" style="flex:1 1 180px;min-width:0"><button class="btn btn-p" type="button" data-act="ltCriar" data-id="' + esc(id) + '">Criar e adicionar</button></div>' : '<p class="muted small">Limite de ' + MAX_LISTAS + ' listas atingido.</p>') +
    '<div class="m-acts"><button class="btn btn-o" type="button" data-act="fecharModal">Fechar</button></div>';
  showModal(html());
  escolherLista._html = html;
}
function reabrirEscolha() { if (MODAL && escolherLista._html) MODAL.bg.firstChild.innerHTML = escolherLista._html(); }
Object.assign(ACT, {
  fecharModal: () => closeModal(),
  ltToggle: el => {
    const l = P.listas.find(x => x.id === el.dataset.l); if (!l) return;
    const i = l.cards.indexOf(el.dataset.id); if (i >= 0) l.cards.splice(i, 1); else l.cards.push(el.dataset.id);
    salvarProg(); reabrirEscolha();
  },
  ltCriar: el => {
    const nome = ($('#lt-nome').value || '').trim().slice(0, 40);
    if (!nome) { $('#lt-nome').focus(); return; }
    if (P.listas.length >= MAX_LISTAS) return;
    P.listas.push({ id: uid('l'), nome, cards: el.dataset.id ? [el.dataset.id] : [] });
    salvarProg(); reabrirEscolha(); toast('Lista criada');
  },
  novaLista: async () => {
    if (P.listas.length >= MAX_LISTAS) { toast('Limite de ' + MAX_LISTAS + ' listas.'); return; }
    const r = await ask({ titulo: 'Nova lista', input: { ph: 'Ex.: Revisar antes da prova', max: 40 }, botoes: [{ t: 'Cancelar', v: null }, { t: 'Criar', v: true, cls: 'btn-p' }], validar: v => v.trim() ? null : 'Dê um nome à lista.' });
    if (r) { P.listas.push({ id: uid('l'), nome: r.txt.trim().slice(0, 40), cards: [] }); salvarProg(); render(); }
  },
  delLista: async el => {
    const l = P.listas.find(x => x.id === el.dataset.l); if (!l) return;
    const ok = await ask({ titulo: 'Excluir lista?', msg: 'A lista "' + esc(l.nome) + '" será apagada. As cartas continuam no app.', botoes: [{ t: 'Cancelar', v: false }, { t: 'Excluir', v: true, cls: 'btn-d' }] });
    if (ok) { P.listas = P.listas.filter(x => x !== l); salvarProg(); render(); }
  },
  verLista: el => {
    const alvo = el.dataset.l; const ids = alvo === 'fav' ? P.fav : (P.listas.find(x => x.id === alvo) || { cards: [] }).cards;
    const nome = alvo === 'fav' ? 'Favoritos' : P.listas.find(x => x.id === alvo).nome;
    showModal('<h2>' + esc(nome) + '</h2><div class="lst">' + (ids.length ? ids.map(id => '<div class="li"><span class="t">' + previewCarta(id) + '</span><button class="btn btn-d btn-sm" type="button" data-act="tirarDeLista" data-l="' + esc(alvo) + '" data-id="' + esc(id) + '" aria-label="Remover">✕</button></div>').join('') : '<p class="muted">Vazia.</p>') + '</div><div class="m-acts"><button class="btn btn-o" type="button" data-act="fecharModal">Fechar</button></div>', { wide: true });
  },
  tirarDeLista: el => {
    const alvo = el.dataset.l, id = el.dataset.id;
    if (alvo === 'fav') P.fav = P.fav.filter(x => x !== id); else { const l = P.listas.find(x => x.id === alvo); if (l) l.cards = l.cards.filter(x => x !== id); }
    salvarProg(); el.closest('.li').remove(); render();
  },
});
PSEC.favs = () => {
  const lista = (id, nome, n, extra) => '<div class="li" data-lista="' + esc(id) + '"><span class="t"><b>' + esc(nome) + '</b> <small class="muted num">· ' + pl(n, 'carta', 'cartas') + '</small></span>' +
    '<button class="btn btn-p btn-sm" type="button" data-act="study" data-alvo="' + (id === 'fav' ? 'fav' : 'lista:' + esc(id)) + '"' + (n ? '' : ' disabled') + '>Estudar</button>' +
    '<button class="btn btn-o btn-sm" type="button" data-act="verLista" data-l="' + esc(id) + '">Ver</button>' + (extra || '') + '</div>';
  return '<section class="card" id="p-favs"><div class="sec-t"><h2>❤ Favoritos e listas</h2><button class="btn btn-o btn-sm" type="button" data-act="novaLista"' + (P.listas.length >= MAX_LISTAS ? ' disabled' : '') + '>+ Nova lista (' + P.listas.length + '/' + MAX_LISTAS + ')</button></div><div class="lst" style="margin-top:12px">' +
    lista('fav', 'Favoritos', P.fav.length) +
    P.listas.map(l => lista(l.id, l.nome, l.cards.length, '<button class="btn btn-d btn-sm" type="button" data-act="delLista" data-l="' + esc(l.id) + '" aria-label="Excluir lista">✕</button>')).join('') +
    '</div><p class="muted small" style="margin-top:10px">Na carta, use ♡ para favoritar e + para pôr numa lista.</p></section>';
};
PSEC.plano = () => '<section class="card"><div class="sec-t"><h2>📅 Meu plano</h2><button class="btn btn-o btn-sm" type="button" data-nav="plano">Editar</button></div><dl class="kv" style="margin-top:10px"><dt>Meta</dt><dd>' + P.plano.meta + ' cartas/dia</dd><dt>Dias</dt><dd>' + (P.plano.dias.length === 7 ? 'Todos os dias' : P.plano.dias.map(d => DIAS_CURTO[d]).join(', ')) + '</dd><dt>Prova</dt><dd>' + (P.plano.prova ? dataBR(P.plano.prova) : 'Sem data') + '</dd></dl></section>';
PSEC.zerar = () => '<section class="card"><h2>Zerar progresso</h2><p class="muted small" style="margin:4px 0 12px">Apaga revisões e agendamento de todas as cartas. Mantém seu plano, troféus, gênero, favoritos, listas e baralhos próprios.</p><button class="btn btn-d" type="button" data-act="zerar">Zerar progresso</button></section>';
function resetProg() {
  const novo = progPadrao();
  ['plano', 'trof', 'genero', 'fav', 'listas', 'own'].forEach(k => { if (P[k] !== undefined) novo[k] = P[k]; });
  P = novo; salvarProg();
}
ACT.zerar = async () => {
  const ok = await ask({ titulo: 'Zerar progresso?', msg: 'Todas as revisões e o histórico de dias serão apagados. Não dá para desfazer.', botoes: [{ t: 'Cancelar', v: false }, { t: 'Zerar tudo', v: true, cls: 'btn-d' }] });
  if (ok) { resetProg(); toast('Progresso zerado'); render(); }
};

/* ---- Meus flashcards (texto puro, sempre escapado) ---- */
TELAS.meus = arg => {
  if (arg) { const o = P.own.find(x => x.id === arg); if (o) return telaOwn(o); }
  const grid = P.own.length ? '<div class="tg">' + P.own.map(o => {
    const due = o.cards.filter(c => isDue(c.id)).length;
    return '<article class="tc" data-own="' + esc(o.id) + '"><button class="tc-h" type="button" data-nav="meus" data-arg="' + esc(o.id) + '"><div class="tc-ic">🗂️</div><div style="min-width:0"><h3>' + esc(o.nome) + '</h3><p>' + pl(o.cards.length, 'carta', 'cartas') + (due ? ' · ' + due + ' para revisar' : '') + '</p></div></button>' +
      '<div class="tc-acts"><button class="btn btn-p btn-sm" type="button" data-act="study" data-alvo="own:' + esc(o.id) + '"' + (o.cards.length ? '' : ' disabled') + '>Estudar</button><button class="btn btn-o btn-sm" type="button" data-nav="meus" data-arg="' + esc(o.id) + '">Editar</button></div></article>';
  }).join('') + '</div>'
    : '<div class="card empty"><b>Nenhum baralho ainda</b>Crie um baralho e escreva suas próprias cartas. Elas entram na revisão espaçada como as outras.</div>';
  return '<header class="pg-h"><h1>🗂️ Meus flashcards</h1><p>Seus baralhos, sempre grátis. ' + P.own.length + '/' + MAX_OWN + ' baralhos.</p></header>' +
    '<div class="row"><button class="btn btn-p" type="button" data-act="ownNovo"' + (P.own.length >= MAX_OWN ? ' disabled' : '') + '>+ Novo baralho</button></div>' + grid;
};
function telaOwn(o) {
  return '<button class="back" type="button" data-nav="meus">← Meus flashcards</button>' +
    '<header class="pg-h"><h1 class="wrap-any">🗂️ ' + esc(o.nome) + '</h1><p>' + pl(o.cards.length, 'carta', 'cartas') + '</p></header>' +
    '<div class="row"><button class="btn btn-p" type="button" data-act="study" data-alvo="own:' + esc(o.id) + '"' + (o.cards.length ? '' : ' disabled') + '>Estudar</button><button class="btn btn-o" type="button" data-act="ownRen" data-o="' + esc(o.id) + '">Renomear</button><button class="btn btn-d" type="button" data-act="ownDel" data-o="' + esc(o.id) + '">Excluir baralho</button></div>' +
    '<section class="card"><h2>Nova carta</h2><form id="own-form" data-o="' + esc(o.id) + '" style="display:flex;flex-direction:column;gap:12px;margin-top:12px">' +
      '<div class="fld"><label for="own-f">Frente</label><textarea class="inp" id="own-f" maxlength="500" required rows="2"></textarea></div>' +
      '<div class="fld"><label for="own-v">Verso</label><textarea class="inp" id="own-v" maxlength="1500" required rows="4"></textarea></div>' +
      '<div class="row"><button class="btn btn-p" type="submit"' + (o.cards.length >= MAX_OWN_CARDS ? ' disabled' : '') + '>Adicionar carta</button><span class="muted small">Texto puro. Quebras de linha são mantidas.</span></div></form></section>' +
    '<section class="card"><h2>Cartas</h2><div class="lst" id="own-cards" style="margin-top:12px">' + (o.cards.length ? o.cards.map(c => '<div class="li" data-oc="' + esc(c.id) + '" style="align-items:flex-start"><div class="t"><b style="white-space:pre-wrap">' + esc(c.f) + '</b><div class="muted small" style="white-space:pre-wrap;margin-top:4px">' + esc(c.v) + '</div></div><button class="btn btn-o btn-sm" type="button" data-act="ownEdit" data-o="' + esc(o.id) + '" data-id="' + esc(c.id) + '">Editar</button><button class="btn btn-d btn-sm" type="button" data-act="ownCardDel" data-o="' + esc(o.id) + '" data-id="' + esc(c.id) + '" aria-label="Excluir carta">✕</button></div>').join('') : '<p class="muted small">Nenhuma carta ainda.</p>') + '</div></section>';
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'own-form') return;
  e.preventDefault();
  const o = P.own.find(x => x.id === e.target.dataset.o); if (!o) return;
  const f = $('#own-f').value.trim(), v = $('#own-v').value.trim();
  if (!f || !v) { toast('Preencha frente e verso.'); return; }
  o.cards.push({ id: uid('own'), f: f.slice(0, 500), v: v.slice(0, 1500), own: true });
  salvarProg(); render(); toast('Carta adicionada'); const x = $('#own-f'); if (x) x.focus();
});
function apagarRefs(ids) {
  ids.forEach(id => { delete P.cards[id]; });
  P.fav = P.fav.filter(x => !ids.includes(x));
  P.listas.forEach(l => { l.cards = l.cards.filter(x => !ids.includes(x)); });
}
Object.assign(ACT, {
  ownNovo: async () => {
    if (P.own.length >= MAX_OWN) { toast('Limite de ' + MAX_OWN + ' baralhos.'); return; }
    const r = await ask({ titulo: 'Novo baralho', input: { ph: 'Ex.: Doses de pediatria', max: 60 }, botoes: [{ t: 'Cancelar', v: null }, { t: 'Criar', v: true, cls: 'btn-p' }], validar: v => v.trim() ? null : 'Dê um nome ao baralho.' });
    if (!r) return;
    const o = { id: uid('ob'), nome: r.txt.trim().slice(0, 60), cards: [] }; P.own.push(o); salvarProg(); go('meus', o.id);
  },
  ownRen: async el => {
    const o = P.own.find(x => x.id === el.dataset.o); if (!o) return;
    const r = await ask({ titulo: 'Renomear baralho', input: { val: o.nome, max: 60 }, botoes: [{ t: 'Cancelar', v: null }, { t: 'Salvar', v: true, cls: 'btn-p' }], validar: v => v.trim() ? null : 'Dê um nome ao baralho.' });
    if (r) { o.nome = r.txt.trim().slice(0, 60); salvarProg(); render(); }
  },
  ownDel: async el => {
    const o = P.own.find(x => x.id === el.dataset.o); if (!o) return;
    const ok = await ask({ titulo: 'Excluir baralho?', msg: '"' + esc(o.nome) + '" e suas ' + o.cards.length + ' cartas serão apagados, com o progresso delas.', botoes: [{ t: 'Cancelar', v: false }, { t: 'Excluir', v: true, cls: 'btn-d' }] });
    if (!ok) return;
    apagarRefs(o.cards.map(c => c.id)); P.own = P.own.filter(x => x !== o); salvarProg(); go('meus');
  },
  ownCardDel: el => {
    const o = P.own.find(x => x.id === el.dataset.o); if (!o) return;
    apagarRefs([el.dataset.id]); o.cards = o.cards.filter(c => c.id !== el.dataset.id); salvarProg(); render();
  },
  ownEdit: el => {
    const o = P.own.find(x => x.id === el.dataset.o); const c = o && o.cards.find(x => x.id === el.dataset.id); if (!c) return;
    const m = showModal('<h2>Editar carta</h2><div class="fld"><label for="oe-f">Frente</label><textarea class="inp" id="oe-f" maxlength="500" rows="2"></textarea></div><div class="fld"><label for="oe-v">Verso</label><textarea class="inp" id="oe-v" maxlength="1500" rows="5"></textarea></div><div class="m-acts"><button class="btn btn-o" type="button" data-act="fecharModal">Cancelar</button><button class="btn btn-p" type="button" id="oe-ok">Salvar</button></div>', { wide: true });
    $('#oe-f', m).value = c.f; $('#oe-v', m).value = c.v;
    $('#oe-ok', m).onclick = () => { const f = $('#oe-f', m).value.trim(), v = $('#oe-v', m).value.trim(); if (!f || !v) { toast('Preencha frente e verso.'); return; } c.f = f.slice(0, 500); c.v = v.slice(0, 1500); salvarProg(); closeModal(); render(); };
  },
});

/* =====================================================================
   FASE 3 — Streak, troféus e recordes
   ===================================================================== */
const estudou = k => !!(P.log[k] && P.log[k].rev > 0);
// Sequência atual: ≥1 carta conta o dia; se hoje ainda não estudou, conta a partir de ontem; pular um dia zera.
function streak() {
  if (!P) return 0;
  let k = hoje(); if (!estudou(k)) k = addDias(k, -1);
  let n = 0; while (estudou(k)) { n++; k = addDias(k, -1); }
  return n;
}
function diasEstudados() { return Object.keys(P.log).filter(estudou).sort(); }
function maiorSequencia() {
  let best = 0, run = 0, prev = null;
  diasEstudados().forEach(k => { run = prev && addDias(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  return best;
}
// vigia a virada do dia com o app aberto: redesenha sem clique
let DIA_ATUAL = null;
function vigiaVirada() {
  const h = hoje();
  if (DIA_ATUAL && h !== DIA_ATUAL && U) { DIA_ATUAL = h; render(); }
  DIA_ATUAL = h;
}
setInterval(vigiaVirada, 30000);

/* ---- Troféus ---- */
const MARCOS = [3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const TROF_NOMES = {
  3: ['Calouro dos Flashcards', 'Caloura dos Flashcards'],
  5: ['Aprendiz Dedicado', 'Aprendiz Dedicada'],
  10: ['Interno Focado', 'Interna Focada'],
  15: ['Plantonista Assíduo', 'Plantonista Assídua'],
  20: ['Residente Disciplinado', 'Residente Disciplinada'],
  25: ['Preceptor da Rotina', 'Preceptora da Rotina'],
  30: ['Campeão do Mês', 'Campeã do Mês'],
  40: ['Guardião da Sequência', 'Guardiã da Sequência'],
  50: ['Veterano Imparável', 'Veterana Imparável'],
  60: ['Doutor da Repetição', 'Doutora da Repetição'],
  70: ['Catedrático do Cérebro', 'Catedrática do Cérebro'],
  80: ['Sábio da Semiologia', 'Sábia da Semiologia'],
  90: ['Imperador da Revisão', 'Imperatriz da Revisão'],
  100: ['Mestre dos Flashcards', 'Mestra dos Flashcards'],
};
// gênero inferido pelo primeiro nome (termina em "a" → feminino), com listas de exceção; o aluno pode trocar.
const NOMES_M_EXC = ['luca', 'lucca', 'juca', 'jonata', 'mustafa', 'nikita', 'joshua', 'elisha', 'akira', 'costa', 'moussa', 'idrissa', 'garcia', 'noa'];
const NOMES_F_EXC = ['beatriz', 'raquel', 'isabel', 'ester', 'esther', 'ruth', 'rute', 'carmen', 'lis', 'liz', 'mel', 'rachel', 'miriam', 'mirian', 'ingrid', 'denise', 'alice', 'clarice', 'aline', 'caroline', 'carolina', 'jaqueline', 'simone', 'yasmin', 'jasmin', 'jasmim', 'evelyn', 'kelly', 'nathaly', 'thais', 'tais', 'ines', 'lurdes', 'mercedes', 'iris', 'nicole', 'sophie', 'heloise', 'michele', 'michelle', 'daniele', 'danielle', 'gisele', 'gabriele', 'gabrielle', 'adriele', 'rafaele', 'manoele', 'josiane', 'viviane', 'luciane', 'tatiane', 'rosiane', 'cristiane', 'eliane', 'juliane', 'fabiane', 'raiane', 'elisabete', 'elizabeth', 'isabelle', 'lorraine', 'christine', 'catherine', 'karen', 'karin', 'rosimeire', 'rosemeire', 'cleide', 'neide', 'aurore', 'suellen', 'ellen', 'helen', 'rayane', 'kauane', 'ketlen', 'ariane', 'luane', 'eduarda', 'dafne', 'daphne', 'irene', 'yone', 'ione', 'zoe', 'jade', 'agnes', 'lais', 'dulce', 'celeste', 'ivone', 'ivonete', 'marlene', 'rosane', 'solange', 'vivian', 'lilian', 'jennifer', 'allyne', 'nayane', 'milene', 'rosilene', 'jussara'];
function generoInferido(nome) {
  const n = norm(String(nome || '').trim().split(/\s+/)[0]).replace(/[^a-z]/g, '');
  if (!n) return 'm';
  if (NOMES_M_EXC.includes(n)) return 'm';
  if (NOMES_F_EXC.includes(n)) return 'f';
  return n.endsWith('a') ? 'f' : 'm';
}
function genero() { return P && (P.genero === 'm' || P.genero === 'f') ? P.genero : generoInferido(U ? U.nome : ''); }
function nomeTrof(m) { return TROF_NOMES[m][genero() === 'f' ? 1 : 0]; }
// materiais crescentes: bronze → cobre → prata → ouro → platina → roxo real → dourado radiante
const MATS = [
  { n: 'Bronze', a: '#e0a36a', b: '#8a5a2b', c: '#5e3b1a' },
  { n: 'Cobre', a: '#f0a07a', b: '#b0553a', c: '#6d2f1d' },
  { n: 'Prata', a: '#f4f7fb', b: '#a9b4c4', c: '#5f6a7a' },
  { n: 'Ouro', a: '#ffe28a', b: '#d9aa4a', c: '#8a6212' },
  { n: 'Platina', a: '#ffffff', b: '#cfe0ea', c: '#7d95a6' },
  { n: 'Roxo real', a: '#d9b8ff', b: '#8a4fd8', c: '#4a1f86' },
  { n: 'Dourado radiante', a: '#fff6c2', b: '#ffc93c', c: '#c97a00' },
];
function matDe(i) { return MATS[Math.min(6, Math.floor(i / 2))]; }
// SVG do troféu por camadas. i = índice do marco (0..13). Únicos SVGs com <defs>/gradientes; ids únicos por marco.
function svgTrofeu(m, opts = {}) {
  const i = MARCOS.indexOf(m); const M = matDe(i); const p = 'tr' + m + (opts.sfx || '');
  const g = 'url(#' + p + 'g)', gl = 'url(#' + p + 'l)';
  let s = '<svg viewBox="0 0 120 120" class="trofeu" data-marco="' + m + '" role="img" aria-label="Troféu de ' + m + ' dias">' +
    '<defs><linearGradient id="' + p + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + M.a + '"/><stop offset=".55" stop-color="' + M.b + '"/><stop offset="1" stop-color="' + M.c + '"/></linearGradient>' +
    '<linearGradient id="' + p + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + M.b + '"/><stop offset="1" stop-color="' + M.c + '"/></linearGradient>' +
    (i >= 11 ? '<radialGradient id="' + p + 'r"><stop offset="0" stop-color="' + M.a + '" stop-opacity=".75"/><stop offset="1" stop-color="' + M.b + '" stop-opacity="0"/></radialGradient>' : '') + '</defs>';
  // raios (80+)
  if (i >= 11) {
    s += '<circle cx="60" cy="52" r="56" fill="url(#' + p + 'r)"/>';
    const nr = i >= 13 ? 16 : 12;
    for (let k = 0; k < nr; k++) { const a = k / nr * Math.PI * 2; s += '<line x1="' + (60 + Math.cos(a) * 30).toFixed(1) + '" y1="' + (50 + Math.sin(a) * 30).toFixed(1) + '" x2="' + (60 + Math.cos(a) * 55).toFixed(1) + '" y2="' + (50 + Math.sin(a) * 55).toFixed(1) + '" stroke="' + M.a + '" stroke-width="' + (k % 2 ? 1.2 : 2.2) + '" stroke-linecap="round" opacity=".55"/>'; }
  }
  // asas (70+)
  if (i >= 10) {
    s += '<path d="M34 46 C18 40 8 30 4 18 C14 24 20 24 26 26 C18 30 16 34 18 38 C24 38 28 40 34 46Z" fill="' + gl + '" opacity=".95"/>' +
      '<path d="M86 46 C102 40 112 30 116 18 C106 24 100 24 94 26 C102 30 104 34 102 38 C96 38 92 40 86 46Z" fill="' + gl + '" opacity=".95"/>';
  }
  // louros (50+)
  if (i >= 8) {
    for (let k = 0; k < 5; k++) {
      const y = 86 - k * 11, dx = k * 2.5;
      s += '<ellipse cx="' + (22 + dx) + '" cy="' + y + '" rx="7" ry="3.2" transform="rotate(-40 ' + (22 + dx) + ' ' + y + ')" fill="#4fae6c"/>' +
        '<ellipse cx="' + (98 - dx) + '" cy="' + y + '" rx="7" ry="3.2" transform="rotate(40 ' + (98 - dx) + ' ' + y + ')" fill="#4fae6c"/>';
    }
  }
  // pedestal (1, 2 ou 3 degraus)
  const tiers = i < 4 ? 1 : i < 9 ? 2 : 3;
  s += '<rect x="36" y="98" width="48" height="12" rx="3" fill="' + gl + '"/>';
  if (tiers >= 2) s += '<rect x="40" y="90" width="40" height="9" rx="2.5" fill="' + g + '"/>';
  if (tiers >= 3) s += '<rect x="45" y="83" width="30" height="8" rx="2" fill="' + gl + '"/><rect x="50" y="85.5" width="20" height="3" rx="1.5" fill="' + M.a + '" opacity=".7"/>';
  const topoPed = tiers === 1 ? 98 : tiers === 2 ? 90 : 83;
  // haste
  s += '<rect x="55" y="' + (topoPed - 12) + '" width="10" height="12" fill="' + gl + '"/>';
  const cy0 = topoPed - 12;
  // alças (10+)
  if (i >= 2) s += '<path d="M36 34 C22 34 20 54 40 60" fill="none" stroke="' + M.b + '" stroke-width="' + (i >= 6 ? 5 : 4) + '" stroke-linecap="round"/><path d="M84 34 C98 34 100 54 80 60" fill="none" stroke="' + M.b + '" stroke-width="' + (i >= 6 ? 5 : 4) + '" stroke-linecap="round"/>';
  // taça: formato evolui
  if (i < 2) s += '<path d="M38 30 L82 30 L72 ' + cy0 + ' L48 ' + cy0 + ' Z" fill="' + g + '"/>';
  else if (i < 6) s += '<path d="M36 28 L84 28 C84 52 74 ' + cy0 + ' 60 ' + cy0 + ' C46 ' + cy0 + ' 36 52 36 28Z" fill="' + g + '"/>';
  else s += '<path d="M33 26 L87 26 C88 50 76 ' + (cy0 - 2) + ' 60 ' + (cy0 - 2) + ' C44 ' + (cy0 - 2) + ' 32 50 33 26Z" fill="' + g + '"/><rect x="31" y="23" width="58" height="6" rx="3" fill="' + gl + '"/>';
  // brilho + número
  s += '<path d="M44 32 C44 46 48 54 54 58" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>';
  s += '<text x="60" y="' + (i < 2 ? 50 : 49) + '" text-anchor="middle" font-size="' + (m >= 100 ? 15 : 17) + '" font-weight="800" font-family="Poppins,Arial,sans-serif" fill="' + M.c + '">' + m + '</text>';
  // coroa com gemas (30+)
  if (i >= 6) {
    s += '<path d="M42 22 L46 8 L53 16 L60 4 L67 16 L74 8 L78 22 Z" fill="' + g + '" stroke="' + M.c + '" stroke-width=".8"/>';
    const gems = i >= 12 ? ['#e0445e', '#3d85d8', '#3fbf8c', '#3d85d8', '#e0445e'] : i >= 9 ? ['#e0445e', '#3d85d8', '#e0445e'] : ['#e0445e'];
    const xs = gems.length === 5 ? [46, 53, 60, 67, 74] : gems.length === 3 ? [50, 60, 70] : [60];
    gems.forEach((c, k) => { s += '<circle cx="' + xs[k] + '" cy="' + (xs[k] === 60 ? 15 : 18) + '" r="2.4" fill="' + c + '" stroke="#ffffff" stroke-width=".6"/>'; });
  }
  // faíscas (90+)
  if (i >= 12) {
    const pts = i >= 13 ? [[16, 64], [104, 64], [26, 8], [96, 10], [12, 40], [108, 40]] : [[16, 64], [104, 64], [26, 8], [96, 10]];
    pts.forEach(([x, y]) => { s += '<path d="M' + x + ' ' + (y - 6) + ' L' + (x + 1.6) + ' ' + (y - 1.6) + ' L' + (x + 6) + ' ' + y + ' L' + (x + 1.6) + ' ' + (y + 1.6) + ' L' + x + ' ' + (y + 6) + ' L' + (x - 1.6) + ' ' + (y + 1.6) + ' L' + (x - 6) + ' ' + y + ' L' + (x - 1.6) + ' ' + (y - 1.6) + 'Z" fill="' + M.a + '"/>'; });
  }
  return s + '</svg>';
}
function svgBloqueado() {
  const f = 'style="fill:var(--sf3)"';
  return '<svg viewBox="0 0 120 120" class="trofeu bloq" role="img" aria-label="Troféu bloqueado">' +
    '<rect x="36" y="98" width="48" height="12" rx="3" ' + f + '/><rect x="55" y="86" width="10" height="12" ' + f + '/>' +
    '<path d="M36 28 L84 28 C84 52 74 86 60 86 C46 86 36 52 36 28Z" ' + f + '/>' +
    '<path d="M36 34 C22 34 20 54 40 60" fill="none" style="stroke:var(--sf3)" stroke-width="4" stroke-linecap="round"/><path d="M84 34 C98 34 100 54 80 60" fill="none" style="stroke:var(--sf3)" stroke-width="4" stroke-linecap="round"/>' +
    '<text x="60" y="62" text-anchor="middle" font-size="26" font-weight="800" font-family="Poppins,Arial,sans-serif" style="fill:var(--tx3)">?</text></svg>';
}
function trofPendentes() { const best = maiorSequencia(); return MARCOS.filter(m => best >= m && !P.trof[m]); }
function proximoMarco() { const st = streak(); return MARCOS.find(m => m > st) || null; }

let CONQ_FILA = [];
function mostrarConquistas() {
  if (!U || MODAL || V.view === 'study') return;
  CONQ_FILA = trofPendentes();
  if (!CONQ_FILA.length) return;
  const m = CONQ_FILA[0];
  showModal('<div class="conq" style="display:flex;flex-direction:column;gap:12px">' +
    '<p class="pill gold" style="align-self:center">Nova conquista' + (CONQ_FILA.length > 1 ? ' · 1 de ' + CONQ_FILA.length : '') + '</p>' +
    svgTrofeu(m, { sfx: 'm' }) +
    '<h2>' + esc(nomeTrof(m)) + '</h2><p class="muted">' + m + ' dias seguidos de estudo. Material: ' + matDe(MARCOS.indexOf(m)).n + '.</p>' +
    '<button class="btn btn-g btn-block" type="button" data-act="resgatar" data-m="' + m + '" autofocus>🏆 RESGATAR TROFÉU</button></div>', { dismiss: false, cls: 'conq-m' });
}
ACT.resgatar = el => {
  const m = +el.dataset.m;
  if (!P.trof[m]) P.trof[m] = hoje();
  salvarProg(); closeModal(true); toast('Troféu resgatado: ' + nomeTrof(m));
  render(); // redesenha e, se houver fila, abre o próximo
};
function aoAbrirApp() { DIA_ATUAL = hoje(); mostrarConquistas(); }
function depoisRenderExtra() { if (V.view !== 'study') mostrarConquistas(); }

/* ---- Recordes ---- */
function recordes() {
  const ks = diasEstudados(); const L = k => P.log[k];
  let maisDia = 0, maisNovas = 0, melhorAc = null;
  ks.forEach(k => {
    const l = L(k); maisDia = Math.max(maisDia, l.rev || 0); maisNovas = Math.max(maisNovas, l.nov || 0);
    if (l.rev >= 20) { const a = Math.min(100, Math.round((l.ok || 0) / l.rev * 100)); if (melhorAc === null || a > melhorAc) melhorAc = a; }
  });
  // semana mais forte: semana de segunda a domingo
  const sem = {};
  ks.forEach(k => { const dw = (diaSemana(k) + 6) % 7; const ini = addDias(k, -dw); sem[ini] = (sem[ini] || 0) + (L(k).rev || 0); });
  let semMax = 0, semIni = null; Object.keys(sem).forEach(k => { if (sem[k] > semMax) { semMax = sem[k]; semIni = k; } });
  return [
    { k: 'seq', ic: '🔥', t: 'Maior sequência', v: pl(maiorSequencia(), 'dia', 'dias') },
    { k: 'dia', ic: '📈', t: 'Mais cartas num dia', v: fmt(maisDia) },
    { k: 'acerto', ic: '🎯', t: 'Melhor acerto do dia', v: melhorAc === null ? '—' : melhorAc + '%', sub: 'mín. 20 cartas' },
    { k: 'dias', ic: '📆', t: 'Dias estudados', v: fmt(ks.length) },
    { k: 'semana', ic: '💪', t: 'Semana mais forte', v: fmt(semMax), sub: semIni ? 'a partir de ' + dataBR(semIni) : '' },
    { k: 'novas', ic: '✨', t: 'Mais novas num dia', v: fmt(maisNovas) },
    { k: 'dom', ic: '🧠', t: 'Cartas dominadas', v: fmt(dominadas()) },
    { k: 'trof', ic: '🏆', t: 'Troféus resgatados', v: Object.keys(P.trof).length + '/' + MARCOS.length },
  ];
}
function htmlRecordes() {
  return '<div class="recs" id="recs">' + recordes().map(r => '<div class="kpi" data-rec="' + r.k + '"><span>' + r.ic + ' ' + r.t + '</span><b class="num">' + r.v + '</b>' + (r.sub ? '<span class="small">' + esc(r.sub) + '</span>' : '') + '</div>').join('') + '</div>';
}

/* ---- Perfil: streak, recordes, gênero ---- */
function fitaSemana() {
  let s = '<div class="fita" id="fita" aria-label="Últimos 7 dias">';
  for (let i = 6; i >= 0; i--) { const k = addDias(hoje(), -i); s += '<div><i class="' + (estudou(k) ? 'on' : '') + (i === 0 ? ' hj' : '') + '" data-dia="' + k + '">' + (estudou(k) ? '🔥' : '') + '</i>' + DIAS_LETRA[diaSemana(k)] + '</div>'; }
  return s + '</div>';
}
PSEC.streak = () => {
  const n = streak(), prox = proximoMarco();
  const ant = [0].concat(MARCOS).filter(m => m <= n).pop();
  const pct = prox ? Math.round((n - ant) / (prox - ant) * 100) : 100;
  const hojeFeito = estudou(hoje());
  return '<section class="card" id="p-streak"><div class="stk"><div class="stk-n">🔥 <b data-k="streak">' + n + '</b><span>' + (n === 1 ? 'dia seguido' : 'dias seguidos') + '</span></div>' + fitaSemana() + '</div>' +
    '<p class="muted small" style="margin:12px 0 6px">' + (hojeFeito ? 'Hoje já conta. ' : n ? 'Estude hoje para manter a sequência. ' : 'Estude uma carta para começar. ') +
    (prox ? 'Faltam <b data-k="faltam">' + (prox - n) + '</b> para o troféu de ' + prox + ' dias.' : 'Todos os troféus de sequência conquistados!') + '</p>' +
    '<div class="pbar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
    '<div class="row" style="margin-top:14px"><button class="btn btn-o btn-sm" type="button" data-nav="trofeus">🏆 Ver troféus (' + Object.keys(P.trof).length + '/' + MARCOS.length + ')</button></div></section>';
};
PSEC.recordes = () => '<section class="card" id="p-recs"><h2>Recordes</h2><div style="margin-top:12px">' + htmlRecordes() + '</div></section>';
PSEC.genero = () => {
  const g = genero(), auto = !(P.genero === 'm' || P.genero === 'f');
  return '<section class="card" id="p-genero"><h2>Nomes dos troféus</h2><p class="muted small" style="margin:4px 0 12px">Ex.: ' + esc(TROF_NOMES[100][0]) + ' ou ' + esc(TROF_NOMES[100][1]) + (auto ? ' · escolhido pelo seu nome' : '') + '.</p><div class="chips"><button class="chip' + (g === 'm' ? ' on' : '') + '" type="button" data-act="setGen" data-g="m">Masculino</button><button class="chip' + (g === 'f' ? ' on' : '') + '" type="button" data-act="setGen" data-g="f">Feminino</button></div></section>';
};
ACT.setGen = el => { P.genero = el.dataset.g; salvarProg(); render(); };

TELAS.trofeus = () => {
  const n = streak();
  return '<button class="back" type="button" data-nav="perfil">← Voltar</button>' +
    '<header class="pg-h"><h1>🏆 Troféus</h1><p>Um troféu a cada marco de dias seguidos. Resgatado, fica para sempre.</p></header>' +
    '<div class="trg" id="trg">' + MARCOS.map(m => {
      if (P.trof[m]) return '<div class="tr" data-marco="' + m + '">' + svgTrofeu(m) + '<b>' + esc(nomeTrof(m)) + '</b><small>' + m + ' dias · ' + dataBR(P.trof[m]) + '</small></div>';
      return '<div class="tr lk" data-marco="' + m + '">' + svgBloqueado() + '<b>???</b><small>' + m + ' dias · faltam ' + Math.max(0, m - n) + '</small></div>';
    }).join('') + '</div>' +
    '<section class="card"><h2>Recordes</h2><div style="margin-top:12px">' + htmlRecordes() + '</div></section>';
};

/* =====================================================================
   ACESSO — sem planos: todos os flashcards estão liberados
   ===================================================================== */
function liberada(id) { return true; }
function deckVisivel(d) { return true; }
function subTrancado(s) { return false; }
function totalCartas() { return DECKS.reduce((a, d) => a + d.subs.reduce((b, s) => b + s.cards.length, 0), 0); }

/* =====================================================================
   FASE 5 — Busca, atalhos configuráveis (desfazer, estatística da sessão,
   revisão rápida e prioridade manual já estão nas seções anteriores)
   ===================================================================== */
const BUSCA_MIN = 2, BUSCA_SUBS = 12, BUSCA_CARDS = 20;
let IDX = null;
function indiceBusca() {
  if (IDX) return IDX;
  IDX = { subs: [], cards: [] };
  DECKS.forEach(d => d.subs.forEach(s => {
    IDX.subs.push({ s, d, n: norm(s.nome + ' ' + d.nome.replace(/^🆕\s*/, '')) });
    s.cards.forEach(c => IDX.cards.push({ c, s, d, n: norm(semTags(c.f) + ' ' + semTags(c.v)) }));
  }));
  return IDX;
}
function escopoBusca(ctx) { return () => true; }
function buscar(q, ctx) {
  const nq = norm(q).trim().replace(/\s+/g, ' ');
  if (nq.length < BUSCA_MIN) return null;
  const termos = nq.split(' ');
  const ok = n => termos.every(t => n.includes(t));
  const f = escopoBusca(ctx), ix = indiceBusca();
  const subs = [], cards = [];
  for (const x of ix.subs) { if (subs.length >= BUSCA_SUBS) break; if (f(x.d) && ok(x.n)) subs.push(x); }
  for (const x of ix.cards) { if (cards.length >= BUSCA_CARDS) break; if (f(x.d) && ok(x.n)) cards.push(x); }
  return { subs, cards, termos };
}
function marcar(txt, termos) { // txt já é texto puro; escapa e marca os termos ignorando acento/maiúscula
  const src = String(txt); const n = norm(src);
  // norm preserva o comprimento para textos latinos (NFD + remoção de diacríticos por caractere)
  const ok = n.length === src.length;
  let out = '', i = 0;
  if (!ok) return esc(src);
  while (i < src.length) {
    let hit = 0; for (const t of termos) if (t && n.startsWith(t, i)) hit = Math.max(hit, t.length);
    if (hit) { out += '<mark>' + esc(src.slice(i, i + hit)) + '</mark>'; i += hit; } else { out += esc(src[i]); i++; }
  }
  return out;
}
function recorte(txt, termos, n = 140) {
  const t = String(txt); if (t.length <= n) return t;
  const p = norm(t).indexOf(termos[0]); const ini = Math.max(0, Math.min(t.length - n, p - 40));
  return (ini > 0 ? '…' : '') + t.slice(ini, ini + n) + (ini + n < t.length ? '…' : '');
}
function htmlResultados(q, ctx) {
  const r = buscar(q, ctx);
  if (!r) return q.trim() ? '<p class="muted small">Digite pelo menos ' + BUSCA_MIN + ' letras.</p>' : '';
  if (!r.subs.length && !r.cards.length) return '<p class="muted small">Nada encontrado para "' + esc(q) + '".</p>';
  let s = '';
  if (r.subs.length) s += '<div><h4>' + (SO_TEMAS() ? 'Temas' : 'Subtemas') + ' (' + r.subs.length + ')</h4><div class="lst">' + r.subs.map(({ s: sb, d }) =>
    '<div class="shit" data-hit-sub="' + esc(sb.id) + '"><div class="t">' + marcar(sb.nome, r.termos) + '<small>' + (d.subs.length > 1 ? esc(d.nome) + ' · ' : '') + pl(sb.cards.length, 'carta', 'cartas') + '</small></div>' +
      '<button class="btn btn-p btn-sm" type="button" data-act="study" data-alvo="sub:' + esc(sb.id) + '">Estudar</button></div>').join('') + '</div></div>';
  if (r.cards.length) s += '<div><h4>Flashcards (' + r.cards.length + ')</h4><div class="lst">' + r.cards.map(({ c, s: sb, d }) => {
    const fr = semTags(c.f), vs = semTags(c.v);
    const noVerso = !r.termos.every(t => norm(fr).includes(t));
    return '<div class="shit" data-hit-card="' + esc(c.id) + '"><div class="t">' + marcar(recorte(fr, r.termos), r.termos) + '<small>' + esc(nomeSub(sb, d)) + (noVerso ? ' · no verso: ' + marcar(recorte(vs, r.termos, 90), r.termos) : '') + '</small></div><button class="btn btn-o btn-sm" type="button" data-act="study" data-alvo="card:' + esc(c.id) + '">Ver carta</button></div>';
  }).join('') + '</div></div>';
  return s;
}
const BUSCA_Q = {};
function caixaBusca(ctx) {
  const q = BUSCA_Q[ctx] || '';
  const ph = ctx === 'uerj' ? 'Buscar no UERJ R+ CM' : 'Buscar subtemas e flashcards';
  return '<div class="srch-w" style="display:flex;flex-direction:column;gap:12px"><div class="srch"><input class="inp" type="search" id="busca-' + ctx + '" data-busca="' + ctx + '" placeholder="' + ph + '" value="' + esc(q) + '" autocomplete="off" aria-label="' + ph + '"></div><div class="sres" id="sres-' + ctx + '" aria-live="polite">' + (q ? htmlResultados(q, ctx) : '') + '</div></div>';
}
let BUSCA_T = null;
document.addEventListener('input', e => {
  const el = e.target.closest('[data-busca]'); if (!el) return;
  const ctx = el.dataset.busca; BUSCA_Q[ctx] = el.value;
  clearTimeout(BUSCA_T);
  BUSCA_T = setTimeout(() => { const box = $('#sres-' + ctx); if (box) box.innerHTML = htmlResultados(BUSCA_Q[ctx] || '', ctx); }, 150); // só o container; o input mantém o foco
});
/* ---- Atalhos configuráveis (só neste aparelho; ocultos no celular) ---- */
const ACOES_TECLA = [['show', 'Mostrar resposta'], ['g1', 'Errei'], ['g2', 'Difícil'], ['g3', 'Bom'], ['g4', 'Fácil']];
const TECLAS_PROIBIDAS = ['Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead', 'Unidentified', 'Process'];
let CAPT_ACAO = null;
PSEC.atalhos = () => {
  const k = atalhos();
  return '<section class="card desk-only" id="p-atalhos"><div class="sec-t"><h2>⌨️ Atalhos de teclado</h2><button class="btn btn-o btn-sm" type="button" data-act="kbReset">Restaurar padrão</button></div><p class="muted small" style="margin:4px 0 10px">Clique numa tecla e aperte a nova. Esc cancela. Valem só neste aparelho.</p>' +
    '<div id="kb-lista">' + ACOES_TECLA.map(([a, t]) => '<div class="kb-row"><span>' + t + '</span><button class="btn btn-o btn-sm kb-key' + (CAPT_ACAO === a ? ' cap' : '') + '" type="button" data-act="kbCap" data-a="' + a + '">' + (CAPT_ACAO === a ? 'Aperte uma tecla…' : esc(nomeTecla(k[a]))) + '</button></div>').join('') + '</div></section>';
};
function pararCaptura() { CAPT_ACAO = null; CAPTURA = null; }
ACT.kbCap = el => {
  const a = el.dataset.a;
  CAPT_ACAO = a;
  CAPTURA = e => {
    e.preventDefault(); e.stopPropagation();
    if (e.key === 'Escape') { pararCaptura(); render(); return; }
    if (e.repeat || TECLAS_PROIBIDAS.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    const cur = atalhos(); const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const dono = Object.keys(cur).find(x => x !== a && String(cur[x]).toLowerCase() === key.toLowerCase());
    if (dono) { toast('"' + nomeTecla(key) + '" já é usada em ' + ACOES_TECLA.find(x => x[0] === dono)[1] + '.'); return; }
    const salvo = LS.get(K.keys, {}) || {}; salvo[a] = key; LS.set(K.keys, salvo);
    pararCaptura(); toast(ACOES_TECLA.find(x => x[0] === a)[1] + ': ' + nomeTecla(key)); render();
  };
  render();
};
ACT.kbReset = async () => {
  const ok = await ask({ titulo: 'Restaurar atalhos?', msg: 'Voltam a valer Espaço para mostrar e 1 a 4 para as notas.', botoes: [{ t: 'Cancelar', v: false }, { t: 'Restaurar', v: true, cls: 'btn-p' }] });
  if (ok) { LS.del(K.keys); pararCaptura(); toast('Atalhos restaurados'); render(); }
};
