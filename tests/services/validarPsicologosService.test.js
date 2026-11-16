import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  validarPsicologosService,
  listarSolicitudesPendientes,
  obtenerDetalleSolicitud,
  descargarTarjetaProfesional,
  aprobarPsicologo,
  rechazarPsicologo
} from '../../js/services/validarPsicologosService.js';

describe('validarPsicologosService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listarSolicitudesPendientes', () => {
    it('debe listar psicologos pendientes', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          psicologos: [{ id: 5, nombre: 'Dr. Mendoza', correo: 'mendoza@test.com' }]
        }
      });

      const res = await listarSolicitudesPendientes();
      expect(res.ok).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].nombre).toBe('Dr. Mendoza');
    });

    it('debe manejar error al listar', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Error de servidor'
      });

      const res = await listarSolicitudesPendientes();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error de servidor');
    });
  });

  describe('obtenerDetalleSolicitud', () => {
    it('debe validar id de psicologo', async () => {
      const res = await obtenerDetalleSolicitud(null);
      expect(res.ok).toBe(false);
    });

    it('debe obtener detalle de la solicitud', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 5,
          nombre: 'Dr. Mendoza',
          correo: 'mendoza@test.com',
          especialidades: ['Clínica'],
          tieneTarjeta: true,
          estadoAprobacion: 'Pendiente'
        }
      });

      const res = await obtenerDetalleSolicitud(5);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(5);
      expect(res.data.tieneTarjeta).toBe(true);
    });

    it('debe manejar error al consultar detalle', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'No encontrado'
      });

      const res = await obtenerDetalleSolicitud(99);
      expect(res.ok).toBe(false);
    });
  });

  describe('descargarTarjetaProfesional', () => {
    it('debe validar id de psicologo', async () => {
      const res = await descargarTarjetaProfesional(null);
      expect(res.ok).toBe(false);
    });

    it('debe descargar archivo como blob', async () => {
      const mockBlob = new Blob(['pdf data'], { type: 'application/pdf' });
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: true,
        blob: mockBlob
      });

      const res = await descargarTarjetaProfesional(5);
      expect(res.ok).toBe(true);
      expect(res.blob).toBe(mockBlob);
    });

    it('debe manejar error al descargar tarjeta', async () => {
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: false,
        error: 'No existe archivo'
      });

      const res = await descargarTarjetaProfesional(5);
      expect(res.ok).toBe(false);
    });
  });

  describe('aprobarPsicologo', () => {
    it('debe validar id de psicologo', async () => {
      const res = await aprobarPsicologo(null);
      expect(res.ok).toBe(false);
    });

    it('debe aprobar al psicologo', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Aprobado correctamente' }
      });

      const res = await aprobarPsicologo(5);
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Aprobado correctamente');
    });

    it('debe manejar error al aprobar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Fallo al aprobar'
      });

      const res = await aprobarPsicologo(5);
      expect(res.ok).toBe(false);
    });
  });

  describe('rechazarPsicologo', () => {
    it('debe validar id de psicologo', async () => {
      const res = await rechazarPsicologo(null);
      expect(res.ok).toBe(false);
    });

    it('debe rechazar al psicologo con motivo', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Rechazado' }
      });

      const res = await rechazarPsicologo(5, 'Tarjeta ilegible');
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Rechazado');
    });

    it('debe manejar error al rechazar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No se pudo rechazar'
      });

      const res = await rechazarPsicologo(5, 'Motivo');
      expect(res.ok).toBe(false);
    });
  });
});
