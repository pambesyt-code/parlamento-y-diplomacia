'use strict';
// Tutoriales guiados. Una tarjeta explica cada paso con un dibujo, te lleva sola a la pestaña que toca
// y un puntero señala dónde pulsar. Los pasos con «hecho» son tareas: avanzan solos cuando el jugador
// hace lo que se pide; los demás, con «Siguiente».
// - Simple: una partida de práctica ya en el gobierno, con lo básico (leyes, pactos, ministros, mitin).
// - Completo: desde crear la partida, la carrera de diputado a líder (acelerada: congreso y
//   elecciones llegan en pocos meses), la investidura y después el gobierno a fondo.
// Mientras dura un tutorial, la partida no se guarda.
//
// Cada paso puede llevar: cap (capítulo), icono, titulo, texto, visual (dibujo), tarea (lo que hay
// que hacer), tab (pestaña a la que te lleva), foco (qué se señala), hecho, alEntrar, si (si no se
// cumple, el paso se salta), modal (la tarjeta se ve por encima de la ventana abierta), boton y fin.

const TUTORIAL_VISTO = 'pyd-tutorial-v1';
const tutorialVisto = () => { try { return !!localStorage.getItem(TUTORIAL_VISTO); } catch (e) { return true; } };
const marcarTutorialVisto = () => { try { localStorage.setItem(TUTORIAL_VISTO, '1'); } catch (e) { /* sin almacenamiento */ } };
const creandoPartida = () => ui.pantalla === 'menu' && ui.menu === 'nueva';
const enTutorial = () => !!ui.tutorial && ((ui.pantalla === 'juego' && !!estado) || (ui.tutorial.tipo === 'completo' && creandoPartida()));
const tutorialCompleto = () => !!ui.tutorial && ui.tutorial.tipo === 'completo';

const TAB = t => `.tab[data-v="${t}"]`;
const enTab = (t, sel) => () => (ui.tab !== t ? TAB(t) : sel);
const meses = n => `${n} ${n === 1 ? 'mes' : 'meses'}`;

// Capítulos: nombre e icono. La barra de arriba de la tarjeta tiene un tramo por capítulo.
const CAPITULOS = {
  inicio: ['Primeros pasos', 'birrete'], crear: ['Crear la partida', 'usuario'], carrera: ['La carrera', 'flechaArriba'],
  campana: ['Campaña y elecciones', 'urna'], pais: ['Tu país', 'mapa'], economia: ['Economía', 'grafica'],
  leyes: ['Leyes y pactos', 'parlamento'], gobierno: ['Tu gobierno', 'maletin'], gente: ['Tus votantes', 'gente'],
  mundo: ['El mundo', 'globo'], fin: ['Fin', 'estrella'],
};

// ---------- Dibujos de la tarjeta ----------

const tvFila = celdas => `<div class="tv tv-fila">${celdas.join('')}</div>`;
const tvCelda = (icono, nombre, nota, cls = '') => `<div class="tv-celda ${cls}">${ico(icono)}<b>${nombre}</b>${nota ? `<small>${nota}</small>` : ''}</div>`;
const tvFlecha = `<span class="tv-flecha">${ico('flecha')}</span>`;

const V = {
  bienvenida: s => `<div class="tv tv-bienvenida">${logoPartido(partidoInfo(s, ID_JUGADOR), 'grande')}${bandera(PAIS_JUGADOR.id, 'grande')}
    <div><b>${esc(s.config.partido)}</b><small>${esc(s.config.pais)}</small></div></div>`,
  cifras: s => tvFila(s.modo === 'carrera'
    ? [tvCelda('estrella', 'Prestigio', 'Tu fama'), tvCelda('gente', 'Apoyo en el partido', 'Lo que te quieren los tuyos'), tvCelda('moneda', 'Fondos', 'Pagan tus campañas')]
    : [tvCelda('moneda', 'Dinero', 'Paga obras y ejército'), tvCelda('gente', 'Popularidad', 'Da escaños'), tvCelda('escudo', 'Estabilidad', 'Si se hunde, caes')]),
  // El capital político: lo que tienes, lo que recuperas y lo que cuesta cada cosa.
  cp: s => {
    const puntos = Array.from({ length: CP_MAXIMO }, (_, i) => `<i class="${i < s.cp ? 'lleno' : ''}"></i>`).join('');
    const costes = s.modo === 'carrera'
      ? [['Llevar una ley a votación', s.carrera.cargo === 'diputado' ? 3 : 2], ['Negociar un voto', 1], ['Dar un mitin', 1]]
      : [['Llevar una ley a votación', 2], ['Negociar un voto', 1], ['Nombrar un ministro', 1], ['Cerrar un pacto', 1], ['Dar un mitin', 1],
        ['Convocar un referéndum', CP_REFERENDUM], ['Declarar una guerra', CP_DECLARAR_GUERRA]];
    return `<div class="tv tv-cp"><div class="tv-puntos">${puntos}</div>
      <p class="tv-nota">Tienes ${s.cp} de ${CP_MAXIMO} · +${cpAlMes(s)} al mes</p>
      <div class="tv-costes">${costes.map(([n, c]) => `<span>${n}<b>${ico('estrella')}${c}</b></span>`).join('')}</div></div>`;
  },
  cadena: () => `<div class="tv tv-cadena">${tvCelda('trigo', 'Granja', 'Alimentos')}${tvCelda('pico', 'Mina', 'Materias')}${tvFlecha}${tvCelda('fabrica', 'Fábrica', 'Bienes')}${tvFlecha}${tvCelda('moneda', 'Dinero', '')}</div>`,
  // El hemiciclo en una barra: cada partido con su color y la raya de la mayoría absoluta.
  escanos: s => {
    const ids = [ID_JUGADOR, ...sociosDe(s), ...partidosIA(s).filter(p => !s.pactos[p]).sort((a, b) => s.escanos[b] - s.escanos[a])];
    const tramos = ids.filter(p => s.escanos[p] > 0).map(p => `<i style="flex:${s.escanos[p]};background:${partidoInfo(s, p).color}" title="${esc(partidoInfo(s, p).nombre)}"></i>`).join('');
    const bloque = escanosBloque(s);
    return `<div class="tv tv-escanos"><div class="tv-barra">${tramos}<em style="left:${MAYORIA / ESCANOS * 100}%"></em></div>
      <p class="tv-nota">${sociosDe(s).length ? `Tú y tus socios: ${bloque} de ${ESCANOS} escaños` : `Tu partido: ${bloque} de ${ESCANOS} escaños`} · mayoría absoluta: ${MAYORIA}</p></div>`;
  },
  estado: s => {
    const rep = Math.round(previsionReferendum(s) * 100), forma = formaEstado(s);
    return `<div class="tv tv-estado">${tvCelda('parlamento', 'República', `${rep}%`, forma === 'republica' ? 'activa' : '')}
      <div class="referendum-barra"><i style="width:${rep}%"></i></div>${tvCelda('corona', 'Monarquía', `${100 - rep}%`, forma === 'monarquia' ? 'activa' : '')}</div>`;
  },
  grupos: s => `<div class="tv tv-grupos">${Object.keys(GRUPOS).map(g => `<div><span>${ico(GRUPOS[g].icono || 'gente')}${GRUPOS[g].nombre}</span>
    <div class="tv-medidor"><i style="width:${Math.round(s.grupos[g])}%"></i></div><b>${Math.round(s.grupos[g])}</b></div>`).join('')}</div>`,
  mundo: () => tvFila([tvCelda('urna', 'Democracias', 'Votan y cambian'), tvCelda('espadas', 'Dictaduras', 'Pueden caer'), tvCelda('corona', 'Monarquías', 'O repúblicas')]),
  // El camino de la carrera, con la etapa en la que estás.
  camino: s => {
    const etapa = !s ? 0 : s.modo === 'gobierno' ? 2 : esLider(s) ? 1 : 0;
    const c = (i, icono, nombre) => tvCelda(icono, nombre, '', i === etapa ? 'activa' : i < etapa ? 'hecha' : '');
    return `<div class="tv tv-cadena">${c(0, 'usuario', 'Diputado')}${tvFlecha}${c(1, 'bandera', 'Líder del partido')}${tvFlecha}${c(2, 'corona', 'Presidente')}</div>`;
  },
  modos: () => tvFila([tvCelda('flechaArriba', 'Carrera', 'De diputado a presidente'), tvCelda('maletin', 'Gobierno', 'Mandas desde el principio'), tvCelda('casa', 'Provincial', 'De 0 escaños a todo el país')]),
};

