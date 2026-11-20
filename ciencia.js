// =====================================================================
//  Árvore de ciência (proposta para afinar)
//  Até ao nível 10 do jogador é básica e IGUAL PARA TODOS (as fações ainda não contam).
//  Três ramos, cada um até ao nível 5, com ganhos pequenos (quase não se notam um a um).
//  Paga-se com 🔬 ciência (escolas e bibliotecas). Uma investigação de cada vez,
//  à parte das construções (pode investigar-se e construir ao mesmo tempo).
// =====================================================================

const NIVEL_MAX_RAMO = 5;

// Custo e tempo de cada nível (iguais nos três ramos) · nivelJogador = nível mínimo do jogador
const NIVEIS_CIENCIA = [
  { nivelJogador: 1, ciencia: 25,  horas: 4 },
  { nivelJogador: 2, ciencia: 50,  horas: 12 },
  { nivelJogador: 4, ciencia: 100, horas: 24 },
  { nivelJogador: 6, ciencia: 175, horas: 48 },
  { nivelJogador: 8, ciencia: 250, horas: 96 },
];

// Efeito de cada ramo: `niveis[n-1]` = efeito total quando o ramo está no nível n
const RAMOS_CIENCIA = {
  vigor: {
    nome: 'Vigor', icone: '💪',
    descricao: 'Ao roubar um BAÚ, chance de levar também 5% do ouro ou 10% da comida do frigorífico.',
    // chance (só quando o roubo escolhido é um baú)
    niveis: [0.02, 0.04, 0.06, 0.08, 0.10],
    extra: { ouro: 0.05, comidaFrigorifico: 0.10 },   // leva UMA destas, à sorte
  },
  folego: {
    nome: 'Fôlego', icone: '⚡',
    descricao: 'Recupera mais energia por hora quando está em casa.',
    // energia recuperada por hora em casa (sem ciência: REGEN_BASE = 1)
    niveis: [1.2, 1.4, 1.6, 1.8, 2],
  },
  economia: {
    nome: 'Economia', icone: '📈',
    descricao: 'As construções custam menos ouro; no nível 5 também −5% de pedra, madeira e ferro.',
    // desconto nas construções (não conta na compra de baús)
    niveis: [
      { descontoOuro: 0.02, descontoMateriais: 0 },
      { descontoOuro: 0.04, descontoMateriais: 0 },
      { descontoOuro: 0.06, descontoMateriais: 0 },
      { descontoOuro: 0.08, descontoMateriais: 0 },
      { descontoOuro: 0.10, descontoMateriais: 0.05 },
    ],
  },
};

