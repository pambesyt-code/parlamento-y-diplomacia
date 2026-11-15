'use strict';
// Política de privacidad. La usan la ventana del juego (Opciones → Privacidad) y la página
// pública privacidad.html, que es la dirección que se da en Google Play y AdMob.

// Correo de contacto que aparece en la política. Rellénalo antes de publicar la app.
const CONTACTO_PRIVACIDAD = '';
const FECHA_PRIVACIDAD = '12 de noviembre de 2026';

const TEXTO_PRIVACIDAD = `
<p>Última actualización: ${FECHA_PRIVACIDAD}.</p>
<p>Parlamento y Diplomacia es un juego de estrategia política. Esta política explica qué datos se usan cuando juegas en la web o en la app de Android.</p>

<h3>Lo que guarda el juego</h3>
<p>Tu partida, tus opciones y si ya has visto el tutorial se guardan solo en tu dispositivo (el almacenamiento del navegador o de la app). No hay cuentas ni registro, y nada de eso se envía a ningún servidor del juego. Puedes borrarlo desde Opciones → «Borrar la partida guardada» o desinstalando la app.</p>

<h3>Multijugador</h3>
<p>Las partidas en línea conectan directamente a los jugadores de la sala. Para encontrarse se usa el servicio público de PeerJS y servidores de conexión de Google, Cloudflare y Open Relay, que ven tu dirección IP para poder conectarte. Los demás jugadores de la sala ven el nombre, el partido y los mensajes de chat que escribas. Nada de esto se guarda una vez termina la partida.</p>

<h3>Tipografías</h3>
<p>El juego descarga sus tipografías de Google Fonts, que recibe tu dirección IP al servirlas.</p>

<h3>Anuncios (solo en la app de Android)</h3>
<p>La app es gratuita y se financia con anuncios opcionales: solo ves uno si pulsas «Ver anuncio» para conseguir una recompensa en una partida de un jugador. Los anuncios los sirve Google AdMob, que puede recoger el identificador de publicidad de tu dispositivo, tu dirección IP, datos técnicos del dispositivo y cómo interactúas con los anuncios.</p>
<p>Si estás en el Espacio Económico Europeo, el Reino Unido o Suiza, la app te pregunta antes si aceptas anuncios personalizados. Puedes cambiar tu elección cuando quieras en Opciones → «Preferencias de anuncios». Más información sobre cómo usa Google estos datos: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>
<p>La versión web no muestra anuncios.</p>

<h3>Menores</h3>
<p>El juego no está dirigido a menores de 13 años y no recoge a sabiendas datos de menores.</p>

<h3>Tus derechos y contacto</h3>
<p>Puedes pedir información sobre tus datos o su borrado ${CONTACTO_PRIVACIDAD
    ? `escribiendo a <a href="mailto:${CONTACTO_PRIVACIDAD}">${CONTACTO_PRIVACIDAD}</a>`
    : 'a través del contacto de la ficha del juego en Google Play'}. Para los datos que tratan Google, PeerJS y los servidores de conexión, se aplican sus propias políticas.</p>

<h3>Cambios</h3>
<p>Si esta política cambia, se actualizará la fecha de arriba.</p>`;
