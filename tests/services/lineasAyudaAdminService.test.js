import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../js/services/apiClient.js';
import {
  listarLineas,
  obtenerLinea,
  crearLinea,
  actualizarLinea,
  activarLinea,
  inactivarLinea,
  eliminarLinea
} from '../../js/services/lineasAyudaAdminService.js';

describe('lineasAyudaAdminService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listarLineas', () => {
    it('debe listar lineas de ayuda', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, nombre: 'Línea 106', telefono: '106', estado: 'Activa' }]
      });

      const res = await listarLineas('106');
      expect(res).toHaveLength(1);
      expect(res[0].nombre).toBe('Línea 106');
    });

    it('debe mapear con res.data.lineas y PascalCase', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          lineas: [{ Id: 2, Nombre: 'Línea 123', Telefono: '123', Url: 'http://123.com', Estado: 'Activa' }]
        }
      });

      const res = await listarLineas('');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(2);
      expect(res[0].nombre).toBe('Línea 123');
    });

    it('debe manejar data nula retornando arreglo vacío', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: null
      });

      const res = await listarLineas();
      expect(res).toEqual([]);
    });

    it('debe lanzar error con y sin mensaje de backend al fallar listar', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        error: 'Fallo al listar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(listarLineas()).rejects.toThrow('Fallo al listar');
      await expect(listarLineas()).rejects.toThrow('No fue posible cargar las líneas de ayuda. Intente nuevamente');
    });
  });

  describe('obtenerLinea', () => {
    it('debe obtener detalle de una linea en minúsculas', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: { id: 1, nombre: 'Línea 106', telefono: '106', estado: 'Activa' }
      });

      const res = await obtenerLinea(1);
      expect(res.id).toBe(1);
      expect(res.nombre).toBe('Línea 106');
    });

    it('debe obtener detalle de una linea en mayúsculas o data vacía', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: {
          Id: 2,
          Nombre: 'Línea 192',
          Descripcion: 'Salud mental',
          Telefono: '192',
          Url: 'https://minsalud.gov.co',
          Horario: '24/7',
          Cobertura: 'Nacional',
          DescripcionCorta: 'Nacional 24/7',
          Whatsapp: '3000000000',
          Email: 'info@minsalud.gov.co',
          ChatUrl: 'https://chat.minsalud.gov.co',
          Videollamada: 'No',
          TipoAtencion: 'Telefónica',
          Departamento: 'Cundinamarca',
          Municipio: 'Bogotá',
          Poblacion: 'General',
          Fuente: 'MinSalud',
          FechaVerificacion: '2026-01-01',
          Estado: 'Activa'
        }
      });

      const res = await obtenerLinea(2);
      expect(res.id).toBe(2);
      expect(res.nombre).toBe('Línea 192');
      expect(res.telefono).toBe('192');
      expect(res.cobertura).toBe('Nacional');
    });

    it('debe lanzar error con y sin mensaje de backend si no existe la linea', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValueOnce({
        ok: false,
        error: 'Línea de ayuda no encontrada.'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(obtenerLinea(99)).rejects.toThrow('Línea de ayuda no encontrada.');
      await expect(obtenerLinea(99)).rejects.toThrow('No fue posible cargar la línea de ayuda. Intente nuevamente');
    });
  });

  describe('crearLinea', () => {
    it('debe crear una linea con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { id: 3, mensaje: 'Creada con éxito' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await crearLinea({ nombre: 'Línea de Vida' });
      expect(res1.id).toBe(3);
      expect(res1.mensaje).toBe('Creada con éxito');

      const res2 = await crearLinea({});
      expect(res2.mensaje).toBe('Línea de ayuda creada correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar crear', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Nombre duplicado'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(crearLinea({})).rejects.toThrow('Nombre duplicado');
      await expect(crearLinea({})).rejects.toThrow('Debes ingresar nombre y al menos un medio de contacto');
    });
  });

  describe('actualizarLinea', () => {
    it('debe actualizar una linea con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: true,
        data: { id: 3, mensaje: 'Actualizada con éxito' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await actualizarLinea(3, { nombre: 'Línea Modificada' });
      expect(res1.id).toBe(3);
      expect(res1.mensaje).toBe('Actualizada con éxito');

      const res2 = await actualizarLinea(3, {});
      expect(res2.mensaje).toBe('Línea de ayuda actualizada correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar actualizar', async () => {
      vi.spyOn(apiClient, 'putJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error de validación'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(actualizarLinea(3, {})).rejects.toThrow('Error de validación');
      await expect(actualizarLinea(3, {})).rejects.toThrow('Debes ingresar nombre y al menos un medio de contacto');
    });
  });

  describe('activarLinea', () => {
    it('debe activar linea con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Línea activada' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await activarLinea(1);
      expect(res1.mensaje).toBe('Línea activada');

      const res2 = await activarLinea(1);
      expect(res2.mensaje).toBe('Línea de ayuda activada correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar activar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'No se puede activar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(activarLinea(1)).rejects.toThrow('No se puede activar');
      await expect(activarLinea(1)).rejects.toThrow('Línea de ayuda no encontrada.');
    });
  });

  describe('inactivarLinea', () => {
    it('debe inactivar linea con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Línea inactivada' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await inactivarLinea(1);
      expect(res1.mensaje).toBe('Línea inactivada');

      const res2 = await inactivarLinea(1);
      expect(res2.mensaje).toBe('Línea de ayuda inactivada correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar inactivar', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
        ok: false,
        error: 'Error'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(inactivarLinea(1)).rejects.toThrow('Error');
      await expect(inactivarLinea(1)).rejects.toThrow('Línea de ayuda no encontrada.');
    });
  });

  describe('eliminarLinea', () => {
    it('debe eliminar linea con mensaje devuelto o fallback', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValueOnce({
        ok: true,
        data: { mensaje: 'Línea eliminada' }
      }).mockResolvedValueOnce({
        ok: true,
        data: null
      });

      const res1 = await eliminarLinea(1);
      expect(res1.mensaje).toBe('Línea eliminada');

      const res2 = await eliminarLinea(1);
      expect(res2.mensaje).toBe('Línea de ayuda eliminada correctamente');
    });

    it('debe lanzar error con y sin mensaje de backend al fallar eliminar', async () => {
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValueOnce({
        ok: false,
        error: 'No se puede eliminar'
      }).mockResolvedValueOnce({
        ok: false,
        error: ''
      });

      await expect(eliminarLinea(1)).rejects.toThrow('No se puede eliminar');
      await expect(eliminarLinea(1)).rejects.toThrow('Línea de ayuda no encontrada.');
    });
  });
});
