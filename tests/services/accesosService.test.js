import { describe, it, expect, beforeEach, vi } from 'vitest';
import { accesosService } from '../../js/services/accesosService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('accesosService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerAccesos', () => {
    it('obtiene lista de accesos con estado de autorización', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { idPsicologo: 1, nombre: 'Dr. Lopez', autorizado: true }
        ]
      });

      const res = await accesosService.obtenerAccesos('lopez');
      expect(res.ok).toBe(true);
      expect(res.data[0].autorizado).toBe(true);
    });

    it('maneja error cuando falla la petición', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false, error: 'Error al cargar' });
      const res = await accesosService.obtenerAccesos();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error al cargar');
    });
  });

  describe('autorizarAcceso y revocarAcceso', () => {
    it('valida idPsicologo inválido', async () => {
      expect((await accesosService.autorizarAcceso(null)).ok).toBe(false);
      expect((await accesosService.revocarAcceso(null)).ok).toBe(false);
    });

    it('autoriza y revoca acceso exitosamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Ok' }
      });

      const aut = await accesosService.autorizarAcceso(5);
      expect(aut.ok).toBe(true);

      const rev = await accesosService.revocarAcceso(5);
      expect(rev.ok).toBe(true);
    });

    it('maneja respuesta de error en autorizar y revocar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No se pudo'
      });

      expect((await accesosService.autorizarAcceso(5)).ok).toBe(false);
      expect((await accesosService.revocarAcceso(5)).ok).toBe(false);
    });
  });
});
