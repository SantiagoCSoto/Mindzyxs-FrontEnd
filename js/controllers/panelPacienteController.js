/**
 * Controlador del Panel del paciente (views/panel_paciente.html).
 * Dashboard estilo panel_invitado: cuestionario, registro de estado,
 * historial, perfil, recordatorios, chat, líneas de ayuda y aviso.
 * Si no hay sesión de paciente, redirige a login.html.
 */

import { authService } from '../services/authService.js';
import { avisoService } from '../services/avisoService.js';

const sesion = authService.getSesion();
const rol = String(sesion?.rol || sesion?.tipo_usuario || '').toLowerCase();
if (!sesion || !rol.includes('paciente')) {
  window.location.href = 'login.html';
}

const btnCuestionario = document.getElementById('btn-paciente-cuestionario');
const btnRegistro = document.getElementById('btn-paciente-registro');
const btnHistorial = document.getElementById('btn-paciente-historial');
const btnPerfil = document.getElementById('btn-paciente-perfil');
const btnRecordatorios = document.getElementById('btn-paciente-recordatorios');
const btnChat = document.getElementById('btn-paciente-chat');
const btnAccesos = document.getElementById('btn-paciente-accesos');
const btnAyuda = document.getElementById('btn-paciente-ayuda');
const btnAviso = document.getElementById('btn-paciente-aviso');
const btnLogoutTop = document.getElementById('btn-logout-top');

const avisoModal = document.getElementById('avisoModal');
const errModal = document.getElementById('errModal');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');
const errOk = document.getElementById('errOk');
const modalLineasAyuda = document.getElementById('modalLineasAyuda');
const btnCerrarAyuda = document.getElementById('btnCerrarAyuda');
const btnXAyuda = document.getElementById('btnXAyuda');
const footerAviso = document.getElementById('footerAviso');
const toast = document.getElementById('toast');

let pendingAction = null;

function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function openAviso(fromSensitive = null) {
  pendingAction = fromSensitive;
  if (avisoModal) avisoModal.classList.add('open');
  const origen = fromSensitive ? `auto:${fromSensitive}` : 'enlace';
  await avisoService.registrarVisualizacion(origen, 'ok');
}

// 1. Responder cuestionario (aviso PB-04 si no aceptado)
if (btnCuestionario) {
  btnCuestionario.addEventListener('click', () => {
    if (!avisoService.haAceptadoAviso()) {
      pendingAction = 'cuestionario_paciente';
      openAviso('Responder cuestionario');
    } else {
      window.location.href = 'cuestionario_paciente.html';
    }
  });
}

// 2. Registrar estado emocional
if (btnRegistro) {
  btnRegistro.addEventListener('click', () => {
    window.location.href = 'registro_emocional.html';
  });
}

// 3. Historial emocional
if (btnHistorial) {
  btnHistorial.addEventListener('click', () => {
    window.location.href = 'historial.html';
  });
}

// 4. Mi perfil
if (btnPerfil) {
  btnPerfil.addEventListener('click', () => {
    window.location.href = 'perfil.html';
  });
}

// 5. Recordatorios
if (btnRecordatorios) {
  btnRecordatorios.addEventListener('click', () => {
    window.location.href = 'recordatorios.html';
  });
}

// 6. Chat de apoyo
if (btnChat) {
  btnChat.addEventListener('click', () => {
    window.location.href = 'chat.html';
  });
}

// 6.1. Gestión de accesos (PB-17)
if (btnAccesos) {
  btnAccesos.addEventListener('click', () => {
    window.location.href = 'gestion_accesos.html';
  });
}

// 7. Líneas de ayuda (modal)
if (btnAyuda) {
  btnAyuda.addEventListener('click', () => {
    if (modalLineasAyuda) modalLineasAyuda.classList.add('open');
  });
}
if (btnCerrarAyuda) {
  btnCerrarAyuda.addEventListener('click', () => {
    if (modalLineasAyuda) modalLineasAyuda.classList.remove('open');
  });
}
if (btnXAyuda) {
  btnXAyuda.addEventListener('click', () => {
    if (modalLineasAyuda) modalLineasAyuda.classList.remove('open');
  });
}
if (modalLineasAyuda) {
  modalLineasAyuda.addEventListener('click', (e) => {
    if (e.target === modalLineasAyuda) modalLineasAyuda.classList.remove('open');
  });
}

// 8. Aviso importante (modal aclaratorio)
if (btnAviso) {
  btnAviso.addEventListener('click', () => {
    openAviso(null);
  });
}

// Aviso: Entendido / Cerrar / error / footer
if (btnEntendido) {
  btnEntendido.addEventListener('click', () => {
    if (avisoModal) avisoModal.classList.remove('open');
    avisoService.marcarAvisoAceptado();

    if (pendingAction) {
      const accion = pendingAction;
      pendingAction = null;
      if (accion === 'cuestionario_paciente' || accion === 'Responder cuestionario') {
        window.location.href = 'cuestionario_paciente.html';
      }
    }
  });
}
if (btnCerrar) {
  btnCerrar.addEventListener('click', () => {
    if (avisoModal) avisoModal.classList.remove('open');
    if (pendingAction) {
      pendingAction = null;
      showToast('Acceso cancelado - retornó al panel del paciente');
    }
  });
}
if (errOk) {
  errOk.addEventListener('click', () => {
    if (errModal) errModal.classList.remove('open');
    if (pendingAction) {
      showToast('No fue posible cargar el mensaje aclaratorio. Intente nuevamente');
      pendingAction = null;
    }
  });
}
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    openAviso(null);
  });
}

// 9. Cerrar sesión -> landing
if (btnLogoutTop) {
  btnLogoutTop.addEventListener('click', () => {
    if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
    authService.logout();
    avisoService.resetearAviso();
    window.location.href = 'login.html';
  });
}
