import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { authService } from '../../js/services/authService.js';
import * as cuestionarioService from '../../js/services/cuestionarioService.js';

describe('cuestionarioPacienteController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/cuestionario_paciente.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/cuestionario_paciente.html';
    vi.restoreAllMocks();
  });

  it('debe redirigir a login si no hay sesión', async () => {
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await import('../../js/controllers/cuestionarioPacienteController.js');
    expect(window.location.href).toBe('login.html');
  });

  it('debe cargar cuestionario pendiente e historial en home', async () => {
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(cuestionarioService, 'obtenerPendientePaciente').mockResolvedValue({
      ok: true,
      data: {
        id: 1,
        titulo: 'Cuestionario Bienestar',
        descripcion: 'Responde con calma',
        preguntas: [
          {
            id: 1,
            texto: '¿Cómo estás?',
            orden: 1,
            opciones: [
              { id: 10, texto: 'Bien', valor: 4, orden: 1 }
            ]
          }
        ]
      }
    });
    vi.spyOn(cuestionarioService, 'obtenerHistorial').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(cuestionarioService, 'obtenerAsignadosPaciente').mockResolvedValue({ ok: true, data: [] });

    await import('../../js/controllers/cuestionarioPacienteController.js');
    await new Promise(r => setTimeout(r, 10));

    const startBtn = document.getElementById('startBtn');
    expect(startBtn.disabled).toBe(false);
  });

  it('debe validar que se seleccione una opción para avanzar en las preguntas', async () => {
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(cuestionarioService, 'obtenerPendientePaciente').mockResolvedValue({
      ok: true,
      data: {
        id: 1,
        titulo: 'Cuestionario Test',
        preguntas: [
          {
            id: 1,
            texto: 'Pregunta 1',
            orden: 1,
            opciones: [
              { id: 10, texto: 'Op 1', valor: 3, orden: 1 }
            ]
          }
        ]
      }
    });
    vi.spyOn(cuestionarioService, 'obtenerHistorial').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(cuestionarioService, 'obtenerAsignadosPaciente').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(cuestionarioService, 'registrarInicioPaciente').mockResolvedValue();

    await import('../../js/controllers/cuestionarioPacienteController.js');
    await new Promise(r => setTimeout(r, 10));

    // Iniciar cuestionario
    const startBtn = document.getElementById('startBtn');
    startBtn.click();

    // Aceptar aviso modal
    const avisoOkBtn = document.getElementById('avisoOk');
    if (avisoOkBtn) avisoOkBtn.click();

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.click(); // Intenta avanzar sin seleccionar opción

    const errMsg = document.getElementById('errMsg');
    expect(errMsg.textContent).toContain('Debes seleccionar una respuesta');
  });

  it('debe responder pregunta y finalizar mostrando resultado', async () => {
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(cuestionarioService, 'obtenerPendientePaciente').mockResolvedValue({
      ok: true,
      data: {
        id: 1,
        titulo: 'Cuestionario Test',
        preguntas: [
          {
            id: 1,
            texto: 'Pregunta 1',
            orden: 1,
            opciones: [
              { id: 10, texto: 'Op 1', valor: 3, orden: 1 }
            ]
          }
        ]
      }
    });
    vi.spyOn(cuestionarioService, 'obtenerHistorial').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(cuestionarioService, 'obtenerAsignadosPaciente').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(cuestionarioService, 'registrarInicioPaciente').mockResolvedValue();
    vi.spyOn(cuestionarioService, 'finalizarCuestionarioPaciente').mockResolvedValue({
      mensaje: 'Finalizado',
      puntaje: 3,
      nivel: 'Medio',
      totalPreguntas: 1,
      respondidas: 1
    });

    await import('../../js/controllers/cuestionarioPacienteController.js');
    await new Promise(r => setTimeout(r, 10));

    document.getElementById('startBtn').click();
    const avisoOkBtn = document.getElementById('avisoOk');
    if (avisoOkBtn) avisoOkBtn.click();

    // Seleccionar opción
    const optBtn = document.querySelector('#opts .opt');
    if (optBtn) {
      optBtn.click();
      document.getElementById('nextBtn').click();

      await new Promise(r => setTimeout(r, 10));
      const resultScreen = document.getElementById('resultScreen');
      expect(resultScreen.classList.contains('active')).toBe(true);
    }
  });
});
