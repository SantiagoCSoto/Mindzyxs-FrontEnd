/**
 * Controlador para views/recuperar_contrasena.html
 * Gestiona la solicitud de código de recuperación por correo.
 */

import { authService } from '../services/authService.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner } from '../utils/alerts.js';

const formRecuperar = document.querySelector('form');
const inputEmail = document.getElementById('email');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const btnSubmit = document.querySelector('.btn-recuperar-submit');

// Limpieza de errores en tiempo real al escribir
if (inputEmail) {
  inputEmail.addEventListener('input', function () {
    limpiarErrorInput(inputEmail);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });
}

// Validación y envío de código
if (formRecuperar) {
  formRecuperar.addEventListener('submit', async function (e) {
    e.preventDefault();
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);

    const email = inputEmail.value.trim().toLowerCase();

    // Validación: campo vacío
    if (!email) {
      marcarErrorInput(inputEmail);
      mostrarBanner(bannerError, 'Este campo es obligatorio');
      return;
    }

    // Validación: formato de correo
    if (!email.includes('@')) {
      marcarErrorInput(inputEmail);
      mostrarBanner(bannerError, 'Ingresa un correo válido');
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Enviando...';
    }

    try {
      const resultado = await authService.requestPasswordReset(email);

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar código';
      }

      if (resultado.exito) {
        // Guardar correo para las siguientes pantallas
        sessionStorage.setItem('correoRecuperacion', email);

        mostrarBanner(bannerExito, resultado.mensaje || 'Se ha enviado un código a tu correo.');
        inputEmail.value = '';

        setTimeout(() => {
          window.location.href = 'verificacion_recuperar.html';
        }, 1500);
      } else {
        marcarErrorInput(inputEmail);
        mostrarBanner(bannerError, resultado.mensaje || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar código';
      }
      mostrarBanner(bannerError, 'Error de conexión. Intenta de nuevo.');
      console.error(err);
    }
  });
}

