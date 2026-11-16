import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  listarLineas,
  obtenerLinea,
  crearLinea,
  actualizarLinea,
  activarLinea,
  inactivarLinea,
  eliminarLinea
} from '../../js/services/lineasAyudaAdminService.js';

describe('lineasAyudaAdminService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listarLineas', () => {
    it('debe listar lineas de ayuda', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, nombre: 'Línea 106', telefono: '106', estado: 'Activa' }]
      });

      const res = await listarLineas('106');
      expect(res).toHaveLength(1);
      expect(res[0].nombre).toBe('Línea 106');
    });

    it('debe lanzar error al fallar listar', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Fallo al listar'
      });

      await expect(listarLineas()).rejects.toThrow('Fallo al listar');
    });
  });

  describe('obtenerLinea', () => {
    it('debe obtener detalle de una linea', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, nombre: 'Línea 106', telefono: '106', estado: 'Activa' }
      });

      const res = await obtenerLinea(1);
      expect(res.id).toBe(1);
      expect(res.nombre).toBe('Línea 106');
    });

    it('debe lanzar error si no existe la linea', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Línea de ayuda no encontrada.'
      });

      await expect(obtenerLinea(99)).rejects.toThrow('Línea de ayuda no encontrada.');
    });
  });

  describe('crearLinea', () => {
    it('debe crear una linea de ayuda', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { id: 2, mensaje: 'Creada' }
      });

      const res = await crearLinea({ nombre: 'Línea Calma', telefono: '018000' });
      expect(res.id).toBe(2);
      expect(res.mensaje).toBe('Creada');
    });

    it('debe lanzar error si faltan campos', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Debes ingresar nombre y al menos un medio de contacto'
      });

      await expect(crearLinea({})).rejects.toThrow('Debes ingresar nombre');
    });
  });

  describe('actualizarLinea', () => {
    it('debe actualizar una linea', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { id: 2, mensaje: 'Actualizada' }
      });

      const res = await actualizarLinea(2, { nombre: 'Línea Calma Editada' });
      expect(res.id).toBe(2);
      expect(res.mensaje).toBe('Actualizada');
    });

    it('debe lanzar error al fallar actualización', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'Fallo al actualizar'
      });

      await expect(actualizarLinea(2, {})).rejects.toThrow('Fallo al actualizar');
    });
  });

  describe('activar e inactivar linea', () => {
    it('debe activar una linea', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Activada' }
      });

      const res = await activarLinea(2);
      expect(res.mensaje).toBe('Activada');
    });

    it('debe inactivar una linea', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Inactivada' }
      });

      const res = await inactivarLinea(2);
      expect(res.mensaje).toBe('Inactivada');
    });

    it('debe lanzar error si activar falla', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No encontrada'
      });

      await expect(activarLinea(99)).rejects.toThrow('No encontrada');
    });
  });

  describe('eliminarLinea', () => {
    it('debe eliminar la linea', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Eliminada' }
      });

      const res = await eliminarLinea(2);
      expect(res.mensaje).toBe('Eliminada');
    });

    it('debe lanzar error al fallar eliminacion', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValue({
        ok: false,
        error: 'No se pudo eliminar'
      });

      await expect(eliminarLinea(99)).rejects.toThrow('No se pudo eliminar');
    });
  });
});
