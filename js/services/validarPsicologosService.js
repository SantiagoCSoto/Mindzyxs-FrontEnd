/**
 * Servicio para la validación y aprobación de psicólogos (PB-26 HU1-PB26).
 * Permite al Administrador consultar la cola de psicólogos pendientes de aprobación,
 * revisar el detalle de sus credenciales, descargar su tarjeta profesional en PDF,
 * y aprobar o rechazar su solicitud con notificación por correo.
 *
 * Endpoints (http://localhost:5015/api):
 * - GET  /admin/psicologos/pendientes
 * - GET  /admin/psicologos/{idPsicologo}/validacion
 * - GET  /admin/psicologos/{idPsicologo}/tarjeta
 * - POST /admin/psicologos/{idPsicologo}/aprobar
 * - POST /admin/psicologos/{idPsicologo}/rechazar
 *
 * Requiere encabezado Bearer con token de Administrador.
 */

import { getJson, postJson, getBlob } from './apiClient.js';

/**
 * Consulta la lista de psicólogos con solicitudes pendientes de validación.
 * @returns {Promise<{ ok: boolean, data?: Array, error?: string }>}
 */
export async function listarSolicitudesPendientes() {
  const res = await getJson('/admin/psicologos/pendientes');

  if (res.ok) {
    const lista = Array.isArray(res.data?.psicologos)
      ? res.data.psicologos
      : Array.isArray(res.data)
      ? res.data
      : [];

    return {
      ok: true,
      data: lista.map((p) => ({
        id: p.id ?? p.Id,
        nombre: p.nombre ?? p.Nombre ?? '',
        correo: p.correo ?? p.Correo ?? '',
        fechaSolicitud: p.fechaSolicitud ?? p.FechaSolicitud ?? null
      }))
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cargar las solicitudes de validación pendientes.'
  };
}

/**
 * Consulta el detalle completo de una solicitud de validación de psicólogo.
 * @param {number} idPsicologo
 * @returns {Promise<{ ok: boolean, data?: Object, error?: string }>}
 */
export async function obtenerDetalleSolicitud(idPsicologo) {
  if (!idPsicologo) {
    return { ok: false, error: 'Identificador de psicólogo no válido.' };
  }

  const res = await getJson(`/admin/psicologos/${idPsicologo}/validacion`);

  if (res.ok && res.data) {
    const d = res.data;
    return {
      ok: true,
      data: {
        id: d.id ?? d.Id,
        nombre: d.nombre ?? d.Nombre ?? '',
        correo: d.correo ?? d.Correo ?? '',
        fechaSolicitud: d.fechaSolicitud ?? d.FechaSolicitud ?? null,
        especialidades: Array.isArray(d.especialidades ?? d.Especialidades)
          ? (d.especialidades ?? d.Especialidades)
          : [],
        tieneTarjeta: Boolean(d.tieneTarjeta ?? d.TieneTarjeta),
        estadoAprobacion: d.estadoAprobacion ?? d.EstadoAprobacion ?? '',
        pendiente: Boolean(d.pendiente ?? d.Pendiente),
        aviso: d.aviso ?? d.Aviso ?? ''
      }
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cargar el detalle de la solicitud de validación.'
  };
}

/**
 * Descarga el archivo de tarjeta profesional del psicólogo como Blob.
 * @param {number} idPsicologo
 * @returns {Promise<{ ok: boolean, blob?: Blob, error?: string }>}
 */
export async function descargarTarjetaProfesional(idPsicologo) {
  if (!idPsicologo) {
    return { ok: false, error: 'Identificador de psicólogo no válido.' };
  }

  const res = await getBlob(`/admin/psicologos/${idPsicologo}/tarjeta`);

  if (res.ok && res.blob) {
    return {
      ok: true,
      blob: res.blob
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible obtener el archivo de tarjeta profesional.'
  };
}

/**
 * Aprueba la solicitud del psicólogo (cuenta Activa, estado Aprobado).
 * @param {number} idPsicologo
 * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
 */
export async function aprobarPsicologo(idPsicologo) {
  if (!idPsicologo) {
    return { ok: false, error: 'Identificador de psicólogo no válido.' };
  }

  const res = await postJson(`/admin/psicologos/${idPsicologo}/aprobar`, {});

  if (res.ok) {
    return {
      ok: true,
      mensaje: res.data?.mensaje || 'Psicólogo aprobado correctamente.'
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible aprobar la solicitud del psicólogo.'
  };
}

/**
 * Rechaza la solicitud del psicólogo con un motivo opcional.
 * @param {number} idPsicologo
 * @param {string|null} motivo
 * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
 */
export async function rechazarPsicologo(idPsicologo, motivo = '') {
  if (!idPsicologo) {
    return { ok: false, error: 'Identificador de psicólogo no válido.' };
  }

  const payload = {
    motivo: motivo && motivo.trim() ? motivo.trim() : null
  };

  const res = await postJson(`/admin/psicologos/${idPsicologo}/rechazar`, payload);

  if (res.ok) {
    return {
      ok: true,
      mensaje: res.data?.mensaje || 'Solicitud de psicólogo rechazada.'
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible rechazar la solicitud del psicólogo.'
  };
}

export const validarPsicologosService = {
  listarSolicitudesPendientes,
  obtenerDetalleSolicitud,
  descargarTarjetaProfesional,
  aprobarPsicologo,
  rechazarPsicologo
};
