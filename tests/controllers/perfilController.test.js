import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('perfilController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/perfil.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/perfil.html';
    vi.restoreAllMocks();
  });

  it('debe cargar y renderizar los datos del perfil del paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { perfilService } = await import('../../js/services/perfilService.js');

    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({
      generos: [{ id: 1, nombre: 'Masculino' }]
    });

    vi.spyOn(perfilService, 'obtenerPerfil').mockResolvedValue({
      nombres: 'Carlos',
      apellidos: 'Ramirez',
      nombreCompleto: 'Carlos Ramirez',
      correo: 'carlos@example.com',
      fechaNacimiento: '1995-05-15',
      genero: 'Masculino'
    });

    await import('../../js/controllers/perfilController.js');
    await new Promise(r => setTimeout(r, 40));

    const vNombre = document.getElementById('vNombre');
    const vCorreo = document.getElementById('vCorreo');
    expect(vNombre.textContent).toBe('Carlos Ramirez');
    expect(vCorreo.textContent).toBe('carlos@example.com');
  });

  it('debe permitir cambiar a modo edición y cancelar volviendo al modo vista', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { perfilService } = await import('../../js/services/perfilService.js');

    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ generos: [] });
    vi.spyOn(perfilService, 'obtenerPerfil').mockResolvedValue({
      nombres: 'Ana',
      apellidos: 'Gomez',
      nombreCompleto: 'Ana Gomez',
      correo: 'ana@example.com',
      fechaNacimiento: '1998-03-20',
      genero: 'Femenino'
    });

    await import('../../js/controllers/perfilController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.getElementById('btnEditar');
    const editScreen = document.getElementById('editScreen');
    const viewScreen = document.getElementById('viewScreen');

    btnEditar.click();
    expect(editScreen.classList.contains('active')).toBe(true);
    expect(viewScreen.classList.contains('active')).toBe(false);

    const btnCancelar = document.getElementById('btnCancelar');
    btnCancelar.click();
    expect(viewScreen.classList.contains('active')).toBe(true);
    expect(editScreen.classList.contains('active')).toBe(false);
  });

  it('debe solicitar cambio de correo electrónico y abrir modal de código', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { perfilService } = await import('../../js/services/perfilService.js');

    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ generos: [] });
    vi.spyOn(perfilService, 'obtenerPerfil').mockResolvedValue({
      nombres: 'Ana',
      apellidos: 'Gomez',
      nombreCompleto: 'Ana Gomez',
      correo: 'ana@example.com',
      fechaNacimiento: '1998-03-20',
      genero: 'Femenino'
    });

    const spySolicitar = vi.spyOn(perfilService, 'solicitarCambioCorreo').mockResolvedValue({
      exito: true,
      mensaje: 'Código enviado'
    });

    await import('../../js/controllers/perfilController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.getElementById('btnEditar');
    btnEditar.click();

    const inCorreo = document.getElementById('inCorreo');
    const formPerfil = document.getElementById('formPerfil');

    inCorreo.value = 'ana.nuevo@example.com';
    formPerfil.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 40));

    expect(spySolicitar).toHaveBeenCalledWith('ana.nuevo@example.com');
    const codeModal = document.getElementById('codeModal');
    expect(codeModal.classList.contains('open')).toBe(true);
  });

  it('debe verificar código de confirmación de correo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { perfilService } = await import('../../js/services/perfilService.js');

    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ generos: [] });
    vi.spyOn(perfilService, 'obtenerPerfil').mockResolvedValue({
      nombres: 'Ana',
      apellidos: 'Gomez',
      nombreCompleto: 'Ana Gomez',
      correo: 'ana@example.com',
      fechaNacimiento: '1998-03-20',
      genero: 'Femenino'
    });
    vi.spyOn(perfilService, 'solicitarCambioCorreo').mockResolvedValue({ exito: true });
    const spyConfirmar = vi.spyOn(perfilService, 'confirmarCambioCorreo').mockResolvedValue({
      exito: true,
      mensaje: 'Correo actualizado'
    });

    await import('../../js/controllers/perfilController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnEditar = document.getElementById('btnEditar');
    btnEditar.click();

    const inCorreo = document.getElementById('inCorreo');
    const formPerfil = document.getElementById('formPerfil');
    inCorreo.value = 'ana.nuevo@example.com';
    formPerfil.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 40));

    const codeInput = document.getElementById('codeInput');
    const btnVerify = document.getElementById('btnVerify');
    codeInput.value = '123456';
    btnVerify.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyConfirmar).toHaveBeenCalledWith('ana.nuevo@example.com', '123456');
  });

  it('debe manejar apertura y cierre del aviso aclaratorio y logout', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const { perfilService } = await import('../../js/services/perfilService.js');
    const { avisoService } = await import('../../js/services/avisoService.js');

    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ generos: [] });
    vi.spyOn(perfilService, 'obtenerPerfil').mockResolvedValue(null);
    vi.spyOn(perfilService, 'obtenerPerfilActual').mockReturnValue({
      nombres: 'Test',
      apellidos: 'User',
      nombreCompleto: 'Test User',
      correo: 'test@example.com'
    });

    const spyReg = vi.spyOn(avisoService, 'registrarVisualizacion').mockResolvedValue();
    const spyMarcar = vi.spyOn(avisoService, 'marcarAvisoAceptado').mockReturnValue();
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();

    await import('../../js/controllers/perfilController.js');
    await new Promise(r => setTimeout(r, 40));

    const footerAviso = document.getElementById('footerAviso');
    const avisoModal = document.getElementById('avisoModal');
    const btnEntendido = document.getElementById('btnEntendido');

    footerAviso.click();
    expect(avisoModal.classList.contains('open')).toBe(true);
    expect(spyReg).toHaveBeenCalled();

    btnEntendido.click();
    expect(avisoModal.classList.contains('open')).toBe(false);
    expect(spyMarcar).toHaveBeenCalled();

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();
    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('inicio.html');
  });
});
