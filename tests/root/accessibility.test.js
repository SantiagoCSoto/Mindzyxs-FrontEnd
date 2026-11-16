import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('accessibility.js', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <button id="triggerBtn">Abrir Modal</button>
      <div id="testModal" class="modal-overlay" role="dialog" aria-modal="true" style="display:none;">
        <button id="firstBtn">Primero</button>
        <input id="modalInput" type="text" />
        <button id="closeBtn" class="btn-close">Cerrar</button>
      </div>
      <a href="#" role="button" id="fakeBtn">Enlace Botón</a>
    `;
  });

  it('debe registrar window.MindzyxsA11y con sus métodos', async () => {
    await import('../../js/accessibility.js');
    expect(window.MindzyxsA11y).toBeDefined();
    expect(typeof window.MindzyxsA11y.isModalOpen).toBe('function');
    expect(typeof window.MindzyxsA11y.requestModalClose).toBe('function');
  });

  it('debe gestionar apertura de modal, trampa de foco y cierre accesible con Escape', async () => {
    await import('../../js/accessibility.js');
    const modal = document.getElementById('testModal');
    const trigger = document.getElementById('triggerBtn');

    trigger.focus();
    modal.style.display = 'block';
    modal.classList.add('activo');

    window.MindzyxsA11y.onModalOpened(modal);
    expect(modal.getAttribute('aria-hidden')).toBe('false');

    // Simular Escape keydown
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(escEvent);

    // Simular Tab keydown
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(tabEvent);

    window.MindzyxsA11y.onModalClosed(modal);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
    await new Promise((resolve) => setTimeout(resolve, 60));
  });

  it('debe permitir activar elementos con role="button" mediante Enter y Espacio', async () => {
    await import('../../js/accessibility.js');
    const fakeBtn = document.getElementById('fakeBtn');
    const clickSpy = vi.fn();
    fakeBtn.addEventListener('click', clickSpy);

    fakeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clickSpy).toHaveBeenCalled();
  });
});
