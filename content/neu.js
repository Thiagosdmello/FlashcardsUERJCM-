const { C, S, ul, tb } = require('./_h');

module.exports = {
  id: 'neu', nome: 'Neurologia', ic: '🧠',
  desc: 'AVC e territórios vasculares, junção neuromuscular, Guillain-Barré, NMO, edema e metástases do SNC, parkinsonismo, enxaqueca e vertigem.',
  subs: [
    S('neu-avc', 'AVC isquêmico: trombectomia e AIT', [
      C('trombect', 2023, 'Oclusão de grande vaso (M1): trombectomia ou alteplase recanaliza mais?',
        '<b>Trombectomia mecânica</b>. Ela pode ser feita <b>após</b> a trombólise química: um tratamento não invalida o outro.'),
      C('mismatch', 2023, 'O que é o mismatch perfusão-difusão?',
        'Área de isquemia na <b>perfusão (PWI)</b> — penumbra — maior que a área de infarto na <b>difusão (DWI)</b> — edema citotóxico. Mostra quanto tecido ainda dá para salvar; seleciona candidatos à trombectomia.'),
      C('av6', 2023, 'Quais as indicações clássicas de trombectomia mecânica?',
        ul('Idade ≥ 18 anos', 'Rankin prévio 0 ou 1', '<b>NIHSS ≥ 6</b>', '<b>ASPECTS ≥ 6</b>', 'Até <b>6 horas</b> de sintomas', 'Circulação anterior: <b>carótida interna ou ACM M1</b>'),
        '<b>Macete:</b> regra do AV6 — NIHSS 6, ASPECTS 6, 6 horas.'),
      C('aspects', 2023, 'Como funciona a escala ASPECTS?',
        'Escala tomográfica de <b>10 pontos</b> para AVC da ACM; perde 1 ponto por região acometida: <b>caudado, putâmen (lentiforme), cápsula interna, ínsula e M1–M6</b>. Quanto menor, mais grave.'),
      C('ait', 2026, 'Suspeita de AIT: está indicada HBPM na fase aguda?', '<b>Não.</b>'),
    ]),

    S('neu-post', 'Territórios vasculares, cerebelo e Wallenberg', [
      C('terr', 2026, 'Quadro típico de cada território arterial cerebral:',
        tb(['Artéria', 'Quadro'], ['ACM', 'Hemiparesia/hipoestesia contralateral de <b>face e braço</b>; afasia (dominante); negligência (não dominante)'], ['ACA', '<b>Paresia crural</b> contralateral, abulia, mutismo'], ['ACP', '<b>Hemianopsia homônima</b> contralateral com preservação da visão central'], ['Vertebrobasilar', 'Síndromes cruzadas, ataxia, disartria, disfagia; locked-in (basilar)'], ['Oftálmica', '<b>Amaurose fugaz</b>'])),
      C('cerebelo', 2026, 'Territórios cerebelares: SCA, AICA e PICA — que quadro dá cada uma?',
        tb(['Artéria', 'Quadro'], ['Cerebelar superior (SCA)', 'Ataxia ipsilateral de membros, disartria, nistagmo'], ['Cerebelar ântero-inferior (AICA)', 'Síndrome vestibular periférica, <b>hipoacusia</b> (VIII par), ataxia ipsilateral'], ['Cerebelar póstero-inferior (PICA)', '<b>Wallenberg</b>: vertigem intensa, ataxia, disfagia, Horner ipsilateral'])),
      C('vermis', 2026, 'Lesão do vermis cerebelar causa o quê?', '<b>Ataxia de tronco</b> (controle postural e marcha).'),
      C('wall-def', 2022, 'Síndrome de Wallenberg: qual a artéria e as causas mais comuns?',
        'Oclusão da <b>artéria vertebral intracraniana</b> (território da PICA; bulbo lateral) — apresentação mais frequente na circulação posterior. Causas, em ordem: aterotrombose, cardioembolia, dissecção vertebral.'),
      C('wall-clin', 2022, 'Quais as manifestações da síndrome de Wallenberg?',
        'Vertigem, nistagmo, diplopia, <b>Horner ipsilateral</b>, disfonia, disfagia, disartria, perda do reflexo de vômito, ataxia ipsilateral, dor/parestesia e perda do reflexo corneano na <b>face ipsilateral</b>, com alteração sensitiva cruzada.'),
      C('horner', 2022, 'O que compõe a síndrome de Horner?', '<b>Ptose</b> palpebral parcial, <b>miose</b> e <b>anidrose</b>.'),
    ]),

    S('neu-jnm', 'Junção neuromuscular: miastenia e Eaton-Lambert', [
      C('mg-epi', 2023, 'Miastenia gravis: epidemiologia?',
        'Principal doença da junção neuromuscular, pico <b>bimodal</b>: mulheres jovens e homens mais velhos.'),
      C('mg-dx', 2023, 'Como se confirma a miastenia gravis?',
        '<b>Anti-receptor de acetilcolina</b> (80–90%); se negativo, <b>anti-MuSK</b>. <b>ENMG com estimulação repetitiva</b>. Até 20% são soronegativos.'),
      C('mg-tto', 2023, 'Qual o tratamento da miastenia gravis?',
        'Sintomático: <b>piridostigmina</b> (anticolinesterásico). Modificador: imunossupressores (corticoide, azatioprina, micofenolato, rituximabe).'),
      C('lems-vs-mg', 2025, 'Eaton-Lambert × miastenia gravis:',
        tb(['', 'Eaton-Lambert', 'Miastenia'], ['Local', '<b>Pré</b>-sináptico', '<b>Pós</b>-sináptico'], ['Fraqueza', '<b>Melhora</b> com atividade', '<b>Piora</b> com atividade'], ['Autonômicos', 'Frequentes', 'Raros'], ['Paraneoplasia', 'Maioria', 'Pouco frequente'], ['Tumor', '<b>Pequenas células de pulmão</b>', '<b>Timoma</b>']),
        '<b>Macete:</b> Eaton-Lambert melhora ao repetir o esforço (resposta incremental).'),
    ]),

    S('neu-gbs', 'Síndrome de Guillain-Barré', [
      C('monit', 2022, 'Guillain-Barré: o que monitorar e quando intubar?',
        'Função <b>motora, autonômica e respiratória</b>. Intubar eletivamente se a clínica ou a função pulmonar sugerir insuficiência respiratória iminente.'),
      C('preditores', 2022, 'Guillain-Barré: quais sinais predizem insuficiência respiratória?',
        ul('Dispneia ao falar ou em repouso, músculos acessórios, <b>não conta até 15</b> numa respiração', 'FR &gt; 30', 'SatO₂ &lt; 92%', '<b>CVF &lt; 20 mL/kg</b> ou queda &gt; 30%', 'PImax pior que −30 cmH₂O', 'PEmax &lt; 40 cmH₂O', 'PCO₂ &gt; 50 mmHg', 'Disfunção bulbar'),
        '<b>Macete:</b> regra 20/30/40 — CVF 20 mL/kg, PImax −30, PEmax 40.'),
      C('tto', 2022, 'Guillain-Barré: corticoide? Quando fazer imunoglobulina ou plasmaférese?',
        'Corticoide <b>não</b> é indicado. <b>Imunoglobulina ou plasmaférese</b>: sintomas há <b>&lt; 4 semanas</b> e incapaz de andar, ou doença rapidamente progressiva; possível até 8 semanas se grave e piorando.'),
    ]),

    S('neu-nmo', 'Neuromielite óptica', [
      C('clin', 2022, 'Quais as características clínicas centrais da neuromielite óptica?',
        '<b>Neurite óptica</b> bilateral ou rapidamente sequencial, <b>mielite transversa aguda</b> e <b>síndrome da área postrema</b> (soluços intratáveis, náuseas e vômitos).'),
      C('dx', 2022, 'Como se diagnostica a neuromielite óptica?',
        '≥ 1 característica clínica central + anticorpo <b>anti-aquaporina-4</b> positivo + exclusão de alternativas. Punção lombar geralmente desnecessária no quadro típico; ajuda a separar de esclerose múltipla na dúvida.'),
    ]),

    S('neu-onco', 'Edema cerebral, metástases e complicações neurológicas do câncer', [
      C('edema', 2023, 'Edema vasogênico × citotóxico:',
        tb(['', 'Vasogênico', 'Citotóxico'], ['Mecanismo', 'Quebra da barreira hematoencefálica → líquido extracelular', 'Falha da bomba Na⁺/K⁺ → água dentro das células'], ['Causas', '<b>Tumores, abscessos</b>', '<b>AVC isquêmico</b>, hipóxia grave'], ['Imagem', 'Substância <b>branca</b>, respeita o córtex', 'Branca e <b>cinzenta</b>, no território arterial'])),
      C('mets', 2023, 'Quais os principais tumores que dão metástase cerebral e por qual via?',
        '<b>Pulmão, melanoma, mama</b> (sobretudo HER2+), renal e colorretal. Via <b>hematogênica</b>.'),
      C('mets-clin', 2022, 'Metástase cerebral × carcinomatose meníngea: como se apresentam?',
        'Metástase: geralmente um <b>déficit focal</b>. Carcinomatose meníngea: envolvimento <b>multifocal</b> — cefaleia, náuseas e vômitos, fraqueza nas pernas, disfunção cerebelar, alteração mental, diplopia, paralisia facial.'),
      C('encef', 2022, 'Encefalite paraneoplásica: anticorpos, tumor e clínica?',
        '<b>Anti-Hu</b> e <b>anti-CV2/colapsina</b>; tumor principal: <b>carcinoma de pulmão de pequenas células</b>. Convulsões, alterações comportamentais e autonômicas.'),
      C('pseudotumor', 2022, 'Como se apresenta o pseudotumor cerebral (hipertensão intracraniana idiopática)?',
        'Cefaleia progressiva, <b>pior ao deitar</b>, com sintomas oculares e náuseas.'),
    ]),

    S('neu-park', 'Parkinsonismo', [
      C('premotor', 2024, 'Quais os sinais pré-motores da doença de Parkinson?',
        '<b>Hiposmia</b>, transtorno de humor (ansiedade, depressão), <b>obstipação</b> e <b>transtorno comportamental do sono REM</b> (alfa-sinucleinopatias).'),
      C('redflags', 2024, 'Quais os red flags de parkinsonismo atípico?',
        ul('Piora rápida da marcha (cadeira de rodas em 5 anos)', 'Sem progressão motora em 5 anos', 'Disfunção <b>bulbar precoce</b> (disfonia, disartria, disfagia)', 'Estridor, <b>disautonomia grave precoce</b>, quedas recorrentes', 'Anterocolo ou contraturas em 10 anos', 'Nenhum sinal não motor em 5 anos', 'Sinais piramidais ou cerebelares', 'Parkinsonismo <b>bilateral e simétrico</b>')),
    ]),

    S('neu-cef', 'Enxaqueca: profilaxia', [
      C('indic', 2026, 'Quando indicar profilaxia na enxaqueca?',
        ul('<b>≥ 4 crises por mês</b>', 'Crises muito intensas ou que duram dias', 'Uso frequente de medicação aguda', 'Impacto importante na vida pessoal e profissional')),
      C('classes', 2026, 'Profiláticos da enxaqueca: indicação e detalhe de cada classe?',
        tb(['Classe', 'Indicação / detalhe'], ['Betabloqueador (propranolol, metoprolol)', 'Migrânea episódica; útil na HAS; <b>contraindicado em asma</b> e bradicardia'], ['Topiramato / valproato', 'Episódica e crônica; topiramato: parestesia e <b>perda de peso</b>; valproato contraindicado na gestação'], ['Amitriptilina', 'Com insônia ou depressão; efeitos anticolinérgicos'], ['Toxina botulínica A', 'Crônica refratária; a cada 12 semanas'], ['Anti-CGRP (erenumabe, galcanezumabe, fremanezumabe)', 'Crônica (1ª linha atual); sem ganho de peso ou sedação'])),
      C('asma', 2026, 'Enxaqueca em paciente asmático: pode betabloqueador cardiosseletivo?',
        '<b>Não.</b> Betabloqueadores são 1ª linha, mas contraindicados na asma, <b>mesmo os cardiosseletivos</b>.',
        '<b>Armadilha:</b> "cardiosseletivo" não libera o betabloqueador na asma.'),
    ]),

    S('neu-vert', 'Vertigem', [
      C('meniere', 2025, 'O que caracteriza a doença de Ménière?',
        'Episódios de <b>vertigem</b> + <b>perda auditiva</b> + <b>plenitude auricular</b>.'),
      C('dd', 2025, 'Colesteatoma e enxaqueca vestibular: como entram no diferencial de vertigem?',
        '<b>Colesteatoma</b>: infecção crônica de ouvido e sintomas auditivos; não é causa comum de vertigem posicional. <b>Enxaqueca vestibular</b>: vertigem recorrente associada a cefaleia e foto/fonofobia.'),
    ]),
  ],
};
