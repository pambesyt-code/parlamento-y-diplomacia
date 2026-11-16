'use strict';
// Datos del juego: todo lo que se puede equilibrar o ampliar sin tocar las reglas.

const VERSION = '2.4';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ANIO_INICIAL = 2030;
const CP_MAXIMO = 10;
// El parlamento: cuántos escaños tiene y cuántos hacen falta para la mayoría absoluta.
const ESCANOS = 350;
const MAYORIA = Math.floor(ESCANOS / 2) + 1;

// Contexto de la partida activa. Lo fija prepararMundo() al empezar o cargar una partida:
// qué partido llevas, cuánto dura la legislatura, cómo se llama tu país y qué provincias hay.
let ID_JUGADOR = 'uc';
let MESES_LEGISLATURA = 24;
const PAIS_JUGADOR = { id: 'aldora', nombre: 'Aldora', colores: ['#dba94a', '#c99a41', '#e6c078'] };
let PROVINCIAS = [];
let PROV_POR_ID = {};

// admin: gasto fijo mensual. apoyoBase: apoyo de partida de cada grupo.
// desgaste: cada cuántos meses de legislatura pierdes 1 punto de apoyo.
// Para la carrera: apoyoOposicion es el apoyo de partida a tu partido, fuerzaGobierno la ventaja
// del partido que gobierna, apoyoLider lo que debes superar en el congreso e interno tu apoyo inicial.
const DIFICULTADES = {
  facil: { nombre: 'Fácil', desc: 'Arcas llenas y votantes pacientes. Para aprender.', dinero: 400, admin: 40, apoyoBase: 53, desgaste: 6, eventoProb: 0.35, apoyoOposicion: 42, fuerzaGobierno: 1.5, apoyoLider: 52, interno: 25 },
  normal: { nombre: 'Normal', desc: 'Gobernar desgasta: hay que ganarse cada voto.', dinero: 250, admin: 64, apoyoBase: 48, desgaste: 4, eventoProb: 0.45, apoyoOposicion: 38, fuerzaGobierno: 1.6, apoyoLider: 62, interno: 18 },
  dificil: { nombre: 'Difícil', desc: 'Poco dinero, muchas crisis y un electorado exigente.', dinero: 160, admin: 79, apoyoBase: 45, desgaste: 3, eventoProb: 0.55, apoyoOposicion: 34, fuerzaGobierno: 1.7, apoyoLider: 72, interno: 12 },
};

const MODOS_JUEGO = {
  carrera: { nombre: 'Carrera política', desc: 'Empiezas como diputado. Gana el partido, luego las elecciones y después gobierna.' },
  gobierno: { nombre: 'Gobierno directo', desc: 'Empiezas ya como jefe de gobierno, con las elecciones ganadas.' },
  provincial: { nombre: 'Partido provincial', desc: 'Fundas un partido en una sola provincia, sin un escaño. Abre sedes, crece y llega al gobierno.' },
};

const LEGISLATURAS = { 18: 'Corta: 18 meses', 24: 'Normal: 24 meses', 36: 'Larga: 36 meses' };

// Tamaños de mapa. propias: tus provincias. paises: cuántos países más hay (mínimo y máximo).
// islas: cuántos de ellos viven en islas. provPais: provincias de cada país del continente.
// provLibre: lo mismo en multijugador, donde cada jugador elige uno de esos países (son algo más grandes).
const TAMANOS = {
  pequeno: { nombre: 'Pequeño', desc: '7 provincias tuyas y 5 países', propias: 7, paises: [5, 5], islas: 1, provPais: [3, 4], provLibre: [5, 7] },
  mediano: { nombre: 'Mediano', desc: '9 provincias tuyas y 10 países', propias: 9, paises: [10, 10], islas: 2, provPais: [2, 4], provLibre: [4, 6] },
  grande: { nombre: 'Grande', desc: '11 provincias tuyas y de 15 a 20 países', propias: 11, paises: [15, 20], islas: 3, provPais: [2, 3], provLibre: [3, 5] },
};
const COLORES_PAIS = ['#dba94a', '#bfcf63', '#e79fb6', '#63c7b8', '#eda35a'];

// Los demás países se crean en cada partida con estas piezas: un nombre y su estilo (que da
// nombre a sus provincias), un carácter (gobierno, ejército, comercio) y un color.
const PLANTILLAS_PAIS = [
  { nombre: 'Norvia', estilo: 'nordico' }, { nombre: 'Skarnia', estilo: 'nordico' }, { nombre: 'Isfold', estilo: 'nordico' }, { nombre: 'Hvalmark', estilo: 'nordico' },
  { nombre: 'Kessel', estilo: 'germanico' }, { nombre: 'Brandmark', estilo: 'germanico' }, { nombre: 'Ostmark', estilo: 'germanico' }, { nombre: 'Hochland', estilo: 'germanico' },
  { nombre: 'Meridia', estilo: 'latino' }, { nombre: 'Solaria', estilo: 'latino' }, { nombre: 'Valtierra', estilo: 'latino' }, { nombre: 'Portana', estilo: 'latino' },
  { nombre: 'Lusitra', estilo: 'latino' }, { nombre: 'Montaria', estilo: 'latino' },
  { nombre: 'Dravia', estilo: 'eslavo' }, { nombre: 'Velinia', estilo: 'eslavo' }, { nombre: 'Krasnia', estilo: 'eslavo' }, { nombre: 'Bohrava', estilo: 'eslavo' },
  { nombre: 'Qadira', estilo: 'desierto' }, { nombre: 'Zafiria', estilo: 'desierto' }, { nombre: 'Sahrán', estilo: 'desierto' },
  { nombre: 'Tiveria', estilo: 'isleno' }, { nombre: 'Corallia', estilo: 'isleno' }, { nombre: 'Marinsula', estilo: 'isleno' }, { nombre: 'Islas Brumosas', estilo: 'isleno' },
];
const ESTILOS = {
  nordico: { pre: ['Nord', 'Kal', 'Fjel', 'Is', 'Skar', 'Hval', 'Grim', 'Vik', 'Tor', 'Ulf', 'Rav', 'Bjor', 'Frost', 'Sol'], suf: ['heim', 'vik', 'holm', 'dal', 'fjord', 'by', 'stad', 'vang', 'mark', 'sund'] },
  germanico: { pre: ['Eisen', 'Dorn', 'Rhein', 'Hoch', 'Stein', 'Wald', 'Brann', 'Oster', 'Linden', 'Adler', 'Schwarz', 'Gold'], suf: ['burg', 'wall', 'ach', 'au', 'feld', 'berg', 'hausen', 'dorf', 'stadt', 'heim'] },
  latino: { pre: ['Sol', 'Ver', 'Mar', 'Oliv', 'Cal', 'Alb', 'Lev', 'Pal', 'Font', 'Ser', 'Cast', 'Mont'], suf: ['ana', 'era', 'isma', 'ares', 'ante', 'ada', 'encia', 'illa', 'oria', 'ena'] },
  eslavo: { pre: ['Drav', 'Vel', 'Star', 'Brod', 'Kras', 'Bel', 'Zor', 'Vol', 'Mir', 'Slav', 'Tver', 'Gor'], suf: ['ograd', 'ika', 'ina', 'ovo', 'ava', 'ec', 'ica', 'nja', 'ov', 'ets'] },
  desierto: { pre: ['Qas', 'Zaf', 'Al', 'Sah', 'Dar', 'Ham', 'Kha', 'Tal', 'Jab', 'Nar'], suf: ['ira', 'ar', 'adir', 'ab', 'ún', 'ara', 'em', 'ila', 'ush', 'or'] },
  isleno: { pre: ['Puerto ', 'Isla ', 'Cala ', 'Cabo ', 'Playa ', 'Bahía '], suf: ['Brava', 'Serena', 'Dorada', 'Azul', 'Coral', 'Verde', 'Blanca', 'Honda', 'Larga', 'Mayor'] },
};
// fuerza: regimientos por provincia. comercio: lo que da un tratado, antes de ajustarlo a su tamaño.
const CARACTERES = [
  { gobierno: 'Monarquía', desc: 'Reino de nobles y comerciantes.', fuerza: 1.5, comercio: 30, relacion: 5 },
  { gobierno: 'República militar', desc: 'Sus generales mandan más que sus diputados.', fuerza: 2.3, comercio: 28, relacion: -15 },
  { gobierno: 'Federación', desc: 'Agrícola y pacífica.', fuerza: 1, comercio: 22, relacion: 15 },
  { gobierno: 'República mercantil', desc: 'Vive del comercio y de sus puertos.', fuerza: 1.2, comercio: 42, relacion: 5 },
  { gobierno: 'Principado', desc: 'Orgulloso y celoso de sus fronteras.', fuerza: 1.8, comercio: 24, relacion: -5 },
  { gobierno: 'Teocracia', desc: 'La gobierna su clero, que desconfía de los extranjeros.', fuerza: 1.6, comercio: 18, relacion: -10 },
  { gobierno: 'República', desc: 'Democracia joven y abierta al mundo.', fuerza: 1.2, comercio: 32, relacion: 12 },
  { gobierno: 'Imperio', desc: 'Sueña con recuperar su antigua grandeza.', fuerza: 2.1, comercio: 28, relacion: -20 },
];
// Cómo empieza cada tipo de país: si vota o no y qué forma de Estado tiene (ver js/regimenes.js).
const REGIMEN_INICIAL = {
  'Monarquía': { regimen: 'democracia', forma: 'monarquia' },
  'República militar': { regimen: 'dictadura', forma: 'republica' },
  'Federación': { regimen: 'democracia', forma: 'republica' },
  'República mercantil': { regimen: 'democracia', forma: 'republica' },
  'Principado': { regimen: 'democracia', forma: 'monarquia' },
  'Teocracia': { regimen: 'dictadura', forma: 'republica' },
  'República': { regimen: 'democracia', forma: 'republica' },
  'Imperio': { regimen: 'dictadura', forma: 'monarquia' },
};
// Las doctrinas que gobiernan en los demás países: las que ganan elecciones y las que mandan en una dictadura.
const DOCTRINAS_URNAS = ['socialdemocracia', 'liberalismo', 'conservadurismo', 'democristiana', 'socialismo', 'centrismo', 'progresismo', 'agrarismo',
  'ecologismo', 'laborismo', 'liberal_conservadurismo', 'socioliberalismo', 'nacionalpopulismo', 'populismo_izq', 'justicialismo'];
const DOCTRINAS_DICTADURA = ['leninismo', 'maoismo', 'fascismo', 'nacionalismo', 'tradicionalismo', 'integrismo', 'falangismo'];
const COLORES_MAPA = ['#7f9fc4', '#a88bbb', '#8cba97', '#b3a08c', '#dd9376', '#7fb3b0', '#c98fa8', '#9aa86b', '#b08463', '#8e9ec9', '#a3c08a',
  '#9c8fc4', '#c77d6b', '#6fa6a0', '#bf9c6f', '#a8a8a0', '#86a6d1', '#cf8f8f', '#94b8a0', '#b7a3c9', '#d4a088', '#8fa38a'];
const COLORES_BANDERA = ['#f1ece0', '#2a2622', '#b3261e', '#2f5d9a', '#e2b458', '#2c6e49', '#5b3a78', '#d9744f'];
// Se rellenan al generar cada mundo. NACIONES: todos los países, también los de los jugadores
// (humano: true). PAISES: los mismos vistos desde la nación activa, sin ella (ver verDesde).
const NACIONES = {};
const PAISES = {};
// Id del país de cada jugador: el primero es «aldora» y los siguientes «h1», «h2»...
const idHumano = h => (h === 0 ? 'aldora' : 'h' + h);

const GRUPOS = {
  obreros: { nombre: 'Obreros', peso: 0.35, icono: 'llave' },
  empresarios: { nombre: 'Empresarios', peso: 0.15, icono: 'maletin' },
  campesinos: { nombre: 'Campesinos', peso: 0.25, icono: 'trigo' },
  jovenes: { nombre: 'Jóvenes', peso: 0.25, icono: 'birrete' },
};

const ETIQUETAS = {
  izquierda: 'Izquierda', derecha: 'Derecha', social: 'Social', orden: 'Orden', verde: 'Verde', agrario: 'Agrario',
  estatal: 'Estatismo', mercado: 'Mercado', nacional: 'Nación', libertad: 'Libertades', autoridad: 'Autoridad', tradicion: 'Tradición', global: 'Apertura',
};

