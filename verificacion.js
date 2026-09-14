const formVerificacion = document.getElementById('form-verificacion');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const modalExito = document.getElementById('modal-exito');

function mostrarError(mensaje) {
  inputCodigo.classList.add('error');
  bannerError.textContent = mensaje;
  bannerError.style.display = 'block';
}

function ocultarError() {
  inputCodigo.classList.remove('error');
  bannerError.style.display = 'none';
}

inputCodigo.addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
  ocultarError();
});

// Códigos de prueba
formVerificacion.addEventListener('submit', function (e) {
  e.preventDefault();
  const codigo = inputCodigo.value.trim();

  if (codigo.length < 6) {
    mostrarError('Por favor, ingresa el código completo de 6 dígitos.');
    return;
  }

  if (codigo === '000000') {
    mostrarError('El código expiró. Reenvía el código');
    return;
  }

  if (codigo === '123456') {
    ocultarError();
    modalExito.classList.add('activo');
    return;
  }

  mostrarError('Código incorrecto. Inténtalo de nuevo.');
});

modalExito.addEventListener('click', function (e) {
  if (e.target === modalExito) {
    modalExito.classList.remove('activo');
  }
});