// ---------- Pasos del gobierno (los comparten los dos tutoriales) ----------
// foco: selector de lo que se señala (o función que lo da según lo que haya en pantalla).

const G = {
  cifras: {
    cap: 'inicio', icono: 'grafica', visual: V.cifras,
    titulo: () => 'Tus cifras',
    texto: () => 'Arriba está siempre lo que más importa. Puedes pulsar cada cifra para ver de dónde sale.',
    foco: '#stats',
  },
  cp: {
    cap: 'inicio', icono: 'estrella', visual: V.cp,
    titulo: () => 'El capital político',
    texto: () => 'Es tu energía para decidir. <b>Casi todo lo importante lo gasta</b> y cada mes recuperas un poco. Si te quedas sin él toca esperar al mes siguiente, así que elige bien en qué lo usas.',
    foco: '#st-cp',
  },
  provincia: {
    cap: 'pais', icono: 'mapa', tab: 'provincia', tarea: 'Elige una de tus provincias',
    titulo: () => 'Tus provincias',
    texto: () => 'Te he llevado a <b>Provincias</b>. Tu país se divide en provincias, cada una con su gente y sus recursos. Pulsa una de las tuyas, en el mapa o en la lista.',
    foco: enTab('provincia', '.lista-prov'),
    alEntrar: () => { ui.prov = null; },
    hecho: () => ui.tab === 'provincia' && !!ui.prov,
  },
  construir: {
    cap: 'pais', icono: 'martillo', visual: V.cadena, tarea: 'Construye un edificio',
    titulo: () => 'Construye algo',
    texto: () => 'Cada edificio dice lo que te dará al mes antes de pagarlo. Las granjas quieren tierra fértil y las minas, minerales. Pulsa <b>Construir</b> en el que prefieras.',
    foco: () => (ui.tab !== 'provincia' ? TAB('provincia') : !ui.prov ? '.lista-prov' : '.edif [data-a="construir"]:not(:disabled)'),
    hecho: s => s.cuenta.obras > 0,
  },
  economia: {
    cap: 'economia', icono: 'grafica', tab: 'economia',
    titulo: () => 'Que salgan los números',
    texto: () => 'Te he llevado a <b>Economía</b>: aquí ves de dónde sale y a dónde va el dinero. <b>Mejores inversiones</b> te dice qué obra se paga antes. Más abajo puedes cambiar los <b>impuestos</b> y pedir <b>préstamos</b>. Si la deuda pasa de −400, tu gobierno cae.',
    foco: '#contenido',
  },
  parlamento: {
    cap: 'leyes', icono: 'parlamento', tab: 'parlamento', visual: V.escanos,
    titulo: () => 'El Parlamento',
    texto: () => `Te he llevado al <b>Parlamento</b>. Hay <b>${ESCANOS} escaños</b> y la mayoría absoluta son <b>${MAYORIA}</b>. Cada color es un partido: una ley sale si tiene más votos a favor que en contra.`,
    foco: '#contenido',
  },
  proponer: {
    cap: 'leyes', icono: 'periodico', tab: 'parlamento', tarea: 'Propón una ley',
    titulo: () => 'Propón una ley',
    texto: () => 'Más abajo están las leyes: cada una dice a quién gusta y qué cambia. Las que encajan con las ideas de tu partido salen mejor. Pulsa <b>Proponer</b> en la que quieras.',
    foco: enTab('parlamento', '.tarjeta [data-a="proponer"][data-derogar="0"]:not(:disabled)'),
    alEntrar: (s, t) => { t.propBase = s.cuenta.propuestas; s.cp = Math.max(s.cp, 4); },
    hecho: (s, t) => !!s.propuesta || s.cuenta.propuestas > t.propBase,
  },
  votar: {
    cap: 'leyes', icono: 'urna', tarea: 'Lleva la ley a votación',
    titulo: () => 'Negocia y vota',
    texto: () => 'Arriba ves qué votaría cada partido. Necesitas más votos a favor que en contra: si no te salen las cuentas, <b>negocia</b> con algún partido. Cuando quieras, pulsa <b>Llevar a votación</b> y mira el recuento.',
    foco: () => (ui.tab !== 'parlamento' ? TAB('parlamento') : $('[data-a="votar"]') ? '[data-a="votar"]' : '.tarjeta [data-a="proponer"][data-derogar="0"]:not(:disabled)'),
    alEntrar: (s, t) => { if (t.propBase === undefined) t.propBase = s.cuenta.propuestas; },
    hecho: (s, t) => s.cuenta.propuestas > t.propBase && !s.resultadoVoto,
  },
  pactar: {
    cap: 'leyes', icono: 'maletin', tab: 'parlamento', visual: V.escanos, tarea: 'Cierra un pacto con otro partido',
    si: s => usaPactos(s) && s.modo === 'gobierno',
    titulo: () => 'Pactos de gobierno',
    texto: () => `Sin ${MAYORIA} escaños propios necesitas <b>socios</b>. Solo pactan contigo los partidos de ideas cercanas y que no tengan más escaños que tú. Cada socio pide <b>una ley</b> a cambio: si no la apruebas en ${MESES_PACTO} meses, se va. Pulsa <b>Pactar</b> con uno.`,
    foco: () => (ui.tab !== 'parlamento' ? TAB('parlamento') : $('.tarjeta.pactos [data-a="pactar"]:not(:disabled)') ? '.tarjeta.pactos [data-a="pactar"]:not(:disabled)' : '.tarjeta.pactos'),
    alEntrar: (s, t) => { t.sociosBase = sociosDe(s).length; s.cp = Math.max(s.cp, 3); },
    // Si nadie quiere pactar, no hay tarea que hacer: se sigue adelante.
    hecho: (s, t) => sociosDe(s).length > t.sociosBase || !partidosIA(s).some(p => puedePactar(s, p).ok),
  },
  minoria: {
    cap: 'leyes', icono: 'balanza', tab: 'parlamento', visual: V.escanos,
    si: s => usaPactos(s) && s.modo === 'gobierno',
    titulo: () => 'Mayoría o minoría',
    texto: () => `Tus socios votan tus leyes casi siempre. Si entre todos sumáis ${MAYORIA} escaños tienes <b>mayoría absoluta</b>. Con menos gobiernas <b>en minoría</b>: pierdes estabilidad y, si los partidos que se llevan mal contigo suman ${MAYORIA} y tu popularidad baja de 50, te presentan una <b>moción de censura</b>.`,
    foco: enTab('parlamento', '.tarjeta.pactos'),
  },
  ministro: {
    cap: 'gobierno', icono: 'maletin', tab: 'gobierno', tarea: 'Nombra a un ministro',
    titulo: () => 'Forma tu gabinete',
    texto: () => 'Te he llevado a <b>Gobierno</b>. Elige una cartera y nombra a un ministro: cada uno te da una ventaja todos los meses. Si es de otro partido, ese partido te apoyará más.',
    foco: () => (ui.tab !== 'gobierno' ? TAB('gobierno') : $('[data-a="nombrar"]:not(:disabled)') ? '[data-a="nombrar"]:not(:disabled)' : '[data-a="abrirCartera"]'),
    alEntrar: s => { s.cp = Math.max(s.cp, 1); },
    hecho: s => numMinistros(s) > 0,
  },
  estado: {
    cap: 'gobierno', icono: 'corona', tab: 'gobierno', visual: V.estado,
    titulo: () => 'Monarquía o república',
    texto: s => `${formaEstado(s) === 'monarquia' ? 'Tu país es una <b>monarquía</b>.' : 'Tu país es una <b>república</b>.'} Cada forma del Estado gusta a unos grupos y molesta a otros, y tu partido tiene su postura. Gobernando puedes convocar un <b>referéndum</b>, uno por legislatura: gane quien gane, el resultado se aplica.`,
    foco: enTab('gobierno', '.referendum'),
  },
  sociedad: {
    cap: 'gente', icono: 'gente', tab: 'sociedad', visual: V.grupos,
    titulo: () => `Cuatro grupos, ${ESCANOS} escaños`,
    texto: () => 'Te he llevado a <b>Sociedad</b>. Obreros, empresarios, campesinos y jóvenes: su apoyo decide cuántos escaños sacas en las elecciones. Aquí ves qué le gusta y qué le molesta a cada uno.',
    foco: '#contenido',
  },
  mitin: {
    cap: 'gente', icono: 'megafono', tab: 'sociedad', tarea: 'Da un mitin',
    titulo: () => 'Gánate a un grupo',
    texto: () => 'Un <b>mitin</b> sube al momento el apoyo de un grupo. Cuesta 1 de capital político y algo de dinero, y solo puedes dar uno al mes. Elige a quién quieres convencer.',
    foco: enTab('sociedad', '[data-a="mitin"]:not(:disabled)'),
    alEntrar: s => { s.cp = Math.max(s.cp, 1); s.ultimoMitin = -1; },
    hecho: s => s.ultimoMitin === s.mes || !puedeMitin(s).ok,
  },
  diplomacia: {
    cap: 'mundo', icono: 'globo', tab: 'diplomacia', visual: V.mundo,
    titulo: () => 'El resto del mundo',
    texto: () => 'Te he llevado a <b>Diplomacia</b>. Los demás países también tienen política: celebran elecciones, cambian de gobierno, sufren golpes y sus dictaduras pueden caer. Quién manda cambia cómo te miran y lo que rinde el comercio. Con buena relación firmas <b>tratados</b> (dan dinero) y <b>alianzas</b>.',
    foco: '#contenido',
  },
  defensa: {
    cap: 'mundo', icono: 'espadas', tab: 'defensa',
    titulo: () => 'Guerra y paz',
    texto: () => 'Te he llevado a <b>Defensa</b>. Cada regimiento cuesta dinero al mes. Con ellos te defiendes y, si declaras una guerra, atacas provincias enemigas: lo que ocupes puedes quedártelo al firmar la paz. Si conquistas todos los países, ganas la partida; si ocupan todo el tuyo, la pierdes.',
    foco: '#contenido',
  },
  mes: {
    cap: 'fin', icono: 'calendario', tarea: 'Pasa de mes',
    titulo: () => 'Pasa de mes',
    texto: () => 'Cuando acabes lo que quieras hacer, pulsa <b>Siguiente mes</b> (o la barra espaciadora): cobras impuestos, avanzan las obras, recuperas capital político y pasan cosas.',
    foco: '#btn-mes',
    alEntrar: (s, t) => { t.mesBase = s.mes; },
    hecho: (s, t) => s.mes > t.mesBase,
  },
  objetivos: {
    cap: 'fin', icono: 'diana',
    titulo: () => 'Objetivos y prensa',
    texto: () => 'Bajo el mapa tienes <b>objetivos</b> que dan premios, los consejos de tu asesora y el periódico con lo que pasa en el país y en el mundo.',
    foco: '#objetivos',
  },
  cloacas: {
    cap: 'fin', icono: 'candado', tab: 'economia',
    titulo: () => 'Un atajo peligroso',
    texto: () => 'Al final de Economía están <b>las cloacas</b>: comisiones, sobornos y enchufes que dan ventaja al momento. Cada trampa sube la sospecha y, si la prensa te pilla, se acaba la partida. Tú verás.',
  },
};

