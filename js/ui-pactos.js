'use strict';
// Pantallas de la versión 2.1: pactos de gobierno e investidura, forma del Estado y referéndum,
// el partido provincial con sus sedes y la política de los demás países.

// ---------- Pactos e investidura ----------

// Tu bloque frente al del rival, con la marca de la mayoría absoluta.
function barrasBloques(s) {
  const r = pronosticoInvestidura(s), R = r.rival;
  const fila = (nombre, n, color) => `<div class="duelo-fila"><span>${nombre}</span>
    <div class="duelo-barra mayoria"><i style="width:${Math.min(100, n / ESCANOS * 100)}%;background:${color}"></i></div><b>${n}</b></div>`;
  return `<div class="duelo">${fila('Tu bloque', r.mio, colorJugador())}
    ${R.lider ? fila(`Bloque de ${esc(partidoInfo(s, R.lider).siglas)}`, R.escanos, partidoInfo(s, R.lider).color) : ''}</div>
    <p class="nota">La marca señala los ${MAYORIA} escaños de la mayoría absoluta.</p>`;
}

// Una fila por cada partido de la máquina: si es socio, si pactaría contigo y qué pide a cambio.
function filasPacto(s) {
  const enInvestidura = !!s.investidura, R = enInvestidura ? bloqueRival(s) : { lider: null, socios: [] };
  return partidosIA(s).sort((a, b) => cercaniaPacto(s, a) - cercaniaPacto(s, b)).map(pid => {
    const P = partidoInfo(s, pid), pacto = s.pactos[pid], pega = pegaPacto(s, pid);
    let detalle, der;
    if (pacto) {
      const ley = pacto.ley && LEY_POR_ID[pacto.ley];
      detalle = !ley ? 'No pide nada a cambio' : pacto.estado === 'cumplido' ? `Ya has cumplido: «${ley.nombre}»`
        : enInvestidura ? `Pide: «${ley.nombre}» antes de ${MESES_PACTO} meses` : `Pide: «${ley.nombre}». Te quedan ${plural(Math.max(0, pacto.limite - s.mes), 'mes', 'meses')}`;
      der = `<span class="intencion si">Socio</span><button class="enlace peligro" data-a="romperPacto" data-partido="${pid}">${enInvestidura ? 'Deshacer' : 'Romper el pacto'}</button>`;
    } else if (pega) {
      detalle = pega;
      const bando = pid === R.lider ? 'Rival' : R.socios.includes(pid) ? 'Con el rival' : 'No pacta';
      der = `<span class="intencion ${bando === 'No pacta' ? 'abs' : 'no'}">${bando}</span>`;
    } else {
      const ley = leyPedida(s, pid);
      detalle = ley ? `Pediría: «${LEY_POR_ID[ley].nombre}»` : 'No pide nada a cambio';
      der = boton(`Pactar ${ico('estrella')}1`, { a: 'pactar', partido: pid }, puedePactar(s, pid), 'mini');
    }
    return `<div class="voto">${logoPartido(P, 'mini')}
      <div class="voto-txt"><b>${esc(P.nombre)}</b> ${s.escanos[pid]} escaños<small>${esc(nombreDoctrina(s, pid))}</small><small>${detalle}</small></div>
      <div class="voto-der">${der}</div></div>`;
  }).join('');
}

// La ventana de la investidura: se negocia hasta que te presentas a la votación.
function htmlInvestidura() {
  const s = estado, r = pronosticoInvestidura(s), R = r.rival;
  const veredicto = r.gobiernas
    ? (r.minoria ? 'Con estos pactos gobernarías en minoría: nadie reúne más escaños que tu bloque.' : 'Con estos pactos tienes mayoría absoluta.')
    : `Con estos pactos gobernaría ${nombrePartido(R.lider)}.`;
  return `<div class="ev-cab"><span class="ev-ico">${ico('parlamento')}</span><h2>Investidura</h2></div>
    <p>Nadie tiene los ${MAYORIA} escaños de la mayoría absoluta. Gobernará el bloque que más reúna: busca socios antes de la votación.</p>
    ${barrasBloques(s)}
    <div class="lista-pactos">${filasPacto(s)}</div>
    <p class="nota">Solo pactan contigo los partidos de ideas cercanas a las tuyas y que no tengan más escaños que tú. Cada socio pide una ley: si no la apruebas a tiempo, se va.</p>
    <p class="veredicto visto ${r.gobiernas ? 'pos' : 'neg'}">${veredicto}</p>
    <button class="btn principal" data-a="investir">Presentarse a la investidura</button>`;
}

