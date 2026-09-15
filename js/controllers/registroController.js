/**
 * Controlador para views/registro.html
 * Gestiona la selección de roles, subida de tarjeta profesional y registro.
 */

import { authService } from '../services/authService.js';
import { abrirModal, cerrarModal, mostrarBanner, ocultarBanner } from '../utils/alerts.js';

const selectTipoUsuario = document.getElementById('tipo-usuario');
const seccionCredenciales = document.getElementById('seccion-credenciales-psicologo');
const inputTarjetaProfesional = document.getElementById('tarjeta-profesional');
const textoNombreArchivo = document.getElementById('file-name-display');
const boxArchivo = document.querySelector('.file-upload-box');
const errorTarjeta = document.getElementById('error-tarjeta');
const formularioRegistro = document.querySelector('.form-registro');
const bannerErrorRegistro = document.getElementById('banner-error-registro');
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
    ocultarBanner(bannerErrorRegistro);
  } else {
    textoNombreArchivo.textContent = 'Ningún archivo seleccionado';
    textoNombreArchivo.classList.remove('archivo-cargado');
  }
}

function actualizarVisibilidadCredenciales() {
  const esPsicologo = selectTipoUsuario.value?.toLowerCase() === 'psicologo';

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

// Envío del formulario de registro hacia el backend
if (formularioRegistro) {
  formularioRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarBanner(bannerErrorRegistro);

    const tipoUsuario = selectTipoUsuario.value;
    const esPsicologo = tipoUsuario?.toLowerCase() === 'psicologo';

    // Validación de tarjeta para psicólogo
    if (esPsicologo && (!inputTarjetaProfesional.files || !inputTarjetaProfesional.files.length)) {
      if (errorTarjeta) errorTarjeta.style.display = 'block';
      if (boxArchivo) {
        boxArchivo.classList.add('error');
        boxArchivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      mostrarBanner(bannerErrorRegistro, 'Debes adjuntar tu tarjeta profesional en formato PDF.');
      return;
    }

    const contrasena = document.getElementById('contrasena').value;
    // Validación de contraseña según regla del backend: mínimo 6 caracteres, al menos 1 letra y 1 número
    const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passRegex.test(contrasena)) {
      mostrarBanner(bannerErrorRegistro, 'La contraseña debe tener mínimo 6 caracteres e incluir al menos una letra y un número.');
      document.getElementById('contrasena').focus();
      return;
    }

    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const edad = document.getElementById('edad').value.trim();
    const idGenero = document.getElementById('genero').value;
    const correo = document.getElementById('correo').value.trim();

    // Construcción de FormData para multipart/form-data según Dtos/AuthVm.cs:RegisterVm
    const formData = new FormData();
    formData.append('TipoUsuario', tipoUsuario);
    formData.append('Nombre', nombres);
    formData.append('Apellido', apellidos);
    formData.append('Edad', parseInt(edad, 10));
    formData.append('IdGenero', parseInt(idGenero, 10));
    formData.append('Correo', correo);
    formData.append('Password', contrasena);

    if (esPsicologo && inputTarjetaProfesional.files && inputTarjetaProfesional.files[0]) {
      formData.append('TarjetaProfesional', inputTarjetaProfesional.files[0]);
    }

    const btnSubmit = formularioRegistro.querySelector('.btn-submit');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Registrando...';
    }

    try {
      const resultado = await authService.register(formData);

      if (!resultado.exito) {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = 'Continuar &rarr;';
        }
        mostrarBanner(bannerErrorRegistro, resultado.mensaje || 'Error al completar el registro.');
        bannerErrorRegistro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Guardar correo para la pantalla de verificación
      if (correo) {
        sessionStorage.setItem('correoRegistro', correo);
      }

      window.location.href = 'verificacion.html';
    } catch (err) {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Continuar &rarr;';
      }
      mostrarBanner(bannerErrorRegistro, 'Error de conexión. Intenta de nuevo.');
      console.error(err);
    }
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
