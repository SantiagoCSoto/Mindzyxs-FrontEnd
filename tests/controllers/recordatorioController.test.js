import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('recordatorioController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/recordatorios.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/recordatorios.html';
    vi.restoreAllMocks();
  });

  it('debe bloquear si no hay sesión de paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Psicologo' });

    await import('../../js/controllers/recordatorioController.js');
    expect(window.location.href).toBe('inicio.html');
  });

  it('debe cargar configuración actual de recordatorios', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { recordatorioService } = await import('../../js/services/recordatorioService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(recordatorioService, 'obtenerConfiguracion').mockResolvedValue({
      exito: true,
      noConfigurado: false,
      data: {
        frecuencia: 'Diaria',
        hora: '09:00',
        activo: true,
        dias: [],
        diasNombres: []
      }
    });
    vi.spyOn(recordatorioService, 'obtenerAvisosHoy').mockResolvedValue({ exito: true, data: [] });

    await import('../../js/controllers/recordatorioController.js');
    await new Promise(r => setTimeout(r, 40));

    const currentText = document.getElementById('currentText');
    expect(currentText.textContent).toContain('09:00');
  });

  it('debe permitir cambiar a frecuencia Semanal y seleccionar días', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { recordatorioService } = await import('../../js/services/recordatorioService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(recordatorioService, 'obtenerConfiguracion').mockResolvedValue({
      exito: true,
      data: { frecuencia: 'Diaria', hora: '08:00', activo: true, dias: [] }
    });
    vi.spyOn(recordatorioService, 'obtenerAvisosHoy').mockResolvedValue({ exito: true, data: [] });

    await import('../../js/controllers/recordatorioController.js');
    await new Promise(r => setTimeout(r, 40));

    const chipSemanal = document.getElementById('chipSemanal');
    chipSemanal.click();

    const daysBlock = document.getElementById('daysBlock');
    expect(daysBlock.style.display).not.toBe('none');

    const dayChip = document.querySelector('.day-chip[data-dia="1"]');
    if (dayChip) {
      dayChip.click();
      expect(dayChip.classList.contains('active')).toBe(true);
    }
  });

  it('debe guardar configuración al presionar Guardar cambios', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { recordatorioService } = await import('../../js/services/recordatorioService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(recordatorioService, 'obtenerConfiguracion').mockResolvedValue({
      exito: true,
      data: { frecuencia: 'Diaria', hora: '08:00', activo: true, dias: [] }
    });
    vi.spyOn(recordatorioService, 'obtenerAvisosHoy').mockResolvedValue({ exito: true, data: [] });
    const saveSpy = vi.spyOn(recordatorioService, 'guardarConfiguracion').mockResolvedValue({
      exito: true,
      mensaje: 'Guardado',
      data: { frecuencia: 'Diaria', hora: '08:00', activo: true, dias: [] }
    });

    await import('../../js/controllers/recordatorioController.js');
    await new Promise(r => setTimeout(r, 40));

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.click();
    await new Promise(r => setTimeout(r, 30));

    expect(saveSpy).toHaveBeenCalled();
  });
});
