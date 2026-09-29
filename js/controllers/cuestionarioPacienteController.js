/**
 * Front-end del cuestionario emocional del paciente (PB-11 HU1-PB11).
 * Conecta con el backend (cuestionarioService):
 *   GET  /cuestionario/paciente/pendiente  -> pendiente con preguntas/opciones
 *   POST /cuestionario/paciente/inicio     -> log de inicio (no bloquea)
 *   POST /cuestionario/paciente/finalizar  -> valida 100% y persiste en historial
 *   GET  /historial                        -> historial reciente (PB-13)
 * Flujo: home (Responder / historial) -> aviso no diagnóstico -> una pregunta a la
 * vez (Siguiente / Cancelar) -> resultado con respuestas guardadas en el historial.
 */

import { authService } from '../services/authService.js';
import {
  obtenerPendientePaciente,
  registrarInicioPaciente,
  finalizarCuestionarioPaciente,
  obtenerHistorial,
  guardarHistorialLocal,
  obtenerAsignadosPaciente,
  obtenerAsignadoDetalle
} from '../services/cuestionarioService.js';

const homeScreen = document.getElementById('homeScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const quizTitle = document.getElementById('quizTitle');
const bar = document.getElementById('bar');
const qCount = document.getElementById('qCount');
const qText = document.getElementById('qText');
const optsBox = document.getElementById('opts');
const errMsg = document.getElementById('errMsg');
const nextBtn = document.getElementById('nextBtn');
const cancelBtn = document.getElementById('cancelBtn');
const startBtn = document.getElementById('startBtn');
const histList = document.getElementById('histList');
const asigList = document.getElementById('asigList');
const resultList = document.getElementById('resultList');
const continueBtn = document.getElementById('continueBtn');
const avisoModal = document.getElementById('avisoModal');
const exitModal = document.getElementById('exitModal');
const toast = document.getElementById('toast');

const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
}

let cuestionario = null;   // pendiente cargado (backend o respaldo local)
let preguntas = [];        // preguntas ordenadas del pendiente
let indiceActual = 0;
const respuestas = {};     // preguntaId -> opcionId
let seleccionada = null;   // opción seleccionada en la pregunta actual
let avisoOk = false;
let pendienteInicio = false;

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function registrarLog(mensaje) {
  void mensaje;
}

function showToast(mensaje) {
  const el = toast;
  if (!el) return;
  el.textContent = mensaje;
  el.classList.add('show');
  clearTimeout(showToast._tiempo);
  showToast._tiempo = setTimeout(() => el.classList.remove('show'), 2400);
}

function showScreen(nombre) {
  homeScreen.classList.toggle('active', nombre === 'home');
  quizScreen.classList.toggle('active', nombre === 'quiz');
  resultScreen.classList.toggle('active', nombre === 'result');
}

function ordenar(xs) {
  return [...xs].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

function mostrarError(texto) {
  if (!errMsg) return;
  errMsg.textContent = texto || 'Debes seleccionar una respuesta para continuar';
  errMsg.classList.add('show');
}

function ocultarError() {
  if (!errMsg) return;
  errMsg.classList.remove('show');
}

// --- Home: pendiente + historial reciente ---
function pintarSkeleton(lista, n) {
  if (!lista) return;
  lista.innerHTML = '';
  for (let i = 0; i < (n || 2); i++) {
    const li = document.createElement('li');
    li.className = 'sk sk-card';
    li.setAttribute('aria-hidden', 'true');
    lista.appendChild(li);
  }
}

async function cargarInicio() {
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = 'Cargando cuestionario...';
  }
  pintarSkeleton(histList, 2);
  pintarSkeleton(asigList, 2);
  const [pend, hist] = await Promise.all([obtenerPendientePaciente(), obtenerHistorial()]);

  if (pend.ok) {
    cuestionario = pend.data;
    preguntas = ordenar(cuestionario.preguntas || []);
    const hero = document.querySelector('.hero p');
    if (hero) {
      hero.innerHTML = 'Responde ' + preguntas.length + ' preguntas sobre tu bienestar. Tus respuestas se <b>guardan en tu historial</b>.';
    }
    if (cuestionario.disponible === false || !preguntas.length) {
      startBtn.textContent = cuestionario.mensaje || 'No tienes cuestionarios pendientes por responder.';
      startBtn.disabled = true;
      preguntas = [];
    } else {
      startBtn.textContent = 'Responder cuestionario';
      startBtn.disabled = false;
    }
  } else {
    startBtn.textContent = 'No fue posible cargar el cuestionario';
    startBtn.disabled = true;
    registrarLog('ERROR de carga del pendiente: ' + pend.error);
  }

  const items = (hist.ok ? hist.data : []).filter((i) => i.tipo === 'Cuestionario').slice(0, 3);
  renderHistorial(items);

  await cargarAsignados();
}

