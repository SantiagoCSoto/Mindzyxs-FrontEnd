/**
 * Front-end de la alerta de riesgo alto del paciente (PB-16 HU1-PB16).
 * Conecta con el backend (alertaRiesgoService):
 *   POST /riesgo/paciente/alerta  -> registra "vista" al abrir y la acción elegida
 *                                    (lineas/recomendaciones/entendido)
 *   GET  /ayuda/lineas            -> líneas de ayuda activas del modal
 * Flujo: la alerta se muestra tras finalizar el cuestionario (PB-11) o registrar
 * estado emocional (PB-12) cuando el nivel es Alto. Botones: Líneas de ayuda
 * (modal), Ver recomendaciones (navega) y Entendido (registra y cierra).
 */

import { authService } from '../services/authService.js';
import {
  registrarAccionAlerta,
  obtenerLineasAyuda
} from '../services/alertaRiesgoService.js';

const btnLines = document.getElementById('btnLines');
const btnRecs = document.getElementById('btnRecs');
const btnOk = document.getElementById('btnOk');
const linesModal = document.getElementById('linesModal');
const linesOk = document.getElementById('linesOk');
const linesList = document.getElementById('linesList');
const footerAviso = document.getElementById('footerAviso');
const toast = document.getElementById('toast');

const parametros = new URLSearchParams(location.search);
const origen = ['cuestionario', 'registro'].includes(parametros.get('origen'))
  ? parametros.get('origen')
  : null;

const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
}

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

function abrirModal(el) {
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}

function cerrarModal(el) {
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
}

async function registrarAccion(accion) {
  try {
    const r = await registrarAccionAlerta(accion, origen);
    registrarLog('ALERTA acción "' + accion + '"' + (r.localOnly ? ' (local — sin conexión)' : '') + (origen ? ' (origen: ' + origen + ')' : ''));
    return r;
  } catch (error) {
    showToast(error.message);
    registrarLog('ERROR al registrar la acción de la alerta: ' + error.message);
    return null;
  }
}

function pintarLineas(lineas) {
  if (!linesList) return;
  const icono = '<svg class="icon-inline" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';

  if (!lineas.length) {
    linesList.innerHTML = '<div class="line">No hay líneas de ayuda disponibles por el momento.</div>';
    return;
  }

  linesList.innerHTML = lineas.map((l) => {
    const dato = l.telefono
      ? '<b>' + escapar(l.telefono) + '</b>'
      : l.url
        ? '<b>' + escapar(l.url) + '</b>'
        : '';
    const extra = l.horario ? ' — ' + escapar(l.horario) : l.cobertura ? ' — ' + escapar(l.cobertura) : '';
    return '<div class="line">' + icono + ' <b>' + escapar(l.nombre) + '</b>' + (dato ? ' — ' + dato : '') + extra + '</div>';
  }).join('');
}

async function abrirLineas() {
  registrarAccion('lineas');
  abrirModal(linesModal);
  if (!linesList) return;
  try {
    const lineas = await obtenerLineasAyuda();
    pintarLineas(lineas);
  } catch (error) {
    showToast(error.message);
    registrarLog('ERROR al cargar líneas de ayuda: ' + error.message);
  }
}

if (btnLines) {
  btnLines.addEventListener('click', abrirLineas);
}

if (linesOk) {
  linesOk.addEventListener('click', () => {
    cerrarModal(linesModal);
    registrarLog('MODAL líneas de ayuda cerrado');
  });
}

linesModal?.addEventListener('click', (e) => {
  if (e.target === linesModal) cerrarModal(linesModal);
});

if (btnRecs) {
  btnRecs.addEventListener('click', async () => {
    await registrarAccion('recomendaciones');
    registrarLog('NAVEGACIÓN a recomendaciones de autocuidado desde la alerta');
    location.href = 'recomendaciones_invitado.html?nivel=Alto';
  });
}

if (btnOk) {
  btnOk.addEventListener('click', async () => {
    await registrarAccion('entendido');
    registrarLog('ALERTA cerrada — botón "Entendido"');
    if (history.length > 1) {
      history.back();
    } else {
      location.href = 'registro_emocional.html';
    }
  });
}

footerAviso?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Mindzyx no realiza diagnósticos clínicos');
});

registrarAccion('vista');