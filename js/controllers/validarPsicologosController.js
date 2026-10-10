/**
 * Controlador para la validación y aprobación de psicólogos (PB-26 HU1-PB26).
 * Conecta views/validar_psicologos.html con validarPsicologosService.js:
 * - Lista solicitudes pendientes de revisión con buscador en tiempo real.
 * - Muestra el detalle de credenciales y especialidades del profesional.
 * - Permite descargar la tarjeta profesional en formato PDF.
 * - Permite aprobar o rechazar la solicitud con confirmación modal y notificación.
 * Requiere rol Administrador.
 */

import { authService } from '../services/authService.js';
import {
  listarSolicitudesPendientes,
  obtenerDetalleSolicitud,
  descargarTarjetaProfesional,
  aprobarPsicologo,
  rechazarPsicologo
} from '../services/validarPsicologosService.js';

const $ = (id) => document.getElementById(id);

// 1. Guard de autenticación y rol (Solo Administrador)
const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
  throw new Error('Sesión requerida');
}

const rolActual = String(
  sesion.rol || sesion.tipo_usuario || sessionStorage.getItem('rol') || ''
).toLowerCase();

if (!rolActual.includes('admin')) {
  window.location.href = rolActual.includes('psicologo')
    ? 'panel_psicologo.html'
    : rolActual.includes('paciente')
    ? 'panel_paciente.html'
    : 'inicio.html';
  throw new Error('Acceso restringido a administradores');
}

// 2. Elementos del DOM
const screenLista = $('screenLista');
const screenDetalle = $('screenDetalle');
const listaSolicitudes = $('listaSolicitudes');
const vacio = $('vacio');
const errLista = $('errLista');
const errDetalle = $('errDetalle');

const fBuscar = $('fBuscar');
const btnRefrescar = $('btnRefrescar');
const badgeContador = $('badgeContador');
const contadorTexto = $('contadorTexto');

const btnVolverLista = $('btnVolverLista');
const detAvatar = $('detAvatar');
const detNombre = $('detNombre');
const detEstado = $('detEstado');
const detCorreo = $('detCorreo');
const detFecha = $('detFecha');
const detEspecialidades = $('detEspecialidades');
const detTarjetaBox = $('detTarjetaBox');
const btnDescargarTarjeta = $('btnDescargarTarjeta');
const detSinTarjetaAviso = $('detSinTarjetaAviso');
const txtMotivo = $('txtMotivo');
const lblCaracteres = $('lblCaracteres');
const btnRechazar = $('btnRechazar');
const btnAprobar = $('btnAprobar');

const confirmModal = $('confirmModal');
const confirmTitle = $('confirmTitle');
const confirmText = $('confirmText');
const btnModalNo = $('btnModalNo');
const btnModalSi = $('btnModalSi');
const toast = $('toast');

// 3. Estado en memoria
let solicitudesCargadas = [];
let psicologoActual = null;
let accionModal = null; // 'aprobar' | 'rechazar'

// 4. Funciones utilitarias
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

function escapar(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function obtenerIniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'PS';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    const f = new Date(fechaStr);
    if (isNaN(f.getTime())) return String(fechaStr).split('T')[0];
    return f.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return String(fechaStr).split('T')[0];
  }
}

function cambiarPantalla(pantalla) {
  if (pantalla === 'lista') {
    if (screenLista) screenLista.style.display = 'block';
    if (screenDetalle) screenDetalle.style.display = 'none';
  } else {
    if (screenLista) screenLista.style.display = 'none';
    if (screenDetalle) screenDetalle.style.display = 'block';
  }
}

function abrirModal(titulo, descripcion, accion, textoBotonSi, esPeligro = false) {
  accionModal = accion;
  if (confirmTitle) confirmTitle.textContent = titulo;
  if (confirmText) confirmText.textContent = descripcion;

  if (btnModalSi) {
    btnModalSi.textContent = textoBotonSi;
    btnModalSi.className = esPeligro ? 'btn-modal btn-danger' : 'btn-modal btn-ok';
  }

  if (confirmModal) {
    confirmModal.classList.add('open');
    confirmModal.setAttribute('aria-hidden', 'false');
  }
}

function cerrarModal() {
  accionModal = null;
  if (confirmModal) {
    confirmModal.classList.remove('open');
    confirmModal.setAttribute('aria-hidden', 'true');
  }
}

if (btnModalNo) {
  btnModalNo.addEventListener('click', cerrarModal);
}

if (confirmModal) {
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) cerrarModal();
  });
}

