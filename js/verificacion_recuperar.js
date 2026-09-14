const formVerificacionRecuperar = document.getElementById('form-verificacion-recuperar');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnReenviar = document.getElementById('btn-reenviar');
const btnModalContinuar = document.getElementById('btn-modal-continuar');

let temporizadorExito = null;

function mostrarError(mensaje) {
  inputCodigo.classList.add('error');
  bannerError.textContent = mensaje;
  bannerError.style.display = 'block';
  if (bannerExito) bannerExito.style.display = 'none';
}

function ocultarError() {
  inputCodigo.classList.remove('error');
  bannerError.style.display = 'none';
}

inputCodigo.addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
  ocultarError();
  if (bannerExito) bannerExito.style.display = 'none';
});

// Códigos de prueba para recuperación de contraseña
formVerificacionRecuperar.addEventListener('submit', function (e) {
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

if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', function () {
    modalExito.classList.remove('activo');
    // Redirigir a página de nueva contraseña
    window.location.href = 'nueva_contrasena.html';
  });
}

if (btnReenviar) {
  btnReenviar.addEventListener('click', function () {
    ocultarError();
    inputCodigo.value = '';
    inputCodigo.focus();

    if (bannerExito) {
      bannerExito.style.display = 'block';
      clearTimeout(temporizadorExito);
      temporizadorExito = setTimeout(() => {
        bannerExito.style.display = 'none';
      }, 4000);
    }
  });
}
