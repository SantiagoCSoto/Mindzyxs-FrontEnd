/**
 * Controlador de la Landing pública (views/inicio.html).
 * Presentación de la plataforma (objetivo, Nosotros, Ayuda con correo),
 * accesos arriba (Registrarse / Iniciar sesión / Modo invitado) y
 * enlace permanente del mensaje aclaratorio (PB-04).
 * El dashboard de invitado vive en views/panel_invitado.html.
 */

import { authService } from '../services/authService.js';
import { avisoService } from '../services/avisoService.js';
import { invitadoService } from '../services/invitadoService.js';

const headerGuest = document.getElementById('headerGuest');
const headerSesion = document.getElementById('headerSesion');
const roleBadge = document.getElementById('roleBadge');
const btnLogout = document.getElementById('btn-logout');
const btnModoInvitado = document.getElementById('btn-modo-invitado');

const avisoModal = document.getElementById('avisoModal');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');
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

// Encabezado según estado: sesión activa (rol + salir) o accesos públicos.
function pintarEncabezado() {
  const esInvitado = invitadoService.esInvitado();
  const usuario = authService.getSesion();

  if (esInvitado) {
    // El invitado trabaja en su panel; si cae aquí, se le ofrece volver.
    if (headerGuest) headerGuest.style.display = 'none';
    if (headerSesion) headerSesion.style.display = 'inline-flex';
    if (roleBadge) roleBadge.textContent = 'Invitado';
    return;
  }

  if (usuario) {
    const rol = usuario.rol || usuario.tipo_usuario || 'Paciente';
    if (headerGuest) headerGuest.style.display = 'none';
    if (headerSesion) headerSesion.style.display = 'inline-flex';
    if (roleBadge) roleBadge.textContent = rol;
  } else {
    if (headerGuest) headerGuest.style.display = 'inline-flex';
    if (headerSesion) headerSesion.style.display = 'none';
  }
}

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    if (invitadoService.esInvitado()) {
      invitadoService.salirModoInvitado('header').finally(() => window.location.reload());
      return;
    }
    authService.logout();
    avisoService.resetearAviso();
    sessionStorage.removeItem('es_invitado');
    window.location.reload();
  });
}

// Entrar como invitado -> registra acceso y va al panel de invitado.
if (btnModoInvitado) {
  btnModoInvitado.addEventListener('click', async () => {
    await invitadoService.iniciarModoInvitado('landing');
    window.location.href = 'panel_invitado.html';
  });
}

// Mensaje aclaratorio permanente (PB-04).
if (footerAviso) {
  footerAviso.addEventListener('click', async (e) => {
    e.preventDefault();
    if (avisoModal) avisoModal.classList.add('open');
    await avisoService.registrarVisualizacion('enlace', 'ok');
  });
}
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

pintarEncabezado();
avisoService.logAuditoria?.('Landing renderizada (presentación, Nosotros, Ayuda)');
