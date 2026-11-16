import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordatorioService, DIAS_MAP, DIAS_REVERSE } from '../../js/services/recordatorioService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('recordatorioService.js', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('constantes y mapeos', () => {
    it('mapea correctamente días a texto y viceversa', () => {
      expect(DIAS_MAP[1]).toBe('Lun');
      expect(DIAS_MAP[7]).toBe('Dom');
      expect(DIAS_REVERSE['Lun']).toBe(1);
      expect(DIAS_REVERSE['Dom']).toBe(7);
    });
  });

  describe('obtenerConfiguracion', () => {
    it('obtiene configuración del backend y la guarda en storage', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          frecuencia: 'Diaria',
          hora: '09:00',
          activo: true
        }
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.data.hora).toBe('09:00');
      expect(res.noConfigurado).toBe(false);
    });

    it('maneja 204 No Content cuando no está configurado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        status: 204
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.noConfigurado).toBe(true);
      expect(res.data).toBeNull();
    });

    it('utiliza fallback desde storage ante desconexión', async () => {
      recordatorioService.guardarEnStorage({
        frecuencia: 'Semanal',
        hora: '10:00',
        dias: [1, 3],
        diasNombres: ['Lun', 'Mié'],
        activo: true
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.frecuencia).toBe('Semanal');
    });

    it('utiliza fallback demo sugerido si no hay nada en storage', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.frecuencia).toBe('Diaria');
    });
  });

  describe('guardarConfiguracion', () => {
    it('valida que existan frecuencia y hora', async () => {
      const res = await recordatorioService.guardarConfiguracion({});
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('Debes seleccionar');
    });

    it('valida que en frecuencia semanal se seleccione al menos un día', async () => {
      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Semanal',
        hora: '08:00',
        dias: []
      });
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('al menos un día');
    });

    it('guarda exitosamente en backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {
          mensaje: 'Configuración guardada'
        }
      });

      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Semanal',
        hora: '08:00',
        dias: ['Lun', 'Vie'],
        activo: true
      });
      expect(res.exito).toBe(true);
      expect(res.data.dias).toEqual([1, 5]);
    });

    it('aplica fallback local si la petición falla', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Diaria',
        hora: '14:00',
        activo: true
      });
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.hora).toBe('14:00');
    });
  });

  describe('obtenerAvisosHoy', () => {
    it('obtiene lista de avisos del backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ titulo: 'Aviso 1' }]
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
    });

    it('utiliza fallback local comprobando hora actual', async () => {
      recordatorioService.guardarEnStorage({
        frecuencia: 'Diaria',
        hora: '00:00',
        activo: true
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
    });
  });

  describe('formatearTextoResumen', () => {
    it('formatea resumen diario', () => {
      const texto = recordatorioService.formatearTextoResumen({
        frecuencia: 'Diaria',
        hora: '08:00',
        activo: true
      });
      expect(texto).toBe('Diaria 08:00 · Activa');
    });

    it('formatea resumen semanal con días', () => {
      const texto = recordatorioService.formatearTextoResumen({
        frecuencia: 'Semanal',
        hora: '10:00',
        diasNombres: ['Lun', 'Mié'],
        activo: false
      });
      expect(texto).toBe('Semanal 10:00 (Lun, Mié) · Desactivada');
    });

    it('retorna texto por defecto si es nulo', () => {
      expect(recordatorioService.formatearTextoResumen(null)).toBe('Sin configuración activa');
    });
  });
});