// =====================================================================
//  Árvores das FAÇÕES: a partir do nível 11 (depois de escolher a fação), juntam-se à básica.
//  Cada fação tem os seus ramos, também até ao nível 5. Mais caras e mais lentas.
// =====================================================================
const NIVEIS_CIENCIA_FACAO = [
  { nivelJogador: 11, ciencia: 350,  horas: 24 },
  { nivelJogador: 12, ciencia: 500,  horas: 48 },
  { nivelJogador: 14, ciencia: 700,  horas: 96 },
  { nivelJogador: 16, ciencia: 950,  horas: 144 },
  { nivelJogador: 18, ciencia: 1250, horas: 192 },
];
const ARVORES_FACAO = {
  // 🌾 Humanos: agricultura e produção
  humanos: {
    colheita: {
      nome: 'Colheita', icone: '🌾',
      descricao: 'Os POIs produzem mais comida, pedra, ferro e madeira (o ouro e a ciência não).',
      niveis: [0.04, 0.08, 0.12, 0.16, 0.20],   // produção extra nos POIs
    },
    oficios: {
      nome: 'Ofícios', icone: '🔨',
      descricao: 'Novas construções em casa: o moinho, o nível 4 das construções de produção e mais um espaço fora de casa.',
      niveis: ['🌀 Moinho', '🌾 Quinta nível 4', '🪨🪵🔩 Fábrica de pedra, serração e serralharia nível 4', '🌀 Moinho nível 2', '+1 espaço fora de casa'],
    },
    resistencia: {
      nome: 'Resistência', icone: '🥾',
      descricao: 'Gasta menos energia a anexar e as obras demoram menos (mão-de-obra).',
      niveis: [
        { energiaAnexar: 0.10, tempoObra: 0.05 },
        { energiaAnexar: 0.20, tempoObra: 0.10 },
        { energiaAnexar: 0.30, tempoObra: 0.15 },
        { energiaAnexar: 0.40, tempoObra: 0.20 },
        { energiaAnexar: 0.50, tempoObra: 0.25 },
      ],
    },
    lar: {
      nome: 'Lar', icone: '🏡',
      descricao: 'Celeiro: o frigorífico guarda mais · Turnos: as construções de produção acumulam mais horas · Cão de guarda: pode ter 1 cão, que às vezes defende a casa de um roubo · Território: os POIs do território (menos supermercados e bancos) dão +1 de cada recurso que produzem, em cada recolha (ex.: restaurante +1 de comida).',
      niveis: [
        { frigorifico: 0.15, horasProducao: 3,  defesaCao: 0.02 },
        { frigorifico: 0.30, horasProducao: 6,  defesaCao: 0.03 },
        { frigorifico: 0.45, horasProducao: 9,  defesaCao: 0.04 },
        { frigorifico: 0.60, horasProducao: 12, defesaCao: 0.05 },
        { frigorifico: 0.75, horasProducao: 12, defesaCao: 0.06 },   // turnos: no máximo 24 h
      ],
      extraTerritorio: 1,                        // território: +1 de cada recurso por ciclo recolhido…
      excetoTerritorio: ['mercado', 'banco'],    // …menos nos supermercados e bancos
    },
  },
};
// 🌿 Elfos: natureza. Ao escolher a fação não muda nada; tudo vem desta árvore.
ARVORES_FACAO.elfos = {
  trilho: {
    nome: 'Trilho', icone: '🌲',
    descricao: 'Ganha madeira a andar dentro de matas, pinhais e parques, e ciência por cada 10 km andados (em qualquer lado). Território: a mata dentro do teu território dá madeira todos os dias (1 por cada hectare, até um máximo).',
    niveis: [
      { metrosPorMadeira: 1000, cienciaPor10km: 2, madeiraTerritorioMax: 2 },
      { metrosPorMadeira: 900,  cienciaPor10km: 3, madeiraTerritorioMax: 3 },
      { metrosPorMadeira: 800,  cienciaPor10km: 3, madeiraTerritorioMax: 4 },
      { metrosPorMadeira: 700,  cienciaPor10km: 4, madeiraTerritorioMax: 5 },
      { metrosPorMadeira: 500,  cienciaPor10km: 5, madeiraTerritorioMax: 6 },
    ],
    haPorMadeira: 1,            // território: 1 🪵 por dia por cada hectare de mata lá dentro (até madeiraTerritorioMax)
  },
  guardioes: {
    nome: 'Guardiões', icone: '🏛️',
    descricao: 'Os monumentos ganham níveis (+25% de produção por nível) e os monumentos grandes (ex.: Tapada de Mafra) dão mais alegria. Em troca, os outros POIs demoram +50% a anexar (os monumentos não).',
    niveis: [
      { nivelMonumento: 2, alegriaGrande: 2 },
      { nivelMonumento: 3, alegriaGrande: 2 },
      { nivelMonumento: 4, alegriaGrande: 3 },
      { nivelMonumento: 5, alegriaGrande: 3 },
      { nivelMonumento: 6, alegriaGrande: 3 },
    ],
    anexarOutros: 1.5,          // os POIs que não são monumentos demoram +50% a anexar
    producaoPorNivel: 0.25,     // +25% de produção do monumento por cada nível acima do 1
  },
  esconderijo: {
    nome: 'Esconderijo', icone: '🍂',
    descricao: 'Esconde recursos numa mata: não contam para o armazenamento e só lá vais buscá-los a pé. Outro jogador só os encontra se ficar 5 min a menos de 50 m.',
    niveis: [
      { capacidade: 50,  esconderijos: 1 },
      { capacidade: 100, esconderijos: 1 },
      { capacidade: 150, esconderijos: 1 },
      { capacidade: 200, esconderijos: 1 },
      { capacidade: 300, esconderijos: 2 },
    ],
  },
  frugal: {
    nome: 'Frugal', icone: '🍃',
    descricao: 'A pedra e o ferro das construções passam a pagar-se em madeira (exceto a casa nível 3 e as melhorias dos monumentos). Comem menos, e andar 20 km num dia dá alegria durante 24 h (não acumula).',
    niveis: [
      { comidaDia: 3.6, alegria20km: 2 },
      { comidaDia: 3.2, alegria20km: 2 },
      { comidaDia: 2.8, alegria20km: 3 },
      { comidaDia: 2.4, alegria20km: 3 },
      { comidaDia: 2,   alegria20km: 4 },
    ],
  },
};
// 💰 Gnomos: comércio e ouro. Ao escolher não muda nada; tudo vem desta árvore (5 ramos).
ARVORES_FACAO.gnomos = {
  tesouro: {
    nome: 'Tesouro', icone: '💰',
    descricao: 'Todo o ouro produzido rende mais: POIs, bancos, casa e monumentos (não conta nas vendas da feira nem nos juros). Território: cada supermercado e cada banco teu dentro do território paga uma taxa de ouro por dia (os restaurantes não).',
    niveis: [0.05, 0.10, 0.15, 0.20, 0.25],
    taxaComercio: [1, 1, 2, 2, 3],                       // 🪙 por dia por cada POI de comércio no território, por nível
    categoriasComercio: ['mercado', 'banco'],              // supermercados e bancos (restaurantes não)
  },
  mercador: {
    nome: 'Mercador', icone: '⚖️',
    descricao: 'As construções pedem menos pedra, ferro e madeira; cada unidade que deixa de ser pedida custa +10 de ouro.',
    niveis: [0.10, 0.20, 0.30, 0.40, 0.50],
    ouroPorMaterial: 10,
  },
  feirante: {
    nome: 'Feirante', icone: '🎪',
    descricao: 'As tuas vendas na feira rendem mais. Se fores o Gnomo com mais horas numa feira, controla-la: recebes uma parte de todo o ouro que os OUTROS vendem e compram lá.',
    niveis: [
      { venda: 0.05, taxa: 0.05 },
      { venda: 0.10, taxa: 0.06 },
      { venda: 0.15, taxa: 0.07 },
      { venda: 0.20, taxa: 0.08 },
      { venda: 0.25, taxa: 0.10 },
    ],
  },
  banca: {
    nome: 'Banca', icone: '🏦',
    descricao: 'Com um banco anexado, emprestas ouro durante 7 dias e recebes de volta com juros. Por agora empresta-se à cidade (sem risco).',
    niveis: [
      { juro: 0.05, maxPorBanco: 200 },
      { juro: 0.07, maxPorBanco: 400 },
      { juro: 0.09, maxPorBanco: 600 },
      { juro: 0.11, maxPorBanco: 800 },
      { juro: 0.15, maxPorBanco: 1000 },
    ],
    dias: 7,
  },
  submundo: {
    nome: 'Submundo', icone: '🗝️',
    descricao: 'Contrata ladrões (150 de ouro) para roubar a casa de outro jogador, com as regras normais do roubo. O ladrão demora 2 h e fica com uma parte.',
    niveis: [
      { ladroesDia: 1, parteLadrao: 0.40 },
      { ladroesDia: 1, parteLadrao: 0.35 },
      { ladroesDia: 2, parteLadrao: 0.30 },
      { ladroesDia: 2, parteLadrao: 0.25 },
      { ladroesDia: 3, parteLadrao: 0.20 },
    ],
    custo: { ouro: 150 }, horas: 2,
  },
};

