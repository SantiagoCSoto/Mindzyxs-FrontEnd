import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  crearCuestionario,
  listarCuestionarios,
  obtenerDetalleCuestionario,
  despublicarCuestionario,
  actualizarCuestionario,
  eliminarCuestionario
} from '../../js/services/misCuestionariosService.js';

describe('misCuestionariosService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('crearCuestionario', () => {
    it('debe crear un cuestionario personalizado', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { id: 10, mensaje: 'Creado ok' }
      });

      const res = await crearCuestionario({ titulo: 'Mi Test' });
      expect(res.id).toBe(10);
      expect(res.mensaje).toBe('Creado ok');
    });

    it('debe lanzar error al fallar creacion', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Error de validación'
      });

      await expect(crearCuestionario({})).rejects.toThrow('Error de validación');
    });
  });

  describe('listarCuestionarios', () => {
    it('debe listar cuestionarios del psicologo', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 10, titulo: 'Mi Test', estado: 'Borrador' }]
      });

      const res = await listarCuestionarios('Mi');
      expect(res).toHaveLength(1);
      expect(res[0].titulo).toBe('Mi Test');
    });

    it('debe lanzar error si no se pueden listar', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'No autorizado'
      });

      await expect(listarCuestionarios()).rejects.toThrow('No autorizado');
    });
  });

  describe('obtenerDetalleCuestionario', () => {
    it('debe obtener el detalle del cuestionario', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 10, titulo: 'Mi Test', preguntas: [] }
      });

      const res = await obtenerDetalleCuestionario(10);
      expect(res.id).toBe(10);
    });

    it('debe lanzar error si falla consulta', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'No encontrado'
      });

      await expect(obtenerDetalleCuestionario(99)).rejects.toThrow('No encontrado');
    });
  });

  describe('despublicarCuestionario', () => {
    it('debe despublicar cuestionario', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Pasa a borrador' }
      });

      const res = await despublicarCuestionario(10);
      expect(res.mensaje).toBe('Pasa a borrador');
    });

    it('debe lanzar error al fallar despublicar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Ya es borrador'
      });

      await expect(despublicarCuestionario(10)).rejects.toThrow('Ya es borrador');
    });
  });

  describe('actualizarCuestionario', () => {
    it('debe actualizar cuestionario', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { id: 10, mensaje: 'Actualizado' }
      });

      const res = await actualizarCuestionario(10, { titulo: 'Actualizado' });
      expect(res.id).toBe(10);
      expect(res.mensaje).toBe('Actualizado');
    });

    it('debe lanzar error si falla actualización', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'Error al actualizar'
      });

      await expect(actualizarCuestionario(10, {})).rejects.toThrow('Error al actualizar');
    });
  });

  describe('eliminarCuestionario', () => {
    it('debe eliminar cuestionario', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Eliminado' }
      });

      const res = await eliminarCuestionario(10);
      expect(res.mensaje).toBe('Eliminado');
    });

    it('debe lanzar error si no se pudo eliminar', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValue({
        ok: false,
        error: 'No se puede eliminar'
      });

      await expect(eliminarCuestionario(10)).rejects.toThrow('No se puede eliminar');
    });
  });
});