// --- Asignados del psicólogo (PB-22): lista separada para consultar y responder ---
async function cargarAsignados() {
  if (!asigList) return;
  asigList.innerHTML = '';
  const res = await obtenerAsignadosPaciente();
  if (!res.ok) {
    const li = document.createElement('li');
    li.innerHTML = '<span>No fue posible cargar los asignados.</span>';
    asigList.appendChild(li);
    return;
  }
  if (!res.data.length) {
    const li = document.createElement('li');
    li.innerHTML = '<span>No tienes cuestionarios asignados.</span>';
    asigList.appendChild(li);
    return;
  }
  res.data.forEach((a) => {
    const li = document.createElement('li');
    const est = String(a.estado || 'Pendiente');
    const respondible = !/complet/i.test(est);
    const limite = a.fechaLimite ? ' · Límite ' + formatoFecha(a.fechaLimite) : '';
    li.innerHTML =
      '<span class="asig-titulo">' + escapar(a.titulo) + '</span>' +
      '<span class="est ' + (respondible ? 'est-pend' : 'est-ok') + '">' + escapar(est) + limite + '</span>' +
      (respondible
        ? '<button type="button" class="btn-sm" data-asignado="' + a.idAsignacion + '">Responder</button>'
        : '<span class="date">✓ completado</span>');
    asigList.appendChild(li);
  });
  asigList.querySelectorAll('[data-asignado]').forEach((btn) => {
    btn.addEventListener('click', () => responderAsignado(Number(btn.getAttribute('data-asignado'))));
  });
}

async function responderAsignado(idAsignacion) {
  const res = await obtenerAsignadoDetalle(idAsignacion);
  if (!res.ok || !res.data) {
    showToast(res.error || 'No fue posible cargar el cuestionario asignado.');
    return;
  }
  cuestionario = res.data;
  preguntas = ordenar(cuestionario.preguntas || []);
  if (!preguntas.length) {
    showToast('El cuestionario asignado no tiene preguntas.');
    return;
  }
  if (cuestionario.avisoObligatorio !== false && !avisoOk) {
    pendienteInicio = true;
    abrirAviso();
    return;
  }
  iniciarCuestionario();
}

function renderHistorial(items) {
  if (!histList) return;
  histList.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.innerHTML = '<span>Aún no tienes cuestionarios guardados.</span>';
    histList.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    const fecha = formatoFecha(item.fecha);
    const resumen = item.resumen || 'Cuestionario guardado';
    li.innerHTML =
      '<span>Cuestionario ' + fecha + ' — ' + escapar(resumen) + '</span>' +
      '<span class="date"><svg class="icon-inline" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> guardado</span>';
    histList.appendChild(li);
  });
}

function formatoFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm;
}

// --- Aviso no diagnóstico (obligatorio antes del cuestionario) ---
function abrirAviso() {
  if (avisoModal) avisoModal.classList.add('open');
}

function cerrarAviso() {
  if (avisoModal) avisoModal.classList.remove('open');
}

// --- Cuestionario ---
function iniciarCuestionario() {
  indiceActual = 0;
  Object.keys(respuestas).forEach((k) => delete respuestas[k]);
  seleccionada = null;
  pendienteInicio = false;
  registrarInicioPaciente(cuestionario.id);
  showScreen('quiz');
  renderPregunta();
  registrarLog('INICIO del cuestionario como paciente — pregunta 1 de ' + preguntas.length);
}

function renderPregunta() {
  const q = preguntas[indiceActual];
  const total = preguntas.length;

  ocultarError();
  seleccionada = respuestas[q.id] ?? null;

  const num = indiceActual + 1;
  const etiqueta = 'Pregunta ' + num + ' de ' + total;
  quizTitle.textContent = etiqueta;
  qCount.textContent = etiqueta;
  bar.style.width = (total ? (indiceActual / total) * 100 : 0) + '%';

  qText.textContent = q.texto;

  document.getElementById('extraWrap').innerHTML = '';
  optsBox.innerHTML = '';

  ordenar(q.opciones || []).forEach((o) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt' + (seleccionada === o.id ? ' selected' : '');
    btn.innerHTML = '<span class="dot"></span>' + escapar(o.texto);
    btn.addEventListener('click', () => {
      seleccionada = o.id;
      ocultarError();
      optsBox.querySelectorAll('.opt').forEach((c) => c.classList.remove('selected'));
      btn.classList.add('selected');
      registrarLog('Respuesta seleccionada', q.id, '=', o.id, o.texto);
    });
    optsBox.appendChild(btn);
  });

  nextBtn.textContent = indiceActual === total - 1 ? 'Finalizar' : 'Siguiente';
  registrarLog('Pregunta mostrada', etiqueta, '—', q.id);
}

