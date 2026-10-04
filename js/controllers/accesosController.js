/**
 * Controlador de la vista Gestión de accesos (views/gestion_accesos.html).
 * PB-17 HU1-PB17: Permite a los pacientes consultar psicólogos aprobados y
 * autorizar o revocar su acceso a la información emocional.
 */

import { authService } from '../services/authService.js';
import { accesosService } from '../services/accesosService.js';

// 1. Verificación obligatoria de sesión y rol de Paciente
const sesion = authService.getSesion();
const rol = String(sesion?.rol || sesion?.tipo_usuario || '').toLowerCase();
if (!sesion || !rol.includes('paciente')) {
  window.location.href = 'login.html';
}

// 2. Elementos del DOM
const boxLista = document.getElementById('lista');
const boxVacio = document.getElementById('vacio');
const inputBuscar = document.getElementById('buscar');
const modalConfirm = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmText = document.getElementById('confirmText');
const btnSi = document.getElementById('btnSi');
const btnNo = document.getElementById('btnNo');
const toast = document.getElementById('toast');
const btnLogout = document.getElementById('btn-logout');
const footerAviso = document.getElementById('footerAviso');

// 3. Estado local
let listaPsicologos = [];
let psicologoSeleccionado = null;
let accionPendiente = null; // 'autorizar' | 'revocar'
let debounceTimer = null;

/**
 * Muestra notificación flotante temporal
 */
function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/**
 * Escapado seguro contra XSS
 */
function escaparHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/**
 * Extrae las dos primeras iniciales para el avatar
 */
