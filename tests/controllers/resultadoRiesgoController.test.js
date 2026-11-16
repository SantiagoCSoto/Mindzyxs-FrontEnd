import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('resultadoRiesgoController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/resultado_riesgo.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/resultado_riesgo.html';
    vi.restoreAllMocks();
  });

  it('debe calcular y pintar resultado de riesgo exitosamente', async () => {
    sessionStorage.setItem('encuesta_invitado_front', JSON.stringify({
      cuestionarioId: 1,
      respuestas: [{ preguntaId: 1, opcionId: 2 }]
    }));

    const { avisoService } = await import('../../js/services/avisoService.js');
    const { calcularRiesgo } = await import('../../js/services/riesgoService.js');

    vi.spyOn(avisoService, 'obtenerAviso').mockResolvedValue({
      data: { titulo: 'Aviso Test', texto: 'Texto aclaratorio' }
    });
    vi.spyOn(avisoService, 'registrarVisualizacion').mockReturnValue();
    vi.spyOn(await import('../../js/services/riesgoService.js'), 'calcularRiesgo').mockResolvedValue({
      nivel: 'Alto',
      puntaje: 4,
      explicacion: 'Riesgo alto detectado',
      alerta: { mostrar: true }
    });

    await import('../../js/controllers/resultadoRiesgoController.js');
    await new Promise(r => setTimeout(r, 40));

    const resLevel = document.getElementById('resLevel');
    expect(resLevel.textContent).toContain('Alto');
  });

  it('debe mostrar error si no hay sesión ni cookies de riesgo previo', async () => {
    const encuestaService = await import('../../js/services/encuestaService.js');
    vi.spyOn(encuestaService, 'leerRiesgos').mockReturnValue([]);

    await import('../../js/controllers/resultadoRiesgoController.js');
    await new Promise(r => setTimeout(r, 30));

    const errorCard = document.getElementById('errorCard');
    expect(errorCard.hidden).toBe(false);
  });

  it('debe cargar y mostrar modal de líneas de ayuda al presionar el botón', async () => {
    sessionStorage.setItem('encuesta_invitado_front', JSON.stringify({
      cuestionarioId: 1,
      respuestas: [{ preguntaId: 1, opcionId: 2 }]
    }));

    const riesgoService = await import('../../js/services/riesgoService.js');
    vi.spyOn(riesgoService, 'calcularRiesgo').mockResolvedValue({
      nivel: 'Medio',
      puntaje: 3,
      explicacion: 'Riesgo medio',
      alerta: { mostrar: false }
    });
    vi.spyOn(riesgoService, 'obtenerLineas').mockResolvedValue([
      { id: 1, nombre: 'Línea Nacional', telefono: '106', horario: '24/7' }
    ]);

    await import('../../js/controllers/resultadoRiesgoController.js');
    await new Promise(r => setTimeout(r, 40));

    const btnLineas = document.getElementById('btnLineas');
    btnLineas.click();
    await new Promise(r => setTimeout(r, 20));

    const lineasModal = document.getElementById('lineasModal');
    expect(lineasModal.classList.contains('activo') || lineasModal.style.display !== 'none').toBe(true);
  });
});
