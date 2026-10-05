/**
 * Controlador de la vista de Observaciones Clínicas (views/observaciones.html).
 * PB-19 HU1-PB19: Permite al psicólogo consultar el detalle de un registro y registrar
 * nuevas observaciones clínicas con firma profesional automática.
 */

import { authService } from '../services/authService.js';
import { psicologoRegistrosService } from '../services/psicologoRegistrosService.js';
import { observacionesService } from '../services/observacionesService.js';

// 1. Verificación obligatoria de sesión y rol de Psicólogo
const sesion = authService.getSesion();
const rol = String(sesion?.rol || sesion?.tipo_usuario || '').toLowerCase();
if (!sesion || !rol.includes('psicologo')) {
  window.location.href = 'login.html';
}

// 2. Elementos del DOM
const detMeta = document.getElementById('detMeta');
const detValor = document.getElementById('detValor');
const detNota = document.getElementById('detNota');
const detQuiz = document.getElementById('detQuiz');
const detObs = document.getElementById('detObs');
const btnAgregarObs = document.getElementById('btnAgregarObs');

const obsModal = document.getElementById('obsModal');
const obsReg = document.getElementById('obsReg');
const obsText = document.getElementById('obsText');
const eObs = document.getElementById('eObs');
const obsCancel = document.getElementById('obsCancel');
const obsSave = document.getElementById('obsSave');

const toast = document.getElementById('toast');
const btnLogout = document.getElementById('btn-logout');
const footerAviso = document.getElementById('footerAviso');

// 3. Parámetros de URL y estado local
const urlParams = new URLSearchParams(window.location.search);
let idPaciente = urlParams.get('idPaciente') ? Number(urlParams.get('idPaciente')) : null;
let idEvento = urlParams.get('idEvento') ? Number(urlParams.get('idEvento')) : null;

let registroDetalle = null;
let listaRegistrosPaciente = [];
let pacienteActual = null;

/**
 * Notificación flotante
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
 * Formateo de fechas legible
 */
function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return String(fechaStr);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  } catch {
    return String(fechaStr);
  }
}

/**
 * Renderiza el detalle del registro y las observaciones
 */
function renderDetalle(detalle) {
  if (!detalle) return;

  const fechaFmt = formatearFecha(detalle.fecha);
  const nombrePac = pacienteActual ? pacienteActual.nombre : 'Paciente';
  const tipoFmt = detalle.tipo === 'Cuestionario' ? 'Cuestionario' : 'Registro Emocional';

  if (detMeta) {
    detMeta.textContent = `${fechaFmt} · ${tipoFmt} · ${nombrePac}`;
  }

  if (detValor) {
    if (detalle.tipo === 'Cuestionario') {
      detValor.textContent = `Nivel: ${detalle.nivel || 'No especificado'}${detalle.puntaje != null ? ` (Puntaje: ${detalle.puntaje})` : ''}`;
    } else {
      detValor.textContent = detalle.puntaje != null
        ? `${detalle.puntaje} / 5${detalle.nivel ? ` (${detalle.nivel})` : ''}`
        : (detalle.nivel || 'Registrado');
    }
  }

  if (detNota) {
    detNota.textContent = detalle.nota && detalle.nota.trim()
      ? detalle.nota
      : 'Sin nota registrada por el paciente.';
  }

  if (detQuiz) {
    if (detalle.cuestionario) {
      let extra = '';
      if (detalle.respuestas && detalle.respuestas.length > 0) {
        extra = ` (${detalle.respuestas.length} respuesta(s) registradas)`;
      }
      detQuiz.textContent = `${detalle.cuestionario}${extra}`;
    } else {
      detQuiz.textContent = 'No aplica.';
    }
  }

  renderObservaciones(detalle.observaciones || []);
}

/**
 * Renderiza la lista de observaciones clínicas
 */
function renderObservaciones(observaciones) {
  if (!detObs) return;
  detObs.innerHTML = '';

  if (!observaciones || observaciones.length === 0) {
    detObs.innerHTML = '<div class="empty">Sin observaciones clínicas registradas para este evento.</div>';
    return;
  }

  observaciones.forEach((o) => {
    const item = document.createElement('div');
    item.className = 'obs';
    const firma = o.firma ? ` · ${o.firma}` : '';
    const fObs = formatearFecha(o.fecha);

    item.innerHTML = `
      ${escaparHtml(o.contenido)}
      <small>${escaparHtml(fObs)}${escaparHtml(firma)}</small>
    `;
    detObs.appendChild(item);
  });
}

/**
 * Carga inicial de datos
 */
