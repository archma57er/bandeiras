// =====================================================================
//  Categorias de POI e regras de jogo — o único sítio onde isto se define.
//  Usado pelo catálogo (catalogo.html) e, mais tarde, pelo jogo.
// =====================================================================

const RECURSOS = {
  ouro:    { nome: 'ouro',    icone: '🪙' },
  comida:  { nome: 'comida',  icone: '🍞' },
  pedra:   { nome: 'pedra',   icone: '🪨' },
  ferro:   { nome: 'ferro',   icone: '🔩' },
  madeira: { nome: 'madeira', icone: '🪵' },
  ciencia: { nome: 'ciência', icone: '🔬' },
  pao:     { nome: 'pão',     icone: '🥖' },   // só Humanos (moinho): conta no espaço da comida
  peixe:   { nome: 'peixe',   icone: '🐟' },   // só clãs de Elfos e de Humanos (POIs de costa): conta no espaço da comida
};

// Quantos POIs de cada categoria há por concelho (as que não aparecem aqui não têm limite).
// Os POIs manuais contam para o limite e entram sempre primeiro.
const LIMITES_POR_CONCELHO = {
  monumento: 2,
  banco: 6,
  mercado: 50,
  comida: 100,
  ferragens: 3,
  escola: 10,
  biblioteca: 10,
  costa: 25,   // 🎣 POIs de pesca (praias, portos, marinas)
};

// Monumentos maiores do que isto (diagonal, em metros) são "monumentos grandes":
// joga-se DENTRO dos limites deles, não à volta de um ponto.
const TAMANHO_GRANDE_M = 1000;
const RAIO_TROCOS_M = 30;   // num monumento grande feito de troços (aqueduto, linhas), "dentro" = a menos de 30 m

// Etiquetas que indicam que um nome é de uma rua, sítio natural, etc. (não é um negócio)
const NAO_E_NEGOCIO = t => t.highway || t.place || t.natural || t.landuse || t.boundary ||
  t.leisure || t.man_made === 'survey_point' || (t.tourism && !t.craft && !t.shop);
const nomeTem = (t, re) => !!t.name && re.test(t.name) && !NAO_E_NEGOCIO(t);
// Monumentos:
//   Portugal: Património Mundial (heritage=1) ou "Monumento Nacional"
//   Irlanda: património nacional (heritage=2, registo SMR) — lá não há protection_title
//            (em Portugal os heritage=2 têm sempre título, ex.: "Imóvel de Interesse Público", e não entram)
// (as "Zonas Especiais de Proteção" à volta de um monumento não são monumentos)
const eMonumento = t => !/^zona (especial )?de prote[cç][aã]o|^ZEP\b/i.test(t.name || '') &&
  (t.heritage === '1' || /monumento nacional|national monument/i.test(t.protection_title || '') ||
  (t.heritage === '2' && !t.protection_title && !!t.name));

