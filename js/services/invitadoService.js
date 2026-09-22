/**
 * Servicio para Modo Invitado (PB-06 HU1-PB6)
 * Conecta con los endpoints del backend en /api/invitado
 * Gestiona el estado de sesión de invitado y los registros de auditoría de accesos y bloqueos.
 */

import { getJson, postJson } from './apiClient.js';

// Configuración por defecto del panel de invitado (fallback offline)
export const PANEL_INVITADO_DEFAULT = {
  avisoObligatorio: true,
  disponibles: [
    {
      codigo: 'cuestionario',
      titulo: 'Responder cuestionario',
      descripcion: 'Cuestionario de bienestar emocional',
      ruta: 'encuesta_invitado.html',
      sensible: true
    },
    {
      codigo: 'recomendaciones',
      titulo: 'Ver recomendaciones básicas',
      descripcion: 'Consejos generales de cuidado',
      ruta: 'recomendaciones_invitado.html',
      sensible: false
    },
    {
      codigo: 'ayuda',
      titulo: 'Líneas de ayuda',
      descripcion: 'Contactos de emergencia y apoyo',
      accion: 'lineas_ayuda',
      sensible: false
    }
  ],
  exclusivas: [
    {
      codigo: 'historial',
      titulo: 'Historial emocional',
      descripcion: 'Registro de tus estados'
    },
    {
      codigo: 'progreso',
      titulo: 'Gráficos de progreso',
      descripcion: 'Evolución por tiempo'
    },
    {
      codigo: 'recordatorios',
      titulo: 'Recordatorios',
      descripcion: 'Avisos programados'
    },
    {
      codigo: 'psicologo',
      titulo: 'Autorización de psicólogo',
      descripcion: 'Vincular un profesional'
    }
  ]
};

const STORAGE_KEY_INVITADO = 'es_invitado';

export const invitadoService = {
  /**
   * Obtiene la configuración oficial del panel de invitado desde el backend (GET /api/invitado/panel)
   */
  async obtenerConfiguracionPanel() {
    const res = await getJson('/invitado/panel');

    if (res.ok && res.data) {
      return {
        exito: true,
        avisoObligatorio: res.data.avisoObligatorio ?? true,
        disponibles: res.data.disponibles || PANEL_INVITADO_DEFAULT.disponibles,
        exclusivas: res.data.exclusivas || PANEL_INVITADO_DEFAULT.exclusivas
      };
    }

    // Fallback local ante backend apagado
    return {
      exito: true,
      avisoObligatorio: PANEL_INVITADO_DEFAULT.avisoObligatorio,
      disponibles: PANEL_INVITADO_DEFAULT.disponibles,
      exclusivas: PANEL_INVITADO_DEFAULT.exclusivas,
      offline: true
    };
  },

  /**
   * Inicia el modo invitado y registra el acceso en el backend (POST /api/invitado/acceso)
   * @param {string} origen - 'login' o 'landing'
   */
  async iniciarModoInvitado(origen = 'login') {
    // 1. Limpiar credenciales y tokens previos
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    sessionStorage.removeItem('token');

    // 2. Establecer sesión en modo invitado
    sessionStorage.setItem(STORAGE_KEY_INVITADO, 'true');
    sessionStorage.setItem('autenticado', 'false');
    sessionStorage.setItem('usuario', JSON.stringify({
      nombre: 'Invitado',
      nombres: 'Invitado',
      rol: 'Invitado',
      tipo_usuario: 'Invitado',
      esInvitado: true
    }));

    this.logAuditoria(`ACCESO en MODO INVITADO iniciado desde "${origen}" (sin cuenta ni sesión activa)`);

    // 3. Registrar acceso en el backend
    try {
      await postJson('/invitado/acceso', {
        origen: origen,
        resultado: 'ok'
      });
    } catch (err) {
      console.warn('[invitadoService] No se pudo registrar el acceso en el backend:', err.message);
    }
  },

  /**
   * Registra en auditoría el intento bloqueado de usar una función exclusiva (POST /api/invitado/bloqueo)
   * @param {string} funcion - Nombre de la función exclusiva
   */
  async registrarBloqueo(funcion) {
    this.logAuditoria(`BLOQUEO: función exclusiva "${funcion}" requiere crear una cuenta o iniciar sesión`);

    try {
      await postJson('/invitado/bloqueo', {
        funcion: funcion
      });
    } catch (err) {
      console.warn('[invitadoService] No se pudo registrar el bloqueo en el backend:', err.message);
    }
  },

  /**
   * Registra la salida del modo invitado y limpia el almacenamiento (POST /api/invitado/salida)
   * @param {string} origen - 'panel' o 'header'
   */
  async salirModoInvitado(origen = 'panel') {
    this.logAuditoria(`SALIDA de modo invitado registrada desde "${origen}" -> retorno a pantalla principal`);

    try {
      await postJson('/invitado/salida', {
        origen: origen
      });
    } catch (err) {
      console.warn('[invitadoService] No se pudo registrar la salida en el backend:', err.message);
    }

    sessionStorage.removeItem(STORAGE_KEY_INVITADO);
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('autenticado');
  },

  /**
   * Comprueba si el usuario actual está navegando como invitado
   */
  esInvitado() {
    return sessionStorage.getItem(STORAGE_KEY_INVITADO) === 'true';
  },

  /**
   * Emite logs de auditoría en consola con formato [HU1-PB6]
   */
  logAuditoria(mensaje) {
    console.log('[HU1-PB6]', new Date().toLocaleTimeString(), mensaje);
  }
};