// Causas que puede abrazar un partido creado por el jugador, además de su doctrina. Cada una marca
// qué leyes le gustan (afinidad +2; −2 a las de su opuesto) y entre qué grupos tiene más o menos
// tirón (grupos: cambio relativo de su base). oculto: ya no se elige (lo decide la doctrina), pero
// sigue valiendo para las partidas guardadas con una versión anterior.
const PRINCIPIOS = {
  izquierda: { desc: 'Reparto de la riqueza y servicios públicos.', grupos: { obreros: 0.25, empresarios: -0.35, jovenes: 0.05 }, opuesto: 'derecha', oculto: true },
  derecha: { desc: 'Libre mercado e impuestos bajos.', grupos: { empresarios: 0.6, obreros: -0.2, campesinos: 0.05 }, opuesto: 'izquierda', oculto: true },
  social: { desc: 'Educación, vivienda y derechos.', grupos: { jovenes: 0.15, obreros: 0.1, empresarios: -0.1 } },
  orden: { desc: 'Seguridad, ejército y mano dura.', grupos: { campesinos: 0.15, empresarios: 0.15, jovenes: -0.25 } },
  verde: { desc: 'Medio ambiente y energía limpia.', grupos: { jovenes: 0.3, campesinos: 0.1, empresarios: -0.2 } },
  agrario: { desc: 'El campo y los pueblos primero.', grupos: { campesinos: 0.4, jovenes: -0.1 } },
  nacional: { desc: 'La patria, sus fronteras y su ejército.', grupos: { campesinos: 0.1, obreros: 0.05, jovenes: -0.15 }, opuesto: 'global' },
  global: { desc: 'Apertura al mundo y cooperación.', grupos: { jovenes: 0.15, empresarios: 0.1, campesinos: -0.15 }, opuesto: 'nacional' },
  libertad: { desc: 'Libertades y derechos civiles.', grupos: { jovenes: 0.2, campesinos: -0.1 }, opuesto: 'autoridad' },
  tradicion: { desc: 'Familia, fe y costumbres.', grupos: { campesinos: 0.2, jovenes: -0.2 } },
};
const MAX_PRINCIPIOS = 2;

// Cuánto interviene el Estado en la economía, de 0 (nada) a 4 (todo). Es a la vez una idea de
// partido (qué defiende) y una palanca de gobierno (el modelo económico en vigor, s.modelo).
// mods multiplican la economía igual que los de las leyes; grupos y estabilidad cambian el apoyo.
const MODELOS = {
  minimo: {
    nombre: 'Estado mínimo', desc: 'El Estado solo guarda el orden; todo lo demás lo hace el mercado.',
    mods: { fabricas: 1.12, export: 1.05, impuestos: 0.8, admin: 0.8 }, grupos: { empresarios: 6, obreros: -6, campesinos: -3 }, estabilidad: -3,
  },
  liberal: {
    nombre: 'Mercado libre', desc: 'Empresa privada con pocas trabas y servicios públicos básicos.',
    mods: { fabricas: 1.06, impuestos: 0.95 }, grupos: { empresarios: 3, obreros: -2 },
  },
  mixta: { nombre: 'Economía mixta', desc: 'Mercado y Estado se reparten el trabajo. Ni ventajas ni costes.' },
  dirigida: {
    nombre: 'Economía dirigida', desc: 'El Estado marca el rumbo y controla los sectores clave.',
    mods: { construccion: 0.9, minas: 1.08, fabricas: 0.96 }, grupos: { obreros: 3, empresarios: -4 },
  },
  planificada: {
    nombre: 'Economía planificada', desc: 'El Estado decide qué se produce: mucha industria pesada y poco comercio.',
    mods: { construccion: 0.75, minas: 1.2, fabricas: 0.92, export: 0.9, admin: 1.1 }, grupos: { obreros: 6, empresarios: -9 }, estabilidad: 3,
  },
};
const ORDEN_MODELOS = Object.keys(MODELOS);
const CP_CAMBIAR_MODELO = 2;
const MESES_ENTRE_MODELOS = 6;

const FAMILIAS_DOCTRINA = {
  revolucionaria: 'Izquierda revolucionaria', izquierda: 'Izquierda', centro: 'Centro', derecha: 'Derecha', autoritaria: 'Nacionalismo autoritario',
};

