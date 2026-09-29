/**
 * Controlador de la Vista de Perfil de Paciente (views/perfil.html)
 * Historia de Usuario: HU1-PB10 (Editar perfil de paciente)
 * Gestiona:
 *  - Carga y visualización de datos personales desde GET /api/account/perfil (modo vista, solo lectura)
 *  - Cambio de correo con código de 6 dígitos (solicitud y confirmación)
 *  - Modal aclaratorio (PB-04) y cierre de sesión
 */

import { authService } from '../services/authService.js';
import { perfilService } from '../services/perfilService.js';
import { avisoService } from '../services/avisoService.js';

// Elementos de pantalla
const viewScreen = document.getElementById('viewScreen');
const editScreen = document.getElementById('editScreen');

// Elementos del modo vista
const avatarIni = document.getElementById('avatarIni');
const vNombre = document.getElementById('vNombre');
const vCorreoSub = document.getElementById('vCorreoSub');
const vNombres = document.getElementById('vNombres');
const vApellidos = document.getElementById('vApellidos');
const vFechaNacimiento = document.getElementById('vFechaNacimiento');
const vGenero = document.getElementById('vGenero');
const vCorreo = document.getElementById('vCorreo');
const btnEditar = document.getElementById('btnEditar');

// Elementos del formulario de cambio de correo
const formPerfil = document.getElementById('formPerfil');
const inCorreo = document.getElementById('inCorreo');

const eCorreo = document.getElementById('eCorreo');

const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');

// Modal de verificación de correo
const codeModal = document.getElementById('codeModal');
const codeEmail = document.getElementById('codeEmail');
const codeInput = document.getElementById('codeInput');
const eCode = document.getElementById('eCode');
const btnCodeCancel = document.getElementById('btnCodeCancel');
const btnVerify = document.getElementById('btnVerify');
const btnResend = document.getElementById('btnResend');

// Header, aviso modal (PB-04) y toast
const btnLogout = document.getElementById('btn-logout');
const toast = document.getElementById('toast');
const avisoModal = document.getElementById('avisoModal');
const footerAviso = document.getElementById('footerAviso');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');

// Estado local del controlador
let perfilActual = null;
let generosDisponibles = [];
let datosPendientes = null;

/**
 * Muestra una notificación flotante (toast)
 * @param {string} mensaje 
 */
function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/**
 * Alterna entre el modo vista ('view') y el modo edición ('edit')
 * @param {'view'|'edit'} modo 
 */
function cambiarModo(modo) {
  if (modo === 'edit') {
    viewScreen.classList.remove('active');
    editScreen.classList.add('active');
  } else {
    editScreen.classList.remove('active');
    viewScreen.classList.add('active');
  }
}

/**
 * Muestra u oculta el estado de error en un campo
 */
function setFieldError(input, errorElement, visible, message = '') {
  if (input) input.classList.toggle('invalid', visible);
  if (errorElement) {
    errorElement.classList.toggle('show', visible);
    if (message) errorElement.textContent = message;
  }
}

/**
 * Limpia todos los mensajes de error del formulario
 */
function limpiarErrores() {
  setFieldError(inCorreo, eCorreo, false);
  if (eCode) eCode.classList.remove('show');
  if (codeInput) codeInput.classList.remove('invalid');
}

/**
 * Carga el catálogo de géneros desde el backend o usa opciones estándar
 */
async function cargarCatalogos() {
  const generosDefault = [
    { id: 1, nombre: 'Masculino' },
    { id: 2, nombre: 'Femenino' },
    { id: 3, nombre: 'No binario' },
    { id: 4, nombre: 'Prefiero no decirlo' }
  ];

  try {
    const catalogo = await authService.getCatalogos();
    if (catalogo && Array.isArray(catalogo.generos) && catalogo.generos.length > 0) {
      generosDisponibles = catalogo.generos.map(g => ({
        id: Number(g.id ?? g.idGenero),
        nombre: g.nombre || g.codigo
      }));
    } else {
      generosDisponibles = generosDefault;
    }
  } catch (error) {
    generosDisponibles = generosDefault;
  }
}

/**
 * Renderiza los datos en la pantalla de vista
 */