// Texto curto do efeito de cada nível de um ramo das fações (para mostrar nas missões e menus)
const pct = v => Math.round(v * 100) + '%';
const EFEITO_RAMO = {
  // Humanos
  colheita:    v => `POIs produzem +${pct(v)} de comida, pedra, ferro e madeira`,
  oficios:     v => `desbloqueia: ${v}`,
  resistencia: v => `anexar gasta −${pct(v.energiaAnexar)} de energia · obras −${pct(v.tempoObra)} de tempo`,
  lar:         v => `frigorífico +${pct(v.frigorifico)} · construções acumulam +${v.horasProducao} h · cão defende ${pct(v.defesaCao)} dos roubos · POIs do território +1 de cada recurso por recolha (menos supermercados e bancos)`,
  // Elfos
  trilho:      v => `1 🪵 a cada ${v.metrosPorMadeira} m em matas e parques · ${v.cienciaPor10km} 🔬 por cada 10 km · mata no território: 1 🪵/dia por cada hectare (máx. ${v.madeiraTerritorioMax})`,
  guardioes:   v => `monumentos até nível ${v.nivelMonumento} (+25% por nível) · monumento grande dá +${v.alegriaGrande} alegria · outros POIs +50% de tempo a anexar`,
  esconderijo: v => `${v.esconderijos} esconderijo na mata com ${v.capacidade} de espaço`,
  frugal:      v => `pedra e ferro pagos em madeira · comida ${v.comidaDia}/dia · 20 km num dia = +${v.alegria20km} alegria`,
  // Gnomos
  tesouro:     (v, i) => `ouro produzido +${pct(v)} · cada supermercado e banco no território dá ${ARVORES_FACAO.gnomos.tesouro.taxaComercio[i]} 🪙/dia`,
  mercador:    v => `construções com −${pct(v)} de materiais (+10 🪙 por unidade a menos)`,
  feirante:    v => `vendas na feira +${pct(v.venda)} · controlar uma feira dá ${pct(v.taxa)} do ouro dos outros`,
  banca:       v => `empréstimos a ${pct(v.juro)} em 7 dias, até ${v.maxPorBanco} 🪙 por banco`,
  submundo:    v => `${v.ladroesDia} ladrão por dia (150 🪙), fica com ${pct(v.parteLadrao)} do roubo`,
};
// Os primeiros `ateNivel` níveis de cada ramo de uma fação: [{ icone, nome, descricao, niveis: [texto, ...] }]
function resumoArvore(facao, ateNivel = 2) {
  return Object.entries(ARVORES_FACAO[facao] || {}).map(([id, r]) => ({
    icone: r.icone, nome: r.nome, descricao: r.descricao,
    niveis: r.niveis.slice(0, ateNivel).map((v, i) => ({ nivel: i + 1, texto: EFEITO_RAMO[id](v, i), custo: NIVEIS_CIENCIA_FACAO[i] })),
  }));
}