const PASOS_SIMPLE = [
  {
    cap: 'inicio', icono: 'birrete', visual: V.bienvenida,
    titulo: s => `Bienvenido a ${s.config.pais}`,
    texto: () => 'Acabas de llegar al gobierno. Cada turno es un mes. Te voy a llevar de la mano por cada pestaña: yo te explico y tú lo pruebas. Verás construir, aprobar leyes, pactar, formar gobierno y ganarte a los votantes.',
    boton: 'Empezar',
  },
  G.cifras, G.cp, G.provincia, G.construir, G.economia, G.parlamento, G.proponer, G.votar, G.pactar, G.minoria, G.ministro, G.estado,
  G.sociedad, G.mitin, G.diplomacia, G.mes, G.objetivos,
  {
    cap: 'fin', icono: 'estrella',
    titulo: () => 'Ya sabes gobernar',
    texto: s => `Habrá elecciones cada ${s.config.legislatura} meses. Si nadie llega a ${MAYORIA} escaños habrá <b>investidura</b>: gobierna el bloque que más sume. Si pierdes no se acaba la partida: pasas a la oposición y tu partido te marca una directiva. Para aprender la carrera de diputado, prueba el <b>tutorial completo</b>. Suerte.`,
    fin: true,
  },
];

// ---------- Tutorial completo: crear la partida, la carrera y el gobierno ----------

