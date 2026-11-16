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
    it('debe listar usuarios con filtros válidos', async () => {
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

    it('debe listar usuarios sin filtros cuando son cadenas vacías', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [
          { Id: 2, Nombre: 'Ana', Correo: 'ana@test.com', Rol: 'Psicologo', Estado: 'Activo', Aprobacion: 'Aprobado', FechaRegistro: '2026-01-01' }
        ]
      });

      const res = await listarUsuarios({ q: '  ', rol: '', estado: '' });
      expect(res.ok).toBe(true);
      expect(res.data[0].id).toBe(2);
      expect(res.data[0].nombre).toBe('Ana');
    });

    it('debe retornar lista vacía si data es nula', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const res = await listarUsuarios();
      expect(res.ok).toBe(true);
      expect(res.data).toEqual([]);
    });

    it('debe manejar error al listar usuarios con fallback de mensaje', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 500,
        error: ''
      });

      const res = await listarUsuarios();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible cargar la lista de usuarios.');
    });
  });

  describe('obtenerDetalleUsuario', () => {
    it('debe validar id de usuario', async () => {
      const res = await obtenerDetalleUsuario(null);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de usuario no válido.');
    });

    it('debe devolver detalle del usuario con minúsculas', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          id: 1,
          nombre: 'Juan Perez',
          correo: 'juan@test.com',
          rol: 'Paciente',
          estado: 'Activo',
          aprobacion: null,
          fechaRegistro: '2026-01-01',
          nombres: 'Juan',
          apellidos: 'Perez',
          fechaNacimiento: '1990-01-01',
          genero: 'Masculino'
        }
      });

      const res = await obtenerDetalleUsuario(1);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(1);
      expect(res.data.nombres).toBe('Juan');
    });

    it('debe devolver detalle con campos mayúsculas o vacíos', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          Id: 2,
          Nombre: null,
          Correo: null,
          Rol: null,
          Estado: null,
          Aprobacion: null,
          FechaRegistro: null,
          Nombres: null,
          Apellidos: null,
          FechaNacimiento: null,
          Genero: null
        }
      });

      const res = await obtenerDetalleUsuario(2);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(2);
      expect(res.data.nombre).toBe('');
      expect(res.data.apellidos).toBe('');
    });

    it('debe manejar error al consultar detalle con fallback', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await obtenerDetalleUsuario(99);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible cargar el detalle del usuario.');
    });
  });

  describe('actualizarUsuario', () => {
    it('debe validar id de usuario', async () => {
      const res = await actualizarUsuario(null, {});
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de usuario no válido.');
    });

    it('debe actualizar datos del usuario con mensaje personalizado o fallback', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Datos guardados' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await actualizarUsuario(1, { nombres: 'Pedro' });
      expect(res1.ok).toBe(true);
      expect(res1.mensaje).toBe('Datos guardados');

      const res2 = await actualizarUsuario(1, {});
      expect(res2.ok).toBe(true);
      expect(res2.mensaje).toBe('Cambios guardados correctamente.');
    });

    it('debe manejar error al actualizar con fallback', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await actualizarUsuario(1, {});
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible actualizar los datos del usuario.');
    });
  });

  describe('cambiarEstadoUsuario', () => {
    it('debe validar id de usuario y nuevo estado obligatorio', async () => {
      const res1 = await cambiarEstadoUsuario(null, 'Inactiva');
      expect(res1.ok).toBe(false);
      expect(res1.error).toBe('Identificador de usuario no válido.');

      const res2 = await cambiarEstadoUsuario(1, '   ');
      expect(res2.ok).toBe(false);
      expect(res2.error).toBe('El nuevo estado es obligatorio.');
    });

    it('debe actualizar estado con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Estado cambiado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await cambiarEstadoUsuario(1, 'Suspendida');
      expect(res1.ok).toBe(true);
      expect(res1.mensaje).toBe('Estado cambiado');

      const res2 = await cambiarEstadoUsuario(1, 'Activa');
      expect(res2.ok).toBe(true);
      expect(res2.mensaje).toBe('Estado actualizado correctamente.');
    });

    it('debe manejar error al cambiar estado con fallback', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await cambiarEstadoUsuario(1, 'Inactiva');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible cambiar el estado del usuario.');
    });
  });

  describe('forzarRestablecimientoPassword', () => {
    it('debe validar id de usuario', async () => {
      const res = await forzarRestablecimientoPassword(0);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Identificador de usuario no válido.');
    });

    it('debe restablecer contraseña con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Código enviado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await forzarRestablecimientoPassword(1);
      expect(res1.ok).toBe(true);
      expect(res1.mensaje).toBe('Código enviado');

      const res2 = await forzarRestablecimientoPassword(1);
      expect(res2.ok).toBe(true);
      expect(res2.mensaje).toBe('Se envió un código de restablecimiento al correo del usuario.');
    });

    it('debe manejar error al restablecer contraseña con fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: ''
      });

      const res = await forzarRestablecimientoPassword(1);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No fue posible forzar el restablecimiento de contraseña.');
    });
  });

  describe('gestionUsuariosService export', () => {
    it('debe exportar todas las funciones', () => {
      expect(gestionUsuariosService.listarUsuarios).toBe(listarUsuarios);
      expect(gestionUsuariosService.obtenerDetalleUsuario).toBe(obtenerDetalleUsuario);
      expect(gestionUsuariosService.actualizarUsuario).toBe(actualizarUsuario);
      expect(gestionUsuariosService.cambiarEstadoUsuario).toBe(cambiarEstadoUsuario);
      expect(gestionUsuariosService.forzarRestablecimientoPassword).toBe(forzarRestablecimientoPassword);
    });
  });
});
