const { C, S, ul, tb } = require('./_h');

module.exports = {
  id: 'nef', nome: 'Nefrologia', ic: '🫘',
  desc: 'Tubulopatias e acidose tubular, nefropatia por IgA, injúria renal aguda, sódio e água.',
  subs: [
    S('nef-tub', 'Tubulopatias: Gitelman, Bartter, Liddle e acidose tubular', [
      C('gitelman', 2026, 'Hipocalemia + hipomagnesemia + hipocalciúria, sem hipertensão: qual diagnóstico?',
        '<b>Síndrome de Gitelman</b>: defeito no cotransportador <b>NCC</b> do túbulo distal ("tiazídico genético"). Quadro mais brando, juvenil/adulto: fadiga, câimbras, fraqueza, parestesias, arritmias.',
        '<b>Macete:</b> Gitelman = tiazídico genético → hipocalciúria.'),
      C('bartter', 2026, 'Bartter × Gitelman: qual a diferença-chave?',
        'O <b>cálcio urinário</b>: <b>Bartter ↑</b> (defeito na alça espessa, como a furosemida) e <b>Gitelman ↓</b>. Os dois são perdedores de sal, com hipocalemia e alcalose.',
        '<b>Macete:</b> Bartter = furosemida (hipercalciúria); Gitelman = tiazídico (hipocalciúria).'),
      C('liddle', [2024, 2026], 'Síndrome de Liddle: mecanismo, quadro e tratamento?',
        'Ativação constitutiva do <b>ENaC</b> (canal de sódio do coletor) → retenção de sódio → <b>hipertensão</b> + hipocalemia com <b>renina e aldosterona suprimidas</b>. Tratamento: <b>amilorida</b>.',
        '<b>Armadilha:</b> hipocalemia com hipertensão e aldosterona baixa = Liddle; no hiperaldosteronismo a aldosterona está alta.'),
      C('fanconi', [2024, 2026], 'O que é a síndrome de Fanconi?',
        'Disfunção tubular <b>proximal generalizada</b>: glicosúria, aminoacidúria, fosfatúria e acidose tubular proximal.'),
      C('atr', 2024, 'Acidose tubular renal tipos 1, 2 e 4:',
        tb(['', 'Tipo 2 (proximal)', 'Tipo 1 (distal)', 'Tipo 4'], ['Defeito', 'Reabsorção de HCO₃⁻ no proximal', 'Excreção de H⁺ no coletor', 'Excreção de H⁺ e K⁺ (hipoaldo)'], ['Acidose', 'Moderada', 'Mais grave', 'Leve'], ['K⁺', 'Baixo', 'Baixo', '<b>Alto</b>'], ['pH urinário', '&lt; 5,3', '<b>&gt; 5,5</b>', '&lt; 5,3'], ['Tratamento', 'Citrato de K', 'Citrato de K', 'Fludrocortisona; diurético de alça'])),
      C('atr-causas', 2024, 'Quais as causas adquiridas mais comuns de cada acidose tubular?',
        ul('<b>Proximal</b>: mieloma múltiplo; tenofovir; Fanconi', '<b>Distal</b>: <b>síndrome de Sjögren</b>; cursa com nefrolitíase e nefrocalcinose', '<b>Tipo 4</b>: diabetes, DRC estádio III; drogas — AINE, espironolactona, inibidores de calcineurina, sulfametoxazol-trimetoprim')),
    ]),

    S('nef-iga', 'Nefropatia por IgA', [
      C('epi', [2023, 2025], 'Nefropatia por IgA: qual a frequência e em quem?',
        'Glomerulopatia primária <b>mais comum do mundo</b> (no Brasil, a 3ª). Brancos e asiáticos, 20–50 anos.'),
      C('pato', 2025, 'Qual a patogênese da nefropatia por IgA?',
        'IgA1 com estrutura anômala (defeito de glicosilação) → imunocomplexos <b>IgG-IgA</b> depositados no <b>mesângio</b>.'),
      C('clin', [2023, 2025], 'Qual a apresentação mais comum da nefropatia por IgA?',
        '<b>Hematúria</b> (microscópica) com proteinúria assintomática, geralmente subnefrótica, achada em exame de rotina. Síndrome nefrótica ou GN rapidamente progressiva em &lt; 10%.'),
      C('secund', 2023, 'Quais as causas de nefropatia por IgA secundária?',
        '<b>Cirrose</b>, DII, HIV, sarcoidose, espondilite anquilosante. Na cirrose: menor clearance de IgA pelo shunt portossistêmico e disfunção hepatocelular.'),
      C('bx', [2023, 2025], 'Nefropatia por IgA: o que a biópsia mostra?',
        'MO: proliferação mesangial (até necrose fibrinoide e crescentes). IF: depósitos mesangiais de <b>IgA dominante</b>, C3 e lambda. ME: depósitos mesangiais eletrondensos.'),
      C('tto', [2023, 2025], 'Qual o tratamento da nefropatia por IgA?',
        'Todos: controle pressórico com <b>IECA ou BRA</b>. Corticoide se proteinúria <b>&gt; 1 g/dia por 3–6 meses</b> apesar do tratamento otimizado e doença ativa na biópsia. <b>Não</b> dar corticoide com creatinina elevada ou dano renal extenso.'),
    ]),

    S('nef-ira', 'Injúria renal aguda', [
      C('prerrenal', 2026, 'Paciente um dia inteiro em choque cardiogênico, creatinina sobe horas após a angioplastia: qual a causa da IRA?',
        '<b>Pré-renal por baixo débito</b> (hipoperfusão renal). A lesão já estava instalada quando a hemodinâmica melhorou.'),
      C('ateroemb', 2026, 'Ateroembolismo renal: quando e como aparece?',
        'IRA após procedimento endovascular, de instalação <b>subaguda</b> — creatinina sobe <b>dias</b> depois — com <b>livedo</b>, púrpura reticulada e <b>eosinofilia</b>.'),
      C('sedimento', 2026, 'O que o sedimento urinário mostra em cada causa de lesão renal?',
        tb(['Causa', 'Sedimento'], ['NTA', 'Cilindros <b>granulosos</b> e epiteliais'], ['Nefrite intersticial', 'Leucocitúria, cilindros <b>leucocitários</b>'], ['Pielonefrite', 'Leucocitúria, bactérias, cilindros leucocitários'], ['Nefrítica', 'Cilindros <b>hemáticos</b>, dismorfismo'], ['Nefrótica', 'Proteinúria, cilindros <b>lipídicos</b>'], ['Litíase', 'Cristais, pH alterado, hematúria'])),
      C('contraste', 2024, 'Nefropatia induzida por contraste: onde é bem estabelecida e quais os fatores de risco?',
        'Bem estabelecida com contraste <b>arterial</b> (cateterismo); questionável na TC com contraste venoso. Fatores de risco: <b>DM2 e DRC</b>.'),
    ]),

    S('nef-na', 'Sódio e água: SIADH e diabetes insipidus', [
      C('siadh-urico', 2026, 'Por que há hipouricemia na SIADH e qual o valor que apoia o diagnóstico?',
        'Uricosúria pela expansão de volume e inibição da reabsorção proximal. <b>Ácido úrico &lt; 4 mg/dL</b> é critério suplementar clássico (ex.: carcinoma oat cell).'),
      C('siadh-excluir', 2026, 'O que excluir antes de fechar SIADH?', '<b>Hipotireoidismo, insuficiência adrenal</b> e causas <b>hipovolêmicas</b>.'),
      C('poliuria', 2023, 'Poliúria: como o sódio sérico separa polidipsia primária de diabetes insipidus?',
        '<b>Hiponatremia</b> + poliúria → <b>polidipsia primária</b>. <b>Hipernatremia</b> + osmolaridade urinária baixa → <b>diabetes insipidus</b>. Na dúvida: restrição hídrica + desmopressina (o DI <b>central</b> responde com aumento da osmolaridade urinária).'),
      C('litio', 2023, 'Diabetes insipidus nefrogênico pelo lítio: qual o tratamento?',
        'Suspender o lítio, ou <b>amilorida + hidroclorotiazida</b> com monitoração do nível sérico de lítio.'),
    ]),
  ],
};
