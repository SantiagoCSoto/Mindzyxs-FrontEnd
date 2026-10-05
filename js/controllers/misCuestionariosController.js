/**
 * Controlador de la gestión de cuestionarios del psicólogo (PB-20 HU1-PB20 y PB-21 HU1-PB21).
 * Conecta los ids de views/mis_cuestionarios.html con misCuestionariosService.js:
 *   creación personalizada con cálculo de riesgo (POST /psicologo/cuestionarios) (PB-20),
 *   lista con búsqueda (GET /psicologo/cuestionarios?q=),
 *   detalle (GET /psicologo/cuestionarios/{id}),
 *   editar un Publicado -> confirmación -> despublicar + editor,
 *   guardar como borrador / publicar (PUT /psicologo/cuestionarios/{id}),
 *   eliminar con confirmación extra (DELETE ...?confirmar=true).
 * Solo rol Psicólogo.
 */

import { authService } from '../services/authService.js';
import {
  crearCuestionario,
  listarCuestionarios,
  obtenerDetalleCuestionario,
  despublicarCuestionario,
  actualizarCuestionario,
  eliminarCuestionario
} from '../services/misCuestionariosService.js';

const $ = (id) => document.getElementById(id);

// Guard de sesión: solo psicólogo autenticado.
const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
  throw new Error('Sesión requerida');
}
const rolActual = String(sesion.rol || sesion.tipo_usuario || sessionStorage.getItem('rol') || '').toLowerCase();
if (!(rolActual.includes('psicologo'))) {
  window.location.href = rolActual.includes('paciente') ? 'panel_paciente.html' : 'inicio.html';
  throw new Error('Solo psicólogos');
}

const listaC = $('listaC');
const listaErr = $('listaErr');
const buscarC = $('buscarC');
const confirmModal = $('confirmModal');
const toast = $('toast');

let actual = null;      // detalle del cuestionario en curso
let accionModal = null; // 'ablandar' | 'eliminar' | 'guardar-publicado'

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

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
  if (estado === 'Borrador') return '<span class="est est-b">Borrador</span>';
  if (estado === 'Eliminado') return '<span class="est est-e">Eliminado</span>';
  return '<span class="est est-p">Publicado</span>';
}

// ---------- Pantalla lista ----------
function pintarSkeleton() {
  listaC.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('div');
    d.className = 'sk sk-card';
    d.setAttribute('aria-hidden', 'true');
    listaC.appendChild(d);
  }
}

function renderLista(items) {
  listaErr.classList.remove('show');
  listaC.innerHTML = '';
  if (!items.length) {
    listaC.innerHTML = '<div class="empty">Sin cuestionarios.</div>';
    return;
  }
  items.forEach((c) => {
    const d = document.createElement('div');
    d.className = 'lista-item';
    d.innerHTML =
      '<div class="info"><b>' + escapar(c.titulo) + '</b>' +
      '<small>' + Number(c.numPreguntas ?? 0) + ' pregunta(s)</small></div>' +
      etiquetaEstado(c.estado);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-cancel btn-sm';
    b.textContent = 'Ver detalle';
    b.addEventListener('click', () => abrirDetalle(c.id));
    d.appendChild(b);
    listaC.appendChild(d);
  });
}

async function cargarLista(q = '') {
  pintarSkeleton();
  try {
    const items = await listarCuestionarios(q);
    renderLista(items);
  } catch (error) {
    listaC.innerHTML = '';
    listaErr.textContent = error.message || 'No fue posible cargar tus cuestionarios. Intente nuevamente';
    listaErr.classList.add('show');
  }
}

// Debounce de la búsqueda (el filtro lo hace el backend con q).
let debounceT = null;
buscarC.addEventListener('input', () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(() => cargarLista(buscarC.value.trim()), 300);
});

// ---------- Pantalla detalle ----------
async function abrirDetalle(id) {
  try {
    actual = await obtenerDetalleCuestionario(id);
  } catch (error) {
    showToast(error.message);
    return;
  }
  const desc = actual.descripcion || 'Sin descripción.';
  $('detTitulo').textContent = actual.titulo || 'Detalle';
  $('detSub').textContent = desc + ' · ' + actual.estado;
  const preguntas = Array.isArray(actual.preguntas) ? actual.preguntas : [];
  $('detPreg').innerHTML = preguntas.length
    ? preguntas.map((p, i) => {
      const opciones = Array.isArray(p.opciones) ? p.opciones : [];
      return '<div class="p-item"><b>' + (i + 1) + '. ' + escapar(p.texto) + '</b>' +
        (opciones.length ? '<small>' + escapar(opciones.map((o) => o.texto).join(' / ')) + '</small>' : '') +
        '</div>';
    }).join('')
    : '<div class="empty">Sin preguntas registradas.</div>';
  show('screenDetalle');
}

