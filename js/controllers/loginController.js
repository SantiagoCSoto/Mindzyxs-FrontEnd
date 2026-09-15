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

const modalRol = document.getElementById('modal-rol');
const modalTitulo = document.getElementById('modal-titulo');
const modalSubtitulo = document.getElementById('modal-subtitulo');
const btnModalContinuar = document.getElementById('btn-modal-continuar');

// Usuarios y credenciales de prueba
const usuariosPrueba = {
  'paciente@test.com': {
    password: '123456a',
    rol: 'Paciente',
    destino: 'Panel del paciente'
  },
  'psicologo@test.com': {
    password: '123456a',
    rol: 'Psicólogo',
    destino: 'Panel del psicólogo'
  },
  'admin@test.com': {
    password: '123456a',
    rol: 'Administrador',
    destino: 'Consola de administración'
  }
};

formLogin.addEventListener('submit', function (e) {
  e.preventDefault();
  ocultarBannerError();

  const esValido = validarFormulario();
  if (!esValido) {
    return;
  }

  const correo = inputCorreo.value.trim().toLowerCase();
  const password = inputPassword.value.trim();
  const usuario = usuariosPrueba[correo];

  if (usuario && usuario.password === password) {
    ocultarBannerError();
    
    // Guardar datos del usuario en sessionStorage
    const datosUsuario = {
      correo: correo,
      nombre: correo.split('@')[0], // Usar la parte del email como nombre
      nombres: correo.split('@')[0],
      rol: usuario.rol,
      tipo_usuario: usuario.rol
    };
    sessionStorage.setItem('usuario', JSON.stringify(datosUsuario));
    sessionStorage.setItem('token', 'token_temporal_' + Date.now());
    
    modalTitulo.textContent = `Sesión iniciada \u2014 ${usuario.rol}`;
    modalSubtitulo.textContent = `Redirigiendo a: ${usuario.destino}`;
    modalRol.classList.add('activo');
    
    // Redirigir a inicio.html después de 1.5 segundos
    setTimeout(function () {
      window.location.href = 'inicio.html';
    }, 1500);
  } else {
    if (bannerError) {
      bannerError.textContent = 'Correo o contraseña incorrectos';
      bannerError.classList.add('visible');
    }
  }
});

// Cerrar modal al pulsar continuar o fondo exterior
if (btnModalContinuar) {
  btnModalContinuar.addEventListener('click', function () {
    modalRol.classList.remove('activo');
    // Redirigir a inicio.html
    window.location.href = 'inicio.html';
  });
}

if (modalRol) {
  modalRol.addEventListener('click', function (e) {
    if (e.target === modalRol) {
      modalRol.classList.remove('activo');
    }
  });
}

