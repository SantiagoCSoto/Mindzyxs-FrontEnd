import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('validarPsicologosController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/validar_psicologos.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/validar_psicologos.html';
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.restoreAllMocks();
  });

  it('debe redirigir si no hay sesión de administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/validarPsicologosController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe cargar y renderizar solicitudes pendientes', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const validarPsicologosService = await import('../../js/services/validarPsicologosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(validarPsicologosService, 'listarSolicitudesPendientes').mockResolvedValue({
      ok: true,
      data: [
        { id: 10, nombre: 'Dr. Roberto Gomez', correo: 'roberto@test.com', fechaSolicitud: '2026-03-01' }
      ]
    });

    await import('../../js/controllers/validarPsicologosController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const listaSolicitudes = document.getElementById('listaSolicitudes');
    expect(listaSolicitudes.innerHTML).toContain('Dr. Roberto Gomez');
  });

  it('debe abrir detalle del psicólogo y permitir aprobarlo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const validarPsicologosService = await import('../../js/services/validarPsicologosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(validarPsicologosService, 'listarSolicitudesPendientes').mockResolvedValue({
      ok: true,
      data: [
        { id: 10, nombre: 'Dr. Roberto Gomez', correo: 'roberto@test.com', fechaSolicitud: '2026-03-01' }
      ]
    });
    vi.spyOn(validarPsicologosService, 'obtenerDetalleSolicitud').mockResolvedValue({
      ok: true,
      data: {
        id: 10,
        nombre: 'Dr. Roberto Gomez',
        correo: 'roberto@test.com',
        fechaSolicitud: '2026-03-01',
        especialidades: ['Clínica', 'Familiar'],
        tieneTarjeta: true,
        estadoAprobacion: 'Pendiente'
      }
    });
    const spyAprobar = vi.spyOn(validarPsicologosService, 'aprobarPsicologo').mockResolvedValue({
      ok: true,
      mensaje: 'Psicólogo aprobado'
    });

    await import('../../js/controllers/validarPsicologosController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const listaSolicitudes = document.getElementById('listaSolicitudes');
    const btnRevisar = listaSolicitudes.querySelector('.btn-revisar');
    btnRevisar.click();
    await new Promise(r => setTimeout(r, 40));

    const screenDetalle = document.getElementById('screenDetalle');
    expect(screenDetalle.style.display).toBe('block');

    const btnAprobar = document.getElementById('btnAprobar');
    btnAprobar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnModalSi = document.getElementById('btnModalSi');
    btnModalSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyAprobar).toHaveBeenCalledWith(10);
    const screenLista = document.getElementById('screenLista');
    expect(screenLista.style.display).toBe('block');
  });

  it('debe permitir rechazar la solicitud con motivo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const validarPsicologosService = await import('../../js/services/validarPsicologosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(validarPsicologosService, 'listarSolicitudesPendientes').mockResolvedValue({
      ok: true,
      data: [{ id: 10, nombre: 'Dr. Roberto Gomez', correo: 'roberto@test.com' }]
    });
    vi.spyOn(validarPsicologosService, 'obtenerDetalleSolicitud').mockResolvedValue({
      ok: true,
      data: {
        id: 10,
        nombre: 'Dr. Roberto Gomez',
        correo: 'roberto@test.com',
        tieneTarjeta: false
      }
    });
    const spyRechazar = vi.spyOn(validarPsicologosService, 'rechazarPsicologo').mockResolvedValue({
      ok: true,
      mensaje: 'Solicitud rechazada'
    });

    await import('../../js/controllers/validarPsicologosController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnRevisar = document.querySelector('.btn-revisar');
    btnRevisar.click();
    await new Promise(r => setTimeout(r, 40));

    const txtMotivo = document.getElementById('txtMotivo');
    txtMotivo.value = 'Falta adjuntar tarjeta profesional';

    const btnRechazar = document.getElementById('btnRechazar');
    btnRechazar.click();

    const btnModalSi = document.getElementById('btnModalSi');
    btnModalSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyRechazar).toHaveBeenCalledWith(10, 'Falta adjuntar tarjeta profesional');
  });

  it('debe permitir filtrar en el buscador, refrescar y volver a la lista', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const validarPsicologosService = await import('../../js/services/validarPsicologosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(validarPsicologosService, 'listarSolicitudesPendientes').mockResolvedValue({
      ok: true,
      data: [
        { id: 10, nombre: 'Dr. Roberto Gomez', correo: 'roberto@test.com' },
        { id: 11, nombre: 'Dra. Ana Maria', correo: 'ana@test.com' }
      ]
    });

    await import('../../js/controllers/validarPsicologosController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const fBuscar = document.getElementById('fBuscar');
    const listaSolicitudes = document.getElementById('listaSolicitudes');

    fBuscar.value = 'Roberto';
    fBuscar.dispatchEvent(new Event('input'));
    expect(listaSolicitudes.innerHTML).toContain('Dr. Roberto Gomez');
    expect(listaSolicitudes.innerHTML).not.toContain('Dra. Ana Maria');

    const btnRefrescar = document.getElementById('btnRefrescar');
    btnRefrescar.click();
    await new Promise(r => setTimeout(r, 40));

    const btnVolverLista = document.getElementById('btnVolverLista');
    btnVolverLista.click();

    const screenLista = document.getElementById('screenLista');
    expect(screenLista.style.display).toBe('block');
  });
});
