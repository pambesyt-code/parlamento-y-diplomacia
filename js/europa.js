'use strict';
// El mapa secreto: si el número del mapa es la palabra EUROPA, el mundo es Europa con sus países.
// Las costas son polígonos en longitud y latitud, algo exagerados en los estrechos para que el mar
// quepa en la rejilla. Cada provincia es un punto: la tierra se reparte a la capital más cercana.
// La primera provincia de cada país es su capital.

const esEuropa = semilla => String(semilla).trim().toUpperCase() === 'EUROPA';

// ----- Banderas (21×14) -----
const _bH = (...c) => c.map((col, i) => `<rect y="${(14 * i / c.length).toFixed(2)}" width="21" height="${(14 / c.length + 0.05).toFixed(2)}" fill="${col}"/>`).join('');
const _bV = (...c) => c.map((col, i) => `<rect x="${(21 * i / c.length).toFixed(2)}" width="${(21 / c.length + 0.05).toFixed(2)}" height="14" fill="${col}"/>`).join('');
const _bN = (fondo, cruz, dentro) => `<rect width="21" height="14" fill="${fondo}"/><rect x="5.5" width="3.6" height="14" fill="${cruz}"/><rect y="5.2" width="21" height="3.6" fill="${cruz}"/>`
  + (dentro ? `<rect x="6.4" width="1.8" height="14" fill="${dentro}"/><rect y="6.1" width="21" height="1.8" fill="${dentro}"/>` : '');
const _bF = col => `<rect width="21" height="14" fill="${col}"/>`;

