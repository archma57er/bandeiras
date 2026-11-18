// =====================================================================
//  Regras gerais do jogador (níveis, XP, edifícios, consumo, energia)
//  — iguais às da versão de teste, num sítio só.
// =====================================================================

const NIVEL_MAXIMO = 20;            // ⚠️ provisório: ainda não há conteúdo próprio depois do nível 10
// XP para passar de cada nível ao seguinte. Do 5 ao 10 é mais lento (fase de conhecer as fações):
// a 10 km/dia chega-se ao nível 5 por volta do dia 6 e ao nível 10 por volta do dia 20.
const XP_NIVEIS = [100, 103, 106, 109, 112, 200, 215, 230, 245, 260];
// Depois da tabela: cada nível pede +3% de XP do que o anterior, arredondado ao inteiro mais próximo
const AUMENTO_XP_NIVEL = 0.03;
const XP_CALCULADO = [...XP_NIVEIS];
const xpParaSubir = n => {
  while (XP_CALCULADO.length <= n) XP_CALCULADO.push(Math.round(XP_CALCULADO[XP_CALCULADO.length - 1] * (1 + AUMENTO_XP_NIVEL)));
  return XP_CALCULADO[n];
};
function progressoNivel(xp) {
  let n = 0;
  while (n < NIVEL_MAXIMO && xp >= xpParaSubir(n)) { xp -= xpParaSubir(n); n++; }
  return { n, dentro: xp, precisa: xpParaSubir(n) };
}

// Nível 10: tem de se escolher a fação para passar ao 11. Pode escolher-se mais tarde, mas enquanto
// não escolher fica no 10 e só acumula até 200 XP dentro do nível 10 (o resto perde-se).
const NIVEL_ESCOLHA_FACAO = 10;
const XP_MAX_SEM_FACAO = 200;
const XP_LIMITE_SEM_FACAO = XP_NIVEIS.slice(0, NIVEL_ESCOLHA_FACAO).reduce((a, b) => a + b, 0) + XP_MAX_SEM_FACAO;
// XP total depois de ganhar `n`, respeitando o limite de quem ainda não tem fação
const somarXp = (xp, n, temFacao) => temFacao ? xp + n : Math.min(xp + n, Math.max(xp, XP_LIMITE_SEM_FACAO));

const XP_POR_KM = 5;
const XP_POR_ANEXAR = 60;
// Recursos com que um jogador novo começa. A casa não produz comida: 50 dá para ~12 dias de consumo
// depois do nível 3, o tempo de anexar o primeiro POI de comida (missão do nível 1).
const RECURSOS_INICIAIS = { comida: 50 };

// Missões de tutorial. `nivel` = a partir de que nível aparece · `recursos` = recompensa extra
// Missões dos níveis 7–9: o que conta para cada fação (uma construção OU um POI)  ⚠️ proposta
const PROVAS_FACAO = {
  humanos: { construcoes: ['quinta'],                       pois: ['mercado', 'comida', 'ferragens'],
             texto: 'Construir uma Quinta, ou anexar/reconhecer um supermercado, restaurante ou loja de ferragens.' },
  elfos:   { construcoes: ['serracao'],                     pois: ['monumento-grande', 'biblioteca'],
             texto: 'Construir uma Serração, ou anexar/reconhecer um monumento grande (Tapada, Paisagem de Sintra…) ou uma biblioteca.' },
  gnomos:  { construcoes: ['bau'],                          pois: ['banco'], feira: true,
             texto: 'Comprar um baú, ou anexar/reconhecer um banco, ou vender na feira.' },
};

// Avatares: 12, livres para todos (não dependem da fação). Mostram-se misturados, por esta ordem.
const AVATARES = ['🧝‍♀️', '👷', '🧙‍♂️', '🧚‍♂️', '👩‍🌾', '🧑‍💼', '🧝‍♂️', '👩‍🏭', '🧙‍♀️', '👨‍🌾', '🧚‍♀️', '🧑‍🔧'];

