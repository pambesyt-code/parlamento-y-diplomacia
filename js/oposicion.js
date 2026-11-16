'use strict';
// Países compartidos en multijugador: varios jugadores en el mismo país, cada uno con su partido.
// Gobierna uno (s.tokenGobierno); los demás son la oposición (s.oposicion). Tras cada elección,
// gobierna el jugador cuyo partido saque más escaños. La oposición no toca la economía ni la
// guerra: hace campaña, presenta leyes y decide cómo vota su grupo las leyes del gobierno.

const opositorDe = (s, pid) => (s && s.oposicion ? s.oposicion.find(o => o.partido === pid) : null) || null;
const opositorPorToken = (s, token) => (s && s.oposicion ? s.oposicion.find(o => o.token === token) : null) || null;
// El hueco del partido en el parlamento (ver huecoDe en game.js).
const huecoPartido = perfil => huecoDe(perfil);

// Lo que vota tu grupo ante una ley del gobierno cuando no llegas a votar tú antes de que acabe el mes.
const POSTURAS = {
  ideas: { nombre: 'Según nuestras ideas', desc: 'Tu grupo vota cada ley según encaje con las ideas del partido.' },
  apoyar: { nombre: 'Apoyar al gobierno', desc: 'Tu grupo vota a favor de lo que presente el gobierno.' },
  bloquear: { nombre: 'Bloquear al gobierno', desc: 'Tu grupo vota en contra de lo que presente el gobierno.' },
};

const ACCIONES_OPOSICION = {
  mitin: { nombre: 'Mitin ante un grupo', cp: 1, desc: 'Ese grupo te ve con mejores ojos: +4 de imagen.' },
  campana: { nombre: 'Campaña en medios', cp: 2, desc: 'Todos los grupos: +1 de imagen.' },
  denunciar: { nombre: 'Denunciar al gobierno', cp: 2, desc: 'El apoyo al gobierno baja 1 punto en todos los grupos.' },
};
const COSTE_LEY_OPOSICION = 2;
const CP_CENSURA = 4;

function crearOpositor(token, perfil) {
  return {
    token, perfil: { ...perfil, principios: [...(perfil.principios || [])] }, partido: huecoPartido(perfil),
    cp: 5, imagen: Object.fromEntries(Object.keys(GRUPOS).map(g => [g, 0])), postura: 'ideas', hechas: {}, resultadoVoto: null,
  };
}

function puedeAccionOposicion(s, o, id) {
  if (o.hechas[id] === s.mes) return { ok: false, motivo: 'Ya lo has hecho este mes' };
  if (o.cp < ACCIONES_OPOSICION[id].cp) return { ok: false, motivo: 'Sin capital político' };
  return { ok: true };
}

function puedeLeyOposicion(s, o, leyId, derogar) {
  if (o.cp < COSTE_LEY_OPOSICION) return { ok: false, motivo: 'Sin capital político' };
  if (o.hechas.ley === s.mes) return { ok: false, motivo: 'Una ley al mes' };
  if (s.pleno) return { ok: false, motivo: 'Hay una votación en marcha' };
  const choca = !derogar && leyQueChoca(s, leyId);
  if (choca) return { ok: false, motivo: `Incompatible con «${LEY_POR_ID[choca].nombre}»` };
  return { ok: true };
}

// Una moción de censura: si sale adelante, quien la presenta pasa a gobernar sin esperar a las urnas.
function puedeCensura(s, o) {
  if (s.pleno) return { ok: false, motivo: 'Hay una votación en marcha' };
  if (o.censura === s.legislatura) return { ok: false, motivo: 'Solo una por legislatura' };
  if (s.mes - s.inicioLegislatura < 3) return { ok: false, motivo: 'El gobierno acaba de empezar' };
  if (o.cp < CP_CENSURA) return { ok: false, motivo: 'Sin capital político' };
  return { ok: true };
}

// Lo que cambia tu imagen al votar una ley de otro: quedas bien con quienes salen ganando con tu
// voto y mal con quienes salen perdiendo. Abstenerse no mueve nada.
function imagenPorVoto(prop, voto) {
  const ley = LEY_POR_ID[prop.ley], cambio = {};
  if (!ley || voto === 'abs') return cambio;
  const signo = (prop.derogar ? -1 : 1) * (voto === 'si' ? 1 : -1);
  for (const g in ley.grupos || {}) cambio[g] = ley.grupos[g] * signo > 0 ? 1 : -1;
  return cambio;
}

// La propuesta tal como se vota: si quien gobierna no llega a votar, su grupo lo hace según sus ideas.
function propuestaOposicion(s, o, leyId, derogar) {
  const opinion = opinionPartido(s, leyId, derogar);
  return { ley: leyId, derogar, autor: o.partido, negociado: {}, votoJugador: opinion >= 1 ? 'si' : opinion <= -1 ? 'no' : 'abs' };
}

