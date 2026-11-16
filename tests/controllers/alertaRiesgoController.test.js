import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('alertaRiesgoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/alerta_riesgo.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/alerta_riesgo.html?origen=cuestionario';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión activa', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/alertaRiesgoController.js');
    expect(window.location.href).toContain('login.html');
  });

  it('debe registrar acción vista y abrir modal de líneas de ayuda', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const alertaRiesgoService = await import('../../js/services/alertaRiesgoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    const spyReg = vi.spyOn(alertaRiesgoService, 'registrarAccionAlerta').mockResolvedValue({ ok: true });
    vi.spyOn(alertaRiesgoService, 'obtenerLineasAyuda').mockResolvedValue([
      { nombre: 'Línea 106', telefono: '106', horario: '24 horas' }
    ]);

    await import('../../js/controllers/alertaRiesgoController.js');
    await new Promise(r => setTimeout(r, 40));

    expect(spyReg).toHaveBeenCalledWith('vista', 'cuestionario');

    const btnLines = document.getElementById('btnLines');
    btnLines.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyReg).toHaveBeenCalledWith('lineas', 'cuestionario');
    const linesModal = document.getElementById('linesModal');
    expect(linesModal.classList.contains('open')).toBe(true);

    const linesList = document.getElementById('linesList');
    expect(linesList.innerHTML).toContain('Línea 106');

    const linesOk = document.getElementById('linesOk');
    linesOk.click();
    expect(linesModal.classList.contains('open')).toBe(false);
  });

  it('debe navegar a recomendaciones de autocuidado al hacer clic en Ver recomendaciones', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const alertaRiesgoService = await import('../../js/services/alertaRiesgoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    const spyReg = vi.spyOn(alertaRiesgoService, 'registrarAccionAlerta').mockResolvedValue({ ok: true });

    await import('../../js/controllers/alertaRiesgoController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnRecs = document.getElementById('btnRecs');
    btnRecs.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyReg).toHaveBeenCalledWith('recomendaciones', 'cuestionario');
    expect(window.location.href).toContain('recomendaciones_invitado.html?nivel=Alto');
  });

  it('debe registrar acción entendido y cerrar alerta', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const alertaRiesgoService = await import('../../js/services/alertaRiesgoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    const spyReg = vi.spyOn(alertaRiesgoService, 'registrarAccionAlerta').mockResolvedValue({ ok: true });

    await import('../../js/controllers/alertaRiesgoController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnOk = document.getElementById('btnOk');
    btnOk.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyReg).toHaveBeenCalledWith('entendido', 'cuestionario');
  });

  it('debe permitir cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const alertaRiesgoService = await import('../../js/services/alertaRiesgoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(alertaRiesgoService, 'registrarAccionAlerta').mockResolvedValue({ ok: true });
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/alertaRiesgoController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
