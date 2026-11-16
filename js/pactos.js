'use strict';
// Pactos de gobierno, investidura y forma del Estado.
//
// Con 350 escaños y hasta diez partidos casi nadie llega solo a la mayoría absoluta (176). Tras unas
// elecciones gobierna el bloque que la reúna: tu partido más los socios con los que pactes, o el
// del rival con más escaños y los partidos afines a él. Si nadie llega, gobierna en minoría el bloque
// más grande. Solo pactan contigo los partidos de ideas cercanas a las tuyas, y cada uno pide a
// cambio una ley: si no la apruebas en un año, se va.
//
// En un país compartido entre jugadores no hay pactos: gobierna el jugador con más escaños.

const DISTANCIA_PACTO = 1.9;   // lo lejos que puede estar un partido para pactar con otro
const MESES_PACTO = 12;        // plazo para aprobar la ley que pide un socio
const usaPactos = s => !(s.oposicion && s.oposicion.length) && !s.config.sinPactos;

// Dónde está un partido: x, la economía (−2 izquierda, +2 derecha); y, las costumbres
// (−2 progresista, +2 conservador); y qué forma de Estado defiende.
function posicionPartido(s, pid) {
  const perfil = perfilPropio(s, pid);
  if (perfil) return { x: ejePerfil(perfil), y: nivelSocial(perfil) - 2, forma: posturaForma(perfil) };
  const P = PARTIDOS[pid] || CATALOGO_PARTIDOS[pid] || PLANTILLA_JUGADOR;
  return { x: P.eje || 0, y: nivelSocial(P) - 2, forma: posturaForma(P) };
}

function distanciaIdeologica(s, a, b) {
  const A = posicionPartido(s, a), B = posicionPartido(s, b);
  const forma = A.forma !== 'neutral' && B.forma !== 'neutral' && A.forma !== B.forma ? 0.4 : 0;
  return Math.hypot(A.x - B.x, (A.y - B.y) * 0.8) + forma;
}

const partidosIA = s => Object.keys(PARTIDOS).filter(pid => pid !== ID_JUGADOR && !opositorDe(s, pid));
const sociosDe = s => Object.keys(s.pactos || {}).filter(pid => PARTIDOS[pid]);
const escanosBloque = (s, escanos = s.escanos) => sociosDe(s).reduce((a, pid) => a + (escanos[pid] || 0), escanos[ID_JUGADOR] || 0);
// Lo cerca que está un partido de pactar contigo: sus ideas y cómo os lleváis. Cuanto menos, mejor.
const cercaniaPacto = (s, pid) => distanciaIdeologica(s, ID_JUGADOR, pid) - relacionPartido(s, pid) / 50;
// Por qué un partido no pactaría contigo, o '' si está dispuesto. Nadie hace presidente a un partido
// más pequeño que el suyo.
function pegaPacto(s, pid) {
  if (cercaniaPacto(s, pid) > DISTANCIA_PACTO) return 'Sus ideas están muy lejos de las tuyas';
  if ((s.escanos[pid] || 0) > (s.escanos[ID_JUGADOR] || 0)) return 'Tiene más escaños que tú';
  return '';
}

// La ley que pide un partido a cambio de su apoyo: la que más le gusta de las que no están en vigor,
// procurando que no vaya contra tus ideas.
function leyPedida(s, pid) {
  const suya = afinidadDe(s, pid), pedidas = sociosDe(s).map(x => s.pactos[x].ley);
  let mejor = null, nota = 0;
  for (const l of LEYES) {
    if (s.leyes[l.id] || leyQueChoca(s, l.id) || pedidas.includes(l.id)) continue;
    const gusta = ideologiaLey(suya, l, false);
    if (gusta < 2) continue;
    const n = gusta + Math.min(0, opinionPartido(s, l.id, false)) * 1.5;
    if (!mejor || n > nota) { mejor = l.id; nota = n; }
  }
  return mejor;
}

function puedePactar(s, pid) {
  if (!usaPactos(s) || !PARTIDOS[pid] || pid === ID_JUGADOR) return { ok: false };
  if (s.pactos[pid]) return { ok: false, motivo: 'Ya es tu socio' };
  if (s.modo === 'carrera' && !s.investidura) return { ok: false, motivo: 'Solo al formar gobierno' };
  const pega = pegaPacto(s, pid);
  if (pega) return { ok: false, motivo: pega };
  if (s.cp < 1) return { ok: false, motivo: 'Sin capital político' };
  return { ok: true };
}

