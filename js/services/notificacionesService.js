/**
 * Servicio para la configuración de notificaciones del sistema (PB-30 HU1-PB30).
 * Permite al Administrador gestionar las plantillas, canales de difusión y estado
 * de los eventos automáticos del sistema, así como previsualizar su renderizado.
 *
 * Endpoints (http://localhost:5015/api):
 * - GET  /admin/notificaciones
 * - GET  /admin/notificaciones/{tipo}
 * - PUT  /admin/notificaciones/{tipo}
 * - POST /admin/notificaciones/{tipo}/preview
 *
 * Requiere encabezado Bearer con token de Administrador.
 */

import { getJson, putJson, postJson } from './apiClient.js';

export const CANALES_DISPONIBLES = [
  { id: 'correo', etiqueta: 'Correo electrónico', icono: '✉️' },
  { id: 'sms', etiqueta: 'Mensaje de texto (SMS)', icono: '📱' },
  { id: 'interna', etiqueta: 'Notificación interna en plataforma', icono: '🔔' }
];

export const VARIABLES_DOCUMENTADAS = [
  { clave: '{nombre}', descripcion: 'Nombre del usuario destinatario' },
  { clave: '{codigo}', descripcion: 'Código de verificación o seguridad generado' },
  { clave: '{fecha}', descripcion: 'Fecha formateada del evento o solicitud' },
  { clave: '{motivo}', descripcion: 'Motivo u observaciones indicadas por el administrador' }
];

/**
 * Normaliza un objeto de notificación del backend.
 * @param {Object} item
 * @returns {Object}
 */
function normalizarNotificacion(item) {
  if (!item) return null;
  return {
    tipo: item.tipo ?? item.Tipo ?? '',
    nombre: item.nombre ?? item.Nombre ?? '',
    canales: Array.isArray(item.canales ?? item.Canales)
      ? (item.canales ?? item.Canales)
      : [],
    activo: Boolean(item.activo ?? item.Activo),
    asunto: item.asunto ?? item.Asunto ?? '',
    cuerpo: item.cuerpo ?? item.Cuerpo ?? ''
  };
}

/**
 * Consulta el catálogo de eventos de notificación configurables.
 * @returns {Promise<{ ok: boolean, data?: Array, error?: string, status?: number }>}
 */
export async function listarNotificaciones() {
  const res = await getJson('/admin/notificaciones');

  if (res.ok) {
    const lista = Array.isArray(res.data?.notificaciones)
      ? res.data.notificaciones
      : Array.isArray(res.data)
      ? res.data
      : [];

    return {
      ok: true,
      data: lista.map(normalizarNotificacion).filter(Boolean)
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cargar el catálogo de notificaciones.'
  };
}

/**
 * Consulta la configuración detallada de un evento de notificación.
 * @param {string} tipo Código identificador del evento (ej: CODE_SENT)
 * @returns {Promise<{ ok: boolean, data?: Object, error?: string, status?: number }>}
 */
export async function obtenerDetalleNotificacion(tipo) {
  if (!tipo) {
    return { ok: false, error: 'Identificador de evento no válido.' };
  }

  const res = await getJson(`/admin/notificaciones/${encodeURIComponent(tipo)}`);

  if (res.ok && res.data) {
    return {
      ok: true,
      data: normalizarNotificacion(res.data)
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible obtener el detalle de la notificación.'
  };
}

/**
 * Actualiza los canales, estado de activación, asunto y plantilla del evento.
 * @param {string} tipo Código identificador del evento
 * @param {Object} configuracion { canales: string[], activo: boolean, asunto: string, cuerpo: string }
 * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string, status?: number }>}
 */
export async function actualizarNotificacion(tipo, configuracion) {
  if (!tipo) {
    return { ok: false, error: 'Identificador de evento no válido.' };
  }

  const payload = {
    canales: Array.isArray(configuracion.canales) ? configuracion.canales : [],
    activo: Boolean(configuracion.activo),
    asunto: configuracion.asunto?.trim() || null,
    cuerpo: configuracion.cuerpo?.trim() || null
  };

  const res = await putJson(`/admin/notificaciones/${encodeURIComponent(tipo)}`, payload);

  if (res.ok) {
    return {
      ok: true,
      mensaje: res.data?.mensaje || 'Notificación actualizada correctamente.'
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible actualizar la configuración de la notificación.'
  };
}

/**
 * Genera una previsualización de la plantilla renderizada con variables de ejemplo.
 * @param {string} tipo Código del evento
 * @param {Object} variables { nombre?: string, codigo?: string, fecha?: string, motivo?: string }
 * @returns {Promise<{ ok: boolean, data?: Object, error?: string, status?: number }>}
 */
export async function obtenerPreviewNotificacion(tipo, variables = {}) {
  if (!tipo) {
    return { ok: false, error: 'Identificador de evento no válido.' };
  }

  const payload = {
    nombre: variables.nombre?.trim() || null,
    codigo: variables.codigo?.trim() || null,
    fecha: variables.fecha?.trim() || null,
    motivo: variables.motivo?.trim() || null
  };

  const res = await postJson(`/admin/notificaciones/${encodeURIComponent(tipo)}/preview`, payload);

  if (res.ok && res.data) {
    return {
      ok: true,
      data: normalizarNotificacion(res.data)
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible generar la previsualización.'
  };
}

export const notificacionesService = {
  CANALES_DISPONIBLES,
  VARIABLES_DOCUMENTADAS,
  listarNotificaciones,
  obtenerDetalleNotificacion,
  actualizarNotificacion,
  obtenerPreviewNotificacion
};
