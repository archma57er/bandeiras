// =====================================================================
//  Fações, casa e construções — regras e números (proposta para afinar)
//  Ideia de equilíbrio: ouro e comida sobram; pedra, ferro e madeira são raros.
//  Por isso as construções custam sobretudo ouro e poucos materiais, e a lentidão
//  vem dos TEMPOS de construção (uma obra de cada vez).
// =====================================================================

// ---- Fações ---------------------------------------------------------
// Escolhe-se no nível 10 (definitivo). Ao escolher NÃO muda nada: as diferenças vêm todas
// da árvore de ciência de cada fação (ciencia.js), a partir do nível 11.
const NIVEL_FACAO_FIXA = 10;
const FACOES = {
  humanos: {
    nome: 'Humanos', icone: '🌾', lema: 'Agricultura e produção',
    arvore: 'POIs produzem mais, moinho e pão, construções de produção nível 4, cão de guarda.',
    bom: 'Produzem mais em todo o lado (POIs e construções). Constroem mais coisas e mais depressa, e o pão resolve a comida. Gastam menos energia a anexar.',
    mau: 'Dependem de POIs e de construções: precisam de muitos materiais e de passar tempo em casa. Não ganham ouro extra nem nada por andar.',
  },
  elfos: {
    nome: 'Elfos', icone: '🌿', lema: 'Natureza',
    arvore: 'Madeira e ciência a andar, monumentos com níveis, esconderijos na mata, comem menos.',
    bom: 'Ganham madeira e ciência só por andar. Os monumentos ficam mais fortes e dão mais alegria. Comem menos e quase não precisam de pedra nem ferro. Escondem recursos na mata.',
    mau: 'Os POIs que não são monumentos demoram +50% a anexar. Rendem pouco longe de matas, parques e monumentos. Pouco ouro.',
  },
  gnomos: {
    nome: 'Gnomos', icone: '💰', lema: 'Comércio',
    arvore: 'Mais ouro, construções com mais ouro e menos materiais, controlar feiras, empréstimos, contratar ladrões.',
    bom: 'Muito ouro: produção, empréstimos com juros e vendas mais caras na feira. Constroem com poucos materiais (pagam em ouro). Têm mais um ramo que as outras fações.',
    mau: 'As construções ficam bem mais caras em ouro. Precisam de bancos e feiras por perto (rendem mais nas cidades). Controlar feiras e contratar ladrões só valem quando houver outros jogadores.',
  },
};

// ---- Alegria ----------------------------------------------------------
// Não se acumula: é a soma dos bónus ativos NESTE momento, com máximo 10.
// Cada fonte conta uma vez só (dois monumentos grandes dão +1, não +2).
const ALEGRIA_MAXIMA = 10;

// ---- Armazenamento ---------------------------------------------------------
// O que passar do limite perde-se. Os espaços SOMAM-SE:
//   mochila (sempre) + casa (quando a tem) = espaço PROTEGIDO, não pode ser roubado.
//   Baús e frigorífico são acréscimos: só vai para lá o que já não cabe na mochila + casa,
//   e o que lá está PODE SER ROUBADO.
//   💰 Ouro: sem limite de armazenamento; um roubo leva sempre uma PERCENTAGEM do ouro.
//   🪨🔩🪵 Materiais (pedra, ferro, madeira): um espaço PARTILHADO pelos três
//       (ex.: 80 = 30 pedra + 20 ferro + 30 madeira). Mochila + casa + baús.
//   🍞 Comida: espaço próprio, separado dos materiais. Mochila + casa + frigorífico.
const ARMAZENAMENTO = {
  semLimite: ['ouro'],
  materiais: ['pedra', 'ferro', 'madeira'],
  mochila: { materiais: 30, comida: 50 },
  casa: { materiais: 50, comida: 50 },
};

// ---- Território ------------------------------------------------------------
// O círculo da casa cresce com o NÍVEL DA CASA. As torres juntam círculos novos ao território.
// Todos os POIs dentro do território ficam do jogador sozinhos (sem os anexar)
// e NÃO contam para o limite de POIs do nível (esse limite é só para os que se anexam fora).
// A torre constrói-se onde o jogador está, a tocar no território que já tem (casa ou torre pronta).
const TERRITORIO = {
  raioCasa: [50, 100, 150],                    // metros, por nível da casa (1, 2, 3)
  torre: {
    nome: 'Torre', icone: '🗼', raio: 75,      // círculo de cada torre
    maxPorNivelCasa: [1, 2, 4],                // quantas torres se podem ter com a casa no nível 1, 2, 3
    custo: { ouro: 20, pedra: 8, madeira: 8, ferro: 2 }, horas: 4,
  },
};