// 5. Renderizado y gestión de la cola de solicitudes
function renderizarLista(items) {
  if (!listaSolicitudes) return;

  if (!items || items.length === 0) {
    listaSolicitudes.innerHTML = '';
    if (vacio) vacio.style.display = 'block';
    return;
  }

  if (vacio) vacio.style.display = 'none';

  listaSolicitudes.innerHTML = items
    .map((p) => {
      const fecha = formatearFecha(p.fechaSolicitud);
      const iniciales = obtenerIniciales(p.nombre);
      return `
        <article class="fila" data-id="${p.id}">
          <div class="avatar" aria-hidden="true">${iniciales}</div>
          <div class="info">
            <b>${escapar(p.nombre || 'Sin nombre registrado')}</b>
            <small>${escapar(p.correo)} ${fecha ? `• Solicitud: ${fecha}` : ''}</small>
          </div>
          <span class="badge-status badge-pendiente">Pendiente</span>
          <button type="button" class="btn btn-sm btn-revisar" data-id="${p.id}" aria-label="Revisar solicitud de ${escapar(p.nombre)}">
            Revisar
          </button>
        </article>
      `;
    })
    .join('');

  // Event listeners para los botones de revisión
  listaSolicitudes.querySelectorAll('.btn-revisar').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      if (id) abrirDetalle(id);
    });
  });
}

function filtrarSolicitudes() {
  const q = (fBuscar?.value || '').trim().toLowerCase();
  if (!q) {
    renderizarLista(solicitudesCargadas);
    return;
  }

  const filtrados = solicitudesCargadas.filter((p) => {
    const nom = String(p.nombre || '').toLowerCase();
    const corr = String(p.correo || '').toLowerCase();
    return nom.includes(q) || corr.includes(q);
  });

  renderizarLista(filtrados);
}

async function cargarLista() {
  if (errLista) {
    errLista.textContent = '';
    errLista.classList.remove('show');
  }

  if (listaSolicitudes) {
    listaSolicitudes.innerHTML = `
      <div class="sk-card fila-sk">
        <div class="sk sk-avatar"></div>
        <div class="sk-info">
          <div class="sk sk-line" style="width: 45%;"></div>
          <div class="sk sk-line" style="width: 65%;"></div>
        </div>
        <div class="sk sk-btn"></div>
      </div>
      <div class="sk-card fila-sk">
        <div class="sk sk-avatar"></div>
        <div class="sk-info">
          <div class="sk sk-line" style="width: 40%;"></div>
          <div class="sk sk-line" style="width: 60%;"></div>
        </div>
        <div class="sk sk-btn"></div>
      </div>
    `;
  }
  if (vacio) vacio.style.display = 'none';

  const res = await listarSolicitudesPendientes();

  if (!res.ok) {
    if (listaSolicitudes) listaSolicitudes.innerHTML = '';
    if (errLista) {
      errLista.textContent = res.error || 'No se pudieron cargar las solicitudes pendientes.';
      errLista.classList.add('show');
    }
    return;
  }

  solicitudesCargadas = Array.isArray(res.data) ? res.data : [];

  const total = solicitudesCargadas.length;
  if (badgeContador && contadorTexto) {
    contadorTexto.textContent = `${total} pendiente${total === 1 ? '' : 's'}`;
    badgeContador.style.display = 'inline-block';
  }

  filtrarSolicitudes();
}

// 6. Detalle de una solicitud
async function abrirDetalle(idPsicologo) {
  if (errDetalle) {
    errDetalle.textContent = '';
    errDetalle.classList.remove('show');
  }

  if (txtMotivo) txtMotivo.value = '';
  if (lblCaracteres) lblCaracteres.textContent = 'Máximo 500 caracteres';

  cambiarPantalla('detalle');

  const res = await obtenerDetalleSolicitud(idPsicologo);
  if (!res.ok || !res.data) {
    showToast(res.error || 'No fue posible cargar el detalle del psicólogo.');
    cambiarPantalla('lista');
    return;
  }

  psicologoActual = res.data;

  // Carga de campos
  if (detAvatar) detAvatar.textContent = obtenerIniciales(psicologoActual.nombre);
  if (detNombre) detNombre.textContent = psicologoActual.nombre || 'Sin nombre';
  if (detCorreo) detCorreo.textContent = psicologoActual.correo || '-';
  if (detFecha) {
    detFecha.textContent = formatearFecha(psicologoActual.fechaSolicitud) || 'No especificada';
  }

  if (detEstado) {
    const estado = psicologoActual.estadoAprobacion || (psicologoActual.pendiente ? 'Pendiente' : 'Aprobado');
    detEstado.textContent = estado;
    detEstado.className = `badge-status ${estado.toLowerCase().includes('pend') ? 'badge-pendiente' : 'badge-aprobado'}`;
  }

  // Especialidades
  if (detEspecialidades) {
    const specs = Array.isArray(psicologoActual.especialidades) ? psicologoActual.especialidades : [];
    if (specs.length > 0) {
      detEspecialidades.innerHTML = specs
        .map((e) => `<span class="chip">${escapar(e)}</span>`)
        .join('');
    } else {
      detEspecialidades.innerHTML = '<span class="chip chip-vacio">Sin especialidades registradas</span>';
    }
  }

  // Tarjeta profesional
  if (psicologoActual.tieneTarjeta) {
    if (detTarjetaBox) detTarjetaBox.style.display = 'flex';
    if (detSinTarjetaAviso) detSinTarjetaAviso.style.display = 'none';
  } else {
    if (detTarjetaBox) detTarjetaBox.style.display = 'none';
    if (detSinTarjetaAviso) detSinTarjetaAviso.style.display = 'block';
  }
}

