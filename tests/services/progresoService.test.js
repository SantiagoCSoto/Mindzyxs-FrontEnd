import { describe, it, expect, beforeEach, vi } from 'vitest';
import { progresoService } from '../../js/services/progresoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('progresoService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerPacientesAutorizados', () => {
    it('obtiene lista de pacientes autorizados con éxito', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 5, nombre: 'Carlos Ruiz' }]
      });

      const res = await progresoService.obtenerPacientesAutorizados();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe(5);
    });

    it('maneja 401 sin sesión', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 401
      });

      const res = await progresoService.obtenerPacientesAutorizados();
      expect(res.exito).toBe(false);
      expect(res.noSesion).toBe(true);
    });

    it('retorna fallback en modo demo si falla la conexión', async () => {
      vi.spyOn(progresoService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await progresoService.obtenerPacientesAutorizados();
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('descargarReporte', () => {
    it('genera descarga cuando la respuesta es exitosa', async () => {
      const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: true,
        blob: mockBlob
      });

      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = vi.fn();

      const origCreate = globalThis.URL.createObjectURL;
      const origRevoke = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      globalThis.URL.revokeObjectURL = vi.fn();

      const res = await progresoService.descargarReporte(5, 'Carlos Ruiz');
      expect(res.exito).toBe(true);

      HTMLAnchorElement.prototype.click = origClick;
      globalThis.URL.createObjectURL = origCreate;
      globalThis.URL.revokeObjectURL = origRevoke;
    });

    it('maneja error al descargar reporte', async () => {
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: false,
        error: 'No se encontró el reporte'
      });

      const res = await progresoService.descargarReporte(99);
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('No se encontró el reporte');
    });
  });

  describe('obtenerProgresoPaciente', () => {
    it('obtiene y normaliza el progreso con datos válidos', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          promedio: 3.5,
          totalRegistros: 10,
          serie: [{ fecha: '2026-03-01', puntaje: 4 }]
        }
      });

      const res = await progresoService.obtenerProgresoPaciente(5, '2026-03-01', '2026-03-10');
      expect(res.exito).toBe(true);
      expect(res.data.promedio).toBeDefined();
      expect(res.data.serie.length).toBe(1);
    });

    it('detecta 403 Forbidden cuando el paciente no está autorizado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 403,
        error: 'No estás autorizado'
      });

      const res = await progresoService.obtenerProgresoPaciente(99);
      expect(res.exito).toBe(false);
      expect(res.noAutorizado).toBe(true);
      expect(res.status).toBe(403);
    });

    it('maneja 401 de sesión expirada', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 401
      });

      const res = await progresoService.obtenerProgresoPaciente(5);
      expect(res.exito).toBe(false);
      expect(res.noSesion).toBe(true);
    });

    it('utiliza fallback demo cuando falla la red', async () => {
      vi.spyOn(progresoService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await progresoService.obtenerProgresoPaciente(1);
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
    });
  });
});