function renderizarVista() {
  if (!perfilActual) return;

  const iniciales = (
    (perfilActual.nombres ? perfilActual.nombres.trim()[0] : 'U') +
    (perfilActual.apellidos ? perfilActual.apellidos.trim()[0] : '')
  ).toUpperCase();

  if (avatarIni) avatarIni.textContent = iniciales || 'U';
  const nombreCompleto = `${perfilActual.nombres || ''} ${perfilActual.apellidos || ''}`.trim();
  if (vNombre) vNombre.textContent = nombreCompleto || 'Usuario';
  if (vCorreoSub) vCorreoSub.textContent = perfilActual.correo || '';

  if (vNombres) vNombres.textContent = perfilActual.nombres || '-';
  if (vApellidos) vApellidos.textContent = perfilActual.apellidos || '-';

  const edad = perfilService.calcularEdad(perfilActual.fechaNacimiento);
  const fechaFmt = perfilService.formatearFecha(perfilActual.fechaNacimiento);
  if (vFechaNacimiento) {
    vFechaNacimiento.textContent = edad !== null ? `${fechaFmt} (${edad} años)` : fechaFmt;
  }

  // Buscar nombre de género
  let nombreGenero = perfilActual.genero;
  if (!nombreGenero && perfilActual.idGenero) {
    const encontrado = generosDisponibles.find(g => g.id === Number(perfilActual.idGenero));
    if (encontrado) nombreGenero = encontrado.nombre;
  }
  if (vGenero) vGenero.textContent = nombreGenero || '-';
  if (vCorreo) vCorreo.textContent = perfilActual.correo || '-';
}

/**
 * Llena el formulario de cambio de correo con el valor actual
 */
function llenarFormulario() {
  if (!perfilActual) return;

  if (inCorreo) inCorreo.value = perfilActual.correo || '';

  limpiarErrores();
}

/**
 * Valida el campo de correo electrónico
 * @returns {boolean}
 */
function validarFormulario() {
  let esValido = true;

  const vCor = inCorreo.value.trim();

  // Validación Correo Electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!vCor) {
    setFieldError(inCorreo, eCorreo, true, 'El correo electrónico es obligatorio.');
    esValido = false;
  } else if (!emailRegex.test(vCor)) {
    setFieldError(inCorreo, eCorreo, true, 'Ingresa un correo electrónico válido.');
    esValido = false;
  } else {
    setFieldError(inCorreo, eCorreo, false);
  }

  return esValido;
}

/**
 * Maneja el envío del formulario de cambio de correo
 */
async function manejarGuardar(e) {
  e.preventDefault();

  if (!validarFormulario()) {
    perfilService.logAuditoria('VALIDACIÓN fallida al intentar cambiar el correo');
    return;
  }

  const vCor = inCorreo.value.trim().toLowerCase();
  const correoActual = (perfilActual.correo || '').trim().toLowerCase();

  if (vCor === correoActual) {
    setFieldError(inCorreo, eCorreo, true, 'Ingresa un correo diferente al actual.');
    showToast('El correo es el mismo, no hay cambios');
    return;
  }

  datosPendientes = { correo: vCor };

  btnGuardar.disabled = true;

  try {
    const resSolicitud = await perfilService.solicitarCambioCorreo(vCor);

    if (resSolicitud.exito) {
      if (codeEmail) codeEmail.textContent = vCor;
      if (codeInput) codeInput.value = '';
      if (eCode) eCode.classList.remove('show');
      if (codeModal) {
        codeModal.classList.add('open');
        codeModal.setAttribute('aria-hidden', 'false');
      }
      showToast('Código de verificación enviado');
      if (codeInput) codeInput.focus();
    } else if (resSolicitud.esDuplicado) {
      setFieldError(inCorreo, eCorreo, true, 'El correo ya se encuentra registrado');
      showToast('El correo ya se encuentra registrado');
    } else {
      setFieldError(inCorreo, eCorreo, true, resSolicitud.mensaje);
      showToast(resSolicitud.mensaje);
    }
  } catch (error) {
    showToast('Ocurrió un error inesperado al solicitar el cambio.');
  } finally {
    btnGuardar.disabled = false;
  }
}

/**
 * Maneja la verificación del código de 6 dígitos para el nuevo correo
 */
async function manejarVerificarCodigo() {
  if (!datosPendientes) return;

  const codigo = (codeInput.value || '').trim();

  if (!codigo || codigo.length < 6) {
    if (eCode) {
      eCode.textContent = 'Ingresa el código completo de 6 dígitos.';
      eCode.classList.add('show');
    }
    if (codeInput) codeInput.classList.add('invalid');
    return;
  }

  btnVerify.disabled = true;

  try {
    const resConfirmar = await perfilService.confirmarCambioCorreo(datosPendientes.correo, codigo);

    if (resConfirmar.exito) {
      perfilActual = perfilService.guardarPerfilEnSesion({ correo: datosPendientes.correo });
      renderizarVista();

      if (codeModal) {
        codeModal.classList.remove('open');
        codeModal.setAttribute('aria-hidden', 'true');
      }

      datosPendientes = null;
      cambiarModo('view');
      showToast('Correo actualizado correctamente');
    } else {
      if (eCode) {
        eCode.textContent = resConfirmar.mensaje || 'Código incorrecto. Verifica e intenta nuevamente';
        eCode.classList.add('show');
      }
      if (codeInput) codeInput.classList.add('invalid');
    }
  } catch (err) {
    if (eCode) {
      eCode.textContent = 'Error al verificar el código.';
      eCode.classList.add('show');
    }
  } finally {
    btnVerify.disabled = false;
  }
}

