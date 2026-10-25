/**
 * Utilidades para el manejo visual de alertas, errores y modales en el DOM
 */

export function marcarErrorInput(input, spanError, mensaje) {
  if (input) {
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    if (spanError && spanError.id) {
      input.setAttribute('aria-describedby', spanError.id);
    }
  }
  if (spanError) {
    spanError.textContent = mensaje;
    spanError.classList.add('visible');
    spanError.style.display = 'block';
    spanError.setAttribute('role', 'alert');
    spanError.setAttribute('aria-live', 'assertive');
  }
}

export function limpiarErrorInput(input, spanError) {
  if (input) {
    input.classList.remove('error');
    input.removeAttribute('aria-invalid');
  }
  if (spanError) {
    spanError.textContent = '';
    spanError.classList.remove('visible');
    spanError.style.display = 'none';
    spanError.removeAttribute('role');
    spanError.removeAttribute('aria-live');
  }
}

export function mostrarBanner(bannerElement, mensaje = '') {
  if (!bannerElement) return;
  if (mensaje) {
    bannerElement.textContent = mensaje;
  }
  bannerElement.classList.add('visible');
  bannerElement.style.display = 'block';
  bannerElement.setAttribute('role', 'alert');
  bannerElement.setAttribute('aria-live', 'assertive');
}

export function ocultarBanner(bannerElement) {
  if (!bannerElement) return;
  bannerElement.classList.remove('visible');
  bannerElement.style.display = 'none';
  bannerElement.removeAttribute('role');
  bannerElement.removeAttribute('aria-live');
}

export function abrirModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.add('activo');
  modalElement.setAttribute('aria-hidden', 'false');
  if (window.MindzyxsA11y && typeof window.MindzyxsA11y.onModalOpened === 'function') {
    window.MindzyxsA11y.onModalOpened(modalElement);
  }
}

export function cerrarModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.remove('activo');
  modalElement.setAttribute('aria-hidden', 'true');
  if (window.MindzyxsA11y && typeof window.MindzyxsA11y.onModalClosed === 'function') {
    window.MindzyxsA11y.onModalClosed(modalElement);
  }
}