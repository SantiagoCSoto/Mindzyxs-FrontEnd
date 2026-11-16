import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('sesion-header.js', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = `
      <a class="nav-inicio" href="inicio.html">Inicio</a>
      <a class="logo-link" href="inicio.html">Mindzyxs</a>
      <div class="header-auth-buttons"></div>
    `;
    window.location.href = 'http://localhost/inicio.html';
  });

  it('no debe ocultar inicio si no hay sesión activa', async () => {
    await import('../../js/sesion-header.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const inicio = document.querySelector('.nav-inicio');
    expect(inicio.style.display).not.toBe('none');
  });

  it('debe ocultar inicio, redirigir logo al panel y agregar logout si hay sesión de paciente', async () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rol: 'Paciente' }));
    sessionStorage.setItem('autenticado', 'true');

    await import('../../js/sesion-header.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const inicio = document.querySelector('.nav-inicio');
    expect(inicio.style.display).toBe('none');

    const logo = document.querySelector('.logo-link');
    expect(logo.getAttribute('href')).toBe('panel_paciente.html');

    const btnLogout = document.querySelector('.btn-logout');
    expect(btnLogout).not.toBeNull();

    // Probar click en logout
    btnLogout.click();
    expect(sessionStorage.getItem('autenticado')).toBeNull();
  });

  it('debe enviar al panel de invitado si es_invitado es true', async () => {
    sessionStorage.setItem('es_invitado', 'true');

    await import('../../js/sesion-header.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const logo = document.querySelector('.logo-link');
    expect(logo.getAttribute('href')).toBe('panel_invitado.html');
  });

  it('debe bloquear retroceso con pushState cuando se encuentra en un panel', async () => {
    window.location.href = 'http://localhost/views/panel_paciente.html';
    const spyPushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});

    await import('../../js/sesion-header.js?test=4');

    expect(spyPushState).toHaveBeenCalledTimes(1);

    // Simular evento popstate (presionar flecha atrás)
    window.dispatchEvent(new window.PopStateEvent('popstate'));
    expect(spyPushState).toHaveBeenCalledTimes(2);

    // Simular evento pageshow con persisted
    const pageShowEvt = new window.Event('pageshow');
    Object.defineProperty(pageShowEvt, 'persisted', { value: true });
    window.dispatchEvent(pageShowEvt);
    expect(spyPushState).toHaveBeenCalledTimes(3);
  });

  it('debe redirigir al panel correcto si un rol intenta acceder a un panel diferente o al login', async () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rol: 'Psicologo' }));
    sessionStorage.setItem('autenticado', 'true');

    // Intentar acceder a panel de paciente
    window.location.href = 'http://localhost/views/panel_paciente.html';
    await import('../../js/sesion-header.js');

    expect(window.location.href).toContain('panel_psicologo.html');
  });
});