async function inicializar() {
  try {
    // Si no se proporcionaron parámetros, obtener el primer paciente autorizado
    if (!idPaciente) {
      const resPac = await psicologoRegistrosService.obtenerPacientes();
      if (resPac.ok && resPac.data && resPac.data.length > 0) {
        pacienteActual = resPac.data[0];
        idPaciente = pacienteActual.id;
      } else {
        if (detMeta) detMeta.textContent = 'No tiene pacientes autorizados actualmente.';
        if (detObs) detObs.innerHTML = '<div class="empty">No tiene pacientes autorizados.</div>';
        return;
      }
    } else {
      const resPac = await psicologoRegistrosService.obtenerPacientes();
      if (resPac.ok && resPac.data) {
        pacienteActual = resPac.data.find((p) => p.id === idPaciente) || { id: idPaciente, nombre: 'Paciente' };
      }
    }

    // Obtener registros del paciente para asociar en el select
    const resRegs = await psicologoRegistrosService.obtenerRegistrosPaciente(idPaciente);
    if (resRegs.ok && Array.isArray(resRegs.data)) {
      listaRegistrosPaciente = resRegs.data;

      if (!idEvento && listaRegistrosPaciente.length > 0) {
        idEvento = listaRegistrosPaciente[0].id;
      }
    }

    // Actualizar el selector de registros en el modal
    if (obsReg) {
      let opcionesHtml = '<option value="0">General del paciente</option>';
      listaRegistrosPaciente.forEach((r) => {
        const esSel = r.id === idEvento ? 'selected' : '';
        opcionesHtml += `<option value="${r.id}" ${esSel}>${escaparHtml(formatearFecha(r.fecha))} - ${escaparHtml(r.tipo)}</option>`;
      });
      obsReg.innerHTML = opcionesHtml;
    }

    // Cargar detalle del registro específico
    if (idEvento) {
      const resDet = await psicologoRegistrosService.obtenerDetalleRegistro(idEvento);
      if (resDet.ok && resDet.data) {
        registroDetalle = resDet.data;
        renderDetalle(registroDetalle);
      } else {
        showToast(resDet.error || 'No fue posible cargar el registro.');
        if (detMeta) detMeta.textContent = 'No se encontró el registro seleccionado.';
        if (detObs) detObs.innerHTML = '<div class="empty">Registro no disponible.</div>';
      }
    } else {
      if (detMeta) detMeta.textContent = `Observaciones generales · ${pacienteActual.nombre}`;
      if (detValor) detValor.textContent = 'No aplica';
      if (detNota) detNota.textContent = 'No aplica';
      if (detQuiz) detQuiz.textContent = 'No aplica';
      if (detObs) detObs.innerHTML = '<div class="empty">Sin observaciones generales registradas.</div>';
    }
  } catch (err) {
    console.error('[HU1-PB19] Error en inicializar:', err);
    showToast('Error de conexión al cargar la información.');
  }
}

// -------------------------------------------------------------
// MODAL DE OBSERVACIÓN
// -------------------------------------------------------------

function abrirModalObs() {
  if (!obsModal) return;
  if (obsText) obsText.value = '';
  if (eObs) eObs.classList.remove('show');
  if (obsSave) {
    obsSave.disabled = false;
    obsSave.textContent = 'Guardar observación';
  }
  obsModal.classList.add('open');
  obsModal.setAttribute('aria-hidden', 'false');
  if (obsText) obsText.focus();
}

function cerrarModalObs() {
  if (!obsModal) return;
  obsModal.classList.remove('open');
  obsModal.setAttribute('aria-hidden', 'true');
}

async function guardarObservacion() {
  const contenido = obsText ? obsText.value.trim() : '';
  if (!contenido) {
    if (eObs) eObs.classList.add('show');
    return;
  }

  if (eObs) eObs.classList.remove('show');
  if (!idPaciente) {
    showToast('No se identificó el paciente autorizado.');
    return;
  }

  const idEventoSeleccionado = obsReg && Number(obsReg.value) > 0
    ? Number(obsReg.value)
    : (idEvento || null);

  if (obsSave) {
    obsSave.disabled = true;
    obsSave.textContent = 'Guardando...';
  }

  try {
    const res = await observacionesService.crearObservacion({
      idPaciente: idPaciente,
      idEvento: idEventoSeleccionado,
      contenido: contenido
    });

    if (res.ok) {
      cerrarModalObs();
      showToast(res.mensaje || 'Observación guardada correctamente');

      // Recargar el detalle del registro para mostrar la nueva observación
      if (idEventoSeleccionado) {
        idEvento = idEventoSeleccionado;
        const resDet = await psicologoRegistrosService.obtenerDetalleRegistro(idEvento);
        if (resDet.ok && resDet.data) {
          registroDetalle = resDet.data;
          renderDetalle(registroDetalle);
        }
      } else {
        await inicializar();
      }
    } else {
      showToast(res.error || 'No fue posible guardar la observación.');
      if (obsSave) {
        obsSave.disabled = false;
        obsSave.textContent = 'Guardar observación';
      }
    }
  } catch (err) {
    console.error('[HU1-PB19] Error en guardarObservacion:', err);
    showToast('Ocurrió un error inesperado al guardar la observación.');
    if (obsSave) {
      obsSave.disabled = false;
      obsSave.textContent = 'Guardar observación';
    }
  }
}

// 4. Event Listeners
if (btnAgregarObs) {
  btnAgregarObs.addEventListener('click', abrirModalObs);
}

if (obsCancel) {
  obsCancel.addEventListener('click', cerrarModalObs);
}

if (obsSave) {
  obsSave.addEventListener('click', guardarObservacion);
}

if (obsModal) {
  obsModal.addEventListener('click', (e) => {
    if (e.target === obsModal) cerrarModalObs();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && obsModal?.classList.contains('open')) {
    cerrarModalObs();
  }
});

// Cierre de sesión
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
      authService.logout();
      window.location.href = 'login.html';
    }
  });
}

// Aviso footer
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Mindzyxs no realiza diagnósticos clínicos.');
  });
}

// Inicializar al cargar
inicializar();
