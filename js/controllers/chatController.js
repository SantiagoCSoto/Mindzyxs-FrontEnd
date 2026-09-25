/**
 * Controlador del chat psicólogo-paciente (PB-31).
 * Sesión Bearer (login) -> token Firebase -> RTDB en vivo (mensajes,
 * presencia) + endpoints SQL (solicitudes, aceptar/rechazar, bloqueo).
 */

import {
  obtenerTokenChat, obtenerConversaciones, buscarPacientes, ofrecerChat,
  responderSolicitud, bloquearChat, desbloquearChat, avisarMensaje,
  conectarRtdb, suscribirMensajes, enviarMensaje, marcarPresencia
} from '../services/chatService.js';

const roleBadge = document.getElementById('roleBadge');
const connBadge = document.getElementById('connBadge');
const convList = document.getElementById('convList');
const offerBox = document.getElementById('offerBox');
const chatTitulo = document.getElementById('chatTitulo');
const chatEstado = document.getElementById('chatEstado');
const messagesEl = document.getElementById('messages');
const composer = document.getElementById('composer');
const msgInput = document.getElementById('msgInput');
const btnEnviar = document.getElementById('btnEnviar');
const btnBloquear = document.getElementById('btnBloquear');
const btnDesbloquear = document.getElementById('btnDesbloquear');
const blockedBanner = document.getElementById('blockedBanner');
const toast = document.getElementById('toast');

let yo = null;          // { uid, rol }
let db = null;
let conversaciones = [];
let activa = null;
let offSuscripcion = null;

function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function inicialesDe(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

function sesion() {
  try {
    return JSON.parse(sessionStorage.getItem('usuario'));
  } catch (_) {
    return null;
  }
}

function pintarLista() {
  if (!conversaciones.length) {
    convList.innerHTML = '<p class="hint">Sin conversaciones. Un psicólogo puede ofrecerte chat desde aquí.</p>';
    return;
  }
  convList.innerHTML = '';
  conversaciones.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'conv-item' + (activa && activa.id === c.id ? ' active' : '');
    const cls = c.estado === 'Pendiente' ? 'pend' : (c.estado === 'Aceptada' ? 'ok' : (c.estado === 'Bloqueada' ? 'block' : ''));
    const iniciales = inicialesDe(c.contraparte.nombre);
    div.innerHTML = `<div class="conv-top"><span class="avatar">${escapar(iniciales)}</span><div><h4>${escapar(c.contraparte.nombre)}</h4><p>${escapar(c.contraparte.rol)}</p></div></div><span class="st ${cls}">${escapar(c.estado)}</span>`;
    if (c.estado === 'Pendiente' && yo.rol === 'Paciente') {
      const row = document.createElement('div');
      row.className = 'conv-actions';
      row.innerHTML = `<button data-acc="1">Aceptar</button><button data-acc="0">Rechazar</button>`;
      row.querySelector('[data-acc="1"]').addEventListener('click', (e) => { e.stopPropagation(); responder(c.id, true); });
      row.querySelector('[data-acc="0"]').addEventListener('click', (e) => { e.stopPropagation(); responder(c.id, false); });
      div.appendChild(row);
    }
    div.addEventListener('click', () => abrirConversacion(c.id));
    convList.appendChild(div);
  });
}

async function recargar() {
  try {
    conversaciones = await obtenerConversaciones();
  } catch (error) {
    convList.innerHTML = `<p class="hint">No fue posible cargar: ${escapar(error.message)}</p>`;
    return;
  }
  pintarLista();
  if (activa) {
    const act = conversaciones.find((c) => c.id === activa.id);
    if (act) abrirConversacion(act.id, true);
  }
}

async function responder(id, aceptar) {
  try {
    await responderSolicitud(id, aceptar);
    showToast(aceptar ? 'Chat aceptado' : 'Solicitud rechazada');
    await recargar();
  } catch (error) {
    showToast(error.message);
  }
}

