import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordatorioService, DIAS_MAP, DIAS_REVERSE } from '../../js/services/recordatorioService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('recordatorioService.js', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('constantes y mapeos', () => {
    it('mapea correctamente días a texto y viceversa', () => {
      expect(DIAS_MAP[1]).toBe('Lun');
      expect(DIAS_MAP[7]).toBe('Dom');
      expect(DIAS_REVERSE['Lun']).toBe(1);
      expect(DIAS_REVERSE['Mar']).toBe(2);
      expect(DIAS_REVERSE['Mié']).toBe(3);
      expect(DIAS_REVERSE['Mie']).toBe(3);
      expect(DIAS_REVERSE['Jue']).toBe(4);
      expect(DIAS_REVERSE['Vie']).toBe(5);
      expect(DIAS_REVERSE['Sáb']).toBe(6);
      expect(DIAS_REVERSE['Sab']).toBe(6);
      expect(DIAS_REVERSE['Dom']).toBe(7);
    });
  });

  describe('obtenerConfiguracion', () => {
    it('obtiene configuración del backend y la guarda en storage', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          frecuencia: 'Diaria',
          hora: '09:00',
          activo: true
        }
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.data.hora).toBe('09:00');
      expect(res.noConfigurado).toBe(false);
    });

    it('maneja 204 No Content cuando no está configurado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        status: 204
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.noConfigurado).toBe(true);
      expect(res.data).toBeNull();
    });

    it('maneja res.ok pero sin res.data como no configurado', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        status: 200,
        data: null
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.noConfigurado).toBe(true);
    });

    it('utiliza fallback desde storage ante desconexión', async () => {
      recordatorioService.guardarEnStorage({
        frecuencia: 'Semanal',
        hora: '10:00',
        dias: [1, 3],
        diasNombres: ['Lun', 'Mié'],
        activo: true
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.frecuencia).toBe('Semanal');
    });

    it('utiliza fallback demo sugerido si no hay nada en storage', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerConfiguracion();
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.frecuencia).toBe('Diaria');
    });
  });

  describe('guardarConfiguracion', () => {
    it('valida que existan frecuencia y hora', async () => {
      const res = await recordatorioService.guardarConfiguracion({});
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('Debes seleccionar');

      const resSinHora = await recordatorioService.guardarConfiguracion({ frecuencia: 'Diaria' });
      expect(resSinHora.exito).toBe(false);
    });

    it('valida que en frecuencia semanal se seleccione al menos un día', async () => {
      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Semanal',
        hora: '08:00',
        dias: []
      });
      expect(res.exito).toBe(false);
      expect(res.mensaje).toContain('al menos un día');
    });

    it('guarda exitosamente en backend con dias numéricos o strings y custom title/mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {
          mensaje: 'Configuración guardada'
        }
      });

      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Semanal',
        hora: '08:00',
        dias: ['Lun', 'Vie', 3],
        activo: false,
        titulo: 'Alerta',
        mensaje: 'Toca registrarse'
      });
      expect(res.exito).toBe(true);
      expect(res.data.dias).toEqual([1, 5, 3]);
      expect(res.data.activo).toBe(false);
      expect(res.mensaje).toBe('Configuración guardada');
    });

    it('guarda exitosamente con mensaje default si backend data no incluye mensaje', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: {}
      });

      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Diaria',
        hora: '08:00',
        activo: true
      });
      expect(res.exito).toBe(true);
      expect(res.mensaje).toBe('Recordatorios configurados correctamente');
    });

    it('aplica fallback local si la petición falla por error de red o !ok', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.guardarConfiguracion({
        frecuencia: 'Diaria',
        hora: '14:00',
        activo: true
      });
      expect(res.exito).toBe(true);
      expect(res.fallback).toBe(true);
      expect(res.data.hora).toBe('14:00');
    });
  });

  describe('obtenerAvisosHoy', () => {
    it('obtiene lista de avisos del backend', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ titulo: 'Aviso 1' }]
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
    });

    it('utiliza fallback local comprobando hora ya pasada', async () => {
      recordatorioService.guardarEnStorage({
        frecuencia: 'Diaria',
        hora: '00:00',
        activo: true
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].titulo).toContain('registro emocional');
    });

    it('fallback local devuelve array vacío si la hora aún no ha pasado', async () => {
      recordatorioService.guardarEnStorage({
        frecuencia: 'Diaria',
        hora: '23:59',
        activo: true
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data).toEqual([]);
    });

    it('fallback local comprueba frecuencia semanal para hoy', async () => {
      const hoy = new Date();
      const diaHoy = hoy.getDay() === 0 ? 7 : hoy.getDay();

      recordatorioService.guardarEnStorage({
        frecuencia: 'Semanal',
        dias: [diaHoy],
        hora: '00:01',
        activo: true,
        titulo: 'Aviso semanal',
        mensaje: 'Mensaje semanal'
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        isNetworkError: true
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].titulo).toBe('Aviso semanal');
    });

    it('fallback local devuelve vacío si recordatorio no está activo o no hay en storage', async () => {
      recordatorioService.guardarEnStorage({
        frecuencia: 'Diaria',
        hora: '00:01',
        activo: false
      });

      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false
      });

      const res = await recordatorioService.obtenerAvisosHoy();
      expect(res.exito).toBe(true);
      expect(res.data).toEqual([]);
    });
  });

  describe('normalizarConfig', () => {
    it('retorna null si data es falsy', () => {
      expect(recordatorioService.normalizarConfig(null)).toBeNull();
      expect(recordatorioService.normalizarConfig(undefined)).toBeNull();
    });

    it('normaliza propiedades con PascalCase y días sin array', () => {
      const config = recordatorioService.normalizarConfig({
        Frecuencia: 'Semanal',
        Hora: '11:00',
        Activo: false,
        Dias: ['Mar', 4],
        Titulo: 'Título custom',
        Mensaje: 'Mensaje custom'
      });
      expect(config.frecuencia).toBe('Semanal');
      expect(config.hora).toBe('11:00');
      expect(config.activo).toBe(false);
      expect(config.dias).toEqual([2, 4]);
      expect(config.diasNombres).toEqual(['Mar', 'Jue']);
    });

    it('maneja dias no array', () => {
      const config = recordatorioService.normalizarConfig({
        dias: null
      });
      expect(config.dias).toEqual([]);
    });
  });

  describe('formatearTextoResumen', () => {
    it('formatea resumen diario activo', () => {
      const texto = recordatorioService.formatearTextoResumen({
        frecuencia: 'Diaria',
        hora: '08:00',
        activo: true
      });
      expect(texto).toBe('Diaria 08:00 · Activa');
    });

    it('formatea resumen semanal con días desactivado', () => {
      const texto = recordatorioService.formatearTextoResumen({
        frecuencia: 'Semanal',
        hora: '10:00',
        diasNombres: ['Lun', 'Mié'],
        activo: false
      });
      expect(texto).toBe('Semanal 10:00 (Lun, Mié) · Desactivada');
    });

    it('retorna texto por defecto si es nulo o vacío', () => {
      expect(recordatorioService.formatearTextoResumen(null)).toBe('Sin configuración activa');
    });

    it('aplica defaults si frecuencia u hora no están definidos', () => {
      const texto = recordatorioService.formatearTextoResumen({ activo: true });
      expect(texto).toBe('Diaria 08:00 · Activa');
    });
  });

  describe('storage fallback y manejo de errores', () => {
    it('lee de sessionStorage si no está en localStorage', () => {
      sessionStorage.setItem('recordatorio_emocional_config', JSON.stringify({ frecuencia: 'Diaria', hora: '12:00' }));
      const config = recordatorioService.obtenerDeStorage();
      expect(config.hora).toBe('12:00');
    });

    it('maneja json inválido en storage', () => {
      localStorage.setItem('recordatorio_emocional_config', 'invalido-json{');
      expect(recordatorioService.obtenerDeStorage()).toBeNull();
    });

    it('maneja error en guardarEnStorage', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      recordatorioService.guardarEnStorage({ hora: '10:00' });
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
