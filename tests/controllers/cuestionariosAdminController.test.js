import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('cuestionariosAdminController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/cuestionarios_admin.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/cuestionarios_admin.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/cuestionariosAdminController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe listar cuestionarios predeterminados y mostrarlos en el DOM', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const cuestionariosAdminService = await import('../../js/services/cuestionariosAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(cuestionariosAdminService, 'listarPredeterminados').mockResolvedValue([
      { id: 1, titulo: 'GAD-7 Predeterminado', estado: 'Publicado', numPreguntas: 7 }
    ]);

    await import('../../js/controllers/cuestionariosAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const listaC = document.getElementById('listaC');
    expect(listaC.innerHTML).toContain('GAD-7 Predeterminado');
    expect(listaC.innerHTML).toContain('Publicado');
  });

  it('debe permitir abrir editor para crear un nuevo cuestionario y cancelarlo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const cuestionariosAdminService = await import('../../js/services/cuestionariosAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(cuestionariosAdminService, 'listarPredeterminados').mockResolvedValue([]);

    await import('../../js/controllers/cuestionariosAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.click();

    const screenEditar = document.getElementById('screenEditar');
    expect(screenEditar.classList.contains('active')).toBe(true);

    const btnCancelar = document.getElementById('btnCancelar');
    btnCancelar.click();

    const screenLista = document.getElementById('screenLista');
    expect(screenLista.classList.contains('active')).toBe(true);
  });

  it('debe permitir desactivar un cuestionario mediante el modal de confirmación', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const cuestionariosAdminService = await import('../../js/services/cuestionariosAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(cuestionariosAdminService, 'listarPredeterminados').mockResolvedValue([
      { id: 5, titulo: 'Cuestionario Activo', estado: 'Publicado', numPreguntas: 5 }
    ]);
    const spyDesactivar = vi.spyOn(cuestionariosAdminService, 'desactivarPredeterminado').mockResolvedValue({
      mensaje: 'Cuestionario desactivado'
    });

    await import('../../js/controllers/cuestionariosAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnDesactivar = document.querySelector('.btn-danger');
    btnDesactivar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyDesactivar).toHaveBeenCalledWith(5);
    expect(confirmModal.classList.contains('open')).toBe(false);
  });

  it('debe permitir cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const cuestionariosAdminService = await import('../../js/services/cuestionariosAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(cuestionariosAdminService, 'listarPredeterminados').mockResolvedValue([]);
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/cuestionariosAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnLogoutTop = document.getElementById('btn-logout-top');
    btnLogoutTop.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
