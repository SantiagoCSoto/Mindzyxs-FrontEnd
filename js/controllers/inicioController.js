/**
 * Controlador para Página de Inicio / Bienvenida (views/inicio.html)
 * Maneja la visualización de datos de sesión activa y la lógica de cierre de sesión.
 */

import { authService } from '../services/authService.js';

const btnLogout = document.getElementById('btn-logout');
const nombreUsuarioSpan = document.getElementById('nombre-usuario');
const rolUsuarioSpan = document.getElementById('rol-usuario');

// Cargar información del usuario desde authService
function cargarDatosUsuario() {
  const usuario = authService.getSesion();

  if (usuario) {
    const nombre = usuario.nombres || usuario.nombre || 'Usuario';
    if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = nombre;

    const rol = usuario.rol || usuario.tipo_usuario || 'Paciente';
    if (rolUsuarioSpan) rolUsuarioSpan.textContent = rol;
  } else {
    // Si no hay datos de sesión, redirigir a login
    console.warn('No hay sesión activa, redirigiendo a login');
    window.location.href = 'login.html';
  }
}

// Función de logout
function logout() {
  const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');

  if (confirmacion) {
    authService.logout();
    window.location.href = 'login.html';
  }
}

// Event listeners
if (btnLogout) {
  btnLogout.addEventListener('click', logout);
}

// Cargar datos del usuario
cargarDatosUsuario();