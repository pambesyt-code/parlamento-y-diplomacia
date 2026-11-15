'use strict';
// Anuncios con recompensa. Solo existen dentro de la app de móvil (Expo), nunca en la web,
// en multijugador ni en el tutorial. La app enseña el anuncio y, si se ve entero, llama a
// window.recompensaAnuncio(id, true).

const EN_APP = !!window.ReactNativeWebView;

// Una de cada por mes. modo: cuándo se ofrece.
const RECOMPENSAS = {
  dinero: { modo: 'gobierno', nombre: 'Ayuda extra al tesoro', icono: 'moneda', efectos: { dinero: 100 } },
  capital: { modo: 'gobierno', nombre: 'Capital político', icono: 'parlamento', efectos: { cp: 2 } },
  fondos: { modo: 'carrera', nombre: 'Donación al partido', icono: 'moneda', efectos: { fondos: 50 } },
};

const anunciosDisponibles = s => (EN_APP && !enRed() && !ui.tutorial
  ? Object.keys(RECOMPENSAS).filter(id => RECOMPENSAS[id].modo === s.modo) : []);
const puedeAnuncio = (s, id) => (((s.anuncios || {})[id] === s.mes)
  ? { ok: false, motivo: 'Ya lo has visto este mes' } : { ok: true });

function htmlAnuncios() {
  const s = estado, ids = anunciosDisponibles(s);
  if (!ids.length) return '';
  return `<div class="tarjeta"><div class="tarjeta-cab"><b>${ico('megafono')} Recompensas</b><span class="cuenta">una de cada al mes</span></div>
    <p class="nota">Mira un anuncio corto y llévate un empujón.</p>
    ${ids.map(id => {
      const r = RECOMPENSAS[id];
      return `<div class="edif"><span class="edif-ico">${ico(r.icono)}</span>
        <div class="edif-txt"><b>${r.nombre}</b><div class="chips">${chipsEfectos(r.efectos)}</div></div>
        <div class="edif-acc">${boton('Ver anuncio', { a: 'anuncio', v: id }, puedeAnuncio(s, id), 'mini')}</div></div>`;
    }).join('')}</div>`;
}

// La app responde aquí cuando el anuncio termina.
window.recompensaAnuncio = (id, ok) => {
  const s = estado, r = RECOMPENSAS[id];
  if (!s || !r || !ok || !puedeAnuncio(s, id).ok) { if (s) aviso('El anuncio no se ha completado.', 'mal', 'periodico'); render(); return; }
  s.anuncios = s.anuncios || {};
  s.anuncios[id] = s.mes;
  if (s.modo === 'carrera') aplicarEfectosCarrera(s, r.efectos); else aplicarEfectos(s, r.efectos);
  aviso(`Recompensa: ${r.nombre.toLowerCase()}.`, 'bien', 'check');
  guardar(s);
  render();
};

function htmlPrivacidad() {
  return `<h2>${ico('periodico')} Política de privacidad</h2>
    <div class="privacidad-texto">${TEXTO_PRIVACIDAD}</div>
    <button class="btn principal" data-a="abrir" data-v="opciones">Volver</button>`;
}

const accionesAnuncios = {
  // Formulario de consentimiento de Google (RGPD) para cambiar la elección sobre anuncios.
  preferenciasAnuncios: () => {
    if (EN_APP) window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'privacidad' }));
  },
  anuncio: d => {
    if (!EN_APP || !puedeAnuncio(estado, d.v).ok) return;
    window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'anuncio', id: d.v }));
  },
};
