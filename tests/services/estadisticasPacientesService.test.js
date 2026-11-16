import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as estadisticasPacientesService from '../../js/services/estadisticasPacientesService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('estadisticasPacientesService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listarPacientesAutorizados', () => {
    it('lista pacientes exitosamente', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, nombre: 'Paciente 1' }]
      });

      const res = await estadisticasPacientesService.listarPacientesAutorizados();
      expect(res.length).toBe(1);
      expect(res[0].nombre).toBe('Paciente 1');
    });

    it('lanza error ante fallo', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false, error: 'Falla' });
      await expect(estadisticasPacientesService.listarPacientesAutorizados()).rejects.toThrow('Falla');
    });
  });

  describe('descargarReporte', () => {
    it('descarga reporte blob exitosamente', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({ ok: true, blob: mockBlob });

      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = vi.fn();
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      globalThis.URL.revokeObjectURL = vi.fn();

      const res = await estadisticasPacientesService.descargarReporte(1, 'Paciente 1');
      expect(res.exito).toBe(true);

      HTMLAnchorElement.prototype.click = origClick;
    });

    it('maneja error al descargar reporte', async () => {
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({ ok: false, error: 'No encontrado' });
      const res = await estadisticasPacientesService.descargarReporte(99);
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('No encontrado');
    });
  });

  describe('obtenerEstadisticas', () => {
    it('obtiene estadísticas de un paciente', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { promedio: 4.0, totalRegistros: 10 }
      });

      const res = await estadisticasPacientesService.obtenerEstadisticas(1, '2026-01-01', '2026-01-31');
      expect(res.promedio).toBe(4.0);
    });

    it('lanza error ante fallo', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false });
      await expect(estadisticasPacientesService.obtenerEstadisticas(1)).rejects.toThrow('No fue posible cargar las estadísticas');
    });
  });
});
