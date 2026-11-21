// =====================================================================
//  🌐 Multijogador (Supabase): contas, jogo na nuvem, POIs partilhados,
//  casas dos outros jogadores e ranking.
//  Só funciona com ?online no endereço e com config-online.js preenchido.
//  Usa as variáveis do jogo (P, POIS, mapa, est, aviso…), que existem quando estas funções correm.
// =====================================================================
// Online com ?online no endereço, ou sempre que há uma conta aberta neste aparelho
// (a app instalada abre sem ?online). "Sair da conta" volta ao jogo sozinho; ?sozinho também, só dessa vez.
const ONLINE = (() => {
  const q = new URLSearchParams(location.search);
  if (q.has('online')) return true;
  if (q.has('sozinho')) return false;
  try { return !!localStorage.getItem('bandeiras.sessao'); } catch (e) { return false; }
})();
const R = { sb: null, eu: null, donos: {}, jogadores: {}, ultimaGrav: 0, aGravar: false, aPedir: new Set() };

const redeConfigurada = () => typeof SUPABASE_URL === 'string' && !!SUPABASE_URL && !!SUPABASE_CHAVE;
// A biblioteca do Supabase só se carrega no modo online (o jogo sozinho não precisa de internet)
function redeCarregarBiblioteca() {
  if (window.supabase) return Promise.resolve(true);
  return new Promise(res => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
    s.onload = () => res(!!window.supabase); s.onerror = () => res(false);
    document.head.appendChild(s);
  });
}
function redeCliente() {
  if (!R.sb) R.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE, { auth: { persistSession: true, storageKey: 'bandeiras.sessao' } });
  return R.sb;
}
const euId = () => R.eu && R.eu.id;

// ---- Contas: email e palavra-passe (as contas são criadas no Supabase, só para quem foi convidado) ----
async function redeSessao() {
  const { data } = await redeCliente().auth.getSession();
  R.eu = data.session ? data.session.user : null;
  return R.eu;
}
async function redeEntrar(email, password) {
  const { data, error } = await redeCliente().auth.signInWithPassword({ email, password });
  if (error) throw error;
  R.eu = data.user; return R.eu;
}
async function redeSair() { await redeGravar(true); await redeCliente().auth.signOut(); location.reload(); }

// ---- Jogo na nuvem ----
async function redeCarregarEstado() {
  const { data, error } = await R.sb.from('estados').select('estado').eq('id', euId()).maybeSingle();
  if (error) throw error;
  return data ? data.estado : null;
}
const resumoPublico = () => ({
  id: euId(), nome: P.nome, avatar: P.avatar, cor: P.cor, facao: P.facao, nivel: nivel(), xp: Math.floor(P.xp),
  pontos: Math.floor(P.pontos || 0),   // 🔒 a casa (sítio real) NUNCA vai para a parte pública
  atualizado: new Date().toISOString(),
});
let avisouNome = '';
async function redeGravar(forcar = false) {
  if (!ONLINE || !euId() || !P || R.aGravar) return;
  if (!forcar && Date.now() - R.ultimaGrav < 30000) return;   // de 30 em 30 s (e ao sair)
  R.aGravar = true; R.ultimaGrav = Date.now();
  try {
    P.salto = 0;   // no multijogador o relógio é o verdadeiro
    const pub = await R.sb.from('jogadores').upsert(resumoPublico());
    if (pub.error) {
      if (pub.error.code === '23505' && avisouNome !== P.nome) { avisouNome = P.nome; aviso(`🌐 O nome «${P.nome}» já é de outro jogador · muda-o no perfil 👤`, true); }
      else if (pub.error.code !== '23505') console.warn('jogadores', pub.error);
    }
    const e = await R.sb.from('estados').upsert({ id: euId(), estado: P, atualizado: new Date().toISOString() });
    if (e.error) console.warn('estados', e.error);
    await redeLargarTerritorio();
  } catch (err) { console.warn('gravar', err); }
  finally { R.aGravar = false; }
}

