import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('inicioController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/inicio.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/inicio.html';
    window.location.reload = vi.fn();
    vi.restoreAllMocks();
  });

  it('debe inicializar la landing y pintar encabezado sin sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(false);

    await import('../../js/controllers/inicioController.js');

    const headerGuest = document.getElementById('headerGuest');
    expect(headerGuest.style.display).toBe('inline-flex');
  });

  it('debe pintar encabezado con sesión activa', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(false);

    await import('../../js/controllers/inicioController.js');

    const headerSesion = document.getElementById('headerSesion');
    expect(headerSesion.style.display).toBe('inline-flex');
  });

  it('debe permitir abrir y cerrar el modal de aviso aclaratorio', async () => {
    const { avisoService } = await import('../../js/services/avisoService.js');
    vi.spyOn(avisoService, 'registrarVisualizacion').mockResolvedValue();
    vi.spyOn(avisoService, 'marcarAvisoAceptado').mockReturnValue();

    await import('../../js/controllers/inicioController.js');

    const footerAviso = document.getElementById('footerAviso');
    const avisoModal = document.getElementById('avisoModal');
    const btnEntendido = document.getElementById('btnEntendido');
    const btnCerrar = document.getElementById('btnCerrar');

    if (footerAviso) {
      footerAviso.click();
      expect(avisoModal.classList.contains('open')).toBe(true);

      btnEntendido.click();
      expect(avisoModal.classList.contains('open')).toBe(false);

      footerAviso.click();
      btnCerrar.click();
      expect(avisoModal.classList.contains('open')).toBe(false);
    }
  });

  it('debe permitir iniciar modo invitado y redirigir', async () => {
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(invitadoService, 'iniciarModoInvitado').mockResolvedValue(true);

    await import('../../js/controllers/inicioController.js');

    const btnModoInvitado = document.getElementById('btn-modo-invitado');
    if (btnModoInvitado) {
      btnModoInvitado.click();
      await new Promise(r => setTimeout(r, 10));
      expect(window.location.href).toBe('panel_invitado.html');
    }
  });

  it('debe permitir cerrar sesión con logout confirm', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(false);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue({ exito: true });

    await import('../../js/controllers/inicioController.js');

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.click();
      expect(logoutSpy).toHaveBeenCalled();
    }
  });
});