// ---- Roubo ---------------------------------------------------------------
// 1. O ladrão vai à casa do outro jogador (a menos de 50 m) e fica lá 1 minuto.
// 2. Escolhe ÀS CEGAS UMA SÓ coisa: o OURO, OU um dos baús, OU o frigorífico (não vê o que têm dentro).
// 3. Leva só aquilo que escolheu:
//    · se escolheu o OURO: leva uma percentagem do ouro, à sorte entre 5% e 15%.
//    · se escolheu um BAÚ: leva o baú inteiro, com o que tem dentro. A vítima fica sem esse baú
//      (se quiser, compra outro). O ladrão fica com o baú se ainda puder ter mais um
//      (máximo de baús da sua casa); senão o baú perde-se.
//    · se escolheu o FRIGORÍFICO: leva a comida que lá está (o frigorífico fica).
//    Os recursos roubados ficam com o ladrão se tiver espaço; o que não couber perde-se.
//    💪 Vigor (ciência): ao roubar um BAÚ, 2–10% de chance de levar também 5% do ouro
//       ou 10% da comida do frigorífico (ver extraVigor em ciencia.js).
// 4. Só descobre o que roubou quando chega à SUA casa (é aí que se decide o que fica e o que se perde).
// 5. Não há proteção depois de ser roubado: pode ser roubado outra vez logo a seguir.
// 6. 🐕 Humanos com cão de guarda: antes de levar seja o que for, 2–6% de chance (ramo 🏡 Lar)
//    de o cão pôr o ladrão a correr: sai sem nada (ver caoDefende).
// O que está na mochila e na casa nunca é roubado (só o ouro, em percentagem, se for essa a escolha).
const ROUBO = {
  raioCasaM: 50,
  minutosNaCasa: 1,
  ouroMin: 0.05, ouroMax: 0.15,   // percentagem do ouro, à sorte
  protecaoDepoisHoras: 0,
};

// Ouro roubado: entre 5% e 15%, à sorte (`sorte` entre 0 e 1)
const ouroRoubado = (ouro, sorte = Math.random()) =>
  Math.floor(ouro * (ROUBO.ouroMin + sorte * (ROUBO.ouroMax - ROUBO.ouroMin)));

// Onde está cada coisa: protegido (mochila + casa) e o resto nos baús (por ordem) e no frigorífico.
// `nBaus` = baús construídos · devolve { baus: [{pedra,ferro,madeira}, ...], frigorifico: comida }
function conteudoArmazens(r, temCasa, nBaus) {
  const prot = k => ARMAZENAMENTO.mochila[k] + (temCasa ? ARMAZENAMENTO.casa[k] : 0);
  const cap = CONSTRUCOES.bau.niveis[0].capacidade;
  // o espaço protegido enche-se primeiro; o excedente de cada material vai para os baús
  const MAT = ARMAZENAMENTO.materiais, total = MAT.reduce((t, k) => t + (r[k] || 0), 0);
  let fora = Math.max(0, total - prot('materiais'));
  // reparte o excedente pelos materiais na proporção de cada um
  const exced = Object.fromEntries(MAT.map(k => [k, total ? Math.floor(fora * (r[k] || 0) / total) : 0]));
  const baus = [];
  for (let i = 0; i < nBaus; i++) {
    const b = {}; let livre = cap;
    for (const k of MAT) { const q = Math.min(livre, exced[k]); b[k] = q; exced[k] -= q; livre -= q; }
    baus.push(b);
  }
  return { baus, frigorifico: Math.max(0, (r.comida || 0) - prot('comida')) };
}

