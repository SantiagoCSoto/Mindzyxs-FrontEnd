import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('recuperarContrasenaController', () => {
  beforeEach(() => {
    vi.resetModules();
    const htmlPath = path.resolve(__dirname, '../../views/recuperar_contrasena.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    document.body.innerHTML = match ? match[1] : html;
  });

  it('debe validar email vacío o sin arroba', async () => {
    await import('../../js/controllers/recuperarContrasenaController.js');

    const form = document.querySelector('form');
    const inputEmail = document.getElementById('email');
    const banner = document.getElementById('banner-error');

    form.dispatchEvent(new Event('submit'));
    expect(banner.textContent).toContain('obligatorio');

    inputEmail.value = 'correo-sin-arroba';
    form.dispatchEvent(new Event('submit'));
    expect(banner.textContent).toContain('Ingresa un correo válido');
  });

  it('debe solicitar código exitosamente y redirigir', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'requestPasswordReset').mockResolvedValue({ exito: true });

    await import('../../js/controllers/recuperarContrasenaController.js');

    const form = document.querySelector('form');
    const inputEmail = document.getElementById('email');
    const bannerExito = document.getElementById('banner-exito');

    inputEmail.value = 'test@example.com';
    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 10));

    expect(bannerExito.textContent).toContain('Se ha enviado un código');
    expect(sessionStorage.getItem('correoRecuperacion')).toBe('test@example.com');
  });
});
