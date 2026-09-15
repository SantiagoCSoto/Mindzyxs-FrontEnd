/**
 * Servicio de Autenticación
 * Se comunica directamente con los endpoints del backend ASP.NET Core en http://localhost:5015/api/account/
 * Incluye fallback automático a simulación local si el backend no se encuentra activo.
 */

import { postJson, postFormData, getJson } from './apiClient.js';

// Base de datos simulada para fallback local
const USUARIOS_PRUEBA = {
  'paciente@test.com': {
    password: '123456a',
    rol: 'Paciente',
    destino: 'Panel del paciente'
  },
  'psicologo@test.com': {
    password: '123456a',
    rol: 'Psicólogo',
    destino: 'Panel del psicólogo'
  },
  'admin@test.com': {
    password: '123456a',
    rol: 'Administrador',
    destino: 'Consola de administración'
  }
};

export const authService = {
  /**
   * Iniciar sesión en el backend (POST /api/account/login)
   */
  async login(correo, password) {
    const emailNormalizado = correo ? correo.trim().toLowerCase() : '';
    const pass = password ? password.trim() : '';

    const res = await postJson('/account/login', {
      correo: emailNormalizado,
      password: pass
    });

    // 1. Respuesta exitosa del backend (200)
    if (res.ok && res.data) {
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data.usuario?.rol) {
        localStorage.setItem('rol', res.data.usuario.rol);
      }

      const panel = res.data.usuario?.panel || res.data.usuario?.rol;
      const destino = panel === 'Paciente' ? 'Panel del paciente' :
                      panel === 'Psicologo' ? 'Panel del psicólogo' :
                      'Consola de administración';

      return {
        exito: true,
        rol: res.data.usuario?.rol || 'Usuario',
        destino,
        token: res.data.token,
        usuario: res.data.usuario
      };
    }

    // 2. Error reportado por el backend (400, 401, 403)
    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        mensaje: res.error || 'Correo o contraseña incorrectos'
      };
    }

    // 3. Fallback de red: Backend apagado, usar simulación local
    console.info('[authService] Backend offline, recurriendo a simulación local de login.');
    const usuarioSimulado = USUARIOS_PRUEBA[emailNormalizado];
    if (usuarioSimulado && usuarioSimulado.password === pass) {
      return {
        exito: true,
        rol: usuarioSimulado.rol,
        destino: usuarioSimulado.destino
      };
    }

    return {
      exito: false,
      mensaje: 'Correo o contraseña incorrectos'
    };
  },

  /**
   * Registrar nuevo usuario (POST /api/account/register con multipart/form-data)
   */
  async register(formData) {
    const res = await postFormData('/account/register', formData);

    if (res.ok && res.data) {
      return {
        exito: true,
        idUsuario: res.data.idUsuario,
        mensaje: res.data.mensaje || 'Registro exitoso. Verifica tu cuenta.'
      };
    }

    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        mensaje: res.error || 'No se pudo completar el registro.'
      };
    }

    // Fallback si no hay conexión al backend
    console.info('[authService] Backend offline, simulando registro exitoso.');
    return {
      exito: true,
      mensaje: 'Registro exitoso (Modo simulación)'
    };
  },

  /**
   * Verificar código de 6 dígitos (POST /api/account/verify)
   */
  async verifyCode(correo, codigo) {
    const email = correo ? correo.trim().toLowerCase() : '';
    const cod = codigo ? codigo.trim() : '';

    const res = await postJson('/account/verify', {
      correo: email,
      codigo: cod
    });

    if (res.ok && res.data) {
      return {
        exito: true,
        estado: res.data.estado,
        mensaje: res.data.mensaje || 'Registro exitoso. Ya puedes iniciar sesión'
      };
    }

    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        expirado: res.status === 410 || (res.error && res.error.includes('expiró')),
        mensaje: res.error || 'Código incorrecto. Verifica e intenta nuevamente'
      };
    }

    // Fallback si el backend está offline
    console.info('[authService] Backend offline, simulando verificación.');
    if (cod === '000000') {
      return {
        exito: false,
        expirado: true,
        mensaje: 'El código expiró. Reenvía el código'
      };
    }

    if (cod === '123456') {
      return {
        exito: true,
        mensaje: 'Registro exitoso. Ya puedes iniciar sesión'
      };
    }

    return {
      exito: false,
      expirado: false,
      mensaje: 'Código incorrecto. Verifica e intenta nuevamente'
    };
  },

  /**
   * Reenviar código (POST /api/account/resend)
   */
  async resendCode(correo) {
    const email = correo ? correo.trim().toLowerCase() : '';

    const res = await postJson('/account/resend', {
      correo: email
    });

    if (res.ok && res.data) {
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Código reenviado'
      };
    }

    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        mensaje: res.error || 'Error al reenviar el código.'
      };
    }

    return {
      exito: true,
      mensaje: 'Se ha reenviado un nuevo código a tu correo.'
    };
  },

  /**
   * Obtener catálogos de tipos de cuenta y géneros (GET /api/account/catalogos)
   */
  async getCatalogos() {
    const res = await getJson('/account/catalogos');
    if (res.ok && res.data) {
      return res.data;
    }

    // Catálogos por defecto si el backend está apagado
    return {
      tiposCuenta: [
        { id: 1, codigo: 'Paciente' },
        { id: 2, codigo: 'Psicologo' }
      ],
      generos: [
        { id: 1, codigo: 'Masculino' },
        { id: 2, codigo: 'Femenino' },
        { id: 3, codigo: 'Otro' },
        { id: 4, codigo: 'Prefiero no decir' }
      ]
    };
  }
};