// O ladrão chega a casa com o que roubou: decide o que fica e o que se perde.
// `ladrao` = { r: recursos, nivelCasa, baus } (é alterado)
// `saque` = só UMA destas: { ouro } · { bau: {pedra,ferro,madeira} } · { comida }
// Devolve { ficou: {...}, perdido: {...}, ficouComBau: bool }
function chegarComSaque(ladrao, saque) {
  const ficou = {}, perdido = {};
  const add = (o, k, v) => { if (v > 0) o[k] = (o[k] || 0) + v; };
  // ouro: sem limite
  if (saque.ouro) { ladrao.r.ouro = (ladrao.r.ouro || 0) + saque.ouro; add(ficou, 'ouro', saque.ouro); }
  // o baú: fica se ainda pode ter mais um
  let ficouComBau = false;
  if (saque.bau) {
    const max = ladrao.nivelCasa ? CONSTRUCOES.bau.maxPorNivelCasa[ladrao.nivelCasa - 1] : 0;
    if (ladrao.baus < max) { ladrao.baus++; ficouComBau = true; }
  }
  // materiais: cabem até ao espaço partilhado (mochila + casa + baús, já com o baú novo se ficou)
  const MAT = ARMAZENAMENTO.materiais;
  const capMat = ARMAZENAMENTO.mochila.materiais + (ladrao.nivelCasa ? ARMAZENAMENTO.casa.materiais : 0)
    + ladrao.baus * CONSTRUCOES.bau.niveis[0].capacidade;
  let livre = capMat - MAT.reduce((t, k) => t + (ladrao.r[k] || 0), 0);
  for (const k of MAT) {
    const q = saque.bau ? saque.bau[k] || 0 : 0, cabe = Math.max(0, Math.min(q, livre));
    ladrao.r[k] = (ladrao.r[k] || 0) + cabe; livre -= cabe;
    add(ficou, k, cabe); add(perdido, k, q - cabe);
  }
  // comida: até ao espaço da comida (mochila + casa + frigorífico)
  if (saque.comida) {
    const nf = ladrao.frigorifico || 0;
    const capC = ARMAZENAMENTO.mochila.comida + (ladrao.nivelCasa ? ARMAZENAMENTO.casa.comida : 0)
      + (nf ? CONSTRUCOES.frigorifico.niveis[nf - 1].capacidade : 0);
    const cabe = Math.max(0, Math.min(saque.comida, capC - (ladrao.r.comida || 0)));
    ladrao.r.comida = (ladrao.r.comida || 0) + cabe;
    add(ficou, 'comida', cabe); add(perdido, 'comida', saque.comida - cabe);
  }
  return { ficou, perdido, ficouComBau };
}

// Quanto está em risco (para o simulador) — o ladrão escolhe só UMA destas coisas:
// ouro (em média 10%), um dos baús, ou a comida do frigorífico
function emRisco(r, temCasa, nBaus = 99) {
  const c = conteudoArmazens(r, temCasa, nBaus);
  return {
    ouro: Math.floor((r.ouro || 0) * (ROUBO.ouroMin + ROUBO.ouroMax) / 2),
    materiais: c.baus.reduce((t, b) => t + Object.values(b).reduce((a, v) => a + v, 0), 0),
    comida: c.frigorifico,
    baus: c.baus,
  };
}

// ---- Casa e construções -------------------------------------------------
// Uma construção de cada vez. Começa-se em casa (a menos de 50 m); o tempo corre mesmo fora.
// A produção das construções exteriores acumula e recolhe-se em casa.
// `nivelJogador` = nível mínimo do jogador · `nivelCasa` = nível mínimo da casa.
const XP_POR_CONSTRUCAO = 20;   // proposta: cada construção ou melhoria terminada dá XP