// ---------- Editor de preguntas ----------
function filaOpcion(op = {}) {
  const div = document.createElement('div');
  div.className = 'opc-row';
  if (op.id) div.dataset.oid = op.id;
  div.innerHTML =
    '<input type="text" class="opc-texto" placeholder="Opción" value="' + escapar(op.texto ?? '') + '" aria-label="Opción" />' +
    '<input type="number" class="opc-valor" min="0" step="1" value="' + (op.valor ?? 0) + '" aria-label="Valor de la opción" />' +
    '<button type="button" class="opc-rm" title="Quitar opción"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>';
  div.querySelector('.opc-rm').addEventListener('click', () => div.remove());
  return div;
}

function filaPregunta(p, indice) {
  const div = document.createElement('div');
  div.className = 'p-item';
  if (p.id) div.dataset.qid = p.id;
  if (p.tipo) div.dataset.tipo = p.tipo;
  div.innerHTML = '<label class="field-label">Pregunta ' + indice + '</label>' +
    '<input type="text" class="q-texto" value="' + escapar(p.texto ?? '') + '" placeholder="Texto de la pregunta" aria-label="Texto de la pregunta" />';
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
  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'btn btn-danger btn-sm';
  btnDel.textContent = 'Quitar pregunta';
  btnDel.addEventListener('click', () => div.remove());
  mini.appendChild(btnDel);
  div.appendChild(mini);
  return div;
}

function abrirEdicion() {
  $('eTitulo').value = actual.titulo || '';
  $('eDesc').value = actual.descripcion || '';
  const editSub = $('editSub');
  if (editSub) editSub.textContent = 'Estado: ' + actual.estado;
  $('eForm').classList.remove('show');
  const ep = $('ePreg');
  ep.innerHTML = '';
  const preguntas = Array.isArray(actual.preguntas) ? actual.preguntas : [];
  if (!preguntas.length) {
    ep.appendChild(filaPregunta({}, 1));
  } else {
    preguntas.forEach((p, i) => ep.appendChild(filaPregunta(p, i + 1)));
  }
  show('screenEditar');
}

$('btnAddPreg').addEventListener('click', () => {
  const ep = $('ePreg');
  ep.appendChild(filaPregunta({}, ep.querySelectorAll('.p-item').length + 1));
});

// ---------- Confirmaciones (despublicar / eliminar) ----------
function preguntar(accion, texto, botonSi) {
  accionModal = accion;
  $('confirmTitle').textContent = 'Confirmar';
  $('confirmText').textContent = texto;
  $('btnSi').textContent = botonSi;
  abrirModal();
}

$('btnEditar').addEventListener('click', async () => {
  if (!actual) return;
  if (actual.estado === 'Publicado') {
    preguntar('ablandar', 'Está publicado. Para editarlo debe pasar a Borrador. ¿Desea continuar?', 'Sí, pasar a Borrador');
  } else {
    abrirEdicion();
  }
});

$('btnEliminar').addEventListener('click', () => {
  if (!actual) return;
  preguntar('eliminar', '¿Desea eliminar "' + (actual.titulo || '') + '"? Dejará de tomarse en cuenta para los análisis.', 'Sí, eliminar');
});

