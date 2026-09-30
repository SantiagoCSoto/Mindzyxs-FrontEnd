/**
 * Controlador del chat psicólogo-paciente (PB-31) — fiel al mockup.
 * Tabs Conversaciones/Solicitudes, previews, typing, presencia,
 * modales de bloqueo/autorización + buscador de pacientes con riesgo.
 * Sesión Bearer (login) -> token Firebase -> RTDB en vivo + endpoints SQL.
 */

import {
  obtenerTokenChat, obtenerConversaciones, buscarPacientes, ofrecerChat,
  responderSolicitud, bloquearChat, desbloquearChat, avisarMensaje,
  conectarRtdb, suscribirMensajes, enviarMensaje, marcarPresencia,
  escucharPresencia, escucharEscribiendo, avisarEscribiendo, escucharMeta, leerUltimoMensaje,
  marcarVisto, escucharVisto, leerVisto
} from '../services/chatService.js';
import { authService } from '../services/authService.js';

const $ = (id) => document.getElementById(id);
const rolePill = $('rolePill'), convList = $('convList'), convCount = $('convCount');
const msgs = $('msgs'), msgInput = $('msgInput'), sendBtn = $('sendBtn');
const blockBtn = $('blockBtn'), blockedBanner = $('blockedBanner'), typing = $('typing');
const toast = $('toast'), reqBadge = $('reqBadge'), reqList = $('reqList');
const tabChat = $('tabChat'), tabReq = $('tabReq'), panelChat = $('panelChat'), panelReq = $('panelReq');
const blockModal = $('blockModal'), authModal = $('authModal');

// Autochequeo de versión: si falta algún id, la vista es vieja (caché) y nada funcionará.
(function verificarVista() {
  const ids = ['rolePill', 'convList', 'convCount', 'msgs', 'msgInput', 'sendBtn', 'blockBtn',
    'blockedBanner', 'typing', 'toast', 'reqBadge', 'reqList', 'tabChat', 'tabReq',
    'panelChat', 'panelReq', 'blockModal', 'authModal', 'searchBox', 'searchPaciente',
    'filterNivel', 'filterMinCuest', 'filterPsicologos', 'btnBuscar', 'searchResults',
    'chatName', 'chatAvatar', 'chatStatus', 'blockTitle', 'blockText', 'blockCancel',
    'blockConfirm', 'unblockBtn', 'authText', 'authOk'];
  const faltan = ids.filter((id) => !$(id));
  if (faltan.length) {
    document.body.innerHTML = '<div style="font-family:sans-serif;padding:40px;text-align:center">' +
      '<h2>Vista desactualizada</h2><p>Esta página cargó archivos viejos desde la caché. ' +
      'Recargue con <b>Ctrl+Shift+R</b>.</p><p style="color:#8E91A3;font-size:12px">Faltan: ' +
      faltan.join(', ') + '</p></div>';
    throw new Error('Vista desactualizada (caché): faltan ' + faltan.join(', '));
  }
})();

let yo = null; // { uid, rol }
let db = null;
let conversaciones = [];
let activaId = null;
let offMsgs = null, offMeta = null, offTyping = null, offPresence = null, offVisto = null;
let typingTimer = null;

// Ticks de estado (enviada · entregada · leída) en SVG, estándar del front.
const TICK_ENVIADA =
  '<svg class="tick-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 4 7 13 3 9"></polyline></svg>';
const TICK_ENTREGADA =
  '<svg class="tick-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 7 12 3 8"></polyline><polyline points="21 3 12 12 8 8"></polyline></svg>';
const TICK_LEIDA =
  '<svg class="tick-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 7 12 3 8"></polyline><polyline points="21 3 12 12 8 8"></polyline></svg>';

function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}
function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function inicialesDe(nombre) {
  const p = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}
