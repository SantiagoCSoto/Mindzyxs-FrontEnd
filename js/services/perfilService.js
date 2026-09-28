/**
 * Servicio para Editar Perfil del Paciente (PB-10 / HU1-PB10)
 * Conecta con los endpoints del backend en /api/account/
 * Gestiona actualización de datos personales, solicitud y confirmación de cambio de correo.
 */

import { putJson, postJson } from './apiClient.js';
import { authService } from './authService.js';

export const perfilService = {
  /**
   * Actualiza nombres, apellidos, fecha de nacimiento y género (PUT /api/account/perfil)
   * @param {Object} datos - { nombres, apellidos, fechaNacimiento, idGenero }
   */
  async actualizarPerfil(datos) {
    this.logAuditoria('INTENTO actualizar perfil:', JSON.stringify(datos));

    const res = await putJson('/account/perfil', datos);

    if (res.ok && res.data) {
      this.logAuditoria('ÉXITO Perfil actualizado correctamente');
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Perfil actualizado correctamente'
      };
    }

    const mensajeError = res.error || 'No fue posible actualizar el perfil.';
    this.logAuditoria('ERROR al actualizar perfil:', mensajeError);

    return {
      exito: false,
      mensaje: mensajeError,
      status: res.status
    };
  },

  /**
   * Solicita el cambio de correo enviando un código de 6 dígitos al nuevo correo (POST /api/account/correo/solicitar)
   * @param {string} nuevoCorreo
   */
  async solicitarCambioCorreo(nuevoCorreo) {
    const correoNormalizado = (nuevoCorreo || '').trim().toLowerCase();
    this.logAuditoria('SOLICITUD cambio de correo a:', correoNormalizado);

    const res = await postJson('/account/correo/solicitar', {
      nuevoCorreo: correoNormalizado
    });

    if (res.ok && res.data) {
      this.logAuditoria('CÓDIGO ENVIADO al nuevo correo');
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Código enviado'
      };
    }

    const esDuplicado = res.status === 409 || (res.error && res.error.includes('ya se encuentra registrado'));
    this.logAuditoria('ERROR solicitud cambio de correo:', res.error);

    return {
      exito: false,
      mensaje: res.error || 'No se pudo enviar el código de verificación.',
      esDuplicado,
      status: res.status
    };
  },

  /**
   * Confirma el cambio de correo validando el código de 6 dígitos (POST /api/account/correo/confirmar)
   * @param {string} nuevoCorreo
   * @param {string} codigo
   */
  async confirmarCambioCorreo(nuevoCorreo, codigo) {
    const correoNormalizado = (nuevoCorreo || '').trim().toLowerCase();
    const cod = (codigo || '').trim();
    this.logAuditoria('CONFIRMACIÓN de cambio de correo con código para:', correoNormalizado);

    const res = await postJson('/account/correo/confirmar', {
      nuevoCorreo: correoNormalizado,
      codigo: cod
    });

    if (res.ok && res.data) {
      this.logAuditoria('ÉXITO Correo actualizado correctamente');
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Correo actualizado correctamente'
      };
    }

    const expirado = res.status === 410 || (res.error && res.error.includes('expiró'));
    this.logAuditoria('ERROR confirmar cambio de correo:', res.error);

    return {
      exito: false,
      mensaje: res.error || 'Código incorrecto. Verifica e intenta nuevamente',
      expirado,
      status: res.status
    };
  },

  /**
   * Obtiene los datos del perfil actual desde la sesión local
   */
  obtenerPerfilActual() {
    const sesion = authService.getSesion();
    if (!sesion) {
      // Datos demo/fallback para desarrollo si no hay sesión activa
      return {
        nombres: 'Camila',
        apellidos: 'Rojas',
        fechaNacimiento: '2002-05-10',
        genero: 'Femenino',
        idGenero: 2,
        correo: 'paciente@test.com',
        rol: 'Paciente'
      };
    }

    return {
      id: sesion.id,
      nombres: sesion.nombres || sesion.nombre || 'Usuario',
      apellidos: sesion.apellidos || sesion.apellido || '',
      fechaNacimiento: sesion.fechaNacimiento || sesion.fecha_nacimiento || '2002-05-10',
      genero: sesion.genero || 'Femenino',
      idGenero: sesion.idGenero ?? sesion.id_genero ?? 2,
      correo: sesion.correo || '',
      rol: sesion.rol || sesion.tipo_usuario || 'Paciente'
    };
  },

  /**
   * Actualiza los datos del perfil en el almacenamiento de sesión
   * @param {Object} nuevosDatos
   */
  guardarPerfilEnSesion(nuevosDatos) {
    const sesionActual = authService.getSesion() || {};
    const usuarioActualizado = {
      ...sesionActual,
      ...nuevosDatos,
      nombre: nuevosDatos.nombres || sesionActual.nombre,
      nombres: nuevosDatos.nombres || sesionActual.nombres,
      apellido: nuevosDatos.apellidos || sesionActual.apellido,
      apellidos: nuevosDatos.apellidos || sesionActual.apellidos,
      correo: nuevosDatos.correo || sesionActual.correo,
      fechaNacimiento: nuevosDatos.fechaNacimiento || sesionActual.fechaNacimiento,
      idGenero: nuevosDatos.idGenero ?? sesionActual.idGenero,
      genero: nuevosDatos.genero || sesionActual.genero
    };

    sessionStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    if (localStorage.getItem('usuario')) {
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    }

    return usuarioActualizado;
  },

  /**
   * Calcula la edad en años a partir de una fecha de nacimiento (YYYY-MM-DD)
   * @param {string} fechaStr
   * @returns {number|null}
   */
  calcularEdad(fechaStr) {
    if (!fechaStr) return null;
    const nac = new Date(fechaStr + 'T00:00:00');
    if (isNaN(nac.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  },

  /**
   * Formatea una fecha YYYY-MM-DD a formato amigable DD/MM/YYYY
   * @param {string} fechaStr
   * @returns {string}
   */
  formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const partes = fechaStr.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  },

  /**
   * Emite logs de auditoría en consola con formato [HU1-PB10]
   */
  logAuditoria(accion, detalle = '') {
    console.log('[HU1-PB10]', new Date().toLocaleTimeString(), accion, detalle);
  }
};
