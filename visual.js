// =====================================================================
//  🎨 Visual: avatares desenhados, a bandeira de cada jogador (forma, padrão,
//  cores, borda, emblema e mastro), conquistas e gemas 💎.
//  Tudo em SVG feito aqui (sem imagens): fica nítido em qualquer tamanho.
//  Usa as variáveis e funções do jogo (P, nivel, meus, btn, cab, aviso…), que já existem quando isto corre.
// =====================================================================
let svgN = 0;   // ids únicos para os gradientes e recortes de cada desenho

// ---- Cores ----------------------------------------------------------------
function tom(hex, f) {   // f > 0 clareia, f < 0 escurece
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]
    .map(v => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
const estrela = (cx, cy, R, r, pontas = 5) => 'M' + Array.from({ length: pontas * 2 }, (_, i) => {
  const a = Math.PI / pontas * i - Math.PI / 2, d = i % 2 ? r : R;
  return `${(cx + d * Math.cos(a)).toFixed(2)} ${(cy + d * Math.sin(a)).toFixed(2)}`;
}).join(' L') + ' Z';

// =====================================================================
//  Avatares
// =====================================================================
const PELES = ['#f7d9bf', '#eab890', '#c98d60', '#8f5b3a', '#5c3a25'];
// cabelo: [estilo, cor] · barba: [tipo, cor] · chapeu: [tipo, cor] · peito: detalhe da roupa · extra: acessório
// `gemas` = avatar pago (💎). Os outros são grátis para todos.
const AVATARES_DEF = {
  elfa:       { nome: 'Elfa',        pele: 0, cabelo: ['longo', '#ecc66b'], orelhas: 'bico', roupa: '#3f7d3a', chapeu: ['flores'], peito: 'v' },
  construtor: { nome: 'Construtor',  pele: 2, cabelo: ['curto', '#4a3020'], roupa: '#e07b24', chapeu: ['capacete', '#f2c230'], peito: 'botoes' },
  mago:       { nome: 'Mago',        pele: 0, cabelo: ['curto', '#e8e8e8'], barba: ['longa', '#f1f1f1'], roupa: '#34489a', chapeu: ['mago', '#34489a'] },
  fado:       { nome: 'Fado',        pele: 1, cabelo: ['curto', '#c4572e'], roupa: '#5fb3a8', extra: 'asas', peito: 'v' },
  agricultora:{ nome: 'Agricultora', pele: 1, cabelo: ['longo', '#6b4226'], roupa: '#c0504d', chapeu: ['palha', '#c0504d'], peito: 'avental' },
  mercador:   { nome: 'Mercador',    pele: 3, cabelo: ['curto', '#1e1e1e'], roupa: '#5b3f8c', extra: 'monoculo', peito: 'botoes' },
  elfo:       { nome: 'Elfo',        pele: 0, cabelo: ['longo', '#d9dbe3'], orelhas: 'bico', roupa: '#2f5d50', chapeu: ['capuz', '#2f5d50'] },
  ferreira:   { nome: 'Ferreira',    pele: 3, cabelo: ['apanhado', '#1e1e1e'], roupa: '#5a4636', chapeu: ['lenco', '#c0392b'], peito: 'avental' },
  maga:       { nome: 'Maga',        pele: 2, cabelo: ['longo', '#3b2347'], roupa: '#6b3fa0', chapeu: ['mago', '#6b3fa0'] },
  agricultor: { nome: 'Agricultor',  pele: 2, cabelo: ['curto', '#5a3a22'], barba: ['curta', '#5a3a22'], roupa: '#4a6a8a', chapeu: ['palha', '#4a6a8a'], peito: 'botoes' },
  fada:       { nome: 'Fada',        pele: 0, cabelo: ['longo', '#f2a7c3'], roupa: '#8fd3ea', extra: 'asas', peito: 'v' },
  mecanico:   { nome: 'Mecânico',    pele: 4, cabelo: ['curto', '#151515'], roupa: '#3b6a8a', chapeu: ['bone', '#2f80c0'], extra: 'oculos' },
  gnomo:      { nome: 'Gnomo',       pele: 1, cabelo: ['curto', '#e8e8e8'], barba: ['longa', '#f1f1f1'], roupa: '#2e6b3a', chapeu: ['gnomo', '#c0392b'] },
  // 💎 pagos
  rei:        { nome: 'Rei',         pele: 1, cabelo: ['curto', '#6b4226'], barba: ['curta', '#6b4226'], roupa: '#9b1c2c', chapeu: ['coroa'], peito: 'arminho', gemas: 30 },
  rainha:     { nome: 'Rainha',      pele: 0, cabelo: ['longo', '#e2b857'], roupa: '#6a1b9a', chapeu: ['coroa'], peito: 'arminho', gemas: 30 },
  cacadora:   { nome: 'Caçadora',    pele: 1, cabelo: ['longo', '#b5482a'], roupa: '#3c4a2a', chapeu: ['capuz', '#3c4a2a'], gemas: 25 },
  cavaleira:  { nome: 'Cavaleira',   pele: 1, roupa: '#7a8590', chapeu: ['elmo'], peito: 'armadura', gemas: 40 },
  pirata:     { nome: 'Pirata',      pele: 2, cabelo: ['curto', '#151515'], barba: ['curta', '#151515'], roupa: '#2b2b2b', chapeu: ['tricornio'], extra: 'pala', peito: 'botoes', gemas: 40 },
  druida:     { nome: 'Druida',      pele: 2, cabelo: ['longo', '#8a8a8a'], barba: ['longa', '#b0b0b0'], roupa: '#4b5d2a', chapeu: ['galhos'], gemas: 50 },
  gnomoOuro:  { nome: 'Gnomo de Ouro', pele: 1, cabelo: ['curto', '#f1f1f1'], barba: ['longa', '#ffffff'], roupa: '#b8891e', chapeu: ['gnomo', '#e3b23c'], extra: 'monoculo', gemas: 60 },
  rainhaElfica:{ nome: 'Rainha Élfica', pele: 0, cabelo: ['longo', '#f4f4f8'], orelhas: 'bico', roupa: '#1f6f8b', chapeu: ['tiara'], peito: 'v', gemas: 60 },
};
const AVATARES_PAGOS = Object.keys(AVATARES_DEF).filter(k => AVATARES_DEF[k].gemas);
// Gravações antigas tinham emojis: passam para o desenho equivalente
const AVATAR_ANTIGO = { '🧝‍♀️': 'elfa', '👷': 'construtor', '🧙‍♂️': 'mago', '🧚‍♂️': 'fado', '👩‍🌾': 'agricultora', '🧑‍💼': 'mercador',
  '🧝‍♂️': 'elfo', '👩‍🏭': 'ferreira', '🧙‍♀️': 'maga', '👨‍🌾': 'agricultor', '🧚‍♀️': 'fada', '🧑‍🔧': 'mecanico' };
const idAvatar = a => AVATARES_DEF[a] ? a : (AVATAR_ANTIGO[a] || 'elfa');
const avatarPago = a => !!AVATARES_DEF[idAvatar(a)].gemas;

function chapeuSvg([tipo, c = '#555']) {
  const esc = tom(c, -.3), cla = tom(c, .25);
  switch (tipo) {
    case 'mago': return `<path d="M12 27 C21 22 43 22 52 27 C46 30.5 18 30.5 12 27 Z" fill="${esc}"/>
      <path d="M18 26 C23 18 28 9 38 1.5 C36 10 41 19 46 26 Z" fill="${c}"/><path d="M18.5 24.5 C26 22.5 38 22.5 45.5 24.5 L46 26.5 C38 24.5 26 24.5 18 26.5 Z" fill="#f2c94c"/>
      <path d="${estrela(32, 15, 3.2, 1.3)}" fill="#f2c94c"/><circle cx="37" cy="8" r="1" fill="#fff" opacity=".8"/>`;
    case 'capacete': return `<path d="M17.5 28 C17.5 14.5 46.5 14.5 46.5 28 Z" fill="${c}"/><path d="M22 20 C25 17 29 16 32 16" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="13.5" y="26.5" width="37" height="3.6" rx="1.8" fill="${esc}"/><rect x="30.5" y="15.5" width="3" height="11.5" rx="1.5" fill="${cla}"/>`;
    case 'gnomo': return `<path d="M17 28.5 C18 14 28 2 46 2.5 C39 8 45 18 47 28.5 Z" fill="${c}"/><path d="M27 10 C31 6 37 4 42 4" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M15.5 27 C25 24 39 24 48.5 27 L48.5 30.5 C39 27.8 25 27.8 15.5 30.5 Z" fill="${esc}"/>`;
    case 'palha': return `<ellipse cx="32" cy="25.5" rx="23" ry="5.2" fill="#d9b35d"/><path d="M21 25 C21 12.5 43 12.5 43 25 Z" fill="#ecd085"/>
      <rect x="21" y="21" width="22" height="3.2" fill="${c}"/><path d="M14 25 C22 28 42 28 50 25" stroke="#b8933f" stroke-width=".8" fill="none"/>`;
    case 'bone': return `<path d="M19 27.5 C19 13.5 45 13.5 45 27.5 Z" fill="${c}"/><path d="M40 26.5 C47 24.5 54 25.5 56.5 28.5 L41 29 Z" fill="${esc}"/>
      <circle cx="32" cy="15" r="1.5" fill="${esc}"/><path d="M25 18.5 C27 16.5 30 16 32 16" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" fill="none"/>`;
    case 'coroa': return `<path d="M19.5 24 L20.5 11.5 L26.5 17.5 L32 8.5 L37.5 17.5 L43.5 11.5 L44.5 24 Z" fill="#f2c94c" stroke="#a8780e" stroke-width=".9" stroke-linejoin="round"/>
      <rect x="19.5" y="21.5" width="25" height="3" fill="#d9a520"/><circle cx="32" cy="18.5" r="1.9" fill="#d6304a"/><circle cx="25.5" cy="20" r="1.3" fill="#3a7bd5"/><circle cx="38.5" cy="20" r="1.3" fill="#3a7bd5"/>
      <circle cx="20.5" cy="11.5" r="1.2" fill="#f2c94c"/><circle cx="32" cy="8.5" r="1.3" fill="#f2c94c"/><circle cx="43.5" cy="11.5" r="1.2" fill="#f2c94c"/>`;
    case 'tiara': return `<path d="M20.5 25 C25 20.5 39 20.5 43.5 25 L42.5 26.5 C38 23 26 23 21.5 26.5 Z" fill="#e6eef2"/>
      <path d="M32 14.5 L35 21 L32 24 L29 21 Z" fill="#8fe3ff" stroke="#e6eef2" stroke-width="1"/><path d="M25.5 19.5 L27 22.5 L24.5 23.5 Z M38.5 19.5 L37 22.5 L39.5 23.5 Z" fill="#e6eef2"/>`;
    case 'elmo': return `<path d="M16.5 38 C15 14 49 14 47.5 38 C47.5 44.5 42 48.5 32 48.5 C22 48.5 16.5 44.5 16.5 38 Z" fill="#aeb8c2"/>
      <path d="M21 22 C24 18 28 17 31 17" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="20.5" y="31" width="23" height="3.4" rx="1.7" fill="#262b30"/><path d="M32 35 L32 48" stroke="#8a949e" stroke-width="1.4"/>
      <circle cx="26" cy="40.5" r=".8" fill="#262b30"/><circle cx="29" cy="42" r=".8" fill="#262b30"/><circle cx="35" cy="42" r=".8" fill="#262b30"/><circle cx="38" cy="40.5" r=".8" fill="#262b30"/>
      <path d="M32 16.5 C33 7 43 2.5 51 7.5 C44 8 38 11.5 35.5 17.5 Z" fill="#c0392b"/>`;
    case 'tricornio': return `<path d="M10.5 25.5 C18.5 21 25 13.5 32 13.5 C39 13.5 45.5 21 53.5 25.5 C45 23.5 39 28 32 28 C25 28 19 23.5 10.5 25.5 Z" fill="#1d1d1d"/>
      <path d="M13.5 24.8 C21 22 25.5 24.2 32 24.2 C38.5 24.2 43 22 50.5 24.8" stroke="#c9a227" stroke-width="1.1" fill="none"/>
      <circle cx="32" cy="19.5" r="2.4" fill="#f4f4f4"/><circle cx="31.1" cy="19.2" r=".55" fill="#1d1d1d"/><circle cx="32.9" cy="19.2" r=".55" fill="#1d1d1d"/>`;
    case 'flores': return `<path d="M19 26 C25 21 39 21 45 26" stroke="#4f8a2e" stroke-width="2.2" fill="none"/>` +
      [[20, 25.5, '#f48fb1'], [25, 21.5, '#fff59d'], [32, 20, '#ffffff'], [39, 21.5, '#f48fb1'], [44, 25.5, '#fff59d']]
        .map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="${f}"/><circle cx="${x}" cy="${y}" r="1" fill="#f0a030"/>`).join('');
    case 'galhos': return `<path d="M24 23 L20 12.5 L15.5 10 M20 12.5 L19 6 M22 17.5 L26.5 13 M40 23 L44 12.5 L48.5 10 M44 12.5 L45 6 M42 17.5 L37.5 13"
      stroke="#7a5230" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M19.5 26 C26 21.5 38 21.5 44.5 26" stroke="#4f7d2c" stroke-width="3" fill="none"/><circle cx="24" cy="23.5" r="1.4" fill="#86c25a"/><circle cx="40" cy="23.5" r="1.4" fill="#86c25a"/>`;
    case 'lenco': return `<path d="M18.5 28.5 C18 16.5 46 16.5 45.5 28.5 C40 25.5 24 25.5 18.5 28.5 Z" fill="${c}"/><path d="M44.5 26.5 L52 31.5 L47.5 23.5 Z" fill="${esc}"/>
      <circle cx="26" cy="21.5" r=".9" fill="#fff" opacity=".7"/><circle cx="32" cy="19.5" r=".9" fill="#fff" opacity=".7"/><circle cx="38" cy="21.5" r=".9" fill="#fff" opacity=".7"/>`;
    default: return '';
  }
}

function svgAvatar(id, cor) {
  const A = AVATARES_DEF[idAvatar(id)], pele = PELES[A.pele], escura = tom(pele, -.2), n = ++svgN;
  const [estilo, corCab] = A.cabelo || ['', '#3a2a1e'], chapeu = A.chapeu ? A.chapeu[0] : '';
  const fechado = chapeu === 'elmo';   // o elmo tapa a cara
  let s = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <defs><radialGradient id="avL${n}" cx=".35" cy=".2" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>
    <rect width="64" height="64" fill="${cor || '#56604a'}"/><rect width="64" height="64" fill="url(#avL${n})"/>`;
  if (A.extra === 'asas') s += `<ellipse cx="13" cy="38" rx="8" ry="14" fill="#dff6ff" fill-opacity=".8" stroke="#fff" stroke-width=".8" transform="rotate(-28 13 38)"/>
    <ellipse cx="51" cy="38" rx="8" ry="14" fill="#dff6ff" fill-opacity=".8" stroke="#fff" stroke-width=".8" transform="rotate(28 51 38)"/>`;
  if (chapeu === 'capuz') s += `<path d="M13 50 C10 22 21 12 32 12 C43 12 54 22 51 50 Z" fill="${tom(A.chapeu[1], -.25)}"/>`;
  if (estilo === 'longo') s += `<path d="M17.5 33 C16 18 24 15 32 15 C40 15 48 18 46.5 33 L48 52 C45 54 41 51 41 47 L23 47 C23 51 19 54 16 52 Z" fill="${tom(corCab, -.12)}"/>`;
  // corpo
  s += `<path d="M5 64 C7 51 18 46 32 46 C46 46 57 51 59 64 Z" fill="${A.roupa}"/><path d="M5 64 C7 51 18 46 32 46" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/>`;
  s += ({
    v: `<path d="M27 46.5 L32 53.5 L37 46.5 Z" fill="${escura}"/>`,
    botoes: `<path d="M27 46.5 L32 52 L37 46.5 Z" fill="${escura}"/><circle cx="32" cy="56" r="1.1" fill="${tom(A.roupa, .45)}"/><circle cx="32" cy="60.5" r="1.1" fill="${tom(A.roupa, .45)}"/>`,
    avental: `<path d="M27 46.5 L32 52 L37 46.5 Z" fill="${escura}"/><path d="M23.5 53 L40.5 53 L43 64 L21 64 Z" fill="#e3d3b0"/><path d="M23.5 53 L26 48.5 M40.5 53 L38 48.5" stroke="#e3d3b0" stroke-width="1.6"/>`,
    arminho: `<path d="M27 46.5 L32 52 L37 46.5 Z" fill="${escura}"/><path d="M12 54 C19 47.5 45 47.5 52 54 C45 57.5 19 57.5 12 54 Z" fill="#fafafa"/>
      <circle cx="20" cy="53.5" r=".9" fill="#222"/><circle cx="27" cy="55" r=".9" fill="#222"/><circle cx="37" cy="55" r=".9" fill="#222"/><circle cx="44" cy="53.5" r=".9" fill="#222"/>`,
    armadura: `<path d="M14 64 C15 54 22 49 32 49 C42 49 49 54 50 64 Z" fill="#c3ccd4"/><path d="M32 50 L32 64 M20 55 C26 53 38 53 44 55" stroke="#8a949e" stroke-width="1.3" fill="none"/>`,
  })[A.peito] || '';
  s += `<rect x="27" y="40" width="10" height="9" rx="3" fill="${escura}"/>`;
  s += A.orelhas === 'bico'
    ? `<path d="M21 31.5 L9.5 22.5 L20 39.5 Z" fill="${pele}"/><path d="M43 31.5 L54.5 22.5 L44 39.5 Z" fill="${pele}"/><path d="M19.5 31.5 L13 26.5" stroke="${escura}" stroke-width=".9"/><path d="M44.5 31.5 L51 26.5" stroke="${escura}" stroke-width=".9"/>`
    : `<circle cx="19.3" cy="35" r="3.2" fill="${pele}"/><circle cx="44.7" cy="35" r="3.2" fill="${pele}"/>`;
  s += `<ellipse cx="32" cy="33" rx="13" ry="14" fill="${pele}"/>`;
  if (!fechado) {
    s += `<ellipse cx="27" cy="34" rx="1.9" ry="2.3" fill="#2b1d14"/><ellipse cx="37" cy="34" rx="1.9" ry="2.3" fill="#2b1d14"/>
      <circle cx="27.6" cy="33.1" r=".75" fill="#fff"/><circle cx="37.6" cy="33.1" r=".75" fill="#fff"/>
      <path d="M24.4 30 Q27 28.5 29.4 29.8 M34.6 29.8 Q37 28.5 39.6 30" stroke="${tom(corCab, -.1)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M32 35.5 Q33.7 38 31.6 38.7" stroke="${escura}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <circle cx="23.8" cy="38.6" r="2.6" fill="#ff6f6f" opacity=".25"/><circle cx="40.2" cy="38.6" r="2.6" fill="#ff6f6f" opacity=".25"/>`;
    if (A.barba) {
      const [tipo, cb] = A.barba;
      s += tipo === 'longa'
        ? `<path d="M19.5 35 C20 47 25 59 32 63 C39 59 44 47 44.5 35 C43 41 39 43.5 32 43.5 C25 43.5 21 41 19.5 35 Z" fill="${cb}"/><path d="M28 50 C30 54 31 57 32 60 M36 50 C34.5 54 33 57 32 60" stroke="${tom(cb, -.15)}" stroke-width=".8" fill="none"/>`
        : `<path d="M19.5 35 C20 45 26 50 32 50 C38 50 44 45 44.5 35 C43 41 39 43.5 32 43.5 C25 43.5 21 41 19.5 35 Z" fill="${cb}"/>`;
      s += `<path d="M26.5 41.3 C29 39.3 31 39.8 32 40.6 C33 39.8 35 39.3 37.5 41.3 C35 42.1 33 41.9 32 41.4 C31 41.9 29 42.1 26.5 41.3 Z" fill="${tom(cb, -.1)}"/>
        <path d="M30 43.4 Q32 44.6 34 43.4" stroke="#7a2d2d" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    } else s += `<path d="M28.6 41 Q32 44.2 35.4 41" stroke="#7a2d2d" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  }
  if (estilo && !fechado && chapeu !== 'capuz') s += `<path d="M18.6 32 C17.5 20 25 15.5 32 15.5 C40 15.5 47 20 45.4 32 C44 27 40 23.5 35 23 C31 25.5 25 26 21 28 C20 29.5 19 30.5 18.6 32 Z" fill="${corCab}"/>
    <path d="M24 19.5 C27 17.5 30 17 33 17" stroke="#fff" stroke-opacity=".25" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  if (estilo === 'apanhado') s += `<circle cx="32" cy="13.5" r="5.5" fill="${corCab}"/>`;
  if (chapeu === 'capuz') s += `<path d="M18.5 31 C18.5 20 25 15.5 32 15.5 C39 15.5 45.5 20 45.5 31 C43.5 24.5 38.5 21.5 32 21.5 C25.5 21.5 20.5 24.5 18.5 31 Z" fill="${A.chapeu[1]}"/>
    <path d="M24 18.5 C27 16.8 30 16.3 33 16.3" stroke="#fff" stroke-opacity=".22" stroke-width="1.5" fill="none"/>`;
  else if (A.chapeu) s += chapeuSvg(A.chapeu);
  s += ({
    oculos: `<circle cx="27" cy="34" r="3.8" fill="#bfe6ff" fill-opacity=".25" stroke="#222" stroke-width="1.3"/><circle cx="37" cy="34" r="3.8" fill="#bfe6ff" fill-opacity=".25" stroke="#222" stroke-width="1.3"/><path d="M30.8 33.6 L33.2 33.6" stroke="#222" stroke-width="1.3"/>`,
    pala: `<path d="M18.5 28 L45.5 36.5" stroke="#111" stroke-width="1.1"/><ellipse cx="37" cy="34" rx="3.7" ry="3.3" fill="#111"/>`,
    monoculo: `<circle cx="37" cy="34" r="3.7" fill="#fff" fill-opacity=".2" stroke="#c9a227" stroke-width="1.3"/><path d="M40.5 35.5 Q42 44 39 50" stroke="#c9a227" stroke-width=".8" fill="none"/>`,
  })[A.extra] || '';
  return s + '</svg>';
}
// Avatar pequeno (ranking, donos dos POIs)
const avatarMini = (id, cor) => `<span class="avMini${avatarPago(id) ? ' premium' : ''}">${svgAvatar(id, cor)}</span>`;

// =====================================================================
//  A bandeira (estandarte) de cada jogador
// =====================================================================
// `desb`: o que a desbloqueia · null = grátis · { conq } = uma conquista · { gemas } = compra-se · { conq, facao } = só para essa fação
const FORMAS_BANDEIRA = {
  retangular: { nome: 'Retangular', desb: null, centro: [34.5, 23],
    d: 'M11 8 C23 5 35 11 46 8 C51 6.8 55 7 58 8 L58 38 C55 37 51 36.8 46 38 C35 41 23 35 11 38 Z' },
  cauda:      { nome: 'Cauda de andorinha', desb: { conq: 'km5' }, centro: [30, 23],
    d: 'M11 8 C23 5 35 11 46 8 C51 6.8 55 7 58 8 L48 23 L58 38 C55 37 51 36.8 46 38 C35 41 23 35 11 38 Z' },
  pendao:     { nome: 'Pendão', desb: { conq: 'bandeira' }, centro: [26, 23],
    d: 'M11 8 C26 10 42 16 58 23 C42 30 26 36 11 38 Z' },
  dentes:     { nome: 'Galhardete', desb: { gemas: 15 }, centro: [31, 23],
    d: 'M11 8 C23 5 35 11 46 8 L58 8 L52 15.5 L58 23 L52 30.5 L58 38 L46 38 C35 41 23 35 11 38 Z' },
  escudo:     { nome: 'Brasão', desb: { gemas: 25 }, centro: [34.5, 21],
    d: 'M11 8 L58 8 L58 24 C58 33 48 38 34.5 41 C21 38 11 33 11 24 Z' },
};
const PADROES_BANDEIRA = {
  liso:     { nome: 'Liso', desb: null, svg: () => '' },
  duas:     { nome: 'Duas cores', desb: null, svg: c2 => `<rect x="34.5" y="0" width="30" height="64" fill="${c2}"/>` },
  faixa:    { nome: 'Faixa', desb: null, svg: c2 => `<rect x="0" y="18" width="64" height="10" fill="${c2}"/>` },
  riscas:   { nome: 'Riscas', desb: { gemas: 10 }, svg: c2 => `<rect x="0" y="13" width="64" height="5" fill="${c2}"/><rect x="0" y="23" width="64" height="5" fill="${c2}"/><rect x="0" y="33" width="64" height="5" fill="${c2}"/>` },
  diagonal: { nome: 'Diagonal', desb: { conq: 'nivel5' }, svg: c2 => `<polygon points="11,40 58,6 64,6 64,44 11,44" fill="${c2}"/>` },
  cruz:     { nome: 'Cruz', desb: { conq: 'anexar5' }, svg: c2 => `<rect x="22" y="0" width="7" height="64" fill="${c2}"/><rect x="0" y="19.5" width="64" height="7" fill="${c2}"/>` },
  quartos:  { nome: 'Esquartelado', desb: { conq: 'pontos100' }, svg: c2 => `<rect x="34.5" y="0" width="30" height="23" fill="${c2}"/><rect x="0" y="23" width="34.5" height="30" fill="${c2}"/>` },
  xadrez:   { nome: 'Xadrez', desb: { conq: 'recon50' }, svg: c2 => Array.from({ length: 15 }, (_, i) => { const x = i % 5, y = Math.floor(i / 5);
    return (x + y) % 2 ? `<rect x="${11 + x * 9.4}" y="${6 + y * 11}" width="9.5" height="11" fill="${c2}"/>` : ''; }).join('') },
  chevron:  { nome: 'Triângulo', desb: { gemas: 10 }, svg: c2 => `<polygon points="5,4 31,23 5,42" fill="${c2}"/>` },
  sol:      { nome: 'Disco', desb: { gemas: 15 }, svg: c2 => `<circle cx="34.5" cy="23" r="10.5" fill="${c2}"/>` },
  raios:    { nome: 'Raios', desb: { gemas: 30 }, svg: c2 => Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, b = a + Math.PI / 10, R = 40;
    return `<polygon points="34.5,23 ${(34.5 + R * Math.cos(a)).toFixed(1)},${(23 + R * Math.sin(a)).toFixed(1)} ${(34.5 + R * Math.cos(b)).toFixed(1)},${(23 + R * Math.sin(b)).toFixed(1)}" fill="${c2}"/>`; }).join('') },
};
const BORDAS_BANDEIRA = {
  nenhuma:    { nome: 'Sem borda', desb: null, svg: () => '' },
  simples:    { nome: 'Simples', desb: null, svg: d => `<path d="${d}" fill="none" stroke="#fff" stroke-width="2.6"/>` },
  dupla:      { nome: 'Dupla dourada', desb: { conq: 'km25' }, svg: d => `<path d="${d}" fill="none" stroke="#e3b23c" stroke-width="5.5"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.6"/>` },
  pontilhada: { nome: 'Rendada', desb: { gemas: 10 }, svg: d => `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="1.6 2.2"/>` },
  franjas:    { nome: 'Franjas de ouro', desb: { conq: 'recon200' }, svg: d => `<path d="${d}" fill="none" stroke="#e3b23c" stroke-width="3"/>`, fora: () =>
    Array.from({ length: 10 }, (_, i) => `<path d="M58 ${9.5 + i * 3} l3.2 .6" stroke="#e3b23c" stroke-width="1.3" stroke-linecap="round"/>`).join('') },
  fogo:       { nome: 'Chamas', desb: { conq: 'nivel15' }, svg: d => `<path d="${d}" fill="none" stroke="#e8590c" stroke-width="6"/><path d="${d}" fill="none" stroke="#ffd43b" stroke-width="2.4" stroke-dasharray="3 2.5"/>` },
  gelo:       { nome: 'Gelo', desb: { gemas: 25 }, svg: d => `<path d="${d}" fill="none" stroke="#a5e8ff" stroke-width="5"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 3"/>` },
};
// Emblemas: desenhos numa caixa de 24×24 (cor à escolha)
const LOGOS_BANDEIRA = {
  nenhum:   { nome: 'Sem emblema', desb: null, d: '' },
  estrela:  { nome: 'Estrela', desb: null, d: estrela(12, 12.5, 11, 4.6) },
  folha:    { nome: 'Folha', desb: null, d: 'M4 20 C4 9 12 3 21 3 C21 12 15 20 4 20 Z M6.5 18 L15 9.5 L15.8 10.3 L7.3 18.8 Z' },
  sol:      { nome: 'Sol', desb: { conq: 'casa' }, d: 'M12 6.5 A5.5 5.5 0 1 1 11.99 6.5 Z ' + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, p = (r, da) => `${(12 + r * Math.cos(a + da)).toFixed(2)} ${(12 + r * Math.sin(a + da)).toFixed(2)}`;
    return `M${p(7, -.2)} L${p(11.5, 0)} L${p(7, .2)} Z`; }).join(' ') },
  torre:    { nome: 'Torre', desb: { conq: 'anexar1' }, d: 'M5 22 L5 8 L4 8 L4 3 L7 3 L7 5 L9.5 5 L9.5 3 L14.5 3 L14.5 5 L17 5 L17 3 L20 3 L20 8 L19 8 L19 22 L14 22 L14 17 A2 2 0 0 0 10 17 L10 22 Z' },
  chave:    { nome: 'Chave', desb: { conq: 'recon10' }, d: 'M8 3 A5 5 0 1 1 7.99 3 Z M8 6 A2 2 0 1 0 8.01 6 Z M11.5 11 L21 20.5 L19 22.5 L17.5 21 L16 22.5 L14.5 21 L16 19.5 L9.5 13 Z' },
  coroa:    { nome: 'Coroa', desb: { conq: 'anexar15' }, d: 'M3 18 L2 7 L7.5 11 L12 4 L16.5 11 L22 7 L21 18 Z M3 19.5 L21 19.5 L21 22 L3 22 Z' },
  escudo:   { nome: 'Escudo', desb: { conq: 'cla' }, d: 'M12 2 L21 5 L21 11 C21 17 16.5 20.5 12 22.5 C7.5 20.5 3 17 3 11 L3 5 Z M12 5 L12 19.5 C15.5 17.8 18.5 15 18.5 11 L18.5 6.7 Z' },
  arvore:   { nome: 'Pinheiro (Elfos)', desb: { conq: 'facao', facao: 'elfos' }, d: 'M12 2 L19 11 L15 11 L21 18 L13.5 18 L13.5 22 L10.5 22 L10.5 18 L3 18 L9 11 L5 11 Z' },
  martelo:  { nome: 'Martelo (Humanos)', desb: { conq: 'facao', facao: 'humanos' }, d: 'M3.5 4 L16 4 L18.5 6.5 L18.5 10 L16 10 L14 8 L13.5 8 L13.5 22 L10.5 22 L10.5 8 L3.5 8 Z' },
  moeda:    { nome: 'Moeda (Gnomos)', desb: { conq: 'facao', facao: 'gnomos' }, d: 'M12 2 A10 10 0 1 1 11.99 2 Z M12 5 A7 7 0 1 0 12.01 5 Z M10.8 7.5 L13.2 7.5 L13.2 16.5 L10.8 16.5 Z' },
  dragao:   { nome: 'Dragão', desb: { conq: 'nivel20' }, d: 'M2.5 18.5 C5.5 12.5 9 10.5 12 10.5 L9.5 4.5 L14 8 L16 2.5 L17.3 9 C20.5 10.2 22.3 13 21.5 16.5 L18.3 14.3 L17.2 18.5 L14 15.5 C11 17.5 7.5 19.3 2.5 18.5 Z' },
  lua:      { nome: 'Lua', desb: { gemas: 10 }, d: 'M15 2.5 A9.5 9.5 0 1 0 21.5 17 A7.5 7.5 0 1 1 15 2.5 Z' },
  coracao:  { nome: 'Coração', desb: { gemas: 10 }, d: 'M12 21 C5 15 2 11.5 2 8 C2 5 4.5 3 7 3 C9.2 3 11 4.5 12 6 C13 4.5 14.8 3 17 3 C19.5 3 22 5 22 8 C22 11.5 19 15 12 21 Z' },
  raio:     { nome: 'Raio', desb: { gemas: 15 }, d: 'M14 1 L4 13.5 L11 13.5 L9 23 L20 9.5 L13 9.5 Z' },
  montanha: { nome: 'Montanha', desb: { gemas: 15 }, d: 'M1 21 L9 7 L12.5 12.5 L15.5 8 L23 21 Z M7.2 10.2 L9 7 L10.8 10.2 L9 9.4 Z' },
  peixe:    { nome: 'Peixe', desb: { gemas: 15 }, d: 'M2 12 C6 6 14 5 19 10 L23 6 L23 18 L19 14 C14 19 6 18 2 12 Z M7 10.7 A1.3 1.3 0 1 0 7.01 10.7 Z' },
  espada:   { nome: 'Espada', desb: { gemas: 20 }, d: 'M12 1 L14 4 L14 15 L18 15 L18 17 L13.5 17 L13.5 21 L15 23 L9 23 L10.5 21 L10.5 17 L6 17 L6 15 L10 15 L10 4 Z' },
  caveira:  { nome: 'Caveira', desb: { gemas: 25 }, d: 'M12 2 C6.5 2 3 6 3 10.5 C3 13.5 4.5 15.5 7 16.5 L7 20.5 L17 20.5 L17 16.5 C19.5 15.5 21 13.5 21 10.5 C21 6 17.5 2 12 2 Z M8.5 9 A2.2 2.2 0 1 0 8.51 9 Z M15.5 9 A2.2 2.2 0 1 0 15.51 9 Z M12 12.8 L13.3 15.3 L10.7 15.3 Z' },
  cogumelo: { nome: 'Cogumelo', desb: { gemas: 20 }, d: 'M2 12 C2 6 6.5 2.5 12 2.5 C17.5 2.5 22 6 22 12 Z M9 12.8 L15 12.8 L15.6 21.5 L8.4 21.5 Z M7.5 6 A1.6 1.6 0 1 0 7.51 6 Z M15.5 5 A1.3 1.3 0 1 0 15.51 5 Z' },
};
const CORES_LOGO = ['#ffffff', '#f2c94c', '#1c1c1c', '#c0392b', '#2980b9', '#27ae60'];
const CORES_BANDEIRA = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#16a085', '#2980b9', '#1f3a93', '#8e44ad', '#6b8e3a', '#8a6d3b', '#f6f2e4', '#1c1c1c', '#7f8c8d', '#d4b018'];
const MASTROS_BANDEIRA = {
  madeira:  { nome: 'Madeira', desb: null, cor: '#8a5a2b', ponta: 'bola', pontaCor: '#c9a227' },
  ferro:    { nome: 'Ferro', desb: { conq: 'km100' }, cor: '#8b949e', ponta: 'lanca', pontaCor: '#c7d0d8' },
  elfico:   { nome: 'Élfico', desb: { conq: 'nivel10' }, cor: '#d5dde2', ponta: 'folha', pontaCor: '#4caf50' },
  dourado:  { nome: 'Dourado', desb: { conq: 'km500' }, cor: '#e3b23c', ponta: 'coroa', pontaCor: '#f2c94c' },
  cristal:  { nome: 'Cristal', desb: { conq: 'pontos1000' }, cor: '#9adff2', ponta: 'cristal', pontaCor: '#7fd8f0' },
  bambu:    { nome: 'Bambu', desb: { gemas: 15 }, cor: '#a9bb55', ponta: 'nenhuma', nos: true },
  sombra:   { nome: 'Obsidiana', desb: { gemas: 30 }, cor: '#2b2b33', ponta: 'lanca', pontaCor: '#d6304a' },
};
const PARTES_BANDEIRA = { forma: FORMAS_BANDEIRA, padrao: PADROES_BANDEIRA, borda: BORDAS_BANDEIRA, logo: LOGOS_BANDEIRA, mastro: MASTROS_BANDEIRA };

