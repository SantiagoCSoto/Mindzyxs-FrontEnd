/**
 * Controlador para la gestión de usuarios del sistema (PB-25 HU1-PB25).
 * Conecta views/gestion_usuarios.html con gestionUsuariosService.js:
 * - Consulta con filtros (rol, estado, texto)
 * - Edición de datos personales y estado de cuenta
 * - Restablecimiento forzado de contraseña
 * Requiere rol Administrador.
 */

import { authService } from '../services/authService.js';
import {
  listarUsuarios,
  obtenerDetalleUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  forzarRestablecimientoPassword
} from '../services/gestionUsuariosService.js';

const $ = (id) => document.getElementById(id);

// 1. Guard de sesión y rol (Solo Administrador)
const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
  throw new Error('Sesión requerida');
}

const rolActual = String(
  sesion.rol || sesion.tipo_usuario || sessionStorage.getItem('rol') || ''
).toLowerCase();

if (!rolActual.includes('admin')) {
  window.location.href = rolActual.includes('psicologo')
    ? 'panel_psicologo.html'
    : rolActual.includes('paciente')
    ? 'panel_paciente.html'
    : 'inicio.html';
  throw new Error('Acceso restringido a administradores');
}

// 2. Elementos del DOM
const screenLista = $('screenLista');
const screenEditar = $('screenEditar');
const listaUsuarios = $('listaUsuarios');
const vacio = $('vacio');
const errLista = $('errLista');
const errEditar = $('errEditar');

const fRol = $('fRol');
const fEstado = $('fEstado');
const fQ = $('fQ');
const btnFiltrar = $('btnFiltrar');
const btnLimpiar = $('btnLimpiar');

const editSub = $('editSub');
const eNombres = $('eNombres');
const eApellidos = $('eApellidos');
const eCorreo = $('eCorreo');
const eGenero = $('eGenero');
const eFecha = $('eFecha');
const eEstado = $('eEstado');
const btnResetPassword = $('btnResetPassword');
const btnCancelar = $('btnCancelar');
const btnGuardar = $('btnGuardar');

const confirmModal = $('confirmModal');
const confirmTitle = $('confirmTitle');
const confirmText = $('confirmText');
const btnSi = $('btnSi');
const btnNo = $('btnNo');
const toast = $('toast');

// 3. Estado local
let usuariosCargados = [];
let usuarioActual = null;
let accionModal = null; // 'guardar' | 'reset-password'

// 4. Funciones utilitarias
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapar(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function obtenerIniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'U';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return '';
  try {
    const f = new Date(fechaStr);
    if (isNaN(f.getTime())) return String(fechaStr).split('T')[0];
    return f.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return String(fechaStr).split('T')[0];
  }
}

function etiquetaEstado(estado) {
  const est = String(estado || '').trim();
  if (est === 'Activa') return '<span class="est est-ok">Activa</span>';
  if (est === 'Suspendida') return '<span class="est est-danger">Suspendida</span>';
  if (est === 'Inactiva') return '<span class="est est-no">Inactiva</span>';
  if (est === 'PendienteVerificacion') return '<span class="est est-warn">Verificación pendiente</span>';
  if (est === 'PendienteAprobacion') return '<span class="est est-warn">Aprobación pendiente</span>';
  return `<span class="est est-no">${escapar(est || 'Desconocido')}</span>`;
}

function mapGeneroAId(genero) {
  if (!genero) return null;
  const g = String(genero).toLowerCase();
  if (g.includes('masc') || g === '1') return 1;
  if (g.includes('fem') || g === '2') return 2;
  if (g.includes('otr') || g === '3') return 3;
  return Number(genero) || null;
}

// 5. Modal de confirmación
function abrirModal(titulo, texto, accion, textoBotonSi = 'Sí, continuar') {
  accionModal = accion;
  if (confirmTitle) confirmTitle.textContent = titulo;
  if (confirmText) confirmText.textContent = texto;
  if (btnSi) btnSi.textContent = textoBotonSi;
  if (confirmModal) {
    confirmModal.classList.add('open');
    confirmModal.setAttribute('aria-hidden', 'false');
  }
}

function cerrarModal() {
  accionModal = null;
  if (confirmModal) {
    confirmModal.classList.remove('open');
    confirmModal.setAttribute('aria-hidden', 'true');
  }
}

if (btnNo) btnNo.addEventListener('click', cerrarModal);