const EUROPA = {
  kx: 1.2, ky: 1.9,
  tierras: [
    // Continente: de Bretaña hacia el este por la costa norte, baja por Rusia, vuelve por el Mediterráneo.
    [[-4.6, 47.9], [-4.6, 48.6], [-3, 48.9], [-1.6, 48.7], [-1.7, 49.7], [-1.1, 49.4], [0.2, 49.6], [1.6, 50.3], [1.8, 50.7], [2.6, 51.1],
      [3.5, 51.5], [4.2, 52.2], [4.8, 53], [6.2, 53.5], [7.2, 53.7], [8.5, 53.6], [8.9, 54.2], [9.9, 54.3], [10.8, 54], [12.2, 54.3],
      [13.6, 54.4], [14.3, 53.9], [16.2, 54.3], [18.3, 54.8], [19.5, 54.4], [21, 54.5], [21.1, 55.5], [21, 56.3], [21.4, 57.4], [22.6, 57.7],
      [23.3, 57], [24.3, 57.2], [24.4, 58.3], [23.4, 58.6], [23.4, 59.1], [25, 59.3], [27.5, 59.3], [28.5, 59.6], [30.3, 59.9],
      [30.5, 61.5], [35, 64.3], [37, 64], [40, 64.6], [40, 66.3], [44, 66.5], [44, 68], [45.4, 68.2],
      [45.2, 62], [45.5, 55], [45.2, 48], [45.4, 43.6], [40, 43.4], [38.2, 44.4], [37.3, 45.3], [38, 46], [39.2, 47.1], [37.5, 47],
      [35.3, 46.4], [35.2, 45.5], [36.4, 45.3], [35.4, 44.9], [33.6, 44.4], [32.6, 45.4], [33.6, 46], [32, 46.4], [30.8, 46.5],
      [29.7, 45.2], [28.6, 44], [28, 43.2], [27.6, 42.5], [28.1, 41.8], [29, 41.2], [27.5, 40.9], [26.2, 40.5], [26, 40.9], [24.4, 40.9],
      [23.8, 40.2], [22.8, 40.5], [22.9, 39.4], [24, 38.2], [23.2, 37.6], [23, 36.5], [22.4, 36.5], [21.7, 36.8], [21.2, 37.8],
      [21.1, 38.4], [20.4, 39.5], [19.4, 40.4], [19.5, 41.6], [19.2, 42], [18.5, 42.4], [17.5, 43], [16, 43.5], [15.2, 44.2],
      [14.6, 45.2], [13.6, 44.9], [13.6, 45.6], [12.4, 45.4], [12.3, 44.3], [11, 44], [8.8, 44.4], [7.5, 43.8], [6, 43.1], [4.5, 43.4],
      [3.2, 43.2], [3.1, 42.4], [3.2, 41.9], [2, 41.3], [0.5, 40.5], [-0.3, 39.3], [0.1, 38.7], [-0.8, 37.6], [-2.2, 36.8], [-4.5, 36.6],
      [-5.6, 36], [-6.4, 36.8], [-7.4, 37.2], [-8.9, 37], [-8.8, 38.5], [-9.5, 38.8], [-8.9, 40.2], [-8.7, 41.8], [-9.3, 43], [-8, 43.8],
      [-4, 43.5], [-1.8, 43.4], [-1.2, 44.6], [-1.2, 46.2], [-2.2, 47.2]],
    // Italia
    [[8.8, 44.4], [10.2, 43.9], [10.5, 42.9], [11.8, 42.1], [12.6, 41.4], [14, 40.8], [15.6, 40], [15.7, 38.9], [15.7, 37.95], [16.2, 38],
      [16.6, 38.8], [17.1, 39], [16.6, 39.7], [16.9, 40.4], [18.2, 39.9], [18.5, 40.2], [17.9, 40.8], [16, 41.4], [16.1, 41.9], [15, 42],
      [13.6, 43.6], [12.5, 44.1], [12.3, 44.3], [12.4, 45.4], [11, 45.5]],
    // Sicilia (pegada a Calabria)
    [[12.4, 37.9], [13.4, 38.3], [15.7, 38.35], [15.9, 37.9], [15.3, 37], [15, 36.6], [13.8, 37], [12.5, 37.5]],
    // Jutlandia y las islas danesas
    [[8.6, 53.8], [8.2, 55.5], [8.2, 56.6], [9.6, 57], [10.5, 57], [10.4, 56.5], [10.9, 56.3], [10.4, 55.9], [12, 56], [12, 55.2],
      [11.6, 54.7], [10.8, 54.8], [10, 54.5], [9.9, 54.2]],
    // Escandinavia, Finlandia, Carelia y Kola
    [[5.2, 59], [5, 61.5], [6, 62.6], [8.5, 63.6], [11, 64.8], [12.5, 66], [14, 67.8], [16.5, 68.8], [19, 70], [23, 70.8], [26, 71.1],
      [29, 70.8], [31, 70.1], [33, 69.5], [37, 68.8], [41, 67.6], [41, 66.4], [38, 66.1], [33.5, 66.4], [34.8, 65], [35, 64.3], [30.3, 59.9],
      [29, 60.5], [27, 60.5], [25, 60.3], [23, 60], [22, 60.5], [21.4, 61.5], [21.3, 62.8], [22.5, 63.6], [24.5, 64.6], [25.3, 65.3],
      [24.5, 65.8], [22.3, 65.6], [21.2, 64.4], [19.5, 63.4], [17.8, 62.5], [17.3, 61.2], [17.2, 60.5], [18.6, 60], [18.9, 59.4], [17, 58.6],
      [16.6, 57.5], [16, 56.3], [14.6, 56.1], [14.3, 55.5], [13.4, 55.4], [13.2, 56.3], [12.4, 57.2], [12.3, 57.8], [11.3, 58.9],
      [10.6, 59.6], [10.2, 59.1], [8.8, 58.6], [7, 58.4], [5.6, 58.8]],
    // Anatolia
    [[26.3, 40.1], [26.6, 40.6], [27.5, 41], [28.6, 41.4], [29.6, 41.3], [31.5, 41.3], [33.5, 42], [35.2, 42], [36.5, 41.3], [37.4, 41.1], [37.2, 36.7], [36, 36.6],
      [34.5, 36.7], [32.5, 36.1], [30.6, 36.8], [29, 36.2], [27.5, 36.8], [26.4, 38.3], [26.2, 39.3]],
    // Gran Bretaña (algo al noroeste de su sitio, para que quepa el canal)
    [[-6.4, 50.9], [-4.9, 51.1], [-2.5, 51.4], [0.4, 51.9], [0.2, 52.4], [0.9, 53.5], [-0.8, 54.4], [-2.2, 55.8], [-2.8, 56.8], [-2.8, 58],
      [-3.8, 59.4], [-5.8, 59.3], [-6.6, 58], [-6.2, 56.6], [-5.6, 55.6], [-4, 55.4], [-3.8, 54.4], [-5.4, 54], [-5.4, 52.6], [-3.8, 52.4],
      [-5, 51.9]],
    // Irlanda
    [[-12.2, 52.4], [-10.2, 52.3], [-8.5, 53], [-8.2, 54.2], [-7.7, 55.3], [-8.4, 56.1], [-10.5, 56.1], [-12.2, 55.1], [-12, 54], [-12.6, 53]],
    // Islandia (más cerca de lo que está)
    [[-18.5, 65.5], [-17, 66.3], [-14, 66.4], [-11.5, 65.5], [-12, 64.4], [-15, 63.6], [-18, 64.2]],
  ],
  paises: {
    pt: { nombre: 'Portugal', estilo: 'latino', bandera: _bF('#da291c') + '<rect width="8.4" height="14" fill="#046a38"/><circle cx="8.4" cy="7" r="2.5" fill="#ffe900"/>',
      provs: [[-8.9, 39, 'Lisboa'], [-8.2, 41.3, 'Oporto'], [-8.2, 37.6, 'Faro']] },
    es: { nombre: 'España', estilo: 'latino', bandera: _bF('#aa151b') + '<rect y="3.5" width="21" height="7" fill="#f1bf00"/>',
      provs: [[-3.7, 40.4, 'Madrid'], [-7.9, 42.9, 'La Coruña'], [-5, 41.9, 'Valladolid'], [-2.8, 43, 'Bilbao'], [-0.9, 41.7, 'Zaragoza'],
        [1.6, 41.6, 'Barcelona'], [-0.6, 39.5, 'Valencia'], [-5.6, 37.5, 'Sevilla'], [-6.4, 39.2, 'Mérida'], [-2.6, 37.6, 'Granada']] },
    fr: { nombre: 'Francia', estilo: 'latino', bandera: _bV('#0055a4', '#ffffff', '#ef4135'),
      provs: [[2.3, 48.9, 'París'], [-2, 48.1, 'Rennes'], [-0.6, 44.9, 'Burdeos'], [1.5, 43.6, 'Toulouse'], [4.8, 45.7, 'Lyon'],
        [5.4, 43.5, 'Marsella'], [6, 48.8, 'Nancy'], [2.9, 50.4, 'Lille'], [1, 47.2, 'Tours']] },
    be: { nombre: 'Bélgica', estilo: 'germanico', bandera: _bV('#1a1a1a', '#fdda24', '#ef3340'), provs: [[4.4, 50.7, 'Bruselas']] },
    nl: { nombre: 'Países Bajos', estilo: 'germanico', bandera: _bH('#ae1c28', '#ffffff', '#21468b'), provs: [[5.2, 52.4, 'Ámsterdam']] },
    de: { nombre: 'Alemania', estilo: 'germanico', bandera: _bH('#1a1a1a', '#dd0000', '#ffce00'),
      provs: [[13.4, 52.6, 'Berlín'], [9.8, 53.4, 'Hamburgo'], [7.3, 51, 'Colonia'], [9, 50, 'Fráncfort'], [8.8, 48.6, 'Stuttgart'],
        [11.5, 48.6, 'Múnich'], [12.4, 51.3, 'Leipzig']] },
    ch: { nombre: 'Suiza', estilo: 'germanico', bandera: _bF('#da291c') + '<rect x="9" y="3" width="3" height="8" fill="#fff"/><rect x="6.5" y="5.5" width="8" height="3" fill="#fff"/>',
      provs: [[7.8, 46.8, 'Berna']] },
    at: { nombre: 'Austria', estilo: 'germanico', bandera: _bH('#ed2939', '#ffffff', '#ed2939'),
      provs: [[16.3, 48.2, 'Viena'], [11.6, 47.1, 'Innsbruck'], [14.8, 47.1, 'Graz']] },
    it: { nombre: 'Italia', estilo: 'latino', bandera: _bV('#009246', '#ffffff', '#ce2b37'),
      provs: [[12.5, 41.9, 'Roma'], [8.6, 45.2, 'Milán'], [11.8, 45.4, 'Venecia'], [11.2, 43.7, 'Florencia'], [14.6, 40.8, 'Nápoles'],
        [17.3, 40.5, 'Bari'], [16.2, 39, 'Catanzaro'], [13.8, 37.6, 'Palermo']] },
    si: { nombre: 'Eslovenia', estilo: 'eslavo', bandera: _bH('#ffffff', '#0057b8', '#ed1c24') + '<path d="M3 2h3.5v3.2L4.75 6.5 3 5.200z" fill="#0057b8" stroke="#ed1c24" stroke-width=".5"/>',
      provs: [[14.3, 46, 'Liubliana']] },
    hr: { nombre: 'Croacia', estilo: 'eslavo', bandera: _bH('#ff0000', '#ffffff', '#171796') + '<rect x="8.5" y="4.5" width="4" height="5" fill="#fff" stroke="#ff0000" stroke-width=".6"/><rect x="8.5" y="4.5" width="2" height="2.5" fill="#ff0000"/><rect x="10.5" y="7" width="2" height="2.5" fill="#ff0000"/>',
      provs: [[16.4, 45.6, 'Zagreb'], [16.4, 43.7, 'Split']] },
    ba: { nombre: 'Bosnia y Herzegovina', estilo: 'eslavo', bandera: _bF('#002f6c') + '<path d="M6 0h10v14z" fill="#fecb00"/>', provs: [[18.2, 44, 'Sarajevo']] },
    rs: { nombre: 'Serbia', estilo: 'eslavo', bandera: _bH('#c6363c', '#0c4076', '#ffffff'), provs: [[20.6, 44.7, 'Belgrado'], [21.4, 43.4, 'Niš']] },
    me: { nombre: 'Montenegro', estilo: 'eslavo', bandera: _bF('#d4af37') + '<rect x="1" y="1" width="19" height="12" fill="#c40308"/><circle cx="10.5" cy="7" r="2.4" fill="#d4af37"/>',
      provs: [[19.3, 42.6, 'Podgorica']] },
    al: { nombre: 'Albania', estilo: 'eslavo', bandera: _bF('#e41e20') + '<path d="M10.5 2.5l1.6 2.3 2.9-.8-1.7 3 1.700 3-2.900-.800-1.600 2.300-1.600-2.300-2.900.800 1.700-3-1.700-3 2.900.800z" fill="#1a1a1a"/>',
      provs: [[20, 41.2, 'Tirana']] },
    mk: { nombre: 'Macedonia del Norte', estilo: 'eslavo', bandera: _bF('#d20000') + '<path d="M0 0L21 14M21 0L0 14M10.5 0v14M0 7h21" stroke="#ffe600" stroke-width="1.6"/><circle cx="10.5" cy="7" r="2.6" fill="#ffe600" stroke="#d20000" stroke-width=".7"/>',
      provs: [[22, 41.6, 'Skopie']] },
    gr: { nombre: 'Grecia', estilo: 'isleno', bandera: _bH('#0d5eaf', '#ffffff', '#0d5eaf', '#ffffff', '#0d5eaf', '#ffffff', '#0d5eaf') + '<rect width="8" height="8" fill="#0d5eaf"/><rect x="3.2" width="1.6" height="8" fill="#fff"/><rect y="3.2" width="8" height="1.6" fill="#fff"/>',
      provs: [[23.6, 38.1, 'Atenas'], [23.2, 40.4, 'Salónica'], [20.9, 39.6, 'Ioánina'], [21.9, 37.2, 'Trípoli']] },
    bg: { nombre: 'Bulgaria', estilo: 'eslavo', bandera: _bH('#ffffff', '#00966e', '#d62612'), provs: [[23.4, 42.7, 'Sofía'], [27, 43, 'Varna'], [25.2, 42.1, 'Plovdiv']] },
    ro: { nombre: 'Rumanía', estilo: 'latino', bandera: _bV('#002b7f', '#fcd116', '#ce1126'),
      provs: [[26.1, 44.4, 'Bucarest'], [23.6, 46.8, 'Cluj'], [21.5, 45.6, 'Timisoara'], [26.6, 46.6, 'Bacau'], [28.3, 44.6, 'Constanza']] },
    md: { nombre: 'Moldavia', estilo: 'latino', bandera: _bV('#0046ae', '#ffd200', '#cc092f') + '<circle cx="10.5" cy="7" r="1.7" fill="#a77b3b"/>', provs: [[28.9, 47.1, 'Chisináu']] },
    hu: { nombre: 'Hungría', estilo: 'eslavo', bandera: _bH('#ce2939', '#ffffff', '#477050'), provs: [[19.3, 47.3, 'Budapest'], [21.4, 47.5, 'Debrecen'], [18.2, 46.1, 'Pécs']] },
    sk: { nombre: 'Eslovaquia', estilo: 'eslavo', bandera: _bH('#ffffff', '#0b4ea2', '#ee1c25') + '<path d="M4 3.500h4.500v4c0 1.600-1 2.600-2.250 3.200C5 10.100 4 9.100 4 7.500z" fill="#ee1c25" stroke="#fff" stroke-width=".6"/>',
      provs: [[18.6, 48.7, 'Bratislava'], [21.2, 48.8, 'Košice']] },
    cz: { nombre: 'Chequia', estilo: 'eslavo', bandera: _bH('#ffffff', '#d7141a') + '<path d="M0 0l10 7-10 7z" fill="#11457e"/>', provs: [[14.4, 50.1, 'Praga'], [16.9, 49.6, 'Brno']] },
    pl: { nombre: 'Polonia', estilo: 'eslavo', bandera: _bH('#ffffff', '#dc143c'),
      provs: [[21, 52.2, 'Varsovia'], [20, 50.1, 'Cracovia'], [17, 52.4, 'Poznan'], [18.6, 54.2, 'Gdansk'], [17, 51, 'Breslavia'], [22.8, 51, 'Lublin']] },
    dk: { nombre: 'Dinamarca', estilo: 'nordico', bandera: _bN('#c8102e', '#ffffff'), provs: [[11.4, 55.4, 'Copenhague'], [9.4, 56.3, 'Aarhus']] },
    no: { nombre: 'Noruega', estilo: 'nordico', bandera: _bN('#ba0c2f', '#ffffff', '#00205b'),
      provs: [[10.6, 60.2, 'Oslo'], [6.3, 60.4, 'Bergen'], [10.8, 63.4, 'Trondheim'], [15, 67.2, 'Bodø'], [20.5, 69.4, 'Tromsø'], [26, 70.3, 'Alta']] },
    se: { nombre: 'Suecia', estilo: 'nordico', bandera: _bN('#006aa7', '#fecc02'),
      provs: [[17.5, 59.4, 'Estocolmo'], [13.2, 57.9, 'Gotemburgo'], [14.4, 56.3, 'Malmö'], [13.7, 60.4, 'Karlstad'], [15, 63, 'Östersund'],
        [19.3, 64.2, 'Umeå'], [20.3, 67.4, 'Kiruna']] },
    fi: { nombre: 'Finlandia', estilo: 'nordico', bandera: _bN('#ffffff', '#003580'),
      provs: [[25, 60.7, 'Helsinki'], [22.8, 62.8, 'Vaasa'], [26.5, 65, 'Oulu'], [26.5, 67.8, 'Rovaniemi'], [28.5, 62.8, 'Kuopio']] },
    ee: { nombre: 'Estonia', estilo: 'nordico', bandera: _bH('#0072ce', '#1a1a1a', '#ffffff'), provs: [[25.5, 58.7, 'Tallin']] },
    lv: { nombre: 'Letonia', estilo: 'nordico', bandera: _bF('#9e3039') + '<rect y="5.6" width="21" height="2.8" fill="#fff"/>', provs: [[24.6, 56.9, 'Riga'], [22, 56.8, 'Liepaja']] },
    lt: { nombre: 'Lituania', estilo: 'nordico', bandera: _bH('#fdb913', '#006a44', '#c1272d'), provs: [[25, 54.9, 'Vilna'], [21.9, 55.3, 'Klaipeda']] },
    by: { nombre: 'Bielorrusia', estilo: 'eslavo', bandera: _bF('#d22730') + '<rect y="9.3" width="21" height="4.7" fill="#00af66"/><rect width="2.4" height="14" fill="#fff"/><path d="M1.2 0v14" stroke="#d22730" stroke-width=".8" stroke-dasharray="1.2 1"/>',
      provs: [[27.6, 53.9, 'Minsk'], [24.5, 52.3, 'Brest'], [30.5, 52.6, 'Gómel'], [29.5, 55.3, 'Vítebsk']] },
    ua: { nombre: 'Ucrania', estilo: 'eslavo', bandera: _bH('#0057b7', '#ffd700'),
      provs: [[30.5, 50.4, 'Kiev'], [24, 49.8, 'Leópolis'], [28.3, 49.2, 'Vínnitsa'], [31.2, 46.9, 'Odesa'], [36.2, 49.9, 'Járkov'],
        [35, 48.2, 'Dnipró'], [38, 48.1, 'Donetsk'], [34.2, 45.1, 'Sebastopol']] },
    ru: { nombre: 'Rusia', estilo: 'eslavo', bandera: _bH('#ffffff', '#0039a6', '#d52b1e'),
      provs: [[37.6, 55.7, 'Moscú'], [30.6, 59.6, 'San Petersburgo'], [32.5, 57.8, 'Nóvgorod'], [32.5, 55, 'Smolensk'], [35.5, 57.3, 'Tver'],
        [36, 52, 'Kursk'], [40, 51.3, 'Vorónezh'], [40.8, 47.3, 'Rostov'], [43.5, 49, 'Volgogrado'], [39.5, 45, 'Krasnodar'],
        [43, 45, 'Stávropol'], [43, 56.5, 'Nizhni Nóvgorod'], [44, 52.5, 'Sarátov'], [40, 59.5, 'Vólogda'], [41, 64.2, 'Arcángel'],
        [33, 64, 'Carelia'], [34.5, 68, 'Múrmansk']] },
    tr: { nombre: 'Turquía', estilo: 'desierto', bandera: _bF('#e30a17') + '<circle cx="8" cy="7" r="3.4" fill="#fff"/><circle cx="8.9" cy="7" r="2.7" fill="#e30a17"/><circle cx="12.3" cy="7" r="1.1" fill="#fff"/>',
      provs: [[32.8, 39.9, 'Ankara'], [28.4, 41.2, 'Estambul'], [27.8, 38.5, 'Esmirna'], [31, 37.2, 'Antalya'], [35.3, 37.3, 'Adana'], [35.5, 40.8, 'Samsun']] },
    is: { nombre: 'Islandia', estilo: 'nordico', bandera: _bN('#02529c', '#ffffff', '#dc1e35'), provs: [[-17, 64.6, 'Reikiavik'], [-13.5, 65.5, 'Akureyri']] },
    ie: { nombre: 'Irlanda', estilo: 'isleno', bandera: _bV('#169b62', '#ffffff', '#ff883e'), provs: [[-8.8, 54.1, 'Dublín'], [-10.6, 52.9, 'Cork'], [-11.2, 54.5, 'Galway']] },
    uk: { nombre: 'Reino Unido', estilo: 'isleno',
      bandera: _bF('#012169') + '<path d="M0 0L21 14M21 0L0 14" stroke="#fff" stroke-width="2.8"/><path d="M0 0L21 14M21 0L0 14" stroke="#c8102e" stroke-width="1"/><path d="M10.5 0v14M0 7h21" stroke="#fff" stroke-width="4.4"/><path d="M10.5 0v14M0 7h21" stroke="#c8102e" stroke-width="2.4"/>',
      provs: [[-0.9, 52.3, 'Londres'], [-4.3, 51.5, 'Plymouth'], [-4.4, 53.2, 'Cardiff'], [-2.2, 54.7, 'Mánchester'], [-4.2, 57.3, 'Edimburgo'], [-8.6, 55.5, 'Belfast']] },
  },
};
const EUROPA_POR_DEFECTO = 'es';

