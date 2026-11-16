import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as psicologoService from '../../js/services/psicologoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('psicologoService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerDirectorio', () => {
    it('obtiene lista de psicólogos con parámetros', async () => {
      const getSpy = vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { id: 1, nombre: 'Dra. Gomez', especialidades: ['Clínica'], pacientesAsignados: 3 }
        ]
      });

      const res = await psicologoService.obtenerDirectorio('gomez', 2, 1, 5);
      expect(res.ok).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].nombre).toBe('Dra. Gomez');
      expect(getSpy).toHaveBeenCalledWith('/psicologos?q=gomez&idEspecialidad=2&idGenero=1&minAniosExperiencia=5');
    });

    it('maneja error cuando falla la petición', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 500,
        error: 'Error del servidor'
      });

      const res = await psicologoService.obtenerDirectorio();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error del servidor');
    });
  });

  describe('solicitarChatPsicologo', () => {
    it('solicita chat correctamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { idSolicitud: 12, estado: 'Pendiente' }
      });

      const res = await psicologoService.solicitarChatPsicologo(5);
      expect(res.idSolicitud).toBe(12);
    });

    it('lanza error si falla la solicitud', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Ya existe una solicitud pendiente'
      });

      await expect(psicologoService.solicitarChatPsicologo(5)).rejects.toThrow('Ya existe una solicitud pendiente');
    });
  });
});
