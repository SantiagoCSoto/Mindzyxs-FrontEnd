/**
 * Controlador para Nueva Contraseña
 * Maneja la lógica de validación y envío del formulario de nueva contraseña
 */

const formNuevaContrasena = document.getElementById('form-nueva-contrasena');
const inputContrasena = document.getElementById('contrasena');
const inputConfirmar = document.getElementById('confirmar-contrasena');
const errorContrasena = document.getElementById('error-contrasena');
const errorConfirmar = document.getElementById('error-confirmar');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnGuardar = document.getElementById('btn-guardar');
const toggleButtons = document.querySelectorAll('.btn-toggle-password');

// Funciones de validación
function validarContrasena(contrasena) {
  if (!contrasena || contrasena.trim() === '') {
    return { valido: false, mensaje: 'La contraseña es obligatoria' };
  }
  if (contrasena.length < 6) {
    return { valido: false, mensaje: 'La contraseña debe tener mínimo 6 caracteres' };
  }
  return { valido: true };
}

function validarConfirmacion(contrasena, confirmar) {
  if (!confirmar || confirmar.trim() === '') {
    return { valido: false, mensaje: 'Debes confirmar tu contraseña' };
  }
  if (contrasena !== confirmar) {
    return { valido: false, mensaje: 'Las contraseñas no coinciden' };
  }
  return { valido: true };
}

function mostrarErrorCampo(input, spanError, mensaje) {
  input.classList.add('error');
  spanError.textContent = mensaje;
  spanError.classList.add('visible');
  spanError.style.display = 'block';
}

function limpiarErrorCampo(input, spanError) {
  input.classList.remove('error');
  spanError.textContent = '';
  spanError.classList.remove('visible');
  spanError.style.display = 'none';
}

function ocultarBanners() {
  if (bannerError) {
    bannerError.style.display = 'none';
    bannerError.textContent = '';
  }
  if (bannerExito) {
    bannerExito.style.display = 'none';
    bannerExito.textContent = '';
  }
}

// Mostrar/ocultar contraseña
toggleButtons.forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('data-target');
    const inputField = document.getElementById(targetId);

    if (inputField.type === 'password') {
      inputField.type = 'text';
      this.classList.add('visible');
    } else {
      inputField.type = 'password';
      this.classList.remove('visible');
    }
  });
});

// Limpiar errores en tiempo real
inputContrasena.addEventListener('input', function () {
  limpiarErrorCampo(inputContrasena, errorContrasena);
  ocultarBanners();
});

inputConfirmar.addEventListener('input', function () {
  limpiarErrorCampo(inputConfirmar, errorConfirmar);
  ocultarBanners();
});

// Validar coincidencia en tiempo real
inputConfirmar.addEventListener('blur', function () {
  if (inputContrasena.value && inputConfirmar.value) {
    const validacion = validarConfirmacion(inputContrasena.value, inputConfirmar.value);
    if (!validacion.valido) {
      mostrarErrorCampo(inputConfirmar, errorConfirmar, validacion.mensaje);
    }
  }
});

// Envío del formulario
formNuevaContrasena.addEventListener('submit', async function (e) {
  e.preventDefault();
  ocultarBanners();

  const contrasena = inputContrasena.value;
  const confirmar = inputConfirmar.value;

  // Validar contraseña
  const validContra = validarContrasena(contrasena);
  if (!validContra.valido) {
    mostrarErrorCampo(inputContrasena, errorContrasena, validContra.mensaje);
    return;
  } else {
    limpiarErrorCampo(inputContrasena, errorContrasena);
  }

  // Validar confirmación
  const validConfirm = validarConfirmacion(contrasena, confirmar);
  if (!validConfirm.valido) {
    mostrarErrorCampo(inputConfirmar, errorConfirmar, validConfirm.mensaje);
    return;
  } else {
    limpiarErrorCampo(inputConfirmar, errorConfirmar);
  }

  // Desactivar botón durante el envío
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';

  try {
    // Simular llamada a API
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simular respuesta exitosa
    mostrarModalExito();
    formNuevaContrasena.reset();
  } catch (error) {
    bannerError.textContent = 'Ocurrió un error al guardar la contraseña. Intenta de nuevo.';
    bannerError.style.display = 'block';
    console.error('Error:', error);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar contraseña';
  }
});

function mostrarModalExito() {
  if (modalExito) {
    modalExito.classList.add('activo');
    modalExito.style.display = 'flex';
  } else {
    bannerExito.textContent = 'Contraseña actualizada correctamente. Redirigiendo...';
    bannerExito.style.display = 'block';
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }
}