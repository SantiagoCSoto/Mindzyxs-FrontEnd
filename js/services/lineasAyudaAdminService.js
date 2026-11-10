/**
 * Servicio de Líneas de Ayuda del Administrador (PB-29 HU1-PB29).
 * Consume el backend en http://localhost:5015/api:
 *   GET    /admin/lineas-ayuda?q=            -> lista (todas, con búsqueda por nombre)
 *   GET    /admin/lineas-ayuda/{id}          -> detalle editable (prellena la pantalla Editar)
 *   POST   /admin/lineas-ayuda               -> crear (estado inicial Activa) + log LINEA_AYUDA_CREADA
 *   PUT    /admin/lineas-ayuda/{id}          -> editar (valida obligatorios) + log LINEA_AYUDA_EDITADA
 *   POST   /admin/lineas-ayuda/{id}/activar  -> estado Activa + log LINEA_AYUDA_ACTIVADA
 *   POST   /admin/lineas-ayuda/{id}/inactivar-> estado Inactiva + log LINEA_AYUDA_INACTIVADA
 *   DELETE /admin/lineas-ayuda/{id}          -> borrado lógico (estado Eliminada) + log LINEA_AYUDA_ELIMINADA
 * Todas requieren sesión Bearer del administrador.
 */

import { getJson, postJson, putJson, deleteJson } from './apiClient.js';

/**
 * Lista todas las líneas de ayuda (cualquier estado), ordenadas por id, filtrando por nombre con `q`.
 * Devuelve el arreglo normalizado: [{ id, nombre, telefono, url, estado }].
 * Lanza Error con el mensaje exacto del backend.
 */
export async function listarLineas(q = '') {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await getJson('/admin/lineas-ayuda' + qs);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar las líneas de ayuda. Intente nuevamente');
  }
  const lista = Array.isArray(res.data)
    ? res.data
    : (Array.isArray(res.data?.lineas) ? res.data.lineas : []);
  return lista.map((l) => ({
    id: l.id ?? l.Id,
    nombre: l.nombre ?? l.Nombre ?? '',
    telefono: l.telefono ?? l.Telefono ?? '',
    url: l.url ?? l.Url ?? '',
    estado: l.estado ?? l.Estado ?? ''
  }));
}

/**
 * Detalle editable de una línea de ayuda (todos los campos para prellenar la pantalla Editar).
 * Lanza Error con el mensaje exacto del backend (incluido "Línea de ayuda no encontrada.").
 */
export async function obtenerLinea(id) {
  const res = await getJson(`/admin/lineas-ayuda/${id}`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar la línea de ayuda. Intente nuevamente');
  }
  const d = res.data || {};
  return {
    id: d.id ?? d.Id,
    nombre: d.nombre ?? d.Nombre ?? '',
    descripcion: d.descripcion ?? d.Descripcion ?? '',
    telefono: d.telefono ?? d.Telefono ?? '',
    url: d.url ?? d.Url ?? '',
    horario: d.horario ?? d.Horario ?? '',
    cobertura: d.cobertura ?? d.Cobertura ?? '',
    descripcionCorta: d.descripcionCorta ?? d.DescripcionCorta ?? '',
    whatsapp: d.whatsapp ?? d.Whatsapp ?? '',
    email: d.email ?? d.Email ?? '',
    chatUrl: d.chatUrl ?? d.ChatUrl ?? '',
    videollamada: d.videollamada ?? d.Videollamada ?? '',
    tipoAtencion: d.tipoAtencion ?? d.TipoAtencion ?? '',
    departamento: d.departamento ?? d.Departamento ?? '',
    municipio: d.municipio ?? d.Municipio ?? '',
    poblacion: d.poblacion ?? d.Poblacion ?? '',
    fuente: d.fuente ?? d.Fuente ?? '',
    fechaVerificacion: d.fechaVerificacion ?? d.FechaVerificacion ?? '',
    estado: d.estado ?? d.Estado ?? ''
  };
}

/**
 * Crea una línea de ayuda (estado inicial Activa).
 * `payload`: { nombre, descripcion, telefono, url, horario, cobertura, descripcionCorta,
 *              whatsapp, email, chatUrl, videollamada, tipoAtencion, departamento, municipio,
 *              poblacion, fuente, fechaVerificacion }.
 * Devuelve { id, mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function crearLinea(payload) {
  const res = await postJson('/admin/lineas-ayuda', payload);
  if (!res.ok) {
    throw new Error(res.error || 'Debes ingresar nombre y al menos un medio de contacto (teléfono o URL)');
  }
  return {
    id: res.data?.id ?? res.data?.Id,
    mensaje: res.data?.mensaje || 'Línea de ayuda creada correctamente'
  };
}

/**
 * Edita una línea de ayuda existente.
 * `payload`: igual que crear. Devuelve { id, mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function actualizarLinea(id, payload) {
  const res = await putJson(`/admin/lineas-ayuda/${id}`, payload);
  if (!res.ok) {
    throw new Error(res.error || 'Debes ingresar nombre y al menos un medio de contacto (teléfono o URL)');
  }
  return {
    id: res.data?.id ?? res.data?.Id,
    mensaje: res.data?.mensaje || 'Línea de ayuda actualizada correctamente'
  };
}

/**
 * Activa una línea de ayuda (estado = Activa; vuelve a ser visible a los usuarios).
 * Devuelve { mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function activarLinea(id) {
  const res = await postJson(`/admin/lineas-ayuda/${id}/activar`, {});
  if (!res.ok) {
    throw new Error(res.error || 'Línea de ayuda no encontrada.');
  }
  return { mensaje: res.data?.mensaje || 'Línea de ayuda activada correctamente' };
}

/**
 * Inactiva una línea de ayuda (estado = Inactiva; deja de ser visible a los usuarios).
 * Devuelve { mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function inactivarLinea(id) {
  const res = await postJson(`/admin/lineas-ayuda/${id}/inactivar`, {});
  if (!res.ok) {
    throw new Error(res.error || 'Línea de ayuda no encontrada.');
  }
  return { mensaje: res.data?.mensaje || 'Línea de ayuda inactivada correctamente' };
}

/**
 * Elimina una línea de ayuda (borrado lógico: estado = Eliminada).
 * Devuelve { mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function eliminarLinea(id) {
  const res = await deleteJson(`/admin/lineas-ayuda/${id}`);
  if (!res.ok) {
    throw new Error(res.error || 'Línea de ayuda no encontrada.');
  }
  return { mensaje: res.data?.mensaje || 'Línea de ayuda eliminada correctamente' };
}