const CONSTRUCOES = {
  casa: {
    nome: 'Casa', icone: '🏠', tipo: 'principal',
    niveis: [
      { nivelJogador: 3, custo: { ouro: 25 }, horas: 2,
        emCasaPorHora: { ouro: 1 }, alegriaEmCasa: 2, espacosDentro: 2, espacosFora: 1 },   // a casa não produz comida
      { nivelJogador: 5, custo: { ouro: 375, madeira: 25, pedra: 25, ferro: 15 }, horas: 72,
        emCasaPorHora: { ouro: 2 }, alegriaEmCasa: 2, espacosDentro: 3, espacosFora: 2 },
      { nivelJogador: 8, custo: { ouro: 1000, madeira: 75, pedra: 75, ferro: 50 }, horas: 168,
        emCasaPorHora: { ouro: 2 }, alegriaEmCasa: 2, espacosDentro: 4, espacosFora: 4 },
    ],
  },

  // -- Dentro da casa --
  cama: {
    nome: 'Cama', icone: '🛏️', tipo: 'dentro',
    descricao: 'Permite descansar: 4 h seguidas em casa recuperam energia.',
    niveis: [
      { nivelCasa: 1, custo: { ouro: 50, madeira: 5 }, horas: 6, energiaDescanso: 20 },
      { nivelCasa: 2, custo: { ouro: 200, madeira: 20, ferro: 5 }, horas: 48, energiaDescanso: 30 },
    ],
  },
  sofa: {
    nome: 'Sofá', icone: '🛋️', tipo: 'dentro',
    descricao: 'Energia extra por hora em casa e +1 de alegria em casa.',
    niveis: [
      { nivelCasa: 1, custo: { ouro: 100, madeira: 15, ferro: 5 }, horas: 12, energiaHoraEmCasa: 1, alegriaEmCasa: 1 },
      { nivelCasa: 2, custo: { ouro: 300, madeira: 30, ferro: 15 }, horas: 48, energiaHoraEmCasa: 2, alegriaEmCasa: 1 },
    ],
  },

  escritorio: {
    nome: 'Escritório', icone: '🗄️', tipo: 'dentro',
    descricao: 'Recolher a produção dos POIs anexados a partir de casa, sem lá ir (algumas vezes por dia).',
    niveis: [
      // sem ouro: o escritório é para se ter cedo (o ouro custa a juntar no início)
      { nivelCasa: 1, custo: { madeira: 20, ferro: 10, pedra: 8 }, horas: 24, recolhasRemotasDia: 2 },
      { nivelCasa: 3, custo: { madeira: 40, ferro: 20, pedra: 20 }, horas: 60, recolhasRemotasDia: 4 },
    ],
  },
  biblioteca: {
    nome: 'Biblioteca', icone: '📚', tipo: 'dentro',
    descricao: 'Produz 1 de ciência por hora e entrega-a sozinha às 17h de cada dia (não é preciso estar em casa).',
    niveis: [
      { nivelCasa: 1, custo: { madeira: 15, pedra: 10, ferro: 5 }, horas: 12, cienciaPorHora: 1, entregaAs: 17 },
    ],
  },

  // -- Armazenamento (não ocupam espaços da casa; o nº máximo depende do nível da casa) --
  // Baús: pedra, ferro e madeira, num espaço partilhado pelos três. PODEM SER ROUBADOS.
  // O baú NÃO se constrói: COMPRA-SE, só com ouro, e chega 1 hora depois.
  // Só começa a ser cheio quando chega. Não ocupa a obra em curso (pode comprar-se enquanto se constrói).
  // Não sobe de nível: para guardar mais, compram-se mais baús.
  // Enchem-se por ordem (1.º baú, depois o 2.º, ...): um baú pode estar vazio — o ladrão não sabe.
  bau: {
    nome: 'Baú', icone: '🧰', tipo: 'armazem', guarda: 'materiais', comprado: true,
    descricao: 'Compra-se (só ouro) e chega 1 h depois. Guarda pedra, ferro e madeira (espaço partilhado pelos três). O que está nos baús pode ser roubado.',
    maxPorNivelCasa: [2, 4, 8],   // nº máximo de baús com casa 1/2/3
    niveis: [
      { nivelCasa: 1, custo: { ouro: 300 }, horas: 1, capacidade: 300 },   // horas = entrega
    ],
  },
  // Frigorífico: só comida. Um por casa. O que está no frigorífico PODE SER ROUBADO.
  frigorifico: {
    nome: 'Frigorífico', icone: '🧊', tipo: 'armazem', guarda: 'comida',
    descricao: 'Guarda a comida que já não cabe na mochila e na casa. O que está no frigorífico pode ser roubado.',
    maxPorNivelCasa: [1, 1, 1],
    niveis: [
      { nivelCasa: 1, custo: { ouro: 75, ferro: 10, pedra: 5 }, horas: 12, capacidade: 100 },
      { nivelCasa: 2, custo: { ouro: 250, ferro: 25, pedra: 15 }, horas: 48, capacidade: 250 },
      { nivelCasa: 3, custo: { ouro: 625, ferro: 50, pedra: 30 }, horas: 120, capacidade: 500 },
    ],
  },

  // -- À volta da casa (até ao nível 10 só estas quatro) --
  // produz: por ciclo · cicloHoras · maxHoras = acumula no máximo (recolhe-se em casa)
  fabricaPedra: {
    nome: 'Fábrica de pedra', icone: '🪨', tipo: 'fora',
    niveis: [
      { nivelCasa: 1, custo: { ouro: 150, madeira: 15, ferro: 5 }, horas: 24, produz: { pedra: 1 }, cicloHoras: 3, maxHoras: 12 },
      { nivelCasa: 2, custo: { ouro: 500, madeira: 40, ferro: 20 }, horas: 96, produz: { pedra: 1 }, cicloHoras: 2, maxHoras: 12 },
      { nivelCasa: 3, custo: { ouro: 1250, madeira: 100, ferro: 50 }, horas: 240, produz: { pedra: 1 }, cicloHoras: 1, maxHoras: 12 },
      // Só Humanos, com 🔨 Ofícios nível 3
      { nivelCasa: 3, facao: 'humanos', ciencia: { ramo: 'oficios', nivel: 3 }, custo: { ouro: 3125, madeira: 250, ferro: 125 }, horas: 360, produz: { pedra: 3 }, cicloHoras: 2, maxHoras: 12 },
    ],
  },
  serracao: {
    nome: 'Serração', icone: '🪵', tipo: 'fora',
    niveis: [
      { nivelCasa: 1, custo: { ouro: 150, pedra: 15, ferro: 5 }, horas: 24, produz: { madeira: 1 }, cicloHoras: 3, maxHoras: 12 },
      { nivelCasa: 2, custo: { ouro: 500, pedra: 40, ferro: 20 }, horas: 96, produz: { madeira: 1 }, cicloHoras: 2, maxHoras: 12 },
      { nivelCasa: 3, custo: { ouro: 1250, pedra: 100, ferro: 50 }, horas: 240, produz: { madeira: 1 }, cicloHoras: 1, maxHoras: 12 },
      { nivelCasa: 3, facao: 'humanos', ciencia: { ramo: 'oficios', nivel: 3 }, custo: { ouro: 3125, pedra: 250, ferro: 125 }, horas: 360, produz: { madeira: 3 }, cicloHoras: 2, maxHoras: 12 },
    ],
  },
  serralharia: {
    nome: 'Serralharia', icone: '🔩', tipo: 'fora',
    niveis: [
      { nivelCasa: 1, custo: { ouro: 150, pedra: 15, madeira: 15 }, horas: 24, produz: { ferro: 1 }, cicloHoras: 3, maxHoras: 12 },
      { nivelCasa: 2, custo: { ouro: 500, pedra: 40, madeira: 40 }, horas: 96, produz: { ferro: 1 }, cicloHoras: 2, maxHoras: 12 },
      { nivelCasa: 3, custo: { ouro: 1250, pedra: 100, madeira: 100 }, horas: 240, produz: { ferro: 1 }, cicloHoras: 1, maxHoras: 12 },
      { nivelCasa: 3, facao: 'humanos', ciencia: { ramo: 'oficios', nivel: 3 }, custo: { ouro: 3125, pedra: 250, madeira: 250 }, horas: 360, produz: { ferro: 3 }, cicloHoras: 2, maxHoras: 12 },
    ],
  },
  quinta: {
    nome: 'Quinta', icone: '🌾', tipo: 'fora',
    niveis: [
      { nivelCasa: 1, custo: { ouro: 100, madeira: 15, pedra: 5 }, horas: 24, produz: { comida: 1 }, cicloHoras: 2, maxHoras: 12 },
      { nivelCasa: 2, custo: { ouro: 375, madeira: 30, pedra: 25 }, horas: 96, produz: { comida: 1 }, cicloHoras: 1, maxHoras: 12 },
      { nivelCasa: 3, custo: { ouro: 1000, madeira: 75, pedra: 65 }, horas: 240, produz: { comida: 2 }, cicloHoras: 1, maxHoras: 12 },
      { nivelCasa: 3, facao: 'humanos', ciencia: { ramo: 'oficios', nivel: 2 }, custo: { ouro: 2500, madeira: 190, pedra: 160 }, horas: 360, produz: { comida: 3 }, cicloHoras: 1, maxHoras: 12 },
    ],
  },

  // -- Só Humanos (desbloqueiam-se com a ciência 🔨 Ofícios e 🏡 Lar) --
  // Moinho: mói 4 de comida em 1 de pão, na altura de recolher (só mói a comida que houver).
  // 🥖 Pão: ocupa 1 lugar no espaço da comida (em vez de 4); paga o consumo diário de comida
  // e nesse dia dá +1 alegria; vende-se na feira a 2 de ouro.
  moinho: {
    nome: 'Moinho', icone: '🌀', tipo: 'fora', facao: 'humanos',
    descricao: 'Mói 4 🍞 comida em 1 🥖 pão. O pão ocupa menos espaço, paga o consumo diário com +1 alegria e vende-se melhor.',
    niveis: [
      { nivelCasa: 1, facao: 'humanos', ciencia: { ramo: 'oficios', nivel: 1 }, custo: { ouro: 300, madeira: 30, pedra: 30 }, horas: 48,
        consome: { comida: 4 }, produz: { pao: 1 }, cicloHoras: 4, maxHoras: 12 },
      { nivelCasa: 1, facao: 'humanos', ciencia: { ramo: 'oficios', nivel: 4 }, custo: { ouro: 750, madeira: 75, pedra: 75 }, horas: 120,
        consome: { comida: 4 }, produz: { pao: 1 }, cicloHoras: 2, maxHoras: 12 },
    ],
  },
  // Cão de guarda: compra-se (não ocupa espaço nem a obra). Por agora só 1 cão por jogador
  // (mais tarde pode ganhar-se espaço para mais). A chance de defesa vem do ramo 🏡 Lar (2–6%).
  cao: {
    nome: 'Cão de guarda', icone: '🐕', tipo: 'cao', facao: 'humanos', comprado: true, maxCaes: 1,
    descricao: 'Quando alguém te tenta roubar, o cão tem uma pequena chance de o pôr a correr: o ladrão sai sem nada.',
    niveis: [
      { nivelCasa: 1, facao: 'humanos', ciencia: { ramo: 'lar', nivel: 1 }, custo: { ouro: 200, comida: 20 }, horas: 0 },
    ],
  },
};
// 🏛️ Guardiões (Elfos): melhorar um monumento anexado do nível n para n+1. Faz-se NO monumento,
// não ocupa a obra da casa, e é uma das "ocasiões especiais" em que os Elfos pagam pedra e ferro.
const melhoriaMonumento = n => ({ custo: { ouro: 150 * n, pedra: 15 * n, ferro: 10 * n }, horas: 12 * n });

