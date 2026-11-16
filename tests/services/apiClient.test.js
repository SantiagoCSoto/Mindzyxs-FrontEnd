import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  escaparHtml,
  getJson,
  postJson,
  putJson,
  postFormData,
  deleteJson,
  getBlob,
  API_BASE_URL
} from '../../js/services/apiClient.js';

describe('apiClient.js', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('escaparHtml debe neutralizar caracteres peligrosos para evitar XSS', () => {
    expect(escaparHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
    expect(escaparHtml("a & b 'c'")).toBe('a &amp; b &#39;c&#39;');
    expect(escaparHtml(null)).toBe('');
    expect(escaparHtml(123)).toBe('123');
  });

  it('getJson debe procesar respuestas 200 JSON correctamente', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ test: 'ok' })
    });

    const res = await getJson('/test');
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ test: 'ok' });
  });

  it('postJson debe incluir token de autorización en headers si existe', async () => {
    localStorage.setItem('token', 'fake-token-123');

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      expect(options.headers['Authorization']).toBe('Bearer fake-token-123');
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ creado: true })
      });
    });

    const res = await postJson('/crear', { nombre: 'Test' });
    expect(res.ok).toBe(true);
  });

  it('putJson debe manejar respuestas con error (p.ej. 400)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Datos inválidos' })
    });

    const res = await putJson('/actualizar', { id: 1 });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toBe('Datos inválidos');
  });

  it('deleteJson debe procesar eliminación exitosa', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ mensaje: 'Eliminado' })
    });

    const res = await deleteJson('/eliminar/1');
    expect(res.ok).toBe(true);
    expect(res.data.mensaje).toBe('Eliminado');
  });

  it('postFormData debe enviar multipart sin romper cabeceras', async () => {
    const fd = new FormData();
    fd.append('file', 'test');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ subido: true })
    });

    const res = await postFormData('/upload', fd);
    expect(res.ok).toBe(true);
  });

  it('getBlob debe retornar un Blob binario cuando la descarga es correcta', async () => {
    const fakeBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/pdf' },
      blob: async () => fakeBlob
    });

    const res = await getBlob('/reporte.pdf');
    expect(res.ok).toBe(true);
    expect(res.blob).toBe(fakeBlob);
  });

  it('debe manejar errores de red y abortos/timeouts adecuadamente', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    const res = await getJson('/fail');
    expect(res.ok).toBe(false);
    expect(res.isNetworkError).toBe(true);
    expect(res.error).toContain('No fue posible conectar');

    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);
    const resTimeout = await postJson('/timeout', {});
    expect(resTimeout.ok).toBe(false);
    expect(resTimeout.error).toContain('tardó demasiado');
  });

  it('debe limpiar la sesión ante un 401 fuera de endpoints de autenticación', async () => {
    localStorage.setItem('token', 'token-vencido');
    sessionStorage.setItem('usuario', '{}');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Token expirado' })
    });

    await getJson('/recurso-protegido');
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('usuario')).toBeNull();
  });
});