// Esconderijos: só se criam numa mata/pinhal/parque. Outro jogador encontra-o se ficar ESCONDERIJO.minutos a menos de ESCONDERIJO.raioM
// (aparece-lhe um pontinho a dizer que há lá qualquer coisa); aí pode roubar o que lá estiver. O dono vai buscar a menos de 30 m.
const ESCONDERIJO = { raioM: 50, minutos: 5, raioDonoM: 30, guarda: ['comida', 'pao', 'peixe', 'pedra', 'ferro', 'madeira'] };

// Ramos que um jogador pode investigar (os básicos + os da sua fação)
const ramosDe = facao => ({ ...RAMOS_CIENCIA, ...(ARVORES_FACAO[facao] || {}) });
const ramoDeFacao = ramo => Object.values(ARVORES_FACAO).some(a => a[ramo]);

// Bónus total de um jogador. `niveis` = { vigor: 0..5, folego: 0..5, economia: 0..5, (ramos da fação) }
function bonusCiencia(niveis = {}) {
  const nv = id => niveis[id] || 0;
  const eco = nv('economia') ? RAMOS_CIENCIA.economia.niveis[nv('economia') - 1] : { descontoOuro: 0, descontoMateriais: 0 };
  const H = ARVORES_FACAO.humanos;
  const res = nv('resistencia') ? H.resistencia.niveis[nv('resistencia') - 1] : { energiaAnexar: 0, tempoObra: 0 };
  const lar = nv('lar') ? H.lar.niveis[nv('lar') - 1] : { frigorifico: 0, horasProducao: 0, defesaCao: 0 };
  return {
    chanceExtraRoubo: nv('vigor') ? RAMOS_CIENCIA.vigor.niveis[nv('vigor') - 1] : 0,
    regenEmCasa: nv('folego') ? RAMOS_CIENCIA.folego.niveis[nv('folego') - 1] : REGEN_BASE,
    descontoOuro: eco.descontoOuro,
    descontoMateriais: eco.descontoMateriais,
    // Humanos
    producaoPoi: nv('colheita') ? H.colheita.niveis[nv('colheita') - 1] : 0,
    oficios: nv('oficios'),
    espacosForaExtra: nv('oficios') >= 5 ? 1 : 0,
    energiaAnexar: res.energiaAnexar,
    tempoObra: res.tempoObra,
    frigorificoExtra: lar.frigorifico,
    horasProducaoExtra: lar.horasProducao,
    defesaCao: lar.defesaCao,
    extraTerritorio: nv('lar') ? H.lar.extraTerritorio : 0,
    // Elfos
    ...bonusElfos(nv),
    // Gnomos
    ...bonusGnomos(nv),
  };
}
function bonusGnomos(nv) {
  const G = ARVORES_FACAO.gnomos, de = (r, def) => nv(r) ? G[r].niveis[nv(r) - 1] : def;
  const f = de('feirante', { venda: 0, taxa: 0 }), b = de('banca', { juro: 0, maxPorBanco: 0 }), s = de('submundo', { ladroesDia: 0, parteLadrao: 0 });
  return {
    ouroExtra: de('tesouro', 0),
    taxaComercio: nv('tesouro') ? G.tesouro.taxaComercio[nv('tesouro') - 1] : 0,
    descontoMateriaisOuro: de('mercador', 0),
    vendaFeiraExtra: f.venda, taxaFeira: f.taxa,
    juroEmprestimo: b.juro, maxEmprestimoPorBanco: b.maxPorBanco,
    ladroesDia: s.ladroesDia, parteLadrao: s.parteLadrao,
  };
}
function bonusElfos(nv) {
  const E = ARVORES_FACAO.elfos, de = (r, def) => nv(r) ? E[r].niveis[nv(r) - 1] : def;
  const t = de('trilho', { metrosPorMadeira: 0, cienciaPor10km: 0, madeiraTerritorioMax: 0 });
  const g = de('guardioes', { nivelMonumento: 1, alegriaGrande: 0 });
  const e = de('esconderijo', { capacidade: 0, esconderijos: 0 });
  const f = de('frugal', { comidaDia: null, alegria20km: 0 });
  return {
    metrosPorMadeira: t.metrosPorMadeira, cienciaPor10km: t.cienciaPor10km,
    madeiraTerritorioMax: t.madeiraTerritorioMax, haPorMadeira: E.trilho.haPorMadeira,
    nivelMonumentoMax: g.nivelMonumento, alegriaMonumentoGrande: g.alegriaGrande,
    anexarOutrosMult: nv('guardioes') ? E.guardioes.anexarOutros : 1,
    capacidadeEsconderijo: e.capacidade, esconderijos: e.esconderijos,
    madeiraEmVezDePedraFerro: nv('frugal') > 0, comidaDia: f.comidaDia, alegria20km: f.alegria20km,
  };
}

