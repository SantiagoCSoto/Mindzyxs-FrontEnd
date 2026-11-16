import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('loginController', () => {
  beforeEach(() => {
    vi.resetModules();
    const htmlPath = path.resolve(__dirname, '../../views/login.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    document.body.innerHTML = match ? match[1] : html;
  });

  it('debe inicializar el controlador y validar campos vacíos al enviar', async () => {
    await import('../../js/controllers/loginController.js');

    const form = document.getElementById('form-login');
    const correo = document.getElementById('correo');
    const errCorreo = document.getElementById('error-correo');

    correo.value = 'test';
    correo.dispatchEvent(new Event('input'));

    form.dispatchEvent(new Event('submit'));
    expect(errCorreo.textContent).toContain('Ingresa un correo');
  });

  it('debe iniciar sesión exitosamente y abrir modal de rol', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'login').mockResolvedValue({
      exito: true,
      rol: 'Paciente',
      destino: 'panel_paciente.html'
    });

    await import('../../js/controllers/loginController.js');

    const form = document.getElementById('form-login');
    const correo = document.getElementById('correo');
    const password = document.getElementById('password');
    const modalRol = document.getElementById('modal-rol');

    correo.value = 'paciente@test.com';
    password.value = 'Password123!';

    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 10));

    expect(modalRol.classList.contains('activo')).toBe(true);
  });

  it('debe mostrar banner de error cuando falla el login', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'login').mockResolvedValue({
      exito: false,
      mensaje: 'Credenciales inválidas'
    });

    await import('../../js/controllers/loginController.js');

    const form = document.getElementById('form-login');
    const correo = document.getElementById('correo');
    const password = document.getElementById('password');
    const banner = document.getElementById('banner-error-login');

    correo.value = 'bad@test.com';
    password.value = 'wrong';

    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 10));

    expect(banner.textContent).toContain('Credenciales inválidas');
  });

  it('debe permitir ingresar como invitado', async () => {
    const invitado = await import('../../js/services/invitadoService.js');
    const spy = vi.spyOn(invitado.invitadoService, 'iniciarModoInvitado').mockResolvedValue();

    await import('../../js/controllers/loginController.js');

    const btnInvitado = document.getElementById('btn-modo-invitado');
    btnInvitado.click();
    expect(spy).toHaveBeenCalled();
  });
});
