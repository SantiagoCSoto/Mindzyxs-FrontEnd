/**
 * Servicio de estadísticas de pacientes autorizados (PB-23 HU1-PB23).
 * Consume el backend en http://localhost:5015/api:
 *   GET /progreso/pacientes                 -> pacientes autorizados (selector)
 *   GET /progreso/{idPaciente}?desde=&hasta= -> estadísticas completas
 * Reutiliza los mismos endpoints de PB-14 (ProgresoController).
 * Requiere sesión Bearer del psicólogo.
 */

import { getJson } from './apiClient.js';

/**
 * Lista los pacientes que autorizaron al psicólogo (selector de estadísticas).
 * Devuelve [{ id, nombre }]. Lanza Error con el mensaje exacto del backend.
 */
export async function listarPacientesAutorizados() {
  const res = await getJson('/progreso/pacientes');
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar tus pacientes. Intente nuevamente');
  }
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Estadísticas de un paciente autorizado en el rango de fechas.
 * `desde`/`hasta` en formato aaaa-MM-dd (opcional).
 * Devuelve { promedio, tendencia, totalRegistros, distribucion, porSemana,
 * porMes, nivelFrecuente, suficientes }. Lanza Error con el mensaje exacto.
 */
export async function obtenerEstadisticas(idPaciente, desde = '', hasta = '') {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await getJson(`/progreso/${idPaciente}${qs}`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar las estadísticas. Intente nuevamente');
  }
  return res.data;
}