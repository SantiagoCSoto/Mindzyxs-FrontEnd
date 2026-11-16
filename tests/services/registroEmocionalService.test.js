import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as registroEmocionalService from '../../js/services/registroEmocionalService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('registroEmocionalService.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('registrarEstadoEmocional', () => {
    it('registra exitosamente en backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { idEvento: 10, puntaje: 4, nivel: 'Bien', nota: 'Buen día' }
      });

      const res = await registroEmocionalService.registrarEstadoEmocional(4, 'Buen día');
      expect(res.localOnly).toBe(false);
      expect(res.idEvento).toBe(10);
    });

    it('calcula y guarda localmente ante error de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await registroEmocionalService.registrarEstadoEmocional(2, 'Triste');
      expect(res.localOnly).toBe(true);
      expect(res.puntaje).toBe(2);
      expect(res.nivel).toBe('Bajo');
    });

    it('lanza error ante respuesta fallida del backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Puntaje fuera de rango'
      });

      await expect(registroEmocionalService.registrarEstadoEmocional(10)).rejects.toThrow('Puntaje fuera de rango');
    });
  });

  describe('obtenerUltimoRegistro', () => {
    it('obtiene el último registro de tipo RegistroEmocional', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { id: 1, tipo: 'Cuestionario' },
          { id: 2, tipo: 'RegistroEmocional', puntaje: 5 }
        ]
      });

      const res = await registroEmocionalService.obtenerUltimoRegistro();
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(2);
      expect(res.data.puntaje).toBe(5);
    });

    it('retorna null si no hay registros emocionales en la lista', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, tipo: 'Cuestionario' }]
      });

      const res = await registroEmocionalService.obtenerUltimoRegistro();
      expect(res.ok).toBe(true);
      expect(res.data).toBeNull();
    });

    it('recupera de sessionStorage ante error de red', async () => {
      registroEmocionalService.guardarUltimoLocal({ id: 99, puntaje: 4 });
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await registroEmocionalService.obtenerUltimoRegistro();
      expect(res.ok).toBe(true);
      expect(res.localOnly).toBe(true);
      expect(res.data.id).toBe(99);
    });

    it('maneja error cuando falla el backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Error de servidor'
      });

      const res = await registroEmocionalService.obtenerUltimoRegistro();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error de servidor');
    });
  });
});
