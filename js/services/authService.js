/**
 * Servicio de Autenticación
 * Encargado de las operaciones de negocio y peticiones de autenticación.
 * Actualmente opera con datos simulados y está listo para integrarse con el Backend.
 */

// Base de datos simulada para pruebas
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
   * Iniciar sesión de usuario
   */
  async login(correo, password) {
    // Simulación de latencia de red
    await new Promise((resolve) => setTimeout(resolve, 150));

    const emailNormalizado = correo ? correo.trim().toLowerCase() : '';
    const pass = password ? password.trim() : '';
    const usuario = USUARIOS_PRUEBA[emailNormalizado];

    if (usuario && usuario.password === pass) {
      return {
        exito: true,
        rol: usuario.rol,
        destino: usuario.destino
      };
    }

    return {
      exito: false,
      mensaje: 'Correo o contraseña incorrectos'
    };
  },

  /**
   * Registrar nuevo usuario
   */
  async register(datosUsuario) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    console.log('[authService] Registrando usuario:', datosUsuario);
    return {
      exito: true,
      mensaje: 'Registro exitoso'
    };
  },

  /**
   * Verificar código de 6 dígitos
   */
  async verifyCode(codigo) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cod = codigo ? codigo.trim() : '';

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
        mensaje: 'Código verificado exitosamente'
      };
    }

    return {
      exito: false,
      expirado: false,
      mensaje: 'Código incorrecto. Inténtalo de nuevo.'
    };
  },

  /**
   * Reenviar código de verificación
   */
  async resendCode(correo = '') {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      exito: true,
      mensaje: 'Se ha reenviado un nuevo código a tu correo.'
    };
  }
};
