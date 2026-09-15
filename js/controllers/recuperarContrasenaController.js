const formRecuperar = document.querySelector('form');
const inputEmail = document.getElementById('email');
const bannerError = document.getElementById('banner-error');
const bannerExito = document.getElementById('banner-exito');

function mostrarError(mensaje) {
  inputEmail.classList.add('error');
  if (bannerError) {
    bannerError.textContent = mensaje;
    bannerError.style.display = 'block';
  }
  if (bannerExito) {
    bannerExito.style.display = 'none';
  }
}

function ocultarError() {
  inputEmail.classList.remove('error');
  if (bannerError) {
    bannerError.style.display = 'none';
  }
}

function mostrarExito(mensaje) {
  ocultarError();
  if (bannerExito) {
    bannerExito.textContent = mensaje || 'Se ha enviado un código a tu correo.';
    bannerExito.style.display = 'block';
    setTimeout(() => {
      bannerExito.style.display = 'none';
    }, 3000);
  }
}

if (inputEmail) {
  inputEmail.addEventListener('input', function () {
    ocultarError();
  });
}

if (formRecuperar) {
  formRecuperar.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = inputEmail.value.trim().toLowerCase();

    if (!email) {
      mostrarError('Este campo es obligatorio');
      return;
    }

    if (!email.includes('@')) {
      mostrarError('Ingresa un correo válido');
      return;
    }

    const btnSubmit = formRecuperar.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    try {
      const { authService } = await import('../services/authService.js');
      const resultado = await authService.forgot(email);

      mostrarExito(resultado.mensaje);
      sessionStorage.setItem('correoRecuperacion', email);
      inputEmail.value = '';

      setTimeout(() => {
        window.location.href = 'verificacion_recuperar.html';
      }, 2000);
    } catch (error) {
      console.error('[recuperar] Error:', error);
      mostrarError('Error de conexión con el servidor');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar código';
    }
  });
}
