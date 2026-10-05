/**
 * Servicio del perfil profesional del psicólogo (PB-24 HU1-PB24).
 * Consume el backend en http://localhost:5015/api:
 *   GET /psicologo/perfil-profesional     -> perfil profesional actual
 *   PUT /psicologo/perfil-profesional     -> actualiza perfil (especialidades por ids)
 *   GET /account/catalogos                -> catálogo de especialidades (id + nombre)
 * Requiere sesión Bearer del psicólogo activo y aprobado.
 */

import { getJson, putJson } from './apiClient.js';

/**
 * Perfil profesional actual.
 * Devuelve { id, nombre, correo, añosExperiencia, descripcionProfesional,
 * datosContacto, tarjetaProfesionalVerificada, especialidades, tieneTarjetaArchivo }.
 * Lanza Error con el mensaje exacto del backend.
 */
export async function obtenerPerfilProfesional() {
  const res = await getJson('/psicologo/perfil-profesional');
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar el perfil. Intente nuevamente');
  }
  return res.data;
}

/**
 * Catálogo de especialidades: [{ id, nombre }] normalizado desde GET /account/catalogos.
 * Lanza Error con el mensaje exacto del backend.
 */
export async function listarEspecialidades() {
  const res = await getJson('/account/catalogos');
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible cargar las especialidades. Intente nuevamente');
  }
  const raw = res.data?.especialidades || res.data?.Especialidades || [];
  return raw
    .map((e) => ({ id: e.id ?? e.Id, nombre: e.nombre || e.codigo || e.Nombre || e.Codigo || '' }))
    .filter((e) => e.id && e.nombre);
}

/**
 * Actualiza el perfil profesional.
 * `payload`: { añosExperiencia, descripcionProfesional?, datosContacto?,
 * especialidades (ids), correo? }. Lanza Error con el mensaje exacto del backend.
 */
export async function actualizarPerfilProfesional(payload) {
  const res = await putJson('/psicologo/perfil-profesional', payload);
  if (!res.ok) {
    throw new Error(res.error || 'No fue posible actualizar el perfil. Intente nuevamente');
  }
  return { mensaje: res.data?.mensaje || 'Información profesional actualizada correctamente' };
}