const SIG_PASO = '.botones-paso .btn.laton';
const PASOS_COMPLETO = [
  // Crear la partida
  {
    cap: 'crear', icono: 'birrete', visual: () => V.camino(null),
    titulo: () => 'Tutorial completo',
    texto: () => 'Vamos a recorrerlo todo: crear tu personaje y tu partido, empezar como diputado, hacerte con el partido, ganar unas elecciones y gobernar. Para que no se alargue, aquí el congreso y las elecciones llegan en pocos meses.',
    boton: 'Empezar',
  },
  {
    cap: 'crear', icono: 'flechaArriba', visual: V.modos,
    titulo: () => 'Tres formas de empezar',
    texto: () => 'En <b>Carrera política</b> empiezas de diputado raso. En <b>Gobierno directo</b> empiezas ya mandando. En <b>Partido provincial</b> fundas un partido en una sola provincia y creces abriendo sedes. En este tutorial haremos la carrera entera.',
    foco: '.dificultades:has([data-k="modo"])',
    alEntrar: () => { ui.cfg.modo = 'carrera'; },
  },
  {
    cap: 'crear', icono: 'usuario',
    titulo: () => 'Tu nombre',
    texto: () => 'Escribe cómo te llamas: saldrá en las noticias y en las papeletas. La <b>dificultad</b> cambia el dinero, la paciencia de los votantes y lo fuerte que es tu rival; aquí jugaremos en fácil.',
    foco: '#cfg-lider',
  },
  {
    cap: 'crear', icono: 'urna', tarea: 'Pulsa el botón dorado',
    titulo: () => 'Las elecciones',
    texto: () => 'Aquí eliges cada cuántos meses se vota. Legislaturas cortas dan partidas más rápidas y tensas. Cuando lo tengas, pulsa el botón dorado para pasar a <b>tu partido</b>.',
    foco: () => (ui.paso === 1 ? SIG_PASO : ''),
    hecho: () => ui.paso >= 2,
  },
  {
    cap: 'crear', icono: 'bandera',
    titulo: () => 'Crear un partido o unirte a uno',
    texto: () => 'Si <b>creas el tuyo</b> eliges nombre, insignia e ideas. Si <b>te unes</b> a uno que ya existe, heredas sus votantes y sus ideas tal cual. Elige lo que prefieras.',
    foco: '.dificultades:has([data-k="propio"])',
  },
  {
    cap: 'crear', icono: 'escudo',
    titulo: () => 'Diseña tu insignia',
    texto: () => (ui.cfg.propio
      ? 'Ponle nombre a tu partido y diseña su <b>insignia</b>: forma, fondo de dos colores, un símbolo entre decenas o tus propias letras. Arriba ves cómo queda: así saldrá en el hemiciclo y en el mapa electoral.'
      : 'Has elegido unirte a un partido: llevarás su nombre, su color y su emblema. Cada uno indica qué leyes le gustan.'),
    foco: () => (ui.cfg.propio ? '.vista-partido' : '.lista-partidos'),
  },
  {
    cap: 'crear', icono: 'bombilla',
    titulo: () => 'La ideología',
    texto: () => (ui.cfg.propio
      ? 'Elige la <b>doctrina</b> de tu partido, cuánto Estado defiende y, si quieres, hasta dos causas. De ahí sale entre qué grupos tienes más tirón y qué leyes le gustan a tu partido (lo resume el cuadro del final): las que van contra sus ideas te costarán más.'
      : 'La ideología de tu partido ya viene dada: las leyes que encajan con sus ideas te salen más fáciles, y las que las contradicen cuestan más.'),
    foco: () => (ui.cfg.propio ? '.doctrinas' : '.lista-partidos'),
  },
  {
    cap: 'crear', icono: 'corona',
    titulo: () => 'Costumbres y corona',
    texto: () => (ui.cfg.propio
      ? 'Un poco más abajo eliges cómo de <b>progresista o conservador</b> es tu partido y si defiende la <b>monarquía</b> o la <b>república</b>. Importa mucho: los partidos solo pactan con quien piensa parecido.'
      : 'El partido al que te unes ya tiene su postura sobre las costumbres y sobre la corona. Importa mucho: los partidos solo pactan con quien piensa parecido.'),
    foco: () => (ui.cfg.propio ? '.segmento:has([data-k="social"])' : '.lista-partidos'),
  },
  {
    cap: 'crear', icono: 'mapa', tarea: 'Pulsa el botón dorado',
    titulo: () => 'A por el país',
    texto: () => 'Pulsa el botón dorado para pasar a <b>tu país</b>.',
    foco: () => (ui.paso === 2 ? SIG_PASO : ''),
    hecho: () => ui.paso >= 3,
  },
  {
    cap: 'crear', icono: 'globo',
    titulo: () => 'Tu país y el mundo',
    texto: () => 'Ponle nombre y color a tu país y elige si es una <b>monarquía</b> o una <b>república</b>. El <b>tamaño del mundo</b> marca cuántos países hay, y cada <b>número de mapa</b> genera uno distinto (a la derecha lo ves). Con más <b>partidos</b> en el parlamento, el voto se reparte más y hay que pactar más.',
    foco: '#cfg-pais',
  },
  {
    cap: 'crear', icono: 'play', tarea: 'Empieza la carrera',
    titulo: () => 'Todo listo',
    texto: () => 'Pulsa <b>Empezar la carrera</b>.',
    foco: '[data-a="empezar"]',
    hecho: () => ui.pantalla === 'juego' && !!estado,
  },

  // La carrera: de diputado a líder
  {
    cap: 'carrera', icono: 'usuario', tab: 'carrera', visual: V.camino,
    titulo: s => `Diputado por ${s.config.partido}`,
    texto: s => `Acabas de recoger tu escaño. Gobierna ${PARTIDOS[s.gobiernoIA].nombre} y tu partido lo dirige ${LIDER_INICIAL}. Tu camino: hacerte un nombre, ganar el <b>congreso del partido</b> para dirigirlo y después ganar las <b>elecciones</b>.`,
    foco: enTab('carrera', '#pantalla-juego .pasos'),
  },
  {
    cap: 'carrera', icono: 'grafica', visual: V.cifras,
    titulo: () => 'Las cifras de un diputado',
    texto: () => 'El <b>prestigio</b> es tu fama. El <b>apoyo en el partido</b> es lo que te quieren los tuyos. Los <b>fondos</b> pagan cenas, mítines y campañas. Y el <b>capital político</b> se gasta en casi todo y vuelve cada mes.',
    foco: '#stats',
  },
  { ...G.cp, cap: 'carrera' },
  {
    cap: 'carrera', icono: 'megafono', tab: 'carrera', tarea: 'Haz una acción de diputado',
    titulo: () => 'Haz algo este mes',
    texto: () => 'Cada acción se puede hacer una vez al mes. <b>Intervenir en el pleno</b> y la <b>televisión</b> dan prestigio; <b>reunirte con militantes</b> y <b>cenar con los barones</b>, apoyo en el partido; <b>recaudar</b> da fondos. Haz la que quieras.',
    foco: enTab('carrera', '[data-a="accionCarrera"]:not(:disabled)'),
    hecho: s => Object.keys(s.carrera.hechas).length > 0,
  },
  {
    cap: 'carrera', icono: 'bandera', tab: 'partido',
    titulo: () => 'El congreso',
    texto: s => `Te he llevado a <b>Partido</b>. Dentro de ${meses(Math.max(0, s.carrera.congresoMes - s.mes))} los delegados eligen líder. Gana quien llegue con más apoyo: el tuyo es tu <b>apoyo en el partido</b> más una quinta parte de tu <b>prestigio</b>. Las barras comparan lo tuyo con lo de ${LIDER_INICIAL}.`,
    foco: '#contenido',
  },
  {
    cap: 'carrera', icono: 'periodico', tab: 'parlamento', tarea: 'Propón una ley',
    titulo: () => 'Leyes desde la oposición',
    texto: () => 'Te he llevado al <b>Parlamento</b>: también puedes legislar sin gobernar. Pulsa <b>Proponer</b> en una ley: si encaja con las ideas de tu partido, mejor.',
    foco: enTab('parlamento', '.tarjeta [data-a="proponer"][data-derogar="0"]:not(:disabled)'),
    alEntrar: (s, t) => { t.propBase = s.cuenta.propuestas; s.cp = Math.max(s.cp, 5); },
    hecho: (s, t) => !!s.propuesta || s.cuenta.propuestas > t.propBase,
  },
  {
    ...G.votar, cap: 'carrera',
    titulo: () => 'Llévala al pleno',
    texto: s => `Mira qué votaría cada partido y <b>negocia</b> si te falta alguno. Ojo: con menos de ${APOYO_PARA_RESPALDO} de apoyo en el partido, tu propio grupo se abstiene. Si la ley sale, ganas prestigio, apoyo en el partido e imagen entre quienes se benefician. Pulsa <b>Llevar a votación</b>.`,
  },
  {
    cap: 'carrera', icono: 'gente', tab: 'sociedad', visual: V.grupos,
    titulo: () => 'Quién te vota',
    texto: () => 'Te he llevado a <b>Votantes</b>. Aquí ves cuánto apoya cada grupo a tu partido y por qué. La marca vertical es hacia donde se mueve ese apoyo. Un <b>mitin</b> lo sube al momento, y en la pestaña <b>Mapa</b> ves quién ganaría en cada provincia.',
    foco: '#contenido',
  },
  {
    cap: 'carrera', icono: 'calendario', tarea: 'Pasa de mes',
    titulo: () => 'Pasa de mes',
    texto: () => 'Pulsa <b>Siguiente mes</b>. Cada pocos meses el gobierno llevará una ley al pleno y tendrás que decidir qué dices: callar, criticarla o defenderla. También habrá imprevistos con varias salidas.',
    foco: '#btn-mes',
    alEntrar: (s, t) => { t.mesBase = s.mes; },
    hecho: (s, t) => s.mes > t.mesBase,
  },
  {
    cap: 'carrera', icono: 'bandera', tab: 'carrera', visual: V.camino, tarea: 'Gana el congreso del partido',
    titulo: () => 'Hasta el congreso',
    texto: s => (esLider(s) ? 'Ya diriges el partido.'
      : `Sigue así: cada mes haz acciones que suban tu apoyo y tu prestigio y pasa de mes. El congreso es en ${meses(Math.max(0, s.carrera.congresoMes - s.mes))}: ahora tienes ${apoyoCongreso(s)} y ${LIDER_INICIAL}, ${s.carrera.apoyoLider}. Si lo pierdes, habrá otro más adelante.`),
    foco: () => (apoyoCongreso(estado) > estado.carrera.apoyoLider ? '#btn-mes' : enTab('carrera', '[data-a="accionCarrera"]:not(:disabled)')()),
    hecho: s => esLider(s) && !s.congreso,
  },

  // Líder del partido: programa, campaña, elecciones e investidura
  {
    cap: 'campana', icono: 'bandera', tab: 'carrera', visual: V.camino,
    titulo: () => 'Ya diriges el partido',
    texto: s => `Ahora eres la cara de ${s.config.partido} y su candidato. Las elecciones son en ${meses(Math.max(0, s.proximaEleccion - s.mes))}. Con ${MAYORIA} escaños gobiernas sin más; si nadie llega, habrá <b>investidura</b> y gobernará el bloque de partidos que más sume. Como líder decides el voto de todo tu grupo y tienes acciones nuevas, como la <b>campaña en medios</b>.`,
    foco: enTab('carrera', '#pantalla-juego .pasos'),
    alEntrar: s => vientoAFavorTutorial(s),
  },
  {
    cap: 'campana', icono: 'periodico', tab: 'partido', tarea: 'Promete una ley',
    titulo: () => 'Tu programa electoral',
    texto: () => 'Te he llevado a <b>Partido</b>. Promete una ley: cada promesa atrae ya a los grupos a los que beneficia; si ganas, tendrás 12 meses para cumplirla o esos grupos se enfadarán.',
    foco: enTab('partido', '[data-a="prometer"]:not(:disabled)'),
    hecho: s => s.carrera.promesas.length > 0,
  },
  {
    cap: 'campana', icono: 'urna', tab: 'carrera', tarea: 'Gana las elecciones y forma gobierno',
    // La noche electoral se ve sin la tarjeta delante; la investidura, con ella al lado.
    modal: s => enInvestiduraTutorial(s),
    titulo: s => (enInvestiduraTutorial(s) ? 'La investidura' : 'Campaña'),
    texto: s => (enInvestiduraTutorial(s)
      ? `Nadie tiene los ${MAYORIA} escaños. Las barras comparan tu bloque con el del rival: pulsa <b>Pactar</b> con los partidos dispuestos hasta que el veredicto de abajo diga que gobiernas, y después <b>Presentarse a la investidura</b>. Cada socio te pedirá una ley.`
      : `Quedan ${meses(Math.max(0, s.proximaEleccion - s.mes))}. Aquí verás las encuestas: da mítines, haz campaña y cuida la unidad del partido (si baja de 25, te quitan el liderazgo). Pasa los meses hasta la noche electoral. Si no ganas a la primera, habrá otras elecciones enseguida.`),
    foco: s => {
      if (enInvestiduraTutorial(s)) return !pronosticoInvestidura(s).gobiernas && $('#modal [data-a="pactar"]:not(:disabled)') ? '#modal [data-a="pactar"]:not(:disabled)' : '#modal [data-a="investir"]';
      return ui.tab === 'carrera' ? '#btn-mes' : TAB('carrera');
    },
    // Si las elecciones se tuercen, en el tutorial se repiten pronto y con más viento a favor.
    cadaVez: s => { if (s.modo === 'carrera' && !s.elecciones && !s.investidura && s.proximaEleccion - s.mes > 6) vientoAFavorTutorial(s); },
    hecho: s => s.modo === 'gobierno' && !s.elecciones && !s.investidura,
  },

  // El gobierno, a fondo
  {
    cap: 'inicio', icono: 'corona', visual: V.camino,
    titulo: s => `Presidente de ${s.config.pais}`,
    texto: () => 'Has ganado: ahora gobiernas. Heredas las leyes que ya estaban en vigor, tus promesas y lo que debas a tus socios. Cambian las pestañas: provincias, economía, gobierno, diplomacia y defensa. Te llevo por todas.',
    boton: 'Vamos',
  },
  G.cifras, G.provincia, G.construir, G.economia, G.parlamento,
  {
    ...G.proponer,
    texto: () => 'Legislar gobernando es igual que antes, pero ahora las leyes tienen efecto en tu economía y en tus votantes. Si prometiste alguna en campaña o se la debes a un socio, verás el plazo arriba. Pulsa <b>Proponer</b> en una.',
  },
  G.votar, G.pactar, G.minoria, G.ministro, G.estado, G.sociedad, G.mitin, G.diplomacia, G.defensa, G.mes, G.objetivos, G.cloacas,
  {
    cap: 'fin', icono: 'estrella',
    titulo: () => 'Tutorial completado',
    texto: s => `Ya lo has visto todo. Habrá elecciones cada ${s.config.legislatura} meses: si las pierdes, o si cae tu gobierno, vuelves a la oposición con una directiva de tu partido, y si no la cumples te expulsa. En multijugador es lo mismo, con amigos en otros países o en la oposición del tuyo. Suerte.`,
    fin: true,
  },
];

