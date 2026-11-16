import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('panelInvitadoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/panel_invitado.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/panel_invitado.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a inicio.html si no está en modo invitado', async () => {
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(false);

    await import('../../js/controllers/panelInvitadoController.js');
    expect(window.location.href).toBe('inicio.html');
  });

  it('debe permitir navegar a cuestionario cuando el aviso ya fue aceptado', async () => {
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    const { avisoService } = await import('../../js/services/avisoService.js');
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(true);
    vi.spyOn(avisoService, 'haAceptadoAviso').mockReturnValue(true);

    await import('../../js/controllers/panelInvitadoController.js');

    const btnCuestionario = document.getElementById('btn-invitado-cuestionario');
    btnCuestionario.click();
    expect(window.location.href).toBe('encuesta_invitado.html');
  });

  it('debe abrir modal de aviso si el aviso no ha sido aceptado aún', async () => {
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    const { avisoService } = await import('../../js/services/avisoService.js');
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(true);
    vi.spyOn(avisoService, 'haAceptadoAviso').mockReturnValue(false);
    vi.spyOn(avisoService, 'registrarVisualizacion').mockResolvedValue();

    await import('../../js/controllers/panelInvitadoController.js');

    const btnCuestionario = document.getElementById('btn-invitado-cuestionario');
    const avisoModal = document.getElementById('avisoModal');

    btnCuestionario.click();
    expect(avisoModal.classList.contains('open')).toBe(true);

    const btnEntendido = document.getElementById('btnEntendido');
    btnEntendido.click();
    expect(avisoModal.classList.contains('open')).toBe(false);
  });

  it('debe manejar apertura y cierre de modal de líneas de ayuda', async () => {
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(true);

    await import('../../js/controllers/panelInvitadoController.js');

    const btnAyuda = document.getElementById('btn-invitado-ayuda');
    const modalLineas = document.getElementById('modalLineasAyuda');
    const btnCerrarAyuda = document.getElementById('btnCerrarAyuda');

    btnAyuda.click();
    expect(modalLineas.classList.contains('open')).toBe(true);

    btnCerrarAyuda.click();
    expect(modalLineas.classList.contains('open')).toBe(false);
  });

  it('debe permitir salir del modo invitado', async () => {
    const { invitadoService } = await import('../../js/services/invitadoService.js');
    vi.spyOn(invitadoService, 'esInvitado').mockReturnValue(true);
    vi.spyOn(invitadoService, 'salirModoInvitado').mockResolvedValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await import('../../js/controllers/panelInvitadoController.js');

    const btnSalir = document.getElementById('btn-salir-invitado');
    btnSalir.click();
    await new Promise(r => setTimeout(r, 10));
    expect(window.location.href).toBe('inicio.html');
  });
});
