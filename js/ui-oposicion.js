'use strict';
// Pantallas de quien está en la oposición de un país compartido (multijugador): su partido,
// sus acciones del mes y el parlamento desde el otro lado.

const miOpositor = () => (estado ? opositorPorToken(estado, miToken()) : null);
const esOposicion = () => enRed() && !!miOpositor();
// La votación que toca mostrar: la tuya si estás en la oposición, la del gobierno si no.
const claveVoto = v => (v ? `${v.tipo || 'ley'}|${v.ley}|${v.derogar}|${v.si}|${v.no}|${v.abs}` : '');
const votoEnPantalla = () => {
  const v = esOposicion() ? miOpositor().resultadoVoto : estado && estado.resultadoVoto;
  return v && ui.votoOculto === claveVoto(v) ? null : v;
};

const TABS_OPOSICION = { oposicion: ['Tu partido', 'bandera'], parlamento: ['Parlamento', 'parlamento'] };

// ---------- El pleno: cada jugador decide el voto de su grupo ----------

// El partido que llevas tú en este parlamento, gobiernes o no.
const miPartido = () => (esOposicion() ? miOpositor().partido : ID_JUGADOR);
// La votación abierta en la que todavía te toca votar.
const plenoPendiente = () => (estado && estado.pleno && !estado.fin && estado.pleno.pendientes.includes(miPartido()) ? estado.pleno : null);
const nombreDoctrina = (s, pid) => {
  const perfil = perfilPropio(s, pid) || PARTIDOS[pid], D = doctrinaDePerfil(perfil);
  return D ? D.nombre : '';
};
const TEXTO_VOTO = { si: 'A favor', no: 'En contra', abs: 'Abstención' };

// Cómo va un pleno: el voto de cada partido, o que aún no ha votado.
function filasPleno(p, yo) {
  const s = estado, r = p.tipo === 'censura' ? intencionCensura(s, p) : intencionVoto(s, p);
  return ORDEN_HEMICICLO.map(pid => {
    const P = partidoInfo(s, pid), d = r.partidos[pid];
    const voto = pid === yo ? '<b class="intencion pend">Te toca votar</b>'
      : d.humano && !d.emitido ? '<b class="intencion pend">Aún no ha votado</b>'
        : `<b class="intencion ${d.voto}">${TEXTO_VOTO[d.voto]}</b>`;
    return `<div class="vp visto">${logoPartido(P, 'mini')}<span>${esc(P.siglas)}, ${s.escanos[pid]}</span>${voto}</div>`;
  }).join('');
}