const enInvestiduraTutorial = s => !!s && !!s.investidura && !s.elecciones;
const pasosTutorial = () => (tutorialCompleto() ? PASOS_COMPLETO : PASOS_SIMPLE);

// ---------- Arranque ----------

function iniciarTutorial() {
  const c = ui.cfg;
  estado = nuevaPartida({
    ...c, principios: [...c.principios], lider: c.lider.trim() || CONFIG_BASE.lider, partido: c.partido.trim() || CONFIG_BASE.partido,
    pais: c.pais.trim() || CONFIG_BASE.pais, modo: 'gobierno', dificultad: 'facil', tamano: 'pequeno', nPartidos: 4, legislatura: 24, semilla: 7,
  });
  prepararPactosTutorial(estado);
  entrarJuego();
  ui.tutorial = { tipo: 'simple', paso: 0, nuevo: true, foco: '' };
}

// En la práctica empiezas sin socios y con el partido más cercano dispuesto a pactar, para probarlo tú.
function prepararPactosTutorial(s) {
  if (!usaPactos(s)) return;
  s.pactos = {};
  // Para que haga falta pactar, tu partido se queda sin mayoría absoluta: lo que le sobra se reparte.
  const ia = partidosIA(s), tope = 150, sobra = (s.escanos[ID_JUGADOR] || 0) - tope;
  if (sobra > 0 && ia.length) {
    s.escanos[ID_JUGADOR] = tope;
    ia.forEach((p, i) => { s.escanos[p] = Math.min(tope - 1, s.escanos[p] + Math.floor(sobra / ia.length) + (i < sobra % ia.length ? 1 : 0)); });
    // Si algún partido ha tocado techo, lo que falte vuelve al tuyo: los escaños siempre suman lo mismo.
    s.escanos[ID_JUGADOR] += ESCANOS - Object.values(s.escanos).reduce((a, v) => a + v, 0);
  }
  const cerca = partidosIA(s).filter(p => s.escanos[p] <= s.escanos[ID_JUGADOR]).sort((a, b) => distanciaIdeologica(s, ID_JUGADOR, a) - distanciaIdeologica(s, ID_JUGADOR, b))[0];
  if (cerca && cerca in s.relPartidos) s.relPartidos[cerca] = Math.max(s.relPartidos[cerca], 60);
  s.minoria = escanosBloque(s) < MAYORIA;
  s.censuraMes = null;
}

