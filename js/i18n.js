'use strict';
// Idiomas.
//
// El juego está escrito en español: sus reglas, sus datos, lo que se guarda y lo que se envía en una
// partida multijugador van siempre en español. Aquí se traduce solo lo que se ve. Cada texto que
// llega a la pantalla se busca en un diccionario y se cambia por su traducción, así que una partida
// guardada o una sala sirven igual para jugadores con idiomas distintos.
//
// El diccionario se rellena con registrarTextos([[español, inglés, alemán, francés, portugués], ...])
// (los archivos de js/idiomas/). En la clave en español, {} marca un trozo que cambia (un número, un
// nombre, otra frase): se traduce aparte y se vuelve a colocar. En la traducción, {} los coloca por
// orden y {0}, {1}... en el orden que haga falta. Si la clave apenas tiene texto fijo, {} solo acepta
// números o trozos que se sepan traducir, para no confundir frases; {*} acepta cualquier cosa.
// Un texto sin traducción se queda en español.

const IDIOMAS = { es: 'Español', en: 'English', de: 'Deutsch', fr: 'Français', pt: 'Português' };
const ORDEN_IDIOMAS = Object.keys(IDIOMAS);

const I18N = (() => {
  let idioma = 'es';
  const exactas = {}, patrones = {}, cache = {}, ordenado = {};
  for (const id of ORDEN_IDIOMAS) { exactas[id] = new Map(); patrones[id] = []; cache[id] = new Map(); }

  const LETRA = /\p{L}/u;
  const NUMERO = /^[+\-−±]?\d[\d.,:/%]*$/;
  const BORDES = /^([\s ]*)([\s\S]*?)([\s ]*)$/;
  const MARCA = /\{\*?\}/g;
  const limpiar = t => t.replace(/&nbsp;/g, ' ').replace(/[\s ]+/g, ' ').trim();
  const escaparRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const letras = t => (t.match(/\p{L}/gu) || []).length;

  // ---------- Diccionario ----------

  function registrar(filas) {
    for (const fila of filas) {
      const es = limpiar(fila[0]).replace(/(\{\*?\})(?=\{\*?\})/g, '');   // dos huecos pegados son uno solo
      ORDEN_IDIOMAS.forEach((id, i) => {
        if (!i || fila[i] == null || fila[i] === '') return;
        if (es.includes('{}') || es.includes('{*}')) nuevoPatron(id, es, fila[i]);
        else exactas[id].set(es, fila[i]);
        ordenado[id] = false;
      });
    }
    for (const id of ORDEN_IDIOMAS) cache[id].clear();
  }

  function nuevoPatron(id, es, tr) {
    const fijos = es.split(MARCA), marcas = es.match(MARCA), n = letras(fijos.join(''));
    // La traducción, troceada: textos y números de hueco.
    const partes = [];
    let k = 0, ultimo = 0;
    tr.replace(/\{(\d*)\}/g, (todo, num, pos) => {
      partes.push(tr.slice(ultimo, pos), num === '' ? k++ : +num);
      ultimo = pos + todo.length;
      return todo;
    });
    partes.push(tr.slice(ultimo));
    const ancla = fijos.map(f => f.trim()).sort((a, b) => b.length - a.length)[0];
    patrones[id].push({
      re: new RegExp('^' + fijos.map(escaparRe).join('(.+?)') + '$'),
      partes, peso: n, fuerte: n >= 6, libres: marcas.map(m => m === '{*}'), ancla: ancla.length >= 3 ? ancla : '',
      abierto: fijos[fijos.length - 1] === '',
    });
  }

  // Los patrones con más texto fijo van primero: son los más concretos.
  function lista(id) {
    if (!ordenado[id]) { patrones[id].sort((a, b) => b.peso - a.peso); ordenado[id] = true; }
    return patrones[id];
  }

  // ---------- Buscar una traducción ----------

  // En inglés los números van al revés: coma para los miles y punto para los decimales.
  const numero = n => (idioma !== 'en' ? n
    : n.replace(/(\d)\.(\d{3})(?!\d)/g, '$1\u0000$2').replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2').replace(/\u0000/g, ','));

  // Devuelve la traducción de una clave ya limpia, o null si no se sabe.
  // cuales: 'fuertes' mira solo el diccionario y los patrones con bastante texto fijo; 'flojos', solo
  // los que apenas tienen; sin nada, todos.
  function buscar(clave, nivel, cuales) {
    if (cuales !== 'flojos') {
      const directa = exactas[idioma].get(clave);
      if (directa !== undefined) return directa;
    }
    if (nivel > 4 || clave.length > 600) return null;
    for (const p of lista(idioma)) {
      if (cuales && p.fuerte !== (cuales === 'fuertes')) continue;
      if (p.ancla && !clave.includes(p.ancla)) continue;
      const m = p.re.exec(clave);
      if (!m) continue;
      // Un hueco no puede tragarse frases enteras, salvo el que cierra el texto: si lo hace, es otro
      // texto que acaba igual («Ganarías. La mayoría son 176 de los 350 escaños.» no es «{} de {} escaños»).
      if (m.some((v, i) => i > 0 && !(p.abierto && i === m.length - 1) && v.length > 25 && /[.!?…]\s+\S/.test(v))) continue;
      const valores = [];
      let vale = true;
      for (let i = 1; i < m.length && vale; i++) {
        const v = trozo(m[i], nivel + 1);
        if (!p.fuerte && !p.libres[i - 1] && !v.sabido) vale = false;
        valores.push(v.texto);
      }
      if (vale) return p.partes.map(x => (typeof x === 'number' ? (valores[x] === undefined ? '' : valores[x]) : x)).join('');
    }
    return null;
  }

  // Traduce un trozo que iba dentro de otra frase: un número, un nombre (se deja igual) u otra frase.
  function trozo(t, nivel) {
    const m = BORDES.exec(t), n = m[2];
    if (!n || !LETRA.test(n)) return { texto: NUMERO.test(n) ? m[1] + numero(n) + m[3] : t, sabido: true };
    let tr = saber(n, nivel);
    if (tr === null) tr = enLista(n, nivel);
    return tr === null ? { texto: t, sabido: false } : { texto: m[1] + tr + m[3], sabido: true };
  }

  // La traducción de un texto, tal cual o con pequeñas variaciones: con punto final, seguido de una
  // cifra («Obreros +8») o con otras mayúsculas. null si no se sabe.
  // Los patrones flojos («{} de {}») se dejan para el final: antes se prueba la misma frase sin su
  // punto, que suele tener una traducción propia y mejor.
  function saber(n, nivel) {
    let tr = buscar(n, nivel, 'fuertes');
    if (tr !== null) return tr;
    if (nivel > 4) return buscar(n, nivel, 'flojos');
    if (n.length > 2 && n.endsWith('.') && !n.endsWith('..')) {
      tr = saber(n.slice(0, -1), nivel + 1);
      if (tr !== null) return tr + '.';
    }
    tr = buscar(n, nivel, 'flojos');
    if (tr !== null) return tr;
    const cifra = /^(.*\S) ([+\-−±]?\d[\d.,:/%]*)$/.exec(n);
    if (cifra && LETRA.test(cifra[1])) {
      tr = saber(cifra[1], nivel + 1);
      if (tr !== null) return `${tr} ${numero(cifra[2])}`;
    }
    return otraForma(n, nivel);
  }

  // La misma palabra en minúsculas o en mayúsculas: «obreros» sale de «Obreros», y «TU PAÍS» de «Tu país».
  function otraForma(n, nivel) {
    const primera = n[0];
    if (primera !== primera.toUpperCase()) {
      const tr = buscar(primera.toUpperCase() + n.slice(1), nivel);
      // En alemán los nombres comunes se escriben con mayúscula: se deja como viene.
      return tr === null ? null : idioma === 'de' ? tr : tr[0].toLowerCase() + tr.slice(1);
    }
    if (n.length > 2 && n === n.toUpperCase() && n !== n.toLowerCase()) {
      const tr = buscar(primera + n.slice(1).toLowerCase(), nivel);
      return tr === null ? null : tr.toUpperCase();
    }
    return null;
  }

  // Una enumeración corta: «Norvia, Kessel y Dravia». Se traduce cada cosa y la «y».
  function enLista(n, nivel) {
    const piezas = n.split(/(, | y )/);
    if (piezas.length < 3 || piezas.some((p, i) => i % 2 === 0 && (!p || p.split(' ').length > 4))) return null;
    const y = exactas[idioma].get('y') || 'y';
    return piezas.map((p, i) => (i % 2 ? (p === ', ' ? ', ' : ` ${y} `) : trozo(p, nivel + 1).texto)).join('');
  }

  // Último recurso para un texto entero: traducir por separado sus frases, o lo que va antes y después de «: ».
  function porPartes(clave) {
    const frases = clave.match(/[^.!?…]+[.!?…]+(?:\s+|$)|[^.!?…]+$/g) || [];
    if (frases.length > 1) {
      let alguna = false;
      const tr = frases.map(f => { const v = trozo(f, 1); alguna = alguna || (v.sabido && LETRA.test(f)); return v.texto; });
      if (alguna) return tr.join('');
    }
    const corte = clave.indexOf(': ');
    if (corte > 0) {
      const a = trozo(clave.slice(0, corte), 1), b = trozo(clave.slice(corte + 2), 1);
      if (a.sabido || b.sabido) return `${a.texto}: ${b.texto}`;
    }
    return null;
  }

  const fallos = new Set();

  // Traduce un texto tal como aparece en pantalla, respetando los espacios de los extremos.
  function traducir(texto, soloEntero) {
    if (idioma === 'es' || !texto) return texto;
    const m = BORDES.exec(texto);
    if (!m[2] || !LETRA.test(m[2])) return texto;
    const clave = limpiar(m[2]), c = cache[idioma], llave = soloEntero ? '\u0001' + clave : clave;
    let tr = c.get(llave);
    if (tr === undefined) {
      tr = saber(clave, 0);
      if (tr === null && !soloEntero) tr = porPartes(clave);
      if (tr === null && !soloEntero) tr = enLista(clave, 0);
      if (c.size > 8000) c.clear();
      c.set(llave, tr);
      if (tr === null && api.depurar && !soloEntero) fallos.add(clave);
    }
    return tr === null ? (soloEntero ? null : texto) : m[1] + tr + m[3];
  }

  // ---------- La pantalla ----------
  // Cada nodo traducido recuerda su texto en español, para poder cambiar de idioma sin redibujar.

  const ATRIBUTOS = ['title', 'aria-label', 'placeholder'];
  const EN_LINEA = { B: 1, I: 1, EM: 1, STRONG: 1, U: 1 };
  const SALTAR = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  const vedado = el => !!(el && el.closest && el.closest('[translate="no"]'));

  function ponerTexto(n) {
    const g = n._i18n, actual = n.nodeValue;
    if (g && g.tr === actual && g.id === idioma) return;
    const es = g && g.tr === actual ? g.es : actual, tr = traducir(es);
    n._i18n = tr === es ? null : { es, tr, id: idioma };
    if (tr !== actual) n.nodeValue = tr;
  }

  function ponerAtributos(el) {
    for (const a of ATRIBUTOS) {
      if (!el.hasAttribute(a)) continue;
      const guardados = el._i18nA || (el._i18nA = {}), g = guardados[a], actual = el.getAttribute(a);
      if (g && g.tr === actual && g.id === idioma) continue;
      const es = g && g.tr === actual ? g.es : actual, tr = traducir(es);
      guardados[a] = tr === es ? null : { es, tr, id: idioma };
      if (tr !== actual) el.setAttribute(a, tr);
    }
  }

  // Un párrafo con negritas o cursivas sueltas se traduce entero, para que la frase quede natural.
  function esFrase(el) {
    let hayMarca = false, hayTexto = false;
    for (let h = el.firstChild; h; h = h.nextSibling) {
      if (h.nodeType === 3) hayTexto = hayTexto || LETRA.test(h.nodeValue);
      else if (h.nodeType === 1) {
        if (!EN_LINEA[h.tagName] || h.attributes.length || h.firstElementChild) return false;
        hayMarca = true;
      }
    }
    return hayMarca && hayTexto;
  }

  function ponerFrase(el) {
    const g = el._i18nH, actual = el.innerHTML;
    if (g && g.tr === actual && g.id === idioma) return true;
    const es = g && g.tr === actual ? g.es : actual;
    if (idioma === 'es') {
      el._i18nH = null;
      if (es !== actual) el.innerHTML = es;
      return true;
    }
    const tr = traducir(es, true);
    if (tr === null) {
      // No está como frase entera: se deja en español y se traducirá trozo a trozo.
      if (es !== actual) el.innerHTML = es;
      el._i18nH = null;
      return false;
    }
    el.innerHTML = tr;
    el._i18nH = { es, tr: el.innerHTML, id: idioma };
    return true;
  }

  function recorrer(raiz) {
    if (raiz.nodeType === 3) { if (!vedado(raiz.parentElement)) ponerTexto(raiz); return; }
    if (raiz.nodeType !== 1 || SALTAR[raiz.tagName] || vedado(raiz)) return;
    ponerAtributos(raiz);
    if (esFrase(raiz) && ponerFrase(raiz)) return;
    for (let h = raiz.firstChild; h; h = h.nextSibling) recorrer(h);
  }

  let vigilando = false, tocado = false;
  function vigilar() {
    if (vigilando || typeof MutationObserver === 'undefined' || !document.body) return;
    vigilando = true;
    new MutationObserver(cambios => {
      // En español no hay nada que hacer, salvo que queden textos de otro idioma por devolver.
      if (idioma === 'es' && !tocado) return;
      const raices = new Set();
      for (const c of cambios) {
        const t = c.type === 'characterData' ? c.target.parentNode : c.target;
        if (t && t.isConnected) raices.add(t);
      }
      for (const t of raices) {
        // Si un antepasado también ha cambiado, ya se recorrerá desde él.
        let dentro = false;
        for (let p = t.parentNode; p && !dentro; p = p.parentNode) dentro = raices.has(p);
        if (!dentro) recorrer(t);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  }

  function fijar(id) {
    if (!IDIOMAS[id]) id = 'es';
    vigilar();
    if (id === idioma) return;
    idioma = id;
    if (id !== 'es') tocado = true;
    document.documentElement.lang = id;
    if (document.body) recorrer(document.body);
    document.title = traducir('Parlamento y Diplomacia');
    if (id === 'es') tocado = false;
  }

  const api = {
    registrar, fijar, traducir, fallos, depurar: false,
    get idioma() { return idioma; },
    // Cuántos textos hay en el diccionario de un idioma (para comprobaciones).
    cuenta: id => exactas[id].size + patrones[id].length,
  };
  return api;
})();

const registrarTextos = filas => I18N.registrar(filas);
// Traduce un texto suelto al idioma elegido (para lo poco que no pasa por la pantalla).
const tr = texto => I18N.traducir(texto);
// El idioma del navegador, si el juego lo habla; si no, español.
function idiomaPorDefecto() {
  const id = String((typeof navigator !== 'undefined' && navigator.language) || 'es').slice(0, 2).toLowerCase();
  return IDIOMAS[id] ? id : 'es';
}
