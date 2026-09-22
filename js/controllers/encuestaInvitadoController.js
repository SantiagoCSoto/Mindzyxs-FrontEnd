/**
 * Front-end de la encuesta de invitado (PB-07 HU1-PB7).
 * Muestra una pregunta a la vez, valida que haya una respuesta antes de
 * avanzar (no permite avanzar vacía), permite salir con confirmación y
 * guarda las respuestas temporalmente en la sesión del invitado.
 * El envío intenta el backend (/api/encuesta/invitado) y si no responde
 * se guarda localmente para no romper el flujo (patrón existente).
 */

import { abrirModal, cerrarModal } from '../utils/alerts.js';
import { avisoService } from '../services/avisoService.js';
import { enviarEncuestaInvitado, guardarEncuestaTemporal } from '../services/encuestaService.js';

const form = document.getElementById('encuestaForm');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const errorMensaje = document.getElementById('error-mensaje');
const btnVolver = document.getElementById('btn-volver');
const btnSiguiente = document.getElementById('btn-siguiente');
const helperInfo = document.getElementById('helper-info');
const actions = document.querySelector('.actions');
const modalSalir = document.getElementById('modal-salir');
const btnSalirSi = document.getElementById('btn-salir-si');
const btnSalirNo = document.getElementById('btn-salir-no');
const btnVerResultado = document.getElementById('btn-ver-resultado');
const btnVolverInicio = document.getElementById('btn-volver-inicio');

const pasos = Array.from(form.querySelectorAll('.step[data-step]'));
const preguntas = pasos.filter((paso) => paso.dataset.step.startsWith('q'));
const preguntasObligatorias = preguntas.map((paso) => paso.dataset.step);

// q4 es binaria (Sí/No) y no entra al cálculo del nivel de riesgo
const preguntasEscala = preguntasObligatorias.filter((key) => key !== 'q4');

const KEY_SESION = 'encuesta_invitado_front';
const KEY_NIVEL = 'encuesta_invitado_nivel';
const KEY_LOG = 'encuesta_invitado_log';

let indiceActual = 0;
const respuestas = {};

// --- Logs (front): bitácora en sesión + consola ---
function registrarLog(mensaje) {
  const lista = JSON.parse(sessionStorage.getItem(KEY_LOG) || '[]');
  lista.push({ fecha: new Date().toISOString(), mensaje });
  sessionStorage.setItem(KEY_LOG, JSON.stringify(lista));
  console.info(`[Encuesta invitado] ${mensaje}`);
}

// --- Navegación entre pasos ---
function esPregunta(paso) {
  return paso.dataset.step.startsWith('q');
}

function esUltimaPregunta(paso) {
  return paso.dataset.step === preguntasObligatorias[preguntasObligatorias.length - 1];
}

function limpiarError() {
  if (errorMensaje) errorMensaje.textContent = '';
}

function mostrarError() {
  if (errorMensaje) errorMensaje.textContent = 'Debes seleccionar una respuesta para continuar';
}

function actualizarProgreso() {
  if (!progressFill || !progressText) return;

  const contestadas = preguntasObligatorias.filter((key) => Boolean(respuestas[key])).length;
  const porcentaje = Math.round((contestadas / preguntasObligatorias.length) * 100);

  progressFill.style.width = `${porcentaje}%`;
  progressText.textContent = `${porcentaje}%`;
}

function actualizarBotones() {
  if (!actions) return;

  const paso = pasos[indiceActual];
  const enAviso = paso.dataset.step === 'aviso';
  const enCompletado = paso.dataset.step === 'completado';

  actions.style.display = enCompletado ? 'none' : '';

  if (helperInfo) helperInfo.textContent = enAviso
    ? 'Antes de iniciar, por favor lee este mensaje.'
    : 'Todas las preguntas son obligatorias.';

  if (enCompletado) return;

  if (btnSiguiente) {
    btnSiguiente.textContent = enAviso
      ? 'Entendido'
      : esUltimaPregunta(paso) ? 'Finalizar' : 'Siguiente';
  }

  if (btnVolver) {
    btnVolver.textContent = (enAviso || paso.dataset.step === 'q1') ? 'Cancelar' : 'Volver';
  }
}

function mostrarPaso() {
  pasos.forEach((paso, i) => paso.classList.toggle('activo', i === indiceActual));
  actualizarProgreso();
  limpiarError();
  actualizarBotones();
}