// Cada categoria:
//   horasAnexar · cicloHoras (de quanto em quanto tempo produz) · produz (por ciclo)
//   maxCiclos (quantos ciclos acumula antes de parar) · minutosParaRecolher (opcional)
//   horasPorDia (opcional): só produz durante estas horas em cada 24 h
//   depositaAs (opcional): não acumula — entrega a produção sozinho todos os dias a esta hora (sem recolha)
//   teste(tags, elemento) → true se um elemento do OpenStreetMap pertence a esta categoria
// A ordem conta: um elemento fica na PRIMEIRA categoria que encaixar.
const CATEGORIAS = [
  {
    id: 'monumento-grande', nome: 'Monumento nacional (grande)', icone: '🏞️', cor: '#d4a017',
    horasAnexar: 1, cicloHoras: 24, produz: { ouro: 3 }, maxCiclos: 7,
    dentroDosLimites: true,     // tem de estar dentro da área (ou a menos de 30 m dos troços)
    energiaAnexar: 0,           // anexar não gasta energia
    energiaAndarDentro: 0,      // andar lá dentro não gasta energia
    minutosPorKmDentro: 10,     // cada km andado lá dentro tira 10 min ao tempo de anexar
    alegria: 1,                 // +1 de alegria enquanto for teu
    teste: (t, el) => eMonumento(t) && el.tam > TAMANHO_GRANDE_M && !!el.geo,
  },
  {
    id: 'monumento', nome: 'Monumento nacional', icone: '🏛️', cor: '#b58b2a',
    horasAnexar: 0.5, cicloHoras: 24, produz: { ouro: 3 }, maxCiclos: 7,
    teste: t => eMonumento(t),
    // Os mais emblemáticos são escolhidos primeiro: Património Mundial > templos, sés e cromeleques > palácios e castelos > conventos e mosteiros
    // (Irlanda: castelos, palácios e casas senhoriais > abadias, catedrais e torres redondas; "site of" = já não existe → último)
    prioridade: t => t.heritage === '1' ? 3
      : /\bsite of\b/i.test(t.name || '') ? 0
      : /^(templo|s[ée]\b|catedral|cromeleque)/i.test(t.name || '') ? 2.5   // ex.: Templo Romano e Cromeleque dos Almendres (Évora)
      : /^(pal[aá]cio|castelo)|\b(castle|palace)\b|\bhouse$/i.test(t.name || '') ? 2
      : /^(convento|mosteiro)|\b(abbey|priory|cathedral|round tower)\b/i.test(t.name || '') ? 1 : 0,
  },
  {
    // Ciência que se vai buscar de vez em quando: acumula até uma semana
    id: 'biblioteca', nome: 'Biblioteca', icone: '📚', cor: '#2e6f9e',
    horasAnexar: 2.5, cicloHoras: 1, produz: { ciencia: 1 }, maxCiclos: 168,
    teste: t => t.amenity === 'library',
  },
  {
    // Ciência que tem de se ir buscar todos os dias: só produz 8 h em cada 24 h e acumula no máximo 8
    id: 'escola', nome: 'Escola', icone: '🏫', cor: '#3a8f8f',
    horasAnexar: 2.5, cicloHoras: 1, produz: { ciencia: 1 }, maxCiclos: 8, horasPorDia: 8,
    teste: t => t.amenity === 'school' && !!t.name,
  },
  {
    id: 'banco', nome: 'Banco', icone: '🏦', cor: '#3f7d4e',
    // Deposita 10 de ouro por dia, sozinho, à hora de fecho (15h): não é preciso ir recolher.
    // Paga SEMPRE, mesmo que o consumo diário de ouro esteja por pagar (é a forma de sair desse aperto).
    horasAnexar: 2, cicloHoras: 24, produz: { ouro: 10 }, maxCiclos: 1, depositaAs: 15,
    teste: t => t.amenity === 'bank',
  },
  {
    id: 'mercado', nome: 'Supermercado / minimercado', icone: '🛒', cor: '#c4672c',
    horasAnexar: 10, cicloHoras: 1, produz: { comida: 3, ouro: 1 }, maxCiclos: 8, minutosParaRecolher: 5,
    teste: t => t.shop === 'supermarket' || t.shop === 'convenience',
  },
  {
    id: 'comida', nome: 'Restaurante / café / pastelaria', icone: '🍽️', cor: '#a8434a',
    horasAnexar: 10, cicloHoras: 24, produz: { comida: 2 }, maxCiclos: 1,
    teste: t => ['restaurant', 'cafe', 'fast_food'].includes(t.amenity) || ['bakery', 'pastry', 'deli'].includes(t.shop),
  },
  {
    id: 'pedra', nome: 'Oficina de pedra', icone: '🪨', cor: '#7d7f86',
    horasAnexar: 4, cicloHoras: 1, produz: { pedra: 1 }, maxCiclos: 4,
    teste: t => t.craft === 'stonemason' || nomeTem(t, /m[aá]rmore|granito|cantaria|marble|granite|stone ?works|stonemason|quarry products/i),
  },
  {
    id: 'metal', nome: 'Serralharia de metais', icone: '🔩', cor: '#4a6a8a',
    horasAnexar: 4, cicloHoras: 1, produz: { ferro: 1 }, maxCiclos: 4,
    teste: t => ['metal_construction', 'blacksmith', 'welder'].includes(t.craft) ||
      nomeTem(t, /serralharia|metal[uú]rgica|metalomec|steel|metal ?works|fabricat|welding|engineering works/i),
  },
  {
    id: 'madeira', nome: 'Serralharia de madeira (carpintaria)', icone: '🪵', cor: '#8a5a2b',
    horasAnexar: 4, cicloHoras: 1, produz: { madeira: 1 }, maxCiclos: 4,
    teste: t => ['carpenter', 'joiner', 'sawmill', 'cabinet_maker'].includes(t.craft) ||
      nomeTem(t, /carpintaria|marcenaria|serra[cç][aã]o|madeiras|joinery|carpentry|timber|sawmill|woodwork/i),
  },
  {
    // ⚠️ proposta: 1 ferro + 1 madeira a cada 2 h (o mesmo ritmo total de uma oficina)
    id: 'ferragens', nome: 'Loja de ferragens / bricolage', icone: '🛠️', cor: '#5f6b3a',
    horasAnexar: 4, cicloHoras: 2, produz: { ferro: 1, madeira: 1 }, maxCiclos: 2,
    teste: t => t.shop === 'hardware' || t.shop === 'doityourself',
  },
  {
    // 🎣 Pesca junto à costa (praias, portos e marinas · dados/costa.js): só para clãs de Elfos ou de Humanos
    // (tipo "só da fação") com pelo menos 500 pontos do clã. Os outros veem o POI mas não o podem anexar.
    id: 'costa', nome: 'Praia / porto (pesca)', icone: '🎣', cor: '#1f6fb2',
    horasAnexar: 2, cicloHoras: 2, produz: { peixe: 1 }, maxCiclos: 6,
    soClas: ['elfos', 'humanos'], pontosCla: 500,
    teste: t => t.natural === 'beach' || t.leisure === 'marina' || t.landuse === 'harbour' || t.harbour === 'yes',
  },
];

