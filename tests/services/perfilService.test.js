import { describe, it, expect, beforeEach, vi } from 'vitest';
import { perfilService } from '../../js/services/perfilService.js';
import * as apiClient from '../../js/services/apiClient.js';
import { authService } from '../../js/services/authService.js';

describe('perfilService.js', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('enmascararCorreo oculta caracteres privados', () => {
    expect(perfilService.enmascararCorreo('usuario@test.com')).toBe('u***@test.com');
    expect(perfilService.enmascararCorreo('invalido')).toBe('***');
  });

  it('actualizarPerfil envía datos y retorna éxito', async () => {
    vi.spyOn(apiClient, 'putJson').mockResolvedValue({
      ok: true,
      data: { mensaje: 'Perfil actualizado' }
    });

    const res = await perfilService.actualizarPerfil({ nombres: 'Carlos' });
    expect(res.exito).toBe(true);
    expect(res.mensaje).toBe('Perfil actualizado');
  });

  it('solicitarCambioCorreo maneja éxito y correo duplicado', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
      ok: true,
      data: { mensaje: 'Código enviado' }
    });
    const resOk = await perfilService.solicitarCambioCorreo('nuevo@test.com');
    expect(resOk.exito).toBe(true);

    vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: 'El correo ya se encuentra registrado'
    });
    const resDup = await perfilService.solicitarCambioCorreo('dup@test.com');
    expect(resDup.exito).toBe(false);
    expect(resDup.esDuplicado).toBe(true);
  });

  it('confirmarCambioCorreo confirma código y detecta expirado', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
      ok: true,
      data: { mensaje: 'Confirmado' }
    });
    const resOk = await perfilService.confirmarCambioCorreo('nuevo@test.com', '123456');
    expect(resOk.exito).toBe(true);

    vi.spyOn(apiClient, 'postJson').mockResolvedValueOnce({
      ok: false,
      status: 410,
      error: 'Código expiró'
    });
    const resExp = await perfilService.confirmarCambioCorreo('nuevo@test.com', '123456');
    expect(resExp.exito).toBe(false);
    expect(resExp.expirado).toBe(true);
  });

  it('obtenerPerfil obtiene y normaliza datos del backend', async () => {
    vi.spyOn(apiClient, 'getJson').mockResolvedValue({
      ok: true,
      data: { Nombres: 'Juan', Apellidos: 'Perez', FechaNacimiento: '1995-05-10T00:00:00Z' }
    });

    const res = await perfilService.obtenerPerfil();
    expect(res.nombres).toBe('Juan');
    expect(res.fechaNacimiento).toBe('1995-05-10');
  });

  it('obtenerPerfilActual y guardarPerfilEnSesion gestionan sesión', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ id: 1, nombres: 'Ana', correo: 'ana@test.com' }));
    const p = perfilService.obtenerPerfilActual();
    expect(p.nombres).toBe('Ana');

    perfilService.guardarPerfilEnSesion({ nombres: 'Ana Maria' });
    const actualizado = JSON.parse(sessionStorage.getItem('usuario'));
    expect(actualizado.nombres).toBe('Ana Maria');
  });
});