function pintarMensaje(m) {
  const propio = String(m.remitenteUid) === String(yo.uid);
  const div = document.createElement('div');
  div.className = 'msg ' + (propio ? 'mine' : 'theirs');
  const hora = m.fecha ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  div.innerHTML = `${escapar(m.texto)}<small>${propio ? 'Vos' : escapar(activa.contraparte.nombre)} · ${hora}</small>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function abrirConversacion(id, mantener = false) {
  const c = conversaciones.find((x) => x.id === id);
  if (!c) return;
  if (offSuscripcion) { offSuscripcion(); offSuscripcion = null; }
  activa = c;
  messagesEl.innerHTML = '';
  chatTitulo.textContent = c.contraparte.nombre;
  chatEstado.textContent = `Estado: ${c.estado}`;
  pintarLista();

  const puedoEscribir = c.estado === 'Aceptada' && !c.bloqueadaPorMi;
  const bloqueadoYo = c.estado === 'Bloqueada' && !c.bloqueadaPorMi;
  msgInput.disabled = !puedoEscribir;
  btnEnviar.disabled = !puedoEscribir;
  blockedBanner.classList.toggle('show', c.estado === 'Bloqueada');
  btnBloquear.hidden = !(yo.rol === 'Paciente' && c.estado === 'Aceptada');
  btnDesbloquear.hidden = !(yo.rol === 'Paciente' && c.estado === 'Bloqueada' && c.bloqueadaPorMi);

  if (bloqueadoYo) {
    chatEstado.textContent = 'Estado: Bloqueada — no podés escribir en este chat.';
    return;
  }
  if (c.estado !== 'Aceptada') {
    chatEstado.textContent = `Estado: ${c.estado} — los mensajes se habilitan al aceptar.`;
    return;
  }

  offSuscripcion = suscribirMensajes(db, c.id, pintarMensaje);
  marcarPresencia(db, c.id, yo.uid);
  if (!mantener) showToast('Chat en vivo conectado');
}

composer.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activa || msgInput.disabled) return;
  const texto = msgInput.value.trim();
  if (!texto) return;
  msgInput.value = '';
  try {
    await enviarMensaje(db, activa.id, yo.uid, texto);
    avisarMensaje(activa.id);
  } catch (error) {
    showToast(error.message || 'No fue posible enviar (¿bloqueado o sin estado Aceptada?)');
  }
});

btnBloquear.addEventListener('click', async () => {
  if (!activa || !confirm('¿Bloquear a este usuario? No podrá escribirte.')) return;
  try {
    await bloquearChat(activa.id);
    showToast('Usuario bloqueado');
    await recargar();
  } catch (error) {
    showToast(error.message);
  }
});

btnDesbloquear.addEventListener('click', async () => {
  if (!activa) return;
  try {
    await desbloquearChat(activa.id);
    showToast('Usuario desbloqueado');
    await recargar();
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById('btnBuscar')?.addEventListener('click', async () => {
  const q = document.getElementById('searchPaciente').value.trim();
  const box = document.getElementById('searchResults');
  box.innerHTML = '<p class="hint">Buscando…</p>';
  try {
    const res = await buscarPacientes(q);
    if (!res.length) {
      box.innerHTML = '<p class="hint">Sin coincidencias.</p>';
      return;
    }
    box.innerHTML = '';
    res.forEach((p) => {
      const nivel = p.ultimoNivel
        ? `<span class="risk-tag ${p.ultimoNivel.toLowerCase()}">Riesgo ${escapar(p.ultimoNivel)}${p.ultimoPuntaje != null ? ' · ' + p.ultimoPuntaje : ''}</span>`
        : '<span class="risk-tag none">Sin datos</span>';
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `<div class="conv-top"><span class="avatar">${escapar(inicialesDe(p.nombre))}</span><div><h4>${escapar(p.nombre)}</h4><p>${escapar(p.correo)}</p>${nivel}</div></div><button class="btn btn-tile">Ofrecer</button>`;
      div.querySelector('button').addEventListener('click', async () => {
        try {
          await ofrecerChat(p.id);
          showToast('Solicitud enviada a ' + p.nombre);
          box.innerHTML = '';
          document.getElementById('searchPaciente').value = '';
          await recargar();
        } catch (error) {
          showToast(error.message);
        }
      });
      box.appendChild(div);
    });
  } catch (error) {
    box.innerHTML = `<p class="hint">No fue posible buscar: ${escapar(error.message)}</p>`;
  }
});

document.getElementById('btn-volver')?.addEventListener('click', () => {
  window.history.back();
});

async function iniciar() {
  const u = sesion();
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  try {
    const t = await obtenerTokenChat();
    yo = { uid: t.uid, rol: t.rol };
    if (roleBadge) roleBadge.textContent = t.rol;
    db = await conectarRtdb(t.firebaseToken, t.databaseUrl);
    if (connBadge) {
      connBadge.textContent = 'En vivo';
      connBadge.classList.add('ok');
    }
    if (t.rol === 'Psicologo' && offerBox) offerBox.hidden = false;
    await recargar();
  } catch (error) {
    if (connBadge) {
      connBadge.textContent = 'Sin conexión';
      connBadge.classList.add('err');
    }
    showToast(error.message);
  }
}

iniciar();
