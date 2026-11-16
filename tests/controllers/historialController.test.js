import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('historialController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/historial.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  let authService;
  let historialService;

  beforeAll(async () => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/historial.html';

    authService = (await import('../../js/services/authService.js')).authService;
    historialService = (await import('../../js/services/historialService.js')).historialService;

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(historialService, 'obtenerHistorial').mockResolvedValue({
      exito: true,
      total: 1,
      data: [
        {
          id: 10,
          fecha: '01/03/2026',
          hora: '10:00',
          tipo: 'RegistroEmocional',
          puntaje: 4,
          categoria: 'pos',
          emoji: '😊',
          valorTexto: 'Positivo (4/5)',
          resumen: 'Buen día'
        }
      ]
    });
    vi.spyOn(historialService, 'obtenerDetalle').mockResolvedValue({
      exito: true,
      data: {
        id: 10,
        fecha: '01/03/2026',
        hora: '10:00',
        tipo: 'RegistroEmocional',
        categoria: 'pos',
        emoji: '😊',
        valorTexto: 'Positivo (4/5)',
        nota: 'Detalle de la nota',
        respuestas: [],
        observaciones: []
      }
    });

    await import('../../js/controllers/historialController.js');
    await new Promise(r => setTimeout(r, 40));
  });

  it('debe cargar y renderizar lista de registros emocionales', () => {
    const recordList = document.getElementById('recordList');
    expect(recordList.innerHTML).toContain('Positivo (4/5)');
  });

  it('debe filtrar registros por fecha y permitir limpiar filtros', async () => {
    const spyHistorial = vi.spyOn(historialService, 'obtenerHistorial').mockResolvedValue({
      exito: true,
      total: 0,
      data: []
    });

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const btnFilter = document.getElementById('btnFilter');
    const btnClear = document.getElementById('btnClear');

    dateFrom.value = '2026-03-01';
    dateTo.value = '2026-03-15';
    btnFilter.click();
    await new Promise(r => setTimeout(r, 20));

    expect(spyHistorial).toHaveBeenCalledWith('2026-03-01', '2026-03-15');

    btnClear.click();
    await new Promise(r => setTimeout(r, 20));
    expect(dateFrom.value).toBe('');
    expect(dateTo.value).toBe('');
  });

  it('debe abrir modal de detalle al hacer clic en un registro', async () => {
    const item = document.querySelector('.record-item');
    if (item) {
      item.click();
      await new Promise(r => setTimeout(r, 20));

      const detailModal = document.getElementById('detailModal');
      expect(detailModal.classList.contains('active') || detailModal.style.display !== 'none').toBe(true);

      const btnBack = document.getElementById('btnBackHistory');
      btnBack.click();
      expect(detailModal.classList.contains('active')).toBe(false);
    }
  });
});
