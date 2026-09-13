const selectTipoUsuario = document.getElementById('tipo-usuario');
const seccionCredenciales = document.getElementById('seccion-credenciales-psicologo');
const inputTarjetaProfesional = document.getElementById('tarjeta-profesional');
const textoNombreArchivo = document.getElementById('file-name-display');

function actualizarNombreArchivo() {
  if (inputTarjetaProfesional.files && inputTarjetaProfesional.files.length > 0) {
    textoNombreArchivo.textContent = inputTarjetaProfesional.files[0].name;
    textoNombreArchivo.classList.add('archivo-cargado');
  } else {
    textoNombreArchivo.textContent = 'Ningún archivo seleccionado';
    textoNombreArchivo.classList.remove('archivo-cargado');
  }
}

function actualizarVisibilidadCredenciales() {
  const esPsicologo = selectTipoUsuario.value === 'psicologo';

  if (esPsicologo) {
    seccionCredenciales.style.display = 'flex';
    inputTarjetaProfesional.required = true;
  } else {
    seccionCredenciales.style.display = 'none';
    inputTarjetaProfesional.required = false;
    inputTarjetaProfesional.value = '';
    actualizarNombreArchivo();
  }
}

inputTarjetaProfesional.addEventListener('change', actualizarNombreArchivo);

selectTipoUsuario.addEventListener('change', actualizarVisibilidadCredenciales);

document.addEventListener('DOMContentLoaded', actualizarVisibilidadCredenciales);