// La ventana que te salta cuando otro jugador lleva algo al pleno: decides qué vota tu grupo.
function htmlPleno() {
  const s = estado, p = s.pleno, yo = miPartido(), censura = p.tipo === 'censura', oposicion = esOposicion();
  const A = partidoInfo(s, p.autor), ley = censura ? null : LEY_POR_ID[p.ley];
  const saldria = voto => {
    const prueba = { ...p, votos: { ...p.votos, [yo]: voto } };
    return (censura ? intencionCensura(s, prueba) : intencionVoto(s, prueba)).aprueba;
  };
  const cabecera = censura
    ? `<div class="ev-cab"><span class="ev-ico">${ico('balanza')}</span><h2>Moción de censura contra ${esc(s.config.lider)}</h2></div>
      <p>${esc(A.lider)}, de ${esc(A.nombre)}, quiere echar al gobierno y ocupar su lugar. Si la moción sale adelante, pasa a gobernar sin esperar a las elecciones.</p>`
    : `<div class="ev-cab"><span class="ev-ico">${ico('parlamento')}</span><h2>${p.autor === ID_JUGADOR ? 'El gobierno' : esc(A.nombre)} quiere ${p.derogar ? 'derogar' : 'aprobar'} «${ley.nombre}»</h2></div>
      <p>${ley.desc}${p.derogar ? ' Si se deroga, dejan de aplicarse estos efectos:' : ''}</p>
      <div class="chips">${chipsLey(ley)}</div>`;
  const opciones = [['si', 'Votar a favor'], ['no', 'Votar en contra'], ['abs', 'Abstenerse']].map(([v, texto]) => {
    const imagen = oposicion && !censura ? imagenPorVoto(p, v) : {};
    const sale = saldria(v);
    return `<button class="opcion" data-a="plenoVotar" data-v="${v}"><b>${texto}</b>
      <span class="chips">${chip(censura ? (sale ? 'La moción saldría adelante' : 'La moción fracasaría') : (sale ? 'La ley saldría adelante' : 'La ley caería'), censura ? '' : sale ? 'pos' : 'neg')}
        ${Object.keys(imagen).map(g => chip(`Tu imagen entre ${GRUPOS[g].nombre.toLowerCase()} ${signo(imagen[g])}`, clase(imagen[g]))).join('')}</span></button>`;
  }).join('');
  return `${cabecera}
    <p class="nota">Tú decides qué vota tu grupo, con sus ${s.escanos[yo]} escaños. Así va el pleno:</p>
    <div class="voto-partidos">${filasPleno(p, yo)}</div>
    ${opciones}
    <p class="nota">Si se acaba el mes sin que votes, tu grupo ${censura ? 'se abstiene' : oposicion ? 'vota según la consigna que tengas puesta en «Tu partido»' : 'vota según las ideas de tu partido'}.</p>`;
}

// Tarjeta de un pleno abierto en el que ya has votado (o que has abierto tú): quién falta.
function htmlPlenoAbierto() {
  const s = estado, p = s && s.pleno;
  if (!p) return '';
  const yo = miPartido(), censura = p.tipo === 'censura';
  const faltan = p.pendientes.map(pid => esc(partidoInfo(s, pid).lider)).join(', ');
  const titulo = censura ? 'Moción de censura' : `${p.derogar ? 'Derogar: ' : ''}${LEY_POR_ID[p.ley].nombre}`;
  return `<div class="tarjeta tramite pleno-abierto">
    <div class="tarjeta-cab"><b>${ico('parlamento')} ${titulo}</b><span class="cuenta">en el pleno</span></div>
    <p>${p.autor === yo ? 'La has llevado tú al pleno.' : p.votos[yo] ? `Has votado: ${TEXTO_VOTO[p.votos[yo]].toLowerCase()}.` : ''} Falta que vote ${faltan || 'nadie'}. Si no lo hace antes de que acabe el mes, su grupo vota lo que tenga previsto.</p>
    <div class="voto-partidos">${filasPleno(p, null)}</div></div>`;
}

