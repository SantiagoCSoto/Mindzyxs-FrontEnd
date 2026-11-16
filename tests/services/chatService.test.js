import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as chatService from '../../js/services/chatService.js';
import * as apiClient from '../../js/services/apiClient.js';

describe('chatService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('REST Endpoints', () => {
    it('obtenerTokenChat retorna token firebase', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({
        ok: true,
        data: { firebaseToken: 'tok-123', uid: 'u1' }
      });

      const res = await chatService.obtenerTokenChat();
      expect(res.firebaseToken).toBe('tok-123');
    });

    it('obtenerConversaciones obtiene lista de conversaciones', async () => {
      vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 1, nombreOtro: 'Psicologo' }]
      });

      const convs = await chatService.obtenerConversaciones();
      expect(convs.length).toBe(1);
    });

    it('buscarPacientes con filtros', async () => {
      const getSpy = vi.spyOn(apiClient, 'getJson').mockResolvedValue({
        ok: true,
        data: [{ id: 5, nombre: 'Paciente' }]
      });

      const res = await chatService.buscarPacientes('carlos', { nivel: 'Alto', minCuestionarios: 2 });
      expect(res.length).toBe(1);
      expect(getSpy).toHaveBeenCalledWith('/chat/pacientes?q=carlos&nivel=Alto&minCuestionarios=2');
    });

    it('ofrecerChat y responderSolicitud', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true, data: { ok: true } });

      const ofr = await chatService.ofrecerChat(10);
      expect(ofr.ok).toBe(true);

      const resp = await chatService.responderSolicitud(1, true);
      expect(resp.ok).toBe(true);
    });

    it('solicitarChat y responderPsicologo', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true, data: { ok: true } });

      const sol = await chatService.solicitarChat(2);
      expect(sol.ok).toBe(true);

      const resp = await chatService.responderPsicologo(1, false);
      expect(resp.ok).toBe(true);
    });

    it('bloqueos: solicitar, resolver, bloquear, desbloquear', async () => {
      vi.spyOn(apiClient, 'postJson').mockResolvedValue({ ok: true, data: { ok: true } });
      vi.spyOn(apiClient, 'deleteJson').mockResolvedValue({ ok: true, data: { ok: true } });

      expect((await chatService.solicitarBloqueo(1, 'Inapropiado')).ok).toBe(true);
      expect((await chatService.resolverBloqueo(1, true)).ok).toBe(true);
      expect((await chatService.bloquearChat(1)).ok).toBe(true);
      expect((await chatService.desbloquearChat(1)).ok).toBe(true);
    });

    it('avisarMensaje no lanza error ante fallo', async () => {
      vi.spyOn(apiClient, 'postJson').mockRejectedValue(new Error('fail'));
      await expect(chatService.avisarMensaje(1)).resolves.not.toThrow();
    });
  });

  describe('RTDB Helpers', () => {
    it('suscribirMensajes, enviarMensaje, marcarPresencia, avisarEscribiendo', async () => {
      const mockSnap = { key: 'm1', val: () => ({ texto: 'Hola' }) };
      const mockRef = {
        on: vi.fn((event, cb) => cb(mockSnap)),
        off: vi.fn(),
        push: vi.fn().mockResolvedValue(),
        set: vi.fn(),
        onDisconnect: vi.fn().mockReturnValue({ remove: vi.fn() })
      };
      const mockDb = {
        ref: vi.fn().mockReturnValue(mockRef)
      };

      const handler = vi.fn();
      const unsub = chatService.suscribirMensajes(mockDb, 1, handler);
      expect(handler).toHaveBeenCalledWith({ id: 'm1', texto: 'Hola' });
      unsub();
      expect(mockRef.off).toHaveBeenCalled();

      await chatService.enviarMensaje(mockDb, 1, 'u1', 'Test msg');
      expect(mockRef.push).toHaveBeenCalled();

      chatService.marcarPresencia(mockDb, 1, 'u1');
      expect(mockRef.set).toHaveBeenCalled();

      chatService.avisarEscribiendo(mockDb, 1, 'u1', true);
      expect(mockRef.set).toHaveBeenCalled();
    });
  });
});
