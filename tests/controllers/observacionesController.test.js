import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('observacionesController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/observaciones.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/observaciones.html?idPaciente=10&idEvento=5';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión de psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/observacionesController.js');
    expect(window.location.href).toContain('login.html');
  });

  it('debe manejar caso sin idPaciente en la URL cuando no hay pacientes autorizados', async () => {
    window.location.href = 'http://localhost/observaciones.html';
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: []
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const detMeta = document.getElementById('detMeta');
    expect(detMeta.textContent).toContain('No tiene pacientes autorizados');
  });

  it('debe cargar y renderizar detalle de registro y observaciones', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Paciente 10' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerDetalleRegistro').mockResolvedValue({
      ok: true,
      data: {
        id: 5,
        tipo: 'RegistroEmocional',
        puntaje: 4,
        nota: 'Nota del paciente',
        fecha: '2026-03-01T10:00:00Z',
        observaciones: [
          { contenido: 'Primera observación clínica', firma: 'Dr. Lopez', fecha: '2026-03-01T12:00:00Z' }
        ]
      }
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const detObs = document.getElementById('detObs');
    expect(detObs.innerHTML).toContain('Primera observación clínica');
  });

  it('debe manejar caso sin idEvento mostrando observaciones generales', async () => {
    window.location.href = 'http://localhost/observaciones.html?idPaciente=10';
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Paciente Diez' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerRegistrosPaciente').mockResolvedValue({
      ok: true,
      data: []
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const detMeta = document.getElementById('detMeta');
    expect(detMeta.textContent).toContain('Observaciones generales · Paciente Diez');
  });

  it('debe manejar error al consultar registro específico', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Paciente 10' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerDetalleRegistro').mockResolvedValue({
      ok: false,
      error: 'Registro no encontrado'
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const detMeta = document.getElementById('detMeta');
    expect(detMeta.textContent).toContain('No se encontró el registro seleccionado.');
  });

  it('debe validar contenido obligatorio en modal de observación', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Paciente 10' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerDetalleRegistro').mockResolvedValue({
      ok: true,
      data: { id: 5, observaciones: [] }
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnAgregar = document.getElementById('btnAgregarObs');
    btnAgregar.click();

    const obsText = document.getElementById('obsText');
    obsText.value = '   ';

    const obsSave = document.getElementById('obsSave');
    obsSave.click();

    const eObs = document.getElementById('eObs');
    expect(eObs.classList.contains('show')).toBe(true);
  });

  it('debe permitir abrir modal y crear una nueva observación clínica', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');
    const { observacionesService } = await import('../../js/services/observacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Paciente 10' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerDetalleRegistro').mockResolvedValue({
      ok: true,
      data: {
        id: 5,
        tipo: 'RegistroEmocional',
        puntaje: 4,
        fecha: '2026-03-01T10:00:00Z',
        observaciones: []
      }
    });
    const crearSpy = vi.spyOn(observacionesService, 'crearObservacion').mockResolvedValue({
      ok: true,
      mensaje: 'Observación creada'
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnAgregar = document.getElementById('btnAgregarObs');
    btnAgregar.click();

    const obsModal = document.getElementById('obsModal');
    expect(obsModal.classList.contains('open')).toBe(true);

    const obsText = document.getElementById('obsText');
    obsText.value = 'Seguimiento mensual completado';

    const obsSave = document.getElementById('obsSave');
    obsSave.click();
    await new Promise(r => setTimeout(r, 30));

    expect(crearSpy).toHaveBeenCalledWith({
      idPaciente: 10,
      idEvento: 5,
      contenido: 'Seguimiento mensual completado'
    });
  });

  it('debe permitir cancelar modal con Escape, backdrop o botón Cancelar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { psicologoRegistrosService } = await import('../../js/services/psicologoRegistrosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(psicologoRegistrosService, 'obtenerPacientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Paciente 10' }]
    });
    vi.spyOn(psicologoRegistrosService, 'obtenerDetalleRegistro').mockResolvedValue({
      ok: true,
      data: { id: 5, observaciones: [] }
    });

    await import('../../js/controllers/observacionesController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnAgregar = document.getElementById('btnAgregarObs');
    const obsModal = document.getElementById('obsModal');
    const obsCancel = document.getElementById('obsCancel');

    btnAgregar.click();
    expect(obsModal.classList.contains('open')).toBe(true);
    obsCancel.click();
    expect(obsModal.classList.contains('open')).toBe(false);

    btnAgregar.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(obsModal.classList.contains('open')).toBe(false);

    btnAgregar.click();
    obsModal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(obsModal.classList.contains('open')).toBe(false);

    const footerAviso = document.getElementById('footerAviso');
    footerAviso.click();

    const btnLogout = document.getElementById('btn-logout');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();
    btnLogout.click();
    expect(spyLogout).toHaveBeenCalled();
  });
});
