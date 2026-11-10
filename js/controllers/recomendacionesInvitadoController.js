/**
 * Front-end de la pantalla "Recomendaciones básicas (Invitado)" (PB-09).
 * Controla el panel de invitado, la lista de recomendaciones, el detalle
 * y el mensaje aclaratorio. Los datos se obtienen del servicio recomendacionesService.
 */

import {
  obtenerRecomendaciones,
  obtenerRecomendacion,
  obtenerAviso,
  registrarVisualizacion
} from '../services/recomendacionesService.js';
import { invitadoService } from '../services/invitadoService.js';

const screenPanel = document.getElementById('screenPanel');
const screenRecom = document.getElementById('screenRecom');
const screenDetail = document.getElementById('screenDetail');
const toast = document.getElementById('toast');
const recList = document.getElementById('recList');
const emptyState = document.getElementById('emptyState');
const priorityBadge = document.getElementById('priorityBadge');
const avisoModal = document.getElementById('avisoModal');

// Nivel de la sesión (llega desde PB-08 con ?nivel=Bajo|Medio|Alto; sin nivel, orden estándar).
const riesgoUrl = new URLSearchParams(location.search).get('nivel');
let riesgo = riesgoUrl ? (riesgoUrl.charAt(0).toUpperCase() + riesgoUrl.slice(1).toLowerCase()) : null;
if (!['Bajo', 'Medio', 'Alto'].includes(riesgo)) riesgo = null;

const riesgoLabel = {
  Bajo: 'Riesgo bajo',
  Medio: 'Riesgo medio',
  Alto: 'Riesgo alto'
};

let recData = [];
let pendingRecId = null;
let avisoCache = null;

const ICON_PATHS = {
  bulb: '<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8a6 6 0 0 0-12 0c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
  target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
  pen: '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>',
  help: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"></path><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"></path><path d="M9.8 4.4A2 2 0 1 1 11 8H2"></path>',
  sprout: '<path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path>',
  siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"></path><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"></path><path d="M21 12h1"></path><path d="M18.5 4.5 18 5"></path>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>'
};

const ICON_COLOR = {
  bulb: '#2A8A94',
  heart: '#2A8A94',
  target: '#B3541E',
  pen: '#6B5BCE',
  help: '#E85D7A',
  alert: '#E8A347',
  wind: '#2A8A94',
  sprout: '#1BBF6B',
  siren: '#E85D7A',
  sparkles: '#6B5BCE',
  moon: '#6B5BCE'
};

function SvgIcon(name, size) {
  const key = ICON_PATHS[name] ? name : 'bulb';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (ICON_COLOR[key] || '#2A8A94') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON_PATHS[key] + '</svg>';
}

function iconFor(emoji) {
  const map = {
    '💡': 'bulb', '🧘': 'heart', '📝': 'pen', '🆘': 'help', '⚠️': 'alert', '🎯': 'target',
    '🌬': 'wind', '🌱': 'sprout', '🚨': 'siren', '💆': 'sparkles', '🌙': 'moon'
  };
  return SvgIcon(map[emoji], 20);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function addLog(msg) {
  void msg;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}

function showScreen(name) {
  const screens = { panel: screenPanel, recom: screenRecom, detail: screenDetail };
  Object.keys(screens).forEach((k) => screens[k].classList.toggle('active', k === name));
}

async function ensureAviso() {
  if (avisoCache) return avisoCache;
  const res = await obtenerAviso();
  avisoCache = res.data;
  document.querySelector('#avisoModal .aviso-txt').innerHTML =
    '<b>' + escapeHtml(avisoCache.titulo) + '</b><br><br>' + escapeHtml(avisoCache.texto).replace(/\n/g, '<br>');
  if (res.localOnly) {
    addLog('Aviso por defecto (API no disponible)');
  }
  return avisoCache;
}

async function loadList() {
  recList.innerHTML = '<p class="hint">Cargando recomendaciones…</p>';
  const res = await obtenerRecomendaciones(riesgo);

  if (!res.ok) {
    recList.style.display = 'none';
    emptyState.classList.add('show');
    priorityBadge.classList.remove('show');
    document.querySelector('#emptyState h3').textContent = 'No fue posible cargar las recomendaciones';
    addLog('ERROR de carga: ' + res.error);
    return;
  }

  const data = res.data;
  if (!data || data.disponible === false) {
    recList.style.display = 'none';
    emptyState.classList.add('show');
    priorityBadge.classList.remove('show');
    addLog('ESTADO VACÍO — el admin no ha cargado contenido');
    return;
  }

  recData = data.recomendaciones || [];
  if (data.nivel) riesgo = data.nivel;
  renderState();
  addLog(
    'CONSULTA de recomendaciones (invitado)' +
    (riesgo ? (' — nivel ' + riesgoLabel[riesgo] + ', orden priorizado') : ' — orden estándar')
  );
}

function renderState() {
  recList.style.display = 'flex';
  emptyState.classList.remove('show');

  if (riesgo) {
    priorityBadge.classList.add('show');
    priorityBadge.innerHTML = SvgIcon('target', 13) + ' Organizadas según tu nivel de riesgo (' + riesgoLabel[riesgo] + ')';
  } else {
    priorityBadge.classList.remove('show');
  }

  recList.innerHTML = '';
  recData.forEach((r) => {
    // El backend devuelve `nivel` (el demo local usa `nivel_riesgo`): aceptar ambos.
    const nivelItem = r.nivel ?? r.nivel_riesgo;
    const esPrioritaria = r.prioritaria === true || (riesgo && nivelItem === riesgo);
    const item = document.createElement('div');
    item.className = 'rec-item' + (esPrioritaria ? ' prio' : '');
    item.innerHTML =
      '<div class="rec-ico">' + iconFor(r.icono) + '</div>' +
      '<div class="rec-info">' +
        '<h4>' + escapeHtml(r.titulo) + '</h4>' +
        '<p>' + escapeHtml(r.intro || '') + '</p>' +
        (esPrioritaria ? '<span class="prio-tag">Prioritaria para tu nivel</span>' : '') +
      '</div>' +
      '<button class="btn-ver" data-id="' + r.id + '">Ver / Abrir</button>';
    item.querySelector('.btn-ver').addEventListener('click', () => openDetail(r.id));
    recList.appendChild(item);
  });
}

async function openDetail(id) {
  addLog('VISUALIZACIÓN del mensaje aclaratorio antes del detalle (aplica al contenido de autocuidado)');
  pendingRecId = id;
  await ensureAviso();
  avisoModal.classList.add('open');
  registrarVisualizacion('recomendaciones-invitado', 'ok');
}

async function showDetail(id) {
  const res = await obtenerRecomendacion(id);
  if (!res.ok) {
    showToast(res.error || 'Recomendación no disponible');
    addLog('ERROR detalle: ' + res.error);
    return;
  }

  const r = res.data;
  document.getElementById('detIco').innerHTML = iconFor(r.icono);
  document.getElementById('detTitle').textContent = r.titulo;
  document.getElementById('detDur').textContent = r.duracion || '';
  document.getElementById('detIntro').textContent = r.intro || '';
  const steps = document.getElementById('detSteps');
  steps.innerHTML = '';
  const pasos = Array.isArray(r.pasos)
    ? r.pasos
    : String(r.pasos || '').split(/[\r\n]+/).filter(Boolean);
  pasos.forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    steps.appendChild(li);
  });
  document.getElementById('detInstruc').textContent = r.instrucciones || '';
  showScreen('detail');
  addLog('VISUALIZACIÓN del detalle de "' + r.titulo + '" (pasos, duración sugerida e instrucciones)');
}