// En el tutorial las elecciones llegan pronto y con viento a favor, y los demás partidos te miran bien.
function vientoAFavorTutorial(s) {
  s.proximaEleccion = s.mes + 4;
  s.carrera.fuerzaGobierno = 1.1;
  for (const g in GRUPOS) cambiarImagen(s, g, 8);
  for (const pid in s.relPartidos) s.relPartidos[pid] = Math.max(s.relPartidos[pid], 35);
  s.cp = CP_MAXIMO;
}

// El completo empieza en la pantalla de crear partida.
function iniciarTutorialCompleto() {
  estado = null;
  Object.assign(ui, { pantalla: 'menu', menu: 'nueva', paso: 1, menuAnim: true, ventana: null });
  ui.cfg.modo = 'carrera';
  ui.tutorial = { tipo: 'completo', paso: 0, nuevo: true, foco: '' };
  scrollTo(0, 0);
}

// La partida del tutorial completo: carrera en fácil, con el congreso a la vuelta de la esquina.
function configTutorialCompleto(c) { return { ...c, modo: 'carrera', dificultad: 'facil' }; }
function prepararPartidaTutorial(s) {
  const c = s.carrera;
  Object.assign(c, { congresoMes: 4, interno: 40, apoyoLider: 46, fondos: 90 });
  s.cp = CP_MAXIMO;
}