function iniciales(nombre) {
  const palabras = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 'PS';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/**
 * Renderiza la lista de psicólogos filtrada en el DOM
 */
function render(filtro = '') {
  if (!boxLista || !boxVacio) return;
  boxLista.innerHTML = '';

  const q = filtro.trim().toLowerCase();
  const items = listaPsicologos.filter((p) => {
    const textoCompleto = `${p.nombre} ${p.especialidades.join(' ')}`.toLowerCase();
    return textoCompleto.includes(q);
  });

  if (items.length === 0) {
    boxVacio.style.display = 'block';
    return;
  }

  boxVacio.style.display = 'none';

  items.forEach((p) => {
    const fila = document.createElement('div');
    fila.className = 'fila';

    const especTexto = p.especialidades.length > 0
      ? p.especialidades.join(', ')
      : 'Sin especialidad registrada';

    fila.innerHTML = `
      <div class="avatar" aria-hidden="true">${escaparHtml(iniciales(p.nombre))}</div>
      <div class="info">
        <b>${escaparHtml(p.nombre)}</b>
        <small>${escaparHtml(especTexto)}</small>
      </div>
      <span class="est ${p.autorizado ? 'est-ok' : 'est-no'}">
        ${p.autorizado ? 'Autorizado' : 'No autorizado'}
      </span>
    `;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `btn ${p.autorizado ? 'btn-rev' : 'btn-aut'}`;
    boton.textContent = p.autorizado ? 'Revocar' : 'Autorizar';
    boton.setAttribute('aria-label', `${p.autorizado ? 'Revocar acceso a' : 'Autorizar a'} ${p.nombre}`);

    boton.addEventListener('click', () => abrirModal(p));

    fila.appendChild(boton);
    boxLista.appendChild(fila);
  });
}

/**
 * Abre el modal de confirmación
 */
function abrirModal(p) {
  psicologoSeleccionado = p;
  accionPendiente = p.autorizado ? 'revocar' : 'autorizar';

  if (accionPendiente === 'autorizar') {
    confirmTitle.textContent = 'Autorizar psicólogo';
    confirmText.textContent = `¿Desea autorizar a ${p.nombre} para acceder a sus registros emocionales?`;
    btnSi.textContent = 'Sí, autorizar';
    btnSi.className = 'btn-modal btn-ok';
  } else {
    confirmTitle.textContent = 'Revocar acceso';
    confirmText.textContent = `¿Desea revocar el acceso de ${p.nombre}? Ya no podrá visualizar sus registros.`;
    btnSi.textContent = 'Sí, revocar';
    btnSi.className = 'btn-modal btn-ok btn-rev-danger';
  }

  btnSi.disabled = false;
  modalConfirm.classList.add('open');
  modalConfirm.setAttribute('aria-hidden', 'false');
  btnSi.focus();
}

/**
 * Cierra el modal de confirmación
 */
function cerrarModal() {
  if (!modalConfirm) return;
  modalConfirm.classList.remove('open');
  modalConfirm.setAttribute('aria-hidden', 'true');
  psicologoSeleccionado = null;
  accionPendiente = null;
}

/**
 * Ejecuta la acción confirmada de autorizar o revocar
 */
async function ejecutarAccion() {
  if (!psicologoSeleccionado || !accionPendiente) return;

  const targetPsi = psicologoSeleccionado;
  const esAutorizar = accionPendiente === 'autorizar';

  btnSi.disabled = true;
  btnSi.textContent = 'Procesando...';

  try {
    const res = esAutorizar
      ? await accesosService.autorizarAcceso(targetPsi.idPsicologo)
      : await accesosService.revocarAcceso(targetPsi.idPsicologo);

    if (res.ok) {
      targetPsi.autorizado = esAutorizar;
      cerrarModal();
      showToast(res.mensaje || (esAutorizar ? 'Acceso autorizado correctamente' : 'Acceso revocado correctamente'));
      render(inputBuscar ? inputBuscar.value : '');
    } else {
      showToast(res.error || 'No fue posible completar la acción.');
      btnSi.disabled = false;
      btnSi.textContent = esAutorizar ? 'Sí, autorizar' : 'Sí, revocar';
    }
  } catch (err) {
    console.error('[HU1-PB17] Error en ejecutarAccion:', err);
    showToast('Ocurrió un error inesperado al procesar la solicitud.');
    btnSi.disabled = false;
    btnSi.textContent = esAutorizar ? 'Sí, autorizar' : 'Sí, revocar';
  }
}

/**
 * Carga inicial de datos desde el backend
 */
async function cargarDatos(q = '') {
  try {
    const res = await accesosService.obtenerAccesos(q);
    if (res.ok) {
      listaPsicologos = res.data || [];
      render(inputBuscar ? inputBuscar.value : '');
    } else {
      console.warn('[HU1-PB17] Error cargando accesos:', res.error);
      boxLista.innerHTML = '';
      boxVacio.style.display = 'block';
      showToast(res.error || 'No fue posible cargar los psicólogos.');
    }
  } catch (err) {
    console.error('[HU1-PB17] Excepción en cargarDatos:', err);
    boxLista.innerHTML = '';
    boxVacio.style.display = 'block';
    showToast('Error de conexión al cargar la lista de psicólogos.');
  }
}

// 4. Event Listeners
if (btnSi) {
  btnSi.addEventListener('click', ejecutarAccion);
}

if (btnNo) {
  btnNo.addEventListener('click', cerrarModal);
}

if (modalConfirm) {
  modalConfirm.addEventListener('click', (e) => {
    if (e.target === modalConfirm) cerrarModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalConfirm?.classList.contains('open')) {
    cerrarModal();
  }
});

// Buscador en tiempo real con filtrado local y sincronización debounced
if (inputBuscar) {
  inputBuscar.addEventListener('input', (e) => {
    const query = e.target.value;
    render(query);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      cargarDatos(query);
    }, 450);
  });
}

// Cierre de sesión con confirmación
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
      authService.logout();
      window.location.href = 'login.html';
    }
  });
}

// Aviso del footer
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Mindzyxs no realiza diagnósticos clínicos.');
  });
}

// Iniciar carga al cargar el módulo
cargarDatos();