// Doctrinas políticas entre las que elige quien crea un partido. Son las de la historia real,
// contadas sin tomar partido: aquí solo son una forma de jugar.
// eje: dónde se sienta en el hemiciclo (−2 izquierda, +2 derecha). intervencion: cuánto Estado
// defiende de partida (0 a 4, ver MODELOS). afinidad: qué leyes le gustan (−2 a +2).
// grupos: tirón entre los votantes. rasgo: ventaja mientras gobierna (mods, grupos, estabilidad, relPartidos).
const DOCTRINAS = {
  leninismo: {
    nombre: 'Marxismo-leninismo', familia: 'revolucionaria', eje: -2, intervencion: 4,
    desc: 'Partido único de vanguardia y economía planificada por el Estado.',
    afinidad: { izquierda: 2, autoridad: 1, orden: 1, derecha: -2, libertad: -1, tradicion: -1 },
    grupos: { obreros: 0.35, campesinos: 0.05, empresarios: -0.5 },
    rasgo: { texto: 'Planes quinquenales: las minas rinden un 10% más y construir cuesta un 10% menos.', mods: { minas: 1.1, construccion: 0.9 } },
  },
  trotskismo: {
    nombre: 'Trotskismo', familia: 'revolucionaria', eje: -2, intervencion: 4,
    desc: 'Revolución obrera sin fronteras y sin burócratas.',
    afinidad: { izquierda: 2, global: 2, social: 1, derecha: -2, nacional: -2, tradicion: -1 },
    grupos: { obreros: 0.3, jovenes: 0.15, empresarios: -0.5 },
    rasgo: { texto: 'Internacionalismo: tu influencia en el exterior sube 8 puntos.', mods: { influencia: 8 } },
  },
  maoismo: {
    nombre: 'Maoísmo', familia: 'revolucionaria', eje: -2, intervencion: 4,
    desc: 'La revolución empieza en el campo y la hacen los campesinos.',
    afinidad: { izquierda: 2, agrario: 2, autoridad: 1, derecha: -2, libertad: -1, global: -1 },
    grupos: { campesinos: 0.4, obreros: 0.15, jovenes: -0.05, empresarios: -0.5 },
    rasgo: { texto: 'Revolución campesina: cada granja da 1 alimento más.', mods: { granjaExtra: 1 } },
  },
  anarquismo: {
    nombre: 'Anarcosindicalismo', familia: 'revolucionaria', eje: -1.9, intervencion: 2,
    desc: 'Ni patronos ni Estado: fábricas y campos en manos de los sindicatos.',
    afinidad: { izquierda: 2, libertad: 2, social: 1, autoridad: -2, orden: -2, nacional: -1, tradicion: -1, derecha: -1 },
    grupos: { obreros: 0.3, jovenes: 0.2, campesinos: -0.05, empresarios: -0.45 },
    rasgo: { texto: 'Autogestión: las fábricas rinden un 8% más, pero la estabilidad baja 3.', mods: { fabricas: 1.08 }, estabilidad: -3 },
  },
  socialismo: {
    nombre: 'Socialismo democrático', familia: 'izquierda', eje: -1.5, intervencion: 3,
    desc: 'Empresas públicas y reparto de la riqueza, siempre por las urnas.',
    afinidad: { izquierda: 2, social: 2, derecha: -2 },
    grupos: { obreros: 0.3, jovenes: 0.05, empresarios: -0.35 },
    rasgo: { texto: 'Servicios públicos: los obreros te apoyan 3 puntos más.', grupos: { obreros: 3 } },
  },
  socialismo_mercado: {
    nombre: 'Socialismo de mercado', familia: 'izquierda', eje: -1.2, intervencion: 3,
    desc: 'El Estado manda en la economía, pero sus empresas compiten y exportan.',
    afinidad: { izquierda: 1, global: 1, autoridad: 1, libertad: -1 },
    grupos: { obreros: 0.15, empresarios: 0.05, jovenes: -0.1 },
    rasgo: { texto: 'Empresas públicas competitivas: las exportaciones rinden un 8% más.', mods: { export: 1.08 } },
  },
  socialdemocracia: {
    nombre: 'Socialdemocracia', familia: 'izquierda', eje: -1, intervencion: 2,
    desc: 'Capitalismo con impuestos altos y un Estado del bienestar fuerte.',
    afinidad: { izquierda: 1, social: 2, libertad: 1, derecha: -1, autoridad: -1 },
    grupos: { obreros: 0.2, jovenes: 0.1, empresarios: -0.15 },
    rasgo: { texto: 'Pacto social: la estabilidad sube 4 puntos.', estabilidad: 4 },
  },
  ecologismo: {
    nombre: 'Ecologismo político', familia: 'izquierda', eje: -0.9, intervencion: 3,
    desc: 'El planeta primero: menos crecimiento y más cuidado del entorno.',
    afinidad: { verde: 2, social: 1, libertad: 1, izquierda: 1, derecha: -1 },
    grupos: { jovenes: 0.35, campesinos: 0.1, empresarios: -0.25 },
    rasgo: { texto: 'Economía verde: los jóvenes te apoyan 3 puntos más y el turismo rinde un 15% más.', grupos: { jovenes: 3 }, mods: { turismo: 1.15 } },
  },
  progresismo: {
    nombre: 'Progresismo', familia: 'izquierda', eje: -0.5, intervencion: 2,
    desc: 'Derechos civiles, igualdad y una sociedad abierta.',
    afinidad: { social: 2, libertad: 2, global: 1, tradicion: -2, autoridad: -1, orden: -1 },
    grupos: { jovenes: 0.3, obreros: 0.05, campesinos: -0.15 },
    rasgo: { texto: 'Sociedad abierta: los jóvenes te apoyan 4 puntos más.', grupos: { jovenes: 4 } },
  },
  centrismo: {
    nombre: 'Centrismo', familia: 'centro', eje: 0, intervencion: 2,
    desc: 'Reformas tranquilas y pactos con unos y con otros.',
    afinidad: { libertad: 1 }, grupos: {},
    rasgo: { texto: 'Pactista: tu relación con los demás partidos es 10 puntos mejor.', relPartidos: 10 },
  },
  tecnocracia: {
    nombre: 'Tecnocracia', familia: 'centro', eje: 0.2, intervencion: 2,
    desc: 'Que gobiernen los expertos, con números y sin ideología.',
    afinidad: { global: 1, orden: 1 },
    grupos: { empresarios: 0.15, jovenes: 0.05, campesinos: -0.1 },
    rasgo: { texto: 'Gestión experta: construir cuesta un 8% menos y los impuestos rinden un 4% más.', mods: { construccion: 0.92, impuestos: 1.04 } },
  },
  regionalismo: {
    nombre: 'Regionalismo', familia: 'centro', eje: 0.3, intervencion: 2,
    desc: 'Las provincias se gobiernan mejor desde cerca que desde la capital.',
    afinidad: { agrario: 2, libertad: 1, tradicion: 1, nacional: -1 },
    grupos: { campesinos: 0.3, jovenes: -0.05 },
    rasgo: { texto: 'Cercanía: la administración del Estado cuesta un 10% menos.', mods: { admin: 0.9 } },
  },
  agrarismo: {
    nombre: 'Agrarismo', familia: 'centro', eje: 0.4, intervencion: 2,
    desc: 'La riqueza del país está en su tierra y en quien la trabaja.',
    afinidad: { agrario: 2, tradicion: 1, verde: 1 },
    grupos: { campesinos: 0.45, jovenes: -0.1, empresarios: -0.05 },
    rasgo: { texto: 'Raíces: los campesinos te apoyan 4 puntos más.', grupos: { campesinos: 4 } },
  },
  democristiana: {
    nombre: 'Democracia cristiana', familia: 'derecha', eje: 0.6, intervencion: 2,
    desc: 'Valores religiosos, familia y una economía con rostro humano.',
    afinidad: { tradicion: 2, social: 1, agrario: 1, orden: 1 },
    grupos: { campesinos: 0.25, empresarios: 0.1, jovenes: -0.15 },
    rasgo: { texto: 'Paz social: la estabilidad sube 2 puntos y los campesinos te apoyan 2 más.', estabilidad: 2, grupos: { campesinos: 2 } },
  },
  liberalismo: {
    nombre: 'Liberalismo', familia: 'derecha', eje: 1, intervencion: 1,
    desc: 'Capitalismo liberal: propiedad privada, libre mercado y libertades individuales.',
    afinidad: { derecha: 2, libertad: 2, global: 1, izquierda: -2, autoridad: -1, nacional: -1 },
    grupos: { empresarios: 0.6, jovenes: 0.05, obreros: -0.2 },
    rasgo: { texto: 'Clima de negocios: las fábricas rinden un 8% más.', mods: { fabricas: 1.08 } },
  },
  libertarismo: {
    nombre: 'Libertarismo', familia: 'derecha', eje: 1.4, intervencion: 0,
    desc: 'Cuanto menos Estado, mejor: ni impuestos ni normas.',
    afinidad: { derecha: 2, libertad: 2, izquierda: -2, autoridad: -2, orden: -1, social: -1 },
    grupos: { empresarios: 0.7, jovenes: 0.05, obreros: -0.3 },
    rasgo: { texto: 'Estado adelgazado: la administración cuesta un 20% menos, pero la estabilidad baja 3.', mods: { admin: 0.8 }, estabilidad: -3 },
  },
  conservadurismo: {
    nombre: 'Conservadurismo', familia: 'derecha', eje: 1.5, intervencion: 1,
    desc: 'Orden, propiedad y respeto a lo que siempre ha funcionado.',
    afinidad: { derecha: 2, orden: 2, tradicion: 2, nacional: 1, izquierda: -2, social: -1 },
    grupos: { empresarios: 0.4, campesinos: 0.2, obreros: -0.1, jovenes: -0.25 },
    rasgo: { texto: 'Ley y orden: la estabilidad sube 4 puntos.', estabilidad: 4 },
  },
  nacionalismo: {
    nombre: 'Nacionalismo', familia: 'derecha', eje: 1.8, intervencion: 2,
    desc: 'La nación por encima de todo: fronteras firmes y ejército fuerte.',
    afinidad: { nacional: 2, orden: 2, tradicion: 1, global: -2, libertad: -1 },
    grupos: { campesinos: 0.2, obreros: 0.1, jovenes: -0.2 },
    rasgo: { texto: 'Patria: reclutar un regimiento cuesta un 20% menos.', mods: { reclutar: 0.8 } },
  },
  tradicionalismo: {
    nombre: 'Tradicionalismo', familia: 'derecha', eje: 1.9, intervencion: 2,
    desc: 'Trono, altar y costumbres: la vieja sociedad de siempre.',
    afinidad: { tradicion: 2, orden: 2, agrario: 1, libertad: -1, social: -1, global: -1 },
    grupos: { campesinos: 0.35, jovenes: -0.3 },
    rasgo: { texto: 'Trono y altar: la estabilidad sube 3 puntos y los campesinos te apoyan 2 más.', estabilidad: 3, grupos: { campesinos: 2 } },
  },
  falangismo: {
    nombre: 'Falangismo', familia: 'autoritaria', eje: 2, intervencion: 3,
    desc: 'Nacionalsindicalismo: nación, Estado fuerte y sindicato único de obreros y patronos.',
    afinidad: { nacional: 2, autoridad: 2, tradicion: 2, orden: 1, social: 1, libertad: -2, global: -2, derecha: -1 },
    grupos: { campesinos: 0.2, obreros: 0.15, empresarios: -0.1, jovenes: -0.2 },
    rasgo: { texto: 'Sindicato vertical: las fábricas rinden un 6% más y la estabilidad sube 2.', mods: { fabricas: 1.06 }, estabilidad: 2 },
  },
  fascismo: {
    nombre: 'Fascismo', familia: 'autoritaria', eje: 2, intervencion: 3,
    desc: 'Nacionalismo extremo, un solo jefe y toda la sociedad al servicio del Estado.',
    afinidad: { nacional: 2, autoridad: 2, orden: 2, libertad: -2, global: -2, social: -1 },
    grupos: { obreros: 0.1, campesinos: 0.1, empresarios: 0.1, jovenes: -0.3 },
    rasgo: { texto: 'Movilización total: caben 2 regimientos más y reclutar cuesta un 15% menos.', mods: { capacidad: 2, reclutar: 0.85 } },
  },
};
// Más doctrinas (versión 2.1).
Object.assign(DOCTRINAS, {
  eurocomunismo: {
    nombre: 'Eurocomunismo', familia: 'izquierda', eje: -1.7, intervencion: 3,
    desc: 'Comunismo que acepta las urnas, el pluralismo y las libertades.',
    afinidad: { izquierda: 2, social: 1, libertad: 1, derecha: -2 },
    grupos: { obreros: 0.3, jovenes: 0.1, empresarios: -0.4 },
    rasgo: { texto: 'Lucha obrera: los obreros te apoyan 2 puntos más y la estabilidad sube 1.', grupos: { obreros: 2 }, estabilidad: 1 },
  },
  laborismo: {
    nombre: 'Laborismo', familia: 'izquierda', eje: -1.1, intervencion: 3,
    desc: 'El partido de los sindicatos: empleo, salarios y servicios públicos.',
    afinidad: { izquierda: 2, social: 1, derecha: -1 },
    grupos: { obreros: 0.35, empresarios: -0.25 },
    rasgo: { texto: 'Mesa con los sindicatos: las fábricas rinden un 5% más y los obreros te apoyan 2 más.', mods: { fabricas: 1.05 }, grupos: { obreros: 2 } },
  },
  populismo_izq: {
    nombre: 'Populismo de izquierdas', familia: 'izquierda', eje: -1.4, intervencion: 3,
    desc: 'El pueblo contra las élites: subsidios, nacionalizaciones y plazas llenas.',
    afinidad: { izquierda: 2, nacional: 1, social: 1, derecha: -2, global: -1 },
    grupos: { obreros: 0.25, campesinos: 0.15, jovenes: 0.1, empresarios: -0.45 },
    rasgo: { texto: 'Plazas llenas: cada mitin da 2 puntos más de apoyo.', mitin: 2 },
  },
  pirata: {
    nombre: 'Movimiento pirata', familia: 'izquierda', eje: -0.3, intervencion: 2,
    desc: 'Internet libre, transparencia total y democracia directa.',
    afinidad: { libertad: 2, global: 1, social: 1, autoridad: -2, tradicion: -1 },
    grupos: { jovenes: 0.4, campesinos: -0.2 },
    rasgo: { texto: 'Gobierno abierto: tu influencia sube 5 puntos y los jóvenes te apoyan 3 más.', mods: { influencia: 5 }, grupos: { jovenes: 3 } },
  },
  socioliberalismo: {
    nombre: 'Liberalismo social', familia: 'centro', eje: 0.3, intervencion: 2,
    desc: 'Mercado libre con red de seguridad y libertades personales.',
    afinidad: { libertad: 2, social: 1, global: 1, autoridad: -1 },
    grupos: { jovenes: 0.15, empresarios: 0.15, campesinos: -0.1 },
    rasgo: { texto: 'Reformismo: llevar una ley a votación cuesta 1 de capital político menos.', votar: -1 },
  },
  justicialismo: {
    nombre: 'Justicialismo', familia: 'centro', eje: 0.2, intervencion: 3,
    desc: 'Tercera posición: ni capitalismo ni comunismo, sino justicia social y nación.',
    afinidad: { nacional: 2, social: 1, izquierda: 1, global: -1 },
    grupos: { obreros: 0.3, campesinos: 0.1, empresarios: -0.2 },
    rasgo: { texto: 'Justicia social: los obreros te apoyan 3 puntos más.', grupos: { obreros: 3 } },
  },
  liberal_conservadurismo: {
    nombre: 'Liberalismo conservador', familia: 'derecha', eje: 1.3, intervencion: 1,
    desc: 'Mercado libre en la economía y prudencia en las costumbres.',
    afinidad: { derecha: 2, tradicion: 1, orden: 1, izquierda: -2 },
    grupos: { empresarios: 0.5, campesinos: 0.1, obreros: -0.15, jovenes: -0.1 },
    rasgo: { texto: 'Cuentas saneadas: los impuestos rinden un 5% más.', mods: { impuestos: 1.05 } },
  },
  anarcocapitalismo: {
    nombre: 'Anarcocapitalismo', familia: 'derecha', eje: 1.9, intervencion: 0,
    desc: 'Ningún Estado: todo, hasta la justicia, en manos de empresas.',
    afinidad: { derecha: 2, libertad: 2, izquierda: -2, autoridad: -2, orden: -2, social: -2 },
    grupos: { empresarios: 0.8, obreros: -0.4, campesinos: -0.1 },
    rasgo: { texto: 'Sin burocracia: la administración cuesta un 30% menos, pero la estabilidad baja 5.', mods: { admin: 0.7 }, estabilidad: -5 },
  },
  nacionalpopulismo: {
    nombre: 'Populismo de derechas', familia: 'derecha', eje: 1.7, intervencion: 2,
    desc: 'El pueblo de siempre contra las élites y contra los de fuera.',
    afinidad: { nacional: 2, orden: 1, tradicion: 1, global: -2, libertad: -1 },
    grupos: { obreros: 0.2, campesinos: 0.2, jovenes: -0.15, empresarios: -0.1 },
    rasgo: { texto: 'Plazas llenas: cada mitin da 2 puntos más de apoyo.', mitin: 2 },
  },
  integrismo: {
    nombre: 'Integrismo religioso', familia: 'autoritaria', eje: 1.9, intervencion: 2,
    desc: 'La ley de Dios por encima de la de los hombres.',
    afinidad: { tradicion: 2, autoridad: 2, orden: 1, libertad: -2, social: -1, global: -1 },
    grupos: { campesinos: 0.4, jovenes: -0.35 },
    rasgo: { texto: 'Fe del pueblo: la estabilidad sube 4 puntos y los campesinos te apoyan 2 más.', estabilidad: 4, grupos: { campesinos: 2 } },
  },
});

// Dónde cae cada doctrina en las costumbres, de 0 (muy progresista) a 4 (muy conservadora), y qué
// forma de Estado prefiere. Quien crea un partido puede apartarse de las dos cosas.
const NIVELES_SOCIAL = ['Muy progresista', 'Progresista', 'Moderado', 'Conservador', 'Muy conservador'];
const DESC_SOCIAL = [
  'Cambiar las costumbres cuanto antes: derechos nuevos y ninguna tradición intocable.',
  'Más derechos y libertades personales, sin prisa pero sin pausa.',
  'Ni cambiar por cambiar ni conservar por conservar.',
  'Familia, costumbres y cambios solo cuando hacen falta.',
  'La tradición no se toca: lo de siempre es lo que funciona.',
];
const SOCIAL_DOCTRINA = {
  leninismo: 2, trotskismo: 1, maoismo: 2, anarquismo: 0, socialismo: 1, socialismo_mercado: 2, socialdemocracia: 1, ecologismo: 0, progresismo: 0,
  centrismo: 2, tecnocracia: 2, regionalismo: 2, agrarismo: 3, democristiana: 3, liberalismo: 1, libertarismo: 1, conservadurismo: 4, nacionalismo: 4,
  tradicionalismo: 4, falangismo: 4, fascismo: 4, eurocomunismo: 1, laborismo: 2, populismo_izq: 1, pirata: 0, socioliberalismo: 1, justicialismo: 3,
  liberal_conservadurismo: 3, anarcocapitalismo: 1, nacionalpopulismo: 4, integrismo: 4,
};
const FORMA_DOCTRINA = {
  leninismo: 'republica', trotskismo: 'republica', maoismo: 'republica', anarquismo: 'republica', socialismo: 'republica', eurocomunismo: 'republica',
  populismo_izq: 'republica', progresismo: 'republica', ecologismo: 'republica', falangismo: 'republica', pirata: 'republica',
  tradicionalismo: 'monarquia', conservadurismo: 'monarquia', liberal_conservadurismo: 'monarquia', integrismo: 'monarquia',
};
for (const id in DOCTRINAS) {
  DOCTRINAS[id].social = id in SOCIAL_DOCTRINA ? SOCIAL_DOCTRINA[id] : 2;
  DOCTRINAS[id].forma = FORMA_DOCTRINA[id] || 'neutral';
}

// Forma del Estado: lo que es el país y lo que defiende cada partido ('neutral' si le da igual).
// grupos y estabilidad: lo que cambia mientras el país tiene esa forma.
const FORMAS_ESTADO = {
  monarquia: { nombre: 'Monarquía', desc: 'Un rey o una reina como jefe del Estado, por encima de los partidos.', estabilidad: 3, grupos: { campesinos: 2, jovenes: -2 } },
  republica: { nombre: 'República', desc: 'El jefe del Estado se elige: nadie hereda el cargo.', estabilidad: 0, grupos: { jovenes: 2, obreros: 1, campesinos: -2 } },
};
const POSTURAS_FORMA = { monarquia: 'Monárquico', neutral: 'Le da igual', republica: 'Republicano' };
// Lo que tira cada grupo hacia la monarquía (positivo) o hacia la república (negativo), de −1 a 1.
const PREFERENCIA_FORMA = { obreros: -0.3, empresarios: 0.15, campesinos: 0.45, jovenes: -0.45 };
const CP_REFERENDUM = 3;

const DOCTRINA_BASE = 'centrismo';

