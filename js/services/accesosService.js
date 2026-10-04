/**
 * Servicio para la gestión de accesos de psicólogos (PB-17 HU1-PB17).
 * Permite a los pacientes listar psicólogos aprobados y autorizar o revocar
 * el acceso a su información emocional.
 *
 * Endpoints:
 * - GET  /accesos?q=
 * - POST /accesos/{idPsicologo}/autorizar
 * - POST /accesos/{idPsicologo}/revocar
 */

import { getJson, postJson } from './apiClient.js';

export const accesosService = {
  /**
   * Obtiene la lista de psicólogos aprobados y activos con el estado
   * de autorización respecto al paciente autenticado.
   * @param {string} q Filtro opcional por nombre o apellido
   * @returns {Promise<{ ok: boolean, data?: Array, error?: string }>}
   */
  async obtenerAccesos(q = '') {
    const params = new URLSearchParams();
    if (q && q.trim()) {
      params.set('q', q.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await getJson(`/accesos${query}`);

    if (res.ok && Array.isArray(res.data)) {
      return {
        ok: true,
        data: res.data.map((p) => ({
          idPsicologo: p.idPsicologo ?? p.IdPsicologo,
          nombre: p.nombre ?? p.Nombre ?? 'Psicólogo',
          especialidades: Array.isArray(p.especialidades ?? p.Especialidades)
            ? (p.especialidades ?? p.Especialidades)
            : [],
          autorizado: Boolean(p.autorizado ?? p.Autorizado)
        }))
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible cargar la lista de accesos.'
    };
  },

  /**
   * Autoriza el acceso de un psicólogo a la información emocional del paciente.
   * @param {number} idPsicologo
   * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
   */
  async autorizarAcceso(idPsicologo) {
    if (!idPsicologo) {
      return { ok: false, error: 'Identificador de psicólogo no válido.' };
    }

    const res = await postJson(`/accesos/${idPsicologo}/autorizar`, {});
    if (res.ok) {
      return {
        ok: true,
        mensaje: res.data?.mensaje || 'Acceso autorizado correctamente'
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible autorizar el acceso.'
    };
  },

  /**
   * Revoca el acceso previamente otorgado a un psicólogo.
   * @param {number} idPsicologo
   * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
   */
  async revocarAcceso(idPsicologo) {
    if (!idPsicologo) {
      return { ok: false, error: 'Identificador de psicólogo no válido.' };
    }

    const res = await postJson(`/accesos/${idPsicologo}/revocar`, {});
    if (res.ok) {
      return {
        ok: true,
        mensaje: res.data?.mensaje || 'Acceso revocado correctamente'
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible revocar el acceso.'
    };
  }
};
