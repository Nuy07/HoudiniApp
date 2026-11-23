// Ayudas de interfaz. Todo el texto entra con textContent: nunca se interpreta como HTML.
export const $ = (s) => document.querySelector(s);

// h('button', { class: 'x', onclick: fn }, 'texto', otroNodo)
export function h(tag, props = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...hijos.flat().filter((x) => x != null && x !== false));
  return e;
}

const TRAZOS = {
  inicio: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  regla: 'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.500 7 12 7 12zM12 11.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
  grafica: 'M4 20V10M10 20V4M16 20v-8M21 20H3',
  tienda: 'M4 8h16l-1 12H5zM8 8a4 4 0 0 1 8 0',
  ajustes: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
  red: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a2.500 2.500 0 1 0 0-5M2 20a6 6 0 0 1 12 0M16 14a5 5 0 0 1 6 5',
  tel: 'M5 3h4l2 5-2.500 1.500a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  campana: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  ojo: 'M3 3l18 18M10 6a9 9 0 0 1 11 6 13 13 0 0 1-3 4M6 7a13 13 0 0 0-3 5 9 9 0 0 0 12 5.500',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
};
export function icono(nombre) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'ico');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', TRAZOS[nombre]);
  svg.append(p);
  return svg;
}

let reloj;
export function aviso(texto) {
  const a = $('#aviso');
  a.textContent = texto;
  a.hidden = false;
  clearTimeout(reloj);
  reloj = setTimeout(() => { a.hidden = true; }, 3500);
}

// Abre un formulario en un <dialog>. campos: [{ id, label, tipo, valor, opciones }]
export function formulario(titulo, campos, alGuardar) {
  const d = h('dialog', { 'aria-label': titulo });
  const error = h('p', { class: 'error', role: 'alert' });
  const entradas = {};
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(Object.entries(entradas).map(([k, n]) => [k, n.type === 'checkbox' ? n.checked : n.value.trim()]));
      ok.disabled = true;
      try { await alGuardar(v); d.close(); d.remove(); } catch (err) { error.textContent = err.message; }
      ok.disabled = false;
    },
  }, h('h2', {}, titulo));
  for (const c of campos) {
    const base = { id: `c-${c.id}`, required: c.requerido !== false && c.tipo !== 'checkbox', maxlength: c.max };
    const n = c.tipo === 'textarea' ? h('textarea', { ...base, rows: 4, placeholder: c.ayuda })
      : c.tipo === 'select' ? h('select', base, c.opciones.map(([v, t]) => h('option', { value: v }, t)))
        : h('input', { ...base, type: c.tipo || 'text', min: c.min, step: c.step, placeholder: c.ayuda, autocomplete: c.auto || 'off', minlength: c.minimo });
    if (c.tipo === 'checkbox') n.checked = Boolean(c.valor);
    else if (c.valor != null) n.value = c.valor;
    entradas[c.id] = n;
    f.append(h('label', { class: c.tipo === 'checkbox' ? 'fila' : 'campo', for: base.id }, c.label, n), c.extra ? c.extra(entradas) : '');
  }
  const ok = h('button', { class: 'primario' }, 'Guardar');
  f.append(error, h('div', { class: 'acciones' }, h('button', { type: 'button', onclick: () => d.close() }, 'Cancelar'), ok));
  d.append(f);
  d.addEventListener('close', () => d.remove());
  document.body.append(d);
  d.showModal();
}
