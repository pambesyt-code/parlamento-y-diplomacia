// Ventana «Novedades»: el registro de cambios dentro del juego.
// Copia de CHANGELOG.md (va aquí porque abriendo index.html con doble clic el navegador no deja leer archivos).
// Al publicar una versión: añadir su entrada arriba, aquí y en CHANGELOG.md.

const TEXTO_NOVEDADES = `
## 📲 Versión 2.5.1 — *«En tu bolsillo»* (18/11/2026)

### ✨ Novedades

- 🍎 **Instálalo en el iPhone**: abre el juego en **Safari**, toca **Compartir** y luego **«Añadir a pantalla de inicio»**. Tendrás su **icono** y se abrirá **a pantalla completa**, como una app más.
- 🤖 En **Android** también se puede instalar desde **Chrome** (menú ⋮ → **«Instalar app»**), además de con la **app para Android**.

### 🔧 Cambios

- 🏛️ El juego tiene ahora **icono propio** al guardarlo en la pantalla de inicio o en marcadores.

---

## 🧭 Versión 2.5 — *«A tu alcance»* (18/11/2026)

### ✨ Novedades

- 📱 **Barra inferior en el móvil y la tableta**: las pestañas (Provincias, Economía, Parlamento…) bajan al borde de la pantalla, al alcance del pulgar. **Al tocar una, te lleva directo a su contenido**, sin tener que buscarlo más abajo.
- 💰 **Tus cifras, siempre a la vista**: justo encima de las pestañas se quedan fijos el **dinero**, el **capital político** y la **popularidad** (o los fondos y la encuesta, en la carrera), junto al botón **Siguiente mes**.
- 🎨 **Un color para cada sección**: Provincias 🟠, Economía 🟢, Parlamento 🔵, Gobierno 🟡, Diplomacia 🩵, Defensa 🔴 y Sociedad 🟣. El color marca el icono de la pestaña, el título y un filo en las tarjetas, para que sepas siempre dónde estás.
- 🏷️ **Cifras de la cabecera con iconos de color** y **menú principal** con un icono de color en cada botón.
- 🗺️ **Un mapa que se lee en el móvil**: más alto, **se abre centrado en tu país**, con las modalidades deslizables y la leyenda debajo, en una fila que se desliza.
- 🪟 **Las ventanas son hojas que suben desde abajo** en el móvil, a todo el ancho de la pantalla.
- 🖥️ **En PC**: la cabecera queda en **dos filas parejas** y las pestañas muestran su **número (1 al 7)**, el atajo de teclado de siempre.

### 🔧 Cambios

- 👆 Botones, selectores y filtros más grandes en pantallas táctiles (al menos 40 píxeles).
- 📋 Las filas de partidos y las **mejores inversiones** se parten en dos líneas en vez de cortar los nombres.
- 🔔 Con una ventana abierta, los **avisos salen arriba** para no tapar sus botones.
- 🎓 El **tutorial** se coloca encima de la barra inferior y su puntero la tiene en cuenta.
- 🔤 Las tarjetas y filas largas (Sociedad, Diplomacia, Economía) se parten en dos líneas en vez de salirse de la pantalla, también con texto grande o el tema oscuro.

### 🐛 Correcciones

- 📏 Al girar el móvil o cambiar el tamaño de la ventana, el panel de la derecha se quedaba mal colocado hasta el siguiente turno.

---

## ✨ Versión 2.4 — *«Con relieve»* (16/11/2026)

### ✨ Novedades

- 🧊 **Toques en 3D**:
  - Los botones del menú y las tarjetas de opciones **se inclinan hacia el ratón**.
  - El hemiciclo y el mapa del menú **giran un poco** siguiendo al puntero.
  - Las ventanas **entran girando** hacia ti y el título del juego tiene relieve.
  - La **insignia** de tu partido **da la vuelta como una moneda** cuando cambias su diseño (y en la cabecera, al pasar el ratón).
- 🗺️ **Un mapa con más vida**:
  - ☁️ **Sombras de nubes** que cruzan el mapa despacio.
  - 🌄 Las **provincias se levantan** al pasar el ratón y los bordes del mapa ganan profundidad.
  - 💫 Un **destello** recorre el mapa cada vez que pasa un mes.
- 🏛️ Al abrir el Parlamento, los **350 escaños brotan en oleada**.
- 📅 La **fecha cambia como una hoja de calendario** y el icono de cada pestaña da un saltito al abrirla.

### 🔧 Cambios

- ⚙️ Todo esto se apaga con la opción **Animaciones**. En móvil no hay inclinación (no hay ratón), pero sí nubes, destello y escaños.

---

## 🎓 Versión 2.3 — *«De la mano»* (16/11/2026)

### ✨ Novedades

- 🧭 **Tutoriales nuevos, mucho más guiados**: ahora el tutorial **te lleva solo a cada pestaña** y te explica qué estás viendo antes de pedirte que lo pruebes.
- 👆 **Un puntero señala dónde pulsar** y una casilla te dice la **tarea** de cada paso: nada de buscar el botón.
- 🖼️ **Tarjeta más visual**: cada paso tiene su icono y un dibujo (tus escaños frente a la mayoría, la cadena granja → fábrica → dinero, el apoyo de cada grupo…).
- ⭐ **El capital político, por fin explicado**: cuánto tienes, cuánto recuperas al mes y **lo que cuesta cada decisión**.
- 📚 **Capítulos**: la barra de arriba muestra en qué parte vas (primeros pasos, tu país, leyes y pactos, tu gobierno, tus votantes, el mundo).
- 🤝 **Todo lo nuevo, dentro del tutorial**:
  - Los **pactos de gobierno**: cierras uno de verdad y ves qué es gobernar en mayoría o en minoría.
  - La **investidura**, en el tutorial completo: negocias con los partidos hasta sumar más que tu rival.
  - **Monarquía o república** y el referéndum.
  - Los **mítines**, la política de **los demás países**, el diseño de la **insignia**, las costumbres y los tres modos de juego.

### 🔧 Cambios

- ↩️ Botón **Atrás** para releer la explicación anterior, y **«Llévame allí»** si te has ido a otra pestaña.
- 🎯 En la partida de práctica empiezas **sin mayoría absoluta**, para que pactar tenga sentido.
- 🗳️ En los tutoriales ya no gobierna «el más votado»: funcionan los pactos, como en una partida normal.
- 🌐 Todo el tutorial nuevo está **traducido** a inglés, alemán, francés y portugués.

### 🐛 Correcciones

- 🔤 Dos explicaciones del tutorial completo se quedaban en español al jugar en otro idioma.

---

## 🎨 Versión 2.2 — *«Tu partido, tu sello»* (16/11/2026)

### ✨ Novedades

- 🛡️ **Diseña la insignia de tu partido**: ya no es solo un círculo con un dibujo.
  - 🔷 **4 formas**: círculo, cuadrado, escudo y hexágono.
  - 🌗 **5 fondos con dos colores**: liso, dos mitades, diagonal, franja y aro. Eliges los dos colores que quieras.
  - 🖌️ **Color del símbolo** a tu gusto: blanco, dorado, negro o cualquier otro.
- ⭐ **61 símbolos** para elegir (antes había 5): corazón, rayo, puño, cohete, átomo, árbol, llama, libro, ojo, tridente, signo de la paz y muchos más.
- 🔤 **Letras en la insignia**: escribe hasta **4 letras o números** (las siglas de tu partido, por ejemplo) y sustituyen al símbolo.
- 👀 Tu insignia se ve **en todo el juego**: hemiciclo, encuestas, pactos, mapa electoral y sala de multijugador.
- 🤫 **Hay un mapa secreto.** Dicen que, si en el número del mapa escribes el nombre de cierto **continente**, el mundo deja de ser inventado… y que funciona **también con amigos**.

### 🔧 Cambios

- 🗺️ La casilla del número del mapa ahora también admite letras, también en la sala de multijugador.
- ✏️ Los **nombres de partido** pueden ser más largos: hasta **40 caracteres**.
- 🌐 Todo lo nuevo está **traducido** a inglés, alemán, francés y portugués.

---

## 🗳️ Versión 2.1 — *«Pactos y Coronas»* (16/11/2026)

### ✨ Novedades

- 🏛️ **Congreso ampliado a 350 escaños**: la mayoría absoluta está ahora en **176 diputados**.
- 🎲 **Partidos distintos en cada partida**: salen al azar de un catálogo de **28 partidos**, cada uno con una fuerza diferente. Puedes jugar con **4, 6, 8 o 10 partidos**, y siempre habrá izquierda, centro y derecha.
- 🤝 **Pactos e investidura**: si no tienes mayoría absoluta, tendrás que **pactar con partidos de ideas cercanas** (y que no tengan más escaños que tú) para ser investido.
  - 📋 Cada socio te pide **una ley**: si no la apruebas en **12 meses**, rompe el pacto.
  - ⚖️ **Gobierno en minoría**: pierdes estabilidad cada mes.
  - 🚨 **Moción de censura**: si la oposición suma 176 escaños y tu popularidad cae, te avisan… y a los 3 meses te tumban.
- 🏘️ **Nuevo modo «Partido provincial»**: fundas un partido en tu provincia con **0 escaños** y vas creciendo abriendo **delegaciones, sedes y grandes sedes** por el país. ¡Solo te votan donde tienes presencia!
- 🧭 **10 ideologías nuevas** (ahora hay **31**): eurocomunismo, laborismo, populismo de izquierdas y de derechas, anarcocapitalismo, integrismo y más.
- 🌈 **Eje de costumbres**: al crear tu partido eliges de **«muy progresista»** a **«muy conservador»**. Afecta a quién te vota y con quién puedes pactar.
- 👑 **Monarquía o república**: eliges la forma del Estado de tu país y la postura de tu partido. Gobernando puedes convocar un **referéndum** (uno por legislatura).
- 🌍 **Los demás países tienen vida política**: celebran **elecciones**, cambian de gobierno, sufren **golpes de Estado** y sus **dictaduras pueden caer**. Quién manda allí cambia su relación contigo, el comercio y lo agresivos que son.
- 👥 **Ministros nuevos en cada partida**: los candidatos al gabinete ya no son siempre los mismos.
- 📰 **Ventana de Novedades** en el menú principal, con los cambios de cada versión.

### 🔧 Cambios

- 🎓 El **tutorial** mantiene la regla sencilla: gobierna el más votado, sin pactos.
- 🗺️ La pestaña **Diplomacia** muestra el régimen y el gobierno de cada país.
- 📊 Hemiciclo, encuestas y previsiones adaptados a 350 escaños.
- 💾 **Las partidas guardadas de la 2.0 se pueden seguir jugando**: se convierten solas al nuevo congreso.
- 🌐 Todo lo nuevo está **traducido** a inglés, alemán, francés y portugués.

### 🐛 Correcciones

- 📐 Los nombres largos de partido ya no se salen de la leyenda del Parlamento.
- 🔤 Arreglados textos que se traducían mal al mezclar frases con cifras.

---

## 🎭 Versión 2.0 (15/11/2026)

### ✨ Novedades

- 🧭 **Doctrinas políticas** con su propio modelo económico.
- 🗳️ **Plenos**: votaciones entre jugadores en multijugador.
- 📜 **Más leyes** y nuevos eventos en el pleno.
- 🌐 **Juego traducido** a 🇬🇧 inglés, 🇩🇪 alemán, 🇫🇷 francés y 🇵🇹 portugués.

---

## 🎓 Versión 1.0 (11/11/2026)

### ✨ Novedades

- 📘 **Tutorial guiado** con una partida de práctica.
- 🌐 **Multijugador en directo** (hasta 16 jugadores, 8 por país) con chat y pausa.
- 🏛️ Gobierno, oposición, carrera política, corrupción, ejército y guerra.
- 🗺️ Mundos de 5 a 20 países generados por semilla.
- 💫 Transiciones y animaciones más suaves.
`;

