/**
 * Servicio para Recordatorios de Registro Emocional (PB-15 / HU1-PB15)
 * Conecta con los endpoints del backend en /api/recordatorios
 * Exclusivo para pacientes:
 *  - Consulta de configuración actual (GET /api/recordatorios)
 *  - Guardado y actualización de recordatorios (POST /api/recordatorios)
 *  - Consulta de avisos programados que vencen hoy (GET /api/recordatorios/hoy)
 *  - Mapeo de días (1=Lun..7=Dom) y formateo de estado
 *  - Respaldo local y auditoría estructurada en consola [HU1-PB15]
 */

import { getJson, postJson } from './apiClient.js';
import { authService } from './authService.js';

// Mapeo oficial entre números de día (1=Lunes .. 7=Domingo) y abreviaturas
export const DIAS_MAP = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom'
};

export const DIAS_REVERSE = {
  'Lun': 1,
  'Mar': 2,
  'Mié': 3,
  'Mie': 3,
  'Jue': 4,
  'Vie': 5,
  'Sáb': 6,
  'Sab': 6,
  'Dom': 7
};

const STORAGE_KEY_RECORDATORIO = 'recordatorio_emocional_config';

export const recordatorioService = {
  /**
   * Obtiene la configuración de recordatorios del paciente en sesión
   */
  async obtenerConfiguracion() {
    this.logAuditoria('CONSULTA de configuración de recordatorios');

    const res = await getJson('/recordatorios');

    // Caso 1: Configuración existente en backend
    if (res.ok && res.status === 200 && res.data) {
      const normalizada = this.normalizarConfig(res.data);
      this.guardarEnStorage(normalizada);
      this.logAuditoria('ÉXITO Configuración obtenida del backend:', this.formatearTextoResumen(normalizada));
      return {
        exito: true,
        data: normalizada,
        noConfigurado: false
      };
    }

    // Caso 2: 204 No Content (el paciente aún no ha configurado recordatorios)
    if (res.ok && (res.status === 204 || !res.data)) {
      this.logAuditoria('RESPUESTA 204: Sin configuración previa');
      return {
        exito: true,
        data: null,
        noConfigurado: true
      };
    }

    // Caso 3: Fallback por desconexión del backend o error de red
    if (res.isNetworkError || !res.ok) {
      this.logAuditoria('FALLBACK Carga de configuración desde almacenamiento local');
      const local = this.obtenerDeStorage();
      if (local) {
        return {
          exito: true,
          data: local,
          noConfigurado: false,
          fallback: true
        };
      }

      // Si no hay en storage, retorna configuración por defecto sugerida (Diaria 08:00 activa)
      const configDemo = {
        activo: true,
        frecuencia: 'Diaria',
        hora: '08:00',
        dias: [],
        diasNombres: [],
        titulo: 'Registro emocional',
        mensaje: 'Configura avisos para tu registro emocional diario o semanal.'
      };
      return {
        exito: true,
        data: configDemo,
        noConfigurado: false,
        fallback: true
      };
    }

    return {
      exito: false,
      mensaje: res.error || 'No fue posible cargar la configuración de recordatorios.',
      status: res.status
    };
  },

  /**
   * Guarda o actualiza la configuración de recordatorios del paciente
   * @param {Object} datos - { frecuencia, hora, dias, activo, titulo, mensaje }
   */
  async guardarConfiguracion(datos) {
    if (!datos.frecuencia || !datos.hora) {
      this.logAuditoria('ERROR de validación: falta frecuencia u hora');
      return {
        exito: false,
        mensaje: 'Debes seleccionar frecuencia y hora'
      };
    }

    const frecuencia = datos.frecuencia === 'Semanal' ? 'Semanal' : 'Diaria';
    const hora = String(datos.hora).trim();

    // Normalizar días a números (1..7)
    let diasNumeros = [];
    if (frecuencia === 'Semanal') {
      if (Array.isArray(datos.dias) && datos.dias.length > 0) {
        diasNumeros = datos.dias.map(d => typeof d === 'number' ? d : DIAS_REVERSE[d] || null)
          .filter(n => n >= 1 && n <= 7);
      }

      if (diasNumeros.length === 0) {
        this.logAuditoria('ERROR de validación: frecuencia semanal requiere días seleccionados');
        return {
          exito: false,
          mensaje: 'Debes seleccionar al menos un día para la frecuencia semanal'
        };
      }
    }

    const payload = {
      frecuencia,
      hora,
      dias: diasNumeros,
      activo: datos.activo !== false,
      titulo: datos.titulo || 'Registro emocional',
      mensaje: datos.mensaje || 'Es momento de registrar cómo te sientes hoy en Mindzyxs.'
    };

    this.logAuditoria('GUARDANDO configuración:', JSON.stringify(payload));

    const res = await postJson('/recordatorios', payload);

    if (res.ok && res.data) {
      const configGuardada = this.normalizarConfig({
        ...payload,
        ...res.data
      });
      this.guardarEnStorage(configGuardada);
      this.logAuditoria('ÉXITO Configuración guardada en backend');
      return {
        exito: true,
        mensaje: res.data.mensaje || 'Recordatorios configurados correctamente',
        data: configGuardada
      };
    }

    // Fallback offline ante desconexión
    if (res.isNetworkError || !res.ok) {
      const configGuardada = this.normalizarConfig(payload);
      this.guardarEnStorage(configGuardada);
      this.logAuditoria('FALLBACK Guardado en almacenamiento local');
      return {
        exito: true,
        mensaje: 'Recordatorios configurados correctamente (modo local)',
        data: configGuardada,
        fallback: true
      };
    }

    return {
      exito: false,
      mensaje: res.error || 'Error al guardar los recordatorios.',
      status: res.status
    };
  },

  /**
   * Consulta los avisos vencidos programados para el día actual
   */
  async obtenerAvisosHoy() {
    this.logAuditoria('CONSULTA de avisos vencidos hoy');

    const res = await getJson('/recordatorios/hoy');

    if (res.ok && Array.isArray(res.data)) {
      this.logAuditoria('Avisos hoy obtenidos:', `${res.data.length} aviso(s)`);
      return {
        exito: true,
        data: res.data
      };
    }

    // Fallback: verificar localmente si la hora ya pasó
    const local = this.obtenerDeStorage();
    if (local && local.activo) {
      const hoy = new Date();
      const diaSemanaActual = hoy.getDay() === 0 ? 7 : hoy.getDay(); // 1=Lun .. 7=Dom

      const aplicaHoy = local.frecuencia === 'Diaria' || 
        (local.frecuencia === 'Semanal' && local.dias.includes(diaSemanaActual));

      if (aplicaHoy && local.hora) {
        const [hConf, mConf] = local.hora.split(':').map(Number);
        const minutosConf = hConf * 60 + mConf;
        const minutosActual = hoy.getHours() * 60 + hoy.getMinutes();

        if (minutosActual >= minutosConf) {
          return {
            exito: true,
            data: [{
              titulo: local.titulo || 'Es hora de tu registro emocional',
              mensaje: local.mensaje || 'Cuéntanos cómo te sientes hoy.',
              hora: local.hora
            }]
          };
        }
      }
    }

    return {
      exito: true,
      data: []
    };
  },

  /**
   * Normaliza la configuración devuelta por backend o storage
   */
  normalizarConfig(data) {
    if (!data) return null;

    const frecuencia = data.frecuencia ?? data.Frecuencia ?? 'Diaria';
    const hora = data.hora ?? data.Hora ?? '08:00';
    const activo = (data.activo ?? data.Activo) !== false;
    const diasRaw = data.dias ?? data.Dias ?? [];

    const dias = Array.isArray(diasRaw)
      ? diasRaw.map(d => typeof d === 'number' ? d : DIAS_REVERSE[d] || null).filter(Boolean)
      : [];

    const diasNombres = dias.map(n => DIAS_MAP[n] || n);

    return {
      frecuencia,
      hora,
      dias,
      diasNombres,
      activo,
      titulo: data.titulo ?? data.Titulo ?? 'Registro emocional',
      mensaje: data.mensaje ?? data.Mensaje ?? 'Es momento de registrar cómo te sientes hoy.'
    };
  },

  /**
   * Genera el texto resumen para la tarjeta de configuración actual
   * Ejemplo: "Diaria 08:00 · Activa" o "Semanal 08:00 (Lun, Mié) · Activa"
   */
  formatearTextoResumen(config) {
    if (!config) return 'Sin configuración activa';

    const estado = config.activo ? 'Activa' : 'Desactivada';
    let base = `${config.frecuencia || 'Diaria'} ${config.hora || '08:00'} · ${estado}`;

    if (config.frecuencia === 'Semanal' && Array.isArray(config.diasNombres) && config.diasNombres.length > 0) {
      base = `${config.frecuencia} ${config.hora || '08:00'} (${config.diasNombres.join(', ')}) · ${estado}`;
    }

    return base;
  },

  /**
   * Lee la configuración guardada en el almacenamiento local
   */
  obtenerDeStorage() {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY_RECORDATORIO) || sessionStorage.getItem(STORAGE_KEY_RECORDATORIO);
      if (!dataStr) return null;
      return JSON.parse(dataStr);
    } catch {
      return null;
    }
  },

  /**
   * Guarda la configuración en el almacenamiento local
   */
  guardarEnStorage(config) {
    try {
      const str = JSON.stringify(config);
      localStorage.setItem(STORAGE_KEY_RECORDATORIO, str);
      sessionStorage.setItem(STORAGE_KEY_RECORDATORIO, str);
    } catch (e) {
      console.warn('No se pudo guardar la configuración en storage local', e);
    }
  },

  /**
   * Emite logs de auditoría estructurados con etiqueta [HU1-PB15]
   */
  logAuditoria(accion, detalle = '') {
    console.log('[HU1-PB15]', new Date().toLocaleTimeString(), accion, detalle);
  }
};
