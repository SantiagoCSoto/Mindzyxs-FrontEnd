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
    it('debe listar psicologos pendientes con data.psicologos', async () => {
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

    it('debe listar psicologos cuando data es un arreglo directo y con claves mayúsculas', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ Id: 6, Nombre: 'Dra. Rios', Correo: 'rios@test.com', FechaSolicitud: '2026-02-01' }]
      });

      const res = await listarSolicitudesPendientes();
      expect(res.ok).toBe(true);
      expect(res.data[0].id).toBe(6);
      expect(res.data[0].nombre).toBe('Dra. Rios');
    });

    it('debe manejar data nula retornando arreglo vacío', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const res = await listarSolicitudesPendientes();
      expect(res.ok).toBe(true);
      expect(res.data).toEqual([]);
    });

    it('debe manejar error con mensaje por defecto si res.error es vacío', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await listarSolicitudesPendientes();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible cargar las solicitudes de validación pendientes.');
    });
  });

  describe('obtenerDetalleSolicitud', () => {
    it('debe validar id de psicologo', async () => {
      const res = await obtenerDetalleSolicitud(null);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de psicólogo no válido.');
    });

    it('debe obtener detalle de la solicitud en minúsculas', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 5,
          nombre: 'Dr. Mendoza',
          correo: 'mendoza@test.com',
          especialidades: ['Clínica'],
          tieneTarjeta: true,
          estadoAprobacion: 'Pendiente',
          pendiente: true,
          aviso: 'Validar TP'
        }
      });

      const res = await obtenerDetalleSolicitud(5);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(5);
      expect(res.data.especialidades).toHaveLength(1);
    });

    it('debe mapear detalle con campos en mayúsculas y especialidades nulas', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          Id: 6,
          Nombre: 'Dra. Ruiz',
          Correo: 'ruiz@test.com',
          FechaSolicitud: '2026-03-01',
          Especialidades: null,
          TieneTarjeta: 1,
          EstadoAprobacion: 'Aprobado',
          Pendiente: 0,
          Aviso: 'Ok'
        }
      });

      const res = await obtenerDetalleSolicitud(6);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(6);
      expect(res.data.nombre).toBe('Dra. Ruiz');
      expect(res.data.especialidades).toEqual([]);
      expect(res.data.tieneTarjeta).toBe(true);
    });

    it('debe manejar error al obtener detalle sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await obtenerDetalleSolicitud(99);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible cargar el detalle de la solicitud de validación.');
    });
  });

  describe('descargarTarjetaProfesional', () => {
    it('debe validar id de psicologo', async () => {
      const res = await descargarTarjetaProfesional(0);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de psicólogo no válido.');
    });

    it('debe descargar archivo si respuesta es exitosa', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: true,
        blob: mockBlob
      });

      const res = await descargarTarjetaProfesional(5);
      expect(res.ok).toBe(true);
      expect(res.blob).toBe(mockBlob);
    });

    it('debe manejar error de descarga con fallback', async () => {
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await descargarTarjetaProfesional(5);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible obtener el archivo de tarjeta profesional.');
    });
  });

  describe('aprobarPsicologo', () => {
    it('debe validar id de psicologo', async () => {
      const res = await aprobarPsicologo(null);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de psicólogo no válido.');
    });

    it('debe aprobar exitosamente con mensaje personalizado y con mensaje por defecto', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Aprobado con éxito' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await aprobarPsicologo(5);
      expect(res1.ok).toBe(true);
      expect(res1.mensaje).toBe('Aprobado con éxito');

      const res2 = await aprobarPsicologo(5);
      expect(res2.ok).toBe(true);
      expect(res2.mensaje).toBe('Psicólogo aprobado correctamente.');
    });

    it('debe manejar error al aprobar psicologo con fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await aprobarPsicologo(5);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible aprobar la solicitud del psicólogo.');
    });
  });

  describe('rechazarPsicologo', () => {
    it('debe validar id de psicologo', async () => {
      const res = await rechazarPsicologo(undefined);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de psicólogo no válido.');
    });

    it('debe rechazar psicologo con motivo y con mensaje por defecto', async () => {
      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Rechazado' }
      });

      const res = await rechazarPsicologo(5, 'Documentos incompletos');
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Rechazado');
      expect(postSpy).toHaveBeenCalledWith('/admin/psicologos/5/rechazar', {
        motivo: 'Documentos incompletos'
      });
    });

    it('debe rechazar psicologo sin motivo pasando null en payload', async () => {
      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const res = await rechazarPsicologo(5, '   ');
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Solicitud de psicólogo rechazada.');
      expect(postSpy).toHaveBeenCalledWith('/admin/psicologos/5/rechazar', {
        motivo: null
      });
    });

    it('debe manejar error al rechazar psicólogo con fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await rechazarPsicologo(5);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible rechazar la solicitud del psicólogo.');
    });
  });

  describe('validarPsicologosService objeto exportado', () => {
    it('debe contener todos los métodos exportados', () => {
      expect(validarPsicologosService.listarSolicitudesPendientes).toBe(listarSolicitudesPendientes);
      expect(validarPsicologosService.obtenerDetalleSolicitud).toBe(obtenerDetalleSolicitud);
      expect(validarPsicologosService.descargarTarjetaProfesional).toBe(descargarTarjetaProfesional);
      expect(validarPsicologosService.aprobarPsicologo).toBe(aprobarPsicologo);
      expect(validarPsicologosService.rechazarPsicologo).toBe(rechazarPsicologo);
    });
  });
});
