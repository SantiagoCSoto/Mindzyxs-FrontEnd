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

  it('debe redirigir a login si no hay sesión iniciada', async () => {
    sessionStorage.clear();
    await import('../../js/controllers/chatController.js');
    expect(window.location.href).toContain('login.html');
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

  it('debe validar mensaje vacío al intentar enviar', async () => {
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

    msgInput.value = '   ';
    sendBtn.click();
    await new Promise(r => setTimeout(r, 20));

    expect(spyEnviar).not.toHaveBeenCalled();
    const toast = document.getElementById('toast');
    expect(toast.textContent).toContain('Escriba un mensaje primero');
  });

  it('debe enviar mensaje cuando se presiona el botón Enviar o tecla Enter', async () => {
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

    // Tecla Enter
    msgInput.value = 'Segunda línea';
    msgInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise(r => setTimeout(r, 20));
    expect(spyEnviar).toHaveBeenCalledWith(
      expect.anything(),
      10,
      '1',
      'Segunda línea'
    );
  });

  it('debe manejar apertura, validación y confirmación del modal de bloqueo', async () => {
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
    const spyBloqueo = vi.spyOn(chatService, 'solicitarBloqueo').mockResolvedValue();

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const blockBtn = document.getElementById('blockBtn');
    const blockModal = document.getElementById('blockModal');
    const blockCancel = document.getElementById('blockCancel');
    const blockConfirm = document.getElementById('blockConfirm');
    const blockMotivo = document.getElementById('blockMotivo');
    const toast = document.getElementById('toast');

    // Abrir modal
    blockBtn.click();
    expect(blockModal.classList.contains('open')).toBe(true);

    // Cancelar modal
    blockCancel.click();
    expect(blockModal.classList.contains('open')).toBe(false);

    // Reabrir e intentar confirmar sin motivo
    blockBtn.click();
    blockMotivo.value = '   ';
    blockConfirm.click();
    expect(toast.textContent).toContain('Cuéntenos el motivo');

    // Confirmar con motivo
    blockMotivo.value = 'Conducta inapropiada';
    blockConfirm.click();
    await new Promise(r => setTimeout(r, 20));

    expect(spyBloqueo).toHaveBeenCalledWith(10, 'Conducta inapropiada');
    expect(blockModal.classList.contains('open')).toBe(false);
  });

  it('debe desbloquear contacto con unblockBtn y manejar botones de resolver', async () => {
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
        estado: 'Bloqueada',
        bloqueadaPorMi: true,
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
    const spyDesbloquear = vi.spyOn(chatService, 'desbloquearChat').mockResolvedValue();
    const spyResolver = vi.spyOn(chatService, 'resolverBloqueo').mockResolvedValue();

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const unblockBtn = document.getElementById('unblockBtn');
    unblockBtn.click();
    await new Promise(r => setTimeout(r, 20));
    expect(spyDesbloquear).toHaveBeenCalledWith(10);

    const btnResolverSi = document.getElementById('btnResolverSi');
    btnResolverSi.click();
    await new Promise(r => setTimeout(r, 20));
    expect(spyResolver).toHaveBeenCalledWith(10, true);

    const btnResolverNo = document.getElementById('btnResolverNo');
    btnResolverNo.click();
    await new Promise(r => setTimeout(r, 20));
    expect(spyResolver).toHaveBeenCalledWith(10, false);
  });

  it('debe permitir buscar pacientes como psicólogo con validación de filtros', async () => {
    sessionStorage.setItem('usuario', JSON.stringify({ id: 2, rol: 'Psicologo' }));
    const { authService } = await import('../../js/services/authService.js');
    const chatService = await import('../../js/services/chatService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({ especialidades: [], generos: [] });
    vi.spyOn(chatService, 'obtenerTokenChat').mockResolvedValue({
      firebaseToken: 'tok',
      uid: '2',
      rol: 'Psicologo',
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
    const spyBuscar = vi.spyOn(chatService, 'buscarPacientes').mockResolvedValue([
      {
        id: 5,
        nombre: 'Ana Torres',
        correo: 'ana@test.com',
        ultimoNivel: 'Alto',
        ultimoPuntaje: 18,
        cuestionariosRespondidos: 3,
        psicologos: 0
      }
    ]);

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const btnBuscar = document.getElementById('btnBuscar');
    const searchPaciente = document.getElementById('searchPaciente');
    const toast = document.getElementById('toast');

    // Sin filtros
    btnBuscar.click();
    expect(toast.textContent).toContain('Seleccione al menos un filtro');

    // Con filtro
    searchPaciente.value = 'Ana';
    btnBuscar.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyBuscar).toHaveBeenCalledWith('Ana', expect.anything());
    const searchResults = document.getElementById('searchResults');
    expect(searchResults.innerHTML).toContain('Ana Torres');
  });

  it('debe permitir buscar psicólogos en el directorio como paciente', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const chatService = await import('../../js/services/chatService.js');
    const psicologoService = await import('../../js/services/psicologoService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    vi.spyOn(authService, 'getCatalogos').mockResolvedValue({
      especialidades: [{ id: 1, nombre: 'Ansiedad' }],
      generos: [{ id: 1, nombre: 'Femenino' }]
    });
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
    const spyDirectorio = vi.spyOn(psicologoService, 'obtenerDirectorio').mockResolvedValue({
      ok: true,
      data: [
        {
          id: 3,
          nombre: 'Dra. Gomez',
          pacientesAsignados: 4,
          especialidades: ['Ansiedad'],
          aniosExperiencia: 5,
          descripcionProfesional: 'Psicóloga clínica'
        }
      ]
    });

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const btnBuscarPsi = document.getElementById('btnBuscarPsi');
    const searchPsi = document.getElementById('searchPsi');
    searchPsi.value = 'Gomez';
    btnBuscarPsi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyDirectorio).toHaveBeenCalledWith('Gomez', null, null, null);
    const searchPsiResults = document.getElementById('searchPsiResults');
    expect(searchPsiResults.innerHTML).toContain('Dra. Gomez');
  });

  it('debe manejar cierre de sesión con btn-logout', async () => {
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
    const spyLogout = vi.spyOn(authService, 'logout').mockReturnValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await import('../../js/controllers/chatController.js');
    await new Promise(r => setTimeout(r, 60));

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();

    expect(spyLogout).toHaveBeenCalled();
    expect(window.location.href).toContain('login.html');
  });
});
