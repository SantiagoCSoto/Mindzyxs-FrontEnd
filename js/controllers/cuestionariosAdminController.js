/**
 * Controlador de Cuestionarios Predeterminados del Administrador (PB-28 HU1-PB28).
 * Conecta los ids de views/cuestionarios_admin.html con cuestionariosAdminService.js:
 *   lista con búsqueda (GET /admin/cuestionarios-predeterminados?q=),
 *   detalle editable (GET /admin/cuestionarios-predeterminados/{id}),
 *   crear (POST /admin/cuestionarios-predeterminados),
 *   editar (PUT /admin/cuestionarios-predeterminados/{id}),
 *   desactivar con confirmación (POST /admin/cuestionarios-predeterminados/{id}/desactivar).
 * Solo rol Administrador.
 */

import { authService } from '../services/authService.js';
import { escaparHtml } from '../services/apiClient.js';
import {
  listarPredeterminados,
  obtenerPredeterminado,
  crearPredeterminado,
  actualizarPredeterminado,
  desactivarPredeterminado
} from '../services/cuestionariosAdminService.js';

const $ = (id) => document.getElementById(id);

// Guard de sesión: solo administrador autenticado.
const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
  throw new Error('Sesión requerida');
}
const rolActual = String(sesion.rol || sesion.tipo_usuario || sessionStorage.getItem('rol') || '').toLowerCase();
if (!rolActual.includes('admin')) {
  window.location.href = rolActual.includes('psicologo')
    ? 'panel_psicologo.html'
    : rolActual.includes('paciente')
      ? 'panel_paciente.html'
      : 'inicio.html';
  throw new Error('Solo administradores');
}

const listaC = $('listaC');
const listaErr = $('listaErr');
const buscarC = $('buscarC');
const skLista = $('skLista');
const vacioCuestionario = $('vacioCuestionario');
const confirmModal = $('confirmModal');
const toast = $('toast');

let actual = null;      // detalle en curso (null = nuevo)
let accionModal = null; // id a desactivar

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}

function abrirModal() {
  confirmModal.classList.add('open');
  confirmModal.setAttribute('aria-hidden', 'false');
}

function cerrarModal() {
  confirmModal.classList.remove('open');
  confirmModal.setAttribute('aria-hidden', 'true');
}

function etiquetaEstado(estado) {
  const e = String(estado || '').toLowerCase();
  if (e.includes('publi') || e.includes('activo')) return '<span class="est est-p">Publicado</span>';
  return '<span class="est est-i">Inactivo</span>';
}

// ---------- Pantalla lista ----------
function pintarSkeleton() {
  if (skLista) skLista.hidden = false;
  if (vacioCuestionario) vacioCuestionario.hidden = true;
  listaErr.classList.remove('show');
  listaC.innerHTML = '';
}

function renderLista(items) {
  listaErr.classList.remove('show');
  listaC.innerHTML = '';
  if (!items.length) {
    if (vacioCuestionario) vacioCuestionario.hidden = false;
    return;
  }
  if (vacioCuestionario) vacioCuestionario.hidden = true;

  items.forEach((c) => {
    const d = document.createElement('div');
    d.className = 'lista-item';
    d.innerHTML =
      '<div class="info"><b>' + escaparHtml(c.titulo) + '</b>' +
      '<small>' + Number(c.numPreguntas ?? 0) + ' pregunta(s)</small></div>' +
      etiquetaEstado(c.estado);

    const acciones = document.createElement('div');
    acciones.className = 'mini-actions';

    const bEditar = document.createElement('button');
    bEditar.type = 'button';
    bEditar.className = 'btn btn-cancel btn-sm';
    bEditar.textContent = 'Editar';
    bEditar.addEventListener('click', () => abrirEditar(c.id));
    acciones.appendChild(bEditar);

    if (!String(c.estado || '').toLowerCase().includes('inact')) {
      const bDesactivar = document.createElement('button');
      bDesactivar.type = 'button';
      bDesactivar.className = 'btn btn-danger btn-sm';
      bDesactivar.textContent = 'Desactivar';
      bDesactivar.addEventListener('click', () => confirmarDesactivar(c));
      acciones.appendChild(bDesactivar);
    }

    d.appendChild(acciones);
    listaC.appendChild(d);
  });
}

async function cargarLista(q = '') {
  pintarSkeleton();
  try {
    const items = await listarPredeterminados(q);
    renderLista(items);
  } catch (error) {
    listaC.innerHTML = '';
    if (vacioCuestionario) vacioCuestionario.hidden = true;
    listaErr.textContent = error.message || 'No fue posible cargar los cuestionarios. Intente nuevamente';
    listaErr.classList.add('show');
  } finally {
    if (skLista) skLista.hidden = true;
  }
}

// Debounce de la búsqueda (el filtro lo hace el backend con q).
let debounceT = null;
buscarC.addEventListener('input', () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(() => cargarLista(buscarC.value.trim()), 300);
});

