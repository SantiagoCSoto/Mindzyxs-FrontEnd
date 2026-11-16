import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('registroEmocionalController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/registro_emocional.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/registro_emocional.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/registroEmocionalController.js');
    expect(window.location.href).toBe('login.html');
  });

  it('debe cargar último registro guardado al iniciar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const registroEmocionalService = await import('../../js/services/registroEmocionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(registroEmocionalService, 'obtenerUltimoRegistro').mockResolvedValue({
      ok: true,
      data: {
        id: 1,
        puntaje: 4,
        nivel: 'Bien',
        fecha: '2026-03-01T10:00:00Z',
        nota: 'Me siento bien'
      }
    });

    await import('../../js/controllers/registroEmocionalController.js');
    await new Promise(r => setTimeout(r, 40));

    const savedCard = document.getElementById('savedCard');
    const savedText = document.getElementById('savedText');
    expect(savedCard.classList.contains('show')).toBe(true);
    expect(savedText.textContent).toContain('Bien');
  });

  it('debe validar que se seleccione un estado emocional antes de guardar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const registroEmocionalService = await import('../../js/services/registroEmocionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(registroEmocionalService, 'obtenerUltimoRegistro').mockResolvedValue({ ok: true, data: null });

    await import('../../js/controllers/registroEmocionalController.js');
    await new Promise(r => setTimeout(r, 30));

    const goRegister = document.getElementById('goRegister');
    goRegister.click();

    const btnSave = document.getElementById('btnSave');
    btnSave.click();

    const errMsg = document.getElementById('errMsg');
    expect(errMsg.textContent).toContain('Debes seleccionar un estado emocional');
  });

  it('debe permitir seleccionar una escala (pill), ingresar nota y guardar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const registroEmocionalService = await import('../../js/services/registroEmocionalService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(registroEmocionalService, 'obtenerUltimoRegistro').mockResolvedValue({ ok: true, data: null });
    vi.spyOn(registroEmocionalService, 'registrarEstadoEmocional').mockResolvedValue({
      mensaje: 'Registro guardado',
      puntaje: 4,
      nivel: 'Bien',
      fecha: new Date().toISOString()
    });

    await import('../../js/controllers/registroEmocionalController.js');
    await new Promise(r => setTimeout(r, 30));

    const goRegister = document.getElementById('goRegister');
    goRegister.click();

    const pill = document.querySelector('#scale .pill[data-val="4"]');
    pill.click();
    expect(pill.classList.contains('selected')).toBe(true);

    const notes = document.getElementById('notes');
    notes.value = 'Nota de prueba';

    const btnSave = document.getElementById('btnSave');
    btnSave.click();

    await new Promise(r => setTimeout(r, 30));
    expect(registroEmocionalService.registrarEstadoEmocional).toHaveBeenCalledWith(4, 'Nota de prueba');
  });
});
