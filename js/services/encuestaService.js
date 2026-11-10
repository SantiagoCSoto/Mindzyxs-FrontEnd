/**
 * Servicio para el cuestionario de invitado (PB-07 HU1-PB7).
 * Contrato real del backend (http://localhost:5015/api):
 *   GET  /cuestionario/invitado?excluidos=1,2  -> pendiente con rotación
 *   POST /cuestionario/invitado/inicio         -> { cuestionarioId }
 *   POST /cuestionario/invitado/finalizar      -> { cuestionarioId, respuestas: [{ preguntaId, opcionId }] }
 * Si el backend no responde, las funciones lanzan el error para que el
 * controlador muestre el estado de error con reintento (no se finge envío).
 */

import { getJson, postJson } from './apiClient.js';

const KEY_SESION = 'encuesta_invitado_front';
const KEY_NIVEL = 'encuesta_invitado_nivel';

/**
 * Siguiente cuestionario pendiente (rotación por excluidos = cookies cuest_*).
 */
export async function obtenerPendiente(excluidos) {
  const qs = excluidos && excluidos.length
    ? '?excluidos=' + encodeURIComponent(excluidos.join(','))
    : '';
  const res = await getJson('/cuestionario/invitado' + qs);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar el cuestionario. Intente nuevamente');
  }
  return res.data;
}

/**
 * Registra el inicio en el backend (log CUESTIONARIO_INVITADO_INICIO).
 * No bloquea: si falla, solo se registra en consola.
 */
export async function registrarInicio(cuestionarioId) {
  try {
    await postJson('/cuestionario/invitado/inicio', { cuestionarioId });
  } catch (error) {
    void error;
  }
}

/**
 * Finaliza al 100%: valida en backend, calcula puntaje/nivel y registra el fin.
 * Devuelve { mensaje, cuestionarioId, puntaje, nivel, totalPreguntas, respondidas }.
 * Lanza Error con el mensaje exacto del backend (400/404).
 */
export async function finalizarCuestionarioBack(cuestionarioId, respuestas) {
  const res = await postJson('/cuestionario/invitado/finalizar', { cuestionarioId, respuestas });
  if (!res.ok) {
    throw new Error(res.error || 'Debes seleccionar una respuesta para continuar');
  }
  return res.data;
}

/**
 * Guarda las respuestas temporalmente en la sesión del invitado (PB-07).
 * sessionStorage dura lo que dura la sesión del navegador.
 */
export function guardarEncuestaTemporal(payload) {
  const datos = {
    ...payload,
    completado: true,
    fecha: new Date().toISOString()
  };
  sessionStorage.setItem(KEY_SESION, JSON.stringify(datos));
  return datos;
}

export function guardarNivel(nivel) {
  if (nivel) sessionStorage.setItem(KEY_NIVEL, JSON.stringify(nivel));
}

export function leerNivel() {
  try {
    const raw = sessionStorage.getItem(KEY_NIVEL);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

import { consentFuncional } from './consentService.js';

// --- Sesión del invitado (cookies): cuest_<id>=1 marca cuestionario hecho al 100% ---
// Solo se escriben con consentimiento funcional (ver Política de Cookies).
export function marcarHecho(id) {
  if (!consentFuncional()) return false;
  document.cookie = `cuest_${id}=1;max-age=31536000;path=/;SameSite=Lax`;
  return true;
}

export function getHechos() {
  return document.cookie.split(';').map((s) => s.trim())
    .filter((s) => s.startsWith('cuest_'))
    .map((s) => s.split('=')[0].replace('cuest_', ''))
    .filter((v) => /^\d+$/.test(v));
}

// --- Riesgo previo (cookies, sobreviven al cierre): riesgo_<id>=JSON{puntaje,nivel,alerta,explicacion} ---
// Solo se escriben con consentimiento funcional (ver Política de Cookies).
export function guardarRiesgo(id, resultado) {
  if (!consentFuncional()) return false;
  try {
    const payload = {
      puntaje: resultado.puntaje,
      nivel: resultado.nivel,
      alerta: !!(resultado.alerta && resultado.alerta.mostrar),
      explicacion: resultado.explicacion || ''
    };
    document.cookie = `riesgo_${id}=${encodeURIComponent(JSON.stringify(payload))};max-age=31536000;path=/;SameSite=Lax`;
    return true;
  } catch (_) { /* cookie llena o bloqueada: no rompe el flujo */ }
  return false;
}

export function leerRiesgos() {
  const out = [];
  document.cookie.split(';').map((s) => s.trim())
    .filter((s) => s.startsWith('riesgo_'))
    .forEach((s) => {
      const eq = s.indexOf('=');
      const id = s.slice('riesgo_'.length, eq < 0 ? undefined : eq);
      if (!/^\d+$/.test(id)) return;
      try {
        const data = JSON.parse(decodeURIComponent(eq < 0 ? '' : s.slice(eq + 1)));
        if (data && data.nivel) out.push({ cuestionarioId: Number(id), ...data });
      } catch (_) { /* cookie corrupta: se ignora */ }
    });
  return out.sort((a, b) => a.cuestionarioId - b.cuestionarioId);
}
