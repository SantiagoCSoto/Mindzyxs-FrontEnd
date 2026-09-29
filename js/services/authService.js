/**
 * Servicio de Autenticación
 * Se comunica directamente con los endpoints del backend ASP.NET Core en http://localhost:5015/api/account/
 */

import { postJson, postFormData, getJson } from './apiClient.js';

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

    // 1. Respuesta exitosa del backend (200 OK)
    if (res.ok && res.data) {
      const usuarioBackend = res.data.usuario || {};
      const token = res.data.token || '';
      const rol = usuarioBackend.rol || 'Paciente';
      const panel = usuarioBackend.panel || rol;
      const destino = panel === 'Paciente' ? 'Panel del paciente' :
                      panel === 'Psicologo' ? 'Panel del psicólogo' :
                      'Consola de administración';

      const usuarioObj = {
        id: usuarioBackend.id,
        correo: usuarioBackend.correo || emailNormalizado,
        nombre: usuarioBackend.nombre || usuarioBackend.correo?.split('@')[0] || 'Usuario',
        nombres: usuarioBackend.nombre || usuarioBackend.correo?.split('@')[0] || 'Usuario',
        rol: rol,
        tipo_usuario: rol,
        panel: panel
      };

      if (token) {
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
      }
      sessionStorage.setItem('usuario', JSON.stringify(usuarioObj));
      sessionStorage.setItem('autenticado', 'true');
      localStorage.setItem('rol', rol);

      return {
        exito: true,
        rol,
        destino,
        token,
        usuario: usuarioObj
      };
    }

    // 2. Error reportado por el backend (400, 401, 403)
    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        mensaje: res.error || 'Correo o contraseña incorrectos'
      };
    }

    // 3. El backend no está disponible
    return {
      exito: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
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

    return {
      exito: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
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

    return {
      exito: false,
      expirado: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
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
      exito: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
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

    return {
      tiposCuenta: [],
      generos: [],
      especialidades: []
    };
  },

  /**
   * Obtener datos de la sesión activa
   */
  getSesion() {
    const datosStr = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
    if (!datosStr) return null;
    try {
      return JSON.parse(datosStr);
    } catch {
      return null;
    }
  },

  /**
   * Cerrar sesión y limpiar almacenamiento local
   */
  logout() {
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('autenticado');
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('autenticado');
    localStorage.removeItem('rol');
    return { exito: true };
  },

  /**
   * Solicitar código de recuperación de contraseña (POST /api/account/forgot)
   */
  async requestPasswordReset(correo) {
    const email = correo ? correo.trim().toLowerCase() : '';
    if (!email) {
      return { exito: false, mensaje: 'Este campo es obligatorio' };
    }
    if (!email.includes('@')) {
      return { exito: false, mensaje: 'Ingresa un correo válido' };
    }

    const res = await postJson('/account/forgot', { correo: email });

    if (res.ok && res.data) {
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Si el correo está registrado, recibirás un código.'
      };
    }

    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        mensaje: res.error || 'Error al enviar el código de recuperación.'
      };
    }

    return {
      exito: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
    };
  },

  /**
   * Verificar código de recuperación (POST /api/account/forgot/verify)
   */
  async verifyPasswordResetCode(correo, codigo) {
    const email = correo ? correo.trim().toLowerCase() : '';
    const cod = codigo ? codigo.trim() : '';

    const res = await postJson('/account/forgot/verify', {
      correo: email,
      codigo: cod
    });

    if (res.ok && res.data) {
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Código verificado correctamente.'
      };
    }

    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        expirado: res.status === 410 || (res.error && res.error.includes('expiró')),
        mensaje: res.error || 'Código incorrecto. Verifica e intenta nuevamente'
      };
    }

    return {
      exito: false,
      expirado: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
    };
  },

  /**
   * Reenviar código de recuperación (POST /api/account/forgot/resend)
   */
  async resendRecoveryCode(correo) {
    const email = correo ? correo.trim().toLowerCase() : '';

    const res = await postJson('/account/forgot/resend', { correo: email });

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
      exito: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
    };
  },

  /**
   * Establecer nueva contraseña tras recuperación (POST /api/account/forgot/reset)
   */
  async resetPassword(correo, codigo, nuevaContrasena) {
    const email = correo ? correo.trim().toLowerCase() : '';
    const cod = codigo ? codigo.trim() : '';

    const res = await postJson('/account/forgot/reset', {
      correo: email,
      codigo: cod,
      password: nuevaContrasena
    });

    if (res.ok && res.data) {
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Contraseña actualizada correctamente.'
      };
    }

    if (!res.ok && !res.isNetworkError) {
      return {
        exito: false,
        expirado: res.status === 410 || (res.error && res.error.includes('expiró')),
        mensaje: res.error || 'Error al actualizar la contraseña.'
      };
    }

    return {
      exito: false,
      expirado: false,
      mensaje: res.error || 'No fue posible conectar con el servidor backend.'
    };
  }
};