function horaDe(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function diaDe(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES');
}
function sesion() {
  try { return JSON.parse(sessionStorage.getItem('usuario')); } catch (_) { return null; }
}
function esMio(conv) {
  return conv.contraparte.rol === 'Paciente' ? yo.rol === 'Paciente' : yo.rol === 'Psicologo';
}
function soyPaciente() { return yo && yo.rol === 'Paciente'; }
function pendientesAccionables() {
  return conversaciones.filter((c) => c.estado === 'Pendiente' && soyPaciente() && c.contraparte.rol === 'Psicologo');
}

// ---------- Tabs ----------
function setTab(isReq) {
  tabChat.classList.toggle('active', !isReq);
  tabReq.classList.toggle('active', isReq);
  panelChat.style.display = isReq ? 'none' : 'block';
  panelReq.style.display = isReq ? 'block' : 'none';
}

// ---------- Lista con reconciliación (sin parpadeo: nunca se vacía y re-llena) ----------
const nodosConv = new Map(); // id -> button
const metaEstado = {};       // id -> último estado visto en RTDB (evita loops del evento inicial)

function claseEstado(estado) {
  return estado === 'Pendiente' ? 'pend' : (estado === 'Aceptada' ? 'ok' : (estado === 'Bloqueada' ? 'block' : ''));
}

function pintarNodo(div, c) {
  div.className = 'conv' + (c.id === activaId ? ' active' : '');
  div.innerHTML = '<div class="conv-top"><div class="avatar">' + escapar(inicialesDe(c.contraparte.nombre)) + '</div>' +
    '<div><b>' + escapar(c.contraparte.nombre) + '</b><small>' + escapar(c.contraparte.rol) + ' • ' + escapar(c.estado) + '</small></div></div>' +
    '<div class="conv-preview">…</div>';
}

function renderConvs() {
  // Quita solo las que ya no existen.
  for (const [id, nodo] of [...nodosConv]) {
    if (!conversaciones.some((c) => c.id === id)) {
      nodo.remove();
      nodosConv.delete(id);
    }
  }
  if (!conversaciones.length) {
    convList.innerHTML = '<div class="empty">Sin conversaciones todavía.</div>';
    return;
  }
  const vacio = convList.querySelector('.empty');
  if (vacio) vacio.remove();
  convList.querySelectorAll('.sk').forEach((n) => n.remove());
  // Crea o actualiza en su lugar (sin limpiar la lista).
  conversaciones.forEach((c) => {
    try {
      let div = nodosConv.get(c.id);
      if (!div) {
        div = document.createElement('button');
        div.type = 'button';
        div.dataset.convId = c.id;
        div.addEventListener('click', () => openConv(c.id));
        nodosConv.set(c.id, div);
        convList.appendChild(div);
      }
      pintarNodo(div, c);
    } catch (error) {
      const div = document.createElement('div');
      div.className = 'conv';
      div.innerHTML = '<div class="conv-preview">Error pintando chat ' + escapar(c && c.id) + ': ' + escapar(error.message) + '</div>';
      convList.appendChild(div);
    }
    // Preview en segundo plano sobre el nodo ya pintado.
    leerUltimoMensaje(db, c.id)
      .then((last) => {
        const vivo = nodosConv.get(c.id);
        if (!vivo || !vivo.isConnected) return;
        const pv = vivo.querySelector('.conv-preview');
        if (pv) pv.textContent = last
          ? ((String(last.remitenteUid) === String(yo.uid) ? 'Usted: ' : c.contraparte.nombre.split(' ')[0] + ': ') + last.texto)
          : 'Sin mensajes';
      })
      .catch(() => { });
  });
  const pend = pendientesAccionables();
  reqBadge.hidden = !pend.length;
  reqBadge.textContent = pend.length;
  convCount.textContent = conversaciones.length;
}

async function recargar() {
  if (!conversaciones.length && convList && !recargar._primeraHecha) {
    recargar._primeraHecha = true;
    convList.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('div');
      d.className = 'sk sk-card';
      d.setAttribute('aria-hidden', 'true');
      convList.appendChild(d);
    }
  }
  try {
    conversaciones = await obtenerConversaciones();
  } catch (error) {
    if (!conversaciones.length) {
      convList.innerHTML = '<div class="empty">No fue posible cargar: ' + escapar(error.message) + '</div>';
    }
    return;
  }
  renderConvs();
  renderReqs();
  // Refresca la abierta en su lugar (sin re-suscribir ni limpiar mensajes).
  if (activaId) {
    const c = conversaciones.find((x) => x.id === activaId);
    if (c) {
      metaEstado[c.id] = c.estado;
      $('chatName').textContent = c.contraparte.nombre;
      actualizarBloqueo(c);
      if (c.estado !== 'Aceptada') {
        $('chatStatus').textContent = 'Estado: ' + c.estado + ' — los mensajes se habilitan al aceptar.';
      }
    }
  }
}

// ---------- Chat abierto ----------
function limpiarSuscripciones() {
  [offMsgs, offMeta, offTyping, offPresence, offVisto].forEach((off) => { try { off && off(); } catch (_) { } });
  offMsgs = offMeta = offTyping = offPresence = offVisto = null;
}