if (confirmModal) {
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) cerrarModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && confirmModal?.classList.contains('open')) {
    cerrarModal();
  }
});

// 6. Skeletons y renderizado de lista
function pintarSkeleton() {
  if (!listaUsuarios) return;
  listaUsuarios.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const card = document.createElement('div');
    card.className = 'sk-card fila-sk';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `
      <div class="sk sk-avatar"></div>
      <div style="flex:1;">
        <div class="sk sk-line" style="width:40%;height:14px;margin-bottom:6px;"></div>
        <div class="sk sk-line" style="width:60%;height:12px;"></div>
      </div>
      <div class="sk" style="width:74px;height:32px;border-radius:16px;"></div>
    `;
    listaUsuarios.appendChild(card);
  }
}

function renderLista(usuarios) {
  if (errLista) {
    errLista.textContent = '';
    errLista.classList.remove('show');
  }
  if (!listaUsuarios) return;
  listaUsuarios.innerHTML = '';

  if (!usuarios.length) {
    if (vacio) vacio.style.display = 'block';
    return;
  }
  if (vacio) vacio.style.display = 'none';

  usuarios.forEach((u) => {
    const fila = document.createElement('div');
    fila.className = 'fila';

    const fechaFmt = formatearFechaCorta(u.fechaRegistro);
    const subDetalle = `${escapar(u.correo)} · ${escapar(u.rol)}${
      u.aprobacion ? ` · Aprobación: ${escapar(u.aprobacion)}` : ''
    }${fechaFmt ? ` · Reg: ${fechaFmt}` : ''}`;

    fila.innerHTML = `
      <div class="avatar" aria-hidden="true">${obtenerIniciales(u.nombre)}</div>
      <div class="info">
        <b>${escapar(u.nombre || 'Sin nombre')}</b>
        <small>${subDetalle}</small>
      </div>
      ${etiquetaEstado(u.estado)}
    `;

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn btn-sec btn-sm';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => abrirEdicion(u.id));

    fila.appendChild(btnEditar);
    listaUsuarios.appendChild(fila);
  });
}

async function cargarLista() {
  pintarSkeleton();
  if (vacio) vacio.style.display = 'none';

  const filtros = {
    rol: fRol?.value?.trim() || '',
    estado: fEstado?.value?.trim() || '',
    q: fQ?.value?.trim() || ''
  };

  const res = await listarUsuarios(filtros);

  if (res.ok) {
    usuariosCargados = res.data || [];
    renderLista(usuariosCargados);
  } else {
    if (listaUsuarios) listaUsuarios.innerHTML = '';
    if (errLista) {
      errLista.textContent = res.error || 'No fue posible cargar los usuarios.';
      errLista.classList.add('show');
    }
  }
}

// 7. Filtros y búsqueda interactiva
let debounceBusqueda = null;

if (fQ) {
  fQ.addEventListener('input', () => {
    clearTimeout(debounceBusqueda);
    debounceBusqueda = setTimeout(() => {
      cargarLista();
    }, 320);
  });
}

if (btnFiltrar) {
  btnFiltrar.addEventListener('click', () => {
    clearTimeout(debounceBusqueda);
    cargarLista();
  });
}

if (btnLimpiar) {
  btnLimpiar.addEventListener('click', () => {
    if (fRol) fRol.value = '';
    if (fEstado) fEstado.value = '';
    if (fQ) fQ.value = '';
    clearTimeout(debounceBusqueda);
    cargarLista();
  });
}

// 8. Pantalla de edición de usuario
async function abrirEdicion(idUsuario) {
  if (errEditar) {
    errEditar.textContent = '';
    errEditar.classList.remove('show');
  }

  // Carga detalle desde el backend
  const res = await obtenerDetalleUsuario(idUsuario);
  if (!res.ok) {
    showToast(res.error || 'No fue posible obtener el detalle del usuario');
    return;
  }

  usuarioActual = res.data;

  if (editSub) {
    editSub.textContent = `Modifica los datos del usuario: ${usuarioActual.nombre} (${usuarioActual.rol})`;
  }

  if (eNombres) eNombres.value = usuarioActual.nombres || usuarioActual.nombre || '';
  if (eApellidos) eApellidos.value = usuarioActual.apellidos || '';
  if (eCorreo) eCorreo.value = usuarioActual.correo || '';

  if (eGenero) {
    const idGen = mapGeneroAId(usuarioActual.genero);
    eGenero.value = idGen ? String(idGen) : '';
  }

  if (eFecha) {
    eFecha.value = usuarioActual.fechaNacimiento
      ? String(usuarioActual.fechaNacimiento).split('T')[0]
      : '';
  }

  if (eEstado) {
    const est = usuarioActual.estado || 'Activa';
    // Si el estado es uno de los administrables estándar
    if (['Activa', 'Suspendida', 'Inactiva'].includes(est)) {
      eEstado.value = est;
    } else {
      eEstado.value = 'Activa';
    }
  }

  show('screenEditar');
}

