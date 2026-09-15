/**
 * Controlador para Página de Inicio
 * Maneja la lógica de logout y funcionalidades básicas del panel
 */

const btnLogout = document.getElementById('btn-logout');
const nombreUsuarioSpan = document.getElementById('nombre-usuario');
const rolUsuarioSpan = document.getElementById('rol-usuario');

// Cargar información del usuario desde sessionStorage
function cargarDatosUsuario() {
  // Obtener datos del usuario guardados en sessionStorage durante login
  const usuarioData = sessionStorage.getItem('usuario');
  
  if (usuarioData) {
    try {
      const usuario = JSON.parse(usuarioData);
      nombreUsuarioSpan.textContent = usuario.nombres || usuario.nombre || 'Usuario';
      rolUsuarioSpan.textContent = usuario.rol || usuario.tipo_usuario || 'Paciente';
    } catch (error) {
      console.error('Error al parsear datos de usuario:', error);
      // Valores por defecto
      nombreUsuarioSpan.textContent = 'Usuario';
      rolUsuarioSpan.textContent = 'Paciente';
    }
  } else {
    // Si no hay datos, redirigir a login
    console.warn('No hay sesión activa');
    window.location.href = 'login.html';
  }
}

// Función de logout
function logout() {
  // Mostrar confirmación
  const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
  
  if (confirmacion) {
    // Limpiar datos de sesión
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    
    // Redirigir a login
    window.location.href = 'login.html';
  }
}

// Event listeners
btnLogout.addEventListener('click', logout);

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', cargarDatosUsuario);