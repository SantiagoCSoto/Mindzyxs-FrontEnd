/**
 * Servicio de chat psicólogo-paciente (PB-31).
 * SQL (sesión Bearer, apiClient la envía sola) + Firebase RTDB en vivo:
 *   POST /chat/token                    -> { firebaseToken, uid, rol, databaseUrl }
 *   GET  /chat/conversaciones           -> propias (pendientes = notificaciones)
 *   POST /chat/solicitudes {idPaciente} -> ofrece (psicólogo)
 *   POST /chat/solicitudes/{id}/aceptar|rechazar (paciente dueño)
 *   POST|DELETE /chat/conversaciones/{id}/bloqueo (paciente)
 *   POST /chat/conversaciones/{id}/mensajes/aviso (best-effort tras push)
 * RTDB usa el SDK compat global `firebase` (scripts en la vista).
 */

import { getJson, postJson, deleteJson } from './apiClient.js';

export const FIREBASE_WEB_CONFIG = {
  apiKey: 'AIzaSyC6DYg_9qHfQmBa2eDYjtqlL9_U2UcAeBw',
  authDomain: 'mindzyxs.firebaseapp.com',
  databaseURL: 'https://mindzyxs-default-rtdb.europe-west1.firebasedatabase.app'
};

export async function obtenerTokenChat() {
  const res = await postJson('/chat/token', {});
  if (!res.ok) throw new Error(res.error || 'Sesión requerida');
  return res.data;
}

export async function obtenerConversaciones() {
  const res = await getJson('/chat/conversaciones');
  if (!res.ok) {
    if (res.status === 404) throw new Error('Back sin endpoints de chat (¿API en rama PB31?)');
    throw new Error(res.error || 'No fue posible cargar las conversaciones');
  }
  return res.data ?? [];
}

export async function buscarPacientes(q) {
  const res = await getJson('/chat/pacientes' + (q ? '?q=' + encodeURIComponent(q) : ''));
  if (!res.ok) throw new Error(res.error || 'No fue posible buscar pacientes');
  return res.data ?? [];
}

export async function ofrecerChat(idPaciente) {
  const res = await postJson('/chat/solicitudes', { idPaciente });
  if (!res.ok) throw new Error(res.error || 'No fue posible crear la solicitud');
  return res.data;
}

export async function responderSolicitud(id, aceptar) {
  const res = await postJson(`/chat/solicitudes/${id}/${aceptar ? 'aceptar' : 'rechazar'}`, {});
  if (!res.ok) throw new Error(res.error || 'No fue posible procesar la solicitud');
  return res.data;
}

export async function bloquearChat(id) {
  const res = await postJson(`/chat/conversaciones/${id}/bloqueo`, {});
  if (!res.ok) throw new Error(res.error || 'No fue posible bloquear');
  return res.data;
}

export async function desbloquearChat(id) {
  const res = await deleteJson(`/chat/conversaciones/${id}/bloqueo`);
  if (!res.ok) throw new Error(res.error || 'No fue posible desbloquear');
  return res.data;
}

export async function avisarMensaje(id) {
  try {
    await postJson(`/chat/conversaciones/${id}/mensajes/aviso`, {});
  } catch (_) { /* best-effort: el mensaje ya viaja por RTDB */ }
}

// --- RTDB en vivo (SDK compat global) ---
let rtdbLista = false;

export async function conectarRtdb(firebaseToken, databaseUrl) {
  if (!rtdbLista) {
    if (!window.firebase) throw new Error('SDK de Firebase no cargado');
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp({ ...FIREBASE_WEB_CONFIG, databaseURL: databaseUrl || FIREBASE_WEB_CONFIG.databaseURL });
    }
    rtdbLista = true;
  }
  await window.firebase.auth().signInWithCustomToken(firebaseToken);
  return window.firebase.database();
}

export function suscribirMensajes(db, conversacionId, onMensaje) {
  const ref = db.ref(`conversaciones/${conversacionId}/mensajes`);
  const handler = (snap) => onMensaje({ id: snap.key, ...snap.val() });
  ref.on('child_added', handler);
  return () => ref.off('child_added', handler);
}

export async function enviarMensaje(db, conversacionId, uid, texto) {
  const ref = db.ref(`conversaciones/${conversacionId}/mensajes`);
  await ref.push({ remitenteUid: String(uid), texto, fecha: new Date().toISOString() });
}

export function marcarPresencia(db, conversacionId, uid) {
  const ref = db.ref(`conversaciones/${conversacionId}/presencia/${uid}`);
  ref.set({ enLinea: true, fecha: new Date().toISOString() });
  ref.onDisconnect().remove();
}

export function escucharPresencia(db, conversacionId, uid, onCambio) {
  const ref = db.ref(`conversaciones/${conversacionId}/presencia/${uid}`);
  const handler = (snap) => onCambio(!!snap.val());
  ref.on('value', handler);
  return () => ref.off('value', handler);
}

export function avisarEscribiendo(db, conversacionId, uid, escribiendo) {
  try {
    db.ref(`conversaciones/${conversacionId}/typing/${uid}`).set(escribiendo ? { fecha: new Date().toISOString() } : null);
  } catch (_) { /* best-effort */ }
}

export function escucharEscribiendo(db, conversacionId, uid, onCambio) {
  const ref = db.ref(`conversaciones/${conversacionId}/typing/${uid}`);
  const handler = (snap) => onCambio(!!snap.val());
  ref.on('value', handler);
  return () => ref.off('value', handler);
}

export function escucharMeta(db, conversacionId, onCambio) {
  const ref = db.ref(`conversaciones/${conversacionId}/meta`);
  const handler = (snap) => { if (snap.val()) onCambio(snap.val()); };
  ref.on('value', handler);
  return () => ref.off('value', handler);
}

export async function leerUltimoMensaje(db, conversacionId) {
  const snap = await db.ref(`conversaciones/${conversacionId}/mensajes`).limitToLast(1).once('value');
  let ultimo = null;
  snap.forEach((hijo) => { ultimo = { id: hijo.key, ...hijo.val() }; });
  return ultimo;
}