async function finalizarCuestionario() {
  const lista = preguntas.map((p) => ({ preguntaId: p.id, opcionId: respuestas[p.id] }));

  if (lista.some((r) => r.opcionId == null)) {
    mostrarError();
    registrarLog('VALIDACIÓN FINAL: falta responder alguna pregunta');
    return;
  }

  try {
    const r = await finalizarCuestionarioPaciente(cuestionario.id, lista, preguntas);

    bar.style.width = '100%';
    renderResultado(lista);
    registrarLog('CUESTIONARIO FINALIZADO — puntaje ' + r.puntaje + ', nivel ' + r.nivel + (r.localOnly ? ' (local)' : ''));
    if (r.localOnly) {
      guardarHistorialLocal({
        fecha: new Date().toISOString(),
        tipo: 'Cuestionario',
        resumen: preguntas.length + ' respuestas · nivel ' + r.nivel
      });
      showToast('Sin conexión con el servidor — resultado guardado localmente');
    } else {
      showToast('Cuestionario guardado en tu historial');
    }
  } catch (error) {
    mostrarError(error.message);
    registrarLog('VALIDACIÓN fallida al finalizar: ' + error.message);
  }
}

function renderResultado(lista) {
  resultList.innerHTML = '';
  lista.forEach((r) => {
    const p = preguntas.find((x) => x.id === r.preguntaId);
    const o = p && (p.opciones || []).find((x) => x.id === r.opcionId);
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML =
      '<span>' + escapar(p ? p.texto : '') + '</span><b>' + escapar(o ? o.texto : '') + '</b>';
    resultList.appendChild(row);
  });
  showScreen('result');
  registrarLog('RESULTADO mostrado — ' + resultadoTexto());
}

function resultadoTexto() {
  const q = preguntas[indiceActual];
  return q ? 'Cuestionario completado al 100%' : 'Sin preguntas';
}

// --- Eventos ---
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (!cuestionario || cuestionario.disponible === false || !preguntas.length) {
      showToast('No tienes cuestionarios pendientes por responder.');
      return;
    }
    if (cuestionario.avisoObligatorio !== false && !avisoOk) {
      pendienteInicio = true;
      abrirAviso();
      registrarLog('Aviso no-diagnóstico MOSTRADO (obligatorio antes del cuestionario)');
      return;
    }
    iniciarCuestionario();
  });
}

document.getElementById('footerAviso').addEventListener('click', (e) => {
  e.preventDefault();
  abrirAviso();
});

document.getElementById('avisoCerrar').addEventListener('click', () => {
  cerrarAviso();
  pendienteInicio = false;
});

document.getElementById('avisoOk').addEventListener('click', () => {
  cerrarAviso();
  avisoOk = true;
  registrarLog('AVISO ACEPTADO — botón "Entendido"');
  if (pendienteInicio) {
    pendienteInicio = false;
    iniciarCuestionario();
  }
});

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    const q = preguntas[indiceActual];
    if (!q) return;

    if (seleccionada == null) {
      mostrarError();
      registrarLog('VALIDACIÓN: intento de avanzar sin responder en', q.id);
      return;
    }

    respuestas[q.id] = seleccionada;
    registrarLog('Respuesta GUARDADA (temporal)', q.id, '=', seleccionada);

    if (indiceActual === preguntas.length - 1) {
      finalizarCuestionario();
      return;
    }

    indiceActual += 1;
    renderPregunta();
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    if (exitModal) exitModal.classList.add('open');
  });
}

document.getElementById('exitNo').addEventListener('click', () => {
  if (exitModal) exitModal.classList.remove('open');
});

document.getElementById('exitYes').addEventListener('click', () => {
  if (exitModal) exitModal.classList.remove('open');
  Object.keys(respuestas).forEach((k) => delete respuestas[k]);
  seleccionada = null;
  showScreen('home');
  showToast('Cuestionario cancelado — respuestas descartadas');
  registrarLog('SALIDA confirmada — respuestas no guardadas descartadas');
});

if (continueBtn) {
  continueBtn.addEventListener('click', () => {
    showScreen('home');
    cargarInicio();
    registrarLog('Click "Continuar" desde Resultado — vuelve al inicio del paciente');
  });
}
if (sesion) {
  cargarInicio();
  registrarLog('Sistema listo — paciente autenticado, botón "Responder cuestionario" disponible');
}