function avanzaA(siguiente) {
  if (siguiente < 0 || siguiente >= pasos.length) return;
  indiceActual = siguiente;
  mostrarPaso();
}

// --- Nivel de riesgo local (fallback si el backend no lo calcula) ---
function calcularNivelLocal() {
  const valores = preguntasEscala
    .map((key) => Number.parseInt(respuestas[key], 10))
    .filter((valor) => Number.isFinite(valor));

  if (valores.length === 0) return null;

  const promedio = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
  return promedio <= 2 ? 'Bajo' : promedio === 3 ? 'Medio' : 'Alto';
}

// --- Finalización del cuestionario (PB-07) ---
async function finalizarCuestionario() {
  const payload = {
    tipo: 'invitado',
    fecha: new Date().toISOString(),
    respuestas: { ...respuestas },
    completado: true
  };

  // Intentar envío al backend; si no responde, el servicio guarda localmente (no rompe el flujo)
  const resultado = await enviarEncuestaInvitado(payload);

  guardarEncuestaTemporal(payload);

  if (resultado.data?.nivel) {
    sessionStorage.setItem(KEY_NIVEL, JSON.stringify(resultado.data.nivel));
  }

  registrarLog(
    `FINALIZACIÓN del cuestionario como invitado — respuestas guardadas en sesión${
      resultado.localOnly ? ' (sin conexión con el backend)' : ''
    }`
  );

  avanzaA(pasos.length - 1);
}

// --- Eventos ---
if (btnSiguiente) {
  btnSiguiente.addEventListener('click', () => {
    const paso = pasos[indiceActual];
    if (!paso) return;

    if (paso.dataset.step === 'aviso') {
      avisoService.marcarAvisoAceptado();
      registrarLog('INICIO del cuestionario como invitado (aviso aceptado con Entendido)');
      avanzaA(indiceActual + 1);
      return;
    }

    if (esPregunta(paso)) {
      const nombre = paso.dataset.step;
      const elegida = form?.querySelector(`input[name="${nombre}"]:checked`);

      if (!elegida) {
        mostrarError();
        return;
      }

      respuestas[nombre] = elegida.value;
    }

    if (esUltimaPregunta(paso)) {
      finalizarCuestionario();
      return;
    }

    avanzaA(indiceActual + 1);
  });
}

if (btnVolver) {
  btnVolver.addEventListener('click', () => {
    const paso = pasos[indiceActual];
    if (!paso) return;

    // En aviso o primera pregunta el botón es "Cancelar" -> confirmar salida
    if (paso.dataset.step === 'aviso' || paso.dataset.step === 'q1') {
      if (modalSalir) abrirModal(modalSalir);
      return;
    }

    avanzaA(indiceActual - 1);
  });
}

if (btnSalirSi) {
  btnSalirSi.addEventListener('click', () => {
    sessionStorage.removeItem(KEY_SESION);
    sessionStorage.removeItem(KEY_NIVEL);
    registrarLog('SALIDA del cuestionario confirmada — sin guardar como completado');
    window.location.href = 'inicio.html';
  });
}

if (btnSalirNo) {
  btnSalirNo.addEventListener('click', () => {
    if (modalSalir) cerrarModal(modalSalir);
  });
}

if (btnVerResultado) {
  btnVerResultado.addEventListener('click', () => {
    const nivel = sessionStorage.getItem(KEY_NIVEL)
      ? JSON.parse(sessionStorage.getItem(KEY_NIVEL))
      : calcularNivelLocal();

    if (nivel) {
      sessionStorage.setItem(KEY_NIVEL, JSON.stringify(nivel));
    }

    registrarLog(`Ver resultado solicitado (nivel de riesgo: ${nivel ?? 'no calculable'})`);
    window.location.href = 'recomendaciones_invitado.html?nivel=' + encodeURIComponent(nivel ?? '');
  });
}

if (btnVolverInicio) {
  btnVolverInicio.addEventListener('click', () => {
    registrarLog('Volver al inicio desde "Cuestionario completado"');
    window.location.href = 'inicio.html';
  });
}

if (form) {
  form.addEventListener('submit', (event) => event.preventDefault());
}

// Si el aviso aclaratorio ya fue aceptado (PB-04), se salta el paso de aviso
if (avisoService.haAceptadoAviso()) {
  indiceActual = 1;
}

// Registrar inicio del cuestionario (PB-07: logs)
registrarLog('INICIO del cuestionario como invitado');
mostrarPaso();