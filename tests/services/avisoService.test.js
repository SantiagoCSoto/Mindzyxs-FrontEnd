import { describe, it, expect, beforeEach, vi } from 'vitest';
import { avisoService, TEXTO_AVISO_DEFAULT } from '../../js/services/avisoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('avisoService.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('obtenerAviso', () => {
    it('retorna error simulado si simularError es true', async () => {
      const res = await avisoService.obtenerAviso(true);
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('No fue posible cargar');
    });

    it('retorna datos del backend si la respuesta es exitosa', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          titulo: 'Aviso personalizado',
          texto: 'Texto del aviso'
        }
      });

      const res = await avisoService.obtenerAviso();
      expect(res.exito).toBe(true);
      expect(res.titulo).toBe('Aviso personalizado');
      expect(res.texto).toBe('Texto del aviso');
    });

    it('utiliza título default si backend devuelve título vacío', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          titulo: null,
          texto: null
        }
      });

      const res = await avisoService.obtenerAviso();
      expect(res.exito).toBe(true);
      expect(res.titulo).toBe(TEXTO_AVISO_DEFAULT.titulo);
      expect(res.texto).toBe('');
    });

    it('retorna fallback offline si el backend falla o no devuelve data', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false
      });

      const res = await avisoService.obtenerAviso();
      expect(res.exito).toBe(true);
      expect(res.offline).toBe(true);
      expect(res.titulo).toBe(TEXTO_AVISO_DEFAULT.titulo);
    });
  });

  describe('registrarVisualizacion', () => {
    it('envía origen y resultado al backend y retorna true si ok', async () => {
      const spyPost = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });

      const ok = await avisoService.registrarVisualizacion('auto:inicio', 'ok');
      expect(ok).toBe(true);
      expect(spyPost).toHaveBeenCalledWith('/aviso/visualizacion', {
        origen: 'auto:inicio',
        resultado: 'ok'
      });
    });

    it('retorna false si postJson lanza error', async () => {
      vi.spyOn(apiClient, 'postJson').mockRejectedValue(new Error('Network error'));

      const ok = await avisoService.registrarVisualizacion();
      expect(ok).toBe(false);
    });
  });

  describe('estado de aceptación en sesión', () => {
    it('comprueba y guarda aceptación de aviso en sessionStorage', () => {
      expect(avisoService.haAceptadoAviso()).toBe(false);

      avisoService.marcarAvisoAceptado();
      expect(avisoService.haAceptadoAviso()).toBe(true);

      avisoService.resetearAviso();
      expect(avisoService.haAceptadoAviso()).toBe(false);
    });
  });
});
