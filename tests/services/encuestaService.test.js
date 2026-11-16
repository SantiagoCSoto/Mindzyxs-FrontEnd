import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as encuestaService from '../../js/services/encuestaService.js';
import * as apiClient from '../../js/services/apiClient.js';
import * as consentService from '../../js/services/consentService.js';

describe('encuestaService.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.cookie = '';
    vi.restoreAllMocks();
  });

  describe('obtenerPendiente', () => {
    it('obtiene cuestionario pendiente sin excluidos', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, titulo: 'Inicial' }
      });

      const res = await encuestaService.obtenerPendiente([]);
      expect(res.id).toBe(1);
    });

    it('obtiene cuestionario con excluidos codificados en query string', async () => {
      const getSpy = vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 2, titulo: 'Siguiente' }
      });

      await encuestaService.obtenerPendiente([1, 3]);
      expect(getSpy).toHaveBeenCalledWith('/cuestionario/invitado?excluidos=1%2C3');
    });

    it('lanza error si la petición falla', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Error al cargar'
      });

      await expect(encuestaService.obtenerPendiente([])).rejects.toThrow('Error al cargar');
    });
  });

  describe('registrarInicio', () => {
    it('llama al backend y no lanza error ante fallo', async () => {
      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });
      await encuestaService.registrarInicio(5);
      expect(postSpy).toHaveBeenCalledWith('/cuestionario/invitado/inicio', { cuestionarioId: 5 });

      postSpy.mockRejectedValue(new Error('fail'));
      await expect(encuestaService.registrarInicio(5)).resolves.not.toThrow();
    });
  });

  describe('finalizarCuestionarioBack', () => {
    it('finaliza exitosamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { puntaje: 2, nivel: 'Bajo' }
      });

      const res = await encuestaService.finalizarCuestionarioBack(1, [{ preguntaId: 1, opcionId: 2 }]);
      expect(res.nivel).toBe('Bajo');
    });

    it('lanza error si backend responde error', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Selecciona una respuesta'
      });

      await expect(encuestaService.finalizarCuestionarioBack(1, [])).rejects.toThrow('Selecciona una respuesta');
    });
  });

  describe('guardar y leer nivel / encuesta temporal', () => {
    it('guarda encuesta temporal con fecha y estado completado', () => {
      const res = encuestaService.guardarEncuestaTemporal({ id: 1, respuestas: [] });
      expect(res.completado).toBe(true);
      expect(res.fecha).toBeDefined();
    });

    it('guarda y lee nivel', () => {
      encuestaService.guardarNivel({ puntaje: 3, nivel: 'Medio' });
      const nivel = encuestaService.leerNivel();
      expect(nivel.nivel).toBe('Medio');
    });

    it('retorna null si nivel está corrupto o vacío', () => {
      sessionStorage.setItem('encuesta_invitado_nivel', '{invalido');
      expect(encuestaService.leerNivel()).toBeNull();
    });
  });

  describe('cookies: marcarHecho, getHechos, guardarRiesgo, leerRiesgos', () => {
    it('no guarda cookies si no hay consentimiento funcional', () => {
      vi.spyOn(consentService, 'consentFuncional').mockReturnValue(false);

      const guardado = encuestaService.marcarHecho(1);
      expect(guardado).toBe(false);

      const riesgoGuardado = encuestaService.guardarRiesgo(1, { puntaje: 3, nivel: 'Medio' });
      expect(riesgoGuardado).toBe(false);
    });

    it('guarda cookies y las recupera cuando hay consentimiento', () => {
      vi.spyOn(consentService, 'consentFuncional').mockReturnValue(true);

      expect(encuestaService.marcarHecho(1)).toBe(true);
      expect(encuestaService.marcarHecho(2)).toBe(true);

      const hechos = encuestaService.getHechos();
      expect(hechos).toContain('1');
      expect(hechos).toContain('2');

      expect(encuestaService.guardarRiesgo(1, { puntaje: 2, nivel: 'Bajo', alerta: { mostrar: false }, explicacion: 'Tranquilo' })).toBe(true);
      const riesgos = encuestaService.leerRiesgos();
      expect(riesgos.length).toBeGreaterThan(0);
      expect(riesgos[0].nivel).toBe('Bajo');
    });
  });
});
