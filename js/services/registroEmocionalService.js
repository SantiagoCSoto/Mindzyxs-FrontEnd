/**
 * Servicio del registro del estado emocional del paciente (PB-12 HU1-PB12).
 * Consume el backend en http://localhost:5015/api:
 *   POST /historial   -> guarda el estado emocional (escala 1-5 + nota opcional)
 *   GET  /historial   -> historial reciente del paciente (para "Último registro", PB-13)
 * Si el backend no está disponible, devuelve un resultado local de respaldo
 * (modalidad localOnly) para no romper el flujo de la vista.
 */

import { getJson, postJson } from './apiClient.js';

const KEY_ULTIMO_LOCAL = 'registro_emocional_ultimo';

export const ETIQUETAS = { 1: 'Muy mal', 2: 'Mal', 3: 'Regular', 4: 'Bien', 5: 'Excelente' };

/**
 * Guarda el estado emocional del paciente en el backend (POST /api/historial).
 * Sin escala o con escala inválida, el backend responde 400 con
 * "Debes seleccionar un estado emocional para guardar" (no guarda).
 * Devuelve { mensaje, idEvento, fecha, puntaje, nivel, nota } o lanza Error con
 * el mensaje exacto del backend. Sin conexión, devuelve un resultado local
 * (localOnly: true) para modo demostración.
 */
export async function registrarEstadoEmocional(puntaje, nota) {
  const res = await postJson('/historial', { puntaje, nota: nota || null });

  if (res.ok && res.data) {
    return { ...res.data, localOnly: false };
  }

  if (res.isNetworkError) {
    const local = calcularLocal(puntaje, nota);
    return { ...local, localOnly: true };
  }

  throw new Error(res.error || 'Debes seleccionar un estado emocional para guardar');
}

/**
 * Obtiene el historial emocional reciente del paciente (GET /api/historial).
 * Devuelve { ok, data } con la lista (recientes primero), o { ok: false, error }
 * ante error del backend. Sin conexión, devuelve el último registro guardado
 * localmente (si hay).
 */
export async function obtenerUltimoRegistro() {
  const res = await getJson('/historial');

  if (res.ok && Array.isArray(res.data)) {
    const emocionales = res.data.filter((i) => i.tipo === 'RegistroEmocional');
    return { ok: true, data: emocionales[0] || null };
  }

  if (res.isNetworkError) {
    return { ok: true, localOnly: true, data: leerUltimoLocal() };
  }

  return {
    ok: false,
    error: res.error || 'No fue posible cargar tu historial.'
  };
}

/**
 * Calcula el resultado local (puntaje 1-5 con su etiqueta y nivel derivado
 * 1-2 Bajo, 3 Medio, 4-5 Alto) cuando el backend no está disponible.
 * Refleja la regla del backend (PB-07/PB-11/PB-12).
 */
function calcularLocal(puntaje, nota) {
  return {
    mensaje: 'Registro guardado correctamente',
    idEvento: null,
    fecha: new Date().toISOString(),
    puntaje,
    nivel: puntaje <= 2 ? 'Bajo' : puntaje === 3 ? 'Medio' : 'Alto',
    nota: nota || ''
  };
}

/**
 * Guarda el último registro local (solo modo sin conexión).
 */
export function guardarUltimoLocal(item) {
  try {
    sessionStorage.setItem(KEY_ULTIMO_LOCAL, JSON.stringify(item));
  } catch (error) {
    void error;
  }
}

function leerUltimoLocal() {
  try {
    const raw = sessionStorage.getItem(KEY_ULTIMO_LOCAL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    void error;
    return null;
  }
}