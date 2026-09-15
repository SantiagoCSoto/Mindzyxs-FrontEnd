/**
 * Controlador para Página de Inicio / Bienvenida
 * Maneja la lógica de logout y carga de datos del usuario autenticado
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
      // Mostrar el nombre del usuario
      const nombre = usuario.nombres || usuario.nombre || 'Usuario';
      nombreUsuarioSpan.textContent = nombre;
      
      // Mostrar el rol del usuario
      const rol = usuario.rol || usuario.tipo_usuario || 'Paciente';
      rolUsuarioSpan.textContent = rol;
    } catch (error) {
      console.error('Error al parsear datos de usuario:', error);
      // Valores por defecto
      nombreUsuarioSpan.textContent = 'Usuario';
      rolUsuarioSpan.textContent = 'Paciente';
    }
  } else {
    // Si no hay datos de sesión, redirigir a login
    console.warn('No hay sesión activa, redirigiendo a login');
    window.location.href = 'login.html';
  }
}

// Función de logout
function logout() {
  // Mostrar confirmación de cierre de sesión
  const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
  
  if (confirmacion) {
    // Limpiar todos los datos de sesión y autenticación
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('autenticado');
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('autenticado');
    
    // Redirigir a la página de login
    window.location.href = 'login.html';
  }
}

// Event listeners
btnLogout.addEventListener('click', logout);

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarDatosUsuario);