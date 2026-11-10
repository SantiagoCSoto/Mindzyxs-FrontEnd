/**
 * Servicio de observaciones clínicas del psicólogo (PB-19 HU1-PB19).
 * Permite registrar notas u observaciones asociadas a un paciente autorizado
 * o a un registro emocional específico, con firma y fecha automáticas por backend.
 *
 * Endpoint:
 * - POST /observaciones
 */

import { postJson } from './apiClient.js';

export const observacionesService = {
  /**
   * Guarda una nueva observación clínica para un paciente autorizado.
   * @param {Object} param0
   * @param {number} param0.idPaciente Identificador del paciente autorizado (obligatorio)
   * @param {number|null} [param0.idEvento] Identificador del registro específico (opcional)
   * @param {string} param0.contenido Texto de la observación clínica (obligatorio)
   * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
   */
  async crearObservacion({ idPaciente, idEvento = null, contenido }) {
    if (!idPaciente) {
      return { ok: false, error: 'Debe especificar el paciente autorizado.' };
    }

    const textoLimpio = String(contenido ?? '').trim();
    if (!textoLimpio) {
      return { ok: false, error: 'La observación es obligatoria.' };
    }

    const payload = {
      idPaciente: Number(idPaciente),
      idEvento: idEvento ? Number(idEvento) : null,
      contenido: textoLimpio
    };

    const res = await postJson('/observaciones', payload);

    if (res.ok) {
      return {
        ok: true,
        mensaje: res.data?.mensaje || 'Observación guardada correctamente'
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible guardar la observación clínica.'
    };
  }
};
