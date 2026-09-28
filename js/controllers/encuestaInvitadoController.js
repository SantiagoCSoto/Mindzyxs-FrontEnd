/**
 * Front-end del cuestionario de invitado (PB-07 HU1-PB7).
 * Catálogo dinámico desde el backend con rotación (N preguntas, M opciones):
 *   GET  /cuestionario/invitado?excluidos=  -> pendiente (cookies cuest_*)
 *   POST /cuestionario/invitado/inicio      -> log de inicio (no bloquea)
 *   POST /cuestionario/invitado/finalizar   -> valida 100%, devuelve puntaje/nivel
 * Muestra una pregunta a la vez, valida respuesta antes de avanzar
 * ("Debes seleccionar una respuesta para continuar"), permite salir con
 * confirmación (sin guardar como completado) y marca cuest_<id> al 100%.
 */

import { abrirModal, cerrarModal } from '../utils/alerts.js';
import { avisoService } from '../services/avisoService.js';
import {
  obtenerPendiente, registrarInicio, finalizarCuestionarioBack,
  guardarEncuestaTemporal, guardarNivel, guardarRiesgo, marcarHecho, getHechos
} from '../services/encuestaService.js';

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
const contenedor = document.getElementById('preguntas-dinamicas');

const KEY_SESION = 'encuesta_invitado_front';
const KEY_NIVEL = 'encuesta_invitado_nivel';
const KEY_LOG = 'encuesta_invitado_log';

let quiz = null;          // catálogo pendiente del backend
let pasos = [];           // secciones del flujo actual
let preguntas = [];       // preguntas del catálogo (ordenadas)
let indiceActual = 0;
const respuestas = {};    // preguntaId -> opcionId

// --- Logs desactivados en producción (la trazabilidad vive en dbo.auth) ---
function registrarLog(mensaje) {
  void mensaje;
}

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Carga del catálogo con rotación ---
async function cargarCuestionario() {
  mostrarCargando();
  try {
    const q = await obtenerPendiente(getHechos());
    if (!q || q.disponible === false) {
      quiz = null;
      const msg = (q && q.mensaje) || 'No tienes cuestionarios pendientes por responder.';
      document.getElementById('sin-pendientes-msg').textContent = msg;
      setFlujo(['aviso', 'sin-pendientes']);
      registrarLog('Sin cuestionarios pendientes — no se puede responder más');
      return;
    }
    quiz = q;
    construirPreguntas(q);
    setFlujo(['aviso', ...q.preguntas.map((p) => 'q' + p.id), 'completado']);
    registrarLog(`Cuestionario pendiente cargado: "${q.titulo}" (${q.preguntas.length} preguntas)`);
  } catch (error) {
    quiz = null;
    setFlujo(['aviso', 'error-carga']);
    registrarLog('ERROR de carga del cuestionario: ' + error.message);
  }
}

function mostrarCargando() {
  if (helperInfo) helperInfo.textContent = 'Cargando cuestionario…';
  setFlujo(['aviso']);
}

function construirPreguntas(q) {
  preguntas = q.preguntas;
  contenedor.innerHTML = '';
  q.preguntas.forEach((p, i) => {
    const sec = document.createElement('section');
    sec.className = 'step question';
    sec.dataset.step = 'q' + p.id;
    const opts = p.opciones.map((o, j) => (
      `<div class="option"><input type="radio" id="q${p.id}-${j}" name="q${p.id}" value="${o.id}"><label for="q${p.id}-${j}">${escapar(o.texto)}</label></div>`
    )).join('');
    sec.innerHTML = `<div class="question-title"><span class="question-number">${i + 1}</span><span>${escapar(p.texto)}</span></div><div class="options">${opts}</div>`;
    contenedor.appendChild(sec);
  });
}

function setFlujo(steps) {
  pasos = steps
    .map((s) => form.querySelector(`.step[data-step="${s}"]`))
    .filter(Boolean);
  Object.keys(respuestas).forEach((k) => delete respuestas[k]);
  indiceActual = 0;
  mostrarPaso();
}

// --- Navegación entre pasos ---
function esPregunta(paso) {
  return paso && paso.dataset.step.startsWith('q');
}

function esUltimaPregunta(paso) {
  const qs = pasos.filter(esPregunta);
  return paso === qs[qs.length - 1];
}

function limpiarError() {
  if (errorMensaje) errorMensaje.textContent = '';
}

function mostrarError(texto) {
  if (errorMensaje) errorMensaje.textContent = texto || 'Debes seleccionar una respuesta para continuar';
}

function actualizarProgreso() {
  if (!progressFill || !progressText) return;
  const qs = pasos.filter(esPregunta);
  const contestadas = qs.filter((paso) => {
    const id = Number(paso.dataset.step.slice(1));
    return respuestas[id] != null;
  }).length;
  const porcentaje = qs.length ? Math.round((contestadas / qs.length) * 100) : 0;
  progressFill.style.width = `${porcentaje}%`;
  progressText.textContent = `${porcentaje}%`;
}

