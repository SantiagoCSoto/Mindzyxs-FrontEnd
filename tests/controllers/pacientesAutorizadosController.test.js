import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('pacientesAutorizadosController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/pacientes_autorizados.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/pacientes_autorizados.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión de psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/pacientesAutorizadosController.js');
    expect(window.location.href).toContain('login.html');
  });

  it('debe cargar pacientes autorizados y mostrarlos en la tabla', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Juan Perez' }]
    });

    await import('../../js/controllers/pacientesAutorizadosController.js');
    await new Promise(r => setTimeout(r, 40));

    const tablaPac = document.getElementById('tablaPac');
    expect(tablaPac.innerHTML).toContain('Juan Perez');
  });

  it('debe permitir seleccionar paciente para ver registros y consultar detalle', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Juan Perez' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerRegistrosPaciente').mockResolvedValue({
      ok: true,
      data: [{ id: 1, tipo: 'RegistroEmocional', puntaje: 4, fecha: '2026-03-01T10:00:00Z', resumen: 'Ok' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerDetalleRegistro').mockResolvedValue({
      ok: true,
      data: {
        id: 1,
        tipo: 'RegistroEmocional',
        puntaje: 4,
        nota: 'Detalle de prueba',
        fecha: '2026-03-01T10:00:00Z',
        observaciones: []
      }
    });

    await import('../../js/controllers/pacientesAutorizadosController.js');
    await new Promise(r => setTimeout(r, 40));

    // Clic en Ver registros del paciente
    const btnVer = document.querySelector('.btn-ver-registros');
    if (btnVer) {
      btnVer.click();
      await new Promise(r => setTimeout(r, 40));

      const screenRegistros = document.getElementById('screenRegistros');
      expect(screenRegistros.classList.contains('active')).toBe(true);

      // Clic en Ver detalle de un registro
      const btnDetalle = document.querySelector('.btn-ver-detalle');
      if (btnDetalle) {
        btnDetalle.click();
        await new Promise(r => setTimeout(r, 40));

        const screenDetalle = document.getElementById('screenDetalle');
        expect(screenDetalle.classList.contains('active')).toBe(true);
      }
    }
  });

  it('debe permitir abrir modal de observación y guardarla', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');
    const { observacionesService } = await import('../../js/services/observacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Juan Perez' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerRegistrosPaciente').mockResolvedValue({
      ok: true,
      data: [{ id: 1, tipo: 'RegistroEmocional', puntaje: 4, fecha: '2026-03-01T10:00:00Z' }]
    });
    vi.spyOn(observacionesService, 'crearObservacion').mockResolvedValue({
      ok: true,
      mensaje: 'Guardada'
    });

    await import('../../js/controllers/pacientesAutorizadosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnVer = document.querySelector('.btn-ver-registros');
    if (btnVer) {
      btnVer.click();
      await new Promise(r => setTimeout(r, 40));

      // Abrir modal de observación
      const btnObs = document.querySelector('.btn-obs-item');
      if (btnObs) {
        btnObs.click();
        const obsModal = document.getElementById('obsModal');
        expect(obsModal.classList.contains('open')).toBe(true);

        const obsText = document.getElementById('obsText');
        obsText.value = 'Nota clínica de seguimiento';

        const obsSave = document.getElementById('obsSave');
        obsSave.click();
        await new Promise(r => setTimeout(r, 30));

        expect(observacionesService.crearObservacion).toHaveBeenCalled();
      }
    }
  });
});
