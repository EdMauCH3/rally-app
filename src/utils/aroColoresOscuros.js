// Aro blanco automático para colores de equipo muy oscuros (p. ej. Negro #3B3B45)
// sobre el fondo azul marino. Observa el DOM y, a cualquier elemento con estilo
// en línea cuyo fondo sea oscuro y opaco, le agrega un contorno claro.
// Es idempotente y se limpia solo si el color pasa a ser claro.

const UMBRAL_LUMINANCIA = 0.06;
const MARCA = 'aroOscuro';

function parsearRgb(texto) {
  const m = texto && texto.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);
  if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

function luminancia({ r, g, b }) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function esOscuro(valor) {
  const c = parsearRgb(valor);
  return !!c && c.a >= 0.5 && luminancia(c) < UMBRAL_LUMINANCIA;
}

function procesar(el) {
  if (!(el instanceof HTMLElement) || !el.hasAttribute('style')) return;
  const s = el.style;
  const fondoOscuro = esOscuro(s.backgroundColor);
  const bordeOscuro =
    !!s.borderColor && esOscuro(s.borderTopColor || s.borderColor);
  const textoOscuro = esOscuro(s.color);

  const necesitaAro = fondoOscuro || bordeOscuro;
  const tieneAro = el.dataset[MARCA] === '1';

  if (necesitaAro && !tieneAro) {
    el.dataset[MARCA] = '1';
    s.outline = '2px solid rgba(255,255,255,.85)';
    s.outlineOffset = '1px';
  } else if (!necesitaAro && tieneAro) {
    delete el.dataset[MARCA];
    s.outline = '';
    s.outlineOffset = '';
  }

  const tieneSombra = el.dataset.sombraOscura === '1';
  if (textoOscuro && !tieneSombra) {
    el.dataset.sombraOscura = '1';
    s.textShadow = '0 0 2px rgba(255,255,255,.9), 0 0 6px rgba(255,255,255,.5)';
  } else if (!textoOscuro && tieneSombra) {
    delete el.dataset.sombraOscura;
    s.textShadow = '';
  }
}

function procesarArbol(raiz) {
  if (!(raiz instanceof HTMLElement)) return;
  procesar(raiz);
  raiz.querySelectorAll('[style]').forEach(procesar);
}

export function activarAroColoresOscuros() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  const pendientes = new Set();
  let programado = false;

  const vaciar = () => {
    programado = false;
    const lote = Array.from(pendientes);
    pendientes.clear();
    lote.forEach((el) => {
      if (el.isConnected) procesarArbol(el);
    });
  };

  const encolar = (el) => {
    pendientes.add(el);
    if (!programado) {
      programado = true;
      requestAnimationFrame(vaciar);
    }
  };

  const obs = new MutationObserver((mutaciones) => {
    for (const m of mutaciones) {
      if (m.type === 'attributes') {
        encolar(m.target);
      } else {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) encolar(n);
        });
      }
    }
  });

  obs.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
  });
  encolar(document.body);

  return () => obs.disconnect();
}
