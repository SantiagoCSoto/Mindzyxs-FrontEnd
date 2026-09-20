/**
 * Controlador para views/verificacion.html
 * Gestiona la verificación de código de 6 dígitos y reenvío con el backend.
 */

import { authService } from '../services/authService.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner, abrirModal, cerrarModal } from '../utils/alerts.js';

const formVerificacion = document.getElementById('form-verificacion');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnVerificar = document.getElementById('btn-verificar');
const btnReenviar = document.getElementById('btn-reenviar');

let temporizadorExito = null;

// Obtener correo desde parámetros URL o sessionStorage
const urlParams = new URLSearchParams(window.location.search);
const correoRegistrado = (urlParams.get('correo') || sessionStorage.getItem('correoRegistro') || '').trim();
const chipCorreoStrong = document.querySelector('.chip-correo strong');

if (chipCorreoStrong && correoRegistrado) {
  chipCorreoStrong.textContent = correoRegistrado;
}

if (inputCodigo) {
  inputCodigo.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
    limpiarErrorInput(inputCodigo);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });
}

// Envío del código de verificación hacia el backend
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

    if (btnVerificar) {
      btnVerificar.disabled = true;
      btnVerificar.textContent = 'Verificando...';
    }

    const resultado = await authService.verifyCode(correoRegistrado, codigo);

    if (btnVerificar) {
      btnVerificar.disabled = false;
      btnVerificar.textContent = 'Verificar';
    }

    if (resultado.exito) {
      limpiarErrorInput(inputCodigo);
      ocultarBanner(bannerError);

      // Personalizar mensaje de éxito según el rol/estado del backend
      const tituloModal = modalExito?.querySelector('h2');
      const textoModal = modalExito?.querySelector('p');

      if (resultado.estado === 'PendienteAprobacion') {
        if (tituloModal) tituloModal.textContent = 'Registro exitoso';
        if (textoModal) textoModal.textContent = resultado.mensaje || 'Tu cuenta está pendiente de aprobación por el administrador. Te notificaremos cuando sea habilitada.';
      } else {
        if (tituloModal) tituloModal.textContent = resultado.mensaje || 'Registro exitoso. Ya puedes iniciar sesión';
        if (textoModal) textoModal.textContent = 'Tu cuenta fue activada correctamente. Ahora puedes entrar al sistema.';
      }

      abrirModal(modalExito);
    } else {
      marcarErrorInput(inputCodigo);
      mostrarBanner(bannerError, resultado.mensaje || 'Código incorrecto. Verifica e intenta nuevamente');
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

// Reenviar código hacia el backend
if (btnReenviar) {
  btnReenviar.addEventListener('click', async () => {
    limpiarErrorInput(inputCodigo);
    ocultarBanner(bannerError);
    inputCodigo.value = '';
    inputCodigo.focus();

    btnReenviar.disabled = true;
    const resultado = await authService.resendCode(correoRegistrado);
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