function tabOposicion() {
  const s = estado, o = miOpositor(), P = partidoInfo(s, o.partido), G = partidoInfo(s, ID_JUGADOR);
  const enc = estimarVotos(s, false), reparto = repartoPorGrupo(s, false), faltan = s.proximaEleccion - s.mes;
  const accion = (id, datos, extra = '') => {
    const A = ACCIONES_OPOSICION[id];
    return boton(`${A.nombre}${extra} <span class="coste">${ico('estrella')}${A.cp}</span>`, datos, puedeAccionOposicion(s, o, id), 'mini');
  };
  return `<div class="titulo-pais">${logoPartido(P, 'grande')}<div><h2>${esc(P.nombre)}</h2>
      <p class="nota">Lideras la oposición en ${esc(PAIS_JUGADOR.nombre)}. Gobierna ${esc(G.nombre)}, de ${esc(G.lider)}.</p></div></div>
    <div class="tarjeta resaltada">
      <div class="tarjeta-cab"><b>Elecciones</b><span class="cuenta">en ${plural(faltan, 'mes', 'meses')}</span></div>
      <p>Si tu partido saca más escaños que el del gobierno, pasas a gobernar tú. Así va la encuesta:</p>
      ${duelo([[esc(P.nombre), enc[o.partido], P.color], [esc(G.nombre), enc[ID_JUGADOR], G.color]], 50)}
    </div>
    <h3>Qué haces este mes <span class="cuenta">${o.cp} de ${CP_MAXIMO} de capital político</span></h3>
    <div class="edif"><span class="edif-ico">${ico('megafono')}</span><div class="edif-txt"><b>${ACCIONES_OPOSICION.mitin.nombre}</b>
      <p>${ACCIONES_OPOSICION.mitin.desc}</p>
      <div class="botones">${Object.keys(GRUPOS).map(g => boton(`${GRUPOS[g].nombre}`, { a: 'oposMitin', v: g }, puedeAccionOposicion(s, o, 'mitin'), 'mini')).join('')}</div></div></div>
    <div class="edif"><span class="edif-ico">${ico('periodico')}</span><div class="edif-txt"><b>${ACCIONES_OPOSICION.campana.nombre}</b><p>${ACCIONES_OPOSICION.campana.desc}</p></div>
      <div class="edif-acc">${accion('campana', { a: 'oposCampana' }, '')}</div></div>
    <div class="edif"><span class="edif-ico">${ico('espadas')}</span><div class="edif-txt"><b>${ACCIONES_OPOSICION.denunciar.nombre}</b><p>${ACCIONES_OPOSICION.denunciar.desc}</p></div>
      <div class="edif-acc">${accion('denunciar', { a: 'oposDenunciar' }, '')}</div></div>
    <div class="edif"><span class="edif-ico">${ico('balanza')}</span><div class="edif-txt"><b>Moción de censura</b>
      <p>Pides al parlamento que eche al gobierno y te ponga a ti. Votan todos los partidos: los de otros jugadores, lo que ellos decidan; los demás, según se lleven con el gobierno y lo popular que sea. Solo una por legislatura.</p></div>
      <div class="edif-acc">${boton(`Presentarla <span class="coste">${ico('estrella')}${CP_CENSURA}</span>`, { a: 'oposCensura' }, puedeCensura(s, o), 'mini peligro')}</div></div>
    <h3>Tu consigna ante las leyes del gobierno</h3>
    <p class="nota">Cada vez que el gobierno lleve una ley al pleno te saltará la votación para que decidas. Esto es lo que vota tu grupo si se acaba el mes y no has votado.</p>
    <div class="niveles tres">${Object.keys(POSTURAS).map(k => `<button class="nivel ${o.postura === k ? 'activa' : ''}" data-a="oposPostura" data-v="${k}" ${o.postura === k ? 'disabled' : ''} aria-pressed="${o.postura === k}">
      <b>${POSTURAS[k].nombre}</b><small>${POSTURAS[k].desc}</small></button>`).join('')}</div>
    <h3>Tu imagen entre los votantes</h3>
    ${Object.keys(GRUPOS).map(g => `<div class="tarjeta">
      <div class="tarjeta-cab"><b>${ico(GRUPOS[g].icono)} ${GRUPOS[g].nombre}</b><span class="cuenta">te votaría el ${Math.round(reparto[g][o.partido] * 100)}%</span></div>
      <div class="barra-rel"><span style="left:${(o.imagen[g] + 15) / 30 * 100}%"></span></div>
      <p class="nota">Imagen ${signo(o.imagen[g]) || '0'} (de −15 a +15).</p></div>`).join('')}`;
}