const pestanaExiste = t => ui.pantalla === 'juego' && !!estado && !!tabsActuales()[t];

function irAPasoTutorial(n) {
  const t = ui.tutorial, pasos = pasosTutorial();
  // Los pasos que no vienen al caso en esta partida se saltan (los pactos, si no los hay).
  while (n < pasos.length - 1 && pasos[n].si && estado && !pasos[n].si(estado)) n++;
  t.paso = Math.max(0, Math.min(n, pasos.length - 1));
  t.nuevo = true;
  const p = pasos[t.paso];
  // Te lleva a la pestaña de la que habla el paso.
  if (p.tab && pestanaExiste(p.tab) && ui.tab !== p.tab) { ui.tab = p.tab; ui.animTab = true; }
  if (p.alEntrar) p.alEntrar(estado, t);
  if (p.fin) marcarTutorialVisto();
}

// El paso anterior al que se puede volver: uno de solo leer (las tareas ya hechas no se repiten).
function pasoAnteriorTutorial() {
  const t = ui.tutorial, pasos = pasosTutorial(), ant = pasos[t.paso - 1];
  if (!ant || ant.hecho || (ant.si && estado && !ant.si(estado))) return -1;
  // No se vuelve de la partida a la pantalla de crearla.
  if (ant.cap === 'crear' && ui.pantalla === 'juego') return -1;
  return t.paso - 1;
}

// Dentro de un panel o de una ventana con barra propia, lo que queda fuera de su marco no se ve.
function recortado(el, r = el.getBoundingClientRect()) {
  const caja = el.closest('#contenido, .ventana'), c = caja && caja !== el ? caja.getBoundingClientRect() : null;
  return !!c && (r.top < c.top - 1 || r.bottom > c.bottom + 1);
}

// Dónde empieza la barra inferior de pantallas estrechas (si no la hay, el final de la pantalla).
function bordeInferior() {
  const d = $('#dock-info');
  return d && getComputedStyle(d).position === 'fixed' ? d.getBoundingClientRect().top : innerHeight;
}

// ¿Se ve entero el elemento, sin que lo tapen la cabecera fija ni la tarjeta del tutorial?
function visibleEnPantalla(el) {
  const r = el.getBoundingClientRect(), cab = ui.pantalla === 'juego' ? $('.cabecera').getBoundingClientRect().bottom : 0;
  if (recortado(el, r)) return false;
  // Las pestañas viven dentro de la propia barra inferior: ahí siempre se ven.
  if (el.closest('#tabs') && getComputedStyle($('#tabs')).position === 'fixed') return true;
  return r.top >= Math.max(0, cab) && r.bottom <= bordeInferior() - 8;
}

function htmlElegirTutorial() {
  return `<h2>${ico('birrete')} Tutorial</h2>
    <p>Elige cuánto quieres aprender. Ninguno toca tu partida guardada.</p>
    <button class="opcion" data-a="tutSimple"><b>Simple · unos 7 minutos</b>
      <span class="nota">Empiezas ya en el gobierno y te llevo pestaña por pestaña: el capital político, construir, aprobar una ley, pactar, nombrar un ministro y dar un mitin.</span></button>
    <button class="opcion" data-a="tutCompleto"><b>Completo · unos 20 minutos</b>
      <span class="nota">Desde cero: creas tu personaje y tu partido, empiezas de diputado, te ganas el partido, haces campaña, negocias la investidura y gobiernas, con todo explicado a fondo.</span></button>
    <button class="btn" data-a="cerrar">Ahora no</button>`;
}

// La barra de progreso: un tramo por capítulo, tan largo como pasos tenga.
function htmlTramosTutorial(pasos, actual) {
  const tramos = [];
  pasos.forEach((p, i) => {
    const u = tramos[tramos.length - 1];
    if (u && u.cap === p.cap) u.n++; else tramos.push({ cap: p.cap, ini: i, n: 1 });
  });
  return `<div class="tut-tramos">${tramos.map(tr => {
    const pct = Math.round(Math.max(0, Math.min(1, (actual + 1 - tr.ini) / tr.n)) * 100);
    return `<span style="flex:${tr.n}" title="${CAPITULOS[tr.cap][0]}"><i style="width:${pct}%"></i></span>`;
  }).join('')}</div>`;
}