function actualizarBotones() {
  if (!actions) return;
  const paso = pasos[indiceActual];
  if (!paso) { actions.style.display = 'none'; return; }
  const key = paso.dataset.step;
  const especial = key === 'completado' || key === 'sin-pendientes' || key === 'error-carga';
  actions.style.display = especial ? 'none' : '';

  if (helperInfo) helperInfo.textContent = key === 'aviso'
    ? 'Antes de iniciar, por favor lee este mensaje.'
    : 'Todas las preguntas son obligatorias.';

  if (especial) return;

  if (btnSiguiente) {
    btnSiguiente.textContent = key === 'aviso'
      ? 'Entendido'
      : esUltimaPregunta(paso) ? 'Finalizar' : 'Siguiente';
  }

  if (btnVolver) {
    const qs = pasos.filter(esPregunta);
    btnVolver.textContent = (key === 'aviso' || (qs.length && paso === qs[0])) ? 'Cancelar' : 'Volver';
  }
}

function mostrarPaso() {
  form.querySelectorAll('.step[data-step]').forEach((s) => s.classList.remove('activo'));
  if (pasos[indiceActual]) pasos[indiceActual].classList.add('activo');
  actualizarProgreso();
  limpiarError();
  actualizarBotones();
}

function avanzaA(siguiente) {
  if (siguiente < 0 || siguiente >= pasos.length) return;
  indiceActual = siguiente;
  mostrarPaso();
}

// --- Finalización contra el backend (PB-07) ---
async function finalizarCuestionario() {
  const lista = Object.entries(respuestas).map(([preguntaId, opcionId]) => ({
    preguntaId: Number(preguntaId), opcionId
  }));

  try {
    const r = await finalizarCuestionarioBack(quiz.id, lista);

    marcarHecho(quiz.id);
    guardarEncuestaTemporal({ cuestionarioId: quiz.id, respuestas: lista, puntaje: r.puntaje, nivel: r.nivel });
    guardarNivel(r.nivel);
    guardarRiesgo(quiz.id, r);

    registrarLog(`FINALIZACIÓN al 100% — puntaje ${r.puntaje}, nivel ${r.nivel}, cookie cuest_${quiz.id}`);
    quiz = null;
    avanzaA(pasos.findIndex((p) => p.dataset.step === 'completado'));
  } catch (error) {
    mostrarError(error.message);
    registrarLog('VALIDACIÓN fallida al finalizar: ' + error.message);
  }
}

// --- Eventos ---
if (btnSiguiente) {
  btnSiguiente.addEventListener('click', () => {
    const paso = pasos[indiceActual];
    if (!paso) return;

    if (paso.dataset.step === 'aviso') {
      avisoService.marcarAvisoAceptado();
      if (quiz) registrarInicio(quiz.id);
      registrarLog('INICIO del cuestionario como invitado (aviso aceptado con Entendido)');
      avanzaA(indiceActual + 1);
      return;
    }

    if (esPregunta(paso)) {
      const preguntaId = Number(paso.dataset.step.slice(1));
      const elegida = paso.querySelector(`input[name="q${preguntaId}"]:checked`);

      if (!elegida) {
        mostrarError();
        return;
      }

      respuestas[preguntaId] = Number(elegida.value);
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
    const qs = pasos.filter(esPregunta);
    if (paso.dataset.step === 'aviso' || (qs.length && paso === qs[0])) {
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
    window.location.href = 'panel_invitado.html';
  });
}

if (btnSalirNo) {
  btnSalirNo.addEventListener('click', () => {
    if (modalSalir) cerrarModal(modalSalir);
  });
}

if (btnVerResultado) {
  btnVerResultado.addEventListener('click', () => {
    // PB-08: la pantalla de riesgo valida la sesión, calcula el nivel y lo presenta.
    registrarLog('Ver resultado solicitado — va a la pantalla Resultado del riesgo');
    window.location.href = 'resultado_riesgo.html';
  });
}

if (btnVolverInicio) {
  btnVolverInicio.addEventListener('click', () => {
    registrarLog('Volver al panel desde "Cuestionario completado"');
    window.location.href = 'panel_invitado.html';
  });
}

if (form) {
  form.addEventListener('submit', (event) => event.preventDefault());
}

document.getElementById('btn-reintentar')?.addEventListener('click', () => {
  cargarCuestionario();
});

// Si el aviso aclaratorio ya fue aceptado (PB-04), se salta el paso de aviso
cargarCuestionario().then(() => {
  if (avisoService.haAceptadoAviso() && pasos.length > 1) {
    indiceActual = 1;
    mostrarPaso();
  }
  registrarLog('INICIO del cuestionario como invitado');
});