function dentroPoligono(x, y, pol) {
  let dentro = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, yi] = pol[i], [xj, yj] = pol[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

// Países de Europa para el selector del menú, de más a menos provincias.
function paisesEuropa() {
  return Object.keys(EUROPA.paises).map(id => ({ id, nombre: EUROPA.paises[id].nombre, bandera: EUROPA.paises[id].bandera, provincias: EUROPA.paises[id].provs.length }))
    .sort((a, b) => b.provincias - a.provincias || a.nombre.localeCompare(b.nombre, 'es'));
}

// Crea Europa y rellena NACIONES. elegido: el país que lleva el jugador.
// libre: el mundo del multijugador, donde ningún país está reservado y cada jugador elige el suyo.
function mundoEuropa(elegido, libre) {
  const E = EUROPA;
  if (libre) elegido = null;
  else if (!E.paises[elegido]) elegido = EUROPA_POR_DEFECTO;
  // Cada país elegido da una Europa con otros gobiernos y otras rivalidades.
  const rng = crearAzar([...(elegido || 'libre')].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 1957));
  const idDe = cod => (cod === elegido ? idHumano(0) : 'e' + cod);
  const provs = [];
  for (const cod in E.paises) E.paises[cod].provs.forEach(([lon, lat, nombre], i) => {
    provs.push({ id: 'p' + provs.length, x: lon * E.kx, y: -lat * E.ky, grupo: 0, radio: 1, nombre, pais: idDe(cod), capital: i === 0 });
  });
  const geo = calcularGeometria(provs, (x, y) => E.tierras.some(pol => dentroPoligono(x / E.kx, -y / E.ky, pol)));
  const porId = Object.fromEntries(provs.map(p => [p.id, p]));

  for (const k in NACIONES) delete NACIONES[k];
  // Cada país toma un color que no lleve ninguno de sus vecinos.
  let paleta = COLORES_MAPA.filter(col => COLORES_PAIS.every(cp => distanciaColor(col, cp) > 60));
  if (paleta.length < 6) paleta = COLORES_MAPA;
  // Con 38 países hacen falta más tonos: cada color, además, algo más claro y algo más oscuro.
  paleta = [...paleta, ...paleta.map(c => mezclar(c, '#ffffff', 0.3)), ...paleta.map(c => mezclar(c, '#2a2622', 0.22))];
  const usos = Object.fromEntries(paleta.map(c => [c, 0]));
  const vecinosDe = pid => new Set(provs.filter(p => p.pais === pid).flatMap(p => geo.vecinos[p.id].map(v => porId[v].pais)));
  for (const cod in E.paises) {
    const P = E.paises[cod], pid = idDe(cod), mias = provs.filter(p => p.pais === pid), n = mias.length, capital = mias.find(p => p.capital).id;
    if (cod === elegido) {
      NACIONES[pid] = {
        humano: true, nombre: P.nombre, estilo: P.estilo, color: COLORES_PAIS[0], bandera: '', banderaFija: P.bandera,
        gobierno: 'República', desc: '', relacion: 0, comercio: 30, ejercito: TROPAS_INICIALES, provincias: n, rival: null, capitalProv: capital,
      };
      continue;
    }
    const tomados = new Set([...vecinosDe(pid)].map(v => NACIONES[v] && NACIONES[v].color));
    const color = [...paleta].sort((a, b) => (tomados.has(a) - tomados.has(b)) || usos[a] - usos[b])[0];
    usos[color]++;
    const car = CARACTERES[Math.floor(rng() * CARACTERES.length)];
    NACIONES[pid] = {
      nombre: P.nombre, estilo: P.estilo, color, bandera: P.bandera, banderaFija: P.bandera, gobierno: car.gobierno, desc: car.desc,
      relacion: car.relacion + entre(rng, -8, 8), comercio: Math.round(car.comercio * (0.6 + 0.15 * Math.min(n, 8))),
      ejercito: Math.max(2, Math.round(n * car.fuerza + rng() * 1.5)), provincias: n, rival: null, capitalProv: capital,
    };
  }
  ponerRivales(rng, provs, geo, libre ? [] : [idHumano(0)]);
  return { rng, provs, geo, libre: !!libre };
}

