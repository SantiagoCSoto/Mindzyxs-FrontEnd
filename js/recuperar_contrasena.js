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

function mostrarExito() {
  ocultarError();
  if (bannerExito) {
    bannerExito.style.display = 'block';
    setTimeout(() => {
      bannerExito.style.display = 'none';
    }, 3000);
  }
}

// Limpieza de errores en tiempo real al escribir
if (inputEmail) {
  inputEmail.addEventListener('input', function () {
    ocultarError();
  });
}

// Usuarios de prueba que pueden recuperar contraseña
const usuariosValidos = ['paciente@test.com', 'psicologo@test.com', 'admin@test.com'];

// Validación y envío de código
if (formRecuperar) {
  formRecuperar.addEventListener('submit', function (e) {
    e.preventDefault();
    
    const email = inputEmail.value.trim().toLowerCase();

    // Validación: campo vacío
    if (!email) {
      mostrarError('Este campo es obligatorio');
      return;
    }

    // Validación: formato de correo (debe incluir @)
    if (!email.includes('@')) {
      mostrarError('Ingresa un correo válido');
      return;
    }

    // Validación: usuario existe (simula búsqueda en BD)
    if (!usuariosValidos.includes(email)) {
      mostrarError('Mensaje genérico de seguridad');
      return;
    }

    // Si todo es válido, mostrar éxito
    mostrarExito();
    inputEmail.value = '';
  });
}
