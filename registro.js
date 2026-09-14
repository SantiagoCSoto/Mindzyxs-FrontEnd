const selectTipoUsuario = document.getElementById('tipo-usuario');
const seccionCredenciales = document.getElementById('seccion-credenciales-psicologo');
const inputTarjetaProfesional = document.getElementById('tarjeta-profesional');
const textoNombreArchivo = document.getElementById('file-name-display');
const boxArchivo = document.querySelector('.file-upload-box');
const errorTarjeta = document.getElementById('error-tarjeta');
const formularioRegistro = document.querySelector('.form-registro');
const btnCancelar = document.querySelector('.btn-cancel');

function actualizarNombreArchivo() {
  if (inputTarjetaProfesional.files && inputTarjetaProfesional.files.length > 0) {
    const archivo = inputTarjetaProfesional.files[0];
    const tamanoMaximo = 5 * 1024 * 1024; // 5MB

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
  const esPsicologo = selectTipoUsuario.value === 'psicologo';

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

formularioRegistro.addEventListener('submit', function (e) {
  e.preventDefault();

  if (selectTipoUsuario.value === 'psicologo' && (!inputTarjetaProfesional.files || !inputTarjetaProfesional.files.length)) {
    if (errorTarjeta) errorTarjeta.style.display = 'block';
    if (boxArchivo) {
      boxArchivo.classList.add('error');
      boxArchivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    alert('Debes adjuntar tu tarjeta profesional en formato PDF.');
    return;
  }

  const nombres = document.getElementById('nombres').value;
  alert(`¡Registro exitoso! Bienvenido a Mindzyx, ${nombres}.`);
  formularioRegistro.reset();
  actualizarVisibilidadCredenciales();
});

btnCancelar.addEventListener('click', function () {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    formularioRegistro.reset();
    actualizarVisibilidadCredenciales();
  }
});

inputTarjetaProfesional.addEventListener('change', actualizarNombreArchivo);

selectTipoUsuario.addEventListener('change', actualizarVisibilidadCredenciales);

document.addEventListener('DOMContentLoaded', actualizarVisibilidadCredenciales);
