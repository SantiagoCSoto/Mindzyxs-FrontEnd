import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as cuestionarioService from '../../js/services/cuestionarioService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('cuestionarioService.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('obtenerPendientePaciente', () => {
    it('retorna cuestionario si la petición es exitosa', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, titulo: 'Cuestionario test', preguntas: [] }
      });

      const res = await cuestionarioService.obtenerPendientePaciente();
      expect(res.ok).toBe(true);
      expect(res.data.titulo).toBe('Cuestionario test');
    });

    it('retorna fallback local en caso de error de red', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await cuestionarioService.obtenerPendientePaciente();
      expect(res.ok).toBe(true);
      expect(res.localOnly).toBe(true);
      expect(res.data.preguntas.length).toBeGreaterThan(0);
    });

    it('retorna error ante fallo del servidor (ej. 401)', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 401,
        error: 'Sesión expirada'
      });

      const res = await cuestionarioService.obtenerPendientePaciente();
      expect(res.ok).toBe(false);
      expect(res.status).toBe(401);
      expect(res.error).toBe('Sesión expirada');
    });
  });

  describe('obtenerAsignadosPaciente y obtenerAsignadoDetalle', () => {
    it('obtiene lista de asignados mapeando campos correctamente', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { idAsignacion: 10, idCuestionario: 2, titulo: 'Asignado 1', estado: 'Pendiente' }
        ]
      });

      const res = await cuestionarioService.obtenerAsignadosPaciente();
      expect(res.ok).toBe(true);
      expect(res.data[0].idAsignacion).toBe(10);
    });

    it('maneja error en asignados', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 500,
        error: 'Error en base de datos'
      });

      const res = await cuestionarioService.obtenerAsignadosPaciente();
      expect(res.ok).toBe(false);
    });

    it('obtiene detalle de asignado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 10, titulo: 'Detalle' }
      });

      const res = await cuestionarioService.obtenerAsignadoDetalle(10);
      expect(res.ok).toBe(true);
      expect(res.data.titulo).toBe('Detalle');
    });

    it('maneja error al obtener detalle de asignado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 404
      });

      const res = await cuestionarioService.obtenerAsignadoDetalle(99);
      expect(res.ok).toBe(false);
    });
  });

  describe('registrarInicioPaciente', () => {
    it('registra inicio sin arrojar excepciones aunque falle', async () => {
      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });
      await cuestionarioService.registrarInicioPaciente(1);
      expect(postSpy).toHaveBeenCalledWith('/cuestionario/paciente/inicio', { cuestionarioId: 1 });

      postSpy.mockRejectedValue(new Error('fail'));
      await expect(cuestionarioService.registrarInicioPaciente(1)).resolves.not.toThrow();
    });
  });

  describe('finalizarCuestionarioPaciente', () => {
    it('finaliza exitosamente contra el backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Ok', puntaje: 4, nivel: 'Alto' }
      });

      const res = await cuestionarioService.finalizarCuestionarioPaciente(1, [{ preguntaId: 1, opcionId: 2 }]);
      expect(res.puntaje).toBe(4);
      expect(res.localOnly).toBe(false);
    });

    it('calcula localmente si hay error de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const preguntas = [
        { id: 1, opciones: [{ id: 10, valor: 3 }] }
      ];
      const res = await cuestionarioService.finalizarCuestionarioPaciente(1, [{ preguntaId: 1, opcionId: 10 }], preguntas);
      expect(res.localOnly).toBe(true);
      expect(res.puntaje).toBe(3);
      expect(res.nivel).toBe('Medio');
    });

    it('lanza error si backend devuelve error 400', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Faltan preguntas'
      });

      await expect(
        cuestionarioService.finalizarCuestionarioPaciente(1, [])
      ).rejects.toThrow('Faltan preguntas');
    });
  });

  describe('historial en cuestionarioService', () => {
    it('obtiene historial exitosamente', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, tipo: 'Cuestionario' }]
      });

      const res = await cuestionarioService.obtenerHistorial();
      expect(res.ok).toBe(true);
      expect(res.data.length).toBe(1);
    });

    it('guarda y lee historial local en fallback', async () => {
      cuestionarioService.guardarHistorialLocal({ id: 99, test: true });
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await cuestionarioService.obtenerHistorial();
      expect(res.ok).toBe(true);
      expect(res.localOnly).toBe(true);
      expect(res.data[0].id).toBe(99);
    });

    it('maneja error en obtenerHistorial', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'No autorizado'
      });

      const res = await cuestionarioService.obtenerHistorial();
      expect(res.ok).toBe(false);
    });
  });
});
