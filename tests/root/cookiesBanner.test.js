import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('cookies-banner.js', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = `<div>Contenido base</div>`;
  });

  it('debe renderizar el banner si no hay consentimiento previo', async () => {
    await import('../../js/cookies-banner.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const banner = document.querySelector('.mzck');
    expect(banner).not.toBeNull();

    // Click aceptar
    const btnAceptar = document.getElementById('mzck-aceptar');
    expect(btnAceptar).not.toBeNull();
    btnAceptar.click();

    expect(document.querySelector('.mzck')).toBeNull();
    const stored = JSON.parse(localStorage.getItem('mz_consent'));
    expect(stored.funcionales).toBe(true);
  });

  it('debe permitir configurar y rechazar cookies funcionales', async () => {
    await import('../../js/cookies-banner.js');
    window.reabrirCookies();

    const banner = document.querySelector('.mzck');
    expect(banner).not.toBeNull();

    const chkFun = document.getElementById('mzck-fun');
    expect(chkFun).not.toBeNull();
    chkFun.checked = false;

    const btnGuardar = document.getElementById('mzck-guardar');
    btnGuardar.click();

    const stored = JSON.parse(localStorage.getItem('mz_consent'));
    expect(stored.funcionales).toBe(false);
  });
});
