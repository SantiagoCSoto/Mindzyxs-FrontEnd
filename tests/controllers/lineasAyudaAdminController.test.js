import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('lineasAyudaAdminController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/lineas_ayuda_admin.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/lineas_ayuda_admin.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/lineasAyudaAdminController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe listar líneas de ayuda y mostrarlas en la tabla', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const lineasAyudaAdminService = await import('../../js/services/lineasAyudaAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(lineasAyudaAdminService, 'listarLineas').mockResolvedValue([
      { id: 1, nombre: 'Línea 106', telefono: '106', estado: 'Activa' }
    ]);

    await import('../../js/controllers/lineasAyudaAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const listaC = document.getElementById('listaC');
    expect(listaC.innerHTML).toContain('Línea 106');
    expect(listaC.innerHTML).toContain('Activa');
  });

  it('debe permitir abrir editor para crear nueva línea y cancelar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const lineasAyudaAdminService = await import('../../js/services/lineasAyudaAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(lineasAyudaAdminService, 'listarLineas').mockResolvedValue([]);

    await import('../../js/controllers/lineasAyudaAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnNueva = document.getElementById('btnNueva');
    btnNueva.click();

    const screenEditar = document.getElementById('screenEditar');
    expect(screenEditar.classList.contains('active')).toBe(true);

    const btnCancelar = document.getElementById('btnCancelar');
    btnCancelar.click();

    const screenLista = document.getElementById('screenLista');
    expect(screenLista.classList.contains('active')).toBe(true);
  });

  it('debe permitir eliminar una línea mediante confirmación en el modal', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const lineasAyudaAdminService = await import('../../js/services/lineasAyudaAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(lineasAyudaAdminService, 'listarLineas').mockResolvedValue([
      { id: 10, nombre: 'Línea de Prueba', telefono: '018000', estado: 'Inactiva' }
    ]);
    const spyEliminar = vi.spyOn(lineasAyudaAdminService, 'eliminarLinea').mockResolvedValue({
      mensaje: 'Línea eliminada'
    });

    await import('../../js/controllers/lineasAyudaAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEliminar = document.querySelector('.btn-danger');
    btnEliminar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyEliminar).toHaveBeenCalledWith(10);
    expect(confirmModal.classList.contains('open')).toBe(false);
  });

  it('debe permitir cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const lineasAyudaAdminService = await import('../../js/services/lineasAyudaAdminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(lineasAyudaAdminService, 'listarLineas').mockResolvedValue([]);
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/lineasAyudaAdminController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnLogoutTop = document.getElementById('btn-logout-top');
    btnLogoutTop.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
