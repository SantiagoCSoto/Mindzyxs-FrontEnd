const formLogin = document.getElementById('form-login');
const inputCorreo = document.getElementById('correo');
const inputPassword = document.getElementById('password');
const errorCorreo = document.getElementById('error-correo');
const errorPassword = document.getElementById('error-password');
const bannerError = document.getElementById('banner-error-login');

function mostrarErrorCampo(input, spanError, mensaje) {
  input.classList.add('error');
  spanError.textContent = mensaje;
  spanError.classList.add('visible');
}

function limpiarErrorCampo(input, spanError) {
  input.classList.remove('error');
  spanError.textContent = '';
  spanError.classList.remove('visible');
}

function ocultarBannerError() {
  if (bannerError) {
    bannerError.classList.remove('visible');
  }
}

// Limpieza de errores en tiempo real al escribir
inputCorreo.addEventListener('input', function () {
  limpiarErrorCampo(inputCorreo, errorCorreo);
  ocultarBannerError();
});

inputPassword.addEventListener('input', function () {
  limpiarErrorCampo(inputPassword, errorPassword);
  ocultarBannerError();
});

// Validación de campos obligatorios y formato de correo
function validarFormulario() {
  let esValido = true;
  const correo = inputCorreo.value.trim();
  const password = inputPassword.value.trim();

  // Validación de correo
  if (!correo) {
    mostrarErrorCampo(inputCorreo, errorCorreo, 'Este campo es obligatorio');
    esValido = false;
  } else if (!correo.includes('@')) {
    mostrarErrorCampo(inputCorreo, errorCorreo, 'Ingresa un correo válido');
    esValido = false;
  } else {
    limpiarErrorCampo(inputCorreo, errorCorreo);
  }

  // Validación de contraseña
  if (!password) {
    mostrarErrorCampo(inputPassword, errorPassword, 'Este campo es obligatorio');
    esValido = false;
  } else {
    limpiarErrorCampo(inputPassword, errorPassword);
  }

  return esValido;
}

formLogin.addEventListener('submit', function (e) {
  e.preventDefault();
  ocultarBannerError();

  const esValido = validarFormulario();
  if (!esValido) {
    return;
  }

  // Siguiente paso: Autenticación por roles
});
