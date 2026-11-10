/**
 * Servicio para la gestión de usuarios del sistema (PB-25 HU1-PB25).
 * Permite al Administrador consultar, filtrar, editar datos, modificar estado
 * y forzar el restablecimiento de contraseña de cuentas de usuario.
 *
 * Endpoints (http://localhost:5015/api):
 * - GET  /admin/usuarios?q=&rol=&estado=
 * - GET  /admin/usuarios/{idUsuario}
 * - PUT  /admin/usuarios/{idUsuario}
 * - PUT  /admin/usuarios/{idUsuario}/estado
 * - POST /admin/usuarios/{idUsuario}/reset-password
 *
 * Requiere encabezado Bearer con token de Administrador.
 */

import { getJson, putJson, postJson } from './apiClient.js';

/**
 * Consulta la lista de usuarios del sistema con filtros opcionales.
 * @param {Object} filtros { q?: string, rol?: string, estado?: string }
 * @returns {Promise<{ ok: boolean, data?: Array, error?: string }>}
 */
export async function listarUsuarios(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.q && filtros.q.trim()) {
    params.set('q', filtros.q.trim());
  }
  if (filtros.rol && filtros.rol.trim()) {
    params.set('rol', filtros.rol.trim());
  }
  if (filtros.estado && filtros.estado.trim()) {
    params.set('estado', filtros.estado.trim());
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await getJson(`/admin/usuarios${query}`);

  if (res.ok) {
    const lista = Array.isArray(res.data?.usuarios)
      ? res.data.usuarios
      : Array.isArray(res.data)
      ? res.data
      : [];

    return {
      ok: true,
      data: lista.map((u) => ({
        id: u.id ?? u.Id,
        nombre: u.nombre ?? u.Nombre ?? '',
        correo: u.correo ?? u.Correo ?? '',
        rol: u.rol ?? u.Rol ?? '',
        estado: u.estado ?? u.Estado ?? '',
        aprobacion: u.aprobacion ?? u.Aprobacion ?? null,
        fechaRegistro: u.fechaRegistro ?? u.FechaRegistro ?? null
      }))
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cargar la lista de usuarios.'
  };
}

/**
 * Consulta el detalle completo de un usuario específico.
 * @param {number} idUsuario
 * @returns {Promise<{ ok: boolean, data?: Object, error?: string }>}
 */
export async function obtenerDetalleUsuario(idUsuario) {
  if (!idUsuario) {
    return { ok: false, error: 'Identificador de usuario no válido.' };
  }

  const res = await getJson(`/admin/usuarios/${idUsuario}`);

  if (res.ok && res.data) {
    const u = res.data;
    return {
      ok: true,
      data: {
        id: u.id ?? u.Id,
        nombre: u.nombre ?? u.Nombre ?? '',
        correo: u.correo ?? u.Correo ?? '',
        rol: u.rol ?? u.Rol ?? '',
        estado: u.estado ?? u.Estado ?? '',
        aprobacion: u.aprobacion ?? u.Aprobacion ?? null,
        fechaRegistro: u.fechaRegistro ?? u.FechaRegistro ?? null,
        nombres: u.nombres ?? u.Nombres ?? '',
        apellidos: u.apellidos ?? u.Apellidos ?? '',
        fechaNacimiento: u.fechaNacimiento ?? u.FechaNacimiento ?? null,
        genero: u.genero ?? u.Genero ?? null
      }
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cargar el detalle del usuario.'
  };
}

/**
 * Actualiza los datos básicos de un usuario (nombres, apellidos, correo, fechaNacimiento, idGenero).
 * @param {number} idUsuario
 * @param {Object} datos
 * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
 */
export async function actualizarUsuario(idUsuario, datos) {
  if (!idUsuario) {
    return { ok: false, error: 'Identificador de usuario no válido.' };
  }

  const res = await putJson(`/admin/usuarios/${idUsuario}`, datos);

  if (res.ok) {
    return {
      ok: true,
      mensaje: res.data?.mensaje || 'Cambios guardados correctamente.'
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible actualizar los datos del usuario.'
  };
}

/**
 * Actualiza el estado de la cuenta del usuario (Activa, Suspendida, Inactiva, etc.).
 * @param {number} idUsuario
 * @param {string} nuevoEstado
 * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
 */
export async function cambiarEstadoUsuario(idUsuario, nuevoEstado) {
  if (!idUsuario) {
    return { ok: false, error: 'Identificador de usuario no válido.' };
  }
  if (!nuevoEstado || !nuevoEstado.trim()) {
    return { ok: false, error: 'El nuevo estado es obligatorio.' };
  }

  const res = await putJson(`/admin/usuarios/${idUsuario}/estado`, {
    nuevoEstado: nuevoEstado.trim()
  });

  if (res.ok) {
    return {
      ok: true,
      mensaje: res.data?.mensaje || 'Estado actualizado correctamente.'
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cambiar el estado del usuario.'
  };
}

/**
 * Fuerza el envío de un código de restablecimiento de contraseña al correo del usuario.
 * @param {number} idUsuario
 * @returns {Promise<{ ok: boolean, mensaje?: string, error?: string }>}
 */
export async function forzarRestablecimientoPassword(idUsuario) {
  if (!idUsuario) {
    return { ok: false, error: 'Identificador de usuario no válido.' };
  }

  const res = await postJson(`/admin/usuarios/${idUsuario}/reset-password`, {});

  if (res.ok) {
    return {
      ok: true,
      mensaje: res.data?.mensaje || 'Se envió un código de restablecimiento al correo del usuario.'
    };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible forzar el restablecimiento de contraseña.'
  };
}

export const gestionUsuariosService = {
  listarUsuarios,
  obtenerDetalleUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  forzarRestablecimientoPassword
};