document.getElementById('openRecom').addEventListener('click', () => {
  loadList();
  showScreen('recom');
});

document.getElementById('openCuestionario').addEventListener('click', async () => {
  addLog('ACCESO a "Responder cuestionario" -> encuesta_invitado.html');
  if (!invitadoService.esInvitado()) {
    await invitadoService.iniciarModoInvitado('panel');
  }
  window.location.href = 'encuesta_invitado.html';
});

document.querySelectorAll('.mini-opts .tile[data-out]').forEach((t) => {
  t.addEventListener('click', () => {
    showToast('Consulte las Líneas de ayuda desde el Panel de invitado');
  });
});

document.getElementById('panelExit').addEventListener('click', async () => {
  addLog('SALIDA del modo invitado — vuelve a la landing');
  await invitadoService.salirModoInvitado('panel');
  window.location.href = 'inicio.html';
});

document.getElementById('volverRecom').addEventListener('click', () => {
  window.location.href = 'panel_invitado.html';
  addLog('NAVEGACIÓN: Volver desde Recomendaciones básicas — regresa al panel de invitado');
});

document.getElementById('avisoOk').addEventListener('click', async () => {
  avisoModal.classList.remove('open');
  addLog('AVISO ACEPTADO — botón "Entendido"');
  if (pendingRecId) {
    await showDetail(pendingRecId);
    pendingRecId = null;
  }
});

document.getElementById('avisoCerrar').addEventListener('click', () => {
  avisoModal.classList.remove('open');
  pendingRecId = null;
  addLog('AVISO CERRADO — no se muestra el detalle');
});

document.getElementById('footerAviso').addEventListener('click', async (e) => {
  e.preventDefault();
  await ensureAviso();
  avisoModal.classList.add('open');
  registrarVisualizacion('recomendaciones-invitado', 'ok');
  addLog('VISUALIZACIÓN del mensaje aclaratorio por enlace "Aviso: no diagnóstico"');
});

document.getElementById('detBack').addEventListener('click', () => {
  showScreen('recom');
  addLog('NAVEGACIÓN: "Volver a recomendaciones" — regresa a la lista de recomendaciones');
});

document.getElementById('detHome').addEventListener('click', () => {
  window.location.href = 'panel_invitado.html';
  addLog('NAVEGACIÓN: "Volver al inicio (Invitado)" — regresa al panel de invitado');
});

document.getElementById('emptyBack').addEventListener('click', () => {
  window.location.href = 'panel_invitado.html';
  addLog('NAVEGACIÓN: "Volver al inicio (Invitado)" desde estado vacío');
});

loadList();
showScreen('recom');
addLog('Sistema listo — recomendaciones dinámicas por API (priorizadas por nivel de la sesión)');