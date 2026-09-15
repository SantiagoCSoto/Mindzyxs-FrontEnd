/**
 * Controlador para views/registro.html
 * Gestiona la selección de roles, subida de tarjeta profesional y registro.
 */

import { authService } from '../services/authService.js';
import { abrirModal, cerrarModal } from '../utils/alerts.js';

const selectTipoUsuario = document.getElementById('tipo-usuario');
const seccionCredenciales = document.getElementById('seccion-credenciales-psicologo');
const inputTarjetaProfesional = document.getElementById('tarjeta-profesional');
const textoNombreArchivo = document.getElementById('file-name-display');
const boxArchivo = document.querySelector('.file-upload-box');
const errorTarjeta = document.getElementById('error-tarjeta');
const formularioRegistro = document.querySelector('.form-registro');
const btnCancelar = document.querySelector('.btn-cancel');
const modalCancelar = document.getElementById('modal-cancelar');
const btnNoCancelar = document.getElementById('btn-no-cancelar');
const btnSiCancelar = document.getElementById('btn-si-cancelar');

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

// Envío del formulario de registro
if (formularioRegistro) {
  formularioRegistro.addEventListener('submit', async (e) => {
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
    const datos = {
      tipoUsuario: selectTipoUsuario.value,
      nombres,
      apellidos: document.getElementById('apellidos').value,
      correo: document.getElementById('correo').value
    };

    await authService.register(datos);

    alert(`¡Registro exitoso! Bienvenido a Mindzyxs, ${nombres}.`);
    formularioRegistro.reset();
    actualizarVisibilidadCredenciales();
  });
}

// Eventos de cancelación con modal
if (btnCancelar) {
  btnCancelar.addEventListener('click', () => {
    abrirModal(modalCancelar);
  });
}

if (btnNoCancelar) {
  btnNoCancelar.addEventListener('click', () => {
    cerrarModal(modalCancelar);
  });
}

if (btnSiCancelar) {
  btnSiCancelar.addEventListener('click', () => {
    cerrarModal(modalCancelar);
    formularioRegistro.reset();
    actualizarVisibilidadCredenciales();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'login.html';
    }
  });
}

if (modalCancelar) {
  modalCancelar.addEventListener('click', (e) => {
    if (e.target === modalCancelar) {
      cerrarModal(modalCancelar);
    }
  });
}

if (inputTarjetaProfesional) {
  inputTarjetaProfesional.addEventListener('change', actualizarNombreArchivo);
}

if (selectTipoUsuario) {
  selectTipoUsuario.addEventListener('change', actualizarVisibilidadCredenciales);
}

actualizarVisibilidadCredenciales();
