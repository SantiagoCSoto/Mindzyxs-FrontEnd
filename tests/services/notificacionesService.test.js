import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  notificacionesService,
  listarNotificaciones,
  obtenerDetalleNotificacion,
  actualizarNotificacion,
  obtenerPreviewNotificacion,
  CANALES_DISPONIBLES,
  VARIABLES_DOCUMENTADAS
} from '../../js/services/notificacionesService.js';

describe('notificacionesService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe exponer constantes documentadas', () => {
    expect(CANALES_DISPONIBLES).toBeDefined();
    expect(VARIABLES_DOCUMENTADAS).toBeDefined();
    expect(notificacionesService.listarNotificaciones).toBeTypeOf('function');
  });

  describe('listarNotificaciones', () => {
    it('debe listar y normalizar las notificaciones', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          notificaciones: [
            { tipo: 'CODE_SENT', nombre: 'Código enviado', canales: ['correo'], activo: 1, asunto: 'Tu código' }
          ]
        }
      });

      const res = await listarNotificaciones();
      expect(res.ok).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].tipo).toBe('CODE_SENT');
      expect(res.data[0].activo).toBe(true);
    });

    it('debe manejar error al listar', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 500,
        error: 'Error interno'
      });

      const res = await listarNotificaciones();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error interno');
    });
  });

  describe('obtenerDetalleNotificacion', () => {
    it('debe validar que se envíe el tipo', async () => {
      const res = await obtenerDetalleNotificacion('');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('no válido');
    });

    it('debe retornar detalle de notificacion', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { tipo: 'RESET_PWD', nombre: 'Restablecer', canales: ['correo'], activo: true }
      });

      const res = await obtenerDetalleNotificacion('RESET_PWD');
      expect(res.ok).toBe(true);
      expect(res.data.tipo).toBe('RESET_PWD');
    });

    it('debe manejar error al obtener detalle', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: false,
        status: 404,
        error: 'Notificación no encontrada'
      });

      const res = await obtenerDetalleNotificacion('UNKNOWN');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Notificación no encontrada');
    });
  });

  describe('actualizarNotificacion', () => {
    it('debe validar que se proporcione el tipo', async () => {
      const res = await actualizarNotificacion(null, {});
      expect(res.ok).toBe(false);
    });

    it('debe actualizar notificacion exitosamente', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: true,
        data: { mensaje: 'Actualizada' }
      });

      const res = await actualizarNotificacion('CODE_SENT', {
        canales: ['correo'],
        activo: true,
        asunto: 'Nuevo asunto'
      });
      expect(res.ok).toBe(true);
      expect(res.mensaje).toBe('Actualizada');
    });

    it('debe manejar error al actualizar', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValue({
        ok: false,
        error: 'Fallo al actualizar'
      });

      const res = await actualizarNotificacion('CODE_SENT', {});
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Fallo al actualizar');
    });
  });

  describe('obtenerPreviewNotificacion', () => {
    it('debe validar que se proporcione el tipo', async () => {
      const res = await obtenerPreviewNotificacion('');
      expect(res.ok).toBe(false);
    });

    it('debe generar previsualización', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { tipo: 'CODE_SENT', asunto: 'Hola Juan' }
      });

      const res = await obtenerPreviewNotificacion('CODE_SENT', { nombre: 'Juan' });
      expect(res.ok).toBe(true);
      expect(res.data.asunto).toBe('Hola Juan');
    });

    it('debe manejar error al previsualizar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: false,
        error: 'Error de preview'
      });

      const res = await obtenerPreviewNotificacion('CODE_SENT');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Error de preview');
    });
  });
});
