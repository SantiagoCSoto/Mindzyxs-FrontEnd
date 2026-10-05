/**
 * Servicio de asignación de cuestionarios a pacientes (PB-22 HU1-PB22).
 * Consume el backend en http://localhost:5015/api:
 *   GET  /psicologo/cuestionarios/{id}/asignar -> pantalla: cuestionario + pacientes autorizados
 *   POST /psicologo/cuestionarios/{id}/asignar -> registra la asignación (solo Publicado)
 * Todas requieren sesión Bearer del psicólogo.
 * El listado de cuestionarios publicados usa `listarCuestionarios` (PB-21).
 */

import { getJson, postJson } from './apiClient.js';

/**
 * Pantalla de asignación: cuestionario + pacientes que autorizaron al psicólogo.
 * Devuelve { id, titulo, estado, pacientes:[{ id, nombre, yaAsignado }] }.
 * Lanza Error con el mensaje exacto del backend.
 */
export async function obtenerPantallaAsignacion(id) {
  const res = await getJson(`/psicologo/cuestionarios/${id}/asignar`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar la asignación. Intente nuevamente');
  }
  return res.data;
}

/**
 * Asigna el cuestionario a uno o varios pacientes autorizados.
 * `pacientesIds`: arreglo de ids. Devuelve { mensaje, asignados }.
 * Lanza Error con el mensaje exacto del backend.
 */
export async function asignarCuestionario(id, pacientesIds) {
  const res = await postJson(`/psicologo/cuestionarios/${id}/asignar`, { pacientesIds });
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible asignar el cuestionario. Intente nuevamente');
  }
  return { mensaje: res.data?.mensaje || 'Cuestionario asignado correctamente', asignados: res.data?.asignados ?? 0 };
}