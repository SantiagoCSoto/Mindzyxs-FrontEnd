/**
 * Controlador para views/login.html
 * Gestiona interacciones de usuario, validaciones y autenticación.
 */

import { authService } from '../services/authService.js';
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
const btnModalContinuar = document.getElementById('btn-modal-continuar');

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

// Validación de campos
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

// Procesamiento de inicio de sesión
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarBanner(bannerError);

    if (!validarFormulario()) {
      return;
    }

    const correo = inputCorreo.value.trim();
    const password = inputPassword.value.trim();

    const resultado = await authService.login(correo, password);

    if (resultado.exito) {
      ocultarBanner(bannerError);
      if (modalTitulo) modalTitulo.textContent = `Sesión iniciada \u2014 ${resultado.rol}`;
      if (modalSubtitulo) modalSubtitulo.textContent = `Redirigiendo a: ${resultado.destino}`;
      abrirModal(modalRol);
    } else {
      mostrarBanner(bannerError, resultado.mensaje);
    }
  });
}

// Eventos de cierre de modal
if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', () => {
    cerrarModal(modalRol);
  });
}

if (modalRol) {
  modalRol.addEventListener('click', (e) => {
    if (e.target === modalRol) {
      cerrarModal(modalRol);
    }
  });
}
