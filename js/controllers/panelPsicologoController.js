/**
 * Controlador del Panel del psicólogo (views/panel_psicologo.html).
 * Dashboard estilo panel_paciente: pacientes autorizados, cuestionarios,
 * estadísticas, perfil profesional y chat de apoyo.
 * Si no hay sesión de psicólogo, redirige a login.html.
 */

import { authService } from '../services/authService.js';
import { avisoService } from '../services/avisoService.js';

const sesion = authService.getSesion();
const rol = String(sesion?.rol || sesion?.tipo_usuario || '').toLowerCase();
if (!sesion || !rol.includes('psicologo')) {
  window.location.href = 'login.html';
}

const btnPacientes = document.getElementById('btn-psicologo-pacientes');
const btnCuestionarios = document.getElementById('btn-psicologo-cuestionarios');
const btnEstadisticas = document.getElementById('btn-psicologo-estadisticas');
const btnPerfil = document.getElementById('btn-psicologo-perfil');
const btnChat = document.getElementById('btn-psicologo-chat');
const btnLogoutTop = document.getElementById('btn-logout-top');

const avisoModal = document.getElementById('avisoModal');
const errModal = document.getElementById('errModal');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');
const errOk = document.getElementById('errOk');
const footerAviso = document.getElementById('footerAviso');
const toast = document.getElementById('toast');

function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function openAviso() {
  if (avisoModal) avisoModal.classList.add('open');
  await avisoService.registrarVisualizacion('enlace', 'ok');
}

// 1. Pacientes autorizados (registros)
if (btnPacientes) {
  btnPacientes.addEventListener('click', () => {
    window.location.href = 'pacientes_autorizados.html';
  });
}

// 2. Cuestionarios (crear, editar y asignar)
if (btnCuestionarios) {
  btnCuestionarios.addEventListener('click', () => {
    window.location.href = 'mis_cuestionarios.html';
  });
}

// 3. Estadísticas
if (btnEstadisticas) {
  btnEstadisticas.addEventListener('click', () => {
    window.location.href = 'estadisticas_pacientes.html';
  });
}

// 4. Perfil profesional
if (btnPerfil) {
  btnPerfil.addEventListener('click', () => {
    window.location.href = 'perfil_profesional.html';
  });
}

// 5. Chat de apoyo
if (btnChat) {
  btnChat.addEventListener('click', () => {
    window.location.href = 'chat.html';
  });
}

// Aviso: Entendido / Cerrar / error / footer
if (btnEntendido) {
  btnEntendido.addEventListener('click', () => {
    if (avisoModal) avisoModal.classList.remove('open');
    avisoService.marcarAvisoAceptado();
  });
}
if (btnCerrar) {
  btnCerrar.addEventListener('click', () => {
    if (avisoModal) avisoModal.classList.remove('open');
  });
}
if (errOk) {
  errOk.addEventListener('click', () => {
    if (errModal) errModal.classList.remove('open');
    showToast('No fue posible cargar el mensaje aclaratorio. Intente nuevamente');
  });
}
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    openAviso();
  });
}

// 6. Cerrar sesión -> landing
if (btnLogoutTop) {
  btnLogoutTop.addEventListener('click', () => {
    if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
    authService.logout();
    avisoService.resetearAviso();
    window.location.href = 'login.html';
  });
}
