import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('adminBdController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/admin_bd.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/admin_bd.html';
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.restoreAllMocks();
  });

  it('debe denegar acceso si el usuario no tiene rol Administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { adminService } = await import('../../js/services/adminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(adminService, 'listarRespaldos').mockResolvedValue({ exito: true, respaldos: [] });

    await import('../../js/controllers/adminBdController.js');
    await new Promise(r => setTimeout(r, 40));

    const deniedBox = document.getElementById('denied-box');
    const adminContent = document.getElementById('admin-content');

    expect(deniedBox.classList.contains('show')).toBe(true);
    expect(adminContent.style.display).toBe('none');
  });

  it('debe permitir acceso y listar respaldos si el usuario es Administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { adminService } = await import('../../js/services/adminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(adminService, 'listarRespaldos').mockResolvedValue({
      exito: true,
      respaldos: [
        {
          idRespaldo: 1,
          nombreArchivo: 'backup_2026.bak',
          tamano: '15MB',
          fechaHora: '2026-03-01T10:00:00Z'
        }
      ]
    });

    await import('../../js/controllers/adminBdController.js');
    await new Promise(r => setTimeout(r, 40));

    const deniedBox = document.getElementById('denied-box');
    const adminContent = document.getElementById('admin-content');
    const backupRows = document.getElementById('backup-rows');

    expect(deniedBox.classList.contains('show')).toBe(false);
    expect(adminContent.style.display).toBe('block');
    expect(backupRows.innerHTML).toContain('backup_2026.bak');
  });

  it('debe generar respaldo local al presionar el botón de respaldo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { adminService } = await import('../../js/services/adminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(adminService, 'listarRespaldos').mockResolvedValue({ exito: true, respaldos: [] });
    const spyCrear = vi.spyOn(adminService, 'crearRespaldo').mockResolvedValue({
      exito: true,
      mensaje: 'Respaldo creado',
      respaldo: { idRespaldo: 2, nombreArchivo: 'backup_new.bak', tamano: '20MB' }
    });
    vi.spyOn(adminService, 'descargarRespaldo').mockResolvedValue({
      exito: true,
      blob: new Blob(['test']),
      nombreArchivo: 'backup_new.bak'
    });

    await import('../../js/controllers/adminBdController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnBackup = document.getElementById('btn-backup');
    btnBackup.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyCrear).toHaveBeenCalled();
    const msgBackup = document.getElementById('msg-backup');
    expect(msgBackup.textContent).toContain('Respaldo creado');
  });

  it('debe ejecutar mantenimiento al presionar el botón de mantenimiento', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { adminService } = await import('../../js/services/adminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(adminService, 'listarRespaldos').mockResolvedValue({ exito: true, respaldos: [] });
    const spyMant = vi.spyOn(adminService, 'ejecutarMantenimiento').mockResolvedValue({
      exito: true,
      mensaje: 'Mantenimiento ok',
      detalle: { codigosExpiradosEliminados: 5, sesionesExpiradasEliminadas: 2, logsAntiguosEliminados: 10 }
    });

    await import('../../js/controllers/adminBdController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnMaintenance = document.getElementById('btn-maintenance');
    btnMaintenance.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyMant).toHaveBeenCalled();
    const msgMaintenance = document.getElementById('msg-maintenance');
    expect(msgMaintenance.textContent).toContain('Mantenimiento ok');
  });

  it('debe cerrar sesión al hacer clic en el botón de cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { adminService } = await import('../../js/services/adminService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(adminService, 'listarRespaldos').mockResolvedValue({ exito: true, respaldos: [] });
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/adminBdController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    btnCerrar.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
