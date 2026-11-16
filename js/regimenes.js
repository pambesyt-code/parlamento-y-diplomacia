'use strict';
// La política de los demás países. Cada uno tiene un régimen (democracia o dictadura), una forma de
// Estado y una doctrina en el poder. Las democracias votan cada cierto tiempo y pueden cambiar de
// gobierno; a veces un golpe acaba con las elecciones, y a veces una dictadura cae. Quien manda en
// un país cambia cómo te mira (según lo cerca que estén sus ideas de las de tu partido), lo que
// comercia y lo agresivo que es.
//
// Todo va en s.mundo.politica, común a todas las naciones de la partida.

function politicaInicial(pid) {
  const tipo = NACIONES[pid].gobierno, base = REGIMEN_INICIAL[tipo] || { regimen: 'democracia', forma: 'republica' };
  const dictadura = base.regimen === 'dictadura';
  const doctrina = tipo === 'Teocracia' ? 'integrismo' : alAzar(dictadura ? DOCTRINAS_DICTADURA.filter(d => d !== 'integrismo') : DOCTRINAS_URNAS);
  return { regimen: base.regimen, forma: base.forma, doctrina, teocracia: tipo === 'Teocracia', proxima: dictadura ? 0 : 6 + Math.floor(Math.random() * 30), cambios: 0 };
}

function iniciarPolitica(m) {
  m.politica = {};
  for (const pid in NACIONES) if (!NACIONES[pid].humano) m.politica[pid] = politicaInicial(pid);
}

// La política de un país visto desde una nación; null si es de otro jugador.
function politicaDe(s, pid) {
  const m = s.mundo;
  if (!NACIONES[pid] || NACIONES[pid].humano) return null;
  if (!m.politica) iniciarPolitica(m);
  return m.politica[pid] || (m.politica[pid] = politicaInicial(pid));
}

// Cómo se llama su régimen ahora mismo.
function nombreRegimen(s, pid) {
  const P = politicaDe(s, pid);
  if (!P) return PAISES[pid] ? PAISES[pid].gobierno : '';
  if (P.regimen === 'dictadura') return P.teocracia ? 'Teocracia' : P.forma === 'monarquia' ? 'Monarquía absoluta' : 'Dictadura';
  return P.forma === 'monarquia' ? 'Monarquía parlamentaria' : 'República democrática';
}

// Lo que cambia tu relación de fondo con un país por quién lo gobierna: sube si sus ideas se
// parecen a las de tu partido y baja si están lejos. Las dictaduras caen peor.
function afinidadConPais(s, pid) {
  const P = politicaDe(s, pid), D = P && DOCTRINAS[P.doctrina];
  if (!D) return 0;
  const yo = posicionPartido(s, ID_JUGADOR), d = Math.hypot(yo.x - D.eje, (yo.y - (D.social - 2)) * 0.8);
  let n = Math.round((1.6 - d) * 6);
  if (P.regimen === 'dictadura') {
    const mia = doctrinaGobierno(s), afin = mia && (mia.familia === 'autoritaria' || mia.familia === 'revolucionaria');
    n += afin ? 3 : -6;
  }
  return limitar(n, -14, 12);
}

// Aplica a una nación el cambio político de un país: quita lo que sumaba el gobierno anterior y pone lo del nuevo.
function ajustarAfinidad(s, pid) {
  const p = s.paises[pid];
  if (!p) return 0;
  const antes = p.afin || 0, ahora = afinidadConPais(s, pid);
  p.afin = ahora;
  p.base = limitar(p.base - antes + ahora, -40, 40);
  return ahora - antes;
}

// Lo que rinde un tratado comercial con un país: más con gobiernos de mercado, menos con dictaduras.
function comercioDe(s, pid) {
  const P = politicaDe(s, pid), base = PAISES[pid].comercio;
  if (!P) return base;
  const D = DOCTRINAS[P.doctrina], k = (P.regimen === 'dictadura' ? 0.85 : 1) * (D.intervencion <= 1 ? 1.15 : D.intervencion >= 3 ? 0.9 : 1);
  return Math.round(base * k);
}

const esDictadura = (s, pid) => { const P = politicaDe(s, pid); return !!P && P.regimen === 'dictadura'; };

// Un mes de política en el resto del mundo. naciones: las de los jugadores. aTodos: publica una noticia en todas.
function mesPolitica(naciones, aTodos) {
  const s0 = naciones[0], m = s0.mundo, mes = s0.mes, varias = naciones.length > 1;
  if (!m.politica) iniciarPolitica(m);
  const cambios = [];
  for (const pid of paisesIA(m)) {
    const P = m.politica[pid] || (m.politica[pid] = politicaInicial(pid)), nombre = NACIONES[pid].nombre;
    const enGuerra = m.guerras.some(g => g.a === pid || g.b === pid) || naciones.some(s => s.guerras[pid]);
    if (P.regimen === 'democracia') {
      if (Math.random() < (enGuerra ? 0.012 : 0.004)) {
        Object.assign(P, { regimen: 'dictadura', doctrina: alAzar(DOCTRINAS_DICTADURA), teocracia: false, cambios: P.cambios + 1 });
        m.ejercitos[pid] = (m.ejercitos[pid] || 0) + 1;
        aTodos(`Golpe de Estado en ${nombre}: se acaban las elecciones y manda una dictadura (${DOCTRINAS[P.doctrina].nombre.toLowerCase()}).`);
        cambios.push(pid);
      } else if (mes >= P.proxima) {
        P.proxima = mes + 30 + Math.floor(Math.random() * 18);
        if (Math.random() < 0.5) aTodos(`Elecciones en ${nombre}: el gobierno revalida su mayoría.`);
        else {
          P.doctrina = alAzar(DOCTRINAS_URNAS.filter(d => d !== P.doctrina));
          P.cambios++;
          aTodos(`Elecciones en ${nombre}: cambia el gobierno. Ahora manda: ${DOCTRINAS[P.doctrina].nombre.toLowerCase()}.`);
          cambios.push(pid);
        }
      }
    } else if (Math.random() < 0.012) {
      Object.assign(P, { regimen: 'democracia', doctrina: alAzar(DOCTRINAS_URNAS), teocracia: false, proxima: mes + 24 + Math.floor(Math.random() * 12), cambios: P.cambios + 1 });
      aTodos(`Cae la dictadura en ${nombre}: el país celebra elecciones libres y gana: ${DOCTRINAS[P.doctrina].nombre.toLowerCase()}.`);
      cambios.push(pid);
    }
  }
  // Cada nación nota el cambio según lo que piense su partido.
  for (const s of naciones) {
    if (!cambios.length) break;
    if (varias) usarNacion(s);
    for (const pid of cambios) {
      const d = ajustarAfinidad(s, pid);
      if (Math.abs(d) >= 4 && s.modo === 'gobierno') {
        noticia(s, d > 0 ? `El nuevo gobierno de ${NACIONES[pid].nombre} mira a ${s.config.pais} con simpatía.` : `El nuevo gobierno de ${NACIONES[pid].nombre} mira a ${s.config.pais} con recelo.`, 'mundo');
      }
    }
  }
}
