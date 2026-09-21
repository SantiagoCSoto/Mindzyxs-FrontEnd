/**
 * Front-end de la encuesta de invitado.
 * Valida el formulario, envía las respuestas al backend (POST /api/encuesta/invitado)
 * y, si el invitado quiere recomendaciones, redirige al panel con su nivel de riesgo.
 */

import { enviarEncuestaInvitado } from '../services/encuestaService.js';

const form = document.querySelector('form');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

const preguntasObligatorias = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

// Preguntas de escala (q4 binaria Si/No no entra al promedio del nivel).
const preguntasEscala = ['q1', 'q2', 'q3', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

function calcularNivelLocal(respuestas) {
  const valores = preguntasEscala
    .map((key) => Number.parseInt(respuestas[key], 10))
    .filter((valor) => Number.isFinite(valor));
  if (valores.length === 0) {
    return null;
  }
  const promedio = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
  return promedio <= 2 ? 'Bajo' : promedio === 3 ? 'Medio' : 'Alto';
}

function actualizarBarraProgreso() {
  if (!progressFill || !progressText) {
    return;
  }

  const respuestasContestadas = preguntasObligatorias.filter((key) => {
    const radioSeleccionado = form?.querySelector(`input[name="${key}"]:checked`);
    return Boolean(radioSeleccionado);
  }).length;

  const porcentaje = Math.round((respuestasContestadas / preguntasObligatorias.length) * 100);

  progressFill.style.width = `${porcentaje}%`;
  progressText.textContent = `${porcentaje}%`;
}

if (form) {
  form.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener('change', actualizarBarraProgreso);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const respuestas = {};

    for (const [key, value] of formData.entries()) {
      respuestas[key] = value;
    }

    const faltantes = preguntasObligatorias.filter((key) => {
      const valor = respuestas[key];
      return valor === undefined || valor === null || valor === '';
    });

    if (faltantes.length > 0) {
      alert('Debes responder todas las preguntas antes de enviar la encuesta.');
      return;
    }

    const boton = form.querySelector('button[type="submit"]');
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Enviando...';
    }

    const payload = {
      tipo: 'invitado',
      fecha: new Date().toISOString(),
      respuestas
    };

    const resultado = await enviarEncuestaInvitado(payload);

    if (!resultado.ok) {
      alert(resultado.error || 'No se pudo enviar la encuesta. Inténtalo de nuevo.');
      if (boton) {
        boton.disabled = false;
        boton.textContent = 'Enviar encuesta';
      }
      return;
    }

    const quiereRecomendaciones = respuestas.q4 === '1';
    const nivel = resultado.data?.nivel || calcularNivelLocal(respuestas);

    localStorage.setItem('encuesta_invitado_front', JSON.stringify(payload));

    if (quiereRecomendaciones && nivel) {
      window.location.href = 'recomendaciones_invitado.html?nivel=' + encodeURIComponent(nivel);
      return;
    }

    alert(resultado.message || 'Encuesta enviada correctamente.');
    form.reset();
    actualizarBarraProgreso();

    if (boton) {
      boton.disabled = false;
      boton.textContent = 'Enviar encuesta';
    }
  });

  actualizarBarraProgreso();
}