/**
 * Servicio de la alerta de riesgo alto del paciente (PB-16 HU1-PB16).
 * Consume el backend en http://localhost:5015/api:
 *   POST /riesgo/paciente/alerta  -> registra en logs la alerta (vista) y la acción
 *                                    elegida (lineas/recomendaciones/entendido)
 *   GET  /ayuda/lineas            -> líneas de ayuda activas para el modal
 * Si el backend no está disponible, devuelve un resultado local de respaldo
 * (modalidad localOnly) para no romper el flujo de la vista.
 */

import { getJson, postJson } from './apiClient.js';

const KEY_ALERTA_LOCAL = 'alerta_riesgo_accion';

export const ACCIONES = ['vista', 'lineas', 'recomendaciones', 'entendido'];

/**
 * Registra una acción sobre la alerta de riesgo alto (POST /api/riesgo/paciente/alerta).
 * "vista" registra la generación/visualización; lineas/recomendaciones/entendido
 * la acción elegida (origen opcional: cuestionario/registro). El backend exige
 * sesión de paciente (401 "Sesión requerida").
 * Devuelve { mensaje, localOnly } o lanza Error con el mensaje exacto del backend.
 * Sin conexión, guarda la acción localmente (localOnly: true) para modo demostración.
 */
export async function registrarAccionAlerta(accion, origen) {
  const acc = ACCIONES.includes(accion) ? accion : 'vista';
  const res = await postJson('/riesgo/paciente/alerta', { accion: acc, origen: origen || null });

  if (res.ok && res.data) {
    return { mensaje: res.data.mensaje || 'Alerta registrada', localOnly: false };
  }

  if (res.isNetworkError) {
    guardarLocal({ accion: acc, origen: origen || null, fecha: new Date().toISOString() });
    return { mensaje: 'Sin conexión con el servidor — acción registrada localmente', localOnly: true };
  }

  throw new Error(res.error || 'Debes seleccionar una opción de la alerta de riesgo');
}

/**
 * Obtiene las líneas de ayuda activas (GET /api/ayuda/lineas).
 * Devuelve un arreglo con { id, nombre, telefono, url, horario, cobertura, ... }.
 * Lanza Error con el mensaje exacto del backend.
 */
export async function obtenerLineasAyuda() {
  const res = await getJson('/ayuda/lineas');
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar las líneas de ayuda. Intente nuevamente');
  }
  return res.data ?? [];
}

/**
 * Guarda la última acción de la alerta local (solo modo sin conexión).
 */
function guardarLocal(item) {
  try {
    sessionStorage.setItem(KEY_ALERTA_LOCAL, JSON.stringify(item));
  } catch (error) {
    void error;
  }
}