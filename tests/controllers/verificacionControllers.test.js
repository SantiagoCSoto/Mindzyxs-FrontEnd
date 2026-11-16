import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Controladores de Verificación', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });

  describe('verificacionController', () => {
    beforeEach(() => {
      const htmlPath = path.resolve(__dirname, '../../views/verificacion.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      document.body.innerHTML = match ? match[1] : html;
      sessionStorage.setItem('correoRegistro', 'usuario@test.com');
    });

    it('debe validar que el código tenga 6 dígitos numéricos', async () => {
      await import('../../js/controllers/verificacionController.js');

      const form = document.getElementById('form-verificacion');
      const inputCodigo = document.getElementById('codigo-verificacion');
      const banner = document.getElementById('banner-error');

      inputCodigo.value = '123';
      form.dispatchEvent(new Event('submit'));
      expect(banner.textContent).toContain('6 dígitos');
    });

    it('debe verificar código exitosamente y abrir modal', async () => {
      const auth = await import('../../js/services/authService.js');
      vi.spyOn(auth.authService, 'verifyCode').mockResolvedValue({ exito: true });

      await import('../../js/controllers/verificacionController.js');

      const form = document.getElementById('form-verificacion');
      const inputCodigo = document.getElementById('codigo-verificacion');
      const modal = document.getElementById('modal-exito');

      inputCodigo.value = '123456';
      form.dispatchEvent(new Event('submit'));
      await new Promise(r => setTimeout(r, 10));

      expect(modal.classList.contains('activo')).toBe(true);
    });

    it('debe permitir reenviar código', async () => {
      const auth = await import('../../js/services/authService.js');
      const resendSpy = vi.spyOn(auth.authService, 'resendCode').mockResolvedValue({ exito: true });

      await import('../../js/controllers/verificacionController.js');

      const btnReenviar = document.getElementById('btn-reenviar');
      btnReenviar.click();
      await new Promise(r => setTimeout(r, 10));

      expect(resendSpy).toHaveBeenCalledWith('usuario@test.com');
    });
  });

  describe('verificacionRecuperarController', () => {
    beforeEach(() => {
      const htmlPath = path.resolve(__dirname, '../../views/verificacion_recuperar.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      document.body.innerHTML = match ? match[1] : html;
      sessionStorage.setItem('correoRecuperacion', 'recuperar@test.com');
    });

    it('debe validar código de recuperación y avanzar a nueva contraseña', async () => {
      const auth = await import('../../js/services/authService.js');
      vi.spyOn(auth.authService, 'verifyPasswordResetCode').mockResolvedValue({ exito: true });

      await import('../../js/controllers/verificacionRecuperarController.js');

      const form = document.getElementById('form-verificacion-recuperar') || document.querySelector('form');
      const inputCodigo = document.getElementById('codigo-verificacion');

      inputCodigo.value = '654321';
      form.dispatchEvent(new Event('submit'));
      await new Promise(r => setTimeout(r, 10));

      expect(sessionStorage.getItem('codigoRecuperacion')).toBe('654321');
    });
  });

  describe('reanudarVerificacionController', () => {
    beforeEach(() => {
      const htmlPath = path.resolve(__dirname, '../../views/reanudar_verificacion.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      document.body.innerHTML = match ? match[1] : html;
    });

    it('debe solicitar código para reanudar verificación', async () => {
      const auth = await import('../../js/services/authService.js');
      vi.spyOn(auth.authService, 'reanudarVerificacion').mockResolvedValue({ exito: true });

      await import('../../js/controllers/reanudarVerificacionController.js');

      const form = document.getElementById('form-reanudar') || document.querySelector('form');
      const inputEmail = document.getElementById('correo-reanudar');

      inputEmail.value = 'reanudar@test.com';
      form.dispatchEvent(new Event('submit'));
      await new Promise(r => setTimeout(r, 10));

      expect(sessionStorage.getItem('correoRegistro')).toBe('reanudar@test.com');
    });
  });
});