function pactar(s, pid) {
  if (!puedePactar(s, pid).ok) return;
  const ley = leyPedida(s, pid);
  s.cp -= 1;
  s.pactos[pid] = { desde: s.mes, ley, limite: s.mes + MESES_PACTO, estado: ley ? 'pendiente' : 'cumplido' };
  if (!s.investidura) {
    noticia(s, `${partidoInfo(s, pid).nombre} entra en el pacto de gobierno.`, 'bien');
    s.minoria = escanosBloque(s) < MAYORIA;
  }
}

// Deshacer un pacto. Mientras se negocia la investidura no cuesta nada; después, el socio se lo toma mal.
function romperPacto(s, pid) {
  if (!s.pactos[pid]) return;
  delete s.pactos[pid];
  if (s.investidura) { s.cp = Math.min(CP_MAXIMO, s.cp + 1); return; }
  if (pid in s.relPartidos) s.relPartidos[pid] = limitar(s.relPartidos[pid] - 15, -100, 100);
  noticia(s, `${s.config.partido} rompe su pacto con ${partidoInfo(s, pid).nombre}.`, 'mal');
  s.minoria = escanosBloque(s) < MAYORIA;
}

// El bloque que se formaría contra ti: el partido libre con más escaños y los afines a él.
function bloqueRival(s, escanos = s.escanos) {
  const libres = partidosIA(s).filter(pid => !s.pactos[pid]);
  if (!libres.length) return { lider: null, socios: [], escanos: 0 };
  const lider = libres.reduce((a, b) => (escanos[b] > escanos[a] ? b : a));
  const socios = [];
  let total = escanos[lider];
  const resto = libres.filter(pid => pid !== lider).sort((a, b) => distanciaIdeologica(s, lider, a) - distanciaIdeologica(s, lider, b));
  for (const pid of resto) {
    if (total >= MAYORIA || distanciaIdeologica(s, lider, pid) > DISTANCIA_PACTO) break;
    socios.push(pid);
    total += escanos[pid];
  }
  return { lider, socios, escanos: total };
}

// Quién gobernaría con los pactos de ahora mismo.
function pronosticoInvestidura(s) {
  const mio = escanosBloque(s), rival = bloqueRival(s), primero = ganaJugador(s.escanos);
  const gobiernas = mio >= MAYORIA || (rival.escanos < MAYORIA && (mio > rival.escanos || (mio === rival.escanos && primero)));
  return { mio, rival, gobiernas, minoria: gobiernas && mio < MAYORIA };
}

// Pacta con los partidos más cercanos hasta llegar a la mayoría (para cuando decide la máquina).
// gratis: sin gastar capital político.
function autoPactar(s, gratis) {
  const candidatos = partidosIA(s).filter(pid => !s.pactos[pid] && !pegaPacto(s, pid))
    .sort((a, b) => cercaniaPacto(s, a) - cercaniaPacto(s, b));
  for (const pid of candidatos) {
    if (escanosBloque(s) >= MAYORIA) break;
    if (gratis) s.pactos[pid] = { desde: s.mes, ley: leyPedida(s, pid), limite: s.mes + MESES_PACTO, estado: 'pendiente' };
    else if (puedePactar(s, pid).ok) pactar(s, pid);
    if (s.pactos[pid] && !s.pactos[pid].ley) s.pactos[pid].estado = 'cumplido';
  }
}

// Al empezar ya gobernando: el gobierno llega con sus pactos hechos.
function formarGobiernoInicial(s) {
  s.pactos = {};
  s.minoria = false;
  if (!usaPactos(s)) return;
  autoPactar(s, true);
  s.minoria = escanosBloque(s) < MAYORIA;
}

// ¿Podrías gobernar si pactaras con todos los partidos que están dispuestos?
function hayCaminoAlGobierno(s) {
  const guardados = s.pactos;
  s.pactos = {};
  autoPactar(s, true);
  const r = pronosticoInvestidura(s);
  s.pactos = guardados;
  return r.gobiernas;
}

// Se abre la negociación. La noche electoral te da algo de capital político para pactar.
function abrirInvestidura(s) {
  s.pactos = {};
  s.minoria = false;
  s.censuraMes = 0;
  s.cp = Math.min(CP_MAXIMO, s.cp + 2);
  s.investidura = { mes: s.mes };
}

