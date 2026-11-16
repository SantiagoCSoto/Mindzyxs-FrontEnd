import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as alertaRiesgoService from '../../js/services/alertaRiesgoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('alertaRiesgoService.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('registrarAccionAlerta', () => {
    it('registra acción en backend correctamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Alerta registrada con éxito' }
      });

      const res = await alertaRiesgoService.registrarAccionAlerta('lineas', 'cuestionario');
      expect(res.localOnly).toBe(false);
      expect(res.mensaje).toBe('Alerta registrada con éxito');
    });

    it('utiliza acción por defecto "vista" si no es válida', async () => {
      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Ok' }
      });

      await alertaRiesgoService.registrarAccionAlerta('invalida');
      expect(postSpy).toHaveBeenCalledWith('/riesgo/paciente/alerta', { accion: 'vista', origen: null });
    });

    it('guarda acción en sesión local en caso de error de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await alertaRiesgoService.registrarAccionAlerta('entendido');
      expect(res.localOnly).toBe(true);
      expect(sessionStorage.getItem('alerta_riesgo_accion')).toContain('entendido');
    });

    it('lanza error ante fallo del backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Sesión inválida'
      });

      await expect(alertaRiesgoService.registrarAccionAlerta('lineas')).rejects.toThrow('Sesión inválida');
    });
  });

  describe('obtenerLineasAyuda', () => {
    it('devuelve la lista de líneas', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, nombre: 'Línea de la vida', telefono: '123' }]
      });

      const res = await alertaRiesgoService.obtenerLineasAyuda();
      expect(res.length).toBe(1);
      expect(res[0].nombre).toBe('Línea de la vida');
    });

    it('lanza error si la petición falla', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false });
      await expect(alertaRiesgoService.obtenerLineasAyuda()).rejects.toThrow('No fue posible cargar las líneas de ayuda');
    });
  });
});
