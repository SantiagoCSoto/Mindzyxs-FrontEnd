import { describe, it, expect, beforeEach, vi } from 'vitest';
import { historialService } from '../../js/services/historialService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('historialService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('modoDemo', () => {
    it('detecta parámetro demo en la URL', () => {
      window.location.search = '?demo=1';
      expect(historialService.modoDemo()).toBe(true);

      window.location.search = '';
      expect(historialService.modoDemo()).toBe(false);
    });
  });

  describe('obtenerHistorial', () => {
    it('obtiene y normaliza lista de registros correctamente (pos, neu, low)', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { id: 1, fecha: '2026-03-01T10:00:00Z', tipo: 'RegistroEmocional', puntaje: 5 },
          { id: 2, fecha: '2026-03-02T10:00:00Z', tipo: 'RegistroEmocional', puntaje: 3 },
          { id: 3, fecha: '2026-03-03T10:00:00Z', tipo: 'RegistroEmocional', puntaje: 1 },
          { id: 4, fecha: '2026-03-04T10:00:00Z', tipo: 'Cuestionario', nivel: 'Bajo', cuestionario: 'PHQ-9' },
          { id: 5, fecha: '2026-03-05T10:00:00Z', tipo: 'Cuestionario', nivel: 'Moderado', cuestionario: 'GAD-7' },
          { id: 6, fecha: '2026-03-06T10:00:00Z', tipo: 'Cuestionario', nivel: 'Alto', cuestionario: 'Riesgo' }
        ]
      });

      const res = await historialService.obtenerHistorial();
      expect(res.exito).toBe(true);
      expect(res.total).toBe(6);
      expect(res.data[0].categoria).toBe('pos');
      expect(res.data[1].categoria).toBe('neu');
      expect(res.data[2].categoria).toBe('low');
      expect(res.data[3].categoria).toBe('pos');
      expect(res.data[4].categoria).toBe('neu');
      expect(res.data[5].categoria).toBe('low');
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

    it('retorna fallback si modo demo está activo con filtros de fecha', async () => {
      vi.spyOn(historialService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await historialService.obtenerHistorial('2026-09-01', '2026-09-02');
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
    });

    it('retorna error normal con y sin mensaje si no hay modo demo', async () => {
      vi.spyOn(historialService, 'modoDemo').mockReturnValue(false);
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error del servidor'
      }).mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: ''
      });

      const res1 = await historialService.obtenerHistorial();
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Error del servidor');

      const res2 = await historialService.obtenerHistorial();
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible cargar el historial.');
    });
  });

  describe('obtenerDetalle', () => {
    it('obtiene detalle de un registro exitosamente con campos PascalCase y observaciones', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          Id: 1,
          Tipo: 'Cuestionario',
          Puntaje: 3,
          Respuestas: [{ Pregunta: 'P1', Valor: 3, Texto: 'R1' }],
          Observaciones: [{ Contenido: 'Obs 1', Firma: 'Dr. Test', Fecha: '2026-03-01' }]
        }
      });

      const res = await historialService.obtenerDetalle(1);
      expect(res.exito).toBe(true);
      expect(res.data.id).toBe(1);
      expect(res.data.respuestas.length).toBe(1);
      expect(res.data.observaciones.length).toBe(1);
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

    it('retorna fallback en modo demo ante error de red o null si id no existe', async () => {
      vi.spyOn(historialService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await historialService.obtenerDetalle(1);
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);

      const resNo = await historialService.obtenerDetalle(9999);
      expect(resNo.exito).toBe(false);
    });
  });

  describe('normalizadores y formateadores', () => {
    it('formatea fechas y horas válidas e inválidas', () => {
      const formatted = historialService.formatearFecha('2026-03-01T12:00:00Z');
      expect(formatted).toBeDefined();

      const invalid = historialService.formatearFecha(null);
      expect(invalid).toBe('-');

      const horaValida = historialService.formatearHora('2026-03-01T12:30:00Z');
      expect(horaValida).toBeDefined();

      const horaInvalida = historialService.formatearHora(null);
      expect(horaInvalida).toBe('00:00');
    });
  });
});
