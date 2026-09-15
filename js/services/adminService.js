/**
 * Servicio de administración de BD (PB-27)
 * Se comunica con los endpoints del backend en http://localhost:5015/api/admin/
 * Los endpoints requieren token de sesión de un rol Administrador.
 */

import { postJson, postFormData, getJson } from './apiClient.js';

export const adminService = {
  /**
   * Crear respaldo local (POST /api/admin/backup)
   */
  async crearRespaldo() {
    const res = await postJson('/admin/backup', {});

    if (res.ok && res.data) {
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Respaldo creado correctamente',
        respaldo: res.data.respaldo || null
      };
    }
    if (!res.ok && !res.isNetworkError) {
      return { exito: false, mensaje: res.error || 'No fue posible crear el respaldo. Intente nuevamente' };
    }
    return { exito: false, mensaje: 'No fue posible conectar con el servidor backend.' };
  },

  /**
   * Restaurar respaldo desde archivo (POST /api/admin/restore, multipart/form-data)
   */
  async restaurarRespaldo(archivo) {
    if (!archivo) {
      return { exito: false, mensaje: 'Debes seleccionar un archivo de respaldo (.backup) antes de restaurar' };
    }

    const fd = new FormData();
    fd.append('archivo', archivo, archivo.name);

    const res = await postFormData('/admin/restore', fd);

    if (res.ok && res.data) {
      return { exito: true, mensaje: res.data.mensaje || 'Respaldo restaurado correctamente' };
    }
    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        mensaje: res.error || 'No fue posible restaurar el respaldo. Verifique el archivo e intente nuevamente'
      };
    }
    return { exito: false, mensaje: 'No fue posible conectar con el servidor backend.' };
  },

  /**
   * Listar respaldos existentes (GET /api/admin/backups)
   */
  async listarRespaldos() {
    const res = await getJson('/admin/backups');

    if (res.ok && res.data) {
      return { exito: true, respaldos: res.data.respaldos || [] };
    }
    if (!res.ok && !res.isNetworkError) {
      return { exito: false, mensaje: res.error || 'No fue posible consultar los respaldos. Intente nuevamente' };
    }
    return { exito: false, mensaje: 'No fue posible conectar con el servidor backend.' };
  },

  /**
   * Ejecutar mantenimiento (POST /api/admin/maintenance)
   */
  async ejecutarMantenimiento() {
    const res = await postJson('/admin/maintenance', {});

    if (res.ok && res.data) {
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Mantenimiento completado',
        detalle: res.data.detalle || null
      };
    }
    if (!res.ok && !res.isNetworkError) {
      return { exito: false, mensaje: res.error || 'No fue posible ejecutar el mantenimiento. Intente nuevamente' };
    }
    return { exito: false, mensaje: 'No fue posible conectar con el servidor backend.' };
  }
};