import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  marcarErrorInput,
  limpiarErrorInput,
  mostrarBanner,
  ocultarBanner,
  abrirModal,
  cerrarModal
} from '../../js/utils/alerts.js';

describe('alerts.js', () => {
  let input, spanError, banner, modal;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="testInput" />
      <span id="testError"></span>
      <div id="testBanner"></div>
      <div id="testModal" class="modal-overlay"></div>
    `;
    input = document.getElementById('testInput');
    spanError = document.getElementById('testError');
    banner = document.getElementById('testBanner');
    modal = document.getElementById('testModal');
  });

  it('marcarErrorInput debe asignar clases y atributos de accesibilidad', () => {
    marcarErrorInput(input, spanError, 'Error de prueba');
    expect(input.classList.contains('error')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('testError');
    expect(spanError.textContent).toBe('Error de prueba');
    expect(spanError.classList.contains('visible')).toBe(true);
    expect(spanError.getAttribute('role')).toBe('alert');
    expect(spanError.getAttribute('aria-live')).toBe('assertive');
  });

  it('limpiarErrorInput debe resetear clases y atributos', () => {
    marcarErrorInput(input, spanError, 'Error previo');
    limpiarErrorInput(input, spanError);
    expect(input.classList.contains('error')).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(spanError.textContent).toBe('');
    expect(spanError.classList.contains('visible')).toBe(false);
    expect(spanError.getAttribute('role')).toBeNull();
  });

  it('mostrarBanner y ocultarBanner deben gestionar visualización y roles', () => {
    mostrarBanner(banner, 'Mensaje de alerta');
    expect(banner.textContent).toBe('Mensaje de alerta');
    expect(banner.classList.contains('visible')).toBe(true);
    expect(banner.getAttribute('role')).toBe('alert');

    ocultarBanner(banner);
    expect(banner.classList.contains('visible')).toBe(false);
    expect(banner.getAttribute('role')).toBeNull();
  });

  it('abrirModal y cerrarModal deben alternar clases y aria-hidden', () => {
    window.MindzyxsA11y = {
      onModalOpened: vi.fn(),
      onModalClosed: vi.fn()
    };

    abrirModal(modal);
    expect(modal.classList.contains('activo')).toBe(true);
    expect(modal.getAttribute('aria-hidden')).toBe('false');
    expect(window.MindzyxsA11y.onModalOpened).toHaveBeenCalledWith(modal);

    cerrarModal(modal);
    expect(modal.classList.contains('activo')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
    expect(window.MindzyxsA11y.onModalClosed).toHaveBeenCalledWith(modal);
  });

  it('debe tolerar elementos nulos sin lanzar excepción', () => {
    expect(() => marcarErrorInput(null, null, 'msg')).not.toThrow();
    expect(() => limpiarErrorInput(null, null)).not.toThrow();
    expect(() => mostrarBanner(null)).not.toThrow();
    expect(() => ocultarBanner(null)).not.toThrow();
    expect(() => abrirModal(null)).not.toThrow();
    expect(() => cerrarModal(null)).not.toThrow();
  });
});
