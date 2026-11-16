import { describe, it, expect, beforeEach, vi } from 'vitest';
import { accesosService } from '../../js/services/accesosService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('accesosService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerAccesos', () => {
    it('obtiene lista de accesos con estado de autorización y mapea PascalCase y fallbacks', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { IdPsicologo: 1, Nombre: null, Especialidades: null, Autorizado: 1 }
        ]
      });

      const res = await accesosService.obtenerAccesos('lopez');
      expect(res.ok).toBe(true);
      expect(res.data[0].idPsicologo).toBe(1);
      expect(res.data[0].nombre).toBe('Psicólogo');
      expect(res.data[0].especialidades).toEqual([]);
      expect(res.data[0].autorizado).toBe(true);
    });

    it('maneja error cuando falla la petición con y sin mensaje de error', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false, error: 'Error al cargar' });
      const res = await accesosService.obtenerAccesos();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error al cargar');

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false, error: '' });
      const resDefault = await accesosService.obtenerAccesos('');
      expect(resDefault.ok).toBe(false);
      expect(resDefault.error).toBe('No fue posible cargar la lista de accesos.');
    });
  });

  describe('autorizarAcceso y revocarAcceso', () => {
    it('valida idPsicologo inválido', async () => {
      expect((await accesosService.autorizarAcceso(null)).ok).toBe(false);
      expect((await accesosService.revocarAcceso(null)).ok).toBe(false);
    });

    it('autoriza y revoca acceso exitosamente con y sin mensaje retornado', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Ok' }
      });

      const aut = await accesosService.autorizarAcceso(5);
      expect(aut.ok).toBe(true);
      expect(aut.mensaje).toBe('Ok');

      const rev = await accesosService.revocarAcceso(5);
      expect(rev.ok).toBe(true);
      expect(rev.mensaje).toBe('Ok');

      // Sin mensaje en data
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const autDef = await accesosService.autorizarAcceso(5);
      expect(autDef.mensaje).toBe('Acceso autorizado correctamente');

      const revDef = await accesosService.revocarAcceso(5);
      expect(revDef.mensaje).toBe('Acceso revocado correctamente');
    });

    it('maneja respuesta de error en autorizar y revocar con y sin mensaje de error', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No se pudo'
      });

      expect((await accesosService.autorizarAcceso(5)).ok).toBe(false);
      expect((await accesosService.revocarAcceso(5)).ok).toBe(false);

      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const errAut = await accesosService.autorizarAcceso(5);
      expect(errAut.error).toBe('No fue posible autorizar el acceso.');

      const errRev = await accesosService.revocarAcceso(5);
      expect(errRev.error).toBe('No fue posible revocar el acceso.');
    });
  });
});
