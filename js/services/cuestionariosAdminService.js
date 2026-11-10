/**
 * Servicio de Cuestionarios Predeterminados del Administrador (PB-28 HU1-PB28).
 * Consume el backend en http://localhost:5015/api:
 *   GET    /admin/cuestionarios-predeterminados?q=         -> lista con búsqueda por título
 *   GET    /admin/cuestionarios-predeterminados/{id}       -> detalle editable (prellena el editor)
 *   POST   /admin/cuestionarios-predeterminados            -> crear (valida obligatorios) + log
 *   PUT    /admin/cuestionarios-predeterminados/{id}       -> editar + log
 *   POST   /admin/cuestionarios-predeterminados/{id}/desactivar -> desactivar (estado = Inactivo) + log
 * Todas requieren sesión Bearer del administrador.
 * Los cuestionarios se guardan con Tipo = "Predeterminado" (no requiere DDL nuevo).
 */

import { getJson, postJson, putJson } from './apiClient.js';

/**
 * Lista los cuestionarios predeterminados, recientes primero, filtrando por título con `q`.
 * Devuelve el arreglo normalizado: [{ id, titulo, descripcion, estado, numPreguntas, fechaCreacion }].
 * Lanza Error con el mensaje exacto del backend.
 */
export async function listarPredeterminados(q = '') {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await getJson('/admin/cuestionarios-predeterminados' + qs);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar los cuestionarios predeterminados. Intente nuevamente');
  }
  const lista = Array.isArray(res.data)
    ? res.data
    : (Array.isArray(res.data?.cuestionarios) ? res.data.cuestionarios : []);
  return lista.map((c) => ({
    id: c.id ?? c.Id,
    titulo: c.titulo ?? c.Titulo ?? '',
    descripcion: c.descripcion ?? c.Descripcion ?? '',
    estado: c.estado ?? c.Estado ?? '',
    numPreguntas: c.numPreguntas ?? c.NumPreguntas ?? 0,
    fechaCreacion: c.fechaCreacion ?? c.FechaCreacion ?? null
  }));
}

/**
 * Detalle editable de un cuestionario predeterminado: título, descripción, estado,
 * umbrales de riesgo y preguntas con sus ids (para mapear el guardado).
 * Lanza Error con el mensaje exacto del backend.
 */
export async function obtenerPredeterminado(id) {
  const res = await getJson(`/admin/cuestionarios-predeterminados/${id}`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar el cuestionario. Intente nuevamente');
  }
  const d = res.data || {};
  const umbrales = d.umbrales || {};
  return {
    id: d.id ?? d.Id,
    titulo: d.titulo ?? d.Titulo ?? '',
    descripcion: d.descripcion ?? d.Descripcion ?? '',
    estado: d.estado ?? d.Estado ?? '',
    umbralBajoMax: d.umbralBajoMax ?? d.UmbralBajoMax ?? umbrales.bajoMax ?? null,
    umbralMedioMax: d.umbralMedioMax ?? d.UmbralMedioMax ?? umbrales.medioMax ?? null,
    preguntas: Array.isArray(d.preguntas ?? d.Preguntas) ? (d.preguntas ?? d.Preguntas) : []
  };
}

/**
 * Crea un cuestionario predeterminado.
 * `payload`: { titulo, descripcion, publicar, umbrales:{bajoMax, medioMax}, preguntas[] }.
 * Devuelve { id, mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function crearPredeterminado(payload) {
  const res = await postJson('/admin/cuestionarios-predeterminados', payload);
  if (!res.ok) {
    throw new Error(res.error || 'Debes completar todos los campos obligatorios');
  }
  return {
    id: res.data?.id ?? res.data?.Id,
    mensaje: res.data?.mensaje || 'Cuestionario predeterminado guardado correctamente'
  };
}

/**
 * Edita un cuestionario predeterminado (permite agregar/eliminar preguntas y cambiar puntuaciones).
 * `payload`: igual que crear + `id` opcional por pregunta. Lanza Error con el mensaje exacto del backend.
 */
export async function actualizarPredeterminado(id, payload) {
  const res = await putJson(`/admin/cuestionarios-predeterminados/${id}`, payload);
  if (!res.ok) {
    throw new Error(res.error || 'Debes completar todos los campos obligatorios');
  }
  return {
    id: res.data?.id ?? res.data?.Id,
    mensaje: res.data?.mensaje || 'Cuestionario predeterminado guardado correctamente'
  };
}

/**
 * Desactiva un cuestionario predeterminado (estado = Inactivo; deja de aparecer en la asignación).
 * Devuelve { mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function desactivarPredeterminado(id) {
  const res = await postJson(`/admin/cuestionarios-predeterminados/${id}/desactivar`, {});
  if (!res.ok) {
    throw new Error(res.error || 'Cuestionario predeterminado no encontrado.');
  }
  return { mensaje: res.data?.mensaje || 'Cuestionario predeterminado desactivado correctamente' };
}