// Markdown mínimo: ##, ###, listas con un nivel de sangría, **negrita**, *cursiva* y ---.
function markdownNovedades(md) {
  const enLinea = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  let html = '', nivel = 0;
  const cerrarHasta = n => { while (nivel > n) { html += '</li></ul>'; nivel--; } };
  for (const linea of md.split('\n')) {
    const item = linea.match(/^( *)- (.*)$/);
    if (item) {
      const n = item[1].length >= 2 ? 2 : 1;
      if (n > nivel) { html += '<ul>'; nivel = n; }
      else { cerrarHasta(n); html += '</li>'; }
      html += '<li>' + enLinea(item[2]);
      continue;
    }
    cerrarHasta(0);
    if (/^### /.test(linea)) html += `<h4>${enLinea(linea.slice(4))}</h4>`;
    else if (/^## /.test(linea)) html += `<h3>${enLinea(linea.slice(3))}</h3>`;
    else if (/^---/.test(linea)) html += '<hr>';
    else if (linea.trim()) html += `<p>${enLinea(linea)}</p>`;
  }
  cerrarHasta(0);
  return html;
}

function htmlNovedades() {
  return `<h2>${ico('periodico')} Novedades</h2>
    <div class="novedades-texto" translate="no" lang="es">${markdownNovedades(TEXTO_NOVEDADES)}</div>
    <div class="botones"><button class="btn principal" data-a="cerrar">Entendido</button></div>`;
}

if (typeof registrarTextos === 'function') registrarTextos([
  ['Novedades', 'What\'s new', 'Neuigkeiten', 'Nouveautés', 'Novidades'],
  ['Lo nuevo de cada versión', 'What changed in each version', 'Was sich in jeder Version geändert hat', 'Les changements de chaque version', 'O que mudou em cada versão'],
]);
