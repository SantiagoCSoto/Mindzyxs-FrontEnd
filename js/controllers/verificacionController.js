/**
 * Controlador para views/verificacion.html
 * Gestiona la verificación de código de 6 dígitos y reenvío.
 */

import { authService } from '../services/authService.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner, abrirModal, cerrarModal } from '../utils/alerts.js';

const formVerificacion = document.getElementById('form-verificacion');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnReenviar = document.getElementById('btn-reenviar');

let temporizadorExito = null;

if (inputCodigo) {
  inputCodigo.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
    limpiarErrorInput(inputCodigo);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });
}

// Envío del código de verificación
if (formVerificacion) {
  formVerificacion.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = inputCodigo.value.trim();

    if (codigo.length < 6) {
      marcarErrorInput(inputCodigo);
      mostrarBanner(bannerError, 'Por favor, ingresa el código completo de 6 dígitos.');
      ocultarBanner(bannerExito);
      return;
    }

    const resultado = await authService.verifyCode(codigo);

    if (resultado.exito) {
      limpiarErrorInput(inputCodigo);
      ocultarBanner(bannerError);
      abrirModal(modalExito);
    } else {
      marcarErrorInput(inputCodigo);
      mostrarBanner(bannerError, resultado.mensaje);
      ocultarBanner(bannerExito);
    }
  });
}

// Cierre del modal de éxito
if (modalExito) {
  modalExito.addEventListener('click', (e) => {
    if (e.target === modalExito) {
      cerrarModal(modalExito);
    }
  });
}

// Reenviar código
if (btnReenviar) {
  btnReenviar.addEventListener('click', async () => {
    limpiarErrorInput(inputCodigo);
    ocultarBanner(bannerError);
    inputCodigo.value = '';
    inputCodigo.focus();

    const resultado = await authService.resendCode();

    mostrarBanner(bannerExito, resultado.mensaje);
    clearTimeout(temporizadorExito);
    temporizadorExito = setTimeout(() => {
      ocultarBanner(bannerExito);
    }, 4000);
  });
}
