'use strict';
// Efectos de ambiente (2.4): pequeñas cosas en 3D y animaciones que no cambian ninguna regla.
// - Los botones grandes del menú y las tarjetas de opción se inclinan hacia el puntero.
// - El dibujo del menú (hemiciclo o mapa) gira un poco siguiendo al ratón.
// - Sobre el mapa pasan sombras de nubes y, al cambiar de mes, lo cruza un destello.
// - La insignia del partido da la vuelta como una moneda cuando cambias su diseño.
// Todo se apaga con la opción «Animaciones» y la inclinación solo existe con ratón.

const PUNTERO_FINO = matchMedia('(hover: hover) and (pointer: fine)');
const INCLINABLES = '.menu-btn, .dificultad, .opcion, .pais-eu, .vista-partido .logo';
const efectos = { inclinado: null, cuadro: 0, mes: undefined, insignia: null };

function soltarInclinado() {
  const el = efectos.inclinado;
  if (!el) return;
  el.style.removeProperty('--rx');
  el.style.removeProperty('--ry');
  efectos.inclinado = null;
}

function seguirPuntero(ev) {
  const el = ev.target && ev.target.closest ? ev.target.closest(INCLINABLES) : null;
  if (el !== efectos.inclinado) soltarInclinado();
  if (el && !el.disabled) {
    const r = el.getBoundingClientRect();
    // Cuanto más ancho es el botón, menos gira: en uno largo, pocos grados ya se notan mucho.
    const max = r.width > 320 ? 4 : r.width > 150 ? 8 : 16;
    const px = (ev.clientX - r.left) / r.width - 0.5, py = (ev.clientY - r.top) / r.height - 0.5;
    el.classList.add('inclina');
    el.style.setProperty('--ry', (px * max).toFixed(2) + 'deg');
    el.style.setProperty('--rx', (-py * max).toFixed(2) + 'deg');
    efectos.inclinado = el;
  }
  // El dibujo del menú mira hacia donde está el ratón.
  const hero = ui.pantalla === 'menu' ? $('#menu-hero') : null;
  if (hero) {
    hero.style.setProperty('--hy', ((ev.clientX / innerWidth - 0.5) * 9).toFixed(2) + 'deg');
    hero.style.setProperty('--hx', ((0.5 - ev.clientY / innerHeight) * 6).toFixed(2) + 'deg');
  }
}

document.addEventListener('pointermove', ev => {
  if (!PUNTERO_FINO.matches || !animar() || efectos.cuadro) return;
  efectos.cuadro = requestAnimationFrame(() => { efectos.cuadro = 0; seguirPuntero(ev); });
});
document.documentElement.addEventListener('pointerleave', soltarInclinado);

// Repite una animación de clase aunque ya estuviera puesta.
function relanzar(el, clase, ms) {
  el.classList.remove(clase);
  void el.offsetWidth;
  el.classList.add(clase);
  clearTimeout(el['_reloj_' + clase]);
  el['_reloj_' + clase] = setTimeout(() => el.classList.remove(clase), ms);
}

// Se llama al final de cada repintado de la pantalla.
function despuesDeRender() {
  const marco = $('.mapa-marco');
  // Sombras de nubes sobre el mapa de la partida.
  if (marco && !$('.nubes', marco)) $('#mapa', marco).insertAdjacentHTML('afterend', '<div class="nubes" aria-hidden="true"><i></i><i></i><i></i></div>');
  // Al pasar de mes, un destello cruza el mapa.
  const mes = ui.pantalla === 'juego' && estado ? estado.mes : undefined;
  if (marco && animar() && mes !== undefined && efectos.mes !== undefined && mes > efectos.mes) relanzar(marco, 'pasa-mes', 900);
  efectos.mes = mes;
  girarInsigniaSiCambia();
}

// La insignia de la vista previa da la vuelta cuando cambia su diseño (no al escribir el nombre).
function girarInsigniaSiCambia() {
  const logo = $('.vista-partido .logo');
  const clave = logo ? [logo.className.replace(/\b(inclina|moneda)\b/g, '').trim(), logo.style.background, logo.style.color, logo.innerHTML].join('|') : null;
  if (logo && efectos.insignia && clave !== efectos.insignia && animar()) relanzar(logo, 'moneda', 520);
  efectos.insignia = clave;
}
