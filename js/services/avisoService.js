/**
 * Servicio para el Mensaje Aclaratorio (PB-04 HU1-PB4)
 * Conecta con los endpoints del backend en /api/aviso
 * y gestiona el estado de aceptación en la sesión del usuario.
 */

import { getJson, postJson } from './apiClient.js';

// Texto oficial del mensaje aclaratorio (fallback ante desconexión)
export const TEXTO_AVISO_DEFAULT = {
  titulo: 'Mensaje aclaratorio',
  parrafos: [
    {
      textoHtml: '<b>Mindzyx</b> es una plataforma diseñada exclusivamente para el <b>monitoreo y apoyo del bienestar emocional</b>. Este sistema <span class="highlight">no realiza diagnósticos clínicos</span> y <span class="highlight">no sustituye la atención de un profesional de la salud mental</span>.'
    },
    {
      textoHtml: 'Ante un <b>riesgo alto o una situación de urgencia</b>, busca ayuda profesional o utiliza las <b>líneas de ayuda disponibles</b> en tu país (por ejemplo, servicios de emergencia o líneas de crisis locales).'
    },
    {
      textoHtml: 'Mindzyx es solo una <b>herramienta de apoyo y monitoreo emocional</b> y <b>no reemplaza la atención profesional</b>.'
    }
  ]
};

const STORAGE_KEY_AVISO = 'aviso_aclaratorio_aceptado';

export const avisoService = {
  /**
   * Obtiene el contenido oficial del aviso desde el backend (GET /api/aviso)
   */
  async obtenerAviso(simularError = false) {
    if (simularError) {
      return {
        exito: false,
        mensaje: 'No fue posible cargar el mensaje aclaratorio. Intente nuevamente'
      };
    }

    const res = await getJson('/aviso');

    if (res.ok && res.data) {
      return {
        exito: true,
        titulo: res.data.titulo || TEXTO_AVISO_DEFAULT.titulo,
        texto: res.data.texto || '',
        parrafos: TEXTO_AVISO_DEFAULT.parrafos
      };
    }

    // Fallback con textos oficiales locales si el backend no responde
    return {
      exito: true,
      titulo: TEXTO_AVISO_DEFAULT.titulo,
      parrafos: TEXTO_AVISO_DEFAULT.parrafos,
      offline: true
    };
  },

  /**
   * Registra la visualización del aviso en el backend (POST /api/aviso/visualizacion)
   * @param {string} origen - 'enlace' o 'auto:<funcionalidad>'
   * @param {'ok'|'error'} resultado - 'ok' o 'error'
   */
  async registrarVisualizacion(origen = 'enlace', resultado = 'ok') {
    this.logAuditoria(`VISUALIZACIÓN registrada (origen: "${origen}", resultado: "${resultado}")`);

    try {
      const res = await postJson('/aviso/visualizacion', {
        origen: origen,
        resultado: resultado
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  /**
   * Indica si el usuario ya aceptó el aviso en la sesión actual
   */
  haAceptadoAviso() {
    return sessionStorage.getItem(STORAGE_KEY_AVISO) === 'true';
  },

  /**
   * Marca el aviso como aceptado en la sesión actual
   */
  marcarAvisoAceptado() {
    sessionStorage.setItem(STORAGE_KEY_AVISO, 'true');
    this.logAuditoria('AVISO ACEPTADO - botón "Entendido" (verificación registrada en sesión)');
  },

  /**
   * Reinicia la aceptación del aviso (al cerrar sesión)
   */
  resetearAviso() {
    sessionStorage.removeItem(STORAGE_KEY_AVISO);
  },

  /**
   * Auditoría local desactivada en producción (antes: logs de consola [HU1-PB4]).
   * La trazabilidad real vive en dbo.auth vía los endpoints del backend.
   */
  logAuditoria(mensaje) {
    void mensaje;
  }
};