function tabParlamentoOposicion() {
  const s = estado, o = miOpositor();
  const leyenda = ORDEN_HEMICICLO.map(pid => {
    const P = partidoInfo(s, pid), etiqueta = pid === ID_JUGADOR ? chip('gobierna') : pid === o.partido ? chip('tú', 'pos') : P.humano ? chip('jugador') : '';
    return `<div>${logoPartido(P, 'mini')}<b>${esc(P.nombre)}</b><small class="lider">${esc(P.lider)}</small><span>${s.escanos[pid]} escaños</span>${etiqueta}</div>`;
  }).join('');
  const tarjeta = ley => {
    const derogar = !!s.leyes[ley.id], prop = propuestaOposicion(s, o, ley.id, derogar), r = intencionVoto(s, prop);
    return `<div class="tarjeta ${derogar ? 'vigente' : ''}">
      <div class="tarjeta-cab"><b>${derogar ? 'Derogar: ' : ''}${ley.nombre}</b><span class="tags">${ley.tags.map(t => ETIQUETAS[t]).join(', ') || 'Neutral'}</span></div>
      <p>${ley.desc}</p><div class="chips">${chipsLey(ley)}${chip(r.aprueba ? `Saldría: ${r.si} a ${r.no}` : `Caería: ${r.si} a ${r.no}`, r.aprueba ? 'pos' : 'neg')}</div>
      ${boton(`${derogar ? 'Proponer derogarla' : 'Presentarla'} <span class="coste">${ico('estrella')}${COSTE_LEY_OPOSICION}</span>`,
        { a: 'oposProponer', ley: ley.id, derogar: derogar ? 1 : 0 }, puedeLeyOposicion(s, o, ley.id, derogar), 'mini')}</div>`;
  };
  return `<h2>Parlamento</h2>${hemicicloSVG(s.escanos)}<div class="leyenda">${leyenda}</div>
    ${htmlPlenoAbierto()}
    <p class="nota">Puedes presentar una ley al mes. Tu grupo la vota a favor; al gobierno y a los demás jugadores les salta la votación para que decidan; el resto de partidos vota según sus ideas.
      Si sale adelante, mejora tu imagen entre quienes se benefician. El recuento de cada ley es una previsión: los jugadores pueden votar otra cosa.</p>
    <div class="filtros">${['todas', 'vigor', ...Object.keys(CATEGORIAS_LEY)].map(f => `<button class="${ui.filtroLey === f ? 'activa' : ''}" data-a="filtroLey" data-v="${f}">${f === 'todas' ? 'Todas' : f === 'vigor' ? 'En vigor' : CATEGORIAS_LEY[f]}</button>`).join('')}</div>
    ${LEYES.filter(l => ui.filtroLey === 'todas' || (ui.filtroLey === 'vigor' ? s.leyes[l.id] : l.cat === ui.filtroLey)).map(tarjeta).join('')}`;
}

function htmlIntroOposicion() {
  const s = estado, o = miOpositor(), G = partidoInfo(s, ID_JUGADOR);
  return `<h2>La oposición en ${esc(PAIS_JUGADOR.nombre)}</h2>
    <p>${esc(o.perfil.lider)}, tu partido ${esc(partidoInfo(s, o.partido).nombre)} comparte país con ${esc(G.lider)}, que gobierna con ${esc(G.nombre)}.</p>
    <ul class="ayuda">
      <li>${ico('megafono')}<div><b>Haz campaña</b><span>Mítines, carteles y denuncias te ganan votantes y se los quitan al gobierno.</span></div></li>
      <li>${ico('parlamento')}<div><b>Presenta leyes</b><span>Una al mes. Si salen adelante, los grupos a los que benefician te lo agradecen.</span></div></li>
      <li>${ico('balanza')}<div><b>Decide tu voto</b><span>Cada ley que el gobierno lleve al pleno te saltará en pantalla: tú decides qué vota tu grupo.</span></div></li>
      <li>${ico('espadas')}<div><b>Moción de censura</b><span>Si el gobierno está débil y los demás partidos no lo quieren, puedes echarlo sin esperar a las urnas.</span></div></li>
      <li>${ico('urna')}<div><b>Gana las elecciones</b><span>Si sacas más escaños que el gobierno, pasas a gobernar tú y quien gobernaba pasa a la oposición.</span></div></li>
    </ul>
    <button class="btn principal" data-a="cerrar">Empezar</button>`;
}
