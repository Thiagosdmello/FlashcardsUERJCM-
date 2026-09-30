const { C, S, ul, tb } = require('./_h');

module.exports = {
  id: 'onc', nome: 'Oncologia', ic: '🎗️',
  desc: 'Pulmão, mama, estômago, neuroendócrinos, rim, emergências oncológicas, toxicidades e síndromes paraneoplásicas.',
  subs: [
    S('onc-pulm', 'Câncer de pulmão: EGFR, ALK e ROS1', [
      C('egfr', 2022, 'Adenocarcinoma de pulmão: qual mutação sempre testar e onde ela ocorre?',
        '<b>EGFR</b>, com mutações mais comuns nos <b>éxons 19 e 21</b>. Também pesquisar translocações de <b>ALK</b> e <b>ROS1</b> (mais frequentes em jovens).'),
      C('egfr-tto', 2022, 'Adenocarcinoma EGFR positivo: qual o tratamento de 1ª linha e a droga padrão-ouro?',
        'Terapia-alvo com <b>inibidor de EGFR</b>; padrão-ouro: <b>osimertinibe</b>. Outros: erlotinibe, afatinibe, gefitinibe, dacomitinibe.'),
    ]),

    S('onc-mama', 'Câncer de mama', [
      C('grupos', 2023, 'Quais os 3 grandes subgrupos do câncer de mama e o comportamento de cada?',
        tb(['Subtipo', 'Comportamento / terapia'], ['Luminal A', 'Ki-67 baixo, melhor prognóstico → <b>hormonioterapia isolada</b>'], ['Luminal B', 'Mais proliferativo → <b>quimio + hormonioterapia</b>'], ['HER2+ / triplo-negativo', 'Mais agressivos → quimioterapia ± alvo (anti-HER2, imunoterapia)'])),
      C('adj', 2023, 'Doença localizada luminal: qual adjuvância em cada subtipo?',
        '<b>Luminal A</b>: tamoxifeno ou inibidor de aromatase. <b>Luminal B</b>: quimio adjuvante seguida de inibidor de aromatase; tumores pequenos, baixo grau e N0 podem ficar só com hormonioterapia.'),
      C('tamox', 2023, 'Tamoxifeno: mecanismo, perfil de uso e efeitos adversos?',
        '<b>Modulador seletivo do receptor de estrogênio</b>, para menor risco clínico. Adversos: fogachos, libido baixa, <b>tromboembolismo</b>; osso: protege na pós-menopausa (agonista) e piora na menacme (antagonista).'),
      C('ia', 2023, 'Inibidores de aromatase: tipos, uso e efeitos adversos?',
        'Bloqueiam a conversão periférica de andrógenos em estrógenos. Tipo 1 irreversível: <b>exemestano</b>; tipo 2 reversível: <b>anastrozol, letrozol</b>. Maior risco clínico; na <b>pré-menopausa exigem supressão ovariana</b> (agonista GnRH). Adversos: náusea, fogachos, fadiga, dor osteomuscular, <b>perda de massa óssea</b>.'),
    ]),

    S('onc-gast', 'Câncer gástrico: classificação de Lauren', [
      C('lauren', 2024, 'Classificação de Lauren: intestinal × difuso?',
        tb(['', 'Intestinal', 'Difuso'], ['Morfologia', 'Forma glândulas (como o cólon); lesões focais, massas ou úlceras', 'Infiltra sem glândulas; <b>linite plástica</b>'], ['Epidemiologia', 'Áreas de alta prevalência (Japão, Coreia)', 'Global, pouco ligado ao ambiente'], ['Fatores de risco', '<b>H. pylori</b>, dieta com conservados, pobre em frutas/vegetais, DRGE, úlcera', 'Menos definidos; genética'], ['Prognóstico', 'Melhor', '<b>Pior</b>'])),
      C('linite', 2024, 'Como é a endoscopia do subtipo difuso?',
        'Sem úlcera ou lesão exofítica: <b>infiltração das camadas profundas</b> com perda da distensibilidade (linite plástica). Úlcera é pouco compatível com o difuso.'),
    ]),

    S('onc-net', 'Tumores neuroendócrinos e síndrome carcinoide', [
      C('origem', 2024, 'A síndrome carcinoide está associada a tumores de onde?',
        'Tumores <b>metastáticos do intestino médio</b> (delgado distal e cólon proximal); os de <b>íleo/apêndice</b> são os mais comuns. O fígado é o sítio de metástase mais comum.'),
      C('clin', 2024, 'Quais as manifestações da síndrome carcinoide?',
        ul('<b>Flushing</b> (rubor facial) desencadeado por estresse, álcool, alimentos', '<b>Diarreia</b> aquosa volumosa (serotonina)', '<b>Broncoespasmo</b>', '<b>Cardiopatia carcinoide</b>: fibrose de valvas do lado <b>direito</b> → IC direita (sopro)', 'Dor abdominal; hepatomegalia nodular') + 'Também: telangiectasias, glossite, estomatite angular, hiponatremia, hipocalemia, hipoglicemia.'),
      C('5hiaa', 2024, 'Qual o exame diagnóstico da síndrome carcinoide e seus cuidados?',
        '<b>5-HIAA na urina de 24 h</b> (S e E &gt; 90%). Falso-positivos: drogas serotoninérgicas (antidepressivos, tramadol, paracetamol, salicilatos, L-dopa) e alimentos (banana, kiwi, abacate, abacaxi, nozes, café) — suspender 2 dias antes e durante a coleta.'),
      C('cga', 2024, 'Cromogranina A serve para triagem de tumor neuroendócrino?',
        '<b>Não</b> (baixa especificidade). Serve para acompanhar progressão, resposta e recorrência.'),
      C('img', 2024, 'Como localizar o tumor carcinoide?',
        'TC, RM ou <b>imagem de receptor de somatostatina</b>. Endoscopia e colonoscopia se o primário não aparecer na imagem.'),
      C('tto', 2024, 'Síndrome carcinoide: qual o pilar do tratamento e as doses?',
        '<b>Análogos da somatostatina</b> (~80% dos tumores bem diferenciados expressam o receptor; controlam rubor e diarreia em &gt; 80%): <b>octreotida LAR 20–30 mg IM a cada 4 semanas</b> ou <b>lanreotida 120 mg SC a cada 4 semanas</b>. Tumor: cirurgia, radioisótopos ou embolização hepática, quimio/alvo nos agressivos.'),
    ]),

    S('onc-renal', 'Câncer renal', [
      C('tto', 2024, 'Tumor renal localizado de 4 cm: qual o tratamento e o seguimento?',
        '<b>Nefrectomia parcial ou radical</b>; depois, <b>vigilância ativa</b> com imagem. Sobrevida câncer-específica em 5 anos &gt; 90%.'),
      C('parcial', 2024, 'Nefrectomia parcial × radical: quando cada uma?',
        '<b>Parcial</b>: tumores <b>≤ 7 cm</b>, sobretudo exofíticos e polares; preserva função com eficácia semelhante. <b>Radical</b>: tumores maiores ou complexos (rim, gordura perirrenal e às vezes adrenal).'),
      C('biopsia', 2024, 'Massa renal característica precisa de biópsia antes da cirurgia?',
        'Em geral <b>não</b> — exceção na oncologia. Biópsia só em casos selecionados.'),
      C('sistemica', 2024, 'Tumor renal localizado: há terapia neoadjuvante ou adjuvante?',
        'Neoadjuvante: <b>não indicada</b>. Adjuvante: geralmente não; considerar em alto risco (inibidor de tirosina-quinase como sunitinibe, ou imunoterapia).'),
    ]),

    S('onc-emerg', 'Emergências oncológicas: SVCS, lise tumoral e neutropenia', [
      C('svcs-risco', 2022, 'Síndrome da veia cava superior: conduta com e sem risco iminente?',
        '<b>Com risco iminente</b>: estabilizar, exame contrastado e <b>stent</b> imediato (anticoagular se houver trombo). <b>Sem risco</b>, relacionada a neoplasia: <b>biópsia</b> para definir a terapia.'),
      C('svcs-neo', 2022, 'SVCS por neoplasia com sintomas leves/moderados: quimio ou radioterapia?',
        'Mais relacionadas: câncer de pulmão não pequenas e pequenas células. <b>Quimiossensível</b> (pequenas células, germinativas, linfoma não Hodgkin) → <b>quimioterapia</b>. Não quimiossensível → <b>radioterapia</b>.'),
      C('slt', 2023, 'Síndrome de lise tumoral: critérios e tratamento?',
        'Neoplasias hematológicas e sólidas; <b>critérios de Cairo-Bishop</b> (laboratoriais e clínicos). Tratamento: suporte, correção eletrolítica, quelante de fósforo e <b>rasburicase</b> (degrada o ácido úrico já formado).'),
      C('nf', 2023, 'Como se define neutropenia febril?',
        'Febre <b>&gt; 38,3 °C</b> (ou 38,0–38,3 por 1 hora) + <b>neutrófilos &lt; 500</b>.'),
      C('enterocolite', 2023, 'Enterocolite neutropênica: quando suspeitar e como se apresenta?',
        'Neutropênico grave (&lt; 500) com <b>febre e dor abdominal</b>, geralmente no <b>quadrante inferior direito</b>, na <b>3ª semana</b> após a quimio. Distensão, náuseas, diarreia aquosa ou com sangue.'),
      C('entero-tto', 2023, 'Enterocolite neutropênica: exame e antibiótico?',
        '<b>TC</b>: espessamento de parede, dilatação, pneumatose. Cobrir <b>Pseudomonas</b>, gram-negativos entéricos e <b>anaeróbios</b> (pip-tazo, cefepime + metronidazol ou carbapenêmico); enterococo nos graves; <b>antifúngico</b> se febre &gt; 72 h.'),
    ]),

    S('onc-tox', 'Toxicidades do tratamento oncológico', [
      C('cardio', 2022, 'Cardiotoxicidade: quais os riscos, como proteger e como monitorar?',
        'Riscos: disfunção ventricular, arritmias, TEV, miopericardite. Proteção: controle de comorbidades, hábitos saudáveis, <b>dexrazoxano</b> em casos selecionados. Monitorar: eco, biomarcadores, ECG.'),
      C('pulm', 2024, 'Toxicidade pulmonar por quimioterapia: quais drogas e fatores de risco?',
        '<b>Bleomicina</b>, busulfan e agentes de tumores germinativos. Risco: dose cumulativa, idade, tabagismo, radioterapia concomitante. Mecanismo: lesão epitelial/capilar → inflamação e fibrose.'),
      C('pulm-tto', 2024, 'Suspeita de toxicidade pulmonar por quimioterapia: qual a conduta?',
        '<b>Suspender a quimioterapia e iniciar corticoide.</b> Monitorar a função pulmonar antes e durante o tratamento nos de alto risco.'),
    ]),

    S('onc-paraneo', 'Síndromes paraneoplásicas e RS3PE', [
      C('geral', 2023, 'Síndromes paraneoplásicas: frequência, tumor clássico e as mais comuns?',
        'Raras (&lt; 1% dos pacientes com câncer), clássicas do <b>carcinoma de pulmão de pequenas células</b>. Mais comuns: endócrinas — <b>Cushing, SIADH e hipercalcemia da malignidade</b>. A melhora depende do tratamento do câncer.'),
      C('rs3pe', 2023, 'O que é a RS3PE?',
        '<b>Sinovite simétrica soronegativa remitente com edema depressível</b>: artrite simétrica de pequenas articulações + <b>edema em dorso de mãos e pés</b> (VEGF), em idosos de 60–80 anos. FR e anti-CCP negativos.'),
      C('rs3pe-neo', 2023, 'RS3PE: associações e tratamento?',
        'Neoplasias em <b>16–30%</b> (hematológicas ou sólidas) e doenças reumatológicas (LES, Sjögren, gota, sarcoidose). Tratamento: <b>glicocorticoide</b> + doença de base; resposta pior nos paraneoplásicos.'),
    ]),
  ],
};
