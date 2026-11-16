import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('panelPacienteController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/panel_paciente.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/panel_paciente.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión de paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/panelPacienteController.js');
    expect(window.location.href).toBe('login.html');
  });

  it('debe navegar directamente al cuestionario si el aviso ya fue aceptado', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { avisoService } = await import('../../js/services/avisoService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(avisoService, 'haAceptadoAviso').mockReturnValue(true);

    await import('../../js/controllers/panelPacienteController.js');

    const btnCuestionario = document.getElementById('btn-paciente-cuestionario');
    btnCuestionario.click();
    expect(window.location.href).toBe('cuestionario_paciente.html');
  });

  it('debe mostrar aviso aclaratorio si no ha sido aceptado antes de ir al cuestionario', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { avisoService } = await import('../../js/services/avisoService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(avisoService, 'haAceptadoAviso').mockReturnValue(false);
    vi.spyOn(avisoService, 'registrarVisualizacion').mockResolvedValue();

    await import('../../js/controllers/panelPacienteController.js');

    const btnCuestionario = document.getElementById('btn-paciente-cuestionario');
    const avisoModal = document.getElementById('avisoModal');
    btnCuestionario.click();
    expect(avisoModal.classList.contains('open')).toBe(true);

    const btnEntendido = document.getElementById('btnEntendido');
    btnEntendido.click();
    expect(avisoModal.classList.contains('open')).toBe(false);
  });

  it('debe permitir navegar a las diferentes secciones del paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });

    await import('../../js/controllers/panelPacienteController.js');

    const btnRegistro = document.getElementById('btn-paciente-registro');
    btnRegistro.click();
    expect(window.location.href).toBe('registro_emocional.html');

    const btnHistorial = document.getElementById('btn-paciente-historial');
    btnHistorial.click();
    expect(window.location.href).toBe('historial.html');

    const btnRecordatorios = document.getElementById('btn-paciente-recordatorios');
    btnRecordatorios.click();
    expect(window.location.href).toBe('recordatorios.html');
  });

  it('debe abrir modal de líneas de ayuda', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });

    await import('../../js/controllers/panelPacienteController.js');

    const btnAyuda = document.getElementById('btn-paciente-ayuda');
    const modalAyuda = document.getElementById('modalLineasAyuda');
    const btnCerrar = document.getElementById('btnCerrarAyuda');

    btnAyuda.click();
    expect(modalAyuda.classList.contains('open')).toBe(true);

    btnCerrar.click();
    expect(modalAyuda.classList.contains('open')).toBe(false);
  });
});
