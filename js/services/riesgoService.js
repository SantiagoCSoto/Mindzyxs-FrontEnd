/**
 * Servicio para el resultado del riesgo del invitado (PB-08 HU1-PB8).
 * Contrato real del backend (http://localhost:5015/api):
 *   POST /riesgo/invitado/calcular -> { cuestionarioId, respuestas: [{ preguntaId, opcionId }] }
 *   GET  /ayuda/lineas              -> líneas de ayuda activas
 */

import { getJson, postJson } from './apiClient.js';

/**
 * Calcula el nivel de riesgo desde las respuestas completas de la sesión.
 * Devuelve { nivel, puntaje, explicacion, alerta: { mostrar, mensaje },
 *   mostrarLineasAyuda, mostrarRecomendaciones, avisoObligatorio }.
 * Lanza Error con el mensaje exacto del backend (400/404).
 */
export async function calcularRiesgo(cuestionarioId, respuestas) {
  const res = await postJson('/riesgo/invitado/calcular', { cuestionarioId, respuestas });
  if (!res.ok) {
    throw new Error(res.error || 'No se encontraron respuestas para calcular el riesgo. Por favor responde el cuestionario nuevamente');
  }
  return res.data;
}

/**
 * Líneas de ayuda activas (botón/modal, resaltadas si el riesgo es Alto).
 */
export async function obtenerLineas() {
  const res = await getJson('/ayuda/lineas');
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar las líneas de ayuda. Intente nuevamente');
  }
  return res.data ?? [];
}
