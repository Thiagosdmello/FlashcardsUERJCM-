// Helpers para escrever o conteúdo UERJ R+ CM.
// C(chave, anos, frente, verso, macete?) — o id final é <subtema>-<chave> (estável: não mudar chaves já publicadas).
// S(id, nome, cartas) — o peso p é calculado em tools/gen_uerj.js pela frequência nas anotações.
const C = (k, y, f, v, ex) => ({ k, y: Array.isArray(y) ? y : [y], f, v, ...(ex ? { ex } : {}) });
const S = (id, nome, cards) => ({ id, nome, cards });
const ul = (...itens) => '<ul>' + itens.map(i => '<li>' + i + '</li>').join('') + '</ul>';
const tb = (cab, ...linhas) => '<table><thead><tr>' + cab.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' +
  linhas.map(l => '<tr>' + l.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';

// Fluxograma em SVG (regras da seção 3: class="dg", viewBox 340 de largura, sem id/defs/marker/style).
// caixas: [{x, y, w, h, t: ['linha1','linha2'], cor}] · setas: [[x1,y1,x2,y2]]
// Confere o tamanho do texto: 5,3 px por caractere a font-size 10 + folga de 6 px.
const PAL = { azul: ['#3d85d8', '#ffffff'], ouro: ['#d9aa4a', '#0f1b30'], verde: ['#3fbf8c', '#0f1b30'], verm: ['#e45b6e', '#ffffff'], cinza: ['#5f6f8a', '#ffffff'], claro: ['#dbe6f5', '#0f1b30'] };
function svgFluxo(alt, caixas, setas, rot = []) {
  const H = Math.max(...caixas.map(b => b.y + b.h)) + 8;
  let s = '<svg class="dg" viewBox="0 0 340 ' + H + '" role="img" aria-label="' + alt + '">';
  setas.forEach(([x1, y1, x2, y2]) => {
    s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#8a9bb8" stroke-width="1.6"/>';
    // ponta de seta desenhada à mão (sem <marker>)
    const a = Math.atan2(y2 - y1, x2 - x1), L = 6;
    const p1 = [x2 - L * Math.cos(a - 0.45), y2 - L * Math.sin(a - 0.45)], p2 = [x2 - L * Math.cos(a + 0.45), y2 - L * Math.sin(a + 0.45)];
    s += '<polygon points="' + x2 + ',' + y2 + ' ' + p1.map(n => n.toFixed(1)).join(',') + ' ' + p2.map(n => n.toFixed(1)).join(',') + '" fill="#8a9bb8"/>';
  });
  rot.forEach(r => { s += '<text x="' + r.x + '" y="' + r.y + '" text-anchor="middle" font-size="9" fill="#8a9bb8">' + r.t + '</text>'; });
  caixas.forEach(b => {
    const [bg, fg] = PAL[b.cor || 'azul'];
    const fs = b.fs || 10;
    b.t.forEach(l => { const need = l.length * 5.3 * fs / 10 + 6; if (need > b.w) throw new Error('SVG "' + alt + '": "' + l + '" não cabe (' + need.toFixed(0) + ' > ' + b.w + ')'); });
    s += '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="7" fill="' + bg + '"/>';
    const lh = fs + 3, y0 = b.y + b.h / 2 - (b.t.length - 1) * lh / 2 + fs * 0.35;
    b.t.forEach((l, i) => { s += '<text x="' + (b.x + b.w / 2) + '" y="' + (y0 + i * lh).toFixed(1) + '" text-anchor="middle" font-size="' + fs + '" fill="' + fg + '">' + l + '</text>'; });
  });
  return s + '</svg>';
}
module.exports = { C, S, ul, tb, svgFluxo };
