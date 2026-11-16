import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('misCuestionariosController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/mis_cuestionarios.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/mis_cuestionarios.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/misCuestionariosController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe redirigir a paciente o inicio si el rol no es psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });

    await expect(import('../../js/controllers/misCuestionariosController.js'))
      .rejects.toThrow('Solo psicólogos');
    expect(window.location.href).toContain('panel_paciente.html');
  });

  it('debe listar cuestionarios con diferentes estados (Borrador, Publicado, Eliminado)', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 1, titulo: 'Cuestionario 1', estado: 'Borrador', numPreguntas: 4 },
      { id: 2, titulo: 'Cuestionario 2', estado: 'Publicado', numPreguntas: 6 },
      { id: 3, titulo: 'Cuestionario 3', estado: 'Eliminado', numPreguntas: 0 }
    ]);

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const listaC = document.getElementById('listaC');
    expect(listaC.innerHTML).toContain('Cuestionario 1');
    expect(listaC.innerHTML).toContain('Borrador');
    expect(listaC.innerHTML).toContain('Cuestionario 2');
    expect(listaC.innerHTML).toContain('Publicado');
    expect(listaC.innerHTML).toContain('Eliminado');
  });

  it('debe manejar error al cargar lista de cuestionarios', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockRejectedValue(new Error('Fallo de red'));

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const listaErr = document.getElementById('listaErr');
    expect(listaErr.classList.contains('show')).toBe(true);
    expect(listaErr.textContent).toContain('Fallo de red');
  });

  it('debe filtrar cuestionarios mediante el campo de búsqueda', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    const spyListar = vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([]);

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const buscarC = document.getElementById('buscarC');
    buscarC.value = 'Ansiedad';
    buscarC.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 350));

    expect(spyListar).toHaveBeenCalledWith('Ansiedad');
  });

  it('debe validar formulario al intentar guardar cuestionario nuevo sin datos o con umbrales inválidos', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([]);

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.click();

    const screenNuevo = document.getElementById('screenNuevo');
    expect(screenNuevo.classList.contains('active')).toBe(true);

    const btnBorrador = document.getElementById('btnBorrador');
    btnBorrador.click();

    const eFormNuevo = document.getElementById('eFormNuevo');
    expect(eFormNuevo.classList.contains('show')).toBe(true);
    expect(eFormNuevo.textContent).toContain('El título es obligatorio');

    // Ahora colocamos título pero umbrales inválidos
    document.getElementById('fTitulo').value = 'Test';
    const qTexto = document.querySelector('#pregBox .q-texto');
    if (qTexto) qTexto.value = '¿Pregunta 1?';
    const opcTextos = document.querySelectorAll('#pregBox .opc-texto');
    opcTextos.forEach((input, i) => { input.value = 'Opción ' + (i + 1); });

    document.getElementById('rBajoH').value = 5;
    document.getElementById('rMedioH').value = 3;
    btnBorrador.click();
    expect(eFormNuevo.textContent).toContain('El límite de riesgo Medio debe ser estrictamente mayor');
  });

  it('debe permitir crear y publicar un cuestionario válido', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([]);
    const spyCrear = vi.spyOn(misCuestionariosService, 'crearCuestionario').mockResolvedValue({
      id: 10,
      mensaje: 'Cuestionario creado'
    });

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.click();

    document.getElementById('fTitulo').value = 'Test de Autoestima';
    document.getElementById('fDesc').value = 'Evaluación básica';

    const qTexto = document.querySelector('#pregBox .q-texto');
    if (qTexto) qTexto.value = '¿Cómo te sientes?';
    const opcTextos = document.querySelectorAll('#pregBox .opc-texto');
    opcTextos.forEach((input, i) => { input.value = 'Opción ' + (i + 1); });

    const btnPublicar = document.getElementById('btnPublicar');
    btnPublicar.click();
    await new Promise(r => setTimeout(r, 350));

    expect(spyCrear).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Test de Autoestima',
      publicar: true
    }));
  });

  it('debe despublicar un cuestionario publicado antes de editarlo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 9, titulo: 'Cuestionario publicado', estado: 'Publicado', numPreguntas: 2 }
    ]);
    vi.spyOn(misCuestionariosService, 'obtenerDetalleCuestionario').mockResolvedValue({
      id: 9,
      titulo: 'Cuestionario publicado',
      descripcion: 'Detalle',
      estado: 'Publicado',
      umbralBajoMax: 3,
      umbralMedioMax: 6,
      preguntas: [{ id: 1, texto: 'Pregunta 1', tipo: 'opcion_multiple', opciones: [{ id: 10, texto: 'A', valor: 0 }, { id: 11, texto: 'B', valor: 1 }] }]
    });
    const spyDespublicar = vi.spyOn(misCuestionariosService, 'despublicarCuestionario').mockResolvedValue({
      mensaje: 'Pasado a borrador'
    });
    const spyActualizar = vi.spyOn(misCuestionariosService, 'actualizarCuestionario').mockResolvedValue({
      id: 9,
      mensaje: 'Actualizado'
    });

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const btnDetalle = document.querySelector('.btn-cancel.btn-sm');
    btnDetalle.click();
    await new Promise(r => setTimeout(r, 350));

    const btnEditar = document.getElementById('btnEditar');
    btnEditar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 350));

    expect(spyDespublicar).toHaveBeenCalledWith(9);

    const screenEditar = document.getElementById('screenEditar');
    expect(screenEditar.classList.contains('active')).toBe(true);

    const btnGuardarB = document.getElementById('btnGuardarB');
    btnGuardarB.click();
    await new Promise(r => setTimeout(r, 350));

    expect(spyActualizar).toHaveBeenCalledWith(9, expect.objectContaining({
      titulo: 'Cuestionario publicado',
      publicar: false
    }));
  });

  it('debe permitir ver detalle de un cuestionario y eliminarlo con confirmación en modal', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 9, titulo: 'Cuestionario a eliminar', estado: 'Borrador', numPreguntas: 2 }
    ]);
    vi.spyOn(misCuestionariosService, 'obtenerDetalleCuestionario').mockResolvedValue({
      id: 9,
      titulo: 'Cuestionario a eliminar',
      descripcion: 'Detalle',
      estado: 'Borrador',
      preguntas: [{ texto: 'Pregunta 1', opciones: [{ texto: 'Si' }, { texto: 'No' }] }]
    });
    const spyEliminar = vi.spyOn(misCuestionariosService, 'eliminarCuestionario').mockResolvedValue({
      mensaje: 'Eliminado con éxito'
    });

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const btnDetalle = document.querySelector('.btn-cancel.btn-sm');
    btnDetalle.click();
    await new Promise(r => setTimeout(r, 350));

    const screenDetalle = document.getElementById('screenDetalle');
    expect(screenDetalle.classList.contains('active')).toBe(true);

    const btnEliminar = document.getElementById('btnEliminar');
    btnEliminar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 350));

    expect(spyEliminar).toHaveBeenCalledWith(9);
    expect(confirmModal.classList.contains('open')).toBe(false);
  });

  it('debe permitir cancelar modal con Escape, click fuera, btnNo y cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const misCuestionariosService = await import('../../js/services/misCuestionariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(misCuestionariosService, 'listarCuestionarios').mockResolvedValue([
      { id: 9, titulo: 'Cuestionario prueba', estado: 'Borrador', numPreguntas: 2 }
    ]);
    vi.spyOn(misCuestionariosService, 'obtenerDetalleCuestionario').mockResolvedValue({
      id: 9,
      titulo: 'Cuestionario prueba',
      estado: 'Borrador',
      preguntas: []
    });
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/misCuestionariosController.js');
    await new Promise(r => setTimeout(r, 350));

    const btnDetalle = document.querySelector('.btn-cancel.btn-sm');
    btnDetalle.click();
    await new Promise(r => setTimeout(r, 350));

    const btnEliminar = document.getElementById('btnEliminar');
    btnEliminar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    // Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(confirmModal.classList.contains('open')).toBe(false);

    // Abrir de nuevo y cerrar con click backdrop
    btnEliminar.click();
    confirmModal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(confirmModal.classList.contains('open')).toBe(false);

    // Abrir de nuevo y cerrar con btnNo
    btnEliminar.click();
    const btnNo = document.getElementById('btnNo');
    btnNo.click();
    expect(confirmModal.classList.contains('open')).toBe(false);

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