const nombresSocios = (s, ids) => ids.map(pid => partidoInfo(s, pid).nombre).join(', ');

// Se vota la investidura: gobiernas tú o gobierna el otro bloque.
function investir(s) {
  if (!s.investidura) return;
  const r = pronosticoInvestidura(s), carrera = s.modo === 'carrera', mios = sociosDe(s), antes = s.investidura.antes || 0;
  s.investidura = null;
  s.elecciones = null;
  if (r.gobiernas) {
    s.minoria = r.minoria;
    if (carrera) {
      if (s.directiva) cumplirDirectiva(s);
      formarGobierno(s);
    } else premioElectoral(s);
    const como = r.minoria ? 'en minoría' : 'con mayoría absoluta';
    noticia(s, mios.length ? `${s.config.lider} es investido ${como}, con el apoyo de ${nombresSocios(s, mios)}.` : `${s.config.lider} es investido ${como}.`, 'bien');
    suceso(s, 'parlamento', r.minoria ? 'Gobiernas en minoría' : 'Formas gobierno',
      r.minoria ? `Tu bloque suma ${r.mio} escaños: no llega a los ${MAYORIA} de la mayoría absoluta, pero nadie reúne más. Te costará aprobar leyes y la oposición puede intentar echarte.`
        : `Tu bloque suma ${r.mio} de los ${ESCANOS} escaños. Cumple lo que has pactado con tus socios para que no se vayan.`);
    return;
  }
  // Gobierna el otro bloque.
  s.pactos = {};
  s.minoria = false;
  const R = r.rival, quien = partidoInfo(s, R.lider).nombre;
  noticia(s, R.socios.length ? `${quien} forma gobierno con el apoyo de ${nombresSocios(s, R.socios)}.` : `${quien} forma gobierno.`, 'mal');
  if (carrera) {
    derrotaCarrera(s, R, antes);
    if (!s.fin) suceso(s, 'parlamento', `Gobierna ${quien}`, `Su bloque suma ${R.escanos} escaños y el tuyo ${r.mio}. Sigues en la oposición hasta las próximas elecciones.`);
  } else {
    caerDelGobierno(s, 'investidura');
    if (s.modo === 'carrera') {
      s.gobiernoIA = R.lider;
      s.sociosIA = R.socios;
      s.modelo = modeloDePartido(R.lider);
    }
  }
}

// Lo que ganas al seguir gobernando tras unas elecciones.
function premioElectoral(s) {
  s.cuenta.elecciones++;
  s.cp = limitar(s.cp + 3, 0, CP_MAXIMO);
  for (const pid in s.relPartidos) if (!s.pactos[pid]) s.relPartidos[pid] = Math.round(s.relPartidos[pid] / 2);
}

// Escaños de los partidos que te tienen ganas: los que no son socios y se llevan mal contigo.
const escanosHostiles = s => partidosIA(s).filter(pid => !s.pactos[pid] && relacionPartido(s, pid) <= -15).reduce((a, pid) => a + (s.escanos[pid] || 0), 0);

// Cada mes, gobernando: los socios vigilan que cumplas, y una oposición con mayoría puede echarte.
function revisarPactos(s) {
  if (s.modo !== 'gobierno' || !usaPactos(s) || s.fin) return;
  for (const pid of Object.keys(s.pactos)) {
    const p = s.pactos[pid];
    if (!PARTIDOS[pid]) { delete s.pactos[pid]; continue; }
    const nombre = partidoInfo(s, pid).nombre;
    if (p.estado === 'pendiente' && p.ley && s.leyes[p.ley]) {
      p.estado = 'cumplido';
      s.relPartidos[pid] = limitar(s.relPartidos[pid] + 10, -100, 100);
      noticia(s, `Cumples lo pactado con ${nombre}: «${LEY_POR_ID[p.ley].nombre}» ya es ley.`, 'bien');
    } else if (p.estado === 'pendiente' && s.mes >= p.limite) {
      delete s.pactos[pid];
      s.relPartidos[pid] = limitar(s.relPartidos[pid] - 20, -100, 100);
      noticia(s, `${nombre} rompe el pacto: no has aprobado «${LEY_POR_ID[p.ley].nombre}».`, 'mal');
    } else if (relacionPartido(s, pid) <= -25) {
      delete s.pactos[pid];
      noticia(s, `${nombre} abandona el pacto de gobierno.`, 'mal');
    }
  }
  s.minoria = escanosBloque(s) < MAYORIA;
  // Moción de censura: un gobierno en minoría e impopular, con una mayoría de partidos en contra.
  const hostiles = escanosHostiles(s);
  const enPeligro = s.minoria && hostiles >= MAYORIA && popularidad(s) < 50 && s.mes - s.inicioLegislatura >= 6;
  if (!enPeligro) { s.censuraMes = 0; return; }
  if (!s.censuraMes) {
    s.censuraMes = s.mes + 3;
    noticia(s, `La oposición suma ${hostiles} escaños y prepara una moción de censura. Tienes 3 meses para pactar, ganar apoyo o llevarte mejor con ella.`, 'mal');
  } else if (s.mes >= s.censuraMes) {
    s.censuraMes = 0;
    noticia(s, `La moción de censura sale adelante con ${hostiles} votos.`, 'mal');
    caerDelGobierno(s, 'censura');
  }
}

