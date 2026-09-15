import { authService } from '../services/authService.js';

const selectTipoUsuario = document.getElementById('tipo-usuario');
const seccionCredenciales = document.getElementById('seccion-credenciales-psicologo');
const inputTarjetaProfesional = document.getElementById('tarjeta-profesional');
const textoNombreArchivo = document.getElementById('file-name-display');
const boxArchivo = document.querySelector('.file-upload-box');
const errorTarjeta = document.getElementById('error-tarjeta');
const bannerError = document.getElementById('banner-error-registro');
const formularioRegistro = document.querySelector('.form-registro');
const btnCancelar = document.querySelector('.btn-cancel');

function actualizarNombreArchivo() {
  if (inputTarjetaProfesional.files && inputTarjetaProfesional.files.length > 0) {
    const archivo = inputTarjetaProfesional.files[0];
    const tamanoMaximo = 5 * 1024 * 1024;

    if (archivo.type !== 'application/pdf' && !archivo.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se permiten archivos en formato PDF.');
      inputTarjetaProfesional.value = '';
      textoNombreArchivo.textContent = 'Ningún archivo seleccionado';
      textoNombreArchivo.classList.remove('archivo-cargado');
      return;
    }

    if (archivo.size > tamanoMaximo) {
      alert('El archivo supera el tamaño máximo permitido de 5MB.');
      inputTarjetaProfesional.value = '';
      textoNombreArchivo.textContent = 'Ningún archivo seleccionado';
      textoNombreArchivo.classList.remove('archivo-cargado');
      return;
    }

    textoNombreArchivo.textContent = archivo.name;
    textoNombreArchivo.classList.add('archivo-cargado');
    if (errorTarjeta) errorTarjeta.style.display = 'none';
    if (boxArchivo) boxArchivo.classList.remove('error');
  } else {
    textoNombreArchivo.textContent = 'Ningún archivo seleccionado';
    textoNombreArchivo.classList.remove('archivo-cargado');
  }
}

function actualizarVisibilidadCredenciales() {
  const esPsicologo = selectTipoUsuario.value === 'Psicologo';

  if (esPsicologo) {
    seccionCredenciales.style.display = 'flex';
  } else {
    seccionCredenciales.style.display = 'none';
    inputTarjetaProfesional.value = '';
    actualizarNombreArchivo();
    if (errorTarjeta) errorTarjeta.style.display = 'none';
    if (boxArchivo) boxArchivo.classList.remove('error');
  }
}

function mostrarBannerError(mensaje) {
  if (bannerError) {
    bannerError.textContent = mensaje;
    bannerError.style.display = 'block';
  }
}

function ocultarBannerError() {
  if (bannerError) {
    bannerError.style.display = 'none';
  }
}

formularioRegistro.addEventListener('submit', async function (e) {
  e.preventDefault();
  ocultarBannerError();

  if (selectTipoUsuario.value === 'psicologo' && (!inputTarjetaProfesional.files || !inputTarjetaProfesional.files.length)) {
    if (errorTarjeta) errorTarjeta.style.display = 'block';
    if (boxArchivo) {
      boxArchivo.classList.add('error');
      boxArchivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    mostrarBannerError('Debes adjuntar tu tarjeta profesional en formato PDF.');
    return;
  }

  const formData = new FormData();
  formData.append('TipoUsuario', selectTipoUsuario.value);
  formData.append('Nombre', document.getElementById('nombres').value.trim());
  formData.append('Apellido', document.getElementById('apellidos').value.trim());
  formData.append('Edad', document.getElementById('edad').value);
  formData.append('IdGenero', document.getElementById('genero').value);
  formData.append('Correo', document.getElementById('correo').value.trim());
  formData.append('Password', document.getElementById('contrasena').value);

  if (selectTipoUsuario.value === 'Psicologo' && inputTarjetaProfesional.files.length > 0) {
    formData.append('TarjetaProfesional', inputTarjetaProfesional.files[0]);
  }

  const btnSubmit = formularioRegistro.querySelector('.btn-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Registrando...';

  try {
    const resultado = await authService.register(formData);

    if (resultado.exito) {
      sessionStorage.setItem('correoVerificacion', document.getElementById('correo').value.trim());
      window.location.href = 'verificacion.html';
    } else {
      mostrarBannerError(resultado.mensaje);
    }
  } catch (error) {
    console.error('[registro] Error:', error);
    mostrarBannerError('Error de conexión con el servidor');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = 'Continuar &rarr;';
  }
});

const modalCancelar = document.getElementById('modal-cancelar');
const btnNoCancelar = document.getElementById('btn-no-cancelar');
const btnSiCancelar = document.getElementById('btn-si-cancelar');

btnCancelar.addEventListener('click', function () {
  modalCancelar.classList.add('activo');
});

btnNoCancelar.addEventListener('click', function () {
  modalCancelar.classList.remove('activo');
});

btnSiCancelar.addEventListener('click', function () {
  modalCancelar.classList.remove('activo');
  formularioRegistro.reset();
  actualizarVisibilidadCredenciales();
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'login.html';
  }
});

modalCancelar.addEventListener('click', function (e) {
  if (e.target === modalCancelar) {
    modalCancelar.classList.remove('activo');
  }
});

inputTarjetaProfesional.addEventListener('change', actualizarNombreArchivo);
selectTipoUsuario.addEventListener('change', actualizarVisibilidadCredenciales);
document.addEventListener('DOMContentLoaded', actualizarVisibilidadCredenciales);
