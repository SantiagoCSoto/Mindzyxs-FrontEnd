import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('asignarCuestionarioController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/asignar_cuestionario.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/asignar_cuestionario.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/asignarCuestionarioController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe cargar cuestionarios publicados en la lista', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 1, titulo: 'Ansiedad General', estado: 'Publicado', numPreguntas: 5 },
      { id: 2, titulo: 'Borrador 1', estado: 'Borrador', numPreguntas: 3 }
    ]);

    await import('../../js/controllers/asignarCuestionarioController.js');
    await new Promise(r => setTimeout(r, 40));

    const listaC = document.getElementById('listaC');
    expect(listaC.innerHTML).toContain('Ansiedad General');
    expect(listaC.innerHTML).not.toContain('Borrador 1');
  });

  it('debe abrir pantalla de asignación y permitir asignar a pacientes seleccionados', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');
    const asignarCuestionarioService = await import('../../js/services/asignarCuestionarioService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 5, titulo: 'Cuestionario Estrés', estado: 'Publicado', numPreguntas: 10 }
    ]);
    vi.spyOn(asignarCuestionarioService, 'obtenerPantallaAsignacion').mockResolvedValue({
      id: 5,
      titulo: 'Cuestionario Estrés',
      pacientes: [
        { id: 20, nombre: 'Carlos Ruiz', yaAsignado: false }
      ]
    });
    const spyAsignar = vi.spyOn(asignarCuestionarioService, 'asignarCuestionario').mockResolvedValue({
      mensaje: 'Asignado correctamente',
      asignados: 1
    });

    await import('../../js/controllers/asignarCuestionarioController.js');
    await new Promise(r => setTimeout(r, 40));

    const listaC = document.getElementById('listaC');
    const btnAsignarLista = listaC.querySelector('.btn-cancel');
    btnAsignarLista.click();
    await new Promise(r => setTimeout(r, 40));

    const screenAsignar = document.getElementById('screenAsignar');
    expect(screenAsignar.classList.contains('active')).toBe(true);

    const listaPac = document.getElementById('listaPac');
    const checkPac = listaPac.querySelector('input[type="checkbox"]');
    checkPac.checked = true;

    const btnAsignar = document.getElementById('btnAsignar');
    btnAsignar.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyAsignar).toHaveBeenCalledWith(5, [20]);
    const screenLista = document.getElementById('screenLista');
    expect(screenLista.classList.contains('active')).toBe(true);
  });

  it('debe validar que se seleccione al menos un paciente para asignar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');
    const asignarCuestionarioService = await import('../../js/services/asignarCuestionarioService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 5, titulo: 'Cuestionario Estrés', estado: 'Publicado' }
    ]);
    vi.spyOn(asignarCuestionarioService, 'obtenerPantallaAsignacion').mockResolvedValue({
      id: 5,
      titulo: 'Cuestionario Estrés',
      pacientes: [{ id: 20, nombre: 'Carlos Ruiz', yaAsignado: false }]
    });

    await import('../../js/controllers/asignarCuestionarioController.js');
    await new Promise(r => setTimeout(r, 40));

    const listaC = document.getElementById('listaC');
    const btnAsignarLista = listaC.querySelector('.btn-cancel');
    btnAsignarLista.click();
    await new Promise(r => setTimeout(r, 40));

    const btnAsignar = document.getElementById('btnAsignar');
    btnAsignar.click();

    const eSel = document.getElementById('eSel');
    expect(eSel.classList.contains('show')).toBe(true);
    expect(eSel.textContent).toContain('Debes seleccionar al menos un paciente');
  });

  it('debe permitir volver a la lista y cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([]);
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/asignarCuestionarioController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnVolver = document.getElementById('btnVolver');
    btnVolver.click();

    const screenLista = document.getElementById('screenLista');
    expect(screenLista.classList.contains('active')).toBe(true);

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
