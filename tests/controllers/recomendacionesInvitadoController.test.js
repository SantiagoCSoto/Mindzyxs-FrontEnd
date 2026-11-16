import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('recomendacionesInvitadoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/recomendaciones_invitado.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/recomendaciones_invitado.html?nivel=Bajo';
    vi.restoreAllMocks();
  });

  it('debe cargar y renderizar la lista de recomendaciones para el nivel de riesgo', async () => {
    const recomendacionesService = await import('../../js/services/recomendacionesService.js');

    vi.spyOn(recomendacionesService, 'obtenerRecomendaciones').mockResolvedValue({
      ok: true,
      data: {
        disponible: true,
        nivel: 'Bajo',
        recomendaciones: [
          {
            id: 1,
            titulo: 'Respiración consciente',
            descripcionCorta: 'Técnica de respiración diafragmática',
            icono: '🌬',
            nivel: 'Bajo'
          }
        ]
      }
    });

    await import('../../js/controllers/recomendacionesInvitadoController.js');
    await new Promise(r => setTimeout(r, 40));

    const recList = document.getElementById('recList');
    expect(recList.innerHTML).toContain('Respiración consciente');

    const priorityBadge = document.getElementById('priorityBadge');
    expect(priorityBadge.classList.contains('show')).toBe(true);
    expect(priorityBadge.textContent).toContain('Riesgo bajo');
  });

  it('debe abrir modal de aviso al hacer clic en el enlace del footer y registrar visualización', async () => {
    const recomendacionesService = await import('../../js/services/recomendacionesService.js');

    vi.spyOn(recomendacionesService, 'obtenerRecomendaciones').mockResolvedValue({
      ok: true,
      data: { disponible: true, recomendaciones: [] }
    });
    vi.spyOn(recomendacionesService, 'obtenerAviso').mockResolvedValue({
      ok: true,
      data: { titulo: 'Aviso importante', texto: 'Mindzyxs no diagnostica.' }
    });
    const spyReg = vi.spyOn(recomendacionesService, 'registrarVisualizacion').mockResolvedValue();

    await import('../../js/controllers/recomendacionesInvitadoController.js');
    await new Promise(r => setTimeout(r, 40));

    const footerAviso = document.getElementById('footerAviso');
    footerAviso.click();
    await new Promise(r => setTimeout(r, 40));

    const avisoModal = document.getElementById('avisoModal');
    expect(avisoModal.classList.contains('open')).toBe(true);
    expect(spyReg).toHaveBeenCalledWith('recomendaciones-invitado', 'ok');

    const avisoOk = document.getElementById('avisoOk');
    avisoOk.click();
    expect(avisoModal.classList.contains('open')).toBe(false);
  });

  it('debe permitir salir del modo invitado y redirigir a inicio', async () => {
    const recomendacionesService = await import('../../js/services/recomendacionesService.js');
    const { invitadoService } = await import('../../js/services/invitadoService.js');

    vi.spyOn(recomendacionesService, 'obtenerRecomendaciones').mockResolvedValue({
      ok: true,
      data: { disponible: true, recomendaciones: [] }
    });
    const spySalir = vi.spyOn(invitadoService, 'salirModoInvitado').mockResolvedValue();

    await import('../../js/controllers/recomendacionesInvitadoController.js');
    await new Promise(r => setTimeout(r, 40));

    const panelExit = document.getElementById('panelExit');
    panelExit.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spySalir).toHaveBeenCalledWith('panel');
    expect(window.location.href).toContain('inicio.html');
  });

  it('debe navegar al panel de invitado al hacer clic en volverRecom', async () => {
    const recomendacionesService = await import('../../js/services/recomendacionesService.js');

    vi.spyOn(recomendacionesService, 'obtenerRecomendaciones').mockResolvedValue({
      ok: true,
      data: { disponible: true, recomendaciones: [] }
    });

    await import('../../js/controllers/recomendacionesInvitadoController.js');
    await new Promise(r => setTimeout(r, 40));

    const volverRecom = document.getElementById('volverRecom');
    volverRecom.click();

    expect(window.location.href).toContain('panel_invitado.html');
  });
});