// Custo de uma construção com o desconto da 📈 Economia
function custoComCiencia(custo, niveis) {
  const b = bonusCiencia(niveis);
  return Object.fromEntries(Object.entries(custo).map(([k, v]) =>
    [k, Math.ceil(v * (1 - (k === 'ouro' ? b.descontoOuro : b.descontoMateriais)))]));
}

// 💪 Vigor: depois de roubar um BAÚ, tenta levar um extra. `sorte1` decide se há extra, `sorte2` qual.
// `vitima` = { ouro, comidaFrigorifico } · devolve { ouro } ou { comida } ou null
function extraVigor(niveis, vitima, sorte1 = Math.random(), sorte2 = Math.random()) {
  const b = bonusCiencia(niveis), x = RAMOS_CIENCIA.vigor.extra;
  if (sorte1 >= b.chanceExtraRoubo) return null;
  return sorte2 < 0.5
    ? { ouro: Math.floor((vitima.ouro || 0) * x.ouro) }
    : { comida: Math.floor((vitima.comidaFrigorifico || 0) * x.comidaFrigorifico) };
}

// Próxima investigação possível num ramo (null se já está no máximo ou o jogador não tem nível)
function proximaCiencia(ramo, niveis, nivelJogador) {
  const atual = niveis[ramo] || 0;
  if (atual >= NIVEL_MAX_RAMO) return null;
  const nv = (ramoDeFacao(ramo) ? NIVEIS_CIENCIA_FACAO : NIVEIS_CIENCIA)[atual];
  return nivelJogador >= nv.nivelJogador ? { ramo, nivel: atual + 1, ...nv } : null;
}
