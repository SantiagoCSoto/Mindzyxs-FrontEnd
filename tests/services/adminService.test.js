import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import { adminService } from '../../js/services/adminService.js';

describe('adminService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('crearRespaldo', () => {
    it('debe devolver exito cuando se crea el respaldo', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Backup creado', respaldo: { id: 1, archivo: 'backup.sql' } }
      });

      const res = await adminService.crearRespaldo();
      expect(res.exito).toBe(true);
      expect(res.mensaje).toBe('Backup creado');
      expect(res.respaldo.id).toBe(1);
    });

    it('debe usar valores por defecto si data viene vacía', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {}
      });

      const res = await adminService.crearRespaldo();
      expect(res.exito).toBe(true);
      expect(res.mensaje).toBe('Respaldo creado correctamente');
      expect(res.respaldo).toBeNull();
    });

    it('debe manejar error de respuesta con y sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Fallo al respaldar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await adminService.crearRespaldo();
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Fallo al respaldar');

      const res2 = await adminService.crearRespaldo();
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible crear el respaldo. Intente nuevamente');
    });

    it('debe manejar error de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await adminService.crearRespaldo();
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('No fue posible conectar');
    });
  });

  describe('listarRespaldos', () => {
    it('debe retornar lista de respaldos', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { respaldos: [{ id: 1, fecha: '2026-03-01' }] }
      });

      const res = await adminService.listarRespaldos();
      expect(res.exito).toBe(true);
      expect(res.respaldos).toHaveLength(1);
    });

    it('debe manejar data vacía retornando arreglo vacío', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {}
      });

      const res = await adminService.listarRespaldos();
      expect(res.exito).toBe(true);
      expect(res.respaldos).toEqual([]);
    });

    it('debe manejar error en listarRespaldos con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error de servidor'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await adminService.listarRespaldos();
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Error de servidor');

      const res2 = await adminService.listarRespaldos();
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible consultar los respaldos. Intente nuevamente');
    });

    it('debe manejar error de red en listarRespaldos', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await adminService.listarRespaldos();
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('No fue posible conectar');
    });
  });

  describe('ejecutarMantenimiento', () => {
    it('debe ejecutar mantenimiento exitosamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Mantenimiento ok', detalle: { tablasOptimizadas: 10 } }
      });

      const res = await adminService.ejecutarMantenimiento();
      expect(res.exito).toBe(true);
      expect(res.mensaje).toBe('Mantenimiento ok');
      expect(res.detalle.tablasOptimizadas).toBe(10);
    });

    it('debe usar valores por defecto si data viene vacía', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {}
      });

      const res = await adminService.ejecutarMantenimiento();
      expect(res.exito).toBe(true);
      expect(res.mensaje).toBe('Mantenimiento completado');
      expect(res.detalle).toBeNull();
    });

    it('debe manejar error en mantenimiento con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'No se pudo realizar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await adminService.ejecutarMantenimiento();
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('No se pudo realizar');

      const res2 = await adminService.ejecutarMantenimiento();
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible ejecutar el mantenimiento. Intente nuevamente');
    });

    it('debe manejar error de red en mantenimiento', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await adminService.ejecutarMantenimiento();
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('No fue posible conectar');
    });
  });

  describe('descargarRespaldo', () => {
    it('debe retornar blob si la descarga es correcta', async () => {
      const mockBlob = new Blob(['contenido backup'], { type: 'application/octet-stream' });
      vi.spyOn(apiClient, 'getBlob').mockResolvedValue({
        ok: true,
        blob: mockBlob
      });

      const res = await adminService.descargarRespaldo(1, 'backup.sql');
      expect(res.exito).toBe(true);
      expect(res.blob).toBe(mockBlob);
      expect(res.nombreArchivo).toBe('backup.sql');
    });

    it('debe manejar error al descargar con y sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'getBlob').mockResolvedValueOnce({
        ok: false,
        error: 'Archivo no encontrado'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await adminService.descargarRespaldo(99, 'backup.sql');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Archivo no encontrado');

      const res2 = await adminService.descargarRespaldo(99, 'backup.sql');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible descargar el respaldo');
    });
  });
});
