import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('registroController', () => {
  beforeEach(() => {
    vi.resetModules();
    const htmlPath = path.resolve(__dirname, '../../views/registro.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    document.body.innerHTML = match ? match[1] : html;
  });

  it('debe alternar la sección de credenciales al seleccionar rol Psicólogo', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'getCatalogos').mockResolvedValue({
      especialidades: [{ id: 1, nombre: 'Clínica' }],
      generos: [{ id: 1, nombre: 'Femenino' }]
    });

    await import('../../js/controllers/registroController.js');

    const selectRol = document.getElementById('tipo-usuario');
    const seccionPsi = document.getElementById('seccion-credenciales-psicologo');

    selectRol.value = 'Psicologo';
    selectRol.dispatchEvent(new Event('change'));

    expect(seccionPsi.style.display).toBe('flex');

    selectRol.value = 'Paciente';
    selectRol.dispatchEvent(new Event('change'));
    expect(seccionPsi.style.display).toBe('none');
  });

  it('debe validar campos obligatorios como contraseña al intentar enviar formulario vacío', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'getCatalogos').mockResolvedValue({ generos: [] });

    await import('../../js/controllers/registroController.js');

    const form = document.querySelector('.form-registro');
    const banner = document.getElementById('banner-error-registro');

    form.dispatchEvent(new Event('submit'));
    expect(banner.textContent).toContain('mínimo 6 caracteres');
  });

  it('debe registrar un paciente exitosamente cuando los datos son válidos', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'getCatalogos').mockResolvedValue({ generos: [] });
    const regSpy = vi.spyOn(auth.authService, 'register').mockResolvedValue({ exito: true });

    await import('../../js/controllers/registroController.js');

    document.getElementById('tipo-usuario').value = 'Paciente';
    document.getElementById('nombres').value = 'Laura';
    document.getElementById('apellidos').value = 'Gómez';
    document.getElementById('fecha-nacimiento').value = '2000-01-01';
    document.getElementById('genero').value = '1';
    document.getElementById('correo').value = 'laura@test.com';
    document.getElementById('contrasena').value = 'Password123!';
    document.getElementById('acepta-privacidad').checked = true;

    const form = document.querySelector('.form-registro');
    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 10));

    expect(regSpy).toHaveBeenCalled();
    expect(sessionStorage.getItem('correoRegistro')).toBe('laura@test.com');
  });

  it('debe gestionar el modal de cancelar registro', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'getCatalogos').mockResolvedValue({ generos: [] });

    await import('../../js/controllers/registroController.js');

    const btnCancel = document.querySelector('.btn-cancel');
    const modalCancel = document.getElementById('modal-cancelar');
    const btnNo = document.getElementById('btn-no-cancelar');

    btnCancel.click();
    expect(modalCancel.classList.contains('activo')).toBe(true);

    btnNo.click();
    expect(modalCancel.classList.contains('activo')).toBe(false);
  });
});
