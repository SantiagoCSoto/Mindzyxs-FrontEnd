import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  gestionUsuariosService,
  listarUsuarios,
  obtenerDetalleUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  forzarRestablecimientoPassword
} from '../../js/services/gestionUsuariosService.js';

describe('gestionUsuariosService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listarUsuarios', () => {
    it('debe listar usuarios con filtros', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          usuarios: [
            { id: 1, nombre: 'Juan', correo: 'juan@test.com', rol: 'Paciente', estado: 'Activo' }
          ]
        }
      });

      const res = await listarUsuarios({ q: 'Juan', rol: 'Paciente', estado: 'Activo' });
      expect(res.ok).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe(1);
    });

    it('debe manejar error al listar usuarios', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 500,
        error: 'Error de servidor'
      });

      const res = await listarUsuarios();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error de servidor');
    });
  });

  describe('obtenerDetalleUsuario', () => {
    it('debe validar id de usuario', async () => {
      const res = await obtenerDetalleUsuario(null);
      expect(res.ok).toBe(false);
    });

    it('debe devolver detalle del usuario', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, nombre: 'Juan Perez', correo: 'juan@test.com', rol: 'Paciente' }
      });

      const res = await obtenerDetalleUsuario(1);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(1);
    });

    it('debe manejar error al consultar detalle', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: 'Usuario no existe'
      });

      const res = await obtenerDetalleUsuario(99);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Usuario no existe');
    });
  });

  describe('actualizarUsuario', () => {
    it('debe validar id de usuario', async () => {
      const res = await actualizarUsuario(null, {});
      expect(res.ok).toBe(false);
    });

    it('debe actualizar datos del usuario', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Datos guardados' }
      });

      const res = await actualizarUsuario(1, { nombres: 'Pedro' });
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Datos guardados');
    });

    it('debe manejar error al actualizar', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'No se pudo guardar'
      });

      const res = await actualizarUsuario(1, {});
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No se pudo guardar');
    });
  });

  describe('cambiarEstadoUsuario', () => {
    it('debe validar id y nuevoEstado', async () => {
      const res1 = await cambiarEstadoUsuario(null, 'Inactivo');
      expect(res1.ok).toBe(false);

      const res2 = await cambiarEstadoUsuario(1, '');
      expect(res2.ok).toBe(false);
    });

    it('debe cambiar el estado del usuario', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Estado cambiado' }
      });

      const res = await cambiarEstadoUsuario(1, 'Suspendida');
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Estado cambiado');
    });

    it('debe manejar error al cambiar estado', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'No se pudo actualizar estado'
      });

      const res = await cambiarEstadoUsuario(1, 'Inactivo');
      expect(res.ok).toBe(false);
    });
  });

  describe('forzarRestablecimientoPassword', () => {
    it('debe validar id de usuario', async () => {
      const res = await forzarRestablecimientoPassword(null);
      expect(res.ok).toBe(false);
    });

    it('debe forzar restablecimiento exitosamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Código enviado' }
      });

      const res = await forzarRestablecimientoPassword(1);
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Código enviado');
    });

    it('debe manejar error al restablecer contraseña', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Fallo al resetear'
      });

      const res = await forzarRestablecimientoPassword(1);
      expect(res.ok).toBe(false);
    });
  });
});
