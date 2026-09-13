const selectTipoUsuario = document.getElementById('tipo-usuario');
const seccionCredenciales = document.getElementById('seccion-credenciales-psicologo');
const inputTarjetaProfesional = document.getElementById('tarjeta-profesional');

function actualizarVisibilidadCredenciales() {
  const esPsicologo = selectTipoUsuario.value === 'psicologo';

  if (esPsicologo) {
    seccionCredenciales.style.display = 'flex';
    inputTarjetaProfesional.required = true;
  } else {
    seccionCredenciales.style.display = 'none';
    inputTarjetaProfesional.required = false;
    inputTarjetaProfesional.value = '';
  }
}

selectTipoUsuario.addEventListener('change', actualizarVisibilidadCredenciales);

document.addEventListener('DOMContentLoaded', actualizarVisibilidadCredenciales);
