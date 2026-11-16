import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('nuevaContrasenaController', () => {
  beforeEach(() => {
    vi.resetModules();
    const htmlPath = path.resolve(__dirname, '../../views/nueva_contrasena.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    document.body.innerHTML = match ? match[1] : html;
  });

  it('debe alternar visibilidad de contraseña con toggle button', async () => {
    await import('../../js/controllers/nuevaContrasenaController.js');

    const toggleBtn = document.querySelector('.btn-toggle-password');
    const inputField = document.getElementById('contrasena');

    expect(inputField.type).toBe('password');
    toggleBtn.click();
    expect(inputField.type).toBe('text');
    toggleBtn.click();
    expect(inputField.type).toBe('password');
  });

  it('debe validar reglas de contraseña y coincidencia', async () => {
    await import('../../js/controllers/nuevaContrasenaController.js');

    const form = document.getElementById('form-nueva-contrasena');
    const inputPass = document.getElementById('contrasena');
    const inputConf = document.getElementById('confirmar-contrasena');
    const errPass = document.getElementById('error-contrasena');

    // Vacío
    form.dispatchEvent(new Event('submit'));
    expect(errPass.textContent).toContain('obligatoria');

    // Sin número
    inputPass.value = 'sololetras';
    form.dispatchEvent(new Event('submit'));
    expect(errPass.textContent).toContain('mínimo 6');

    // No coinciden
    inputPass.value = 'Pass123!';
    inputConf.value = 'Pass1234!';
    form.dispatchEvent(new Event('submit'));
    const errConf = document.getElementById('error-confirmar');
    expect(errConf.textContent).toContain('no coinciden');
  });

  it('debe enviar la nueva contraseña y abrir modal de éxito', async () => {
    const auth = await import('../../js/services/authService.js');
    vi.spyOn(auth.authService, 'resetPassword').mockResolvedValue({ exito: true });

    await import('../../js/controllers/nuevaContrasenaController.js');

    const form = document.getElementById('form-nueva-contrasena');
    const inputPass = document.getElementById('contrasena');
    const inputConf = document.getElementById('confirmar-contrasena');
    const modalExito = document.getElementById('modal-exito');

    inputPass.value = 'Password123!';
    inputConf.value = 'Password123!';

    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 10));

    expect(modalExito.classList.contains('activo')).toBe(true);
  });
});