// ---- O mundo: donos dos POIs e outros jogadores ----
async function lerTudo(tabela, campos) {   // o Supabase devolve no máximo 1000 linhas de cada vez
  const tudo = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await R.sb.from(tabela).select(campos).range(i, i + 999);
    if (error) throw error;
    tudo.push(...data); if (data.length < 1000) return tudo;
  }
}
async function redeAtualizarMundo() {
  if (!ONLINE || !euId()) return;
  try {
    const [d, j] = await Promise.all([lerTudo('poi_donos', 'poi_id,dono'), lerTudo('jogadores', 'id,nome,avatar,cor,facao,nivel,pontos')]);
    R.donos = Object.fromEntries(d.map(x => [x.poi_id, x.dono]));
    R.jogadores = Object.fromEntries(j.map(x => [x.id, x]));
    await redeAplicarMundo();
  } catch (err) { console.warn('mundo', err); }
}
// O dono (por anexação) de um POI quando é OUTRO jogador (null se for teu ou de ninguém)
const donoOutro = p => {
  if (!ONLINE || !euId()) return null;
  const d = R.donos[p.id];
  return d && d !== euId() ? (R.jogadores[d] || { nome: 'outro jogador', cor: '#555', avatar: '❔' }) : null;
};
// 🏡 Os POIs que são teus só por estarem no teu território (casa e torres) ficam só no teu jogo:
//    nunca vão para o servidor (ninguém adivinha onde moras) e podem ter MAIS 1 dono, quem os anexar.
// Junta o que o servidor diz ao jogo: POIs anexados que perdeste e POIs anexados que o servidor ainda não sabe
async function redeAplicarMundo() {
  const perdi = [], pedir = [];
  for (const p of POIS) {
    const e = P.pois[p.id]; if (!e || !e.dono || noTerritorio(p)) continue;   // os do território não contam aqui
    const d = R.donos[p.id];
    if (d && d !== euId()) { e.dono = false; e.acc = 0; perdi.push(p); }
    else if (!d) pedir.push(p.id);
  }
  if (P.anexando && R.donos[P.anexando] && R.donos[P.anexando] !== euId()) { P.anexando = null; aviso('🌐 Outro jogador anexou primeiro o POI que estavas a anexar', true); }
  if (perdi.length) aviso(`🌐 ${perdi.length === 1 ? perdi[0].nome + ' já era' : perdi.length + ' POIs já eram'} de outro jogador`, true);
  if (pedir.length) await redeAnexar(pedir);
  await redeLargarTerritorio();
  for (const p of POIS) atualizarPin(p);
}
// Um POI que anexaste e que depois ficou dentro do teu território (casa maior, torre nova) sai do servidor:
// continua teu pelo território e outro jogador pode anexá-lo
async function redeLargarTerritorio() {
  const ids = POIS.filter(p => R.donos[p.id] === euId() && noTerritorio(p)).map(p => p.id);
  if (!ids.length) return;
  const { error } = await R.sb.rpc('largar_pois', { ids });
  if (error) return console.warn('largar', error);
  ids.forEach(id => delete R.donos[id]);
}
// Pede ao servidor os POIs anexados (devolve os que ficaram teus); os que já tinham dono voltam atrás
async function redeAnexar(ids) {
  if (!ONLINE || !euId()) return;
  ids = ids.filter(id => !R.aPedir.has(id) && !noTerritorio(POIS.find(p => p.id === id) || {})); if (!ids.length) return;
  ids.forEach(id => R.aPedir.add(id));
  try {
    const { data, error } = await R.sb.rpc('anexar_pois', { ids });
    if (error) throw error;
    const meusIds = new Set(data || []);
    for (const id of ids) {
      const p = POIS.find(x => x.id === id), e = P.pois[id];
      if (meusIds.has(id)) R.donos[id] = euId();
      else if (e && e.dono) { e.dono = false; e.acc = 0; aviso(`🌐 ${p ? p.nome : 'Esse POI'} já tinha dono · outro jogador chegou primeiro`, true); }
      if (p) atualizarPin(p);
    }
  } catch (err) { console.warn('anexar', err); }
  finally { ids.forEach(id => R.aPedir.delete(id)); }
}
// 🔒 As casas dos jogadores (sítios reais) nunca se mostram aos outros: só os POIs e os nomes.

// ---- Ranking ----
async function redeRanking() {
  const [j, c] = await Promise.all([R.sb.from('ranking_jogadores').select('*'), R.sb.from('ranking_clas').select('*')]);
  if (j.error) throw j.error;
  return { jogadores: j.data || [], clas: (c.data || []) };
}