$('btnSi').addEventListener('click', async () => {
  const accion = accionModal;
  accionModal = null;
  cerrarModal();
  try {
    if (accion === 'ablandar') {
      const r = await despublicarCuestionario(actual.id);
      actual.estado = 'Borrador';
      showToast(r.mensaje);
      abrirEdicion();
    } else if (accion === 'eliminar') {
      const r = await eliminarCuestionario(actual.id);
      actual = null;
      showToast(r.mensaje);
      await cargarLista(buscarC.value.trim());
      show('screenLista');
    }
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

// ---------- Guardar edición ----------
function recogerEditor() {
  const titulo = $('eTitulo').value.trim();
  const descripcion = $('eDesc').value.trim();
  const items = $('ePreg').querySelectorAll('.p-item');
  const preguntas = [];
  items.forEach((node) => {
    const texto = node.querySelector('.q-texto')?.value?.trim() || '';
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
  return { titulo, descripcion, preguntas };
}

function validarEditor(editor) {
  if (!editor.titulo) return 'El título es obligatorio.';
  if (!editor.preguntas.length) return 'El cuestionario debe tener al menos una pregunta.';
  const sinTexto = editor.preguntas.filter((p) => !p.texto);
  if (sinTexto.length) return 'Cada pregunta debe tener texto.';
  const sinOpciones = editor.preguntas.filter((p) => p.opciones.length < 2);
  if (sinOpciones.length) return 'Cada pregunta debe tener al menos dos opciones.';
  const opcVacia = editor.preguntas.some((p) => p.opciones.some((o) => !o.texto));
  if (opcVacia) return 'Cada opción debe tener texto.';
  const valorInvalido = editor.preguntas.some((p) => p.opciones.some((o) => o.valor < 0));
  if (valorInvalido) return 'El valor de cada opción debe ser mayor o igual a cero.';
  return '';
}

async function guardar(publicar) {
  const editor = recogerEditor();
  const error = validarEditor(editor);
  if (error) {
    $('eForm').textContent = error;
    $('eForm').classList.add('show');
    return;
  }
  // En el editor el cuestionario siempre es Borrador (ya se despublicó si estaba publicado).
  $('eForm').classList.remove('show');

  const payload = {
    titulo: editor.titulo,
    descripcion: editor.descripcion || null,
    publicar,
    preguntas: editor.preguntas
  };
  // Preserva umbrales personalizados del detalle si los tiene.
  if (actual.umbralBajoMax != null && actual.umbralMedioMax != null) {
    payload.umbrales = { bajoMax: actual.umbralBajoMax, medioMax: actual.umbralMedioMax };
  }

  try {
    const r = await actualizarCuestionario(actual.id, payload);
    showToast(r.mensaje);
    actual.estado = publicar ? 'Publicado' : 'Borrador';
    await cargarLista(buscarC.value.trim());
    show('screenLista');
  } catch (err) {
    $('eForm').textContent = err.message || 'No fue posible actualizar el cuestionario';
    $('eForm').classList.add('show');
  }
}

$('btnGuardarB').addEventListener('click', () => guardar(false));
$('btnPublicarE').addEventListener('click', () => guardar(true));
$('btnCancelarE').addEventListener('click', () => {
  const estadoPrevio = actual && actual.estado === 'Borrador';
  show('screenDetalle');
  if (estadoPrevio && actual) {
    $('detSub').textContent = (actual.descripcion || 'Sin descripción.') + ' · ' + actual.estado;
  }
});

$('btnVolverLista').addEventListener('click', () => {
  actual = null;
  show('screenLista');
});

// ---------- Crear nuevo cuestionario (PB-20 HU1-PB20) ----------
function abrirNuevo() {
  const fTitulo = $('fTitulo');
  const fDesc = $('fDesc');
  const errBox = $('eFormNuevo');
  const pregBox = $('pregBox');

  if (fTitulo) fTitulo.value = '';
  if (fDesc) fDesc.value = '';
  if (errBox) {
    errBox.textContent = '';
    errBox.classList.remove('show');
  }

  // Restablecer rangos predeterminados de riesgo
  const rBajo = $('rBajo');
  const rBajoH = $('rBajoH');
  const rMedio = $('rMedio');
  const rMedioH = $('rMedioH');
  const rAlto = $('rAlto');
  if (rBajo) rBajo.value = '1';
  if (rBajoH) rBajoH.value = '2';
  if (rMedio) rMedio.value = '3';
  if (rMedioH) rMedioH.value = '3';
  if (rAlto) rAlto.value = '4';

  if (pregBox) {
    pregBox.innerHTML = '';
    pregBox.appendChild(filaPregunta({}, 1));
  }

  show('screenNuevo');
}

const btnAddPregNuevo = $('btnAddPregNuevo');
if (btnAddPregNuevo) {
  btnAddPregNuevo.addEventListener('click', () => {
    const pb = $('pregBox');
    if (pb) {
      pb.appendChild(filaPregunta({}, pb.querySelectorAll('.p-item').length + 1));
    }
  });
}

// Sincronización reactiva de umbrales de riesgo
const rBajoH = $('rBajoH');
const rMedio = $('rMedio');
const rMedioH = $('rMedioH');
const rAlto = $('rAlto');

if (rBajoH) {
  rBajoH.addEventListener('input', () => {
    const bMax = Number(rBajoH.value);
    if (!Number.isNaN(bMax) && rMedio) {
      rMedio.value = bMax + 1;
      if (rMedioH && Number(rMedioH.value) <= bMax) {
        rMedioH.value = bMax + 1;
        if (rAlto) rAlto.value = bMax + 2;
      }
    }
  });
}

if (rMedioH) {
  rMedioH.addEventListener('input', () => {
    const mMax = Number(rMedioH.value);
    if (!Number.isNaN(mMax) && rAlto) {
      rAlto.value = mMax + 1;
    }
  });
}

function recogerNuevo() {
  const titulo = $('fTitulo')?.value?.trim() || '';
  const descripcion = $('fDesc')?.value?.trim() || '';
  const items = $('pregBox')?.querySelectorAll('.p-item') || [];
  const preguntas = [];
  items.forEach((node) => {
    const texto = node.querySelector('.q-texto')?.value?.trim() || '';
    const tipo = node.dataset.tipo || 'opcion_multiple';
    const opciones = [];
    node.querySelectorAll('.opc-row').forEach((row) => {
      const opcTexto = row.querySelector('.opc-texto')?.value?.trim() || '';
      const opcValor = Number(row.querySelector('.opc-valor')?.value ?? '0');
      opciones.push({ texto: opcTexto, valor: Number.isFinite(opcValor) ? opcValor : 0 });
    });
    preguntas.push({ texto, tipo, opciones });
  });

  const bajoMax = Number($('rBajoH')?.value ?? 2);
  const medioMax = Number($('rMedioH')?.value ?? 3);

  return { titulo, descripcion, preguntas, bajoMax, medioMax };
}

function validarNuevo(nuevo) {
  if (!nuevo.titulo) return 'El título es obligatorio.';
  if (!nuevo.preguntas.length) return 'El cuestionario debe tener al menos una pregunta.';
  const sinTexto = nuevo.preguntas.filter((p) => !p.texto);
  if (sinTexto.length) return 'Cada pregunta debe tener texto.';
  const sinOpciones = nuevo.preguntas.filter((p) => p.opciones.length < 2);
  if (sinOpciones.length) return 'Cada pregunta debe tener al menos dos opciones.';
  const opcVacia = nuevo.preguntas.some((p) => p.opciones.some((o) => !o.texto));
  if (opcVacia) return 'Cada opción debe tener texto.';
  const valorInvalido = nuevo.preguntas.some((p) => p.opciones.some((o) => o.valor < 0));
  if (valorInvalido) return 'El valor de cada opción debe ser mayor o igual a cero.';
  if (Number.isNaN(nuevo.bajoMax) || nuevo.bajoMax < 0) return 'El límite de riesgo Bajo debe ser mayor o igual a cero.';
  if (Number.isNaN(nuevo.medioMax) || nuevo.medioMax <= nuevo.bajoMax) return 'El límite de riesgo Medio debe ser estrictamente mayor al límite de riesgo Bajo.';
  return '';
}

async function guardarNuevo(publicar) {
  const nuevo = recogerNuevo();
  const error = validarNuevo(nuevo);
  const errBox = $('eFormNuevo');
  if (error) {
    if (errBox) {
      errBox.textContent = error;
      errBox.classList.add('show');
    }
    return;
  }
  if (errBox) errBox.classList.remove('show');

  const payload = {
    titulo: nuevo.titulo,
    descripcion: nuevo.descripcion || null,
    publicar,
    umbrales: {
      bajoMax: nuevo.bajoMax,
      medioMax: nuevo.medioMax
    },
    preguntas: nuevo.preguntas
  };

  try {
    const r = await crearCuestionario(payload);
    showToast(r.mensaje || (publicar ? 'Cuestionario publicado' : 'Cuestionario guardado como borrador'));
    await cargarLista(buscarC?.value?.trim() || '');
    show('screenLista');
  } catch (err) {
    if (errBox) {
      errBox.textContent = err.message || 'No fue posible crear el cuestionario';
      errBox.classList.add('show');
    }
  }
}

const btnNuevo = $('btnNuevo');
if (btnNuevo) btnNuevo.addEventListener('click', abrirNuevo);

const btnBorrador = $('btnBorrador');
if (btnBorrador) btnBorrador.addEventListener('click', () => guardarNuevo(false));

const btnPublicar = $('btnPublicar');
if (btnPublicar) btnPublicar.addEventListener('click', () => guardarNuevo(true));

const btnVolverListaNuevo = $('btnVolverListaNuevo');
if (btnVolverListaNuevo) btnVolverListaNuevo.addEventListener('click', () => show('screenLista'));

// ---------- Cerrar sesión ----------
$('btn-logout').addEventListener('click', () => {
  if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
  authService.logout();
  sessionStorage.removeItem('es_invitado');
  window.location.href = 'login.html';
});

$('footerAviso').addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Mindzyx no realiza diagnósticos clínicos');
});

// Rod del badge de rol en el header.
const rolUsuario = document.getElementById('rol-usuario');
if (rolUsuario) rolUsuario.textContent = 'Psicólogo';

// Inicializa la lista.
cargarLista();