/**
 * Reenvía el código de verificación al nuevo correo
 */
async function manejarReenviarCodigo() {
  if (!datosPendientes || !datosPendientes.correo) return;

  btnResend.disabled = true;
  try {
    const res = await perfilService.solicitarCambioCorreo(datosPendientes.correo);
    if (res.exito) {
      showToast('Código reenviado');
      if (eCode) eCode.classList.remove('show');
      if (codeInput) {
        codeInput.value = '';
        codeInput.classList.remove('invalid');
        codeInput.focus();
      }
    } else {
      showToast(res.mensaje || 'No se pudo reenviar el código.');
    }
  } finally {
    setTimeout(() => {
      btnResend.disabled = false;
    }, 2000);
  }
}

/**
 * Cancela la edición y restaura la vista
 */
function manejarCancelarEdicion() {
  llenarFormulario();
  cambiarModo('view');
  datosPendientes = null;
  perfilService.logAuditoria('CANCELAR - cambios descartados, vuelve a vista');
  showToast('Cambios descartados');
}

/**
 * Limpia errores en tiempo real mientras el usuario corrige los inputs
 */
function registrarEventosLimpiezaErrores() {
  [inCorreo].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      const errSpan = document.getElementById(input.id.replace('in', 'e'));
      if (errSpan) errSpan.classList.remove('show');
    });
  });

  if (codeInput) {
    codeInput.addEventListener('input', (e) => {
      // Filtrar solo dígitos numéricos
      codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
      codeInput.classList.remove('invalid');
      if (eCode) eCode.classList.remove('show');
    });

    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        manejarVerificarCodigo();
      }
    });
  }
}

/**
 * Inicialización de todos los listeners de la vista
 */
function registrarEventos() {
  if (btnEditar) {
    btnEditar.addEventListener('click', () => {
      llenarFormulario();
      cambiarModo('edit');
      perfilService.logAuditoria('EDITAR iniciado - modo edición activado');
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', manejarCancelarEdicion);
  }

  if (formPerfil) {
    formPerfil.addEventListener('submit', manejarGuardar);
  }

  if (btnVerify) {
    btnVerify.addEventListener('click', manejarVerificarCodigo);
  }

  if (btnResend) {
    btnResend.addEventListener('click', manejarReenviarCodigo);
  }

  if (btnCodeCancel) {
    btnCodeCancel.addEventListener('click', () => {
      if (codeModal) {
        codeModal.classList.remove('open');
        codeModal.setAttribute('aria-hidden', 'true');
      }
      perfilService.logAuditoria('VERIFICACIÓN cancelada por el usuario');
    });
  }

  // Cerrar modal al hacer clic en el backdrop
  if (codeModal) {
    codeModal.addEventListener('click', (e) => {
      if (e.target === codeModal) {
        codeModal.classList.remove('open');
        codeModal.setAttribute('aria-hidden', 'true');
        perfilService.logAuditoria('VERIFICACIÓN cerrada por backdrop');
      }
    });
  }

  // Cierre de sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
      authService.logout();
      window.location.href = 'inicio.html';
    });
  }

  // Modal Aviso: no diagnóstico (PB-04)
  if (footerAviso) {
    footerAviso.addEventListener('click', async (e) => {
      e.preventDefault();
      if (avisoModal) {
        avisoModal.classList.add('open');
        avisoModal.setAttribute('aria-hidden', 'false');
      }
      await avisoService.registrarVisualizacion('enlace', 'ok');
    });
  }

  if (btnEntendido) {
    btnEntendido.addEventListener('click', () => {
      if (avisoModal) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
      avisoService.marcarAvisoAceptado();
    });
  }

  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      if (avisoModal) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Cerrar avisoModal al dar click en backdrop
  if (avisoModal) {
    avisoModal.addEventListener('click', (e) => {
      if (e.target === avisoModal) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  registrarEventosLimpiezaErrores();
}

/**
 * Arranque de la vista
 */
async function inicializar() {
  await cargarCatalogos();

  // Perfil real desde el backend; respaldo: datos de la sesión local.
  perfilActual = await perfilService.obtenerPerfil();
  if (!perfilActual) perfilActual = perfilService.obtenerPerfilActual();
  renderizarVista();
  registrarEventos();

  perfilService.logAuditoria('Sistema listo - Perfil de paciente cargado correctamente');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