// Nome ao calhas de um jogador novo: "Bandeirinhas" + 4 algarismos (16 caracteres, o máximo).
// Quando os números acabam (todos ocupados), tira-se uma letra e ganha-se um algarismo:
// Bandeirinha + 5 → Bandeirinh + 6 → Bandeirin + 7 → … (o nome tem sempre 16 caracteres).
// `ocupados` = conjunto dos nomes já usados (no jogo real vem do servidor).
const NOME_BASE = 'Bandeirinhas', NOME_TAMANHO = 16;
function nomeAleatorio(ocupados = new Set()) {
  for (let l = NOME_BASE.length; l >= 1; l--) {
    const prefixo = NOME_BASE.slice(0, l), dig = NOME_TAMANHO - l;
    const min = 10 ** (dig - 1), total = 9 * min;   // números com exatamente `dig` algarismos
    let usados = 0; for (const n of ocupados) if (n.length === NOME_TAMANHO && n.startsWith(prefixo) && /^\d+$/.test(n.slice(l))) usados++;
    if (usados >= total) continue;                   // este acabou: passa ao prefixo mais curto
    for (let i = 0; i < 1000; i++) {                 // ao calhas (quase sempre à primeira)
      const nome = prefixo + (min + Math.floor(Math.random() * total));
      if (!ocupados.has(nome)) return nome;
    }
    for (let x = min; x < min + total; x++) if (!ocupados.has(prefixo + x)) return prefixo + x;   // quase cheio: o primeiro livre
  }
  return null;
}

