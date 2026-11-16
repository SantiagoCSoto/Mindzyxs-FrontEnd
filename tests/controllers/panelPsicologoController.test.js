import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('panelPsicologoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/panel_psicologo.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/panel_psicologo.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión de psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/panelPsicologoController.js');
    expect(window.location.href).toBe('login.html');
  });

  it('debe permitir navegar a las secciones del psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });

    await import('../../js/controllers/panelPsicologoController.js');

    const btnPacientes = document.getElementById('btn-psicologo-pacientes');
    btnPacientes.click();
    expect(window.location.href).toBe('pacientes_autorizados.html');

    const btnCuestionarios = document.getElementById('btn-psicologo-cuestionarios');
    btnCuestionarios.click();
    expect(window.location.href).toBe('mis_cuestionarios.html');

    const btnEstadisticas = document.getElementById('btn-psicologo-estadisticas');
    btnEstadisticas.click();
    expect(window.location.href).toBe('estadisticas_pacientes.html');

    const btnPerfil = document.getElementById('btn-psicologo-perfil');
    btnPerfil.click();
    expect(window.location.href).toBe('perfil_profesional.html');

    const btnChat = document.getElementById('btn-psicologo-chat');
    btnChat.click();
    expect(window.location.href).toBe('chat.html');
  });
});