const categoriaPorId = id => CATEGORIAS.find(c => c.id === id);
const classificar = el => { const c = CATEGORIAS.find(c => c.teste(el.t, el)); return c ? c.id : null; };

// ---------------------------------------------------------------------
//  Feiras (POIs especiais que mudam de sítio)
// ---------------------------------------------------------------------
// Cada concelho tem UMA feira ativa de cada vez. Fica `diasPorSitio` dias num local e depois
// muda para outro (escolhido entre mercados e praças do OpenStreetMap). A escolha depende só
// da data, por isso todos os jogadores veem a feira no mesmo sítio.
const FEIRA = {
  nome: 'Feira', icone: '🎪', cor: '#9b59b6',
  horasAnexar: 0.25,         // 15 min no local; anexa-se depressa; dá acesso a vender enquanto a feira lá estiver
  diasPorSitio: 3,
  candidato: t => t.amenity === 'marketplace' || t.place === 'square',
};

function candidatosFeira(osm, concelhos) {
  const lista = [];
  for (const el of osm) {
    if (!FEIRA.candidato(el.t) || el.tam > TAMANHO_GRANDE_M) continue;
    const concelho = concelhoDe(el.lat, el.lng, concelhos);
    if (!concelho) continue;
    lista.push({ id: 'feira-' + el.id, nome: el.t.name || 'Mercado', lat: el.lat, lng: el.lng, concelho, osmId: el.id });
  }
  return lista.sort((a, b) => a.id < b.id ? -1 : 1);
}

// Feira ativa num concelho numa data (mesmo resultado para todos os jogadores)
function feiraAtiva(candidatos, concelho, data = new Date()) {
  const aqui = candidatos.filter(c => c.concelho === concelho);
  if (!aqui.length) return null;
  const dia = Math.floor(data.getTime() / 86400000);
  const periodo = Math.floor(dia / FEIRA.diasPorSitio);
  let h = 2166136261;                                  // hash simples (FNV-1a) de concelho + período
  for (const ch of concelho + ':' + periodo) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const escolhido = aqui[(h >>> 0) % aqui.length];
  const fim = new Date((periodo + 1) * FEIRA.diasPorSitio * 86400000);
  return { ...escolhido, ate: fim };
}

// ---------------------------------------------------------------------
//  Geometria
// ---------------------------------------------------------------------
function distanciaM(lat1, lng1, lat2, lng2) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Paridade de cruzamentos sobre um conjunto de troços (funciona mesmo com contornos em vários pedaços)
function dentroDeTrocos(lat, lng, trocos) {
  let dentro = false;
  for (const t of trocos) for (let i = 1; i < t.length; i++) {
    const [ya, xa] = t[i - 1], [yb, xb] = t[i];
    if ((ya > lat) !== (yb > lat) && lng < (xb - xa) * (lat - ya) / (yb - ya) + xa) dentro = !dentro;
  }
  return dentro;
}

// Distância (m) de um ponto a uma linha (aproximação plana, ótima para estas distâncias)
function distanciaALinha(lat, lng, linha) {
  const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 111320;
  let min = Infinity;
  for (let i = 1; i < linha.length; i++) {
    const ax = (linha[i - 1][1] - lng) * kx, ay = (linha[i - 1][0] - lat) * ky;
    const bx = (linha[i][1] - lng) * kx, by = (linha[i][0] - lat) * ky;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const u = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
    min = Math.min(min, Math.hypot(ax + u * dx, ay + u * dy));
  }
  return min;
}

// O jogador está dentro de um monumento grande?
function dentroDoMonumento(lat, lng, geo) {
  if (geo.areas.length && geo.areas.some(a => dentroDeTrocos(lat, lng, [a]))) return true;
  // Áreas feitas de vários pedaços (ex.: fronteira em 3 troços): testar o conjunto
  if (geo.areas.length > 1 && dentroDeTrocos(lat, lng, geo.areas)) return true;
  if (geo.linhas.some(l => distanciaALinha(lat, lng, l) <= RAIO_TROCOS_M)) return true;
  return geo.pontos.some(([a, b]) => distanciaM(lat, lng, a, b) <= RAIO_TROCOS_M);
}