async function openConv(id, mantener = false) {
  const c = conversaciones.find((x) => x.id === id);
  if (!c) { authModal.classList.add('open'); return; }
  limpiarSuscripciones();
  activaId = id;
  renderConvs();
  $('chatName').textContent = c.contraparte.nombre;
  $('chatAvatar').textContent = inicialesDe(c.contraparte.nombre);
  $('chatStatus').innerHTML = 'En línea • ' + escapar(c.contraparte.rol);
  msgs.innerHTML = '';
  actualizarBloqueo(c);

  if (c.estado !== 'Aceptada') {
    $('chatStatus').textContent = 'Estado: ' + c.estado + ' — los mensajes se habilitan al aceptar.';
    return;
  }

  // Meta en vivo: solo reacciona si el estado REALMENTE cambió
  // (el evento inicial al suscribirse se ignora vía metaEstado).
  metaEstado[c.id] = c.estado;
  offMeta = escucharMeta(db, c.id, async (meta) => {
    const nuevo = meta && meta.estado;
    if (!nuevo || nuevo === metaEstado[c.id]) return;
    metaEstado[c.id] = nuevo;
    showToast('La conversación cambió a: ' + nuevo);
    await recargar();
  });
  // Visto del otro: estado persistente (sobrevive recargas).
  let vistoMapa = {};
  let otroEnLineaFlag = false;
  const otroUidStr = String(c.contraparte.id);
  const aplicarTick = (el, mid) => {
    if (!el) return;
    if ((vistoMapa[mid] || {})[otroUidStr]) {
      el.classList.remove('t0', 't1');
      el.classList.add('t2b');
      el.innerHTML = TICK_LEIDA;
    } else if (otroEnLineaFlag && !el.classList.contains('t2b')) {
      el.classList.remove('t0');
      el.classList.add('t1');
      el.innerHTML = TICK_ENTREGADA;
    }
  };
  const refrescarTicks = () => {
    msgs.querySelectorAll('.ticks[data-mid]').forEach((el) => aplicarTick(el, el.dataset.mid));
  };
  offVisto = escucharVisto(db, c.id, () => {
    leerVisto(db, c.id).then((m) => { vistoMapa = m || {}; refrescarTicks(); }).catch(() => { });
  });
  // Presencia del otro.
  const otroUid = c.contraparte.id;
  offPresence = escucharPresencia(db, c.id, otroUid, (enLinea) => {
    otroEnLineaFlag = !!enLinea;
    $('chatStatus').innerHTML = (enLinea ? '<span class="dot"></span>En línea' : 'Desconectado') + ' • ' + escapar(c.contraparte.rol);
    refrescarTicks(); // entregado: gris con m
  });
  marcarPresencia(db, c.id, yo.uid);
  // Estado inicial (para recargas): visto + presencia de una vez.
  leerVisto(db, c.id).then((m) => { vistoMapa = m || {}; refrescarTicks(); }).catch(() => { });
  // Typing del otro.
  offTyping = escucharEscribiendo(db, c.id, otroUid, (escribiendo) => {
    typing.classList.toggle('show', !!escribiendo);
  });
  // Mensajes en vivo.
  window.__aplicarTick = aplicarTick;
  offMsgs = suscribirMensajes(db, c.id, (m) => pintarMensaje(m, c));
}

function actualizarBloqueo(c) {
  const bloqueada = c.estado === 'Bloqueada';
  const bloqueoYo = bloqueada && c.bloqueadaPorMi;
  blockedBanner.classList.toggle('show', bloqueada);
  $('blockedText').textContent = bloqueoYo
    ? 'Usted bloqueó a este contacto. No puede escribirle.'
    : 'Usted fue bloqueado por este usuario. No puede escribir en este chat.';
  $('unblockBtn').style.display = bloqueoYo ? '' : 'none';
  msgInput.disabled = bloqueada;
  sendBtn.disabled = bloqueada;
  blockBtn.disabled = bloqueada;
  $('blockBtnText').textContent = soyPaciente() ? 'Bloquear psicólogo' : 'Bloquear paciente';
  blockBtn.hidden = !(soyPaciente() && (c.estado === 'Aceptada' || bloqueoYo));
  if (bloqueada) {
    $('chatStatus').textContent = bloqueoYo
      ? 'Bloqueado por usted.'
      : 'Bloqueado — no puede escribir en este chat.';
  }
}

// Bolitas propias: enviada · entregada · leída (checks en SVG, igual estándar del front).

