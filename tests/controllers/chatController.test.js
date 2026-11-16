import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('chatController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/chat.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('usuario', JSON.stringify({ id: 1, rol: 'Paciente' }));
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/chat.html';
    vi.restoreAllMocks();
  });

  it('debe inicializar tabs de chat y solicitudes con conversaciones cargadas', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const chatService = await import('../../js/services/chatService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ especialidades: [], generos: [] });
    vi.spyOn(chatService, 'obtenerTokenChat').mockResolvedValue({
      firebaseToken: 'tok',
      uid: '1',
      rol: 'Paciente',
      databaseUrl: 'https://test.firebase.com'
    });
    vi.spyOn(chatService, 'obtenerConversaciones').mockResolvedValue([
      {
        id: 1,
        estado: 'Aceptada',
        contraparte: { id: 2, nombre: 'Dr. Lopez', rol: 'Psicologo' },
        ultimoMensaje: { texto: 'Hola', fecha: new Date().toISOString() }
      }
    ]);
    vi.spyOn(chatService, 'conectarRtdb').mockResolvedValue({
      ref: vi.fn().mockReturnValue({
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn().mockResolvedValue({ val: () => null }),
        push: vi.fn().mockResolvedValue(),
        set: vi.fn(),
        onDisconnect: vi.fn().mockReturnValue({ remove: vi.fn(), set: vi.fn() })
      })
    });
    vi.spyOn(chatService, 'suscribirMensajes').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharMeta').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharPresencia').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharEscribiendo').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharVisto').mockReturnValue(() => {});

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const convList = document.getElementById('convList');
    expect(convList.innerHTML).toContain('Dr. Lopez');
  });

  it('debe alternar entre panel de chat y solicitudes al hacer clic en las tabs', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const chatService = await import('../../js/services/chatService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ especialidades: [], generos: [] });
    vi.spyOn(chatService, 'obtenerTokenChat').mockResolvedValue({
      firebaseToken: 'tok',
      uid: '1',
      rol: 'Paciente',
      databaseUrl: 'https://test.firebase.com'
    });
    vi.spyOn(chatService, 'obtenerConversaciones').mockResolvedValue([]);
    vi.spyOn(chatService, 'conectarRtdb').mockResolvedValue({
      ref: vi.fn().mockReturnValue({
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn().mockResolvedValue({ val: () => null })
      })
    });

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const tabReq = document.getElementById('tabReq');
    const panelReq = document.getElementById('panelReq');
    const panelChat = document.getElementById('panelChat');

    tabReq.click();
    expect(panelReq.style.display).toBe('block');
    expect(panelChat.style.display).toBe('none');
    expect(tabReq.classList.contains('active')).toBe(true);

    const tabChat = document.getElementById('tabChat');
    tabChat.click();
    expect(panelChat.style.display).toBe('block');
    expect(panelReq.style.display).toBe('none');
  });

  it('debe enviar mensaje cuando se presiona el botón Enviar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const chatService = await import('../../js/services/chatService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ especialidades: [], generos: [] });
    vi.spyOn(chatService, 'obtenerTokenChat').mockResolvedValue({
      firebaseToken: 'tok',
      uid: '1',
      rol: 'Paciente',
      databaseUrl: 'https://test.firebase.com'
    });
    vi.spyOn(chatService, 'obtenerConversaciones').mockResolvedValue([
      {
        id: 10,
        estado: 'Aceptada',
        contraparte: { id: 2, nombre: 'Dr. Lopez', rol: 'Psicologo' },
        ultimoMensaje: null
      }
    ]);
    vi.spyOn(chatService, 'conectarRtdb').mockResolvedValue({
      ref: vi.fn().mockReturnValue({
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn().mockResolvedValue({ val: () => null })
      })
    });
    vi.spyOn(chatService, 'suscribirMensajes').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharMeta').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharPresencia').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharEscribiendo').mockReturnValue(() => {});
    vi.spyOn(chatService, 'escucharVisto').mockReturnValue(() => {});
    const spyEnviar = vi.spyOn(chatService, 'enviarMensaje').mockResolvedValue();

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');

    msgInput.value = 'Hola doctor';
    sendBtn.click();
    await new Promise(r => setTimeout(r, 20));

    expect(spyEnviar).toHaveBeenCalledWith(
      expect.anything(),
      10,
      '1',
      'Hola doctor'
    );
  });
});
