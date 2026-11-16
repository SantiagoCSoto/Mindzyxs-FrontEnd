import { describe, it, expect, beforeEach, vi } from 'vitest';
import { perfilService } from '../../js/services/perfilService.js';
import * as apiClient from '../../js/services/apiClient.js';
import { authService } from '../../js/services/authService.js';

describe('perfilService.js', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('enmascararCorreo', () => {
    it('enmascararCorreo oculta caracteres privados o maneja correos inválidos', () => {
      expect(perfilService.enmascararCorreo('usuario@test.com')).toBe('u***@test.com');
      expect(perfilService.enmascararCorreo('invalido')).toBe('***');
      expect(perfilService.enmascararCorreo('@test.com')).toBe('***');
      expect(perfilService.enmascararCorreo(null)).toBe('***');
    });
  });

  describe('actualizarPerfil', () => {
    it('actualizarPerfil envía datos y retorna éxito con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Perfil actualizado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await perfilService.actualizarPerfil({ nombres: 'Carlos' });
      expect(res1.exito).toBe(true);
      expect(res1.mensaje).toBe('Perfil actualizado');

      const res2 = await perfilService.actualizarPerfil({ nombres: 'Carlos' });
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Perfil actualizado correctamente');
    });

    it('actualizarPerfil maneja error con y sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error de servidor'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await perfilService.actualizarPerfil({});
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Error de servidor');

      const res2 = await perfilService.actualizarPerfil({});
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible actualizar el perfil.');
    });
  });

  describe('solicitarCambioCorreo', () => {
    it('solicitarCambioCorreo maneja éxito y correo duplicado', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Código enviado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const resOk = await perfilService.solicitarCambioCorreo('nuevo@test.com');
      expect(resOk.exito).toBe(true);
      expect(resOk.mensaje).toBe('Código enviado');

      const resOk2 = await perfilService.solicitarCambioCorreo(null);
      expect(resOk2.exito).toBe(true);
      expect(resOk2.mensaje).toBe('Código enviado');

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 409,
        error: 'El correo ya se encuentra registrado'
      }).mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: ''
      });

      const resDup = await perfilService.solicitarCambioCorreo('dup@test.com');
      expect(resDup.exito).toBe(false);
      expect(resDup.esDuplicado).toBe(true);

      const resDef = await perfilService.solicitarCambioCorreo('fail@test.com');
      expect(resDef.exito).toBe(false);
      expect(resDef.mensaje).toBe('No se pudo enviar el código de verificación.');
    });
  });

  describe('confirmarCambioCorreo', () => {
    it('confirmarCambioCorreo confirma código y detecta expirado', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Confirmado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const resOk = await perfilService.confirmarCambioCorreo('nuevo@test.com', '123456');
      expect(resOk.exito).toBe(true);
      expect(resOk.mensaje).toBe('Confirmado');

      const resOk2 = await perfilService.confirmarCambioCorreo(null, null);
      expect(resOk2.exito).toBe(true);
      expect(resOk2.mensaje).toBe('Correo actualizado correctamente');

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 410,
        error: 'Código expiró'
      }).mockResolvedValueOnce({
        ok: false,
        status: 400,
        error: ''
      });

      const resExp = await perfilService.confirmarCambioCorreo('nuevo@test.com', '123456');
      expect(resExp.exito).toBe(false);
      expect(resExp.expirado).toBe(true);

      const resDef = await perfilService.confirmarCambioCorreo('nuevo@test.com', '123456');
      expect(resDef.exito).toBe(false);
      expect(resDef.mensaje).toBe('Código incorrecto. Verifica e intenta nuevamente');
    });
  });

  describe('obtenerPerfil', () => {
    it('obtenerPerfil obtiene y normaliza datos del backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: true,
        data: { Nombres: 'Juan', Apellidos: 'Perez', FechaNacimiento: '1995-05-10T00:00:00Z', Correo: 'juan@test.com' }
      }).mockResolvedValueOnce({
        ok: false,
        error: 'No autorizado'
      });

      const res = await perfilService.obtenerPerfil();
      expect(res.nombres).toBe('Juan');
      expect(res.fechaNacimiento).toBe('1995-05-10');

      const resNull = await perfilService.obtenerPerfil();
      expect(resNull).toBeNull();
    });
  });

  describe('obtenerPerfilActual y guardarPerfilEnSesion', () => {
    it('gestiona sesión local correctamente incluyendo snake_case y localStorage', () => {
      expect(perfilService.obtenerPerfilActual()).toBeNull();

      sessionStorage.setItem('usuario', JSON.stringify({
        id: 1,
        nombre: 'Ana',
        apellido: 'Gomez',
        fecha_nacimiento: '1990-01-01',
        id_genero: 2,
        correo: 'ana@test.com'
      }));

      const p = perfilService.obtenerPerfilActual();
      expect(p.nombres).toBe('Ana');
      expect(p.apellidos).toBe('Gomez');
      expect(p.fechaNacimiento).toBe('1990-01-01');
      expect(p.idGenero).toBe(2);

      localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
      perfilService.guardarPerfilEnSesion({ nombres: 'Ana Maria', apellidos: 'Gomez Perez' });

      const actualizadoSession = JSON.parse(sessionStorage.getItem('usuario'));
      const actualizadoLocal = JSON.parse(localStorage.getItem('usuario'));
      expect(actualizadoSession.nombres).toBe('Ana Maria');
      expect(actualizadoLocal.nombres).toBe('Ana Maria');
    });
  });

  describe('calcularEdad y formatearFecha', () => {
    it('calcularEdad calcula años correctamente y maneja casos bordes', () => {
      expect(perfilService.calcularEdad('')).toBeNull();
      expect(perfilService.calcularEdad('fecha-invalida')).toBeNull();

      const hoy = new Date();
      const cumpleanoPasado = `${hoy.getFullYear() - 20}-01-01`;
      expect(perfilService.calcularEdad(cumpleanoPasado)).toBe(20);

      // Cumpleaños futuro este año
      const cumpleanoFuturo = `${hoy.getFullYear() - 20}-12-31`;
      const edadEsperada = hoy.getMonth() === 11 && hoy.getDate() === 31 ? 20 : 19;
      expect(perfilService.calcularEdad(cumpleanoFuturo)).toBe(edadEsperada);
    });

    it('formatearFecha convierte formato correctamente', () => {
      expect(perfilService.formatearFecha('')).toBe('-');
      expect(perfilService.formatearFecha('2026-05-12T00:00:00')).toBe('12/05/2026');
      expect(perfilService.formatearFecha('no-formato')).toBe('no-formato');
    });
  });
});
