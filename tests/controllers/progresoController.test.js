import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('progresoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/progreso_emocional.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/progreso_emocional.html';
    vi.restoreAllMocks();
  });

  it('debe bloquear acceso si el usuario no es Psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });

    await import('../../js/controllers/progresoController.js');
    expect(window.location.href).toBe('inicio.html');
  });

  it('debe cargar pacientes autorizados y pintar gráfico cuando hay datos suficientes', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { progresoService } = await import('../../js/services/progresoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(progresoService, 'obtenerPacientesAutorizados').mockResolvedValue({
      exito: true,
      data: [{ id: 10, nombre: 'Ana Gomez' }]
    });
    vi.spyOn(progresoService, 'obtenerProgresoPaciente').mockResolvedValue({
      exito: true,
      data: {
        promedio: '4.2',
        tendencia: '↗ Mejorando',
        totalRegistros: 5,
        suficientes: true,
        serie: [
          { fecha: '2026-03-01', fechaCorta: '01/03', puntaje: 4 },
          { fecha: '2026-03-02', fechaCorta: '02/03', puntaje: 5 }
        ]
      }
    });

    await import('../../js/controllers/progresoController.js');
    await new Promise(r => setTimeout(r, 40));

    const statAvg = document.getElementById('statAvg');
    const statTrend = document.getElementById('statTrend');
    expect(statAvg.textContent).toBe('4.2 / 5');
    expect(statTrend.textContent).toBe('↗ Mejorando');
  });

  it('debe mostrar estado no autorizado si el paciente está bloqueado (403)', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { progresoService } = await import('../../js/services/progresoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(progresoService, 'obtenerPacientesAutorizados').mockResolvedValue({
      exito: true,
      data: [{ id: 99, nombre: 'Paciente Ajeno' }]
    });
    vi.spyOn(progresoService, 'obtenerProgresoPaciente').mockResolvedValue({
      exito: false,
      noAutorizado: true,
      status: 403
    });

    await import('../../js/controllers/progresoController.js');
    await new Promise(r => setTimeout(r, 40));

    const blockedState = document.getElementById('blockedState');
    expect(blockedState.style.display).toBe('block');
  });

  it('debe mostrar estado sin pacientes si la lista está vacía', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { progresoService } = await import('../../js/services/progresoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(progresoService, 'obtenerPacientesAutorizados').mockResolvedValue({
      exito: true,
      data: []
    });

    await import('../../js/controllers/progresoController.js');
    await new Promise(r => setTimeout(r, 40));

    const noPatientsState = document.getElementById('noPatientsState');
    expect(noPatientsState.style.display).toBe('block');
  });
});
