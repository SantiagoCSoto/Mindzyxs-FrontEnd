import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('gestionUsuariosController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/gestion_usuarios.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/gestion_usuarios.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/gestionUsuariosController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe redirigir a psicólogo si el rol es psicólogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Psicologo' });

    await expect(import('../../js/controllers/gestionUsuariosController.js'))
      .rejects.toThrow('Acceso restringido a administradores');
    expect(window.location.href).toContain('panel_psicologo.html');
  });

  it('debe redirigir a paciente si el rol es paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });

    await expect(import('../../js/controllers/gestionUsuariosController.js'))
      .rejects.toThrow('Acceso restringido a administradores');
    expect(window.location.href).toContain('panel_paciente.html');
  });

  it('debe redirigir a inicio si el rol es invitado', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Invitado' });

    await expect(import('../../js/controllers/gestionUsuariosController.js'))
      .rejects.toThrow('Acceso restringido a administradores');
    expect(window.location.href).toContain('inicio.html');
  });

  it('debe listar usuarios y mostrarlos en el DOM', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: [
        { id: 1, nombre: 'Ana Gomez', correo: 'ana@example.com', rol: 'Paciente', estado: 'Activa' },
        { id: 2, nombre: 'Dr. Ruiz', correo: 'ruiz@example.com', rol: 'Psicologo', estado: 'Suspendida' }
      ]
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const listaUsuarios = document.getElementById('listaUsuarios');
    expect(listaUsuarios.innerHTML).toContain('Ana Gomez');
    expect(listaUsuarios.innerHTML).toContain('Dr. Ruiz');
  });

  it('debe mostrar estado vacío cuando no hay usuarios', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: []
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const vacio = document.getElementById('vacio');
    expect(vacio.style.display).toBe('block');
  });

  it('debe permitir filtrar usuarios y limpiar filtros', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    const spyListar = vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: []
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const fRol = document.getElementById('fRol');
    const fQ = document.getElementById('fQ');
    const btnFiltrar = document.getElementById('btnFiltrar');

    fRol.value = 'Paciente';
    fQ.value = 'Ana';
    btnFiltrar.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyListar).toHaveBeenCalledWith(expect.objectContaining({
      rol: 'Paciente',
      q: 'Ana'
    }));

    const btnLimpiar = document.getElementById('btnLimpiar');
    btnLimpiar.click();
    await new Promise(r => setTimeout(r, 40));

    expect(fQ.value).toBe('');
    expect(fRol.value).toBe('');
  });

  it('debe validar formulario antes de guardar cambios (nombres y correo)', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: [{ id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', rol: 'Paciente', estado: 'Activa' }]
    });
    vi.spyOn(gestionUsuariosService, 'obtenerDetalleUsuario').mockResolvedValue({
      ok: true,
      data: { id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', estado: 'Activa' }
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.querySelector('.btn-sec.btn-sm');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const eNombres = document.getElementById('eNombres');
    const eCorreo = document.getElementById('eCorreo');
    const btnGuardar = document.getElementById('btnGuardar');
    const errEditar = document.getElementById('errEditar');

    // 1. Nombre vacío
    eNombres.value = '   ';
    btnGuardar.click();
    expect(errEditar.textContent).toContain('El nombre del usuario es obligatorio.');

    // 2. Correo vacío
    eNombres.value = 'Carlos';
    eCorreo.value = '   ';
    btnGuardar.click();
    expect(errEditar.textContent).toContain('El correo electrónico es obligatorio.');

    // 3. Correo inválido
    eCorreo.value = 'invalido';
    btnGuardar.click();
    expect(errEditar.textContent).toContain('Ingrese un correo electrónico válido.');
  });

  it('debe permitir abrir edición de un usuario, modificar sus datos y estado y guardar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: [{ id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', rol: 'Paciente', estado: 'Activa' }]
    });
    vi.spyOn(gestionUsuariosService, 'obtenerDetalleUsuario').mockResolvedValue({
      ok: true,
      data: {
        id: 5,
        nombre: 'Carlos Ruiz',
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        correo: 'carlos@example.com',
        genero: 'Femenino',
        fechaNacimiento: '1995-05-10T00:00:00',
        rol: 'Paciente',
        estado: 'Activa'
      }
    });
    const spyActualizar = vi.spyOn(gestionUsuariosService, 'actualizarUsuario').mockResolvedValue({
      ok: true,
      mensaje: 'Guardado'
    });
    const spyCambiarEstado = vi.spyOn(gestionUsuariosService, 'cambiarEstadoUsuario').mockResolvedValue({
      ok: true,
      mensaje: 'Estado cambiado'
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.querySelector('.btn-sec.btn-sm');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const screenEditar = document.getElementById('screenEditar');
    expect(screenEditar.classList.contains('active')).toBe(true);

    const eNombres = document.getElementById('eNombres');
    eNombres.value = 'Carlos Alberto';

    const eEstado = document.getElementById('eEstado');
    eEstado.value = 'Suspendida';

    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyActualizar).toHaveBeenCalledWith(5, expect.objectContaining({
      nombres: 'Carlos Alberto'
    }));
    expect(spyCambiarEstado).toHaveBeenCalledWith(5, 'Suspendida');
  });

  it('debe manejar error al guardar cambios de usuario', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: [{ id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', rol: 'Paciente', estado: 'Activa' }]
    });
    vi.spyOn(gestionUsuariosService, 'obtenerDetalleUsuario').mockResolvedValue({
      ok: true,
      data: { id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', estado: 'Activa' }
    });
    vi.spyOn(gestionUsuariosService, 'actualizarUsuario').mockResolvedValue({
      ok: false,
      error: 'Error al actualizar base de datos'
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.querySelector('.btn-sec.btn-sm');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.click();

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));

    const errEditar = document.getElementById('errEditar');
    expect(errEditar.textContent).toContain('Error al actualizar base de datos');
  });

  it('debe permitir forzar restablecimiento de contraseña mediante modal', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: [{ id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', rol: 'Paciente', estado: 'Activa' }]
    });
    vi.spyOn(gestionUsuariosService, 'obtenerDetalleUsuario').mockResolvedValue({
      ok: true,
      data: { id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@example.com', estado: 'Activa' }
    });
    const spyReset = vi.spyOn(gestionUsuariosService, 'forzarRestablecimientoPassword').mockResolvedValueOnce({
      ok: true,
      mensaje: 'Código enviado'
    }).mockResolvedValueOnce({
      ok: false,
      error: 'Error al enviar código'
    });

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.querySelector('.btn-sec.btn-sm');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const btnResetPassword = document.getElementById('btnResetPassword');
    btnResetPassword.click();

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnSi = document.getElementById('btnSi');
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyReset).toHaveBeenCalledWith(5);

    // Segundo intento con error
    btnResetPassword.click();
    btnSi.click();
    await new Promise(r => setTimeout(r, 40));
    const errEditar = document.getElementById('errEditar');
    expect(errEditar.textContent).toContain('Error al enviar código');
  });

  it('debe permitir cancelar edición, click aviso footer y cerrar sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const gestionUsuariosService = await import('../../js/services/gestionUsuariosService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(gestionUsuariosService, 'listarUsuarios').mockResolvedValue({
      ok: true,
      data: [{ id: 5, nombre: 'Carlos', correo: 'c@c.com', estado: 'Activa' }]
    });
    vi.spyOn(gestionUsuariosService, 'obtenerDetalleUsuario').mockResolvedValue({
      ok: true,
      data: { id: 5, nombre: 'Carlos', correo: 'c@c.com', estado: 'Activa' }
    });
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await import('../../js/controllers/gestionUsuariosController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.querySelector('.btn-sec.btn-sm');
    btnEditar.click();
    await new Promise(r => setTimeout(r, 40));

    const btnCancelar = document.getElementById('btnCancelar');
    btnCancelar.click();

    const screenLista = document.getElementById('screenLista');
    expect(screenLista.classList.contains('active')).toBe(true);

    const footerAviso = document.getElementById('footerAviso');
    footerAviso.click();

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
