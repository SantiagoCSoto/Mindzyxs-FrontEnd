/**
 * Servicio del directorio de psicólogos (solo pacientes).
 *   GET /psicologos -> [{ id, nombre, especialidades[], pacientesAsignados }]
 */

import { getJson, postJson } from './apiClient.js';

export async function obtenerDirectorio(q = '', idEspecialidad = null) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (idEspecialidad) params.set('idEspecialidad', idEspecialidad);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await getJson('/psicologos' + qs);

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

/**
 * Solicita chat a un psicólogo (doble vía). El psicólogo la acepta o rechaza.
 */
export async function solicitarChatPsicologo(idPsicologo) {
  const res = await postJson('/chat/solicitudes/paciente', { idPsicologo });
  if (!res.ok) throw new Error(res.error || 'No fue posible enviar la solicitud');
  return res.data;
}