// 7. Event listeners
if (fBuscar) {
  fBuscar.addEventListener('input', filtrarSolicitudes);
}

if (btnRefrescar) {
  btnRefrescar.addEventListener('click', () => {
    cargarLista();
    showToast('Lista actualizada.');
  });
}

if (btnVolverLista) {
  btnVolverLista.addEventListener('click', () => {
    psicologoActual = null;
    cambiarPantalla('lista');
  });
}

// Descargar tarjeta profesional
if (btnDescargarTarjeta) {
  btnDescargarTarjeta.addEventListener('click', async () => {
    if (!psicologoActual || !psicologoActual.id) return;

    btnDescargarTarjeta.disabled = true;
    btnDescargarTarjeta.textContent = 'Descargando...';

    const res = await descargarTarjetaProfesional(psicologoActual.id);

    btnDescargarTarjeta.disabled = false;
    btnDescargarTarjeta.textContent = 'Descargar tarjeta';

    if (!res.ok || !res.blob) {
      showToast(res.error || 'No fue posible descargar la tarjeta profesional.');
      return;
    }

    try {
      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarjeta_profesional_${psicologoActual.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Descarga iniciada.');
    } catch {
      showToast('Error al guardar el archivo de la tarjeta.');
    }
  });
}

// Conteo de caracteres en motivo
if (txtMotivo && lblCaracteres) {
  txtMotivo.addEventListener('input', () => {
    const largo = txtMotivo.value.length;
    lblCaracteres.textContent = `${largo} / 500 caracteres`;
  });
}

// Acción: Aprobar
if (btnAprobar) {
  btnAprobar.addEventListener('click', () => {
    if (!psicologoActual) return;

    abrirModal(
      'Aprobar solicitud',
      `¿Desea aprobar y habilitar a ${psicologoActual.nombre}? El profesional quedará activo para atender pacientes y recibirá una confirmación por correo electrónico.`,
      'aprobar',
      'Sí, aprobar'
    );
  });
}

// Acción: Rechazar
if (btnRechazar) {
  btnRechazar.addEventListener('click', () => {
    if (!psicologoActual) return;

    const motivo = txtMotivo?.value?.trim() || '';
    const detalleMotivo = motivo
      ? `\n\nMotivo indicado: "${motivo}"`
      : '';

    abrirModal(
      'Rechazar solicitud',
      `¿Está seguro de que desea rechazar la solicitud de ${psicologoActual.nombre}? Se enviará una notificación por correo electrónico.${detalleMotivo}`,
      'rechazar',
      'Sí, rechazar',
      true
    );
  });
}

// 8. Confirmación y ejecución en modal (btnModalSi)
if (btnModalSi) {
  btnModalSi.addEventListener('click', async () => {
    const accion = accionModal;
    const psicologo = psicologoActual;
    cerrarModal();

    if (!psicologo || !psicologo.id) return;

    try {
      if (accion === 'aprobar') {
        const res = await aprobarPsicologo(psicologo.id);
        if (!res.ok) {
          throw new Error(res.error || 'No fue posible aprobar al psicólogo.');
        }

        showToast(res.mensaje || 'Psicólogo aprobado y habilitado exitosamente.');
        psicologoActual = null;
        cambiarPantalla('lista');
        await cargarLista();
      } else if (accion === 'rechazar') {
        const motivo = txtMotivo?.value?.trim() || null;
        const res = await rechazarPsicologo(psicologo.id, motivo);
        if (!res.ok) {
          throw new Error(res.error || 'No fue posible rechazar la solicitud.');
        }

        showToast(res.mensaje || 'Solicitud de psicólogo rechazada.');
        psicologoActual = null;
        cambiarPantalla('lista');
        await cargarLista();
      }
    } catch (err) {
      showToast(err.message || 'Ocurrió un error al procesar la resolución.');
    }
  });
}

// 9. Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarLista();
});
