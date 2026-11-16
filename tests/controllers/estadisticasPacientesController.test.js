import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('estadisticasPacientesController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/estadisticas_pacientes.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/estadisticas_pacientes.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/estadisticasPacientesController.js')).rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe cargar pacientes autorizados en el selector', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const estadisticasService = await import('../../js/services/estadisticasPacientesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(estadisticasService, 'listarPacientesAutorizados').mockResolvedValue([
      { id: 5, nombre: 'Ana Gomez' }
    ]);

    await import('../../js/controllers/estadisticasPacientesController.js');
    await new Promise(r => setTimeout(r, 40));

    const selPac = document.getElementById('selPac');
    expect(selPac.innerHTML).toContain('Ana Gomez');
  });

  it('debe generar y mostrar estadísticas del paciente seleccionado', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const estadisticasService = await import('../../js/services/estadisticasPacientesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(estadisticasService, 'listarPacientesAutorizados').mockResolvedValue([
      { id: 5, nombre: 'Ana Gomez' }
    ]);
    vi.spyOn(estadisticasService, 'obtenerEstadisticas').mockResolvedValue({
      promedio: 4.2,
      tendencia: 'Subiendo',
      totalRegistros: 10,
      nivelFrecuente: 'Alto',
      distribucion: { Bajo: 1, Medio: 3, Alto: 6 },
      porSemana: [],
      porMes: []
    });

    await import('../../js/controllers/estadisticasPacientesController.js');
    await new Promise(r => setTimeout(r, 40));

    const selPac = document.getElementById('selPac');
    selPac.value = '5';

    const btnGenerar = document.getElementById('btnGenerar');
    btnGenerar.click();
    await new Promise(r => setTimeout(r, 40));

    const kProm = document.getElementById('kProm');
    expect(kProm.textContent).toContain('4.2');
  });
});
