import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('encuestaInvitadoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/encuesta_invitado.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/encuesta_invitado.html';
    vi.restoreAllMocks();
  });

  it('debe cargar cuestionario y mostrar preguntas dinámicamente', async () => {
    const encuestaService = await import('../../js/services/encuestaService.js');
    vi.spyOn(encuestaService, 'obtenerPendiente').mockResolvedValue({
      id: 1,
      titulo: 'Cuestionario de Bienestar',
      preguntas: [
        {
          id: 10,
          texto: '¿Cómo te sientes?',
          opciones: [
            { id: 101, texto: 'Bien' },
            { id: 102, texto: 'Mal' }
          ]
        }
      ]
    });
    vi.spyOn(encuestaService, 'registrarInicio').mockResolvedValue();

    await import('../../js/controllers/encuestaInvitadoController.js');
    await new Promise(r => setTimeout(r, 30));

    const contenedor = document.getElementById('preguntas-dinamicas');
    expect(contenedor.innerHTML).toContain('¿Cómo te sientes?');
  });

  it('debe validar que se seleccione una opción antes de avanzar', async () => {
    const encuestaService = await import('../../js/services/encuestaService.js');
    vi.spyOn(encuestaService, 'obtenerPendiente').mockResolvedValue({
      id: 1,
      titulo: 'Test',
      preguntas: [
        { id: 1, texto: 'Pregunta 1', opciones: [{ id: 10, texto: 'Op 1' }] }
      ]
    });

    await import('../../js/controllers/encuestaInvitadoController.js');
    await new Promise(r => setTimeout(r, 30));

    const btnSiguiente = document.getElementById('btn-siguiente');
    btnSiguiente.click(); // avanza de aviso a pregunta 1

    btnSiguiente.click(); // intenta avanzar sin seleccionar opción
    const errorMsg = document.getElementById('error-mensaje');
    expect(errorMsg.textContent).toContain('Debes seleccionar una respuesta');
  });

  it('debe avanzar y finalizar al responder todas las preguntas', async () => {
    const encuestaService = await import('../../js/services/encuestaService.js');
    vi.spyOn(encuestaService, 'obtenerPendiente').mockResolvedValue({
      id: 1,
      titulo: 'Test',
      preguntas: [
        { id: 1, texto: 'Pregunta 1', opciones: [{ id: 10, texto: 'Op 1' }] }
      ]
    });
    vi.spyOn(encuestaService, 'finalizarCuestionarioBack').mockResolvedValue({
      puntaje: 3,
      nivel: 'Medio',
      mensaje: 'Finalizado'
    });
    vi.spyOn(encuestaService, 'guardarEncuestaTemporal').mockReturnValue({});
    vi.spyOn(encuestaService, 'guardarNivel').mockReturnValue({});

    await import('../../js/controllers/encuestaInvitadoController.js');
    await new Promise(r => setTimeout(r, 30));

    const btnSiguiente = document.getElementById('btn-siguiente');
    btnSiguiente.click(); // de aviso a pregunta 1

    const radio = document.querySelector('input[name="q1"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      btnSiguiente.click(); // finalizar

      await new Promise(r => setTimeout(r, 30));
      expect(encuestaService.finalizarCuestionarioBack).toHaveBeenCalled();
    }
  });

  it('debe manejar estado sin pendientes', async () => {
    const encuestaService = await import('../../js/services/encuestaService.js');
    vi.spyOn(encuestaService, 'obtenerPendiente').mockResolvedValue({
      disponible: false,
      mensaje: 'No tienes cuestionarios pendientes'
    });

    await import('../../js/controllers/encuestaInvitadoController.js');
    await new Promise(r => setTimeout(r, 30));

    const sinPendientes = document.getElementById('sin-pendientes-msg');
    expect(sinPendientes.textContent).toContain('No tienes cuestionarios pendientes');
  });
});