const MISSOES = [
  // O jogo começa com um nome e um avatar ao calhas; estas missões ensinam a mudá-los
  { id: 'nome',      nivel: 0, titulo: 'Alterar o nome',                          xp: 20 },
  { id: 'avatar',    nivel: 0, titulo: 'Alterar o avatar',                        xp: 20 },
  { id: 'andar1km',  nivel: 0, titulo: 'Andar 1 km',                              xp: 10,
    recursos: { comida: 1, pedra: 1, ouro: 1, madeira: 1, ferro: 1 } },
  { id: 'anexar',    nivel: 1, titulo: 'Iniciar a anexação de 1 POI',             xp: 20 },
  // Tutorial do nível 1: o primeiro POI a anexar deve ser de comida (a casa não produz comida)
  { id: 'comida',    nivel: 1, titulo: 'Tutorial: anexar um POI de comida',       xp: 20,
    texto: 'Anexa um supermercado ou um restaurante. A partir do nível 3 gastas 4 de comida por dia e a casa não produz comida: a comida que trazes dá para pouco tempo.' },
  { id: 'zona',      nivel: 3, titulo: 'Conhecer a tua zona',                     xp: 20,   // ⚠️ proposta
    texto: 'Ao escolher a casa, o jogo mostra que recursos há perto (num raio de 5 km) e qual a fação que mais te convém.' },

  // ---- Conhecer as fações (nível 5 a 9) → escolha no nível 10 ----
  // Nível 5: três missões de fotografia, uma por fação. Vai-se a um sítio que represente a fação,
  // tira-se uma fotografia (tem de estar lá pelo GPS), lê-se a HISTÓRIA da fação e responde-se a uma pergunta
  // sobre ela: a missão só fica cumprida com a resposta certa (pode-se tentar outra vez, sem nova fotografia).
  // `certa` = índice da resposta certa em `opcoes` (o jogo baralha a ordem).
  // Sítios públicos: a fotografia tira-se de fora (estrada, caminho), nunca entrando em propriedade privada.
  { id: 'fotoElfos',   nivel: 5, facao: 'elfos',   tipo: 'foto', xp: 30, recursos: { ouro: 20 },   // ⚠️ recompensa proposta
    titulo: 'Fotografar um pinhal, bosque ou parque',
    local: t => t.natural === 'wood' || t.landuse === 'forest' || (t.leisure === 'park' && !!t.name),
    texto: 'Os Elfos vivem da natureza.',   // o jogo junta o bom e o mau da fação (FACOES em construcoes.js)
    historia: [
      'Antes das estradas e das cidades, as matas cobriam a terra da serra até ao mar. Os Elfos foram os primeiros a viver nelas e aprenderam a ouvir o vento nos pinheiros como quem lê um livro.',
      'Quando os pinhais começaram a ser cortados para fazer barcos e casas, os Elfos recolheram-se aos bosques que ficaram: as serras, as tapadas, os parques. Desde então guardam-nos e marcam os seus caminhos com bandeiras verdes.',
      'Um Elfo nunca corta uma árvore viva. A madeira que usa é a que a mata lhe oferece: ramos caídos que encontra pelo caminho. Por isso os Elfos andam muito e comem pouco. Para eles, cada monumento antigo é um guardião de pedra, e protegê-lo é uma honra.',
    ],
    pergunta: { texto: 'Que madeira usam os Elfos?', certa: 0,
      opcoes: ['Os ramos caídos que encontram a caminhar pela mata', 'As árvores que cortam nas tapadas', 'A madeira que compram aos Gnomos na feira'] } },
  { id: 'fotoGnomos',  nivel: 5, facao: 'gnomos',  tipo: 'foto', xp: 30, recursos: { ouro: 20 },
    titulo: 'Fotografar um centro comercial',
    local: t => t.shop === 'mall',
    texto: 'Os Gnomos vivem do comércio e do ouro.',
    historia: [
      'Os Gnomos foram os primeiros a perceber que uma moeda vale mais a andar do que parada. Começaram por trocar cogumelos por fivelas nas feiras das aldeias, e ao fim de uma geração já emprestavam dinheiro a quem as organizava.',
      'Fundaram os primeiros bancos em caves frescas, debaixo das lojas, e cada Gnomo guarda um livro de contas desde o dia em que nasce. Não gostam de carregar pedra nem ferro: o que se pode pagar com ouro não se carrega às costas.',
      'Entre eles há um ditado antigo: "quem controla a feira controla a vila". E há quem diga, em voz baixa, que alguns Gnomos pagam a ladrões para fazerem o trabalho que eles não querem fazer.',
    ],
    pergunta: { texto: 'Segundo o ditado dos Gnomos, quem controla a feira…', certa: 0,
      opcoes: ['…controla a vila', '…perde todo o ouro', '…tem de pagar aos Elfos'] } },
  { id: 'fotoHumanos', nivel: 5, facao: 'humanos', tipo: 'foto', xp: 30, recursos: { ouro: 20 },
    titulo: 'Fotografar um moinho ou uma quinta',
    // moinhos (há mais de 200 na zona, muitos visitáveis) · quintas com nome · campos, pomares, vinhas
    local: t => t.man_made === 'windmill' || (t.place === 'farm' && !!t.name) || ['farmland', 'orchard', 'vineyard'].includes(t.landuse),
    texto: 'Os Humanos vivem da agricultura e da produção.',
    historia: [
      'Os Humanos chegaram depois dos Elfos. Não sabiam ouvir as árvores, mas sabiam outra coisa: lavrar a terra. Abriram campos onde havia mato, plantaram vinhas nas encostas e ergueram moinhos de vento no alto das colinas.',
      'Diz-se que onde um Humano se instala nasce uma quinta, onde há quinta nasce um moinho, e onde há moinho há pão. Com o tempo vieram as pedreiras, as serrações e as serralharias, e as aldeias encheram-se de oficinas.',
      'Os Humanos não têm a paciência dos Elfos nem a esperteza dos Gnomos, mas têm braços e teimosia: trabalham por turnos, constroem mais depressa do que ninguém e deixam sempre um cão de guarda à porta.',
    ],
    pergunta: { texto: 'Segundo a história dos Humanos, onde há moinho há…', certa: 0,
      opcoes: ['…pão', '…ouro', '…floresta'] } },

  // Nível 6: estudar cada fação. Cada estudo paga-se com o recurso dessa fação e devolve o DOBRO no fim (+30 XP).
  // Mostra os 2 primeiros níveis de cada ramo da árvore de ciência dessa fação (a partir do nível 11), e o bom e o mau.
  { id: 'estudarElfos',   nivel: 6, facao: 'elfos',   tipo: 'pesquisa', custo: { madeira: 4 }, recursos: { madeira: 8 }, xp: 30,
    titulo: 'Estudar os Elfos',   texto: 'Mostra os primeiros níveis da árvore de ciência dos Elfos.' },
  { id: 'estudarGnomos',  nivel: 6, facao: 'gnomos',  tipo: 'pesquisa', custo: { ouro: 60 }, recursos: { ouro: 120 }, xp: 30,
    titulo: 'Estudar os Gnomos',  texto: 'Mostra os primeiros níveis da árvore de ciência dos Gnomos.' },
  { id: 'estudarHumanos', nivel: 6, facao: 'humanos', tipo: 'pesquisa', custo: { pedra: 2, ferro: 2, madeira: 2 }, recursos: { pedra: 4, ferro: 4, madeira: 4 }, xp: 30,
    titulo: 'Estudar os Humanos', texto: 'Mostra os primeiros níveis da árvore de ciência dos Humanos.' },

  // Níveis 7, 8 e 9: em cada nível escolhe UMA fação ainda não feita e cumpre uma de duas coisas:
  // fazer uma construção ligada a ela OU anexar/reconhecer um POI ligado a ela. Ao nível 9 já fez as três.
  { id: 'provaFacao1', nivel: 7, tipo: 'facao', xp: 40, recursos: { ouro: 30 },   // ⚠️ recompensa proposta
    titulo: 'Viver como uma fação (1.ª)' },
  { id: 'provaFacao2', nivel: 8, tipo: 'facao', xp: 40, recursos: { ouro: 30 },
    titulo: 'Viver como uma fação (2.ª)' },
  { id: 'provaFacao3', nivel: 9, tipo: 'facao', xp: 40, recursos: { ouro: 30 },
    titulo: 'Viver como uma fação (3.ª)' },

  // Nível 10: o menu das fações
  { id: 'escolherFacao', nivel: 10, tipo: 'escolha', xp: 0,
    titulo: 'Escolher a fação',
    texto: 'Aparece o menu das fações. A escolha é definitiva e as diferenças passam a contar. Podes escolher mais tarde, mas só passas ao nível 11 depois de escolher (até lá juntas no máximo 200 XP).' },
];

