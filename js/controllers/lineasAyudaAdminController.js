/**
 * Controlador de Líneas de Ayuda del Administrador (PB-29 HU1-PB29).
 * Conecta los ids de views/lineas_ayuda_admin.html con lineasAyudaAdminService.js:
 *   lista con búsqueda (GET /admin/lineas-ayuda?q=),
 *   detalle editable (GET /admin/lineas-ayuda/{id}),
 *   crear (POST /admin/lineas-ayuda),
 *   editar (PUT /admin/lineas-ayuda/{id}),
 *   activar (POST /admin/lineas-ayuda/{id}/activar),
 *   inactivar (POST /admin/lineas-ayuda/{id}/inactivar),
 *   eliminar con confirmación (DELETE /admin/lineas-ayuda/{id}).
 * Solo rol Administrador.
 */

import { authService } from '../services/authService.js';
import { escaparHtml } from '../services/apiClient.js';
import {
  listarLineas,
  obtenerLinea,
  crearLinea,
  actualizarLinea,
  activarLinea,
  inactivarLinea,
  eliminarLinea
} from '../services/lineasAyudaAdminService.js';

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
const vacioLineas = $('vacioLineas');
const confirmModal = $('confirmModal');
const toast = $('toast');

let actual = null;      // detalle en curso (null = nuevo)
let accionModal = null; // { tipo, id, nombre }

const ICONO_TELEFONO =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';

const ICONO_ACTIVAR =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';

const ICONO_INACTIVAR =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>';

const ICONO_ELIMINAR =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

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
  if (e.includes('activ') && !e.includes('inactiv')) return '<span class="est est-p">Activa</span>';
  if (e.includes('elimin')) return '<span class="est est-i">Eliminada</span>';
  return '<span class="est est-i">' + escaparHtml(estado || 'Inactiva') + '</span>';
}

function esActiva(estado) {
  const e = String(estado || '').toLowerCase();
  return e.includes('activ') && !e.includes('inactiv');
}

function esEliminada(estado) {
  return String(estado || '').toLowerCase().includes('elimin');
}

// ---------- Pantalla lista ----------
function pintarSkeleton() {
  if (skLista) skLista.hidden = false;
  if (vacioLineas) vacioLineas.hidden = true;
  listaErr.classList.remove('show');
  listaC.innerHTML = '';
}

function botonAccion(texto, clase, handler) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = clase;
  b.textContent = texto;
  b.addEventListener('click', handler);
  return b;
}

function renderLista(items) {
  listaErr.classList.remove('show');
  listaC.innerHTML = '';
  if (!items.length) {
    if (vacioLineas) vacioLineas.hidden = false;
    return;
  }
  if (vacioLineas) vacioLineas.hidden = true;

  items.forEach((l) => {
    const d = document.createElement('div');
    d.className = 'lista-item';

    const contacto = l.telefono || l.url || 'Sin medio de contacto';
    d.innerHTML =
      '<div class="avatar" aria-hidden="true">' + ICONO_TELEFONO + '</div>' +
      '<div class="info"><b>' + escaparHtml(l.nombre) + '</b>' +
      '<small>' + escaparHtml(contacto) + '</small></div>' +
      etiquetaEstado(l.estado);

    if (!esEliminada(l.estado)) {
      const acciones = document.createElement('div');
      acciones.className = 'mini-actions';

      acciones.appendChild(botonAccion('Editar', 'btn btn-cancel btn-sm', () => abrirEditar(l.id)));

      if (esActiva(l.estado)) {
        acciones.appendChild(botonAccion('Inactivar', 'btn btn-cancel btn-sm', () => confirmarAccion('inactivar', l)));
      } else {
        acciones.appendChild(botonAccion('Activar', 'btn btn-cancel btn-sm', () => confirmarAccion('activar', l)));
      }

      acciones.appendChild(botonAccion('Eliminar', 'btn btn-danger btn-sm', () => confirmarAccion('eliminar', l)));
      d.appendChild(acciones);
    }

    listaC.appendChild(d);
  });
}