const REGLAS_OPOSICION = {
  oposMitin: (s, o, d) => {
    if (!GRUPOS[d.v] || !puedeAccionOposicion(s, o, 'mitin').ok) return;
    o.cp -= 1;
    o.hechas.mitin = s.mes;
    o.imagen[d.v] = limitar(o.imagen[d.v] + 4, -15, 15);
    noticia(s, `${o.perfil.lider} da un mitin ante los ${GRUPOS[d.v].nombre.toLowerCase()}.`);
  },
  oposCampana: (s, o) => {
    if (!puedeAccionOposicion(s, o, 'campana').ok) return;
    o.cp -= 2;
    o.hechas.campana = s.mes;
    for (const g in GRUPOS) o.imagen[g] = limitar(o.imagen[g] + 1, -15, 15);
    noticia(s, `${partidoInfo(s, o.partido).nombre} llena el país de carteles.`);
  },
  oposDenunciar: (s, o) => {
    if (!puedeAccionOposicion(s, o, 'denunciar').ok) return;
    o.cp -= 2;
    o.hechas.denunciar = s.mes;
    for (const g in GRUPOS) s.grupos[g] = limitar(s.grupos[g] - 1);
    noticia(s, `${o.perfil.lider} denuncia la gestión del gobierno en el pleno.`, 'mal');
  },
  oposPostura: (s, o, d) => { if (POSTURAS[d.v]) o.postura = d.v; },
  oposProponer: (s, o, d) => {
    const derogar = d.derogar === '1';
    if (!LEY_POR_ID[d.ley] || !puedeLeyOposicion(s, o, d.ley, derogar).ok) return;
    o.cp -= COSTE_LEY_OPOSICION;
    o.hechas.ley = s.mes;
    const quien = partidoInfo(s, o.partido).nombre, cual = LEY_POR_ID[d.ley].nombre;
    noticia(s, derogar ? `${quien} pide en el pleno derogar «${cual}».` : `${quien} lleva al pleno «${cual}».`);
    // Se abre el pleno: el gobierno y los demás jugadores deciden qué vota su grupo.
    abrirPleno(s, propuestaOposicion(s, o, d.ley, derogar));
  },
  // Tu voto en un pleno abierto por otro jugador.
  oposVotar: (s, o, d) => {
    const p = s.pleno;
    if (!hayPlenoPara(s, o.partido) || !['si', 'no', 'abs'].includes(d.v)) return;
    if (p.tipo !== 'censura') {
      const cambio = imagenPorVoto(p, d.v);
      for (const g in cambio) o.imagen[g] = limitar(o.imagen[g] + cambio[g], -15, 15);
    }
    votarEnPleno(s, o.partido, d.v);
  },
  oposCensura: (s, o) => {
    if (!puedeCensura(s, o).ok) return;
    o.cp -= CP_CENSURA;
    o.censura = s.legislatura;
    noticia(s, `${o.perfil.lider} presenta una moción de censura contra el gobierno de ${s.config.lider}.`, 'mal');
    abrirPleno(s, { tipo: 'censura', autor: o.partido });
  },
  oposCerrarVoto: (s, o) => { o.resultadoVoto = null; },
};

function mesOposicion(s) {
  for (const o of s.oposicion || []) o.cp = Math.min(CP_MAXIMO, o.cp + 2);
}

const perfilDeConfig = c => ({
  lider: c.lider, propio: c.propio, partidoId: c.partidoId, partido: c.partido, color: c.color, emblema: c.emblema,
  principios: [...(c.principios || [])], doctrina: c.doctrina, intervencion: c.intervencion, social: c.social, forma: c.forma,
  pais: c.pais, colorPais: c.colorPais, nacion: c.nacion, hueco: huecoDe(c),
});

// Tras unas elecciones que gana un partido de la oposición: su jugador pasa a gobernar y quien
// gobernaba pasa a la oposición. El país conserva su nombre, su color y sus leyes.
function cambiarGobierno(s, o) {
  const antes = { token: s.tokenGobierno, perfil: perfilDeConfig(s.config), cp: s.cp };
  const c = s.config, fijos = { modo: 'gobierno', dificultad: c.dificultad, legislatura: c.legislatura, tamano: c.tamano, semilla: c.semilla, pais: c.pais, colorPais: c.colorPais, estado: c.estado };
  s.config = completarConfig({ ...o.perfil, ...fijos, hueco: o.partido, nPartidos: c.nPartidos });
  s.tokenGobierno = o.token;
  s.cp = o.cp;
  s.oposicion = s.oposicion.filter(x => x !== o);
  if (antes.token) {
    const viejo = crearOpositor(antes.token, antes.perfil);
    viejo.cp = antes.cp;
    s.oposicion.push(viejo);
  }
  usarNacion(s);
  registrarHumano(s.nacion, s.config);
  for (const g in GRUPOS) s.grupos[g] = dificultad(s).apoyoBase;
  for (const id in CARTERAS) s.ministros[id] = null;
  Object.assign(s, { promesas: [], propuesta: null, votacion: null, pleno: null });
  relacionesIniciales(s);
  noticia(s, `${s.config.lider} forma gobierno con ${s.config.partido}. ${antes.perfil.lider} pasa a la oposición.`, 'bien');
  return antes.perfil.lider;
}