// afinidad: cuánto le gusta a cada partido cada tipo de ley (-2 a +2). base: fuerza electoral por grupo.
// eje: dónde se sienta en el hemiciclo, de izquierda (-2) a derecha (+2).
// «uc» es el partido de centro: lo sustituye el tuyo si creas uno propio.
// Los cuatro primeros están en todos los países; los demás, según cuántos partidos tenga la partida.
const CATALOGO_PARTIDOS = {
  uc: {
    nombre: 'Unión Cívica', siglas: 'UC', color: '#c9902b', emblema: 'sol', lema: 'Centro moderado y pactista.', eje: 0,
    doctrina: 'centrismo', intervencion: 2,
    afinidad: {}, base: { obreros: 30, empresarios: 30, campesinos: 30, jovenes: 30 },
  },
  fo: {
    nombre: 'Frente Obrero', siglas: 'FO', color: '#b5443b', emblema: 'engranaje', lema: 'Izquierda sindical, fuerte entre los obreros.', eje: -2,
    doctrina: 'socialismo', intervencion: 3,
    afinidad: { izquierda: 2, social: 1, estatal: 2, derecha: -2, mercado: -2, orden: -1 },
    base: { obreros: 45, empresarios: 4, campesinos: 18, jovenes: 28 },
  },
  ac: {
    nombre: 'Alianza Conservadora', siglas: 'AC', color: '#35568c', emblema: 'torre', lema: 'Derecha de orden, la preferida de los empresarios.', eje: 1.6,
    doctrina: 'conservadurismo', intervencion: 1,
    afinidad: { derecha: 2, orden: 2, tradicion: 2, mercado: 1, nacional: 1, agrario: 1, izquierda: -2, social: -1, verde: -1, estatal: -1 },
    base: { obreros: 14, empresarios: 55, campesinos: 28, jovenes: 10 },
  },
  va: {
    nombre: 'Verdes Agrarios', siglas: 'VA', color: '#4f8a4b', emblema: 'hoja', lema: 'Ecologistas del campo, pequeños pero decisivos.', eje: -0.8,
    doctrina: 'ecologismo', intervencion: 2,
    afinidad: { verde: 2, agrario: 2, social: 1, libertad: 1, derecha: -1 },
    base: { obreros: 5, empresarios: 5, campesinos: 20, jovenes: 22 },
  },
  pl: {
    nombre: 'Partido Liberal', siglas: 'PL', color: '#d8b13a', emblema: 'balanza', lema: 'Mercado libre y libertades. Fuerte en las ciudades.', eje: 0.9,
    doctrina: 'liberalismo', intervencion: 1,
    afinidad: { derecha: 2, mercado: 2, libertad: 2, social: 1, global: 1, orden: -1, izquierda: -1, estatal: -2, autoridad: -2 },
    base: { obreros: 6, empresarios: 26, campesinos: 4, jovenes: 16 },
  },
  mn: {
    nombre: 'Movimiento Nacional', siglas: 'MN', color: '#4a4f5c', emblema: 'escudo', lema: 'Mano dura y patria primero. Crece cuando hay crisis.', eje: 2,
    doctrina: 'nacionalismo', intervencion: 2,
    afinidad: { orden: 2, nacional: 2, autoridad: 1, tradicion: 1, agrario: 1, social: -2, global: -2, verde: -1, izquierda: -1, libertad: -1 },
    base: { obreros: 12, empresarios: 8, campesinos: 14, jovenes: 7 },
  },
  ms: {
    nombre: 'Marea Social', siglas: 'MS', color: '#a8478f', emblema: 'megafono', lema: 'Nueva izquierda joven: vivienda, derechos y clima.', eje: -1.4,
    doctrina: 'progresismo', intervencion: 2,
    afinidad: { social: 2, libertad: 2, verde: 1, izquierda: 1, global: 1, orden: -2, autoridad: -2, tradicion: -1 },
    base: { obreros: 10, empresarios: 2, campesinos: 3, jovenes: 24 },
  },
  pr: {
    nombre: 'Partido Regionalista', siglas: 'PR', color: '#2f8c8c', emblema: 'faro', lema: 'Defiende las provincias frente a la capital.', eje: 0.3,
    doctrina: 'regionalismo', intervencion: 2,
    afinidad: { agrario: 2, social: 1, tradicion: 1 },
    base: { obreros: 8, empresarios: 6, campesinos: 16, jovenes: 6 },
  },
};
// Más partidos (versión 2.1). talla: su tamaño habitual; sus gustos y sus votantes salen de su doctrina.
Object.assign(CATALOGO_PARTIDOS, {
  pc: { nombre: 'Partido Comunista', siglas: 'PC', color: '#a32222', emblema: 'estrella', lema: 'El partido de la revolución: todo para el Estado obrero.', doctrina: 'leninismo', talla: 14 },
  lr: { nombre: 'Liga Revolucionaria', siglas: 'LR', color: '#d1593f', emblema: 'antorcha', lema: 'Trotskistas: revolución en todas partes y ningún burócrata.', doctrina: 'trotskismo', talla: 7 },
  cl: { nombre: 'Confederación Libertaria', siglas: 'CL', color: '#3d3d3d', emblema: 'llave', lema: 'Anarcosindicalistas: ni patronos ni ministros.', doctrina: 'anarquismo', talla: 7 },
  iu: { nombre: 'Izquierda Unitaria', siglas: 'IU', color: '#c2185b', emblema: 'globo', lema: 'Comunistas de urna y sindicato.', doctrina: 'eurocomunismo', talla: 10 },
  fp: { nombre: 'Fuerza Popular', siglas: 'FP', color: '#7d3c98', emblema: 'bombilla', lema: 'El pueblo contra los de arriba.', doctrina: 'populismo_izq', talla: 14 },
  sd: { nombre: 'Partido Socialdemócrata', siglas: 'PSD', color: '#e0567f', emblema: 'gente', lema: 'Bienestar para todos sin romper el mercado.', doctrina: 'socialdemocracia', talla: 24 },
  pt: { nombre: 'Partido del Trabajo', siglas: 'PT', color: '#cf6a32', emblema: 'martillo', lema: 'La voz de los sindicatos en el Parlamento.', doctrina: 'laborismo', talla: 15 },
  rd: { nombre: 'Red Pirata', siglas: 'RP', color: '#5b6ee1', emblema: 'ancla', lema: 'Internet libre y política a la vista de todos.', doctrina: 'pirata', talla: 7 },
  cr: { nombre: 'Centro Reformista', siglas: 'CR', color: '#e2a03f', emblema: 'diana', lema: 'Liberales con conciencia social.', doctrina: 'socioliberalismo', talla: 13 },
  mj: { nombre: 'Movimiento Justicialista', siglas: 'MJ', color: '#4aa3c7', emblema: 'charla', lema: 'Justicia social, sindicatos y nación.', doctrina: 'justicialismo', talla: 14 },
  ut: { nombre: 'Unión Tecnocrática', siglas: 'UT', color: '#607d8b', emblema: 'grafica', lema: 'Que gobiernen los que saben.', doctrina: 'tecnocracia', talla: 8 },
  la: { nombre: 'Liga Agraria', siglas: 'LA', color: '#8d9b3a', emblema: 'trigo', lema: 'El campo manda: precios justos y pueblos vivos.', doctrina: 'agrarismo', talla: 12 },
  dc: { nombre: 'Democracia Cristiana', siglas: 'DC', color: '#3f8fb5', emblema: 'casa', lema: 'Familia, fe y economía con rostro humano.', doctrina: 'democristiana', talla: 20 },
  lc: { nombre: 'Partido Popular Liberal', siglas: 'PPL', color: '#2f6fb0', emblema: 'maletin', lema: 'Impuestos bajos y costumbres de siempre.', doctrina: 'liberal_conservadurismo', talla: 18 },
  lb: { nombre: 'Partido Libertario', siglas: 'LIB', color: '#d4a017', emblema: 'moneda', lema: 'Menos Estado, menos impuestos, menos normas.', doctrina: 'libertarismo', talla: 9 },
  rn: { nombre: 'Reagrupamiento del Pueblo', siglas: 'RDP', color: '#1f3a5f', emblema: 'candado', lema: 'Los de aquí primero, contra las élites y los de fuera.', doctrina: 'nacionalpopulismo', talla: 14 },
  ct: { nombre: 'Comunión Tradicionalista', siglas: 'CT', color: '#7a5230', emblema: 'corona', lema: 'Trono, altar y fueros.', doctrina: 'tradicionalismo', talla: 8 },
  pf: { nombre: 'Partido de la Fe', siglas: 'PF', color: '#5d4a8a', emblema: 'birrete', lema: 'La ley de Dios en la ley de los hombres.', doctrina: 'integrismo', talla: 7 },
  fs: { nombre: 'Frente Sindicalista Nacional', siglas: 'FSN', color: '#34495e', emblema: 'espadas', lema: 'Patria, pan y sindicato único.', doctrina: 'falangismo', talla: 7 },
  lp: { nombre: 'Legión Patriótica', siglas: 'LP', color: '#1c1c1c', emblema: 'bandera', lema: 'Un jefe, una nación, un Estado.', doctrina: 'fascismo', talla: 7 },
});
// Costumbres y forma de Estado de los partidos de siempre que se apartan de su doctrina.
Object.assign(CATALOGO_PARTIDOS.va, { social: 1 });
Object.assign(CATALOGO_PARTIDOS.pr, { social: 3 });
Object.assign(CATALOGO_PARTIDOS.mn, { forma: 'monarquia' });

const PARTIDOS_FIJOS = ['fo', 'va', 'uc', 'ac'];
const MAX_PARTIDOS = 10;
// Cuántos partidos hay en cada parlamento, contando el tuyo (los de otros jugadores del mismo país se suman aparte).
const NUM_PARTIDOS = { 4: 'Pocos', 6: 'Normal', 8: 'Muchos', 10: 'Fragmentado' };
// Los partidos del país que se está mirando y su orden en el hemiciclo. Los rellena activarPartidos().
const PARTIDOS = {};
const ORDEN_HEMICICLO = [];
const COLORES_PARTIDO = ['#c9902b', '#2a9d8f', '#7b4fa6', '#de6b35', '#c9478b'];
const EMBLEMAS = ['sol', 'estrella', 'antorcha', 'balanza', 'faro', 'hoja', 'engranaje', 'torre', 'escudo', 'megafono', 'globo', 'bombilla',
  'gente', 'martillo', 'ancla', 'diana', 'charla', 'grafica', 'trigo', 'casa', 'maletin', 'moneda', 'candado', 'corona', 'birrete', 'espadas',
  'bandera', 'llave', 'pico', 'fabrica', 'parlamento', 'luna', 'urna', 'corazon', 'rayo', 'arbol', 'montana', 'ola', 'flechaArriba', 'cruz',
  'flor', 'llama', 'puente', 'libro', 'ojo', 'puno', 'tulipan', 'triangulo', 'anillos', 'atomo', 'cohete', 'rombo', 'paz', 'infinito',
  'campana', 'gota', 'pluma', 'asterisco', 'brujula', 'cubo', 'tridente'];
// El diseño de la insignia de un partido propio: su forma, cómo se reparten sus dos colores,
// de qué color va el símbolo y, si se quiere, unas letras en lugar del símbolo.
const FORMAS_INSIGNIA = { circulo: 'Círculo', cuadrado: 'Cuadrado', escudo: 'Escudo', hexagono: 'Hexágono' };
const FONDOS_INSIGNIA = { liso: 'Liso', mitades: 'Dos mitades', diagonal: 'Diagonal', franja: 'Franja', aro: 'Aro' };
const COLORES_SIMBOLO = ['#ffffff', '#f3d27a', '#1b221e'];
const COLORES_SEGUNDO = ['#ffffff', '#1b221e', '#f3d27a', '#b3261e', '#2f5d9a', '#2c6e49'];
const MAX_LETRAS_EMBLEMA = 4;
const ES_COLOR = /^#[0-9a-f]{6}$/i;
const limpiarLetras = t => [...String(t || '').replace(/[^\p{L}\p{N}+·!?-]/gu, '')].slice(0, MAX_LETRAS_EMBLEMA).join('');
const disenoPartido = c => ({ color: c.color, emblema: c.emblema, insignia: c.insignia, fondo: c.fondo, color2: c.color2, colorSimbolo: c.colorSimbolo, letras: c.letras });

