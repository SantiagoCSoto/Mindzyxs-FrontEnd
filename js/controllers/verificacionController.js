import { authService } from '../services/authService.js';

const formVerificacion = document.getElementById('form-verificacion');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnReenviar = document.getElementById('btn-reenviar');

let temporizadorExito = null;

const correoVerificacion = sessionStorage.getItem('correoVerificacion');

const spanCorreoEnviado = document.getElementById('correo-enviado');
if (spanCorreoEnviado && correoVerificacion) {
  spanCorreoEnviado.textContent = correoVerificacion;
}

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

formVerificacion.addEventListener('submit', async function (e) {
  e.preventDefault();
  const codigo = inputCodigo.value.trim();

  if (codigo.length < 6) {
    mostrarError('Por favor, ingresa el código completo de 6 dígitos.');
    return;
  }

  if (!correoVerificacion) {
    mostrarError('No se encontró el correo de registro. Vuelve a registrarte.');
    return;
  }

  try {
    const resultado = await authService.verifyCode(correoVerificacion, codigo);

    if (resultado.exito) {
      ocultarError();
      const modalTitulo = modalExito.querySelector('h2');
      const modalSubtitulo = modalExito.querySelector('p');

      if (resultado.estado === 'PendienteAprobacion') {
        if (modalTitulo) modalTitulo.textContent = 'Registro exitoso';
        if (modalSubtitulo) modalSubtitulo.textContent = resultado.mensaje;
      } else {
        if (modalTitulo) modalTitulo.textContent = 'Registro exitoso. Ya puedes iniciar sesión';
        if (modalSubtitulo) modalSubtitulo.textContent = 'Tu cuenta fue activada correctamente. Ahora puedes entrar al sistema.';
      }

      modalExito.classList.add('activo');
    } else {
      mostrarError(resultado.mensaje);
    }
  } catch (error) {
    console.error('[verificacion] Error:', error);
    mostrarError('Error de conexión con el servidor');
  }
});

modalExito.addEventListener('click', function (e) {
  if (e.target === modalExito) {
    modalExito.classList.remove('activo');
  }
});

if (btnReenviar) {
  btnReenviar.addEventListener('click', async function () {
    if (!correoVerificacion) {
      mostrarError('No se encontró el correo de registro.');
      return;
    }

    ocultarError();
    inputCodigo.value = '';

    try {
      const resultado = await authService.resendCode(correoVerificacion);

      if (bannerExito) {
        bannerExito.textContent = resultado.mensaje || 'Se ha reenviado un nuevo código a tu correo.';
        bannerExito.style.display = 'block';
        clearTimeout(temporizadorExito);
        temporizadorExito = setTimeout(() => {
          bannerExito.style.display = 'none';
        }, 4000);
      }
    } catch (error) {
      console.error('[verificacion] Error al reenviar:', error);
      mostrarError('Error al reenviar el código');
    }

    inputCodigo.focus();
  });
}