// ---------- Editor de preguntas ----------
function filaOpcion(op = {}) {
  const div = document.createElement('div');
  div.className = 'opc-row';
  if (op.id) div.dataset.oid = op.id;
  div.innerHTML =
    '<input type="text" class="opc-texto" placeholder="Opción" value="' + escaparHtml(op.texto ?? '') + '" aria-label="Opción" />' +
    '<input type="number" class="opc-valor" min="0" step="1" value="' + (op.valor ?? 0) + '" aria-label="Valor de la opción" />' +
    '<button type="button" class="opc-rm" title="Quitar opción" aria-label="Quitar opción"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>';
  div.querySelector('.opc-rm').addEventListener('click', () => div.remove());
  return div;
}

function filaPregunta(p = {}, indice = 1) {
  const div = document.createElement('div');
  div.className = 'p-item';
  if (p.id) div.dataset.qid = p.id;
  div.dataset.tipo = p.tipo || 'opcion_multiple';

  const head = document.createElement('div');
  head.className = 'preg-head';
  head.innerHTML = '<span class="preg-n">Pregunta ' + indice + '</span>';
  const btnQuitar = document.createElement('button');
  btnQuitar.type = 'button';
  btnQuitar.className = 'btn btn-danger btn-sm';
  btnQuitar.textContent = 'Quitar pregunta';
  btnQuitar.addEventListener('click', () => {
    div.remove();
    renumerarPreguntas();
  });
  head.appendChild(btnQuitar);
  div.appendChild(head);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'preg-texto';
  input.placeholder = 'Texto de la pregunta';
  input.value = p.texto ?? '';
  input.setAttribute('aria-label', 'Texto de la pregunta');
  div.appendChild(input);

  const contOpciones = document.createElement('div');
  contOpciones.className = 'opciones';
  const opciones = Array.isArray(p.opciones) && p.opciones.length ? p.opciones : [{}, {}];
  opciones.forEach((o) => contOpciones.appendChild(filaOpcion(o)));
  div.appendChild(contOpciones);

  const mini = document.createElement('div');
  mini.className = 'mini-actions';
  const btnAdd = document.createElement('button');
  btnAdd.type = 'button';
  btnAdd.className = 'btn btn-cancel btn-sm';
  btnAdd.innerHTML = '<svg class="btn-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>Agregar opción';
  btnAdd.addEventListener('click', () => contOpciones.appendChild(filaOpcion({})));
  mini.appendChild(btnAdd);
  div.appendChild(mini);

  return div;
}

function renumerarPreguntas() {
  $('pregBox').querySelectorAll('.p-item').forEach((node, i) => {
    const n = node.querySelector('.preg-n');
    if (n) n.textContent = 'Pregunta ' + (i + 1);
  });
}

$('btnAddPreg').addEventListener('click', () => {
  const pb = $('pregBox');
  pb.appendChild(filaPregunta({}, pb.querySelectorAll('.p-item').length + 1));
});

// ---------- Umbrales de riesgo (bajoMax / medioMax) ----------
function actualizarUmbrales() {
  const bajo = Number($('uBajoMax').value);
  const medio = Number($('uMedioMax').value);
  $('uMedioDesde').textContent = Number.isFinite(bajo) ? String(bajo + 1) : '—';
  $('uAltoDesde').textContent = Number.isFinite(medio) ? String(medio + 1) : '—';
}

$('uBajoMax').addEventListener('input', actualizarUmbrales);
$('uMedioMax').addEventListener('input', actualizarUmbrales);

// ---------- Abrir editor ----------
function abrirNuevo() {
  actual = null;
  $('editTitulo').textContent = 'Nuevo cuestionario';
  if ($('editSub')) $('editSub').textContent = 'Complete los campos obligatorios para guardar el cuestionario.';
  $('eTitulo').value = '';
  $('eDesc').value = '';
  $('uBajoMax').value = '6';
  $('uMedioMax').value = '12';
  $('fPublicar').checked = false;
  $('eForm').classList.remove('show');
  const pb = $('pregBox');
  pb.innerHTML = '';
  pb.appendChild(filaPregunta({}, 1));
  actualizarUmbrales();
  show('screenEditar');
}

async function abrirEditar(id) {
  try {
    actual = await obtenerPredeterminado(id);
  } catch (error) {
    showToast(error.message);
    return;
  }
  $('editTitulo').textContent = 'Editar cuestionario';
  if ($('editSub')) $('editSub').textContent = 'Estado: ' + (actual.estado || 'Inactivo');
  $('eTitulo').value = actual.titulo || '';
  $('eDesc').value = actual.descripcion || '';
  $('uBajoMax').value = actual.umbralBajoMax != null ? String(actual.umbralBajoMax) : '6';
  $('uMedioMax').value = actual.umbralMedioMax != null ? String(actual.umbralMedioMax) : '12';
  $('fPublicar').checked = String(actual.estado || '').toLowerCase().includes('publi');
  $('eForm').classList.remove('show');
  const pb = $('pregBox');
  pb.innerHTML = '';
  const preguntas = Array.isArray(actual.preguntas) ? actual.preguntas : [];
  if (!preguntas.length) {
    pb.appendChild(filaPregunta({}, 1));
  } else {
    preguntas.forEach((p, i) => pb.appendChild(filaPregunta(p, i + 1)));
  }
  actualizarUmbrales();
  show('screenEditar');
}

