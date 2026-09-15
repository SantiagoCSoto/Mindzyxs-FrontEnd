const formVerificacionRecuperar = document.getElementById('form-verificacion-recuperar');
const inputCodigo = document.getElementById('codigo-verificacion');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');
const modalExito = document.getElementById('modal-exito');
const btnReenviar = document.getElementById('btn-reenviar');
const btnModalContinuar = document.getElementById('btn-modal-continuar');

let temporizadorExito = null;

const correoRecuperacion = sessionStorage.getItem('correoRecuperacion');

const spanCorreoEnviado = document.getElementById('correo-enviado');
if (spanCorreoEnviado && correoRecuperacion) {
  spanCorreoEnviado.textContent = correoRecuperacion;
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

formVerificacionRecuperar.addEventListener('submit', async function (e) {
  e.preventDefault();
  const codigo = inputCodigo.value.trim();

  if (codigo.length < 6) {
    mostrarError('Por favor, ingresa el código completo de 6 dígitos.');
    return;
  }

  if (!correoRecuperacion) {
    mostrarError('No se encontró el correo. Vuelve a intentar desde el inicio.');
    return;
  }

  try {
    const { authService } = await import('../services/authService.js');
    const resultado = await authService.forgotVerify(correoRecuperacion, codigo);

    if (resultado.exito) {
      ocultarError();
      sessionStorage.setItem('codigoRecuperacion', codigo);
      modalExito.classList.add('activo');
    } else {
      mostrarError(resultado.mensaje);
    }
  } catch (error) {
    console.error('[verificacion-recuperar] Error:', error);
    mostrarError('Error de conexión con el servidor');
  }
});

modalExito.addEventListener('click', function (e) {
  if (e.target === modalExito) {
    modalExito.classList.remove('activo');
  }
});

if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', function () {
    modalExito.classList.remove('activo');
    window.location.href = 'nueva_contrasena.html';
  });
}

if (btnReenviar) {
  btnReenviar.addEventListener('click', async function () {
    if (!correoRecuperacion) {
      mostrarError('No se encontró el correo.');
      return;
    }

    ocultarError();
    inputCodigo.value = '';

    try {
      const { authService } = await import('../services/authService.js');
      const resultado = await authService.forgotResend(correoRecuperacion);

      if (bannerExito) {
        bannerExito.textContent = resultado.mensaje || 'Se ha reenviado un nuevo código a tu correo.';
        bannerExito.style.display = 'block';
        clearTimeout(temporizadorExito);
        temporizadorExito = setTimeout(() => {
          bannerExito.style.display = 'none';
        }, 4000);
      }
    } catch (error) {
      console.error('[verificacion-recuperar] Error al reenviar:', error);
      mostrarError('Error al reenviar el código');
    }

    inputCodigo.focus();
  });
}
