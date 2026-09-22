/**
 * Controlador para views/nueva_contrasena.html
 * Maneja la validación y el establecimiento de nueva contraseña con el servicio de autenticación.
 */

import { authService } from '../services/authService.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner, abrirModal, cerrarModal } from '../utils/alerts.js';

const formNuevaContrasena = document.getElementById('form-nueva-contrasena');
const inputContrasena = document.getElementById('contrasena');
const inputConfirmar = document.getElementById('confirmar-contrasena');
const errorContrasena = document.getElementById('error-contrasena');
const errorConfirmar = document.getElementById('error-confirmar');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnGuardar = document.getElementById('btn-guardar');
const toggleButtons = document.querySelectorAll('.btn-toggle-password');

// Funciones de validación
function validarContrasena(contrasena) {
  if (!contrasena || contrasena.trim() === '') {
    return { valido: false, mensaje: 'La contraseña es obligatoria' };
  }
  if (contrasena.length < 6) {
    return { valido: false, mensaje: 'La contraseña debe tener mínimo 6 caracteres' };
  }
  return { valido: true };
}

function validarConfirmacion(contrasena, confirmar) {
  if (!confirmar || confirmar.trim() === '') {
    return { valido: false, mensaje: 'Debes confirmar tu contraseña' };
  }
  if (contrasena !== confirmar) {
    return { valido: false, mensaje: 'Las contraseñas no coinciden' };
  }
  return { valido: true };
}

// Mostrar / ocultar contraseñas
toggleButtons.forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('data-target');
    const inputField = document.getElementById(targetId);

    if (inputField) {
      if (inputField.type === 'password') {
        inputField.type = 'text';
        this.classList.add('visible');
      } else {
        inputField.type = 'password';
        this.classList.remove('visible');
      }
    }
  });
});

// Limpieza de errores en tiempo real
if (inputContrasena) {
  inputContrasena.addEventListener('input', function () {
    limpiarErrorInput(inputContrasena, errorContrasena);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });
}

if (inputConfirmar) {
  inputConfirmar.addEventListener('input', function () {
    limpiarErrorInput(inputConfirmar, errorConfirmar);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });

  inputConfirmar.addEventListener('blur', function () {
    if (inputContrasena.value && inputConfirmar.value) {
      const validacion = validarConfirmacion(inputContrasena.value, inputConfirmar.value);
      if (!validacion.valido) {
        marcarErrorInput(inputConfirmar, errorConfirmar, validacion.mensaje);
      }
    }
  });
}

// Envío del formulario de cambio de contraseña
if (formNuevaContrasena) {
  formNuevaContrasena.addEventListener('submit', async function (e) {
    e.preventDefault();
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);

    const contrasena = inputContrasena.value;
    const confirmar = inputConfirmar.value;

    const validContra = validarContrasena(contrasena);
    if (!validContra.valido) {
      marcarErrorInput(inputContrasena, errorContrasena, validContra.mensaje);
      return;
    } else {
      limpiarErrorInput(inputContrasena, errorContrasena);
    }

    const validConfirm = validarConfirmacion(contrasena, confirmar);
    if (!validConfirm.valido) {
      marcarErrorInput(inputConfirmar, errorConfirmar, validConfirm.mensaje);
      return;
    } else {
      limpiarErrorInput(inputConfirmar, errorConfirmar);
    }

    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Guardando...';
    }

    try {
      const correo = sessionStorage.getItem('correoRecuperacion') || '';
      const codigo = sessionStorage.getItem('codigoRecuperacion') || '';

      const resultado = await authService.resetPassword(correo, codigo, contrasena);

      if (resultado.exito) {
        // Limpiar datos temporales de recuperación
        sessionStorage.removeItem('correoRecuperacion');
        sessionStorage.removeItem('codigoRecuperacion');

        abrirModal(modalExito);
        formNuevaContrasena.reset();
      } else {
        mostrarBanner(bannerError, resultado.mensaje || 'Error al actualizar la contraseña.');
      }
    } catch (err) {
      mostrarBanner(bannerError, 'Error al guardar la contraseña. Intenta de nuevo.');
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar contraseña';
      }
    }
  });
}

if (modalExito) {
  modalExito.addEventListener('click', function (e) {
    if (e.target === modalExito) {
      cerrarModal(modalExito);
      window.location.href = 'login.html';
    }
  });
}
