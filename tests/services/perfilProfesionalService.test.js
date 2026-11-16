import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as perfilProfesionalService from '../../js/services/perfilProfesionalService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('perfilProfesionalService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerPerfilProfesional', () => {
    it('obtiene perfil profesional con éxito', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, nombre: 'Dr. Lopez', aniosExperiencia: 10 }
      });

      const res = await perfilProfesionalService.obtenerPerfilProfesional();
      expect(res.nombre).toBe('Dr. Lopez');
    });

    it('lanza error ante fallo', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Sesión no válida'
      });

      await expect(perfilProfesionalService.obtenerPerfilProfesional()).rejects.toThrow('Sesión no válida');
    });
  });

  describe('listarEspecialidades', () => {
    it('lista especialidades mapeando id y nombre', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          especialidades: [{ id: 1, nombre: 'Clínica' }, { id: 2, codigo: 'Cognitiva' }]
        }
      });

      const res = await perfilProfesionalService.listarEspecialidades();
      expect(res.length).toBe(2);
      expect(res[0].nombre).toBe('Clínica');
      expect(res[1].nombre).toBe('Cognitiva');
    });

    it('lanza error si la petición falla', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false });
      await expect(perfilProfesionalService.listarEspecialidades()).rejects.toThrow('No fue posible cargar las especialidades');
    });
  });

  describe('actualizarPerfilProfesional', () => {
    it('actualiza perfil con éxito', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Actualizado' }
      });

      const res = await perfilProfesionalService.actualizarPerfilProfesional({ aniosExperiencia: 5 });
      expect(res.mensaje).toBe('Actualizado');
    });

    it('lanza error si falla la actualización', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'Datos inválidos'
      });

      await expect(perfilProfesionalService.actualizarPerfilProfesional({})).rejects.toThrow('Datos inválidos');
    });
  });
});
