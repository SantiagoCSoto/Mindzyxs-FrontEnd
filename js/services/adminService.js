/**
 * Servicio de administración de BD (PB-27)
 * Se comunica con los endpoints del backend en http://localhost:5015/api/admin/
 * Los endpoints requieren token de sesión de un rol Administrador.
 */

import { postJson, getJson, getBlob } from './apiClient.js';

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
  },

  /**
   * Descargar respaldo existente (GET /api/admin/backups/{id}/download)
   * Devuelve { exito, blob } o { exito:false, mensaje }.
   */
  async descargarRespaldo(idRespaldo, nombreArchivo) {
    const res = await getBlob(`/admin/backups/${idRespaldo}/download`);

    if (res.ok && res.blob) {
      return { exito: true, blob: res.blob, nombreArchivo };
    }
    return { exito: false, mensaje: res.error || 'No fue posible descargar el respaldo' };
  }
};