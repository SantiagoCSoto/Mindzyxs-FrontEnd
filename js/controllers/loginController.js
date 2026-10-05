/**
 * Controlador para views/login.html
 * Gestiona la autenticación con el backend y la redirección a inicio.html.
 */

import { authService } from '../services/authService.js';
import { invitadoService } from '../services/invitadoService.js';
import { esCampoVacio, tieneArroba } from '../utils/validators.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner, abrirModal, cerrarModal } from '../utils/alerts.js';

const formLogin = document.getElementById('form-login');
const inputCorreo = document.getElementById('correo');
const inputPassword = document.getElementById('password');
const errorCorreo = document.getElementById('error-correo');
const errorPassword = document.getElementById('error-password');
const bannerError = document.getElementById('banner-error-login');
const modalRol = document.getElementById('modal-rol');
const modalTitulo = document.getElementById('modal-titulo');
const modalSubtitulo = document.getElementById('modal-subtitulo');
const btnLoginSubmit = document.getElementById('btn-login');
const btnModalContinuar = document.getElementById('btn-modal-continuar');
const btnModoInvitado = document.getElementById('btn-modo-invitado');

// Acción para entrar en Modo Invitado (PB-06) -> Panel del invitado
if (btnModoInvitado) {
  btnModoInvitado.addEventListener('click', async () => {
    btnModoInvitado.disabled = true;
    btnModoInvitado.textContent = 'Accediendo...';
    try {
      await invitadoService.iniciarModoInvitado('login');
    } finally {
      window.location.href = 'panel_invitado.html';
    }
  });
}

// Precargar correo si proviene de registro o recuperación
const correoInicial = sessionStorage.getItem('correoRegistro');
if (correoInicial && inputCorreo && !inputCorreo.value) {
  inputCorreo.value = correoInicial;
}

// Limpieza de errores en tiempo real al escribir
if (inputCorreo) {
  inputCorreo.addEventListener('input', () => {
    limpiarErrorInput(inputCorreo, errorCorreo);
    ocultarBanner(bannerError);
  });
}

if (inputPassword) {
  inputPassword.addEventListener('input', () => {
    limpiarErrorInput(inputPassword, errorPassword);
    ocultarBanner(bannerError);
  });
}

// Validación de campos obligatorios y formato
function validarFormulario() {
  let esValido = true;
  const correo = inputCorreo.value.trim();
  const password = inputPassword.value.trim();

  // Validación de correo
  if (esCampoVacio(correo)) {
    marcarErrorInput(inputCorreo, errorCorreo, 'Este campo es obligatorio');
    esValido = false;
  } else if (!tieneArroba(correo)) {
    marcarErrorInput(inputCorreo, errorCorreo, 'Ingresa un correo válido');
    esValido = false;
  } else {
    limpiarErrorInput(inputCorreo, errorCorreo);
  }

  // Validación de contraseña
  if (esCampoVacio(password)) {
    marcarErrorInput(inputPassword, errorPassword, 'Este campo es obligatorio');
    esValido = false;
  } else {
    limpiarErrorInput(inputPassword, errorPassword);
  }

  return esValido;
}

// Procesamiento de inicio de sesión hacia el backend
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarBanner(bannerError);

    if (!validarFormulario()) {
      return;
    }

    const correo = inputCorreo.value.trim();
    const password = inputPassword.value.trim();

    if (btnLoginSubmit) {
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.textContent = 'Iniciando sesión...';
    }

    try {
      const resultado = await authService.login(correo, password);

      if (btnLoginSubmit) {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.textContent = 'Iniciar sesión';
      }

      if (resultado.exito) {
        ocultarBanner(bannerError);
        if (modalTitulo) modalTitulo.textContent = `Sesión iniciada \u2014 ${resultado.rol}`;
        if (modalSubtitulo) modalSubtitulo.textContent = `Redirigiendo a: ${resultado.destino}`;
        abrirModal(modalRol);

        // Redirigir según el rol después de 1.5 segundos
        setTimeout(() => {
          window.location.href = destinoPorRol();
        }, 1500);
      } else {
        mostrarBanner(bannerError, resultado.mensaje || 'Correo o contraseña incorrectos');
      }
    } catch (err) {
      if (btnLoginSubmit) {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.textContent = 'Iniciar sesión';
      }
      mostrarBanner(bannerError, 'Error de conexión. Intenta de nuevo.');
    }
  });
}

// Cerrar modal y redirigir según el rol
function destinoPorRol() {
  const rol = String(localStorage.getItem('rol') || '').toLowerCase();
  if (rol === 'administrador' || rol === 'admin') return 'admin_bd.html';
  if (rol.includes('paciente')) return 'panel_paciente.html';
  if (rol.includes('psicologo')) return 'pacientes_autorizados.html';
  return 'inicio.html';
}

if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', () => {
    cerrarModal(modalRol);
    window.location.href = destinoPorRol();
  });
}

if (modalRol) {
  modalRol.addEventListener('click', (e) => {
    if (e.target === modalRol) {
      cerrarModal(modalRol);
      window.location.href = destinoPorRol();
    }
  });
}

