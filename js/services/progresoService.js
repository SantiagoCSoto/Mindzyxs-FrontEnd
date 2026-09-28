/**
 * Servicio para Progreso Emocional de Pacientes (PB-14 / HU1-PB14)
 * Conecta con los endpoints del backend en /api/progreso
 * Exclusivo para psicólogos:
 *  - Consulta de lista de pacientes autorizados (GET /api/progreso/pacientes)
 *  - Consulta de métricas y serie temporal para gráficos (GET /api/progreso/{idPaciente})
 *  - Detección de falta de autorización (403 Forbidden)
 *  - Normalización de datos para gráficos SVG, KPIs y auditoría en consola [HU1-PB14]
 */

import { getJson } from './apiClient.js';
import { authService } from './authService.js';

export const progresoService = {
  /**
   * Obtiene la lista de pacientes autorizados asignados al psicólogo en sesión
   */
  async obtenerPacientesAutorizados() {
    this.logAuditoria('CONSULTA de pacientes autorizados');

    const res = await getJson('/progreso/pacientes');

    if (res.ok && Array.isArray(res.data)) {
      this.logAuditoria('ÉXITO Pacientes autorizados obtenidos:', `${res.data.length} paciente(s)`);
      return {
        exito: true,
        data: res.data.map(p => ({
          id: p.id ?? p.Id,
          nombre: p.nombre ?? p.Nombre
        }))
      };
    }

    // Modo respaldo sin backend o fallo de conexión
    if (res.isNetworkError || !res.ok) {
      this.logAuditoria('FALLBACK Carga de pacientes autorizados demo');
      return {
        exito: true,
        data: this.obtenerPacientesFallback(),
        fallback: true
      };
    }

    return {
      exito: false,
      mensaje: res.error || 'No fue posible cargar la lista de pacientes.',
      status: res.status,
      data: []
    };
  },

  /**
   * Obtiene la serie temporal y estadísticas del paciente en el rango de fechas
   * @param {number} idPaciente - Id del paciente a consultar
   * @param {string|null} desde - Fecha inicial (YYYY-MM-DD)
   * @param {string|null} hasta - Fecha final (YYYY-MM-DD)
   */
  async obtenerProgresoPaciente(idPaciente, desde = null, hasta = null) {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const qs = params.toString() ? `?${params.toString()}` : '';

    this.logAuditoria(`CONSULTA de progreso para paciente id=${idPaciente}`, qs || 'sin filtros de fecha');

    const res = await getJson(`/progreso/${idPaciente}${qs}`);

    // Caso 1: Paciente no autorizado (403 Forbidden)
    if (res.status === 403 || (res.error && res.error.toLowerCase().includes('autoriza'))) {
      this.logAuditoria(`BLOQUEO: paciente no autorizado id=${idPaciente}`);
      return {
        exito: false,
        noAutorizado: true,
        mensaje: res.error || 'No tienes autorización para ver los registros de este paciente.',
        status: 403
      };
    }

    // Caso 2: Éxito con datos
    if (res.ok && res.data) {
      this.logAuditoria(`ÉXITO Progreso obtenido para paciente id=${idPaciente}`);
      return {
        exito: true,
        data: this.normalizarProgreso(res.data)
      };
    }

    // Caso 3: Fallback si el backend está desconectado
    if (res.isNetworkError || !res.ok) {
      this.logAuditoria(`FALLBACK Progreso local para paciente id=${idPaciente}`);
      const fallbackData = this.obtenerProgresoFallback(idPaciente, desde, hasta);

      if (fallbackData.noAutorizado) {
        return {
          exito: false,
          noAutorizado: true,
          mensaje: 'No tienes autorización para ver los registros de este paciente.',
          status: 403,
          fallback: true
        };
      }

      return {
        exito: true,
        data: fallbackData,
        fallback: true
      };
    }

    return {
      exito: false,
      mensaje: res.error || 'Error al obtener el progreso del paciente.',
      status: res.status
    };
  },

  /**
   * Normaliza la respuesta del backend para el gráfico y las tarjetas estadísticas
   */
  normalizarProgreso(data) {
    const promedio = data.promedio ?? data.Promedio ?? null;
    const tendenciaRaw = data.tendencia ?? data.Tendencia ?? 'Estable';
    const totalRegistros = data.totalRegistros ?? data.TotalRegistros ?? 0;
    const suficientes = data.suficientes ?? data.Suficientes ?? (totalRegistros >= 2);

    const serieRaw = data.serie ?? data.Serie ?? [];
    const serieNormalizada = serieRaw.map(pt => {
      const fechaRaw = pt.fecha ?? pt.Fecha ?? '';
      return {
        fecha: fechaRaw,
        fechaCorta: this.formatearFechaCorta(fechaRaw),
        puntaje: pt.puntaje ?? pt.Puntaje ?? null,
        nivel: pt.nivel ?? pt.Nivel ?? null
      };
    });

    const porSemana = (data.porSemana ?? data.PorSemana ?? []).map(s => ({
      semana: s.semana ?? s.Semana ?? '',
      registros: s.registros ?? s.Registros ?? 0,
      promedio: s.promedio ?? s.Promedio ?? null
    }));

    const distribucion = data.distribucion ?? data.Distribucion ?? {};

    return {
      promedio: promedio !== null ? Number(promedio).toFixed(1) : null,
      tendencia: this.formatearTendencia(tendenciaRaw),
      tendenciaRaw,
      totalRegistros,
      suficientes,
      serie: serieNormalizada,
      porSemana,
      distribucion
    };
  },

  /**
   * Formatea la tendencia a un texto legible con icono descriptivo
   * @param {string} tendencia 
   */
  formatearTendencia(tendencia) {
    const t = (tendencia || '').toLowerCase();
    if (t.includes('sube') || t.includes('mejora')) return '↗ Mejorando';
    if (t.includes('baja')) return '↘ Bajando';
    return '→ Estable';
  },

  /**
   * Formatea una fecha ISO a DD/MM
   */
  formatearFechaCorta(fechaStr) {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) {
        const partes = fechaStr.split('T')[0].split('-');
        return partes.length === 3 ? `${partes[2]}/${partes[1]}` : fechaStr;
      }
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}`;
    } catch {
      return fechaStr;
    }
  },

  /**
   * Emite logs de auditoría estructurados con etiqueta [HU1-PB14]
   */
  logAuditoria(accion, detalle = '') {
    console.log('[HU1-PB14]', new Date().toLocaleTimeString(), accion, detalle);
  },

  /**
   * Pacientes de demostración para pruebas locales
   */
  obtenerPacientesFallback() {
    return [
      { id: 1, nombre: 'Camila Rojas', autorizada: true },
      { id: 2, nombre: 'Juan Pérez', autorizada: true },
      { id: 99, nombre: 'Paciente No Autorizado', autorizada: false }
    ];
  },

  /**
   * Datos de progreso de demostración basados en el mockup
   */
  obtenerProgresoFallback(idPaciente, desde = null, hasta = null) {
    if (Number(idPaciente) === 99) {
      return { noAutorizado: true };
    }

    const esCamila = Number(idPaciente) === 1;

    const serieBase = esCamila
      ? [
          { fecha: '2026-09-01T10:00:00', fechaCorta: '01/09', puntaje: 2, nivel: 'Bajo' },
          { fecha: '2026-09-02T11:00:00', fechaCorta: '02/09', puntaje: 3, nivel: 'Medio' },
          { fecha: '2026-09-03T09:30:00', fechaCorta: '03/09', puntaje: 3, nivel: 'Medio' },
          { fecha: '2026-09-04T16:00:00', fechaCorta: '04/09', puntaje: 4, nivel: 'Bajo' },
          { fecha: '2026-09-05T12:00:00', fechaCorta: '05/09', puntaje: 3, nivel: 'Medio' },
          { fecha: '2026-09-06T18:00:00', fechaCorta: '06/09', puntaje: 4, nivel: 'Bajo' },
          { fecha: '2026-09-07T20:00:00', fechaCorta: '07/09', puntaje: 5, nivel: 'Bajo' }
        ]
      : [
          { fecha: '2026-09-01T08:00:00', fechaCorta: '01/09', puntaje: 4, nivel: 'Bajo' },
          { fecha: '2026-09-02T10:00:00', fechaCorta: '02/09', puntaje: 4, nivel: 'Bajo' },
          { fecha: '2026-09-03T15:00:00', fechaCorta: '03/09', puntaje: 3, nivel: 'Medio' },
          { fecha: '2026-09-04T12:00:00', fechaCorta: '04/09', puntaje: 2, nivel: 'Alto' },
          { fecha: '2026-09-05T14:00:00', fechaCorta: '05/09', puntaje: 3, nivel: 'Medio' },
          { fecha: '2026-09-06T19:00:00', fechaCorta: '06/09', puntaje: 2, nivel: 'Alto' },
          { fecha: '2026-09-07T21:00:00', fechaCorta: '07/09', puntaje: 3, nivel: 'Medio' }
        ];

    // Filtrar por fechas si aplican
    const serieFiltrada = serieBase.filter(pt => {
      const iso = pt.fecha.split('T')[0];
      if (desde && iso < desde) return false;
      if (hasta && iso > hasta) return false;
      return true;
    });

    const total = serieFiltrada.length;
    const suficientes = total >= 2;

    if (!suficientes) {
      return {
        promedio: null,
        tendencia: '→ Estable',
        totalRegistros: total,
        suficientes: false,
        serie: serieFiltrada,
        porSemana: [],
        distribucion: {}
      };
    }

    const suma = serieFiltrada.reduce((acc, curr) => acc + curr.puntaje, 0);
    const prom = (suma / total).toFixed(1);
    const diff = serieFiltrada[total - 1].puntaje - serieFiltrada[0].puntaje;
    const tendenciaTexto = diff > 0 ? '↗ Mejorando' : (diff < 0 ? '↘ Bajando' : '→ Estable');

    return {
      promedio: prom,
      tendencia: tendenciaTexto,
      totalRegistros: total,
      suficientes: true,
      serie: serieFiltrada,
      porSemana: [],
      distribucion: {}
    };
  }
};
