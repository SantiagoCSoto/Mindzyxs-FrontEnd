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
    HTMLAnchorElement.prototype.click = vi.fn();
    vi.restoreAllMocks();
  });

  it('debe redirigir si no hay sesión de administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/validarPsicologosController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe redirigir a psicólogo si el rol es psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Psicologo' });

    await expect(import('../../js/controllers/validarPsicologosController.js'))
      .rejects.toThrow('Acceso restringido a administradores');
    expect(window.location.href).toContain('panel_psicologo.html');
  });

  it('debe redirigir a paciente si el rol es paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });

    await expect(import('../../js/controllers/validarPsicologosController.js'))
      .rejects.toThrow('Acceso restringido a administradores');
    expect(window.location.href).toContain('panel_paciente.html');
  });

  it('debe redirigir a inicio si el rol es invitado', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Invitado' });

    await expect(import('../../js/controllers/validarPsicologosController.js'))
      .rejects.toThrow('Acceso restringido a administradores');
    expect(window.location.href).toContain('inicio.html');
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

  it('debe mostrar estado vacío cuando no hay solicitudes', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const validarPsicologosService = await import('../../js/services/validarPsicologosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(validarPsicologosService, 'listarSolicitudesPendientes').mockResolvedValue({
      ok: true,
      data: []
    });

    await import('../../js/controllers/validarPsicologosController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const vacio = document.getElementById('vacio');
    expect(vacio.style.display).toBe('block');
  });

  it('debe mostrar error si falla la carga de solicitudes', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const validarPsicologosService = await import('../../js/services/validarPsicologosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(validarPsicologosService, 'listarSolicitudesPendientes').mockResolvedValue({
      ok: false,
      error: 'Error al consultar servidor'
    });

    await import('../../js/controllers/validarPsicologosController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const errLista = document.getElementById('errLista');
    expect(errLista.textContent).toContain('Error al consultar servidor');
  });

  it('debe abrir detalle del psicólogo y permitir aprobarlo o descargar tarjeta', async () => {
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
    const spyDescarga = vi.spyOn(validarPsicologosService, 'descargarTarjetaProfesional').mockResolvedValue({
      ok: true,
      blob: new Blob(['pdf'])
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

    const btnDescargarTarjeta = document.getElementById('btnDescargarTarjeta');
    btnDescargarTarjeta.click();
    await new Promise(r => setTimeout(r, 40));
    expect(spyDescarga).toHaveBeenCalledWith(10);

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
        tieneTarjeta: false,
        especialidades: []
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
    txtMotivo.dispatchEvent(new Event('input'));

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
