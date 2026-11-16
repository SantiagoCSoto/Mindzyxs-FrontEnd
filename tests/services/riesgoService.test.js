import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as riesgoService from '../../js/services/riesgoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('riesgoService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calcularRiesgo retorna resultado si la respuesta es exitosa', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      ok: true,
      data: { nivel: 'Alto', puntaje: 4, alerta: { mostrar: true } }
    });

    const res = await riesgoService.calcularRiesgo(1, [{ preguntaId: 1, opcionId: 2 }]);
    expect(res.nivel).toBe('Alto');
    expect(res.puntaje).toBe(4);
  });

  it('calcularRiesgo lanza error si la petición falla', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      ok: false,
      error: 'Error calculando riesgo'
    });

    await expect(riesgoService.calcularRiesgo(1, [])).rejects.toThrow('Error calculando riesgo');
  });

  it('obtenerLineas devuelve las líneas activas', async () => {
    vi.spyOn(apiClient, 'getJson').mockResolvedValue({
      ok: true,
      data: [{ id: 1, nombre: 'Línea 106' }]
    });

    const lineas = await riesgoService.obtenerLineas();
    expect(lineas.length).toBe(1);
    expect(lineas[0].nombre).toBe('Línea 106');
  });

  it('obtenerLineas lanza error si la petición falla', async () => {
    vi.spyOn(apiClient, 'getJson').mockResolvedValue({
      ok: false
    });

    await expect(riesgoService.obtenerLineas()).rejects.toThrow('No fue posible cargar las líneas de ayuda');
  });
});
