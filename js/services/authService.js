/**
 * Servicio de Autenticación
 * Encargado de las operaciones de negocio y peticiones de autenticación.
 * Se comunica con el Backend a través de apiClient.
 */

import { request } from './apiClient.js';

export const authService = {
  async login(correo, password) {
    const { status, data } = await request('/account/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password })
    });

    if (status === 200) {
      return {
        exito: true,
        token: data.token,
        expiraEn: data.expiraEn,
        usuario: data.usuario
      };
    }

    return {
      exito: false,
      mensaje: data?.error || 'Error al iniciar sesión'
    };
  },

  async register(formData) {
    const { status, data } = await request('/account/register', {
      method: 'POST',
      body: formData
    });

    if (status === 201 || status === 200) {
      return { exito: true, mensaje: data?.mensaje || 'Registro exitoso' };
    }

    return {
      exito: false,
      mensaje: data?.error || 'Error al registrar usuario'
    };
  },

  async verifyCode(correo, codigo) {
    const { status, data } = await request('/account/verify', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo })
    });

    if (status === 200) {
      return {
        exito: true,
        estado: data?.estado,
        mensaje: data?.mensaje || 'Código verificado'
      };
    }

    return {
      exito: false,
      expirado: status === 410,
      mensaje: data?.error || 'Error al verificar código'
    };
  },

  async resendCode(correo) {
    const { status, data } = await request('/account/resend', {
      method: 'POST',
      body: JSON.stringify({ correo })
    });

    if (status === 200) {
      return { exito: true, mensaje: data?.mensaje || 'Código reenviado' };
    }

    return {
      exito: false,
      mensaje: data?.error || 'Error al reenviar código'
    };
  },

  async forgot(correo) {
    const { status, data } = await request('/account/forgot', {
      method: 'POST',
      body: JSON.stringify({ correo })
    });

    if (status === 200) {
      return { exito: true, mensaje: data?.mensaje || 'Código enviado' };
    }

    return {
      exito: false,
      mensaje: data?.error || 'Error al enviar código'
    };
  },

  async forgotVerify(correo, codigo) {
    const { status, data } = await request('/account/forgot/verify', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo })
    });

    if (status === 200) {
      return { exito: true, mensaje: data?.mensaje || 'Código verificado' };
    }

    return {
      exito: false,
      expirado: status === 410,
      mensaje: data?.error || 'Error al verificar código'
    };
  },

  async forgotReset(correo, codigo, password) {
    const { status, data } = await request('/account/forgot/reset', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo, password })
    });

    if (status === 200) {
      return { exito: true, mensaje: data?.mensaje || 'Contraseña actualizada' };
    }

    return {
      exito: false,
      expirado: status === 410,
      mensaje: data?.error || 'Error al restablecer contraseña'
    };
  },

  async forgotResend(correo) {
    const { status, data } = await request('/account/forgot/resend', {
      method: 'POST',
      body: JSON.stringify({ correo })
    });

    if (status === 200) {
      return { exito: true, mensaje: data?.mensaje || 'Código reenviado' };
    }

    return {
      exito: false,
      mensaje: data?.error || 'Error al reenviar código'
    };
  },

  async getProfile() {
    const { status, data } = await request('/account/me');

    if (status === 200) {
      return { exito: true, usuario: data };
    }

    return {
      exito: false,
      mensaje: data?.error || 'Sesión no válida'
    };
  }
};
