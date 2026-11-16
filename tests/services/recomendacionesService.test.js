import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as recomendacionesService from '../../js/services/recomendacionesService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('recomendacionesService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerRecomendaciones', () => {
    it('obtiene recomendaciones desde backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          recomendaciones: [{ id: 1, titulo: 'Respiración' }]
        }
      });

      const res = await recomendacionesService.obtenerRecomendaciones('Bajo');
      expect(res.ok).toBe(true);
      expect(res.data.recomendaciones.length).toBe(1);
    });

    it('devuelve demo local ante error de red', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recomendacionesService.obtenerRecomendaciones();
      expect(res.ok).toBe(true);
      expect(res.localOnly).toBe(true);
      expect(res.data.recomendaciones.length).toBeGreaterThan(0);
    });

    it('retorna error si backend responde con falla no red', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: false,
        error: 'Error del servidor'
      });

      const res = await recomendacionesService.obtenerRecomendaciones();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error del servidor');
    });
  });

  describe('obtenerRecomendacion por ID', () => {
    it('obtiene recomendación por id desde backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, titulo: 'Detalle respiración' }
      });

      const res = await recomendacionesService.obtenerRecomendacion(1);
      expect(res.ok).toBe(true);
      expect(res.data.titulo).toBe('Detalle respiración');
    });

    it('busca en lista demo si la petición falla pero el id existe', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recomendacionesService.obtenerRecomendacion(1);
      expect(res.ok).toBe(true);
      expect(res.localOnly).toBe(true);
      expect(res.data.id).toBe(1);
    });

    it('retorna error si id no existe en demo ni en backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recomendacionesService.obtenerRecomendacion(9999);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('no disponible');
    });
  });

  describe('obtenerAviso y registrarVisualizacion', () => {
    it('obtiene aviso legal/aclaratorio', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { titulo: 'Aviso Real' }
      });

      const res = await recomendacionesService.obtenerAviso();
      expect(res.ok).toBe(true);
      expect(res.data.titulo).toBe('Aviso Real');
    });

    it('obtiene aviso demo si falla petición', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false });

      const res = await recomendacionesService.obtenerAviso();
      expect(res.ok).toBe(true);
      expect(res.localOnly).toBe(true);
      expect(res.data.titulo).toBe('Mensaje aclaratorio');
    });

    it('registrarVisualizacion ejecuta post sin lanzar error', async () => {
      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });
      await recomendacionesService.registrarVisualizacion('cuestionario', 'Alto');
      expect(postSpy).toHaveBeenCalledWith('/aviso/visualizacion', { origen: 'cuestionario', resultado: 'Alto' });

      postSpy.mockRejectedValue(new Error('fail'));
      await expect(recomendacionesService.registrarVisualizacion('a', 'b')).resolves.not.toThrow();
    });
  });
});