// ---------- Forma del Estado y referéndum ----------

const formaEstado = s => (FORMAS_ESTADO[s.forma] ? s.forma : 'monarquia');
// La postura del partido que gobierna: 'monarquia', 'republica' o 'neutral'.
const posturaGobierno = s => posturaForma(perfilDeGobierno(s.config));

// Qué parte del país votaría hoy por la república, de 0 a 1. Cada grupo tira hacia un lado, y un
// gobierno que toma partido arrastra a quienes le apoyan.
function previsionReferendum(s) {
  const postura = posturaGobierno(s), lado = postura === 'republica' ? 1 : postura === 'monarquia' ? -1 : 0;
  let republica = 0;
  for (const g in GRUPOS) {
    const tiron = lado * (s.grupos[g] - 50) / 150;
    republica += GRUPOS[g].peso * limitar(0.5 - PREFERENCIA_FORMA[g] * 0.5 + tiron, 0.05, 0.95);
  }
  return republica;
}

function puedeReferendum(s) {
  if (s.modo !== 'gobierno') return { ok: false };
  if (s.referendumLeg === s.legislatura) return { ok: false, motivo: 'Solo uno por legislatura' };
  if (s.cp < CP_REFERENDUM) return { ok: false, motivo: 'Sin capital político' };
  return { ok: true };
}

// Se vota si el país es una monarquía o una república. Gane quien gane, el resultado se aplica.
function convocarReferendum(s) {
  if (!puedeReferendum(s).ok) return;
  s.cp -= CP_REFERENDUM;
  s.referendumLeg = s.legislatura;
  const republica = limitar(previsionReferendum(s) + (Math.random() - 0.5) * 0.08, 0.02, 0.98);
  const pct = Math.round(republica * 100), gana = republica > 0.5 ? 'republica' : 'monarquia', antes = formaEstado(s);
  const postura = posturaGobierno(s), cambia = gana !== antes;
  s.forma = gana;
  const nombre = FORMAS_ESTADO[gana].nombre.toLowerCase();
  let consecuencia;
  if (postura === 'neutral') consecuencia = 'Tu partido no había tomado partido: ni gana ni pierde.';
  else if (postura === gana) {
    aplicarEfectos(s, { todos: 3, cp: 2 });
    consecuencia = 'Es lo que defendía tu partido: ganas 3 de apoyo en todos los grupos y 2 de capital político.';
  } else {
    aplicarEfectos(s, { todos: -4, estabilidad: -3 });
    consecuencia = 'Tu partido defendía lo contrario: pierdes 4 de apoyo en todos los grupos y 3 de estabilidad.';
  }
  if (cambia) s.estabilidad = limitar(s.estabilidad - 6);
  noticia(s, cambia ? `Referéndum: ${PAIS_JUGADOR.nombre} pasa a ser una ${nombre} con el ${gana === 'republica' ? pct : 100 - pct}% de los votos.`
    : `Referéndum: ${PAIS_JUGADOR.nombre} sigue siendo una ${nombre} con el ${gana === 'republica' ? pct : 100 - pct}% de los votos.`, cambia ? 'mal' : '');
  suceso(s, 'urna', cambia ? `El país pasa a ser una ${nombre}` : `El país sigue siendo una ${nombre}`,
    `República: ${pct}%. Monarquía: ${100 - pct}%. ${cambia ? 'El cambio de régimen resta 6 de estabilidad. ' : ''}${consecuencia}`);
  comprobarFin(s);
}