if (btnCancelar) {
  btnCancelar.addEventListener('click', () => {
    usuarioActual = null;
    show('screenLista');
  });
}

// 9. Guardar cambios
function validarFormulario() {
  const nombres = eNombres?.value?.trim() || '';
  const correo = eCorreo?.value?.trim() || '';

  if (!nombres) {
    return 'El nombre del usuario es obligatorio.';
  }
  if (!correo) {
    return 'El correo electrónico es obligatorio.';
  }
  if (!correo.includes('@') || !correo.includes('.')) {
    return 'Ingrese un correo electrónico válido.';
  }
  return '';
}

if (btnGuardar) {
  btnGuardar.addEventListener('click', () => {
    if (!usuarioActual) return;

    const error = validarFormulario();
    if (error) {
      if (errEditar) {
        errEditar.textContent = error;
        errEditar.classList.add('show');
      }
      return;
    }

    if (errEditar) {
      errEditar.textContent = '';
      errEditar.classList.remove('show');
    }

    abrirModal(
      'Guardar cambios',
      `¿Desea guardar los cambios en la cuenta de ${usuarioActual.nombre}?`,
      'guardar',
      'Sí, guardar'
    );
  });
}

// 10. Forzar restablecimiento de contraseña
if (btnResetPassword) {
  btnResetPassword.addEventListener('click', () => {
    if (!usuarioActual) return;

    abrirModal(
      'Restablecer contraseña',
      `¿Desea enviar un código de restablecimiento de contraseña al correo ${usuarioActual.correo}?`,
      'reset-password',
      'Sí, enviar código'
    );
  });
}

// 11. Confirmación de acciones (btnSi)
if (btnSi) {
  btnSi.addEventListener('click', async () => {
    const accion = accionModal;
    cerrarModal();

    if (!usuarioActual) return;

    try {
      if (accion === 'guardar') {
        const idUsuario = usuarioActual.id;
        const payloadDatos = {
          nombres: eNombres.value.trim(),
          apellidos: eApellidos?.value?.trim() || null,
          correo: eCorreo.value.trim(),
          fechaNacimiento: eFecha?.value || null,
          idGenero: eGenero?.value ? Number(eGenero.value) : null
        };

        // 1) Actualizar datos personales
        const resDatos = await actualizarUsuario(idUsuario, payloadDatos);
        if (!resDatos.ok) {
          throw new Error(resDatos.error || 'No fue posible guardar los datos del usuario');
        }

        // 2) Actualizar estado de cuenta si cambió
        const nuevoEstado = eEstado?.value;
        if (nuevoEstado && nuevoEstado !== usuarioActual.estado) {
          const resEstado = await cambiarEstadoUsuario(idUsuario, nuevoEstado);
          if (!resEstado.ok) {
            throw new Error(resEstado.error || 'Datos guardados, pero no fue posible cambiar el estado');
          }
        }

        showToast('Cambios guardados correctamente.');
        usuarioActual = null;
        await cargarLista();
        show('screenLista');
      } else if (accion === 'reset-password') {
        const resReset = await forzarRestablecimientoPassword(usuarioActual.id);
        if (!resReset.ok) {
          throw new Error(resReset.error || 'No fue posible enviar el código de restablecimiento');
        }

        showToast(resReset.mensaje || 'Código de restablecimiento enviado correctamente');
      }
    } catch (err) {
      if (errEditar) {
        errEditar.textContent = err.message || 'Ocurrió un error al procesar la solicitud.';
        errEditar.classList.add('show');
      }
      showToast(err.message || 'Error al procesar la acción');
    }
  });
}

// 12. Cerrar sesión unificado
const btnLogout = $('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
      authService.logout();
      window.location.href = 'login.html';
    }
  });
}

const footerAviso = $('footerAviso');
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Mindzyxs no realiza diagnósticos clínicos');
  });
}

// 13. Carga inicial
cargarLista();