// En Europa hay países de una, dos o tres provincias, y los gastos del Estado no entienden de tamaños.
// Para que se puedan jugar, el del jugador concentra en ellas más gente, tierra buena y solares.
// En el multijugador (libre) cualquier país puede acabar en manos de un jugador: se compensan todos.
function compensarPaisPequeno(provs, libre) {
  for (const pid in NACIONES) if (libre || NACIONES[pid].humano) compensarUno(provs.filter(p => p.pais === pid));
}
function compensarUno(mias) {
  const n = mias.length;
  if (!n || n > 4) return;
  const gente = [0, 2.6, 1.8, 1.45, 1.2][n];
  for (const p of mias) p.pob = Math.round(p.pob * gente / 10) * 10;
  if (n > 3) return;
  for (const p of mias) {
    p.fertil = p.mineral = true;
    p.solares = [0, 12, 7, 5][n] + (p.capital ? 1 : 0);
  }
  const hay = k => mias.reduce((a, p) => a + ((p.ini && p.ini[k]) || 0), 0);
  const capital = mias.find(p => p.capital), mina = hay('mina') ? 0 : 1, granjas = Math.max(0, 2 - hay('granja'));
  capital.ini = { fabrica: 1, ...(mina ? { mina } : {}), ...(granjas ? { granja: granjas } : {}) };
}
