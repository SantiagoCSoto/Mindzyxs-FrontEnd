/**
 * Servicio para Historial Emocional del Paciente (PB-13 / HU1-PB13)
 * Conecta con los endpoints del backend en /api/historial
 * Gestiona:
 *  - Consulta de lista de registros emocionales y cuestionarios ordenados por fecha (recientes primero)
 *  - Filtro por rango de fechas (desde / hasta)
 *  - Consulta de detalle de registro (nota propia, respuestas de cuestionario y apoyo del psicólogo)
 *  - Formateo de fechas, cálculo de etiquetas de estado emocional y auditoría en consola [HU1-PB13]
 */

import { getJson } from './apiClient.js';
import { authService } from './authService.js';

export const historialService = {
  /**
   * Obtiene la lista de registros del historial emocional del paciente,
   * opcionalmente filtrados por rango de fechas (desde / hasta en formato YYYY-MM-DD).
   * @param {string|null} desde - Fecha inicial (YYYY-MM-DD)
   * @param {string|null} hasta - Fecha final (YYYY-MM-DD)
   */
  async obtenerHistorial(desde = null, hasta = null) {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const qs = params.toString() ? `?${params.toString()}` : '';

    this.logAuditoria('CONSULTA de historial emocional:', qs || 'sin filtros de fecha');

    const res = await getJson(`/historial${qs}`);

    if (res.ok && Array.isArray(res.data)) {
      this.logAuditoria('ÉXITO Historial obtenido del backend:', `${res.data.length} registro(s)`);
      const itemsNormalizados = res.data.map(item => this.normalizarItem(item));
      return {
        exito: true,
        data: itemsNormalizados,
        total: itemsNormalizados.length
      };
    }

    // Si el backend no está disponible o hubo error de red, usamos datos de respaldo locales
    if (res.isNetworkError || !res.ok) {
      this.logAuditoria('FALLBACK Carga de historial local/demo por desconexión del backend');
      const itemsFallback = this.obtenerHistorialFallback(desde, hasta);
      return {
        exito: true,
        data: itemsFallback,
        total: itemsFallback.length,
        fallback: true
      };
    }

    return {
      exito: false,
      mensaje: res.error || 'No fue posible cargar el historial.',
      status: res.status,
      data: []
    };
  },

  /**
   * Obtiene el detalle de un registro específico (nota, respuestas y observaciones de apoyo)
   * @param {number} id - Identificador del evento en el historial
   */
  async obtenerDetalle(id) {
    this.logAuditoria(`CONSULTA de detalle para registro id=${id}`);

    const res = await getJson(`/historial/${id}`);

    if (res.ok && res.data) {
      this.logAuditoria(`ÉXITO Detalle obtenido para registro id=${id}`);
      return {
        exito: true,
        data: this.normalizarDetalle(res.data)
      };
    }

    // Si hubo desconexión, buscar en datos de respaldo locales
    if (res.isNetworkError || !res.ok) {
      this.logAuditoria(`FALLBACK Detalle local para id=${id}`);
      const fallbackItem = this.obtenerDetalleFallback(id);
      if (fallbackItem) {
        return {
          exito: true,
          data: fallbackItem,
          fallback: true
        };
      }
    }

    return {
      exito: false,
      mensaje: res.error || 'Registro no encontrado.',
      status: res.status
    };
  },

  /**
   * Normaliza un registro del historial recibido de la API a un formato estándar para el frontend
   */
  normalizarItem(item) {
    const id = item.id ?? item.Id ?? 0;
    const fechaRaw = item.fecha ?? item.Fecha ?? new Date().toISOString();
    const tipo = item.tipo ?? item.Tipo ?? 'RegistroEmocional';
    const puntaje = item.puntaje ?? item.Puntaje ?? null;
    const nivel = item.nivel ?? item.Nivel ?? null;
    const cuestionario = item.cuestionario ?? item.Cuestionario ?? null;
    const resumen = item.resumen ?? item.Resumen ?? '';

    const fechaFmt = this.formatearFecha(fechaRaw);
    const horaFmt = this.formatearHora(fechaRaw);
    const isoDate = fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;

    // Determinar categoría ('pos', 'neu', 'low'), emoji y texto de insignia
    let categoria = 'neu';
    let emoji = '😐';
    let valorTexto = 'Neutral (3/5)';

    if (tipo === 'RegistroEmocional') {
      if (puntaje !== null && puntaje >= 4) {
        categoria = 'pos';
        emoji = '😊';
        valorTexto = `Positivo (${puntaje}/5)`;
      } else if (puntaje === 3) {
        categoria = 'neu';
        emoji = '😐';
        valorTexto = 'Neutral (3/5)';
      } else if (puntaje !== null && puntaje <= 2) {
        categoria = 'low';
        emoji = '🙁';
        valorTexto = `Bajo (${puntaje}/5)`;
      }
    } else {
      // Cuestionario de bienestar emocional
      const nivelLower = (nivel || '').toLowerCase();
      if (nivelLower.includes('bajo')) {
        categoria = 'pos';
        emoji = '😊';
        valorTexto = `${cuestionario || 'Cuestionario'} · Riesgo Bajo`;
      } else if (nivelLower.includes('medio') || nivelLower.includes('moderado') || nivelLower.includes('regular')) {
        categoria = 'neu';
        emoji = '😐';
        valorTexto = `${cuestionario || 'Cuestionario'} · Riesgo Medio`;
      } else {
        categoria = 'low';
        emoji = '🙁';
        valorTexto = `${cuestionario || 'Cuestionario'} · Riesgo Alto`;
      }
    }

    return {
      id,
      fecha: fechaFmt,
      hora: horaFmt,
      fechaRaw,
      isoDate,
      tipo,
      puntaje,
      nivel,
      cuestionario,
      resumen: resumen || (tipo === 'RegistroEmocional' ? 'Registro de estado de ánimo' : 'Cuestionario de bienestar'),
      categoria,
      emoji,
      valorTexto
    };
  },

  /**
   * Normaliza el detalle completo de un registro
   */
  normalizarDetalle(detalle) {
    const base = this.normalizarItem(detalle);
    const nota = detalle.nota ?? detalle.Nota ?? null;
    const respuestas = (detalle.respuestas ?? detalle.Respuestas ?? []).map(r => ({
      pregunta: r.pregunta ?? r.Pregunta ?? '',
      valor: r.valor ?? r.Valor ?? null,
      texto: r.texto ?? r.Texto ?? null
    }));
    const observaciones = (detalle.observaciones ?? detalle.Observaciones ?? []).map(o => ({
      contenido: o.contenido ?? o.Contenido ?? '',
      firma: o.firma ?? o.Firma ?? 'Psicólogo asignado',
      fecha: this.formatearFecha(o.fecha ?? o.Fecha ?? base.fechaRaw)
    }));

    return {
      ...base,
      nota,
      respuestas,
      observaciones
    };
  },

  /**
   * Formatea una fecha ISO a DD/MM/YYYY
   */
  formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr.split('T')[0];
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return fechaStr;
    }
  },

  /**
   * Formatea la hora a HH:mm
   */
  formatearHora(fechaStr) {
    if (!fechaStr) return '00:00';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return '00:00';
      const hora = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${hora}:${min}`;
    } catch {
      return '00:00';
    }
  },

  /**
   * Emite logs de auditoría estructurados con etiqueta [HU1-PB13]
   */
  logAuditoria(accion, detalle = '') {
    console.log('[HU1-PB13]', new Date().toLocaleTimeString(), accion, detalle);
  },

  /**
   * Datos de respaldo para pruebas locales sin conexión al backend
   */
  obtenerHistorialFallback(desde = null, hasta = null) {
    const listaDemo = [
      {
        id: 1,
        fechaRaw: '2026-09-22T20:35:00',
        tipo: 'RegistroEmocional',
        puntaje: 4,
        nivel: 'Bajo',
        resumen: 'Día tranquilo, dormí bien y me sentí con energía.',
        nota: 'Jornada estable. Buen descanso nocturno y ánimo alto durante la tarde.',
        respuestas: [],
        observaciones: [
          {
            contenido: 'Excelente evolución. Se recomienda mantener la rutina de descanso y caminatas.',
            firma: 'Dra. Sofía Martínez · Psicóloga',
            fecha: '2026-09-23T09:00:00'
          }
        ]
      },
      {
        id: 2,
        fechaRaw: '2026-09-18T09:15:00',
        tipo: 'RegistroEmocional',
        puntaje: 3,
        nivel: 'Medio',
        resumen: 'Mañana con algo de cansancio, ánimo regular.',
        nota: 'Desperté con poca energía. El ánimo mejoró levemente después de caminar.',
        respuestas: [],
        observaciones: []
      },
      {
        id: 3,
        fechaRaw: '2026-09-10T21:05:00',
        tipo: 'Cuestionario',
        puntaje: 8,
        nivel: 'Alto',
        cuestionario: 'Cuestionario de Bienestar Emocional',
        resumen: 'Día pesado, preocupación por el trabajo.',
        nota: 'Noche con ansiedad leve. Me costó concentrarme durante el día.',
        respuestas: [
          { pregunta: '¿Con qué frecuencia te has sentido ansioso/a últimamente?', valor: 4, texto: 'Casi todos los días' },
          { pregunta: '¿Cómo calificarías tu calidad de sueño esta semana?', valor: 2, texto: 'Mala o irregular' }
        ],
        observaciones: [
          {
            contenido: 'Recuerda utilizar la técnica de respiración 4-7-8 antes de dormir.',
            firma: 'Dr. Carlos Mendoza · Psicólogo',
            fecha: '2026-09-11T10:15:00'
          }
        ]
      }
    ];

    return listaDemo
      .map(item => this.normalizarItem(item))
      .filter(r => {
        if (desde && r.isoDate < desde) return false;
        if (hasta && r.isoDate > hasta) return false;
        return true;
      });
  },

  /**
   * Detalle de respaldo para pruebas locales
   */
  obtenerDetalleFallback(id) {
    const lista = this.obtenerHistorialFallback();
    const item = lista.find(x => x.id === Number(id));
    if (!item) return null;

    if (item.id === 1) {
      return this.normalizarDetalle({
        ...item,
        nota: 'Jornada estable. Buen descanso nocturno y ánimo alto durante la tarde.',
        respuestas: [],
        observaciones: [
          {
            contenido: 'Excelente evolución. Se recomienda mantener la rutina de descanso y caminatas.',
            firma: 'Dra. Sofía Martínez · Psicóloga',
            fecha: '2026-09-23T09:00:00'
          }
        ]
      });
    }

    if (item.id === 2) {
      return this.normalizarDetalle({
        ...item,
        nota: 'Desperté con poca energía. El ánimo mejoró levemente después de caminar.',
        respuestas: [],
        observaciones: []
      });
    }

    return this.normalizarDetalle({
      ...item,
      nota: 'Noche con ansiedad leve. Me costó concentrarme durante el día.',
      respuestas: [
        { pregunta: '¿Con qué frecuencia te has sentido ansioso/a últimamente?', valor: 4, texto: 'Casi todos los días' },
        { pregunta: '¿Cómo calificarías tu calidad de sueño esta semana?', valor: 2, texto: 'Mala o irregular' }
      ],
      observaciones: [
        {
          contenido: 'Recuerda utilizar la técnica de respiración 4-7-8 antes de dormir.',
          firma: 'Dr. Carlos Mendoza · Psicólogo',
          fecha: '2026-09-11T10:15:00'
        }
      ]
    });
  }
};