// mant: mantenimiento mensual. meses: tiempo de obra. unico: solo uno por provincia.
const EDIFICIOS = {
  granja: { nombre: 'Granja', art: 'una', icono: 'trigo', coste: 80, meses: 1, mant: 3, requiere: 'fertil', desc: 'Produce 4 alimentos al mes.' },
  mina: { nombre: 'Mina', art: 'una', icono: 'pico', coste: 120, meses: 2, mant: 4, requiere: 'mineral', desc: 'Produce 4 materias primas al mes.' },
  fabrica: { nombre: 'Fábrica', art: 'una', icono: 'fabrica', coste: 200, meses: 2, mant: 5, desc: 'Convierte 3 materias primas en 3 bienes para vender.' },
  puerto: { nombre: 'Puerto', art: 'un', icono: 'ancla', coste: 180, meses: 3, mant: 6, requiere: 'costera', unico: true, desc: 'Exportaciones +10%. Permite comerciar y desembarcar por mar.' },
  mercado: { nombre: 'Mercado', art: 'un', icono: 'tienda', coste: 140, meses: 1, mant: 4, unico: true, desc: 'Cobra a los comerciantes: más cuanta más gente vive en la provincia.' },
  hotel: { nombre: 'Hotel de costa', art: 'un', icono: 'cama', coste: 170, meses: 2, mant: 5, requiere: 'costera', unico: true, desc: 'Atrae turistas. Rinde más con el país estable y casi nada en guerra.' },
  universidad: { nombre: 'Universidad', art: 'una', icono: 'birrete', coste: 220, meses: 3, mant: 8, unico: true, desc: 'Jóvenes +4 de apoyo. Ingresos de fábricas +5%.' },
  cuartel: { nombre: 'Cuartel', art: 'un', icono: 'torre', coste: 150, meses: 2, mant: 10, unico: true, desc: 'Estabilidad +3. Aloja 3 regimientos más.' },
  banco: { nombre: 'Banco nacional', art: 'un', icono: 'parlamento', coste: 260, meses: 3, mant: 6, requiere: 'capital', unico: true, desc: 'El tesoro da intereses y los préstamos salen más baratos.' },
};

// Nivel de impuestos: mult multiplica lo recaudado; todos y grupos cambian el apoyo.
const NIVELES_IMPUESTOS = {
  bajos: { nombre: 'Bajos', mult: 0.7, todos: 4 },
  normales: { nombre: 'Normales', mult: 1, todos: 0 },
  altos: { nombre: 'Altos', mult: 1.35, todos: -4, grupos: { empresarios: -3 } },
  muy_altos: { nombre: 'Muy altos', mult: 1.7, todos: -9, grupos: { empresarios: -6 }, estabilidad: -4 },
};
const MESES_TRIBUTO = 24;

const CATEGORIAS_LEY = { economia: 'Economía', trabajo: 'Trabajo', social: 'Social', orden: 'Orden', estado: 'Estado y nación', ambiente: 'Campo y ambiente' };

// coste: gasto mensual (negativo = ingreso). grupos: cambio de apoyo mientras la ley esté en vigor.
// mods multiplican: fabricas, minas, export, construccion, impuestos, mercados, turismo, admin (gasto
// de administración), reclutar (precio de un regimiento) y prensa (riesgo de que destapen un escándalo).
// Y suman: granjaExtra (alimentos por granja), capacidad (regimientos que caben), cpMes (capital
// político al mes) e influencia. incompatible: leyes que no pueden estar en vigor a la vez que esta.
const MODS_QUE_SUMAN = { granjaExtra: 1, capacidad: 1, cpMes: 1, influencia: 1 };
const LEYES = [
  { id: 'impuestos', cat: 'economia', nombre: 'Subida de impuestos', desc: 'Más recaudación a costa de quien más tiene.', tags: ['izquierda'], mods: { impuestos: 1.5 }, grupos: { empresarios: -10, jovenes: -3 }, incompatible: ['rebaja', 'tipo_unico'] },
  { id: 'rebaja', cat: 'economia', nombre: 'Rebaja fiscal', desc: 'Menos impuestos para animar la inversión.', tags: ['derecha'], mods: { impuestos: 0.7, fabricas: 1.15 }, grupos: { empresarios: 10, obreros: 2 }, incompatible: ['impuestos'] },
  { id: 'tipo_unico', cat: 'economia', nombre: 'Tipo único de impuestos', desc: 'Todo el mundo paga el mismo porcentaje, gane lo que gane.', tags: ['derecha', 'mercado'], mods: { impuestos: 0.88, fabricas: 1.1 }, grupos: { empresarios: 8, obreros: -5 }, incompatible: ['impuestos', 'fortunas'] },
  { id: 'fortunas', cat: 'economia', nombre: 'Impuesto a las grandes fortunas', desc: 'Un tributo anual a los mayores patrimonios del país.', tags: ['izquierda'], coste: -30, grupos: { empresarios: -9, obreros: 4, jovenes: 2 }, incompatible: ['tipo_unico'] },
  { id: 'comercio', cat: 'economia', nombre: 'Libre comercio', desc: 'Se eliminan aranceles: lo que exportas se paga mejor.', tags: ['derecha', 'global'], mods: { export: 1.2 }, grupos: { empresarios: 8, campesinos: -6 }, incompatible: ['aranceles', 'autarquia', 'planificacion'] },
  { id: 'aranceles', cat: 'economia', nombre: 'Aranceles proteccionistas', desc: 'Se protege el producto nacional frente al extranjero.', tags: ['agrario', 'nacional'], mods: { export: 0.9 }, grupos: { campesinos: 8, obreros: 4, empresarios: -6 }, incompatible: ['comercio'] },
  { id: 'zonas_francas', cat: 'economia', nombre: 'Zonas francas', desc: 'Puertos y polígonos casi sin impuestos para atraer empresas de fuera.', tags: ['mercado', 'global'], coste: 15, mods: { export: 1.15 }, grupos: { empresarios: 5, obreros: -3 }, incompatible: ['autarquia'] },
  { id: 'autarquia', cat: 'economia', nombre: 'Autarquía', desc: 'El país se propone producir todo lo que consume y no depender de nadie.', tags: ['nacional', 'estatal'], mods: { export: 0.75, minas: 1.1, granjaExtra: 1 }, grupos: { campesinos: 5, empresarios: -7 }, incompatible: ['comercio', 'zonas_francas'] },
  { id: 'privatizacion', cat: 'economia', nombre: 'Privatización de servicios', desc: 'El Estado vende empresas públicas y cobra por ello.', tags: ['derecha', 'mercado'], coste: -35, grupos: { obreros: -7, empresarios: 6 }, incompatible: ['nacionalizacion'] },
  { id: 'nacionalizacion', cat: 'economia', nombre: 'Nacionalización de la industria', desc: 'Las grandes fábricas y las minas pasan a manos del Estado, que se queda sus beneficios.', tags: ['izquierda', 'estatal'], coste: -20, mods: { minas: 1.15, fabricas: 0.92 }, grupos: { obreros: 7, empresarios: -12 }, incompatible: ['privatizacion', 'desregulacion'] },
  { id: 'desregulacion', cat: 'economia', nombre: 'Desregulación de mercados', desc: 'Menos normas y licencias: abrir un negocio es cuestión de días.', tags: ['mercado', 'derecha'], mods: { fabricas: 1.12, mercados: 1.25 }, grupos: { empresarios: 8, obreros: -5, jovenes: -2 }, incompatible: ['nacionalizacion', 'planificacion'] },
  { id: 'planificacion', cat: 'economia', nombre: 'Planificación central', desc: 'El Estado fija qué se produce y cuánto, con planes a varios años.', tags: ['estatal', 'autoridad'], mods: { minas: 1.2, construccion: 0.85, export: 0.85 }, grupos: { empresarios: -10, obreros: 3 }, estabilidad: 2, incompatible: ['desregulacion', 'comercio'] },
  { id: 'banca_publica', cat: 'economia', nombre: 'Banca pública', desc: 'Un banco del Estado da crédito barato a familias y negocios.', tags: ['estatal', 'izquierda'], coste: 15, mods: { construccion: 0.9 }, grupos: { obreros: 3, campesinos: 3, empresarios: -4 } },
  { id: 'loteria', cat: 'economia', nombre: 'Lotería nacional', desc: 'Un sorteo cada semana que llena las arcas.', tags: [], coste: -25, grupos: { obreros: -2 } },
  { id: 'infraestructuras', cat: 'economia', nombre: 'Plan de infraestructuras', desc: 'Carreteras y trenes: construir sale más barato.', tags: [], coste: 30, mods: { construccion: 0.7 }, grupos: { obreros: 2, empresarios: 2, campesinos: 2, jovenes: 2 } },

  { id: 'salario', cat: 'trabajo', nombre: 'Salario mínimo', desc: 'Sueldo mínimo garantizado por ley.', tags: ['izquierda'], mods: { fabricas: 0.85 }, grupos: { obreros: 10, empresarios: -8 } },
  { id: 'laboral', cat: 'trabajo', nombre: 'Reforma laboral flexible', desc: 'Contratar y despedir es más fácil y barato.', tags: ['derecha', 'mercado'], mods: { fabricas: 1.25 }, grupos: { obreros: -10, empresarios: 8 } },
  { id: 'jornada', cat: 'trabajo', nombre: 'Jornada de 35 horas', desc: 'Menos horas de trabajo por el mismo sueldo.', tags: ['izquierda', 'social'], mods: { fabricas: 0.9 }, grupos: { obreros: 8, jovenes: 3, empresarios: -7 } },
  { id: 'huelga', cat: 'trabajo', nombre: 'Libertad sindical', desc: 'Sindicatos libres y derecho de huelga protegido.', tags: ['izquierda', 'libertad'], grupos: { obreros: 7, empresarios: -5 }, estabilidad: -2, incompatible: ['sindicato_unico'] },
  { id: 'sindicato_unico', cat: 'trabajo', nombre: 'Sindicato único', desc: 'Obreros y patronos, en una sola organización dirigida por el Estado. Las huelgas quedan prohibidas.', tags: ['autoridad', 'nacional'], mods: { fabricas: 1.1 }, grupos: { obreros: -7, empresarios: 3 }, estabilidad: 5, incompatible: ['huelga'] },
  { id: 'cooperativas', cat: 'trabajo', nombre: 'Cooperativas obreras', desc: 'Ayudas para que los trabajadores sean dueños de sus empresas.', tags: ['izquierda'], coste: 15, mods: { fabricas: 1.05 }, grupos: { obreros: 6, empresarios: -4 } },
  { id: 'pensiones', cat: 'trabajo', nombre: 'Pensiones dignas', desc: 'Sube la pensión mínima de jubilación.', tags: ['izquierda', 'social'], coste: 40, grupos: { obreros: 6, campesinos: 6 }, incompatible: ['jubilacion'] },
  { id: 'jubilacion', cat: 'trabajo', nombre: 'Retraso de la jubilación', desc: 'Se trabaja dos años más antes de cobrar la pensión.', tags: ['derecha'], coste: -30, grupos: { obreros: -8, campesinos: -5, empresarios: 4 }, incompatible: ['pensiones'] },

  { id: 'sanidad', cat: 'social', nombre: 'Sanidad pública', desc: 'Hospitales gratuitos para toda la población.', tags: ['izquierda', 'social'], coste: 45, grupos: { obreros: 8, campesinos: 6 }, estabilidad: 3, incompatible: ['sanidad_privada'] },
  { id: 'sanidad_privada', cat: 'social', nombre: 'Seguros médicos privados', desc: 'La sanidad se paga con un seguro; el Estado solo cubre lo básico.', tags: ['mercado', 'derecha'], coste: -20, grupos: { obreros: -7, campesinos: -4, empresarios: 5 }, incompatible: ['sanidad'] },
  { id: 'educacion', cat: 'social', nombre: 'Educación gratuita', desc: 'Escuelas y universidades sin matrícula.', tags: ['social'], coste: 35, grupos: { jovenes: 12, obreros: 3 } },
  { id: 'vivienda', cat: 'social', nombre: 'Plan de vivienda joven', desc: 'Alquileres asequibles para quien empieza.', tags: ['social'], coste: 30, grupos: { jovenes: 8, obreros: 3 } },
  { id: 'renta_basica', cat: 'social', nombre: 'Renta básica', desc: 'Un ingreso mínimo cada mes para quien no llega a fin de mes.', tags: ['izquierda', 'social'], coste: 55, grupos: { obreros: 8, jovenes: 8, empresarios: -5 }, estabilidad: 2 },
  { id: 'natalidad', cat: 'social', nombre: 'Ayudas a las familias', desc: 'Un cheque por cada hijo y permisos más largos.', tags: ['tradicion', 'social'], coste: 25, grupos: { campesinos: 5, obreros: 4 } },
  { id: 'derechos', cat: 'social', nombre: 'Derechos civiles', desc: 'Igualdad ante la ley y protección de las minorías.', tags: ['social', 'libertad'], grupos: { jovenes: 8, campesinos: -3 }, incompatible: ['policia_politica'] },
  { id: 'laicismo', cat: 'social', nombre: 'Estado laico', desc: 'La religión sale de las escuelas y de los actos públicos.', tags: ['libertad', 'social'], grupos: { jovenes: 6, campesinos: -5 }, incompatible: ['religion'] },
  { id: 'religion', cat: 'social', nombre: 'Religión oficial', desc: 'El Estado adopta una fe y paga su culto y sus escuelas.', tags: ['tradicion'], coste: 10, grupos: { campesinos: 7, jovenes: -7 }, estabilidad: 3, incompatible: ['laicismo'] },
  { id: 'transparencia', cat: 'social', nombre: 'Ley de transparencia', desc: 'Las cuentas públicas, a la vista de todos.', tags: ['libertad'], coste: 10, estabilidad: 4, grupos: { obreros: 2, empresarios: 2, campesinos: 2, jovenes: 2 }, incompatible: ['censura'] },

  { id: 'seguridad', cat: 'orden', nombre: 'Ley de seguridad ciudadana', desc: 'Más policía y penas más duras.', tags: ['orden'], coste: 25, estabilidad: 10, grupos: { jovenes: -8 } },
  { id: 'servicio_militar', cat: 'orden', nombre: 'Servicio militar obligatorio', desc: 'Un año de instrucción para cada joven. Reclutar cuesta un 30% menos y caben 2 regimientos más.', tags: ['orden', 'nacional'], coste: 15, mods: { reclutar: 0.7, capacidad: 2 }, estabilidad: 6, grupos: { jovenes: -12 } },
  { id: 'rearme', cat: 'orden', nombre: 'Plan de rearme', desc: 'Fábricas de armas y arsenales nuevos. Reclutar cuesta un 25% menos.', tags: ['nacional', 'orden'], coste: 25, mods: { reclutar: 0.75 }, grupos: { empresarios: 3, jovenes: -4 } },
  { id: 'milicias', cat: 'orden', nombre: 'Milicias populares', desc: 'Voluntarios armados en cada barrio. Caben 2 regimientos más.', tags: ['nacional'], coste: 10, mods: { capacidad: 2 }, estabilidad: -2, grupos: { obreros: 3, empresarios: -4 } },
  { id: 'censura', cat: 'orden', nombre: 'Censura de prensa', desc: 'Los periódicos pasan por un censor antes de salir. A la prensa le cuesta el doble destapar un escándalo.', tags: ['autoridad'], mods: { prensa: 0.5 }, estabilidad: 7, grupos: { jovenes: -10, empresarios: -2 }, incompatible: ['transparencia'] },
  { id: 'policia_politica', cat: 'orden', nombre: 'Policía política', desc: 'Un cuerpo que vigila a opositores, sindicatos y periodistas.', tags: ['autoridad', 'orden'], coste: 20, estabilidad: 9, grupos: { jovenes: -8, obreros: -4 }, incompatible: ['derechos'] },

  { id: 'poderes', cat: 'estado', nombre: 'Poderes especiales', desc: 'El gobierno puede legislar por decreto. Ganas 1 de capital político más cada mes.', tags: ['autoridad'], mods: { cpMes: 1 }, grupos: { obreros: -3, empresarios: -3, campesinos: -3, jovenes: -6 } },
  { id: 'descentralizacion', cat: 'estado', nombre: 'Autonomía de las provincias', desc: 'Cada provincia decide sobre sus escuelas, sus caminos y sus impuestos locales.', tags: ['agrario', 'libertad'], coste: 15, grupos: { campesinos: 6, jovenes: 2 }, incompatible: ['centralismo'] },
  { id: 'centralismo', cat: 'estado', nombre: 'Estado centralizado', desc: 'Todo se decide en la capital, con una sola ley para todo el país. La administración cuesta un 15% menos.', tags: ['nacional', 'autoridad'], mods: { admin: 0.85 }, estabilidad: 3, grupos: { campesinos: -6 }, incompatible: ['descentralizacion'] },
  { id: 'fronteras_abiertas', cat: 'estado', nombre: 'Fronteras abiertas', desc: 'Facilidades para que venga a trabajar gente de otros países.', tags: ['global', 'libertad'], mods: { fabricas: 1.08 }, grupos: { empresarios: 4, jovenes: 3, obreros: -5, campesinos: -2 }, incompatible: ['fronteras_cerradas'] },
  { id: 'fronteras_cerradas', cat: 'estado', nombre: 'Fronteras cerradas', desc: 'Cupos estrictos de entrada y más controles en los pasos.', tags: ['nacional', 'orden'], coste: 10, mods: { fabricas: 0.95 }, estabilidad: 2, grupos: { campesinos: 4, obreros: 3, jovenes: -5, empresarios: -3 }, incompatible: ['fronteras_abiertas'] },
  { id: 'cooperacion', cat: 'estado', nombre: 'Cooperación internacional', desc: 'Ayuda al desarrollo y becas para extranjeros. Tu influencia sube 10 puntos.', tags: ['global', 'social'], coste: 20, mods: { influencia: 10 }, grupos: { jovenes: 3 } },

  { id: 'agrario', cat: 'ambiente', nombre: 'Subsidios agrarios', desc: 'Ayudas directas al campo.', tags: ['agrario'], coste: 30, mods: { granjaExtra: 1 }, grupos: { campesinos: 12 } },
  { id: 'reforma_agraria', cat: 'ambiente', nombre: 'Reforma agraria', desc: 'Las grandes fincas se reparten entre quienes las trabajan.', tags: ['izquierda', 'agrario'], mods: { granjaExtra: 1 }, grupos: { campesinos: 10, empresarios: -8 }, incompatible: ['colectivizacion'] },
  { id: 'colectivizacion', cat: 'ambiente', nombre: 'Colectivización del campo', desc: 'Las tierras se juntan en grandes granjas del Estado.', tags: ['estatal', 'autoridad'], mods: { granjaExtra: 2 }, estabilidad: -3, grupos: { campesinos: -10, obreros: 2 }, incompatible: ['reforma_agraria'] },
  { id: 'ambiental', cat: 'ambiente', nombre: 'Protección ambiental', desc: 'Límites a la minería y a la contaminación.', tags: ['verde'], mods: { minas: 0.75 }, grupos: { jovenes: 9, campesinos: 4, empresarios: -5 } },
  { id: 'carbono', cat: 'ambiente', nombre: 'Impuesto al carbono', desc: 'Quien contamina, paga.', tags: ['verde'], coste: -20, mods: { minas: 0.9 }, grupos: { jovenes: 5, empresarios: -5, campesinos: -2 } },
  { id: 'renovables', cat: 'ambiente', nombre: 'Energías renovables', desc: 'Energía limpia y barata para la industria.', tags: ['verde'], coste: 35, mods: { fabricas: 1.1 }, grupos: { jovenes: 6 } },
  { id: 'nuclear', cat: 'ambiente', nombre: 'Energía nuclear', desc: 'Centrales que dan energía barata y constante a las fábricas.', tags: [], coste: 30, mods: { fabricas: 1.15 }, grupos: { empresarios: 3, jovenes: -5 } },
  { id: 'parques', cat: 'ambiente', nombre: 'Parques nacionales', desc: 'Montes y costas protegidos que atraen visitantes. El turismo rinde un 25% más.', tags: ['verde'], coste: 15, mods: { turismo: 1.25 }, grupos: { jovenes: 4, campesinos: 2 } },
];

