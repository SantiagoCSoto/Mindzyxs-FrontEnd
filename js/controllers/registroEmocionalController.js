/**
 * Front-end del registro del estado emocional del paciente (PB-12 HU1-PB12).
 * Conecta con el backend (registroEmocionalService):
 *   POST /historial  -> guarda el estado emocional (escala 1-5 + nota opcional)
 *   GET  /historial  -> último registro (para la tarjeta "Último registro guardado")
 * Flujo: panel (Registrar estado emocional / último registro) -> formulario con
 * escala 1-5 y nota opcional -> Guardar valida la selección y regresa al panel.
 */

import { authService } from '../services/authService.js';
import {
  registrarEstadoEmocional,
  obtenerUltimoRegistro,
  guardarUltimoLocal,
  ETIQUETAS
} from '../services/registroEmocionalService.js';

const panelScreen = document.getElementById('panelScreen');
const formScreen = document.getElementById('formScreen');
const goRegister = document.getElementById('goRegister');
const savedCard = document.getElementById('savedCard');
const savedText = document.getElementById('savedText');
const savedDate = document.getElementById('savedDate');
const emptyNote = document.getElementById('emptyNote');
const notes = document.getElementById('notes');
const errMsg = document.getElementById('errMsg');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const toast = document.getElementById('toast');
const pills = document.querySelectorAll('#scale .pill');

const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
}

let seleccionado = null; // valor 1-5 seleccionado

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function registrarLog(mensaje) {
  void mensaje;
}

function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._tiempo);
  showToast._tiempo = setTimeout(() => toast.classList.remove('show'), 2400);
}

function showScreen(panel) {
  panelScreen.classList.toggle('active', panel);
  formScreen.classList.toggle('active', !panel);
}

function mostrarError(texto) {
  if (!errMsg) return;
  errMsg.textContent = texto || 'Debes seleccionar un estado emocional para guardar';
  errMsg.classList.add('show');
}

function ocultarError() {
  if (!errMsg) return;
  errMsg.classList.remove('show');
}

function limpiarSeleccion() {
  seleccionado = null;
  pills.forEach((p) => {
    p.classList.remove('selected');
    p.setAttribute('aria-checked', 'false');
  });
  if (notes) notes.value = '';
  ocultarError();
}

function formatoFechaHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + aaaa + ' ' + hh + ':' + mi;
}

// --- Panel: último registro guardado ---
function renderUltimo(item) {
  if (!savedCard) return;
  if (!item) {
    savedCard.classList.remove('show');
    if (emptyNote) emptyNote.style.display = 'block';
    return;
  }
  const valor = item.puntaje ?? item.valor;
  const etiqueta = ETIQUETAS[valor] ?? '';
  const nota = (item.nota || '').trim();
  if (savedText) {
    savedText.textContent = valor + ' — ' + etiqueta + (nota ? ' · "' + nota + '"' : ' · Sin nota');
  }
  if (savedDate) {
    savedDate.textContent = 'Registrado el ' + formatoFechaHora(item.fecha) + ' (fecha/hora automática)';
  }
  savedCard.classList.add('show');
  if (emptyNote) emptyNote.style.display = 'none';
}

async function cargarUltimo() {
  const res = await obtenerUltimoRegistro();
  if (res.ok) {
    renderUltimo(res.data);
  }
  registrarLog('Último registro emocional cargado' + (res.localOnly ? ' (local)' : ''));
}

async function guardar() {
  if (seleccionado == null) {
    mostrarError();
    registrarLog('ERROR: intento de guardar sin selección — "Debes seleccionar un estado emocional para guardar"');
    return;
  }

  try {
    const r = await registrarEstadoEmocional(seleccionado, (notes.value || '').trim());

    renderUltimo({
      puntaje: r.puntaje,
      nota: r.nota,
      fecha: r.fecha,
      nivel: r.nivel
    });

    if (r.localOnly) {
      guardarUltimoLocal({
        puntaje: r.puntaje,
        nota: r.nota,
        fecha: r.fecha,
        nivel: r.nivel
      });
      showToast('Sin conexión con el servidor — registro guardado localmente');
    } else {
      showToast(r.mensaje || 'Registro guardado correctamente');
    }

    showScreen(true);
    limpiarSeleccion();
    registrarLog('REGISTRO GUARDADO: ' + r.puntaje + ' (' + ETIQUETAS[r.puntaje] + (r.localOnly ? ' | local' : '') + ')');
  } catch (error) {
    mostrarError(error.message);
    registrarLog('VALIDACIÓN fallida al guardar: ' + error.message);
  }
}

function cancelar() {
  showScreen(true);
  limpiarSeleccion();
  showToast('Registro cancelado');
  registrarLog('CANCELADO por el usuario — vuelve al panel sin guardar');
}

// --- Eventos ---
if (goRegister) {
  goRegister.addEventListener('click', () => {
    limpiarSeleccion();
    showScreen(false);
    registrarLog('APERTURA pantalla "Registrar estado emocional"');
  });
}

if (notes) {
  notes.addEventListener('input', () => {
    ocultarError();
  });
}

pills.forEach((p) => {
  p.addEventListener('click', () => {
    pills.forEach((x) => {
      x.classList.remove('selected');
      x.setAttribute('aria-checked', 'false');
    });
    p.classList.add('selected');
    p.setAttribute('aria-checked', 'true');
    seleccionado = parseInt(p.dataset.val, 10);
    ocultarError();
    registrarLog('ESTADO SELECCIONADO: ' + seleccionado + ' (' + ETIQUETAS[seleccionado] + ')');
  });
});

if (btnSave) {
  btnSave.addEventListener('click', () => {
    guardar();
  });
}

if (btnCancel) {
  btnCancel.addEventListener('click', () => {
    cancelar();
  });
}

document.getElementById('footerAviso').addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Mindzyx no realiza diagnósticos clínicos');
});

if (sesion) {
  cargarUltimo();
  registrarLog('Sistema listo — panel del paciente, botón "Registrar estado emocional" disponible');
}