import { describe, it, expect, beforeEach, vi } from 'vitest';
import { observacionesService } from '../../js/services/observacionesService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('observacionesService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valida que el idPaciente sea obligatorio', async () => {
    const res = await observacionesService.crearObservacion({ idPaciente: null, contenido: 'Nota' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('especificar el paciente');
  });

  it('valida que el contenido no esté vacío', async () => {
    const res = await observacionesService.crearObservacion({ idPaciente: 10, contenido: '   ' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('obligatoria');
  });

  it('crea observación exitosamente', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      ok: true,
      data: { mensaje: 'Observación guardada correctamente' }
    });

    const res = await observacionesService.crearObservacion({
      idPaciente: 10,
      idEvento: 5,
      contenido: 'Evolución positiva'
    });
    expect(res.ok).toBe(true);
    expect(res.mensaje).toContain('correctamente');
  });

  it('maneja error cuando falla la creación', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Paciente no autorizado'
    });

    const res = await observacionesService.crearObservacion({
      idPaciente: 10,
      contenido: 'Evolución positiva'
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Paciente no autorizado');
  });
});