// Concelho de um ponto (CONCELHOS vem de dados/concelhos.js)
function concelhoDe(lat, lng, concelhos) {
  for (const [nome, g] of Object.entries(concelhos)) {
    const polis = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const p of polis) {
      const aneis = p.map(anel => anel.map(([x, y]) => [y, x]));
      if (dentroDeTrocos(lat, lng, aneis)) return nome;
    }
  }
  return null;
}

// ---------------------------------------------------------------------
//  Seleção
// ---------------------------------------------------------------------

// Escolhe `n` POIs bem espalhados pelo território: começa pelos obrigatórios (manuais, prioritários)
// e depois junta sempre o candidato mais longe de todos os já escolhidos.
function escolherEspalhados(candidatos, n, jaEscolhidos) {
  const escolhidos = [...jaEscolhidos];
  const resto = [...candidatos];
  n += jaEscolhidos.length;
  if (!escolhidos.length && resto.length) {
    // primeiro: o mais perto do centro do grupo
    const cy = resto.reduce((s, p) => s + p.lat, 0) / resto.length, cx = resto.reduce((s, p) => s + p.lng, 0) / resto.length;
    resto.sort((a, b) => distanciaM(a.lat, a.lng, cy, cx) - distanciaM(b.lat, b.lng, cy, cx));
    escolhidos.push(resto.shift());
  }
  const minDist = resto.map(p => Math.min(...escolhidos.map(e => distanciaM(p.lat, p.lng, e.lat, e.lng))));
  while (escolhidos.length < n && resto.length) {
    let i = 0;
    for (let j = 1; j < resto.length; j++) if (minDist[j] > minDist[i]) i = j;
    const [p] = resto.splice(i, 1); minDist.splice(i, 1);
    escolhidos.push(p);
    for (let j = 0; j < resto.length; j++) minDist[j] = Math.min(minDist[j], distanciaM(resto[j].lat, resto[j].lng, p.lat, p.lng));
  }
  return escolhidos.slice(jaEscolhidos.length);
}

// Junta OSM + manuais, tira exclusões e duplicados, e aplica os limites por concelho.
function construirPois(osm, manuais, excluidos, concelhos) {
  const todos = [];
  for (const el of osm) {
    if (excluidos[el.id]) continue;
    const cat = classificar(el);
    if (!cat) continue;
    if (cat !== 'monumento-grande' && cat !== 'costa' && el.tam > TAMANHO_GRANDE_M) continue;   // áreas enormes que não são monumentos (praias compridas contam)
    const nome = el.t.name || categoriaPorId(cat).nome;
    // o mesmo sítio desenhado como ponto e como edifício (mesmo nome, < 80 m)
    if (todos.some(p => p.cat === cat && p.nome.toLowerCase() === nome.toLowerCase() && distanciaM(p.lat, p.lng, el.lat, el.lng) < 80)) continue;
    const c = categoriaPorId(cat);
    todos.push({
      id: 'osm-' + el.id, nome, cat, lat: el.lat, lng: el.lng, origem: 'osm', osmId: el.id,
      concelho: concelhoDe(el.lat, el.lng, concelhos), prioridade: c.prioridade ? c.prioridade(el.t) : 0,
      geo: el.geo || null,
    });
  }
  const man = manuais.map(m => ({ ...m, origem: 'manual', concelho: concelhoDe(m.lat, m.lng, concelhos) }));

  const final = [...man];
  const grupos = {};
  for (const p of todos) (grupos[p.cat + '|' + (p.concelho || '-')] ||= []).push(p);
  for (const [chave, lista] of Object.entries(grupos)) {
    const [cat, concelho] = chave.split('|');
    const limite = LIMITES_POR_CONCELHO[cat];
    if (limite === undefined) { final.push(...lista); continue; }        // sem limite
    if (concelho === '-') continue;                                        // fora dos concelhos
    const manuaisAqui = man.filter(m => m.cat === cat && m.concelho === concelho);
    let vagas = limite - manuaisAqui.length;
    if (vagas <= 0) continue;
    lista.sort((a, b) => a.id < b.id ? -1 : 1);                            // ordem estável
    // Por níveis de prioridade (do mais alto para o mais baixo); dentro de cada nível, os mais espalhados
    const escolhidos = [...manuaisAqui];
    const niveis = [...new Set(lista.map(p => p.prioridade))].sort((a, b) => b - a);
    for (const nv of niveis) {
      if (vagas <= 0) break;
      const novos = escolherEspalhados(lista.filter(p => p.prioridade === nv), vagas, escolhidos);
      escolhidos.push(...novos); final.push(...novos); vagas -= novos.length;
    }
  }
  return final;
}
