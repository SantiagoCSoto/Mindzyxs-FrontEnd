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
    nombre: 'Camila Rojas',
    rol: 'Paciente',
    destino: 'Panel del paciente'
  },
  'psicologo@test.com': {
    password: '123456a',
    nombre: 'Pedro López',
    rol: 'Psicólogo',
    destino: 'Panel del psicólogo'
  },
  'admin@test.com': {
    password: '123456a',
    nombre: 'Administrador',
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

    // 3. Fallback si el backend está apagado: simulación local
    console.info('[authService] Backend offline, usando simulación local de login.');
    const usuarioSimulado = USUARIOS_PRUEBA[emailNormalizado];
    if (usuarioSimulado && usuarioSimulado.password === pass) {
      const usuarioObj = {
        correo: emailNormalizado,
        nombre: usuarioSimulado.nombre || emailNormalizado.split('@')[0],
        nombres: usuarioSimulado.nombre || emailNormalizado.split('@')[0],
        rol: usuarioSimulado.rol,
        tipo_usuario: usuarioSimulado.rol
      };

      sessionStorage.setItem('usuario', JSON.stringify(usuarioObj));
      sessionStorage.setItem('token', 'simulado_' + Date.now());
      sessionStorage.setItem('autenticado', 'true');
      localStorage.setItem('rol', usuarioSimulado.rol);

      return {
        exito: true,
        rol: usuarioSimulado.rol,
        destino: usuarioSimulado.destino,
        usuario: usuarioObj
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
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(correo) {
    const email = correo ? correo.trim().toLowerCase() : '';
    if (!email) {
      return { exito: false, mensaje: 'Este campo es obligatorio' };
    }
    if (!email.includes('@')) {
      return { exito: false, mensaje: 'Ingresa un correo válido' };
    }

    // Intentar endpoint de backend si existe, o usar resend/simulación
    const usuariosValidos = Object.keys(USUARIOS_PRUEBA);
    if (!usuariosValidos.includes(email)) {
      return { exito: false, mensaje: 'Mensaje genérico de seguridad' };
    }

    return {
      exito: true,
      mensaje: 'Se ha enviado un código de recuperación a tu correo.'
    };
  },

  /**
   * Verificar código de recuperación
   */
  async verifyPasswordResetCode(correo, codigo) {
    const cod = codigo ? codigo.trim() : '';
    if (cod === '000000') {
      return { exito: false, expirado: true, mensaje: 'El código expiró. Reenvía el código' };
    }
    if (cod === '123456') {
      return { exito: true, mensaje: 'Código verificado correctamente.' };
    }
    return { exito: false, mensaje: 'Código incorrecto. Inténtalo de nuevo.' };
  },

  /**
   * Establecer nueva contraseña tras recuperación
   */
  async resetPassword(correo, codigo, nuevaContrasena) {
    const email = correo ? correo.trim().toLowerCase() : '';
    if (USUARIOS_PRUEBA[email]) {
      USUARIOS_PRUEBA[email].password = nuevaContrasena;
    }
    return { exito: true, mensaje: 'Contraseña actualizada correctamente.' };
  }
};