const { C, S, ul, tb, svgFluxo } = require('./_h');

module.exports = {
  id: 'uti', nome: 'Terapia Intensiva', ic: '🏥',
  desc: 'SDRA e ventilação protetora; perfil hemodinâmico dos choques.',
  subs: [
    S('uti-sdra', 'SDRA e ventilação protetora', [
      C('pf', 2026, 'Como se calcula a relação P/F e como se classifica a SDRA?',
        'PaO₂ ÷ FiO₂ em fração (FiO₂ 30% = 0,3). ' + tb(['Gravidade', 'P/F'], ['Leve', '200–300'], ['Moderada', '100–200'], ['Grave', '&lt; 100'])),
      C('protetora', 2026, 'Quais os alvos da ventilação protetora na SDRA?',
        'Volume corrente <b>4–6 mL/kg de peso predito</b> (6–8 nos leves/moderados em algumas referências), <b>pressão de platô ≤ 30 cmH₂O</b> e <b>driving pressure (platô − PEEP) ≤ 15 cmH₂O</b>.'),
      C('pf150', 2026, 'SDRA com P/F &lt; 150: quais as medidas por grau de evidência?',
        svgFluxo('Medidas na SDRA com P/F abaixo de 150',
          [{ x: 6, y: 70, w: 70, h: 40, t: ['P/F', 'abaixo 150'], cor: 'azul' },
           { x: 100, y: 4, w: 232, h: 36, t: ['Evidência alta: posição prona'], cor: 'verde' },
           { x: 100, y: 50, w: 232, h: 40, t: ['Moderada: PEEP alta,', 'bloqueio neuromuscular'], cor: 'ouro' },
           { x: 100, y: 100, w: 232, h: 40, t: ['Baixa: óxido nítrico,', 'manobras de recrutamento'], cor: 'claro' },
           { x: 100, y: 150, w: 232, h: 36, t: ['Falha terapêutica: ECMO VV'], cor: 'verm' }],
          [[76, 84, 98, 24], [76, 88, 98, 70], [76, 96, 98, 120], [76, 102, 98, 166]]),
        '<b>Macete:</b> prona é a única medida de alto grau de evidência.'),
    ]),

    S('uti-choque', 'Choque: perfil hemodinâmico', [
      C('tabela', 2026, 'Perfil hemodinâmico de cada tipo de choque:',
        tb(['Choque', 'DC', 'RVS', 'PAPO', 'PVC', 'SvO₂'], ['Séptico', 'N/↑', '<b>↓</b>', 'N/↓', '↓', '<b>↑</b>'], ['Cardiogênico', '↓', '↑', '<b>↑</b>', '↑', '↓'], ['Hipovolêmico', '↓', '↑', '<b>↓</b>', '↓', '↓'], ['TEP', '↓', '↑', 'N/↓', '<b>↑</b>', '↓'], ['Tamponamento', '↓', '↑', 'N/↑', '↑', '↓']) + 'PAP: ↑ no cardiogênico, TEP e tamponamento; ↓ no séptico e hipovolêmico. GapCO₂: ↓ no séptico, ↑ nos demais.'),
      C('tamponamento', 2026, 'Choque obstrutivo por tamponamento: o que acontece com pré-carga, contratilidade, débito e pós-carga?',
        'Pré-carga, contratilidade e débito <b>caem</b>; a pós-carga (RVS) <b>aumenta</b> por compensação.'),
      C('cardio-vs-hipo', 2026, 'Choque cardiogênico × hipovolêmico: qual variável separa os dois?',
        'A <b>PAPO</b> (e a PVC): <b>alta no cardiogênico</b>, <b>baixa no hipovolêmico</b>. Nos dois, débito baixo e RVS alta.'),
      C('normais', 2026, 'Quais os valores normais das variáveis hemodinâmicas?',
        ul('IC 2,5–4,5 L/min/m²', 'DC 4–7 L/min', 'RVS 900–1.400 dyn·s/cm⁵', 'PAPO 8–12 mmHg', 'PAP média 7–19 mmHg', 'PVC 8–12 mmHg')),
    ]),
  ],
};