// ---- Missões diárias ----------------------------------------------------
// Todos os dias (à meia-noite) saem 3 missões ao calhas desta lista, só das que o jogador já pode fazer.
// Cada uma dá 10 XP. O prémio em recursos (10 de ouro + 1 de cada recurso) é dividido pelas 3:
// a 1.ª dá o primeiro lote, a 2.ª o segundo, a 3.ª o terceiro.
const XP_DIARIA = 10;
const PREMIOS_DIARIAS = [
  { ouro: 4, comida: 1, pedra: 1 },
  { ouro: 3, ferro: 1, ciencia: 1 },
  { ouro: 3, madeira: 1 },
];
// ---- Baú diário -----------------------------------------------------------
// Uma vez por dia (muda à meia-noite) abre-se no perfil 👤 e dá 3 recursos diferentes ao calhas, 1 de cada.
const BAU_DIARIO = { recursos: ['comida', 'pedra', 'ferro', 'madeira', 'ciencia'], quantos: 3, quantidade: 1 };
function sortearBauDiario() {
  const l = [...BAU_DIARIO.recursos];
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  return Object.fromEntries(l.slice(0, BAU_DIARIO.quantos).map(k => [k, BAU_DIARIO.quantidade]));
}
// `conta` = o que faz avançar a missão · `alvo` = quanto é preciso · `nivel` = a partir de que nível pode sair
const MISSOES_DIARIAS = [
  { id: 'andar2km',  conta: 'metros',      alvo: 2000, nivel: 0, titulo: 'Andar 2 km' },
  { id: 'visitar3',  conta: 'visitar',     alvo: 3,    nivel: 0, titulo: 'Passar por 3 POIs diferentes' },
  { id: 'recon2',    conta: 'reconhecer',  alvo: 2,    nivel: 0, titulo: 'Fazer 2 reconhecimentos' },
  { id: 'recolher2', conta: 'recolher',    alvo: 2,    nivel: 2, titulo: 'Recolher em 2 POIs teus' },
  { id: 'anexar1h',  conta: 'minAnexar',   alvo: 60,   nivel: 1, titulo: 'Passar 1 h a anexar' },
  { id: 'feira',     conta: 'feira',       alvo: 1,    nivel: 3, titulo: 'Vender ou comprar na feira' },
  { id: 'casa2h',    conta: 'minCasa',     alvo: 120,  nivel: 3, casa: true, titulo: 'Estar 2 h em casa' },
];