// ---------- Guardar (crear / editar) ----------
function recogerEditor() {
  const titulo = $('eTitulo').value.trim();
  const descripcion = $('eDesc').value.trim();
  const publicar = $('fPublicar').checked;
  const bajoMax = Number($('uBajoMax').value);
  const medioMax = Number($('uMedioMax').value);

  const preguntas = [];
  $('pregBox').querySelectorAll('.p-item').forEach((node) => {
    const texto = node.querySelector('.preg-texto')?.value?.trim() || '';
    const tipo = node.dataset.tipo || 'opcion_multiple';
    const opciones = [];
    node.querySelectorAll('.opc-row').forEach((row) => {
      const opcTexto = row.querySelector('.opc-texto')?.value?.trim() || '';
      const opcValor = Number(row.querySelector('.opc-valor')?.value ?? '0');
      const o = { texto: opcTexto, valor: Number.isFinite(opcValor) ? opcValor : 0 };
      if (row.dataset.oid) o.id = Number(row.dataset.oid);
      opciones.push(o);
    });
    const p = { texto, tipo, opciones };
    if (node.dataset.qid) p.id = Number(node.dataset.qid);
    preguntas.push(p);
  });

  return { titulo, descripcion, publicar, bajoMax, medioMax, preguntas };
}

function validarEditor(editor) {
  if (!editor.titulo) return false;
  if (!editor.preguntas.length) return false;
  if (editor.preguntas.some((p) => !p.texto)) return false;
  if (editor.preguntas.some((p) => p.opciones.length < 2)) return false;
  if (editor.preguntas.some((p) => p.opciones.some((o) => !o.texto))) return false;
  if (editor.preguntas.some((p) => p.opciones.some((o) => o.valor < 0))) return false;
  if (Number.isNaN(editor.bajoMax) || editor.bajoMax < 0) return false;
  if (Number.isNaN(editor.medioMax) || editor.medioMax <= editor.bajoMax) return false;
  return true;
}

$('btnGuardar').addEventListener('click', async () => {
  const editor = recogerEditor();
  const errBox = $('eForm');
  if (!validarEditor(editor)) {
    errBox.textContent = 'Debes completar todos los campos obligatorios';
    errBox.classList.add('show');
    return;
  }
  errBox.classList.remove('show');

  const payload = {
    titulo: editor.titulo,
    descripcion: editor.descripcion || null,
    publicar: editor.publicar,
    umbrales: { bajoMax: editor.bajoMax, medioMax: editor.medioMax },
    preguntas: editor.preguntas
  };

  const btn = $('btnGuardar');
  btn.disabled = true;
  try {
    const r = actual && actual.id
      ? await actualizarPredeterminado(actual.id, payload)
      : await crearPredeterminado(payload);
    showToast(r.mensaje);
    await cargarLista(buscarC.value.trim());
    show('screenLista');
  } catch (error) {
    errBox.textContent = error.message || 'No fue posible guardar el cuestionario';
    errBox.classList.add('show');
  } finally {
    btn.disabled = false;
  }
});

$('btnCancelar').addEventListener('click', () => {
  actual = null;
  show('screenLista');
});

$('btnNuevo').addEventListener('click', abrirNuevo);

// ---------- Desactivar ----------
function confirmarDesactivar(c) {
  accionModal = c.id;
  $('confirmTitle').textContent = 'Desactivar cuestionario';
  $('confirmText').textContent = '¿Desea desactivar "' + (c.titulo || '') + '"? Dejará de aparecer en la asignación a pacientes.';
  $('btnSi').textContent = 'Sí, desactivar';
  abrirModal();
}

$('btnSi').addEventListener('click', async () => {
  const id = accionModal;
  accionModal = null;
  cerrarModal();
  if (!id) return;
  try {
    const r = await desactivarPredeterminado(id);
    showToast(r.mensaje);
    await cargarLista(buscarC.value.trim());
  } catch (error) {
    showToast(error.message);
  }
});

$('btnNo').addEventListener('click', cerrarModal);

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) cerrarModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModal();
});

// ---------- Cerrar sesión ----------
$('btn-logout-top').addEventListener('click', () => {
  if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
  authService.logout();
  sessionStorage.removeItem('es_invitado');
  window.location.href = 'login.html';
});

$('footerAviso').addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Mindzyx no realiza diagnósticos clínicos');
});

// Rol del badge en el header.
const rolUsuario = $('rol-usuario');
if (rolUsuario) rolUsuario.textContent = 'Administrador';

// Inicializa la lista.
cargarLista();
