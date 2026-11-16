import { describe, it, expect, beforeEach, vi } from 'vitest';
import { psicologoRegistrosService } from '../../js/services/psicologoRegistrosService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('psicologoRegistrosService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerPacientes', () => {
    it('obtiene lista de pacientes autorizados', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 10, nombre: 'Paciente Uno' }]
      });

      const res = await psicologoRegistrosService.obtenerPacientes('uno');
      expect(res.ok).toBe(true);
      expect(res.data[0].id).toBe(10);
    });

    it('maneja error cuando falla la petición', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 403,
        error: 'No autorizado'
      });

      const res = await psicologoRegistrosService.obtenerPacientes();
      expect(res.ok).toBe(false);
      expect(res.status).toBe(403);
    });
  });

  describe('obtenerRegistrosPaciente', () => {
    it('valida que el id del paciente sea válido', async () => {
      const res = await psicologoRegistrosService.obtenerRegistrosPaciente(null);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('no válido');
    });

    it('obtiene registros con filtros de fecha', async () => {
      const getSpy = vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, tipo: 'RegistroEmocional', puntaje: 4 }]
      });

      const res = await psicologoRegistrosService.obtenerRegistrosPaciente(5, '2026-01-01', '2026-01-31');
      expect(res.ok).toBe(true);
      expect(getSpy).toHaveBeenCalledWith('/psicologo/pacientes/5/registros?desde=2026-01-01&hasta=2026-01-31');
    });
  });

  describe('obtenerDetalleRegistro', () => {
    it('valida que el idEvento sea válido', async () => {
      const res = await psicologoRegistrosService.obtenerDetalleRegistro(0);
      expect(res.ok).toBe(false);
    });

    it('obtiene detalle completo de un registro', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 1,
          tipo: 'Cuestionario',
          puntaje: 3,
          respuestas: [{ p: 'pregunta', r: 'respuesta' }],
          observaciones: [{ contenido: 'Seguir plan' }]
        }
      });

      const res = await psicologoRegistrosService.obtenerDetalleRegistro(1);
      expect(res.ok).toBe(true);
      expect(res.data.respuestas.length).toBe(1);
      expect(res.data.observaciones.length).toBe(1);
    });
  });
});
