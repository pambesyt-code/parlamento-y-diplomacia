// Ventana «Novedades»: el registro de cambios dentro del juego.
// Copia de CHANGELOG.md (va aquí porque abriendo index.html con doble clic el navegador no deja leer archivos).
// Al publicar una versión: añadir su entrada arriba, aquí y en CHANGELOG.md.

const TEXTO_NOVEDADES = `
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
