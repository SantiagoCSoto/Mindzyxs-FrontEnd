import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invitadoService, PANEL_INVITADO_DEFAULT } from '../../js/services/invitadoService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('invitadoService.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('obtenerConfiguracionPanel debe retornar datos del backend si responde ok', async () => {
    vi.spyOn(apiClient, 'getJson').mockResolvedValue({
      ok: true,
      data: {
        avisoObligatorio: false,
        disponibles: [{ codigo: 'cuestionario' }],
        exclusivas: [{ codigo: 'historial' }]
      }
    });

    const config = await invitadoService.obtenerConfiguracionPanel();
    expect(config.exito).toBe(true);
    expect(config.avisoObligatorio).toBe(false);
    expect(config.disponibles.length).toBe(1);
  });

  it('obtenerConfiguracionPanel debe usar fallback si backend falla', async () => {
    vi.spyOn(apiClient, 'getJson').mockResolvedValue({ ok: false });

    const config = await invitadoService.obtenerConfiguracionPanel();
    expect(config.exito).toBe(true);
    expect(config.offline).toBe(true);
    expect(config.disponibles).toEqual(PANEL_INVITADO_DEFAULT.disponibles);
  });

  it('iniciarModoInvitado debe configurar sessionStorage y llamar al endpoint de acceso', async () => {
    const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });

    await invitadoService.iniciarModoInvitado('landing');

    expect(sessionStorage.getItem('es_invitado')).toBe('true');
    expect(sessionStorage.getItem('autenticado')).toBe('false');
    const u = JSON.parse(sessionStorage.getItem('usuario'));
    expect(u.esInvitado).toBe(true);
    expect(postSpy).toHaveBeenCalledWith('/invitado/acceso', { origen: 'landing', resultado: 'ok' });
  });

  it('registrarBloqueo debe enviar la función bloqueada al backend', async () => {
    const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });

    await invitadoService.registrarBloqueo('historial');
    expect(postSpy).toHaveBeenCalledWith('/invitado/bloqueo', { funcion: 'historial' });
  });

  it('salirModoInvitado debe limpiar sesión y notificar salida', async () => {
    sessionStorage.setItem('es_invitado', 'true');
    sessionStorage.setItem('autenticado', 'false');
    sessionStorage.setItem('usuario', '{}');

    const postSpy = vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true });

    await invitadoService.salirModoInvitado('panel');

    expect(sessionStorage.getItem('es_invitado')).toBeNull();
    expect(sessionStorage.getItem('usuario')).toBeNull();
    expect(postSpy).toHaveBeenCalledWith('/invitado/salida', { origen: 'panel' });
  });

  it('esInvitado debe verificar correctamente el estado en sessionStorage', () => {
    expect(invitadoService.esInvitado()).toBe(false);
    sessionStorage.setItem('es_invitado', 'true');
    expect(invitadoService.esInvitado()).toBe(true);
  });
});