// En Parlamento, mientras gobiernas: tus socios, lo que les debes y con quién más podrías pactar.
function htmlPactos() {
  const s = estado;
  if (s.modo !== 'gobierno' || !usaPactos(s)) return '';
  const bloque = escanosBloque(s), hostiles = escanosHostiles(s);
  const aviso = s.censuraMes
    ? `<p class="motivo">La oposición prepara una moción de censura. Te quedan ${plural(Math.max(0, s.censuraMes - s.mes), 'mes', 'meses')} para sumar socios, ganar popularidad o llevarte mejor con ella.</p>`
    : s.minoria ? `<p class="nota">En minoría pierdes 4 de estabilidad. Si los partidos que se llevan mal contigo suman ${MAYORIA} escaños y tu popularidad baja de 50, te presentarán una moción de censura. Ahora suman ${hostiles}.</p>` : '';
  return `<div class="tarjeta pactos"><div class="tarjeta-cab"><b>${ico('maletin')} Pactos de gobierno</b><span class="cuenta">${bloque} de ${ESCANOS} escaños</span></div>
    <div class="chips">${bloque >= MAYORIA ? chip('Mayoría absoluta', 'pos') : chip('Gobierno en minoría', 'neg')}</div>
    ${aviso}
    <div class="lista-pactos">${filasPacto(s)}</div>
    <p class="nota">Tus socios votan tus leyes con +2. Cada uno pide una ley: si vence el plazo sin aprobarla, rompe el pacto y vuestra relación baja 20.</p></div>`;
}

// ---------- Forma del Estado ----------

function htmlFormaEstado() {
  const s = estado, forma = formaEstado(s), F = FORMAS_ESTADO[forma], postura = posturaGobierno(s), rep = Math.round(previsionReferendum(s) * 100);
  const quiere = postura === 'neutral' ? 'Tu partido no se pronuncia sobre esto.'
    : postura === forma ? 'Tu partido defiende que siga así.' : 'Tu partido quiere cambiarlo.';
  const efectos = [F.estabilidad ? chip(`Estabilidad ${signo(F.estabilidad)}`, clase(F.estabilidad)) : '',
    ...Object.keys(F.grupos || {}).map(g => chip(`${GRUPOS[g].nombre} ${signo(F.grupos[g])}`, clase(F.grupos[g])))].join('');
  return `<div class="tarjeta"><div class="tarjeta-cab"><b>${ico('corona')} Forma del Estado</b><span class="cuenta">${F.nombre}</span></div>
    <p>${F.desc} ${quiere}</p>
    <div class="chips">${efectos}</div>
    <div class="referendum"><span>República</span><div class="referendum-barra"><i style="width:${rep}%"></i></div><span>Monarquía</span></div>
    <p class="nota">Si hoy se votara: república ${rep}%, monarquía ${100 - rep}%. Gane quien gane, el resultado se aplica.
      Si gana lo que defiende tu partido, sube tu apoyo; si pierde, baja. Cambiar de forma de Estado cuesta 6 de estabilidad.</p>
    ${boton(`Convocar un referéndum <span class="coste">${ico('estrella')}${CP_REFERENDUM}</span>`, { a: 'referendum' }, puedeReferendum(s), 'mini')}</div>`;
}

// ---------- Partido provincial ----------

// El grupo que más pesa en una provincia.
const grupoMayor = p => Object.keys(GRUPOS).reduce((a, g, i, lista) => (p.mix[i] > p.mix[lista.indexOf(a)] ? g : a));

// La primera decisión: en qué provincia nace el partido.
function htmlFundar() {
  const s = estado;
  return `<div class="ev-cab"><span class="ev-ico">${ico(s.config.emblema)}</span><h2>¿Dónde nace tu partido?</h2></div>
    <p>Elige la provincia de tu primera sede. Al principio solo te votarán allí; después podrás abrir delegaciones en las demás.</p>
    <div class="lista-prov">${provinciasJugador().map(p => `<button class="fila-prov" data-a="fundar" data-prov="${p.id}">
      <b>${p.capital ? '★ ' : ''}${p.nombre}</b><span class="cuenta">${p.pob.toLocaleString('es')} mil habitantes</span>
      <span class="cuenta" style="margin-left:auto">${ico(GRUPOS[grupoMayor(p)].icono)} ${GRUPOS[grupoMayor(p)].nombre}</span></button>`).join('')}</div>
    <p class="nota">Donde vive más gente hay más votos que ganar. El grupo que aparece es el que más pesa allí: es a quien tendrás que convencer.</p>`;
}