function pintarMensaje(m, c) {
  const propio = String(m.remitenteUid) === String(yo.uid);
  if (!propio) {
    // Lo estoy viendo ahora mismo: marcar leído (best-effort, el otro lo ve azul).
    marcarVisto(db, c.id, m.id, yo.uid);
  }
  const div = document.createElement('div');
  div.className = 'msg ' + (propio ? 'out' : 'in');
  const quien = propio ? 'Usted' : c.contraparte.nombre;
  const ticks = propio ? `<span class="ticks t0" data-mid="${escapar(m.id)}">${TICK_ENVIADA}</span>` : '';
  div.innerHTML = '<b>' + escapar(quien) + '</b><div>' + escapar(m.texto) + '</div><small>' + escapar(horaDe(m.fecha)) + ticks + '</small>';
  msgs.appendChild(div);
  if (propio && window.__aplicarTick) window.__aplicarTick(div.querySelector('.ticks'), m.id);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendMessage() {
  const c = conversaciones.find((x) => x.id === activaId);
  if (!c || msgInput.disabled) return;
  const texto = msgInput.value.trim();
  if (!texto) { showToast('Escriba un mensaje primero'); return; }
  msgInput.value = '';
  avisarEscribiendo(db, c.id, yo.uid, false);
  try {
    await enviarMensaje(db, c.id, yo.uid, texto);
    avisarMensaje(c.id);
  } catch (error) {
    showToast(error.message || 'No fue posible enviar el mensaje. Intente nuevamente');
  }
}

// ---------- Solicitudes ----------
function renderReqs() {
  const pend = pendientesAccionables();
  reqList.innerHTML = '';
  if (!pend.length && yo.rol !== 'Psicologo') {
    reqList.innerHTML = '<div class="empty">No tienes solicitudes pendientes.</div>';
    return;
  }
  pend.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'req-card';
    div.innerHTML = '<div class="conv-top"><div class="avatar">' + escapar(inicialesDe(c.contraparte.nombre)) + '</div>' +
      '<div><h3>' + escapar(c.contraparte.nombre) + '</h3><p style="margin:0">Solicitud • ' + escapar(c.contraparte.rol) + '</p></div></div>' +
      '<p>Quiere iniciar un chat de apoyo contigo.</p>' +
      '<p class="hint">Al aceptar, autorizas a tu psicólogo a ver tu progreso y asignarte cuestionarios.</p>' +
      '<div class="req-actions"><button class="btn-accept">Aceptar</button><button class="btn-reject">Rechazar</button></div>';
    div.querySelector('.btn-accept').addEventListener('click', () => responder(c.id, true));
    div.querySelector('.btn-reject').addEventListener('click', () => responder(c.id, false));
    reqList.appendChild(div);
  });
  if (yo.rol === 'Psicologo') {
    const enviadas = conversaciones.filter((c) => c.estado === 'Pendiente');
    if (enviadas.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = `Tiene ${enviadas.length} solicitud(es) esperando respuesta del paciente.`;
      reqList.appendChild(p);
    } else if (!pend.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Sin solicitudes. Busque un paciente abajo para ofrecerle chat.';
      reqList.appendChild(p);
    }
  }
}

async function responder(id, aceptar) {
  if (aceptar && !confirm('Al aceptar, autorizas a tu psicólogo a ver tu progreso y asignarte cuestionarios. ¿Desea continuar?')) return;
  try {
    await responderSolicitud(id, aceptar);
    showToast(aceptar ? 'Conversación iniciada. Autorizaste a tu psicólogo.' : 'Solicitud rechazada');
    await recargar(false);
    if (aceptar) { setTab(false); await openConv(id); }
  } catch (error) {
    if (/permiso|autoriz/i.test(error.message)) {
      $('authText').textContent = error.message;
      authModal.classList.add('open');
    } else {
      showToast(error.message);
    }
  }
}

