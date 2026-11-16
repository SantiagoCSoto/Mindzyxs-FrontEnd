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

    it('debe inferir nombre desde correo si usuario no tiene nombre', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {
          usuario: { id: 1, correo: 'miguel@test.com' }
        }
      });

      const res = await authService.login('miguel@test.com', 'Pass123!');
      expect(res.usuario.nombre).toBe('miguel');
      expect(res.usuario.rol).toBe('Paciente');
    });

    it('debe usar fallback "Usuario" si no hay nombre ni correo', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {
          usuario: {}
        }
      });

      const res = await authService.login(null, null);
      expect(res.usuario.nombre).toBe('Usuario');
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

    it('debe manejar errores devueltos por el backend con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Credenciales inválidas'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await authService.login('err@test.com', 'wrong');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Credenciales inválidas');

      const res2 = await authService.login('err@test.com', 'wrong');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('Correo o contraseña incorrectos');
    });

    it('debe manejar error de conexión de red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Red caída'
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.login('net@test.com', 'pass');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Red caída');

      const res2 = await authService.login('net@test.com', 'pass');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible conectar con el servidor backend.');
    });
  });

  describe('register', () => {
    it('debe registrar usuario con FormData correctamente con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postFormData').mockResolvedValueOnce({
        ok: true,
        data: { idUsuario: 10, mensaje: 'Registro exitoso' }
      }).mockResolvedValueOnce({
        ok: true,
        data: { idUsuario: 11 }
      });

      const res1 = await authService.register(new FormData());
      expect(res1.exito).toBe(true);
      expect(res1.mensaje).toBe('Registro exitoso');

      const res2 = await authService.register(new FormData());
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Registro exitoso. Verifica tu cuenta.');
    });

    it('debe manejar fallas de registro con y sin mensaje de backend', async () => {
      vi.spyOn(apiClient, 'postFormData').mockResolvedValueOnce({
        ok: false,
        error: 'El correo ya se encuentra registrado'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await authService.register(new FormData());
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('El correo ya se encuentra registrado');

      const res2 = await authService.register(new FormData());
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No se pudo completar el registro.');
    });

    it('debe manejar error de red al registrar con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postFormData').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Error de red'
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.register(new FormData());
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Error de red');

      const res2 = await authService.register(new FormData());
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible conectar con el servidor backend.');
    });
  });

  describe('verifyCode y resendCode', () => {
    it('verifyCode debe validar código correctamente con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { estado: 'activo', mensaje: 'Registro exitoso' }
      }).mockResolvedValueOnce({
        ok: true,
        data: { estado: 'activo' }
      });

      const res1 = await authService.verifyCode('test@test.com', '123456');
      expect(res1.exito).toBe(true);
      expect(res1.estado).toBe('activo');

      const res2 = await authService.verifyCode(null, null);
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Registro exitoso. Ya puedes iniciar sesión');
    });

    it('verifyCode debe detectar código expirado o incorrecto con fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 410,
        error: 'El código expiró'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await authService.verifyCode('test@test.com', '000000');
      expect(res1.exito).toBe(false);
      expect(res1.expirado).toBe(true);

      const res2 = await authService.verifyCode('test@test.com', '000000');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('Código incorrecto. Verifica e intenta nuevamente');
    });

    it('verifyCode debe manejar error de red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Falla red'
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.verifyCode('test@test.com', '123456');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Falla red');

      const res2 = await authService.verifyCode('test@test.com', '123456');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible conectar con el servidor backend.');
    });

    it('resendCode debe reenviar código de verificación con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Código reenviado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await authService.resendCode('test@test.com');
      expect(res1.exito).toBe(true);
      expect(res1.mensaje).toBe('Código reenviado');

      const res2 = await authService.resendCode(null);
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Código reenviado');
    });

    it('resendCode debe manejar error devuelto por backend con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Usuario no encontrado'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      const res1 = await authService.resendCode('test@test.com');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Usuario no encontrado');

      const res2 = await authService.resendCode('test@test.com');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('Error al reenviar el código.');
    });

    it('resendCode debe manejar error de red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'No se pudo conectar'
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.resendCode('test@test.com');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('No se pudo conectar');

      const res2 = await authService.resendCode('test@test.com');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('No fue posible conectar con el servidor backend.');
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

    it('requestPasswordReset debe iniciar recuperación con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Si el correo está registrado, recibirás un código.' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await authService.requestPasswordReset('olvido@test.com');
      expect(res1.exito).toBe(true);
      expect(res1.mensaje).toContain('recibirás un código');

      const res2 = await authService.requestPasswordReset('olvido@test.com');
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toContain('recibirás un código');
    });

    it('requestPasswordReset maneja errores backend y red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error backend'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: 'Red caída'
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.requestPasswordReset('olvido@test.com');
      expect(res1.exito).toBe(false);
      expect(res1.mensaje).toBe('Error backend');

      const res2 = await authService.requestPasswordReset('olvido@test.com');
      expect(res2.exito).toBe(false);
      expect(res2.mensaje).toBe('Error al enviar el código de recuperación.');

      const res3 = await authService.requestPasswordReset('olvido@test.com');
      expect(res3.exito).toBe(false);
      expect(res3.mensaje).toBe('Red caída');

      const res4 = await authService.requestPasswordReset('olvido@test.com');
      expect(res4.exito).toBe(false);
      expect(res4.mensaje).toBe('No fue posible conectar con el servidor backend.');
    });

    it('verifyPasswordResetCode debe verificar código con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Código verificado correctamente.' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(res1.exito).toBe(true);

      const res2 = await authService.verifyPasswordResetCode(null, null);
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Código verificado correctamente.');
    });

    it('verifyPasswordResetCode maneja código expirado y red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 410,
        error: 'El código expiró'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(res1.expirado).toBe(true);

      const res2 = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(res2.mensaje).toBe('Código incorrecto. Verifica e intenta nuevamente');

      const res3 = await authService.verifyPasswordResetCode('olvido@test.com', '654321');
      expect(res3.mensaje).toBe('No fue posible conectar con el servidor backend.');
    });

    it('resendRecoveryCode debe reenviar código de recuperación con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Código reenviado' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await authService.resendRecoveryCode('olvido@test.com');
      expect(res1.exito).toBe(true);

      const res2 = await authService.resendRecoveryCode(null);
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Código reenviado');
    });

    it('resendRecoveryCode maneja error backend y de red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, error: 'Err' });
      expect((await authService.resendRecoveryCode('a@b.com')).exito).toBe(false);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, error: '' });
      expect((await authService.resendRecoveryCode('a@b.com')).mensaje).toBe('Error al reenviar el código.');

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, isNetworkError: true, error: '' });
      expect((await authService.resendRecoveryCode('a@b.com')).mensaje).toBe('No fue posible conectar con el servidor backend.');
    });

    it('resetPassword debe cambiar la contraseña exitosamente con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Contraseña actualizada' }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(res1.exito).toBe(true);

      const res2 = await authService.resetPassword(null, null, 'NewPass123!');
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Contraseña actualizada correctamente.');
    });

    it('resetPassword maneja errores backend y expiración con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        status: 410,
        error: 'expiró'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      }).mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
        error: ''
      });

      const res1 = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(res1.expirado).toBe(true);

      const res2 = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(res2.mensaje).toBe('Error al actualizar la contraseña.');

      const res3 = await authService.resetPassword('olvido@test.com', '654321', 'NewPass123!');
      expect(res3.mensaje).toBe('No fue posible conectar con el servidor backend.');
    });
  });

  describe('reanudarVerificacion', () => {
    it('debe solicitar código de reanudación con o sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Código enviado', requiere: true }
      }).mockResolvedValueOnce({
        ok: true,
        data: {}
      });

      const res1 = await authService.reanudarVerificacion('pendiente@test.com');
      expect(res1.exito).toBe(true);
      expect(res1.requiereVerificacion).toBe(true);

      const res2 = await authService.reanudarVerificacion(null);
      expect(res2.exito).toBe(true);
      expect(res2.mensaje).toBe('Código reenviado. Revisa tu correo.');
    });

    it('reanudarVerificacion maneja errores backend y de red con y sin mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, error: 'No existe' });
      expect((await authService.reanudarVerificacion('a@b.com')).exito).toBe(false);

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, error: '' });
      expect((await authService.reanudarVerificacion('a@b.com')).mensaje).toBe('Error al reanudar la verificación.');

      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({ ok: false, isNetworkError: true, error: '' });
      expect((await authService.reanudarVerificacion('a@b.com')).mensaje).toBe('No fue posible conectar con el servidor backend.');
    });
  });

  describe('logout y getSesion', () => {
    it('getSesion debe retornar datos válidos si hay usuario en sessionStorage o localStorage', () => {
      sessionStorage.setItem('usuario', JSON.stringify({ id: 5, nombre: 'Ana' }));
      expect(authService.getSesion().nombre).toBe('Ana');

      sessionStorage.clear();
      localStorage.setItem('usuario', JSON.stringify({ id: 6, nombre: 'Beto' }));
      expect(authService.getSesion().nombre).toBe('Beto');
    });

    it('getSesion debe retornar null si no hay usuario en storage', () => {
      expect(authService.getSesion()).toBeNull();
    });

    it('getSesion maneja JSON corrupto', () => {
      sessionStorage.setItem('usuario', '{corrupt-json');
      expect(authService.getSesion()).toBeNull();
    });

    it('logout debe limpiar storages y notificar al backend si hay token en localStorage o sessionStorage', async () => {
      localStorage.setItem('token', 'token-123');
      sessionStorage.setItem('autenticado', 'true');
      sessionStorage.setItem('usuario', '{"id":1}');

      const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });

      await authService.logout();
      expect(localStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('autenticado')).toBeNull();
      expect(sessionStorage.getItem('usuario')).toBeNull();
      expect(postSpy).toHaveBeenCalledWith('/account/logout', {}, expect.any(Object));

      // Logout sin token
      const resNoToken = await authService.logout();
      expect(resNoToken.exito).toBe(true);
    });

    it('logout no lanza error si el backend falla', async () => {
      sessionStorage.setItem('token', 'token-456');
      vi.spyOn(apiClient, 'postJson').mockRejectedValue(new Error('Network error'));

      const res = await authService.logout();
      expect(res.exito).toBe(true);
      expect(sessionStorage.getItem('token')).toBeNull();
    });
  });
});