// Reconhecimento: em qualquer POI (dentro do alcance) há um botão "Reconhecimento".
// Uma vez por POI: dá 5 de ouro + 2 de ciência + 1 recurso aleatório e, abaixo do nível 3, também XP.
// Abaixo do nível 3 os recursos vêm EM DOBRO (10 de ouro + 4 de ciência + 2 do recurso ao calhas).
const RECONHECIMENTO = {
  xp: 40,
  xpAteNivel: 3,                                              // a partir do nível 3 já não dá XP
  ouro: 5,                                                    // sempre
  ciencia: 2,                                                 // sempre (qualquer POI): ciência desde o início
  recursos: ['comida', 'ouro', 'pedra', 'ferro', 'madeira'],  // + 1 destes, ao calhas
  quantidade: 1,
  multAteNivel: 2,                                            // recursos ×2 abaixo do nível 3 (xpAteNivel)
};
// O que um reconhecimento dá (recursos) para um jogador neste nível; `extra` = o recurso que calhou
function premioReconhecimento(nivel, extra) {
  const R = RECONHECIMENTO, m = nivel < R.xpAteNivel ? R.multAteNivel : 1;
  const g = { ouro: R.ouro * m, ciencia: (R.ciencia || 0) * m };
  g[extra] = (g[extra] || 0) + R.quantidade * m;
  return g;
}

// ---- Comércio nas feiras ------------------------------------------------
// As feiras são POIs especiais que NÃO são fixos: cada concelho tem uma feira ativa de cada vez,
// que fica uns dias num sítio e depois muda para outro. Quem a anexa pode vender recursos lá
// enquanto ela durar (tem de estar na feira para vender).
const COMERCIO = {
  nivelMinimo: 3,
  // Quanto ouro se RECEBE por 1 unidade vendida: 4 comida = 1 ouro · 1 pedra/ferro/madeira = 4 ouro
  precoVenda: { comida: 0.25, pedra: 4, ferro: 4, madeira: 4, pao: 2 },   // 🥖 pão (Humanos): 2 ouro
  // Quanto ouro se PAGA por 1 unidade comprada: 1 comida = 4 ouro · 1 pedra/ferro/madeira = 20 ouro
  precoCompra: { comida: 4, pedra: 20, ferro: 20, madeira: 20 },
  limiteOuroDia: Infinity,    // sem limite de vendas por dia (nem de compras)
  // (os Gnomos vendem mais caro só com a ciência 🎪 Feirante)
};

// POIs anexados ao mesmo tempo: nível 0 = 0, nível 1 = 2, depois +1 a cada 2 níveis
const maxEdificiosNivel = n => n < 1 ? 0 : 2 + Math.floor((n - 1) / 2);

// Consumo diário a partir do nível 3
const NIVEL_CONSUMO = 3;
const CONSUMO_DIARIO = { comida: 4, ouro: 5 };

// Energia
const energiaMaxBase = n => 50 + 2 * n;
const REGEN_BASE = 1;
const regenAlegria = a => a >= 10 ? 5 : a >= 5 ? 2 : 0;