const NOMBRES_PROPIOS = {
  costa: ['Puerto Sal', 'Costa Negra', 'Bahía Clara', 'Torremar', 'Cabo Viejo', 'Playa Larga', 'Punta Serena', 'Marazul'],
  interior: ['Valdoria', 'Monteferro', 'Carbonera', 'Altamira', 'Llanos de Oro', 'Ribera', 'Peñalba', 'Vallehondo', 'Sierra Alta', 'Campo Real', 'Dos Ríos', 'Fuentefría'],
};

const ACCIONES_DIPLO = {
  delegacion: { nombre: 'Enviar delegación', icono: 'bandera', cp: 1, dinero: 25, desc: 'Relación +12.' },
  tratado: { nombre: 'Tratado comercial', icono: 'moneda', cp: 1, desc: 'Ingresos cada mes. Requiere relación 25.' },
  alianza: { nombre: 'Alianza', icono: 'escudo', cp: 2, desc: 'Estabilidad +4, influencia y ayuda si te atacan. Requiere tratado y relación 55.' },
  denuncia: { nombre: 'Denuncia pública', icono: 'megafono', cp: 1, desc: 'Relación −15. A su rival le gusta (+8).' },
};

// Ejército y guerra.
const COSTE_TROPA = 60;        // reclutar un regimiento
const MANT_TROPA = 3;          // mantenerlo cada mes (el doble en guerra)
const TROPAS_INICIALES = 2;
const CP_DECLARAR_GUERRA = 3;
const MESES_TREGUA = 24;

// Gabinete. El efecto depende del nivel (1 a 5) de quien ocupe la cartera.
const CARTERAS = {
  hacienda: { nombre: 'Hacienda', icono: 'moneda', efecto: n => `Impuestos +${3 * n}%` },
  interior: { nombre: 'Interior', icono: 'escudo', efecto: n => `Estabilidad +${Math.round(1.5 * n)}` },
  exteriores: { nombre: 'Exteriores', icono: 'globo', efecto: n => `Delegaciones +${2 * n} de relación, influencia +${2 * n}` },
  industria: { nombre: 'Industria y obras', icono: 'martillo', efecto: n => `Construir cuesta ${4 * n}% menos` },
};

// cartera: su especialidad. Fuera de ella rinde dos niveles menos. partido null = independiente.
const CANDIDATOS = [
  { id: 'marques', nombre: 'Elena Marqués', partido: 'uc', cartera: 'hacienda', nivel: 3 },
  { id: 'rivas', nombre: 'Tomás Rivas', partido: 'uc', cartera: 'interior', nivel: 2 },
  { id: 'ferrer', nombre: 'Lucía Ferrer', partido: 'uc', cartera: 'exteriores', nivel: 4 },
  { id: 'coll', nombre: 'Andrés Coll', partido: 'uc', cartera: 'industria', nivel: 3 },
  { id: 'vidal', nombre: 'Rosa Vidal', partido: 'fo', cartera: 'industria', nivel: 4 },
  { id: 'herrero', nombre: 'Iván Herrero', partido: 'fo', cartera: 'interior', nivel: 3 },
  { id: 'luna', nombre: 'Gonzalo de Luna', partido: 'ac', cartera: 'hacienda', nivel: 5 },
  { id: 'sandoval', nombre: 'Beatriz Sandoval', partido: 'ac', cartera: 'exteriores', nivel: 3 },
  { id: 'prats', nombre: 'Nora Prats', partido: 'va', cartera: 'industria', nivel: 3 },
  { id: 'ortega', nombre: 'Samuel Ortega', partido: null, cartera: 'hacienda', nivel: 4 },
  { id: 'ibanez', nombre: 'Clara Ibáñez', partido: null, cartera: 'interior', nivel: 4 },
  { id: 'bermejo', nombre: 'Hugo Bermejo', partido: null, cartera: 'exteriores', nivel: 5 },
];

