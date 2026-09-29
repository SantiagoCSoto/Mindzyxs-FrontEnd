/**
 * Controlador para views/verificacion_recuperar.html
 * Gestiona la verificación del código de 6 dígitos para recuperación de contraseña.
 */

import { authService } from '../services/authService.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner, abrirModal, cerrarModal } from '../utils/alerts.js';

const formVerificacionRecuperar = document.getElementById('form-verificacion-recuperar');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnReenviar = document.getElementById('btn-reenviar');
const btnModalContinuar = document.getElementById('btn-modal-continuar');
const btnVerificar = document.getElementById('btn-verificar');

let temporizadorExito = null;

// Obtener correo desde sessionStorage o parámetros URL
const correoRecuperacion = (sessionStorage.getItem('correoRecuperacion') || '').trim();
const chipCorreoStrong = document.querySelector('.chip-correo strong');

if (chipCorreoStrong && correoRecuperacion) {
  chipCorreoStrong.textContent = correoRecuperacion;
}

if (inputCodigo) {
  inputCodigo.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
    limpiarErrorInput(inputCodigo);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });
}

// Envío del formulario de verificación de recuperación
if (formVerificacionRecuperar) {
  formVerificacionRecuperar.addEventListener('submit', async function (e) {
    e.preventDefault();
    const codigo = inputCodigo.value.trim();

    if (codigo.length < 6) {
      marcarErrorInput(inputCodigo);
      mostrarBanner(bannerError, 'Por favor, ingresa el código completo de 6 dígitos.');
      ocultarBanner(bannerExito);
      return;
    }

    if (btnVerificar) {
      btnVerificar.disabled = true;
      btnVerificar.textContent = 'Verificando...';
    }

    try {
      const resultado = await authService.verifyPasswordResetCode(correoRecuperacion, codigo);

      if (btnVerificar) {
        btnVerificar.disabled = false;
        btnVerificar.textContent = 'Verificar';
      }

      if (resultado.exito) {
        limpiarErrorInput(inputCodigo);
        ocultarBanner(bannerError);

        // Guardar código validado para la pantalla de cambio de contraseña
        sessionStorage.setItem('codigoRecuperacion', codigo);

        abrirModal(modalExito);
      } else {
        marcarErrorInput(inputCodigo);
        mostrarBanner(bannerError, resultado.mensaje || 'Código incorrecto. Verifica e intenta nuevamente');
        ocultarBanner(bannerExito);
      }
    } catch (err) {
      if (btnVerificar) {
        btnVerificar.disabled = false;
        btnVerificar.textContent = 'Verificar';
      }
      mostrarBanner(bannerError, 'Error al verificar el código. Intenta de nuevo.');
    }
  });
}

// Cierre del modal y navegación a nueva contraseña
if (modalExito) {
  modalExito.addEventListener('click', function (e) {
    if (e.target === modalExito) {
      cerrarModal(modalExito);
    }
  });
}

if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', function () {
    cerrarModal(modalExito);
    window.location.href = 'nueva_contrasena.html';
  });
}

// Reenviar código
if (btnReenviar) {
  btnReenviar.addEventListener('click', async function () {
    limpiarErrorInput(inputCodigo);
    ocultarBanner(bannerError);
    inputCodigo.value = '';
    inputCodigo.focus();

    btnReenviar.disabled = true;
    const resultado = await authService.resendRecoveryCode(correoRecuperacion);
    btnReenviar.disabled = false;

    if (resultado.exito) {
      mostrarBanner(bannerExito, resultado.mensaje || 'Se ha reenviado un nuevo código a tu correo.');
      clearTimeout(temporizadorExito);
      temporizadorExito = setTimeout(() => {
        ocultarBanner(bannerExito);
      }, 4000);
    } else {
      mostrarBanner(bannerError, resultado.mensaje || 'No se pudo reenviar el código.');
    }
  });
}