// Cão de guarda: o roubo falha? (`sorte` entre 0 e 1). Chance = 🏡 Lar 2–6%, só com cão.
const caoDefende = (niveisCiencia, temCao, sorte = Math.random()) => !!temCao && sorte < bonusCiencia(niveisCiencia).defesaCao;

// Recomenda a fação para uma zona (aproximado).
// `disponivel` = quanto de cada recurso se consegue por dia perto de casa (dos POIs num raio de 5 km).
// `zona` = o que mais há perto de casa: { monumentos, naturezaHa, bancos, feiras, oficinas, mercados }.
// Conta-se o valor por dia (em ouro, aos preços da feira) do que a árvore de cada fação aproveita:
//   Humanos → comida e materiais dos POIs (🌾 Colheita) + oficinas e supermercados perto.
//   Gnomos  → ouro dos POIs (💰 Tesouro) + bancos (🏦 empréstimos) + feiras (🎪 controlo).
//   Elfos   → madeira dos POIs + monumentos (🏛️ níveis e alegria) + natureza (🌲 madeira a andar, 🍂 esconderijos).
const VALOR_OURO = { ouro: 1, comida: 0.25, pedra: 4, ferro: 4, madeira: 4, ciencia: 2 };
const APROVEITA = { humanos: ['comida', 'pedra', 'ferro', 'madeira'], gnomos: ['ouro'], elfos: ['madeira'] };
// Quanto vale por dia cada coisa da zona (com um máximo: não se aproveita tudo)
const VALOR_ZONA = {
  elfos:  { monumentos: { porUnidade: 15, max: 3 }, naturezaHa: { porUnidade: 0.1, max: 500 } },   // 100 ha ≈ 10 🪙/dia
  gnomos: { bancos: { porUnidade: 20, max: 4 }, feiras: { porUnidade: 12, max: 2 } },
  humanos: { oficinas: { porUnidade: 6, max: 3 }, mercados: { porUnidade: 2, max: 5 } },   // muitas oficinas e supermercados perto
};
function recomendarFacao(disponivel, zona = {}) {
  const valor = f => APROVEITA[f].reduce((t, r) => t + Math.max(0, disponivel[r] || 0) * VALOR_OURO[r], 0)
    + Object.entries(VALOR_ZONA[f]).reduce((t, [k, v]) => t + Math.min(zona[k] || 0, v.max) * v.porUnidade, 0);
  const ordem = Object.keys(FACOES).map(id => ({ id, valor: Math.round(valor(id)) })).sort((a, b) => b.valor - a.valor);
  return { melhor: ordem[0].id, ordem };
}

// Custo de uma construção para um jogador. Ao escolher a fação não muda nada:
// as diferenças vêm da ciência (custoComCiencia, e ⚖️ Mercador / 🍃 Frugal no jogo).
const custoPara = custoBase => ({ ...custoBase });
