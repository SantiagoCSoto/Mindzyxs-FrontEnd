import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  obtenerPantallaAsignacion,
  asignarCuestionario
} from '../../js/services/asignarCuestionarioService.js';

describe('asignarCuestionarioService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerPantallaAsignacion', () => {
    it('debe devolver datos de la pantalla de asignacion', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 5,
          titulo: 'Test PHQ-9',
          estado: 'Publicado',
          pacientes: [{ id: 10, nombre: 'Juan', yaAsignado: false }]
        }
      });

      const res = await obtenerPantallaAsignacion(5);
      expect(res.id).toBe(5);
      expect(res.titulo).toBe('Test PHQ-9');
      expect(res.pacientes).toHaveLength(1);
    });

    it('debe lanzar error si no fue ok', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Cuestionario no encontrado'
      });

      await expect(obtenerPantallaAsignacion(99)).rejects.toThrow('Cuestionario no encontrado');
    });
  });

  describe('asignarCuestionario', () => {
    it('debe asignar cuestionario a los pacientes', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Asignado con exito', asignados: 2 }
      });

      const res = await asignarCuestionario(5, [10, 11]);
      expect(res.mensaje).toBe('Asignado con exito');
      expect(res.asignados).toBe(2);
    });

    it('debe lanzar error si la asignacion falla', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'No se puede asignar cuestionario en borrador'
      });

      await expect(asignarCuestionario(5, [10])).rejects.toThrow('No se puede asignar cuestionario en borrador');
    });
  });
});
