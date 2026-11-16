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

    it('debe mapear estructura anidada y mayúsculas en campos', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          cuestionarios: [{ Id: 10, Titulo: 'Cuestionario Mayus', Descripcion: 'Desc', Estado: 'Activo', NumPreguntas: 5, FechaCreacion: '2026-01-01' }]
        }
      });

      const res = await listarPredeterminados('');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(10);
      expect(res[0].titulo).toBe('Cuestionario Mayus');
    });

    it('debe manejar data vacía o nula retornando arreglo vacío', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const res = await listarPredeterminados();
      expect(res).toEqual([]);
    });

    it('debe lanzar error con mensaje por defecto si res.error es nulo', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      await expect(listarPredeterminados()).rejects.toThrow('No fue posible cargar los cuestionarios predeterminados');
    });
  });

  describe('obtenerPredeterminado', () => {
    it('debe obtener detalle del cuestionario con datos minúsculas', async () => {
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

    it('debe mapear detalle con campos en mayúsculas o data vacía', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          Id: 2,
          Titulo: 'Test',
          Descripcion: 'Desc',
          Estado: 'Borrador',
          UmbralBajoMax: 3,
          UmbralMedioMax: 8,
          Preguntas: [{ id: 1 }]
        }
      });

      const res = await obtenerPredeterminado(2);
      expect(res.id).toBe(2);
      expect(res.titulo).toBe('Test');
      expect(res.umbralBajoMax).toBe(3);
    });

    it('debe lanzar error con mensaje por defecto si res.error no viene', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: null
      });

      await expect(obtenerPredeterminado(99)).rejects.toThrow('No fue posible cargar el cuestionario');
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

    it('debe lanzar error con fallback si falla la creación', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: null
      });

      await expect(crearPredeterminado({})).rejects.toThrow('Debes completar todos los campos obligatorios');
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

    it('debe lanzar error si falla actualizacion sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      await expect(actualizarPredeterminado(2, {})).rejects.toThrow('Debes completar todos los campos obligatorios');
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

    it('debe lanzar error con mensaje de backend o fallback si falla', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No se puede desactivar'
      });

      await expect(desactivarPredeterminado(2)).rejects.toThrow('No se puede desactivar');

      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: ''
      });
      await expect(desactivarPredeterminado(2)).rejects.toThrow('Cuestionario predeterminado no encontrado.');
    });
  });
});