async function cargarLista(q = '') {
  pintarSkeleton();
  try {
    const items = await listarLineas(q);
    renderLista(items);
  } catch (error) {
    listaC.innerHTML = '';
    if (vacioLineas) vacioLineas.hidden = true;
    listaErr.textContent = error.message || 'No fue posible cargar las líneas de ayuda. Intente nuevamente';
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

// ---------- Editor ----------
const CAMPOS = {
  eNombre: 'nombre',
  eDescripcion: 'descripcion',
  eDescripcionCorta: 'descripcionCorta',
  eTelefono: 'telefono',
  eUrl: 'url',
  eHorario: 'horario',
  eCobertura: 'cobertura',
  eWhatsapp: 'whatsapp',
  eEmail: 'email',
  eChat: 'chatUrl',
  eVideollamada: 'videollamada',
  eTipoAtencion: 'tipoAtencion',
  eDepartamento: 'departamento',
  eMunicipio: 'municipio',
  ePoblacion: 'poblacion',
  eFuente: 'fuente'
};

function abrirNuevo() {
  actual = null;
  $('editTitulo').textContent = 'Nueva línea de ayuda';
  if ($('editSub')) $('editSub').textContent = 'Ingrese el nombre y al menos un medio de contacto (teléfono o URL).';
  Object.keys(CAMPOS).forEach((id) => { if ($(id)) $(id).value = ''; });
  $('eFechaVerificacion').value = '';
  $('eForm').classList.remove('show');
  show('screenEditar');
}

function llenarFormulario(detalle) {
  Object.entries(CAMPOS).forEach(([id, campo]) => {
    if ($(id)) $(id).value = detalle[campo] || '';
  });
  const f = (detalle.fechaVerificacion || '').toString();
  $('eFechaVerificacion').value = f ? f.slice(0, 10) : '';
}

async function abrirEditar(id) {
  try {
    actual = await obtenerLinea(id);
  } catch (error) {
    showToast(error.message);
    return;
  }
  $('editTitulo').textContent = 'Editar línea de ayuda';
  if ($('editSub')) $('editSub').textContent = 'Estado: ' + (actual.estado || 'Activa');
  llenarFormulario(actual);
  $('eForm').classList.remove('show');
  show('screenEditar');
}

// ---------- Guardar (crear / editar) ----------
function valor(id) {
  const el = $(id);
  return el ? el.value.trim() : '';
}

function orNull(v) {
  const t = String(v ?? '').trim();
  return t ? t : null;
}

function recogerEditor() {
  const fecha = valor('eFechaVerificacion');
  return {
    nombre: valor('eNombre'),
    descripcion: orNull(valor('eDescripcion')),
    descripcionCorta: orNull(valor('eDescripcionCorta')),
    telefono: orNull(valor('eTelefono')),
    url: orNull(valor('eUrl')),
    horario: orNull(valor('eHorario')),
    cobertura: orNull(valor('eCobertura')),
    whatsapp: orNull(valor('eWhatsapp')),
    email: orNull(valor('eEmail')),
    chatUrl: orNull(valor('eChat')),
    videollamada: orNull(valor('eVideollamada')),
    tipoAtencion: orNull(valor('eTipoAtencion')),
    departamento: orNull(valor('eDepartamento')),
    municipio: orNull(valor('eMunicipio')),
    poblacion: orNull(valor('ePoblacion')),
    fuente: orNull(valor('eFuente')),
    fechaVerificacion: fecha || null
  };
}

function validarEditor(p) {
  if (!p.nombre) return false;
  if (!p.telefono && !p.url) return false;
  return true;
}

$('btnGuardar').addEventListener('click', async () => {
  const payload = recogerEditor();
  const errBox = $('eForm');
  if (!validarEditor(payload)) {
    errBox.textContent = 'Debes ingresar nombre y al menos un medio de contacto (teléfono o URL)';
    errBox.classList.add('show');
    return;
  }
  errBox.classList.remove('show');

  const btn = $('btnGuardar');
  btn.disabled = true;
  try {
    const r = actual && actual.id
      ? await actualizarLinea(actual.id, payload)
      : await crearLinea(payload);
    showToast(r.mensaje);
    await cargarLista(buscarC.value.trim());
    show('screenLista');
  } catch (error) {
    errBox.textContent = error.message || 'No fue posible guardar la línea de ayuda';
    errBox.classList.add('show');
  } finally {
    btn.disabled = false;
  }
});

$('btnCancelar').addEventListener('click', () => {
  actual = null;
  show('screenLista');
});

$('btnNueva').addEventListener('click', abrirNuevo);

// ---------- Activar / Inactivar / Eliminar ----------
const CONFIRMACIONES = {
  activar: {
    titulo: 'Activar línea de ayuda',
    verbo: 'Sí, activar',
    icono: ICONO_ACTIVAR,
    claseIcono: 'modal-icon info',
    claseBoton: 'btn-modal ok',
    texto: (n) => '¿Desea activar "' + n + '"? Volverá a ser visible para los usuarios.'
  },
  inactivar: {
    titulo: 'Inactivar línea de ayuda',
    verbo: 'Sí, inactivar',
    icono: ICONO_INACTIVAR,
    claseIcono: 'modal-icon warn',
    claseBoton: 'btn-modal warn',
    texto: (n) => '¿Desea inactivar "' + n + '"? Dejará de ser visible para los usuarios.'
  },
  eliminar: {
    titulo: 'Eliminar línea de ayuda',
    verbo: 'Sí, eliminar',
    icono: ICONO_ELIMINAR,
    claseIcono: 'modal-icon',
    claseBoton: 'btn-modal danger',
    texto: (n) => '¿Desea eliminar "' + n + '"? Esta acción la oculta del sistema (borrado lógico).'
  }
};

function confirmarAccion(tipo, linea) {
  const cfg = CONFIRMACIONES[tipo];
  if (!cfg) return;
  accionModal = { tipo, id: linea.id, nombre: linea.nombre || '' };
  const ico = $('confirmIco');
  ico.className = cfg.claseIcono;
  ico.innerHTML = cfg.icono;
  $('confirmTitle').textContent = cfg.titulo;
  $('confirmText').textContent = cfg.texto(accionModal.nombre);
  const btnSi = $('btnSi');
  btnSi.className = cfg.claseBoton;
  btnSi.textContent = cfg.verbo;
  abrirModal();
}

async function ejecutarAccion() {
  const accion = accionModal;
  accionModal = null;
  cerrarModal();
  if (!accion || !accion.id) return;
  try {
    const r = accion.tipo === 'activar'
      ? await activarLinea(accion.id)
      : accion.tipo === 'inactivar'
        ? await inactivarLinea(accion.id)
        : await eliminarLinea(accion.id);
    showToast(r.mensaje);
    await cargarLista(buscarC.value.trim());
  } catch (error) {
    showToast(error.message);
  }
}

$('btnSi').addEventListener('click', ejecutarAccion);
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