function renderTutorial() {
  const caja = $('#tutorial');
  // Quien vuelve al menú principal a mitad del tutorial lo deja.
  if (ui.tutorial && ui.pantalla === 'menu' && !(tutorialCompleto() && creandoPartida())) ui.tutorial = null;
  const activo = enTutorial();
  document.body.classList.toggle('con-tutorial', activo);
  caja.hidden = !activo;
  if (!activo) { document.body.classList.toggle('tut-modal', false); $$('.tut-foco').forEach(e => e.classList.remove('tut-foco')); colocarDedoTutorial(); return; }
  caja.classList.toggle('en-menu', ui.pantalla === 'menu');
  const t = ui.tutorial, s = estado, pasos = pasosTutorial();
  // Lo que ya está hecho se da por visto: quien se adelanta no tiene que repetirlo.
  let avanzo = false;
  for (let guardia = 0; guardia < pasos.length; guardia++) {
    const paso = pasos[t.paso];
    if (paso.cadaVez && s) paso.cadaVez(s, t);
    if (!paso.hecho || !paso.hecho(s, t)) break;
    irAPasoTutorial(t.paso + 1);
    avanzo = true;
  }
  if (avanzo) Sonido.tocar('logro');
  const p = pasos[t.paso], n = pasos.length, cap = CAPITULOS[p.cap] || CAPITULOS.inicio;
  const enModal = !$('#modal').hidden, sobreModal = enModal && !!p.modal && !!p.modal(s);
  caja.classList.toggle('sobre-modal', sobreModal);
  document.body.classList.toggle('tut-modal', sobreModal);
  const fuera = !enModal && p.tab && pestanaExiste(p.tab) && ui.tab !== p.tab;
  const atras = pasoAnteriorTutorial() >= 0 ? `<button class="enlace" data-a="tutAtras">${ico('atras')} Atrás</button>` : '';
  const pie = p.fin
    ? `<button class="btn laton mini" data-a="tutSeguir">Seguir con esta partida</button><button class="btn claro mini" data-a="tutSalir">Volver al menú</button>`
    : p.hecho ? `${fuera ? `<button class="btn laton mini" data-a="tutIr">${ico('flecha')} Llévame allí</button>` : `<span class="tut-espera">${ico('flecha')} Hazlo para continuar</span>`}
        <button class="enlace" data-a="tutSaltar">Saltar este paso</button>`
      : `${atras}<button class="btn laton mini" data-a="tutSiguiente">${p.boton || 'Siguiente'} ${ico('flecha')}</button>`;
  const visual = p.visual ? p.visual(s) : '';
  const cambio = ponerHTML(caja, `<div class="tut-cab"><span class="tut-cap">${ico(cap[1])} ${cap[0]}</span>
      <span class="tut-n">${t.paso + 1} / ${n}</span>${p.fin ? '' : '<button class="enlace" data-a="tutSalir">Salir</button>'}</div>
    ${htmlTramosTutorial(pasos, t.paso)}
    <div class="tut-cuerpo"><div class="tut-tit"><span class="tut-medalla">${ico(p.icono || cap[1])}</span><h3>${esc(p.titulo(s))}</h3></div>
      <p>${p.texto(s)}</p>${visual}
      ${p.hecho && p.tarea ? `<div class="tut-tarea"><i></i><span>${p.tarea}</span></div>` : ''}</div>
    <div class="tut-pie">${pie}</div>`);
  if (cambio && t.nuevo) {
    const cuerpo = $('.tut-cuerpo', caja);
    cuerpo.classList.add('entra');
    if (avanzo) caja.classList.add('logro'), setTimeout(() => caja.classList.remove('logro'), 700);
  }
  document.documentElement.style.setProperty('--alto-tut', caja.offsetHeight + 'px');

  // Señala dónde hay que pulsar y, si no se ve, lleva la pantalla hasta allí.
  const sel = typeof p.foco === 'function' ? p.foco(s) : p.foco || '', el = sel ? $(sel) : null;
  $$('.tut-foco').forEach(e => { if (e !== el) e.classList.remove('tut-foco'); });
  // Con una ventana abierta delante no se mueve la pantalla: se deja pendiente para cuando se cierre.
  if (t.nuevo || t.foco !== sel) t.irAlFoco = true;
  if (el) {
    el.classList.add('tut-foco');
    if (t.irAlFoco && (!enModal || sobreModal)) {
      t.irAlFoco = false;
      // Un panel más alto que lo que se ve se lleva por arriba: centrado, su título quedaría fuera de la pantalla.
      const util = bordeInferior() - ($('.cabecera').getBoundingClientRect().bottom > 0 ? $('.cabecera').getBoundingClientRect().bottom : 0);
      const alto = el.getBoundingClientRect().height;
      if (!visibleEnPantalla(el)) el.scrollIntoView({ behavior: animar() ? 'smooth' : 'auto', block: alto > util - 60 ? 'start' : 'center' });
    }
  }
  t.foco = sel;
  t.nuevo = false;
  t.dedo = !!p.hecho && (!enModal || sobreModal);
  colocarDedoTutorial();
  // Tras el desplazamiento y las animaciones, el puntero se recoloca.
  clearTimeout(renderTutorial.reloj);
  renderTutorial.reloj = setTimeout(colocarDedoTutorial, 420);
}

// ---------- El puntero ----------
// Una flecha que salta junto a lo que hay que pulsar. Solo en las tareas y solo si el objetivo es
// pequeño (un botón, una pestaña): señalar un panel entero no ayuda.

function colocarDedoTutorial() {
  let dedo = $('#tut-dedo');
  if (!dedo) {
    dedo = document.createElement('div');
    dedo.id = 'tut-dedo';
    dedo.setAttribute('aria-hidden', 'true');
    dedo.innerHTML = ico('flechaArriba');
    document.body.appendChild(dedo);
  }
  const el = ui.tutorial && ui.tutorial.dedo && enTutorial() ? $('.tut-foco') : null;
  const r = el ? el.getBoundingClientRect() : null;
  const cab = ui.pantalla === 'juego' && $('.cabecera') ? $('.cabecera').getBoundingClientRect().bottom : 0;
  const visible = r && r.width > 0 && r.width <= 460 && r.height <= 200 && r.bottom > 0 && r.top < bordeInferior() - 4 && !recortado(el, r)
    // Dentro de la cabecera fija todo vale; fuera, que no lo tape.
    && (r.top >= cab - 2 || r.bottom <= cab + 2);
  dedo.hidden = !visible;
  if (!visible) return;
  // Debajo del objetivo y apuntando hacia arriba; si no cabe, encima y apuntando hacia abajo.
  const tarjeta = $('#tutorial').getBoundingClientRect(), x = Math.min(innerWidth - 22, Math.max(22, r.left + r.width / 2));
  const tapaTarjeta = x > tarjeta.left - 20 && x < tarjeta.right + 20 && r.bottom + 46 > tarjeta.top;
  const abajo = r.bottom + 46 < innerHeight && !tapaTarjeta;
  dedo.classList.toggle('desde-arriba', !abajo);
  dedo.classList.toggle('sobre-modal', $('#tutorial').classList.contains('sobre-modal'));
  dedo.style.left = x + 'px';
  dedo.style.top = (abajo ? r.bottom + 4 : r.top - 40) + 'px';
}
addEventListener('scroll', () => requestAnimationFrame(colocarDedoTutorial), true);
addEventListener('resize', () => requestAnimationFrame(colocarDedoTutorial));

const accionesTutorial = {
  tutorial: () => { ui.ventana = 'tutorial'; },
  tutSimple: () => iniciarTutorial(),
  tutCompleto: () => iniciarTutorialCompleto(),
  tutSiguiente: () => irAPasoTutorial(ui.tutorial.paso + 1),
  tutSaltar: () => irAPasoTutorial(ui.tutorial.paso + 1),
  tutAtras: () => { const n = pasoAnteriorTutorial(); if (n >= 0) irAPasoTutorial(n); },
  // Vuelve a la pestaña del paso si el jugador se ha ido a otra.
  tutIr: () => { const p = pasosTutorial()[ui.tutorial.paso]; if (p.tab && pestanaExiste(p.tab)) { ui.tab = p.tab; ui.animTab = true; ui.tutorial.nuevo = true; } },
  tutSalir: () => { marcarTutorialVisto(); salirAlMenu(); },
  // La partida de práctica pasa a ser una partida normal y se guarda a partir de ahora.
  tutSeguir: () => { ui.tutorial = null; },
};