// ---------- Buscador (psicólogo) ----------
async function buscar() {
  const q = $('searchPaciente').value.trim();
  const nivel = $('filterNivel').value;
  const minCuest = Number($('filterMinCuest').value) || undefined;
  const tienePsi = $('filterPsicologos').value;
  if (!q && !nivel && !minCuest && tienePsi === '') {
    showToast('Seleccione al menos un filtro antes de buscar.');
    return;
  }
  const box = $('searchResults');
  box.innerHTML = '<p class="hint">Buscando…</p>';
  try {
    const res = await buscarPacientes(q, {
      nivel: nivel || undefined,
      minCuestionarios: minCuest,
      tienePsicologo: tienePsi === '' ? undefined : tienePsi
    });
    if (!res.length) { box.innerHTML = '<p class="hint">Sin coincidencias.</p>'; return; }
    box.innerHTML = '';
    res.forEach((p) => {
      const nivel = p.ultimoNivel
        ? `<span class="risk-tag ${p.ultimoNivel.toLowerCase()}">Riesgo ${escapar(p.ultimoNivel)}${p.ultimoPuntaje != null ? ' · ' + p.ultimoPuntaje : ''}</span>`
        : '<span class="risk-tag none">Sin datos</span>';
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `<div class="conv-top"><span class="avatar">${escapar(inicialesDe(p.nombre))}</span><div><h4>${escapar(p.nombre)}</h4><p>${escapar(p.correo)}</p>${nivel}<p>${p.cuestionariosRespondidos} cuestionario(s) · ${p.psicologos} psicólogo(s)</p></div></div><button class="btn btn-tile">Ofrecer</button>`;
      div.querySelector('button').addEventListener('click', async () => {
        try {
          const conv = await ofrecerChat(p.id);
          showToast('Solicitud enviada a ' + p.nombre);
          $('searchPaciente').value = '';
          box.innerHTML = '';
          await recargar();
          setTab(false);
          await openConv(conv.id);
        } catch (error) {
          showToast(error.message);
        }
      });
      box.appendChild(div);
    });
  } catch (error) {
    box.innerHTML = `<p class="hint">No fue posible buscar: ${escapar(error.message)}</p>`;
  }
}

// ---------- Eventos ----------
sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { sendMessage(); return; }
  const c = conversaciones.find((x) => x.id === activaId);
  if (!c || msgInput.disabled) return;
  avisarEscribiendo(db, c.id, yo.uid, true);
  clearTimeout(avisarEscribiendo._t);
  avisarEscribiendo._t = setTimeout(() => avisarEscribiendo(db, c.id, yo.uid, false), 2000);
});
tabChat.addEventListener('click', () => setTab(false));
tabReq.addEventListener('click', () => setTab(true));
$('btnBuscar')?.addEventListener('click', buscar);
$('searchPaciente')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); });

blockBtn.addEventListener('click', () => {
  const c = conversaciones.find((x) => x.id === activaId);
  if (!c) return;
  $('blockTitle').textContent = soyPaciente() ? 'Bloquear psicólogo' : 'Bloquear paciente';
  $('blockText').textContent = 'Al bloquear a ' + c.contraparte.nombre + ', no podrá enviar ni recibir mensajes. Podrá desbloquearlo más tarde desde este mismo chat. ¿Desea continuar?';
  blockModal.classList.add('open');
});
$('blockCancel').addEventListener('click', () => blockModal.classList.remove('open'));
$('blockConfirm').addEventListener('click', async () => {
  blockModal.classList.remove('open');
  try {
    await bloquearChat(activaId);
    showToast('Contacto bloqueado');
    await recargar(true);
  } catch (error) {
    showToast(error.message);
  }
});
$('unblockBtn').addEventListener('click', async () => {
  try {
    await desbloquearChat(activaId);
    showToast('Contacto desbloqueado');
    await recargar(true);
  } catch (error) {
    showToast(error.message);
  }
});
$('authOk').addEventListener('click', () => authModal.classList.remove('open'));

// Refresco periódico suave (por si algo cambió fuera del chat).
setInterval(() => { recargar(true).catch(() => { }); }, 20000);
window.addEventListener('focus', () => { recargar(true).catch(() => { }); });

async function iniciar() {
  if (!sesion()) { window.location.href = 'login.html'; return; }
  try {
    const t = await obtenerTokenChat();
    yo = { uid: t.uid, rol: t.rol };
    $('rolePill').textContent = t.rol === 'Paciente' ? 'Paciente' : 'Psicólogo';
    $('searchBox').hidden = t.rol !== 'Psicologo';
    $('blockBtnText').textContent = t.rol === 'Paciente' ? 'Bloquear psicólogo' : 'Bloquear paciente';
    db = await conectarRtdb(t.firebaseToken, t.databaseUrl);
    await recargar(false);
    const primero = conversaciones.find((c) => c.estado === 'Aceptada') || conversaciones[0];
    if (primero) await openConv(primero.id);
  } catch (error) {
    convList.innerHTML = '<div class="empty">No fue posible conectar: ' + escapar(error.message) + '</div>';
    showToast(error.message);
  }
}

iniciar();

// Cerrar sesión (header unificado)
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
    authService.logout();
    sessionStorage.removeItem('es_invitado');
    window.location.href = 'login.html';
  });
}
