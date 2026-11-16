import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('accesosController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/gestion_accesos.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/gestion_accesos.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión de paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/accesosController.js');
    expect(window.location.href).toContain('login.html');
  });

  it('debe cargar y renderizar la lista de psicólogos aprobados', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { accesosService } = await import('../../js/services/accesosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(accesosService, 'obtenerAccesos').mockResolvedValue({
      ok: true,
      data: [
        {
          idPsicologo: 5,
          nombre: 'Dra. Claudia Santos',
          especialidades: ['Ansiedad', 'Depresión'],
          autorizado: false
        }
      ]
    });

    await import('../../js/controllers/accesosController.js');
    await new Promise(r => setTimeout(r, 40));

    const boxLista = document.getElementById('lista');
    expect(boxLista.innerHTML).toContain('Dra. Claudia Santos');
    expect(boxLista.innerHTML).toContain('No autorizado');
    expect(boxLista.innerHTML).toContain('Autorizar');
  });

  it('debe permitir autorizar y revocar acceso a un psicólogo mediante modal', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { accesosService } = await import('../../js/services/accesosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(accesosService, 'obtenerAccesos').mockResolvedValue({
      ok: true,
      data: [
        {
          idPsicologo: 5,
          nombre: 'Dra. Claudia Santos',
          especialidades: ['Ansiedad'],
          autorizado: false
        }
      ]
    });
    const spyAut = vi.spyOn(accesosService, 'autorizarAcceso').mockResolvedValue({
      ok: true,
      mensaje: 'Acceso autorizado'
    });

    await import('../../js/controllers/accesosController.js');
    await new Promise(r => setTimeout(r, 40));

    const boxLista = document.getElementById('lista');
    const btnAutorizar = boxLista.querySelector('.btn-aut');
    btnAutorizar.click();

    const modalConfirm = document.getElementById('confirmModal');
    expect(modalConfirm.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyAut).toHaveBeenCalledWith(5);
    expect(modalConfirm.classList.contains('open')).toBe(false);
    expect(boxLista.innerHTML).toContain('Autorizado');
  });

  it('debe filtrar en tiempo real al escribir en el buscador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { accesosService } = await import('../../js/services/accesosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(accesosService, 'obtenerAccesos').mockResolvedValue({
      ok: true,
      data: [
        { idPsicologo: 1, nombre: 'Ana Lopez', especialidades: ['Cognitiva'], autorizado: true },
        { idPsicologo: 2, nombre: 'Carlos Ruiz', especialidades: ['Familiar'], autorizado: false }
      ]
    });

    await import('../../js/controllers/accesosController.js');
    await new Promise(r => setTimeout(r, 40));

    const buscar = document.getElementById('buscar');
    const boxLista = document.getElementById('lista');

    buscar.value = 'Ana';
    buscar.dispatchEvent(new Event('input'));

    expect(boxLista.innerHTML).toContain('Ana Lopez');
    expect(boxLista.innerHTML).not.toContain('Carlos Ruiz');
  });

  it('debe permitir cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { accesosService } = await import('../../js/services/accesosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(accesosService, 'obtenerAccesos').mockResolvedValue({ ok: true, data: [] });
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/accesosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