// Efectos de una opción: dinero, cp, estabilidad, todos (todos los grupos), grupos {id: n},
// relacion (país del evento), relacion2 (segundo país), relPartido (partido del evento), relPartidos (todos),
// destituir, guerra ('pais' o 'pais2': empieza una guerra con él), romperAlianza y paz.
// requiere: edificio que debe existir. pais / dosPaises / partido / ministro / provincia: se eligen al azar.
// paisFijo: solo si ese país sigue existiendo. directo: no sale al azar, lo lanzan las reglas.
// En los textos, {mipais} es el nombre de tu país.
const EVENTOS = [
  {
    id: 'huelga', icono: 'fabrica', titulo: 'Huelga en las fábricas', requiere: 'fabrica',
    texto: 'Los trabajadores paran la producción y piden mejores sueldos.',
    opciones: [
      { texto: 'Pagar una subida de sueldos', efectos: { dinero: -60, grupos: { obreros: 8, empresarios: -4 } } },
      { texto: 'Mantenerse firme', efectos: { estabilidad: -4, grupos: { obreros: -8, empresarios: 4 } } },
    ],
  },
  {
    id: 'sequia', icono: 'trigo', titulo: 'Sequía en el campo',
    texto: 'Lleva meses sin llover y las cosechas peligran.',
    opciones: [
      { texto: 'Aprobar ayudas de emergencia', efectos: { dinero: -50, grupos: { campesinos: 6 } } },
      { texto: 'No intervenir', efectos: { grupos: { campesinos: -8 } } },
    ],
  },
  {
    id: 'corrupcion', icono: 'periodico', titulo: 'Escándalo en el gabinete', ministro: true,
    texto: 'La prensa publica que {ministro} aceptó sobornos de una constructora.',
    opciones: [
      { texto: 'Destituir a {ministro}', efectos: { destituir: true, estabilidad: 2 } },
      { texto: 'Defenderle en público', efectos: { todos: -4, estabilidad: -3 } },
    ],
  },
  {
    id: 'estudiantes', icono: 'birrete', titulo: 'Protestas estudiantiles',
    texto: 'Miles de jóvenes ocupan las plazas de la capital.',
    opciones: [
      { texto: 'Reunirte con sus portavoces', efectos: { cp: -1, grupos: { jovenes: 6 } } },
      { texto: 'Desalojar con la policía', efectos: { estabilidad: 3, grupos: { jovenes: -10 } } },
    ],
  },
  {
    id: 'inversor', icono: 'maletin', titulo: 'Oferta de un inversor extranjero',
    texto: 'Una gran empresa quiere instalarse, pero exige condiciones laborales a su medida.',
    opciones: [
      { texto: 'Aceptar la inversión', efectos: { dinero: 120, grupos: { empresarios: 4, obreros: -4 } } },
      { texto: 'Rechazarla', efectos: { grupos: { obreros: 3, empresarios: -5 } } },
    ],
  },
  {
    id: 'frontera', icono: 'bandera', titulo: 'Incidente fronterizo con {pais}', pais: true,
    texto: 'Una patrulla de {pais} ha cruzado la frontera sin permiso.',
    opciones: [
      { texto: 'Presentar una protesta formal', efectos: { relacion: -12, estabilidad: 3 } },
      { texto: 'Quitarle importancia', efectos: { relacion: 5, todos: -3 } },
    ],
  },
  {
    id: 'cumbre', icono: 'globo', titulo: '{pais} te invita a una cumbre', pais: true,
    texto: 'El gobierno de {pais} propone una reunión de alto nivel.',
    opciones: [
      { texto: 'Asistir con una gran delegación', efectos: { dinero: -30, relacion: 15 } },
      { texto: 'Declinar la invitación', efectos: { relacion: -8 } },
    ],
  },
  {
    id: 'cosecha', icono: 'trigo', titulo: 'Cosecha excepcional', requiere: 'granja',
    texto: 'Este año las granjas han producido mucho más de lo esperado.',
    opciones: [
      { texto: 'Exportar el excedente', efectos: { dinero: 60 } },
      { texto: 'Abaratar la comida en casa', efectos: { todos: 3 } },
    ],
  },
  {
    id: 'accidente', icono: 'pico', titulo: 'Accidente en una mina', requiere: 'mina',
    texto: 'Un derrumbe deja varios mineros heridos.',
    opciones: [
      { texto: 'Indemnizar e invertir en seguridad', efectos: { dinero: -50, grupos: { obreros: 5 } } },
      { texto: 'Culpar a la empresa', efectos: { grupos: { obreros: 2, empresarios: -6 } } },
    ],
  },
  {
    id: 'crisis_vecinos', icono: 'escudo', titulo: 'Crisis entre {pais} y {pais2}', dosPaises: true,
    texto: 'Los dos países movilizan tropas y ambos esperan tu apoyo.',
    opciones: [
      { texto: 'Respaldar a {pais}', efectos: { relacion: 15, relacion2: -20 } },
      { texto: 'Respaldar a {pais2}', efectos: { relacion: -20, relacion2: 15 } },
      { texto: 'Ofrecerte como mediador', efectos: { cp: -2, relacion: 5, relacion2: 5, estabilidad: 2 } },
    ],
  },
  {
    id: 'epidemia', icono: 'gente', titulo: 'Brote de gripe',
    texto: 'Los hospitales se llenan y la gente pide una respuesta.',
    opciones: [
      { texto: 'Campaña de vacunación', efectos: { dinero: -70, todos: 3 } },
      { texto: 'Esperar a que pase', efectos: { todos: -4, estabilidad: -2 } },
    ],
  },
  {
    id: 'debate', icono: 'megafono', titulo: 'Debate televisado',
    texto: 'Te enfrentas en directo a los líderes de la oposición.',
    opciones: [
      { texto: 'Atacar sin contemplaciones', efectos: { grupos: { obreros: 3, jovenes: 2 }, relPartidos: -6 } },
      { texto: 'Tender la mano', efectos: { relPartidos: 6 } },
    ],
  },
  {
    id: 'yacimiento', icono: 'pico', titulo: 'Hallazgo de un yacimiento', provincia: true,
    texto: 'Unos geólogos encuentran petróleo en {provincia}, bajo un bosque protegido.',
    opciones: [
      { texto: 'Explotarlo', efectos: { dinero: 150, grupos: { jovenes: -5, campesinos: -3 } } },
      { texto: 'Proteger el bosque', efectos: { grupos: { jovenes: 6, empresarios: -3 } } },
    ],
  },
  {
    id: 'banco', icono: 'parlamento', titulo: 'Un banco en apuros',
    texto: 'El mayor banco del país no puede devolver los ahorros de sus clientes.',
    opciones: [
      { texto: 'Rescatarlo con dinero público', efectos: { dinero: -100, grupos: { empresarios: 6, obreros: -4 } } },
      { texto: 'Dejarlo caer', efectos: { estabilidad: -3, grupos: { empresarios: -8 } } },
    ],
  },
  {
    id: 'prestamo_pais', icono: 'moneda', titulo: '{pais} pide un préstamo', pais: true,
    texto: 'El gobierno de {pais} pasa apuros y recurre a {mipais}.',
    opciones: [
      { texto: 'Concederlo', efectos: { dinero: -60, relacion: 18 } },
      { texto: 'Negarse con educación', efectos: { relacion: -6 } },
    ],
  },
  {
    id: 'espia', icono: 'candado', titulo: 'Detenido un espía de {pais}', pais: true,
    texto: 'La policía sorprende a un agente de {pais} fotografiando documentos.',
    opciones: [
      { texto: 'Expulsarlo ante las cámaras', efectos: { relacion: -15, estabilidad: 3, todos: 1 } },
      { texto: 'Devolverlo con discreción', efectos: { relacion: 6, cp: -1 } },
    ],
  },
  {
    id: 'fiesta', icono: 'estrella', titulo: 'Fiesta nacional',
    texto: 'Se acerca el día de {mipais} y hay que decidir cómo celebrarlo.',
    opciones: [
      { texto: 'Un gran desfile', efectos: { dinero: -40, estabilidad: 3, todos: 2 } },
      { texto: 'Un acto austero', efectos: { grupos: { empresarios: 2 } } },
    ],
  },
  {
    id: 'pacto', icono: 'charla', titulo: '{partido} propone un pacto', partido: true,
    texto: 'Sus diputados ofrecen colaborar si escuchas sus prioridades.',
    opciones: [
      { texto: 'Aceptar y cederles protagonismo', efectos: { cp: -1, relPartido: 15 } },
      { texto: 'Rechazarlo', efectos: { relPartido: -6 } },
    ],
  },
  {
    id: 'inundacion', icono: 'ancla', titulo: 'Inundaciones en {provincia}', provincia: true,
    texto: 'El río se desborda y deja barrios enteros bajo el agua.',
    opciones: [
      { texto: 'Enviar ayuda de inmediato', efectos: { dinero: -60, todos: 2 } },
      { texto: 'Esperar al informe de daños', efectos: { estabilidad: -2, grupos: { campesinos: -5 } } },
    ],
  },
  {
    id: 'mercaderes', icono: 'ancla', titulo: 'Mercaderes de {pais}', requiere: 'puerto', maritimo: true,
    texto: 'Una flota de {pais} pide licencias para vender en tus puertos.',
    opciones: [
      { texto: 'Venderles las licencias', efectos: { dinero: 80, relacion: 6 } },
      { texto: 'Proteger el comercio local', efectos: { grupos: { obreros: 3 }, relacion: -8 } },
    ],
  },
  {
    id: 'desfile', icono: 'espadas', titulo: 'Los generales piden más medios',
    texto: 'El estado mayor avisa de que el ejército se queda anticuado.',
    opciones: [
      { texto: 'Comprar armamento nuevo', efectos: { dinero: -90, tropas: 1 } },
      { texto: 'Decirles que se apañen', efectos: { estabilidad: -2 } },
    ],
  },

  // Lanzados por las reglas de guerra y del mundo.
  {
    id: 'ultimatum', icono: 'espadas', directo: true, titulo: 'Ultimátum de {pais}',
    texto: '{pais} concentra tropas junto a {mipais} y exige un tributo para no atacar.',
    opciones: [
      { texto: 'Pagar el tributo', efectos: { dinero: -150, relacion: 25, todos: -2 } },
      { texto: 'Rechazarlo y prepararse', efectos: { guerra: 'pais', todos: 2 } },
    ],
  },
  {
    id: 'aliado_guerra', icono: 'escudo', directo: true, titulo: '{pais} pide tu ayuda',
    texto: 'Tu aliado {pais} está en guerra con {pais2} y reclama que cumplas la alianza.',
    opciones: [
      { texto: 'Entrar en la guerra', efectos: { guerra: 'pais2', relacion: 20 } },
      { texto: 'Mantenerte al margen', efectos: { romperAlianza: true, relacion: -30 } },
    ],
  },
  {
    id: 'oferta_paz', icono: 'bandera', directo: true, titulo: '{pais} ofrece la paz',
    texto: 'Tras meses de guerra, {pais} propone que cada uno vuelva a sus fronteras.',
    opciones: [
      { texto: 'Aceptar la paz', efectos: { paz: true } },
      { texto: 'Seguir luchando', efectos: {} },
    ],
  },
];

// Metas que orientan la partida. hecho se evalúa después de cada acción.
const OBJETIVOS = [
  { id: 'construir', texto: 'Encarga tu primer edificio', premio: { cp: 1 }, hecho: s => s.cuenta.obras >= 1 },
  { id: 'ley', texto: 'Aprueba una ley', premio: { dinero: 50 }, hecho: s => s.cuenta.leyes >= 1 },
  { id: 'ministros', texto: 'Nombra dos ministros', premio: { cp: 1 }, hecho: s => Object.values(s.ministros).filter(Boolean).length >= 2 },
  { id: 'tratado', texto: 'Firma un tratado comercial', premio: { dinero: 60 }, hecho: s => Object.values(s.paises).some(p => p.tratado) },
  { id: 'balance', texto: 'Llega a un balance de +100 al mes', premio: { dinero: 100 }, hecho: s => calcularEconomia(s).balance >= 100 },
  { id: 'ejercito', texto: 'Ten 4 regimientos', premio: { cp: 1 }, hecho: s => s.tropas >= 4 },
  { id: 'puerto', texto: 'Construye un puerto', premio: { dinero: 80 }, hecho: s => contarEdificios(s).puerto >= 1 },
  { id: 'universidad', texto: 'Construye una universidad', premio: { cp: 2 }, hecho: s => contarEdificios(s).universidad >= 1 },
  { id: 'popular', texto: 'Alcanza el 60% de popularidad', premio: { cp: 2 }, hecho: s => popularidad(s) >= 60 },
  { id: 'elecciones', texto: 'Gana unas elecciones', premio: { dinero: 150 }, hecho: s => s.cuenta.elecciones >= 1 },
  { id: 'alianza', texto: 'Sella una alianza', premio: { dinero: 100 }, hecho: s => Object.values(s.paises).some(p => p.alianza) },
  { id: 'conquista', texto: 'Anexiona una provincia', premio: { dinero: 120 }, hecho: s => s.cuenta.conquistas >= 1 },
  { id: 'mercado', texto: 'Abre un mercado', premio: { dinero: 60 }, hecho: s => contarEdificios(s).mercado >= 1 },
  { id: 'pais', texto: 'Anexiona un país entero', premio: { dinero: 250 }, hecho: s => Object.values(s.paises).some(p => p.porTi) },
  { id: 'fabricas', texto: 'Ten 5 fábricas', premio: { dinero: 150 }, hecho: s => contarEdificios(s).fabrica >= 5 },
  { id: 'absoluta', texto: 'Consigue la mayoría absoluta tú solo', premio: { dinero: 200 }, hecho: s => s.escanos[ID_JUGADOR] >= MAYORIA },
  { id: 'pacto', texto: 'Cierra un pacto con otro partido', premio: { cp: 1 }, hecho: s => Object.keys(s.pactos || {}).length >= 1 },
];

// ---------- Carrera política ----------

