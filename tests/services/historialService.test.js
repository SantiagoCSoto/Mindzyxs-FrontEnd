import { describe, it, expect, beforeEach, vi } from 'vitest';
import { historialService } from '../../js/services/historialService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('historialService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerHistorial', () => {
    it('obtiene y normaliza lista de registros correctamente', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          {
            id: 1,
            fecha: '2026-03-01T10:00:00Z',
            tipo: 'RegistroEmocional',
            puntaje: 4,
            nota: 'Día tranquilo'
          }
        ]
      });

      const res = await historialService.obtenerHistorial();
      expect(res.exito).toBe(true);
      expect(res.total).toBe(1);
      expect(res.data[0].id).toBe(1);
      expect(res.data[0].categoria).toBe('pos');
      expect(res.data[0].emoji).toBe('😊');
    });

    it('construye query string con parámetros de fecha desde y hasta', async () => {
      const getSpy = vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: []
      });

      await historialService.obtenerHistorial('2026-01-01', '2026-01-31');
      expect(getSpy).toHaveBeenCalledWith('/historial?desde=2026-01-01&hasta=2026-01-31');
    });

    it('maneja 401 sesión expirada', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 401
      });

      const res = await historialService.obtenerHistorial();
      expect(res.exito).toBe(false);
      expect(res.noSesion).toBe(true);
    });

    it('retorna fallback si modo demo está activo', async () => {
      vi.spyOn(historialService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await historialService.obtenerHistorial();
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    it('retorna error normal si no hay modo demo', async () => {
      vi.spyOn(historialService, 'modoDemo').mockReturnValue(false);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 500,
        error: 'Error del servidor'
      });

      const res = await historialService.obtenerHistorial();
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('Error del servidor');
    });
  });

  describe('obtenerDetalle', () => {
    it('obtiene detalle de un registro exitosamente', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 1,
          tipo: 'Cuestionario',
          puntaje: 3,
          respuestas: [{ pregunta: 'P1', respuesta: 'R1' }]
        }
      });

      const res = await historialService.obtenerDetalle(1);
      expect(res.exito).toBe(true);
      expect(res.data.id).toBe(1);
      expect(res.data.respuestas.length).toBe(1);
    });

    it('maneja 401 en detalle', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 401
      });

      const res = await historialService.obtenerDetalle(1);
      expect(res.exito).toBe(false);
      expect(res.noSesion).toBe(true);
    });

    it('retorna fallback en modo demo ante error de red', async () => {
      vi.spyOn(historialService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await historialService.obtenerDetalle(1);
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
    });
  });

  describe('normalizadores y formateadores', () => {
    it('formatea fechas válidas e inválidas', () => {
      const formatted = historialService.formatearFecha('2026-03-01T12:00:00Z');
      expect(formatted).toBeDefined();

      const invalid = historialService.formatearFecha(null);
      expect(invalid).toBe('-');
    });
  });
});
