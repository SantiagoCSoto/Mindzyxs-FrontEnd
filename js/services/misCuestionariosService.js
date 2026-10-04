/**
 * Servicio de la gestión de cuestionarios del psicólogo (PB-21 HU1-PB21).
 * Consume el backend en http://localhost:5015/api:
 *   GET    /psicologo/cuestionarios?q=            -> mis cuestionarios (Borrador/Publicado) con búsqueda
 *   GET    /psicologo/cuestionarios/{id}          -> detalle editable (preguntas/opciones con ids)
 *   POST   /psicologo/cuestionarios/{id}/despublicar -> confirma: Publicado -> Borrador (habilita el editor)
 *   PUT    /psicologo/cuestionarios/{id}          -> guarda edición (Borrador o Publicado)
 *   DELETE /psicologo/cuestionarios/{id}?confirmar=true -> elimina (baja lógica + observaciones)
 * Todas requieren sesión Bearer del psicólogo.
 */

import { getJson, postJson, putJson, deleteJson } from './apiClient.js';

/**
 * Lista "Mis cuestionarios" del psicólogo (Borrador/Publicado), recientes primero.
 * `q` filtra por título. Devuelve el arreglo ya normalizado:
 * [{ id, titulo, descripcion, estado, numPreguntas, fechaCreacion }].
 * Lanza Error con el mensaje exacto del backend.
 */
export async function listarCuestionarios(q = '') {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await getJson('/psicologo/cuestionarios' + qs);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar tus cuestionarios. Intente nuevamente');
  }
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Detalle editable de un cuestionario propio: título, descripción, estado,
 * umbrales y preguntas con sus ids (para mapear el guardado).
 * Lanza Error con el mensaje exacto del backend.
 */
export async function obtenerDetalleCuestionario(id) {
  const res = await getJson(`/psicologo/cuestionarios/${id}`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar el cuestionario. Intente nuevamente');
  }
  return res.data;
}

/**
 * Confirma la edición de un cuestionario Publicado: lo pasa a Borrador.
 * Devuelve { mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function despublicarCuestionario(id) {
  const res = await postJson(`/psicologo/cuestionarios/${id}/despublicar`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible pasar el cuestionario a Borrador');
  }
  return { mensaje: res.data?.mensaje || 'El cuestionario ahora es un borrador' };
}

/**
 * Guarda la edición del cuestionario (Borrador o Publicado).
 * `payload`: { titulo, descripcion, publicar, umbrales?, preguntas[] }.
 * Devuelve { id, mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function actualizarCuestionario(id, payload) {
  const res = await putJson(`/psicologo/cuestionarios/${id}`, payload);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible actualizar el cuestionario');
  }
  return { id: res.data?.id, mensaje: res.data?.mensaje || 'Cuestionario actualizado correctamente' };
}

/**
 * Elimina el cuestionario con confirmación extra (?confirmar=true).
 * Devuelve { mensaje }. Lanza Error con el mensaje exacto del backend.
 */
export async function eliminarCuestionario(id) {
  const res = await deleteJson(`/psicologo/cuestionarios/${id}?confirmar=true`);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible eliminar el cuestionario');
  }
  return { mensaje: res.data?.mensaje || 'Cuestionario eliminado correctamente' };
}