// Quien dirige tu partido al empezar la carrera. Cambia en cada partida (lo fija usarNacion).
let LIDER_INICIAL = 'Marta Solís';
const NOMBRES_LIDERES = ['Marta Solís', 'Julia Ortiz', 'Ramón Aguirre', 'Carmen Llorente', 'Pablo Ferrán', 'Inés Robles', 'Víctor Salgado', 'Elena Cuesta',
  'Jorge Barrios', 'Lucía Montes', 'Andrés Pizarro', 'Nuria Serrano', 'Óscar Lamas', 'Beatriz Ocaña', 'Hugo Tejedor', 'Sara Villalba', 'Diego Navarro', 'Alba Quiroga',
  'Teresa Maldonado', 'Rubén Castaño', 'Irene Bustos', 'Mateo Zubiri', 'Paula Requena', 'Germán Ochoa', 'Lidia Carrasco', 'Tomás Belmonte', 'Noelia Arranz',
  'Emilio Varela', 'Rocío Palacios', 'Santiago Mur', 'Aitana Cebrián', 'Fermín Lozano'];
// Gente que puede ser ministro: cada partida reparte unos cuantos entre los partidos de su parlamento.
const NOMBRES_MINISTROS = ['Elena Marqués', 'Tomás Rivas', 'Lucía Ferrer', 'Andrés Coll', 'Rosa Vidal', 'Iván Herrero', 'Gonzalo de Luna', 'Beatriz Sandoval',
  'Nora Prats', 'Samuel Ortega', 'Clara Ibáñez', 'Hugo Bermejo', 'Marina Acosta', 'Felipe Cárdenas', 'Olga Montiel', 'Raúl Espejo', 'Julia Cano', 'Daniel Pons',
  'Sofía Lerma', 'Marcos Tena', 'Adela Rueda', 'Bruno Castells', 'Eva Solano', 'Jaime Urrutia', 'Mónica Vera', 'César Aldana', 'Pilar Etxea', 'Simón Garrido',
  'Laura Benet', 'Ignacio Rojo', 'Carla Mediavilla', 'Alberto Feijoo'];
const MES_CONGRESO = 10;
const MAX_PROMESAS = 3;

// Lo que puedes hacer cada mes mientras no gobiernas. Cada cosa, una vez al mes.
// fase: 'lider' = solo cuando ya diriges el partido.
const ACCIONES_CARRERA = [
  { id: 'pleno', nombre: 'Intervenir en el pleno', icono: 'megafono', cp: 1, efectos: { prestigio: 3 }, desc: 'Un buen discurso te da a conocer.' },
  { id: 'militantes', nombre: 'Reunirte con militantes', icono: 'gente', cp: 1, efectos: { interno: 3 }, desc: 'Las bases del partido quieren que se las escuche.' },
  { id: 'fondos', nombre: 'Recaudar fondos', icono: 'moneda', cp: 1, efectos: { fondos: 30 }, desc: 'Cenas, rifas y llamadas a simpatizantes.' },
  { id: 'tele', nombre: 'Entrevista en televisión', icono: 'periodico', cp: 2, efectos: { prestigio: 7 }, desc: 'Media hora en el programa más visto.' },
  { id: 'barones', nombre: 'Cena con los barones', icono: 'maletin', cp: 2, fondos: 30, efectos: { interno: 8 }, desc: 'Los dirigentes regionales mueven muchos delegados.' },
  { id: 'campana', nombre: 'Campaña en medios', icono: 'megafono', cp: 1, fondos: 90, fase: 'lider', efectos: { imagenTodos: 1 }, desc: 'Carteles y anuncios por todo el país. Su efecto no se pierde.' },
];

// Efectos propios de la carrera: prestigio, interno (apoyo en el partido), fondos, imagen {grupo: n},
// imagenTodos, apoyoLider (apoyo de la líder actual) y fuerzaGobierno (ventaja del partido que gobierna).
// fase: 'diputado' o 'lider' si solo ocurre en esa etapa.
const EVENTOS_CARRERA = [
  {
    id: 'c_lealtad', icono: 'megafono', fase: 'diputado', titulo: 'La dirección te pide lealtad',
    texto: '{lider} quiere que defiendas en televisión una postura del partido que no gusta a nadie.',
    opciones: [
      { texto: 'Dar la cara por el partido', efectos: { interno: 6, prestigio: -3 } },
      { texto: 'Negarte con buenas palabras', efectos: { interno: -5, prestigio: 4 } },
    ],
  },
  {
    id: 'c_filtracion', icono: 'periodico', titulo: 'Llega un sobre anónimo',
    texto: 'Dentro hay pruebas de que un ministro adjudicó contratos a un amigo.',
    opciones: [
      { texto: 'Denunciarlo tú en el pleno', efectos: { prestigio: 8, fuerzaGobierno: -0.06, relPartidos: -4 } },
      { texto: 'Entregárselo a la dirección', efectos: { interno: 7, fuerzaGobierno: -0.03 } },
    ],
  },
  {
    id: 'c_foto', icono: 'periodico', titulo: 'Una vieja foto incómoda',
    texto: 'Un periódico publica una imagen tuya de hace años en una fiesta poco edificante.',
    opciones: [
      { texto: 'Reírte de ti mismo en una entrevista', efectos: { prestigio: 2, interno: -2 } },
      { texto: 'Pagar a un gabinete para taparlo', efectos: { fondos: -50 } },
      { texto: 'No decir nada', efectos: { prestigio: -4 } },
    ],
  },
  {
    id: 'c_donante', icono: 'moneda', titulo: 'Un donante generoso',
    texto: 'Un gran empresario ofrece financiar tu campaña. La prensa acabará sabiéndolo.',
    opciones: [
      { texto: 'Aceptar el dinero', efectos: { fondos: 110, imagen: { obreros: -3, empresarios: 2 } } },
      { texto: 'Rechazarlo en público', efectos: { prestigio: 3, imagen: { obreros: 2 } } },
    ],
  },
  {
    id: 'c_huelga', icono: 'fabrica', titulo: 'Huelga en la mayor fábrica del país',
    texto: 'Los trabajadores llevan diez días parados y te invitan a visitarlos.',
    opciones: [
      { texto: 'Ir con el megáfono', efectos: { imagen: { obreros: 4, empresarios: -3 } } },
      { texto: 'Proponer una mediación', efectos: { prestigio: 3, imagen: { empresarios: 1 } } },
    ],
  },
  {
    id: 'c_baron', icono: 'maletin', fase: 'diputado', titulo: 'Un barón te ofrece su apoyo', provincia: true,
    texto: 'El dirigente de {provincia} pondrá a sus delegados de tu parte si le prometes un cargo.',
    opciones: [
      { texto: 'Cerrar el trato', efectos: { interno: 10, prestigio: -2 } },
      { texto: 'No comprar apoyos', efectos: { interno: -3, prestigio: 3 } },
    ],
  },
  {
    id: 'c_rumbo', icono: 'balanza', titulo: 'Debate sobre el rumbo del partido',
    texto: 'El partido discute si abrirse a nuevos votantes o volver a sus esencias.',
    opciones: [
      { texto: 'Defender la apertura', efectos: { interno: -4, imagenTodos: 1 } },
      { texto: 'Defender las esencias', efectos: { interno: 5 } },
    ],
  },
  {
    id: 'c_tanteo', icono: 'charla', titulo: '{partido} te tantea', partido: true,
    texto: 'Uno de sus dirigentes te invita a comer para hablar de futuros acuerdos.',
    opciones: [
      { texto: 'Aceptar la comida', efectos: { relPartido: 12, interno: -3 } },
      { texto: 'Declinar la invitación', efectos: { relPartido: -4, interno: 2 } },
    ],
  },
  {
    id: 'c_campo', icono: 'trigo', titulo: 'Tractores ante el Parlamento',
    texto: 'Miles de agricultores protestan por los precios y buscan diputados que los escuchen.',
    opciones: [
      { texto: 'Bajar a hablar con ellos', efectos: { imagen: { campesinos: 4 }, prestigio: 1 } },
      { texto: 'Seguir con la agenda', efectos: { imagen: { campesinos: -2 } } },
    ],
  },
  {
    id: 'c_tropiezo', icono: 'megafono', fase: 'diputado', titulo: '{lider} tropieza',
    texto: 'La líder confunde dos cifras en un debate y todo el país se ríe.',
    opciones: [
      { texto: 'Salir en su defensa', efectos: { interno: 4, apoyoLider: -2 } },
      { texto: 'Dejar caer que hace falta relevo', efectos: { apoyoLider: -6, interno: -3, prestigio: 2 } },
    ],
  },
  {
    id: 'c_criticos', icono: 'gente', fase: 'lider', titulo: 'El sector crítico se mueve',
    texto: 'Varios dirigentes piden más peso en la dirección y amenazan con hacer ruido.',
    opciones: [
      { texto: 'Darles puestos en la ejecutiva', efectos: { interno: 8, prestigio: -2 } },
      { texto: 'Plantarles cara', efectos: { interno: -6, prestigio: 4 } },
    ],
  },
  {
    id: 'c_debate', icono: 'megafono', fase: 'lider', titulo: 'Debate entre candidatos',
    texto: 'Las cadenas organizan un cara a cara con el jefe de gobierno.',
    opciones: [
      { texto: 'Atacar su gestión', efectos: { imagenTodos: 2, fuerzaGobierno: -0.04, relPartidos: -3 } },
      { texto: 'Presentar tu programa', efectos: { prestigio: 5, imagenTodos: 1 } },
    ],
  },
];

const OBJETIVOS_CARRERA = [
  { id: 'c_pleno', texto: 'Interviene en el pleno', premio: { cp: 1 }, hecho: s => s.cuenta.plenos >= 1 },
  { id: 'c_prestigio', texto: 'Alcanza 30 de prestigio', premio: { fondos: 40 }, hecho: s => s.carrera.prestigio >= 30 },
  { id: 'c_ley', texto: 'Lleva una ley a votación', premio: { interno: 3 }, hecho: s => s.cuenta.propuestas >= 1 },
  { id: 'c_supera', texto: 'Supera en apoyo a quien dirige tu partido', premio: { prestigio: 3 }, hecho: s => esLider(s) || apoyoCongreso(s) > s.carrera.apoyoLider },
  { id: 'c_lider', texto: 'Gana el congreso del partido', premio: { cp: 3 }, hecho: s => esLider(s) },
  { id: 'c_promesas', texto: 'Haz tres promesas electorales', premio: { prestigio: 4 }, hecho: s => s.carrera.promesas.length >= MAX_PROMESAS },
  { id: 'c_primero', texto: 'Ponte primero en las encuestas', premio: { fondos: 80 }, hecho: s => ganaJugador(estimarVotos(s, false)) },
];

// Metas del modo provincial: de una sola sede al gobierno.
const OBJETIVOS_PROVINCIAL = [
  { id: 'p_sede2', texto: 'Abre una segunda sede', premio: { fondos: 40 }, hecho: s => Object.keys(s.carrera.sedes || {}).length >= 2 },
  { id: 'p_prestigio', texto: 'Alcanza 20 de prestigio', premio: { fondos: 40 }, hecho: s => s.carrera.prestigio >= 20 },
  { id: 'p_escano', texto: 'Consigue tu primer escaño', premio: { cp: 3 }, hecho: s => s.escanos[ID_JUGADOR] >= 1 },
  { id: 'p_mitad', texto: 'Ten sede en la mitad de las provincias', premio: { fondos: 80 }, hecho: s => Object.keys(s.carrera.sedes || {}).length * 2 >= provinciasJugador().length },
  { id: 'p_ley', texto: 'Lleva una ley a votación', premio: { prestigio: 4 }, hecho: s => s.cuenta.propuestas >= 1 },
  { id: 'p_50', texto: 'Llega a 50 escaños', premio: { fondos: 100 }, hecho: s => s.escanos[ID_JUGADOR] >= 50 },
  { id: 'p_todas', texto: 'Ten sede en todas las provincias', premio: { prestigio: 6 }, hecho: s => Object.keys(s.carrera.sedes || {}).length >= provinciasJugador().length },
];

const LEY_POR_ID = Object.fromEntries(LEYES.map(l => [l.id, l]));
// Qué leyes chocan con cada una, en los dos sentidos (basta con que una de las dos lo diga).
const INCOMPATIBLES = Object.fromEntries(LEYES.map(l => [l.id, []]));
for (const l of LEYES) {
  for (const otra of l.incompatible || []) {
    if (!INCOMPATIBLES[l.id].includes(otra)) INCOMPATIBLES[l.id].push(otra);
    if (!INCOMPATIBLES[otra].includes(l.id)) INCOMPATIBLES[otra].push(l.id);
  }
}
const EVENTO_POR_ID = Object.fromEntries([...EVENTOS, ...EVENTOS_CARRERA].map(e => [e.id, e]));
const CAND_POR_ID = Object.fromEntries(CANDIDATOS.map(c => [c.id, c]));
