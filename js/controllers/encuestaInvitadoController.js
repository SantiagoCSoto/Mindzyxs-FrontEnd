/**
 * Front-end de la encuesta de invitado.
 * Solo valida y procesa la interacción en el navegador.
 */

const form = document.querySelector('form');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

const preguntasObligatorias = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

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

  form.addEventListener('submit', (event) => {
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

    localStorage.setItem('encuesta_invitado_front', JSON.stringify(payload));

    alert('Encuesta enviada correctamente.');
    form.reset();
    actualizarBarraProgreso();

    if (boton) {
      boton.disabled = false;
      boton.textContent = 'Enviar encuesta';
    }
  });

  actualizarBarraProgreso();
}
