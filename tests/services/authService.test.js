import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../js/services/authService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('authService.js', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('debe autenticar exitosamente y guardar sesión de paciente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {
          token: 'jwt-123',
          usuario: { id: 1, correo: 'paciente@test.com', nombre: 'Juan', rol: 'Paciente', panel: 'Paciente' }
        }
      });

      const res = await authService.login('paciente@test.com', 'Pass123!');
      expect(res.exito).toBe(true);
      expect(res.rol).toBe('Paciente');
      expect(res.destino).toBe('Panel del paciente');
      expect(localStorage.getItem('token')).toBe('jwt-123');
      expect(sessionStorage.getItem('autenticado')).toBe('true');
      expect(JSON.parse(sessionStorage.getItem('usuario')).nombre).toBe('Juan');
    });

    it('debe manejar roles Psicólogo y Administrador con sus respectivos paneles', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: {
          token: 'jwt-psi',
          usuario: { id: 2, correo: 'psi@test.com', rol: 'Psicologo', panel: 'Psicologo' }
        }
      });

      const resPsi = await authService.login('psi@test.com', 'Pass123!');
      expect(resPsi.destino).toBe('Panel del psicólogo');

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: {
          token: 'jwt-admin',
          usuario: { id: 3, correo: 'admin@test.com', rol: 'Administrador', panel: 'Administrador' }
        }
      });

      const resAdmin = await authService.login('admin@test.com', 'Pass123!');
      expect(resAdmin.destino).toBe('Consola de administración');
    });

    it('debe manejar errores de credenciales devueltos por el backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Credenciales inválidas'
      });

      const res = await authService.login('err@test.com', 'wrong');
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('Credenciales inválidas');
    });

    it('debe manejar error de conexión de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true,
        error: 'No fue posible conectar con el servidor backend.'
      });

      const res = await authService.login('net@test.com', 'pass');
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('No fue posible conectar');
    });
  });

  describe('register', () => {
    it('debe registrar usuario con FormData correctamente', async () => {
      const fd = new FormData();
      fd.append('correo', 'nuevo@test.com');

      vi.spyOn(apiClient, 'postFormData').mockResolvedValue({
        ok: true,
        data: { idUsuario: 10, mensaje: 'Registro exitoso' }
      });

      const res = await authService.register(fd);
      expect(res.exito).toBe(true);
      expect(res.idUsuario).toBe(10);
      expect(res.mensaje).toBe('Registro exitoso');
    });

    it('debe manejar fallas de registro con respuesta de backend', async () => {
      vi.spyOn(apiClient, 'postFormData').mockResolvedValue({
        ok: false,
        error: 'El correo ya se encuentra registrado'
      });

      const res = await authService.register(new FormData());
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('ya se encuentra registrado');
    });

    it('debe manejar error de red al registrar', async () => {
      vi.spyOn(apiClient, 'postFormData').mockResolvedValue({
        ok: false,
        isNetworkError: true,
        error: 'Error de red'
      });

      const res = await authService.register(new FormData());
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('Error de red');
    });
  });

  describe('verifyCode y resendCode', () => {
    it('verifyCode debe validar código correctamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { estado: 'activo', mensaje: 'Registro exitoso' }
      });

      const res = await authService.verifyCode('test@test.com', '123456');
      expect(res.exito).toBe(true);
      expect(res.estado).toBe('activo');
    });

    it('verifyCode debe detectar código expirado o incorrecto', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        status: 410,
        error: 'El código expiró'
      });

      const res = await authService.verifyCode('test@test.com', '000000');
      expect(res.exito).toBe(false);
      expect(res.expirado).toBe(true);
    });

    it('verifyCode debe manejar error de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true,
        error: 'Falla red'
      });

      const res = await authService.verifyCode('test@test.com', '123456');
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('Falla red');
    });

    it('resendCode debe reenviar código de verificación', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Código reenviado' }
      });

      const res = await authService.resendCode('test@test.com');
      expect(res.exito).toBe(true);
      expect(res.mensaje).toBe('Código reenviado');
    });

    it('resendCode debe manejar error devuelto por backend', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Usuario no encontrado'
      });

      const res = await authService.resendCode('test@test.com');
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('Usuario no encontrado');
    });

    it('resendCode debe manejar error de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true,
        error: 'No se pudo conectar'
      });

      const res = await authService.resendCode('test@test.com');
      expect(res.exito).toBe(false);
      expect(res.mensaje).toBe('No se pudo conectar');
    });
  });

  describe('getCatalogos', () => {
    it('debe obtener listas de especialidades y géneros', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { generos: ['Femenino', 'Masculino'], especialidades: ['Clínica'], tiposCuenta: ['Paciente'] }
      });

      const res = await authService.getCatalogos();
      expect(res.generos.length).toBe(2);
      expect(res.especialidades.length).toBe(1);
    });

    it('debe retornar arrays vacíos si falla la petición', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false });

      const res = await authService.getCatalogos();
      expect(res.generos).toEqual([]);
      expect(res.tiposCuenta).toEqual([]);
      expect(res.especialidades).toEqual([]);
    });
  });

  describe('recuperación de contraseña', () => {
    it('requestPasswordReset valida correo antes de enviar', async () => {
      const resVacio = await authService.requestPasswordReset('');
      expect(resVacio.exito).toBe(false);
      expect(resVacio.mensaje).toBe('Este campo es obligatorio');

      const resInvalido = await authService.requestPasswordReset('sinarroba');
      expect(resInvalido.exito).toBe(false);
      expect(resInvalido.mensaje).toBe('Ingresa un correo válido');
    });

    it('requestPasswordReset debe iniciar recuperación', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Si el correo está registrado, recibirás un código.' }
      });

      const res = await authService.requestPasswordReset('olvido@test.com');
      expect(res.exito).toBe(true);
      expect(res.mensaje).toContain('recibirás un código');
    });

    it('requestPasswordReset maneja errores backend y red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error backend'
      });
      const resErr = await authService.requestPasswordReset('olvido@test.com');
      expect(resErr.exito).toBe(false);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Red caída'
      });
      const resNet = await authService.requestPasswordReset('olvido@test.com');
      expect(resNet.exito).toBe(false);
    });

    it('verifyPasswordResetCode debe verificar código', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Código verificado correctamente.' }
      });

      const res = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(res.exito).toBe(true);
    });

    it('verifyPasswordResetCode maneja código expirado y red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 410,
        error: 'El código expiró'
      });
      const resExp = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(resExp.expirado).toBe(true);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Falla red'
      });
      const resNet = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(resNet.exito).toBe(false);
    });

    it('resendRecoveryCode debe reenviar código de recuperación', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Código reenviado' }
      });

      const res = await authService.resendRecoveryCode('olvido@test.com');
      expect(res.exito).toBe(true);
    });

    it('resendRecoveryCode maneja error backend y de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, error: 'Err' });
      expect((await authService.resendRecoveryCode('a@b.com')).exito).toBe(false);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, isNetworkError: true, error: 'Red' });
      expect((await authService.resendRecoveryCode('a@b.com')).exito).toBe(false);
    });

    it('resetPassword debe cambiar la contraseña exitosamente', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Contraseña actualizada' }
      });

      const res = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(res.exito).toBe(true);
    });

    it('resetPassword maneja errores backend y expiración', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 410,
        error: 'expiró'
      });
      const resExp = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(resExp.expirado).toBe(true);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Red caída'
      });
      const resNet = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(resNet.exito).toBe(false);
    });
  });

  describe('reanudarVerificacion', () => {
    it('debe solicitar código de reanudación', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Código enviado', requiere: true }
      });

      const res = await authService.reanudarVerificacion('pendiente@test.com');
      expect(res.exito).toBe(true);
      expect(res.requiereVerificacion).toBe(true);
    });

    it('reanudarVerificacion maneja errores backend y de red', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, error: 'No existe' });
      expect((await authService.reanudarVerificacion('a@b.com')).exito).toBe(false);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, isNetworkError: true, error: 'Red' });
      expect((await authService.reanudarVerificacion('a@b.com')).exito).toBe(false);
    });
  });

  describe('logout y getSesion', () => {
    it('getSesion debe retornar datos válidos si hay usuario autenticado', () => {
      sessionStorage.setItem('usuario', JSON.stringify({ id: 5, nombre: 'Ana' }));

      const sesion = authService.getSesion();
      expect(sesion).not.toBeNull();
      expect(sesion.nombre).toBe('Ana');
    });

    it('getSesion debe retornar null si no hay usuario en storage', () => {
      expect(authService.getSesion()).toBeNull();
    });

    it('getSesion maneja JSON corrupto', () => {
      sessionStorage.setItem('usuario', '{corrupt-json');
      expect(authService.getSesion()).toBeNull();
    });

    it('logout debe limpiar storages y notificar al backend si hay token', async () => {
      localStorage.setItem('token', 'token-123');
      sessionStorage.setItem('autenticado', 'true');
      sessionStorage.setItem('usuario', '{"id":1}');

      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });

      await authService.logout();
      expect(localStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('autenticado')).toBeNull();
      expect(sessionStorage.getItem('usuario')).toBeNull();
      expect(postSpy).toHaveBeenCalledWith('/account/logout', {}, expect.any(Object));
    });

    it('logout no lanza error si el backend falla', async () => {
      localStorage.setItem('token', 'token-123');
      vi.spyOn(apiClient, 'postJson').mockRejectedValue(new Error('Network error'));

      const res = await authService.logout();
      expect(res.exito).toBe(true);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
