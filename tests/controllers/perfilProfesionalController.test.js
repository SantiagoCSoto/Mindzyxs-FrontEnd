import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('perfilProfesionalController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/perfil_profesional.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/perfil_profesional.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/perfilProfesionalController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe cargar y renderizar el perfil profesional del psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const perfilProfesionalService = await import('../../js/services/perfilProfesionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(perfilProfesionalService, 'obtenerPerfilProfesional').mockResolvedValue({
      nombre: 'Dra. Martha Gomez',
      correo: 'martha@example.com',
      especialidades: ['Clínica', 'Cognitiva'],
      añosExperiencia: 8,
      descripcionProfesional: 'Especialista en ansiedad',
      datosContacto: 'Tel: 12345678',
      tarjetaProfesionalVerificada: true
    });

    await import('../../js/controllers/perfilProfesionalController.js');
    await new Promise(r => setTimeout(r, 40));

    const verNombre = document.getElementById('verNombre');
    const verCorreoTop = document.getElementById('verCorreoTop');
    const verExp = document.getElementById('verExp');

    expect(verNombre.textContent).toBe('Dra. Martha Gomez');
    expect(verCorreoTop.textContent).toBe('martha@example.com');
    expect(verExp.textContent).toBe('8');
  });

  it('debe permitir cambiar a modo edición, seleccionar especialidades y guardar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const perfilProfesionalService = await import('../../js/services/perfilProfesionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(perfilProfesionalService, 'obtenerPerfilProfesional').mockResolvedValue({
      nombre: 'Dra. Martha Gomez',
      correo: 'martha@example.com',
      especialidades: ['Clínica'],
      añosExperiencia: 5,
      descripcionProfesional: 'Atención a adultos'
    });
    vi.spyOn(perfilProfesionalService, 'listarEspecialidades').mockResolvedValue([
      { id: 1, nombre: 'Clínica' },
      { id: 2, nombre: 'Educativa' }
    ]);
    const spyActualizar = vi.spyOn(perfilProfesionalService, 'actualizarPerfilProfesional').mockResolvedValue({
      mensaje: 'Perfil actualizado exitosamente'
    });

    await import('../../js/controllers/perfilProfesionalController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.getElementById('btnEditar');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const screenEditar = document.getElementById('screenEditar');
    expect(screenEditar.classList.contains('active')).toBe(true);

    const fExp = document.getElementById('fExp');
    fExp.value = '6';

    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyActualizar).toHaveBeenCalledWith(expect.objectContaining({
      añosExperiencia: 6,
      correo: 'martha@example.com'
    }));

    const screenVer = document.getElementById('screenVer');
    expect(screenVer.classList.contains('active')).toBe(true);
  });

  it('debe permitir cancelar edición y volver a la vista del perfil', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const perfilProfesionalService = await import('../../js/services/perfilProfesionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(perfilProfesionalService, 'obtenerPerfilProfesional').mockResolvedValue({
      nombre: 'Dr. Test'
    });
    vi.spyOn(perfilProfesionalService, 'listarEspecialidades').mockResolvedValue([]);

    await import('../../js/controllers/perfilProfesionalController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.getElementById('btnEditar');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const btnCancelar = document.getElementById('btnCancelar');
    btnCancelar.click();

    const screenVer = document.getElementById('screenVer');
    expect(screenVer.classList.contains('active')).toBe(true);
  });

  it('debe permitir cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const perfilProfesionalService = await import('../../js/services/perfilProfesionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(perfilProfesionalService, 'obtenerPerfilProfesional').mockResolvedValue({
      nombre: 'Dr. Test'
    });
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/perfilProfesionalController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
