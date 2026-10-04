/**
 * Servicio de registros de pacientes autorizados para el psicólogo (PB-18 HU1-PB18).
 * Permite listar pacientes autorizados, obtener el historial cronológico de registros
 * con filtros de fecha y consultar el detalle de un registro específico.
 *
 * Endpoints:
 * - GET /psicologo/pacientes?q=
 * - GET /psicologo/pacientes/{idPaciente}/registros?desde=&hasta=
 * - GET /psicologo/registros/{idEvento}
 */

import { getJson } from './apiClient.js';

export const psicologoRegistrosService = {
  /**
   * Obtiene la lista de pacientes que han autorizado al psicólogo autenticado.
   * @param {string} q Filtro opcional de búsqueda por nombre
   * @returns {Promise<{ ok: boolean, data?: Array, error?: string }>}
   */
  async obtenerPacientes(q = '') {
    const params = new URLSearchParams();
    if (q && q.trim()) {
      params.set('q', q.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await getJson(`/psicologo/pacientes${query}`);

    if (res.ok && Array.isArray(res.data)) {
      return {
        ok: true,
        data: res.data.map((p) => ({
          id: p.id ?? p.Id,
          nombre: p.nombre ?? p.Nombre ?? 'Paciente'
        }))
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible cargar los pacientes autorizados.'
    };
  },

  /**
   * Obtiene el historial de registros de un paciente autorizado.
   * @param {number} idPaciente
   * @param {string} [desde] Fecha de inicio (YYYY-MM-DD)
   * @param {string} [hasta] Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<{ ok: boolean, data?: Array, error?: string }>}
   */
  async obtenerRegistrosPaciente(idPaciente, desde = '', hasta = '') {
    if (!idPaciente) {
      return { ok: false, error: 'Identificador de paciente no válido.' };
    }

    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await getJson(`/psicologo/pacientes/${idPaciente}/registros${query}`);

    if (res.ok && Array.isArray(res.data)) {
      return {
        ok: true,
        data: res.data.map((r) => ({
          id: r.id ?? r.Id,
          fecha: r.fecha ?? r.Fecha,
          tipo: r.tipo ?? r.Tipo ?? 'RegistroEmocional',
          puntaje: r.puntaje ?? r.Puntaje ?? null,
          nivel: r.nivel ?? r.Nivel ?? null,
          cuestionario: r.cuestionario ?? r.Cuestionario ?? null,
          resumen: r.resumen ?? r.Resumen ?? ''
        }))
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible obtener los registros del paciente.'
    };
  },

  /**
   * Obtiene el detalle completo de un registro específico (nota, cuestionario, observaciones).
   * @param {number} idEvento
   * @returns {Promise<{ ok: boolean, data?: Object, error?: string }>}
   */
  async obtenerDetalleRegistro(idEvento) {
    if (!idEvento) {
      return { ok: false, error: 'Identificador de registro no válido.' };
    }

    const res = await getJson(`/psicologo/registros/${idEvento}`);

    if (res.ok && res.data) {
      const d = res.data;
      return {
        ok: true,
        data: {
          id: d.id ?? d.Id,
          fecha: d.fecha ?? d.Fecha,
          tipo: d.tipo ?? d.Tipo ?? 'RegistroEmocional',
          puntaje: d.puntaje ?? d.Puntaje ?? null,
          nivel: d.nivel ?? d.Nivel ?? null,
          cuestionario: d.cuestionario ?? d.Cuestionario ?? null,
          resumen: d.resumen ?? d.Resumen ?? '',
          nota: d.nota ?? d.Nota ?? '',
          respuestas: Array.isArray(d.respuestas ?? d.Respuestas)
            ? (d.respuestas ?? d.Respuestas)
            : [],
          observaciones: Array.isArray(d.observaciones ?? d.Observaciones)
            ? (d.observaciones ?? d.Observaciones)
            : []
        }
      };
    }

    return {
      ok: false,
      status: res.status,
      error: res.error || 'No fue posible cargar el detalle del registro.'
    };
  }
};