// En Partido: tus sedes, provincia a provincia.
function htmlSedes() {
  const s = estado, c = s.carrera;
  return `<h3>Sedes <span class="cuenta">llegas al ${Math.round(alcance(s) * 100)}% de los votantes</span></h3>
    <p class="nota">Solo recoges votos donde tienes sede. Una delegación llega a la mitad de los votantes de su provincia, una sede a ocho de cada diez y una gran sede a todos. Cada una da 2 de fondos al mes.</p>
    ${provinciasJugador().map(p => {
      const n = c.sedes[p.id] || 0, coste = costeSede(s, p.id);
      const voto = n ? `Te votaría el ${Math.round(votoProvincia(s, p.id)[ID_JUGADOR] * 100)}%.` : 'Aquí todavía no te puede votar nadie.';
      return `<div class="edif"><span class="edif-ico ${n ? '' : 'vacia'}">${ico(n ? 'bandera' : 'mapa')}</span>
        <div class="edif-txt"><b>${p.nombre}</b><span class="cuenta">${NOMBRES_SEDE[n]}</span>${p.id === c.cuna ? chip('Donde nació') : ''}
          <p>${p.pob.toLocaleString('es')} mil habitantes. ${voto}</p>
          <div class="niveles-sede" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="edif-acc">${n >= 3 ? '' : boton(`${n ? 'Ampliar' : 'Abrir'} <span class="coste">${ico('estrella')}${coste.cp} ${ico('moneda')}${coste.fondos}</span>`,
          { a: 'sede', prov: p.id }, puedeSede(s, p.id), 'mini')}</div></div>`;
    }).join('')}`;
}

// La bienvenida a quien funda un partido provincial.
function htmlIntroProvincial() {
  const s = estado, punto = (icono, titulo, texto) => `<li>${ico(icono)}<div><b>${titulo}</b><span>${texto}</span></div></li>`;
  return `<h2>Un partido nuevo</h2>
    <p>${esc(s.config.lider)}, acabas de fundar ${esc(s.config.partido)}. No tienes ni un escaño y solo te conocen en una provincia. Gobierna ${nombrePartido(s.gobiernoIA)}. Cada turno es un mes.</p>
    <ul class="ayuda">
      ${punto('mapa', 'Abre sedes', 'Solo te votan donde tienes sede. En Partido abres delegaciones y las amplías.')}
      ${punto('moneda', 'Recauda fondos', 'Las sedes cuestan dinero. Cada una trae cuotas de afiliados todos los meses.')}
      ${punto('megafono', 'Hazte un nombre', 'El prestigio, los mítines y las campañas te acercan a los votantes.')}
      ${punto('urna', 'Entra en el Parlamento', `Las primeras elecciones son en ${plural(faltanElecciones(s), 'mes', 'meses')}. Con escaños podrás presentar leyes.`)}
      ${punto('parlamento', 'Llega al gobierno', `Hacen falta ${MAYORIA} de los ${ESCANOS} escaños, tú solo o pactando con partidos afines más pequeños que el tuyo.`)}
    </ul>
    <button class="btn principal" data-a="cerrar">Fundar el partido</button>`;
}

// ---------- La política de los demás países ----------

function chipsRegimen(s, pid) {
  const P = politicaDe(s, pid);
  if (!P) return '';
  const afin = s.paises[pid].afin || 0, faltan = P.proxima - s.mes;
  return [chip(`En el poder: ${DOCTRINAS[P.doctrina].nombre}`),
    P.regimen === 'democracia' ? chip(faltan > 0 ? `Elecciones en ${plural(faltan, 'mes', 'meses')}` : 'Elecciones este mes') : chip('Sin elecciones', 'neg'),
    afin ? chip(`Afinidad con tu partido ${signo(afin)}`, clase(afin)) : ''].join('');
}