const estandarte = () => {
  if (!P.estandarte) P.estandarte = { forma: 'retangular', padrao: 'duas', c1: P.cor, c2: '#f6f2e4', borda: 'simples', logo: 'estrela', corLogo: '#ffffff', mastro: 'madeira' };
  return P.estandarte;
};

function pontaMastro(M) {
  const c = M.pontaCor;
  return ({
    bola: `<circle cx="9.5" cy="4.6" r="2.7" fill="${c}"/><circle cx="8.6" cy="3.8" r=".9" fill="#fff" opacity=".6"/>`,
    lanca: `<path d="M9.5 -.5 L12.2 6.5 L6.8 6.5 Z" fill="${c}"/>`,
    coroa: `<path d="M5.8 7 L6.2 2.3 L7.9 4.2 L9.5 1 L11.1 4.2 L12.8 2.3 L13.2 7 Z" fill="${c}" stroke="#a8780e" stroke-width=".5"/>`,
    folha: `<path d="M9.5 -.5 C13 2.5 13 5 9.5 7.5 C6 5 6 2.5 9.5 -.5 Z" fill="${c}"/><path d="M9.5 .5 L9.5 7" stroke="#2e7d32" stroke-width=".6"/>`,
    cristal: `<path d="M9.5 -.8 L12.4 3.3 L9.5 7.5 L6.6 3.3 Z" fill="${c}"/><path d="M9.5 -.8 L9.5 7.5 L6.6 3.3 Z" fill="#fff" opacity=".45"/>`,
  })[M.ponta] || '';
}
// A bandeira em SVG. op.mini = só o pano (para os POIs) · op.so = mostrar só esta parte numa opção
function svgBandeira(E, op = {}) {
  const F = FORMAS_BANDEIRA[E.forma] || FORMAS_BANDEIRA.retangular, Pd = PADROES_BANDEIRA[E.padrao] || PADROES_BANDEIRA.liso,
    B = BORDAS_BANDEIRA[E.borda] || BORDAS_BANDEIRA.nenhuma, Lg = LOGOS_BANDEIRA[E.logo] || LOGOS_BANDEIRA.nenhum,
    M = MASTROS_BANDEIRA[E.mastro] || MASTROS_BANDEIRA.madeira, n = ++svgN;
  const vb = op.mini ? '9 4 53 39' : '0 -2 64 66';
  let s = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <defs><clipPath id="bC${n}"><path d="${F.d}"/></clipPath>
    <linearGradient id="bL${n}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".3" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#000" stop-opacity=".1"/><stop offset=".8" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>`;
  if (!op.mini) s += `<rect x="8" y="5" width="3" height="58" rx="1.5" fill="${M.cor}"/><rect x="8.4" y="5" width=".9" height="58" fill="#fff" opacity=".3"/>` +
    (M.nos ? [18, 30, 42, 54].map(y => `<rect x="7.6" y="${y}" width="3.8" height="1.3" rx=".6" fill="${tom(M.cor, -.3)}"/>`).join('') : '') + pontaMastro(M);
  s += `<g clip-path="url(#bC${n})"><rect x="0" y="0" width="64" height="48" fill="${E.c1}"/>${Pd.svg(E.c2)}`;
  if (Lg.d) { const [cx, cy] = F.centro, t = 18 / 24;
    s += `<path d="${Lg.d}" fill="${E.corLogo}" fill-rule="evenodd" transform="translate(${cx - 12 * t} ${cy - 12 * t}) scale(${t})" stroke="#000" stroke-opacity=".25" stroke-width="1.2" paint-order="stroke"/>`; }
  s += `<rect x="0" y="0" width="64" height="48" fill="url(#bL${n})"/>${B.svg(F.d)}</g>${B.fora && E.forma === 'retangular' ? B.fora() : ''}</svg>`;
  return s;
}

// Está livre? (grátis, conquista feita, ou comprada com 💎)
function parteLivre(cat, id) {
  const it = (cat === 'avatar' ? AVATARES_DEF : PARTES_BANDEIRA[cat])[id];
  if (!it) return false;
  const d = cat === 'avatar' ? (it.gemas ? { gemas: it.gemas } : null) : it.desb;
  if (!d) return true;
  if (d.gemas) return (P.compras || []).includes(cat + ':' + id);
  if (d.facao && P.facao !== d.facao) return false;
  return !!(P.conquistas || {})[d.conq];
}
function textoDesbloqueio(cat, id) {
  const it = (cat === 'avatar' ? AVATARES_DEF : PARTES_BANDEIRA[cat])[id], d = cat === 'avatar' ? { gemas: it.gemas } : it.desb;
  if (!d) return '';
  if (d.gemas) return `💎 ${d.gemas}`;
  const c = CONQUISTAS.find(x => x.id === d.conq);
  return `🔒 ${c ? c.nome : d.conq}${d.facao ? ' · ' + FACOES[d.facao].nome : ''}`;
}

// =====================================================================
//  🏅 Conquistas (dão 💎 e desbloqueiam partes da bandeira)
// =====================================================================
const CONQUISTAS = [
  { id: 'km5',       icone: '👣', nome: 'Caminhante',        texto: 'Andar 5 km',                      v: s => s.km,      alvo: 5,    gemas: 5 },
  { id: 'km25',      icone: '🥾', nome: 'Andarilho',          texto: 'Andar 25 km',                     v: s => s.km,      alvo: 25,   gemas: 10 },
  { id: 'km100',     icone: '🗺️', nome: 'Explorador',         texto: 'Andar 100 km',                    v: s => s.km,      alvo: 100,  gemas: 20 },
  { id: 'km500',     icone: '🌍', nome: 'Peregrino',          texto: 'Andar 500 km',                    v: s => s.km,      alvo: 500,  gemas: 50 },
  { id: 'recon10',   icone: '🔍', nome: 'Curioso',            texto: 'Fazer 10 reconhecimentos',        v: s => s.recon,   alvo: 10,   gemas: 5 },
  { id: 'recon50',   icone: '🧭', nome: 'Batedor',            texto: 'Fazer 50 reconhecimentos',        v: s => s.recon,   alvo: 50,   gemas: 10 },
  { id: 'recon200',  icone: '📜', nome: 'Cartógrafo',         texto: 'Fazer 200 reconhecimentos',       v: s => s.recon,   alvo: 200,  gemas: 25 },
  { id: 'anexar1',   icone: '🏳️', nome: 'Primeira conquista', texto: 'Anexar o primeiro POI',           v: s => s.anexados, alvo: 1,   gemas: 5 },
  { id: 'anexar5',   icone: '🏛️', nome: 'Senhor da zona',     texto: 'Ter 5 POIs ao mesmo tempo',       v: s => s.anexados, alvo: 5,   gemas: 10 },
  { id: 'anexar15',  icone: '👑', nome: 'Senhor da vila',     texto: 'Ter 15 POIs ao mesmo tempo',      v: s => s.anexados, alvo: 15,  gemas: 25 },
  { id: 'casa',      icone: '🏠', nome: 'Assentado',          texto: 'Construir a casa',                v: s => s.casa,    alvo: 1,    gemas: 5 },
  { id: 'bandeira',  icone: '🚩', nome: 'Porta-estandarte',   texto: 'Construir a bandeira',            v: s => s.bandeira, alvo: 1,   gemas: 10 },
  { id: 'nivel5',    icone: '⭐', nome: 'Aprendiz',           texto: 'Chegar ao nível 5',               v: s => s.nivel,   alvo: 5,    gemas: 5 },
  { id: 'nivel10',   icone: '🌟', nome: 'Veterano',           texto: 'Chegar ao nível 10',              v: s => s.nivel,   alvo: 10,   gemas: 10 },
  { id: 'facao',     icone: '⚑',  nome: 'Juramento',          texto: 'Escolher a fação',                v: s => s.facao,   alvo: 1,    gemas: 10 },
  { id: 'nivel15',   icone: '🔥', nome: 'Herói',              texto: 'Chegar ao nível 15',              v: s => s.nivel,   alvo: 15,   gemas: 20 },
  { id: 'nivel20',   icone: '🐉', nome: 'Lenda',              texto: 'Chegar ao nível 20',              v: s => s.nivel,   alvo: 20,   gemas: 40 },
  { id: 'cla',       icone: '🏰', nome: 'Fundador',           texto: 'Fundar um clã',                   v: s => s.cla,     alvo: 1,    gemas: 15 },
  { id: 'pontos100', icone: '🏆', nome: 'Pontuado',           texto: 'Juntar 100 pontos de bandeira',   v: s => s.pontos,  alvo: 100,  gemas: 10 },
  { id: 'pontos1000',icone: '💠', nome: 'Glorioso',           texto: 'Juntar 1000 pontos de bandeira',  v: s => s.pontos,  alvo: 1000, gemas: 30 },
];
const GEMAS_BAU = 1;   // 💎 que o baú diário dá

function estatisticas() {
  let recon = 0, donos = 0;
  for (const e of Object.values(P.pois)) { if (e.recon) recon++; if (e.dono) donos++; }
  P.maxAnexados = Math.max(P.maxAnexados || 0, donos);
  return { km: (P.distancia - (P.distanciaCarro || 0)) / 1000, recon, anexados: P.maxAnexados, casa: P.niv.casa > 0 ? 1 : 0, bandeira: P.niv.bandeira ? 1 : 0,
    nivel: nivel(), facao: P.facao ? 1 : 0, cla: P.cla && P.cla.tipo ? 1 : 0, pontos: P.pontos || 0 };
}
// Vê se há conquistas novas (no máximo de 5 em 5 s)
let conqUltima = 0;
function verConquistas(forcar) {
  if (!P || (!forcar && Date.now() - conqUltima < 5000)) return;
  conqUltima = Date.now();
  P.conquistas = P.conquistas || {}; P.gemas = P.gemas || 0;
  const s = estatisticas(), novas = CONQUISTAS.filter(c => !P.conquistas[c.id] && c.v(s) >= c.alvo);
  if (!novas.length) return;
  for (const c of novas) { P.conquistas[c.id] = agora(); P.gemas += c.gemas; }
  const g = novas.reduce((t, c) => t + c.gemas, 0);
  setTimeout(() => aviso(novas.length === 1 ? `🏅 Conquista: ${novas[0].nome} · +${g} 💎${desbloqueiosDe(novas[0].id).length ? ' · desbloqueaste algo para a bandeira 🚩' : ''}` : `🏅 ${novas.length} conquistas novas · +${g} 💎`), 120);
}
const desbloqueiosDe = id => Object.entries(PARTES_BANDEIRA).flatMap(([cat, l]) => Object.entries(l).filter(([, it]) => it.desb && it.desb.conq === id).map(([k, it]) => ({ cat, k, it })));

// =====================================================================
//  Folhas: a bandeira, as conquistas e as compras
// =====================================================================
const NOMES_PARTE = { forma: 'Forma', padrao: 'Padrão', borda: 'Borda', logo: 'Emblema', mastro: 'Mastro' };
function comprar(chave, preco, nome, depois, voltar) {
  P.gemas = P.gemas || 0;
  if (P.gemas < preco) return aviso(`💎 Faltam ${preco - P.gemas} gemas · ganha-as com conquistas 🏅 e no baú diário 🎁`, true);
  perguntar('💎', `Comprar ${nome}?`, `Custa <b>${preco} 💎</b>. Tens ${P.gemas} 💎. Fica teu para sempre.`, `Comprar · ${preco} 💎`, () => {
    if (P.gemas < preco) return;
    P.gemas -= preco; (P.compras = P.compras || []).push(chave); aviso(`💎 ${nome} é teu!`); depois(); tick();
  }, voltar);
}
function escolherParte(cat, id) {
  const E = estandarte();
  if (parteLivre(cat, id)) { E[cat] = id; redesenharBandeira(); return abrirEstandarte(); }
  const it = PARTES_BANDEIRA[cat][id];
  if (it.desb.gemas) return comprar(cat + ':' + id, it.desb.gemas, `${NOMES_PARTE[cat].toLowerCase()} «${it.nome}»`, () => { E[cat] = id; redesenharBandeira(); abrirEstandarte(); }, abrirEstandarte);
  aviso(`🔒 ${it.nome}: desbloqueia-se com a conquista «${textoDesbloqueio(cat, id).replace('🔒 ', '')}»`, true);
}
// Depois de mudar a bandeira: casa, jogador e os POIs teus no mapa
function redesenharBandeira() {
  if (!mapa) return;
  desenharCasa(); if (marcador) marcador.setIcon(iconeJogador());
  for (const p of POIS) if (P.pois[p.id] && P.pois[p.id].dono) atualizarPin(p);
}
function grelhaPartes(cat) {
  const E = estandarte(), l = PARTES_BANDEIRA[cat];
  return `<label class="titulo">${NOMES_PARTE[cat]}</label><div class="grelha grelhaB">` + Object.entries(l).map(([id, it]) => {
    const livre = parteLivre(cat, id), ativa = E[cat] === id;
    const prev = svgBandeira({ ...E, [cat]: id }, { mini: cat !== 'mastro' });
    return btn(`${prev}${livre ? '' : `<span class="preco">${it.desb.gemas ? '💎' + it.desb.gemas : '🔒'}</span>`}`, () => escolherParte(cat, id), true,
      `opcao opB${ativa ? ' ativa' : ''}${livre ? '' : ' bloq'}" title="${it.nome}${livre ? '' : ' · ' + textoDesbloqueio(cat, id)}`);
  }).join('') + '</div>';
}
function grelhaCores(titulo, campo, cores) {
  const E = estandarte();
  return `<label class="titulo">${titulo}</label><div class="grelha" style="grid-template-columns:repeat(7,1fr)">` + cores.map(c =>
    btn('', () => { E[campo] = c; redesenharBandeira(); abrirEstandarte(); }, true, `opcao cor${E[campo] === c ? ' ativa' : ''}" style="background:${c}`)).join('') + '</div>';
}
function abrirEstandarte() {
  const E = estandarte();
  cab('🚩', 'A tua bandeira', `💎 ${P.gemas || 0} gemas · ${P.niv.bandeira ? (bandeiraComigo() ? 'levas-la contigo no mapa' : 'está no mapa, em casa') : 'aparece no mapa quando construíres a bandeira em casa'}`);
  let h = `<div class="previewBandeira">${svgBandeira(E)}</div>
    <div class="nota" style="text-align:center">As partes com 🔒 desbloqueiam-se com conquistas 🏅 · as com 💎 compram-se com gemas.</div>`;
  h += grelhaPartes('forma') + grelhaPartes('padrao') + grelhaCores('Cor principal', 'c1', CORES_BANDEIRA) + grelhaCores('Segunda cor', 'c2', CORES_BANDEIRA)
    + grelhaPartes('borda') + grelhaPartes('logo') + grelhaCores('Cor do emblema', 'corLogo', CORES_LOGO) + grelhaPartes('mastro');
  h += `<div class="acoes">${btn('🏅 Conquistas', abrirConquistas)}${btn('OK', () => abrir('perfil'), true, 'ok')}</div>`;
  $('fCorpo').innerHTML = h; aberto = 'estandarte'; $('folha').classList.remove('escondido');
}
function abrirConquistas() {
  verConquistas(true);
  const s = estatisticas(), feitas = CONQUISTAS.filter(c => P.conquistas[c.id]).length;
  cab('🏅', 'Conquistas', `${feitas}/${CONQUISTAS.length} · 💎 ${P.gemas || 0} gemas`);
  $('fCorpo').innerHTML = CONQUISTAS.map(c => {
    const feita = !!P.conquistas[c.id], prog = Math.min(c.alvo, Math.floor(c.v(s)));
    const desb = desbloqueiosDe(c.id).filter(d => !d.it.desb.facao || d.it.desb.facao === P.facao || !P.facao).map(d => `${NOMES_PARTE[d.cat].toLowerCase()} «${d.it.nome}»`);
    return `<div class="linhaItem${feita ? ' feita' : ''}"><span>${feita ? '✅' : c.icone}</span><span class="t">${c.nome}
      <small>${c.texto}${feita ? '' : ` · ${prog}/${c.alvo}`}${desb.length ? '<br>🚩 Desbloqueia: ' + desb.join(', ') : ''}</small></span><span class="xp">+${c.gemas} 💎</span></div>`;
  }).join('') + `<div class="nota">💎 Também ganhas ${GEMAS_BAU} gema por dia no baú diário 🎁. Mais tarde vai ser possível comprar gemas na loja da app.</div>
    <div class="acoes">${btn('🚩 A minha bandeira', abrirEstandarte)}${btn('OK', () => abrir('perfil'), true, 'ok')}</div>`;
  aberto = 'conquistas'; $('folha').classList.remove('escondido');
}
// Bloco do perfil: avatar, bandeira, conquistas e gemas
function htmlAparencia() {
  const feitas = CONQUISTAS.filter(c => (P.conquistas || {})[c.id]).length;
  return `<div class="seccao">🎨 Aparência · 💎 ${P.gemas || 0} gemas</div>
    <div class="linhaItem"><span class="miniBandeira">${svgBandeira(estandarte())}</span><span class="t">A tua bandeira e o teu avatar
      <small>Formas, padrões, bordas, emblemas e mastros · 🏅 ${feitas}/${CONQUISTAS.length} conquistas</small></span></div>
    <div class="acoes" style="margin-top:6px">${btn('🚩 Bandeira', abrirEstandarte, true, 'ok')}${btn('🧑 Avatar', abrirEditar)}${btn('🏅 Conquistas', abrirConquistas)}</div>`;
}
