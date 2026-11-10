/**
 * Controlador para views/reanudar_verificacion.html
 * Permite reanudar la verificación de una cuenta incompleta.
 */

import { authService } from '../services/authService.js';
import { marcarErrorInput, limpiarErrorInput, mostrarBanner, ocultarBanner } from '../utils/alerts.js';

const formReanudar = document.getElementById('form-reanudar');
const inputCorreo = document.getElementById('correo-reanudar');
const bannerError = document.getElementById('banner-error-reanudar');
const bannerExito = document.getElementById('banner-exito-reanudar');
const btnReanudar = document.getElementById('btn-reanudar');

let temporizadorExito = null;

if (inputCorreo) {
  inputCorreo.addEventListener('input', function () {
    limpiarErrorInput(inputCorreo);
    ocultarBanner(bannerError);
    ocultarBanner(bannerExito);
  });
}

// Prevenir cualquier submit no controlado del formulario (evita recarga de página)
if (formReanudar) {
  formReanudar.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ReanudarVerificacion] Submit interceptado');

    const correo = inputCorreo.value.trim();
    console.log('[ReanudarVerificacion] Correo:', correo);

    if (!correo) {
      marcarErrorInput(inputCorreo);
      mostrarBanner(bannerError, 'Este campo es obligatorio');
      ocultarBanner(bannerExito);
      return;
    }

    if (!correo.includes('@')) {
      marcarErrorInput(inputCorreo);
      mostrarBanner(bannerError, 'Ingresa un correo válido');
      ocultarBanner(bannerExito);
      return;
    }

    if (btnReanudar) {
      btnReanudar.disabled = true;
      btnReanudar.textContent = 'Enviando...';
    }

    try {
      console.log('[ReanudarVerificacion] Llamando a authService.reanudarVerificacion...');
      const resultado = await authService.reanudarVerificacion(correo);
      console.log('[ReanudarVerificacion] Resultado:', resultado);

      if (btnReanudar) {
        btnReanudar.disabled = false;
        btnReanudar.textContent = 'Reenviar código';
      }

      if (resultado.exito) {
        limpiarErrorInput(inputCorreo);
        ocultarBanner(bannerError);
        mostrarBanner(bannerExito, resultado.mensaje || 'Se ha enviado un nuevo código a tu correo.');

        // Guardar correo en sessionStorage y redirigir a verificación
        sessionStorage.setItem('correoRegistro', correo);

        clearTimeout(temporizadorExito);
        temporizadorExito = setTimeout(() => {
          ocultarBanner(bannerExito);
          window.location.href = 'verificacion.html';
        }, 2000);
      } else {
        // Código no enviado (correo no registrado o no pendiente)
        limpiarErrorInput(inputCorreo);
        ocultarBanner(bannerExito);
        mostrarBanner(bannerError, resultado.mensaje || 'No se pudo enviar el código. Intenta de nuevo.');
        console.log('[ReanudarVerificacion] Error del servidor:', resultado.error);
      }
    } catch (err) {
      console.error('[ReanudarVerificacion] Excepción:', err);
      if (btnReanudar) {
        btnReanudar.disabled = false;
        btnReanudar.textContent = 'Reenviar código';
      }
      limpiarErrorInput(inputCorreo);
      ocultarBanner(bannerExito);
      mostrarBanner(bannerError, 'No se pudo enviar el código. Verifica tu conexión e intenta nuevamente.');
    }
  });
} else {
  console.error('[ReanudarVerificacion] ERROR: No se encontró el formulario #form-reanudar');
}

// Prevenir recarga accidental por Enter en el input
if (inputCorreo) {
  inputCorreo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (formReanudar) formReanudar.dispatchEvent(new Event('submit'));
    }
  });
}
