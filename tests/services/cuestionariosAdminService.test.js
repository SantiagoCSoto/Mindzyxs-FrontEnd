import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  listarPredeterminados,
  obtenerPredeterminado,
  crearPredeterminado,
  actualizarPredeterminado,
  desactivarPredeterminado
} from '../../js/services/cuestionariosAdminService.js';

describe('cuestionariosAdminService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listarPredeterminados', () => {
    it('debe listar cuestionarios predeterminados', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, titulo: 'GAD-7', estado: 'Publicado', numPreguntas: 7 }]
      });

      const res = await listarPredeterminados('GAD');
      expect(res).toHaveLength(1);
      expect(res[0].titulo).toBe('GAD-7');
    });

    it('debe lanzar error si falla la consulta', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Error de servidor'
      });

      await expect(listarPredeterminados()).rejects.toThrow('Error de servidor');
    });
  });

  describe('obtenerPredeterminado', () => {
    it('debe obtener detalle del cuestionario', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 1,
          titulo: 'GAD-7',
          umbrales: { bajoMax: 5, medioMax: 10 },
          preguntas: [{ id: 10, texto: 'Nervioso' }]
        }
      });

      const res = await obtenerPredeterminado(1);
      expect(res.id).toBe(1);
      expect(res.umbralBajoMax).toBe(5);
      expect(res.preguntas).toHaveLength(1);
    });

    it('debe lanzar error si no existe', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'No existe'
      });

      await expect(obtenerPredeterminado(99)).rejects.toThrow('No existe');
    });
  });

  describe('crearPredeterminado', () => {
    it('debe crear un nuevo cuestionario predeterminado', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { id: 2, mensaje: 'Guardado' }
      });

      const res = await crearPredeterminado({ titulo: 'PHQ-9' });
      expect(res.id).toBe(2);
      expect(res.mensaje).toBe('Guardado');
    });

    it('debe lanzar error si faltan campos obligatorios', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Debes ingresar título'
      });

      await expect(crearPredeterminado({})).rejects.toThrow('Debes ingresar título');
    });
  });

  describe('actualizarPredeterminado', () => {
    it('debe actualizar cuestionario existente', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { id: 2, mensaje: 'Actualizado' }
      });

      const res = await actualizarPredeterminado(2, { titulo: 'PHQ-9 Editado' });
      expect(res.id).toBe(2);
      expect(res.mensaje).toBe('Actualizado');
    });

    it('debe lanzar error si falla actualizacion', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'Error al actualizar'
      });

      await expect(actualizarPredeterminado(2, {})).rejects.toThrow('Error al actualizar');
    });
  });

  describe('desactivarPredeterminado', () => {
    it('debe desactivar cuestionario', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Desactivado' }
      });

      const res = await desactivarPredeterminado(2);
      expect(res.mensaje).toBe('Desactivado');
    });

    it('debe lanzar error si no se encuentra', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No encontrado'
      });

      await expect(desactivarPredeterminado(99)).rejects.toThrow('No encontrado');
    });
  });
});
