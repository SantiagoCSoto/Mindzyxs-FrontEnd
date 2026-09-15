import { authService } from '../services/authService.js';
import { setToken } from '../services/apiClient.js';

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

inputCorreo.addEventListener('input', function () {
  limpiarErrorCampo(inputCorreo, errorCorreo);
  ocultarBannerError();
});

inputPassword.addEventListener('input', function () {
  limpiarErrorCampo(inputPassword, errorPassword);
  ocultarBannerError();
});

function validarFormulario() {
  let esValido = true;
  const correo = inputCorreo.value.trim();
  const password = inputPassword.value.trim();

  if (!correo) {
    mostrarErrorCampo(inputCorreo, errorCorreo, 'Este campo es obligatorio');
    esValido = false;
  } else if (!correo.includes('@')) {
    mostrarErrorCampo(inputCorreo, errorCorreo, 'Ingresa un correo válido');
    esValido = false;
  } else {
    limpiarErrorCampo(inputCorreo, errorCorreo);
  }

  if (!password) {
    mostrarErrorCampo(inputPassword, errorPassword, 'Este campo es obligatorio');
    esValido = false;
  } else {
    limpiarErrorCampo(inputPassword, errorPassword);
  }

  return esValido;
}

const modalRol = document.getElementById('modal-rol');
const modalTitulo = document.getElementById('modal-titulo');
const modalSubtitulo = document.getElementById('modal-subtitulo');
const btnModalContinuar = document.getElementById('btn-modal-continuar');

formLogin.addEventListener('submit', async function (e) {
  e.preventDefault();
  ocultarBannerError();

  const esValido = validarFormulario();
  if (!esValido) {
    return;
  }

  const correo = inputCorreo.value.trim();
  const password = inputPassword.value.trim();

  try {
    const resultado = await authService.login(correo, password);

    if (resultado.exito) {
      setToken(resultado.token);
      localStorage.setItem('usuario', JSON.stringify(resultado.usuario));

      ocultarBannerError();
      modalTitulo.textContent = `Sesión iniciada \u2014 ${resultado.usuario.rol}`;
      modalSubtitulo.textContent = `Redirigiendo a: Panel del ${resultado.usuario.panel}`;
      modalRol.classList.add('activo');

      const panelRutas = {
        Paciente: '../views/paciente.html',
        Psicologo: '../views/psicologo.html',
        Administrador: '../views/admin.html'
      };

      btnModalContinuar.onclick = function () {
        const ruta = panelRutas[resultado.usuario.panel];
        if (ruta) {
          window.location.href = ruta;
        } else {
          modalRol.classList.remove('activo');
        }
      };
    } else {
      if (bannerError) {
        bannerError.textContent = resultado.mensaje;
        bannerError.classList.add('visible');
      }
    }
  } catch (error) {
    console.error('[login] Error:', error);
    if (bannerError) {
      bannerError.textContent = 'Error de conexión con el servidor';
      bannerError.classList.add('visible');
    }
  }
});

if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', function () {
    modalRol.classList.remove('activo');
  });
}

if (modalRol) {
  modalRol.addEventListener('click', function (e) {
    if (e.target === modalRol) {
      modalRol.classList.remove('activo');
    }
  });
}
