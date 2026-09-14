/**
 * Utilidades para el manejo visual de alertas, errores y modales en el DOM
 */

export function marcarErrorInput(input, spanError, mensaje) {
  if (input) {
    input.classList.add('error');
  }
  if (spanError) {
    spanError.textContent = mensaje;
    spanError.classList.add('visible');
    spanError.style.display = 'block';
  }
}

export function limpiarErrorInput(input, spanError) {
  if (input) {
    input.classList.remove('error');
  }
  if (spanError) {
    spanError.textContent = '';
    spanError.classList.remove('visible');
    spanError.style.display = 'none';
  }
}

export function mostrarBanner(bannerElement, mensaje = '') {
  if (!bannerElement) return;
  if (mensaje) {
    bannerElement.textContent = mensaje;
  }
  bannerElement.classList.add('visible');
  bannerElement.style.display = 'block';
}

export function ocultarBanner(bannerElement) {
  if (!bannerElement) return;
  bannerElement.classList.remove('visible');
  bannerElement.style.display = 'none';
}

export function abrirModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.add('activo');
}

export function cerrarModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.remove('activo');
}
