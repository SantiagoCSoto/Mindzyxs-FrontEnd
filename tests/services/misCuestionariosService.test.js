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
    it('debe crear un cuestionario personalizado con mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { id: 10, mensaje: 'Creado ok' }
      });

      const res = await crearCuestionario({ titulo: 'Mi Test' });
      expect(res.id).toBe(10);
      expect(res.mensaje).toBe('Creado ok');
    });

    it('debe usar mensaje por defecto al crear si data no tiene mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { id: 10 }
      });

      const res = await crearCuestionario({ titulo: 'Mi Test' });
      expect(res.mensaje).toBe('Cuestionario guardado correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar creacion', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error de validación'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(crearCuestionario({})).rejects.toThrow('Error de validación');
      await expect(crearCuestionario({})).rejects.toThrow('No fue posible crear el cuestionario');
    });
  });

  describe('listarCuestionarios', () => {
    it('debe listar cuestionarios del psicologo con parámetro q', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 10, titulo: 'Mi Test', estado: 'Borrador' }]
      });

      const res = await listarCuestionarios('Mi');
      expect(res).toHaveLength(1);
      expect(res[0].titulo).toBe('Mi Test');
    });

    it('debe retornar lista vacía si res.data no es un arreglo', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const res = await listarCuestionarios();
      expect(res).toEqual([]);
    });

    it('debe lanzar error con y sin mensaje de backend si no se pueden listar', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        error: 'No autorizado'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(listarCuestionarios()).rejects.toThrow('No autorizado');
      await expect(listarCuestionarios()).rejects.toThrow('No fue posible cargar tus cuestionarios. Intente nuevamente');
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

    it('debe lanzar error con y sin mensaje de backend si falla consulta', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        error: 'No encontrado'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(obtenerDetalleCuestionario(99)).rejects.toThrow('No encontrado');
      await expect(obtenerDetalleCuestionario(99)).rejects.toThrow('No fue posible cargar el cuestionario. Intente nuevamente');
    });
  });

  describe('despublicarCuestionario', () => {
    it('debe despublicar cuestionario con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Pasa a borrador' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await despublicarCuestionario(10);
      expect(res1.mensaje).toBe('Pasa a borrador');

      const res2 = await despublicarCuestionario(10);
      expect(res2.mensaje).toBe('El cuestionario ahora es un borrador');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar despublicar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Ya es borrador'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(despublicarCuestionario(10)).rejects.toThrow('Ya es borrador');
      await expect(despublicarCuestionario(10)).rejects.toThrow('No fue posible pasar el cuestionario a Borrador');
    });
  });

  describe('actualizarCuestionario', () => {
    it('debe actualizar cuestionario con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: true,
        data: { id: 10, mensaje: 'Actualizado ok' }
      }).mockResolvedValueOnce({
        ok: true,
        data: { id: 10 }
      });

      const res1 = await actualizarCuestionario(10, { titulo: 'Nuevo Título' });
      expect(res1.id).toBe(10);
      expect(res1.mensaje).toBe('Actualizado ok');

      const res2 = await actualizarCuestionario(10, {});
      expect(res2.mensaje).toBe('Cuestionario actualizado correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar actualizacion', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: false,
        error: 'Fallo al actualizar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(actualizarCuestionario(10, {})).rejects.toThrow('Fallo al actualizar');
      await expect(actualizarCuestionario(10, {})).rejects.toThrow('No fue posible actualizar el cuestionario');
    });
  });

  describe('eliminarCuestionario', () => {
    it('debe eliminar cuestionario con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Eliminado ok' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await eliminarCuestionario(10);
      expect(res1.mensaje).toBe('Eliminado ok');

      const res2 = await eliminarCuestionario(10);
      expect(res2.mensaje).toBe('Cuestionario eliminado correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar eliminacion', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValueOnce({
        ok: false,
        error: 'No se puede eliminar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(eliminarCuestionario(10)).rejects.toThrow('No se puede eliminar');
      await expect(eliminarCuestionario(10)).rejects.toThrow('No fue posible eliminar el cuestionario');
    });
  });
});
