/**
 * Servicio del directorio de psicólogos (solo pacientes).
 *   GET /psicologos -> [{ id, nombre, especialidades[], pacientesAsignados }]
 */

import { getJson } from './apiClient.js';

export async function obtenerDirectorio() {
  const res = await getJson('/psicologos');

  if (res.ok && res.data) {
    const lista = Array.isArray(res.data) ? res.data : [];
    return {
      ok: true,
      data: lista.map((p) => ({
        id: p.id ?? p.Id,
        nombre: p.nombre ?? p.Nombre ?? 'Psicólogo',
        especialidades: p.especialidades ?? p.Especialidades ?? [],
        pacientesAsignados: p.pacientesAsignados ?? p.PacientesAsignados ?? 0
      }))
    };
  }

  return { ok: false, status: res.status, error: res.error || 'No fue posible cargar el directorio.' };
}
