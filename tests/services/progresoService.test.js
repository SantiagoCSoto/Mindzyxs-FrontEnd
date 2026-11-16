import { describe, it, expect, beforeEach, vi } from 'vitest';
import { progresoService } from '../../js/services/progresoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('progresoService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('modoDemo', () => {
    it('detecta parámetro demo en la URL', () => {
      window.location.search = '?demo=1';
      expect(progresoService.modoDemo()).toBe(true);

      window.location.search = '';
      expect(progresoService.modoDemo()).toBe(false);
    });
  });

  describe('obtenerPacientesAutorizados', () => {
    it('obtiene lista de pacientes autorizados con éxito y mapea PascalCase', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ Id: 5, Nombre: 'Carlos Ruiz' }]
      });

      const res = await progresoService.obtenerPacientesAutorizados();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe(5);
      expect(res.data[0].nombre).toBe('Carlos Ruiz');
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

    it('maneja error con fallback si no es demo y falla la petición', async () => {
      vi.spyOn(progresoService, 'modoDemo').mockReturnValue(false);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await progresoService.obtenerPacientesAutorizados();
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('No fue posible cargar la lista de pacientes.');
    });
  });

  describe('descargarReporte', () => {
    it('genera descarga cuando la respuesta es exitosa con y sin nombre', async () => {
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

      const res1 = await progresoService.descargarReporte(5, 'Carlos Ruiz');
      expect(res1.exito).toBe(true);

      const res2 = await progresoService.descargarReporte(5, '');
      expect(res2.exito).toBe(true);

      HTMLAnchorElement.prototype.click = origClick;
      globalThis.URL.createObjectURL = origCreate;
      globalThis.URL.revokeObjectURL = origRevoke;
    });

    it('maneja error al descargar reporte con y sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'getBlob').mockResolvedValueOnce({
        ok: false,
        error: 'No se encontró el reporte'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await progresoService.descargarReporte(99);
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('No se encontró el reporte');

      const res2 = await progresoService.descargarReporte(99);
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible descargar el reporte');
    });
  });

  describe('obtenerProgresoPaciente', () => {
    it('obtiene y normaliza el progreso con datos válidos y PascalCase', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          Promedio: 3.5,
          Tendencia: 'Sube',
          TotalRegistros: 10,
          Serie: [{ Fecha: '2026-03-01T10:00:00', Puntaje: 4, Nivel: 'Bajo' }],
          PorSemana: [{ Semana: 'Semana 1', Registros: 3, Promedio: 3.0 }],
          Distribucion: { Bajo: 5 }
        }
      });

      const res = await progresoService.obtenerProgresoPaciente(5, '2026-03-01', '2026-03-10');
      expect(res.exito).toBe(true);
      expect(res.data.promedio).toBe('3.5');
      expect(res.data.tendencia).toBe('↗ Mejorando');
      expect(res.data.serie.length).toBe(1);
    });

    it('detecta 403 Forbidden cuando el paciente no está autorizado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        status: 403,
        error: 'No estás autorizado'
      }).mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'sin autorizacion previa'
      });

      const res1 = await progresoService.obtenerProgresoPaciente(99);
      expect(res1.exito).toBe(false);
      expect(res1.noAutorizado).toBe(true);
      expect(res1.status).toBe(403);

      const res2 = await progresoService.obtenerProgresoPaciente(99);
      expect(res2.noAutorizado).toBe(true);
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

    it('utiliza fallback demo cuando falla la red incluyendo paciente 99 no autorizado', async () => {
      vi.spyOn(progresoService, 'modoDemo').mockReturnValue(true);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const resCamila = await progresoService.obtenerProgresoPaciente(1);
      expect(resCamila.exito).toBe(true);
      expect(resCamila.fallback).toBe(true);

      const resJuan = await progresoService.obtenerProgresoPaciente(2, '2026-09-01', '2026-09-02');
      expect(resJuan.exito).toBe(true);

      const resNoAut = await progresoService.obtenerProgresoPaciente(99);
      expect(resNoAut.noAutorizado).toBe(true);
    });

    it('maneja error genérico sin demo', async () => {
      vi.spyOn(progresoService, 'modoDemo').mockReturnValue(false);
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await progresoService.obtenerProgresoPaciente(5);
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('Error al obtener el progreso del paciente.');
    });
  });

  describe('formatearTendencia y formatearFechaCorta', () => {
    it('formatearTendencia clasifica tendencias correctamente', () => {
      expect(progresoService.formatearTendencia('sube')).toBe('↗ Mejorando');
      expect(progresoService.formatearTendencia('baja')).toBe('↘ Bajando');
      expect(progresoService.formatearTendencia('estable')).toBe('→ Estable');
    });

    it('formatearFechaCorta formatea fecha ISO o maneja excepciones', () => {
      expect(progresoService.formatearFechaCorta('')).toBe('');
      expect(progresoService.formatearFechaCorta('2026-05-12T10:00:00')).toBe('12/05');
      expect(progresoService.formatearFechaCorta('fecha-rara')).toBe('fecha-rara');
    });
  });

  describe('obtenerProgresoFallback con pocos registros', () => {
    it('retorna no suficientes cuando hay menos de 2 registros', () => {
      const fb = progresoService.obtenerProgresoFallback(1, '2026-09-01', '2026-09-01');
      expect(fb.suficientes).toBe(false);
      expect(fb.promedio).toBeNull();
    });
  });
});
