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
const navPerfil = document.getElementById('navPerfil');
const navHistorial = document.getElementById('navHistorial');
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

// Encabezado según estado: sesión registrada (rol + salir) o accesos públicos.
// El invitado trabaja en su panel: aquí siempre se muestra la landing pública.
function pintarEncabezado() {
  const usuario = authService.getSesion();

  if (usuario && !invitadoService.esInvitado()) {
    const rol = usuario.rol || usuario.tipo_usuario || 'Paciente';
    if (headerGuest) headerGuest.style.display = 'none';
    if (headerSesion) headerSesion.style.display = 'inline-flex';
    if (roleBadge) roleBadge.textContent = rol;
    if (navPerfil) navPerfil.style.display = 'inline-block';
    if (navHistorial) navHistorial.style.display = 'inline-block';
  } else {
    if (headerGuest) headerGuest.style.display = 'inline-flex';
    if (headerSesion) headerSesion.style.display = 'none';
    if (navPerfil) navPerfil.style.display = 'none';
    if (navHistorial) navHistorial.style.display = 'none';
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
