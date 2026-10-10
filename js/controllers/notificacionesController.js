/**
 * Controlador para la gestión y configuración de notificaciones del sistema (PB-30 HU1-PB30).
 * Conecta views/notificaciones_sistema.html con notificacionesService.js:
 * - Catálogo oficial de eventos automáticos con filtrado por canal, estado y texto.
 * - Edición de canales de entrega (correo, sms, interna) y estado activo/inactivo.
 * - Editor de asunto y plantilla con inserción asistida de variables dinámicas.
 * - Simulador de previsualización interactiva con variables de prueba en tiempo real.
 * Requiere rol Administrador.
 */

import { authService } from '../services/authService.js';
import {
  listarNotificaciones,
  obtenerDetalleNotificacion,
  actualizarNotificacion,
  obtenerPreviewNotificacion
} from '../services/notificacionesService.js';

const $ = (id) => document.getElementById(id);

// 1. Guard de autenticación y rol (Solo Administrador)
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
const screenCatalogo = $('screenCatalogo');
const screenEditar = $('screenEditar');
const listaEventos = $('listaEventos');
const vacio = $('vacio');
const errCatalogo = $('errCatalogo');
const errEditar = $('errEditar');

const fBuscar = $('fBuscar');
const fCanal = $('fCanal');
const fEstado = $('fEstado');
const btnRefrescar = $('btnRefrescar');
const badgeContador = $('badgeContador');
const contadorTexto = $('contadorTexto');

const btnVolverCatalogo = $('btnVolverCatalogo');
const editTitulo = $('editTitulo');
const editSub = $('editSub');
const chkActivo = $('chkActivo');
const lblActivoTexto = $('lblActivoTexto');

const formNotificacion = $('formNotificacion');
const chkCanalCorreo = $('chkCanalCorreo');
const chkCanalSms = $('chkCanalSms');
const chkCanalInterna = $('chkCanalInterna');
const txtAsunto = $('txtAsunto');
const txtCuerpo = $('txtCuerpo');
const chipsVariables = $('chipsVariables');

const btnActualizarPreview = $('btnActualizarPreview');
const varNombre = $('varNombre');
const varCodigo = $('varCodigo');
const varFecha = $('varFecha');
const varMotivo = $('varMotivo');
const prevCanales = $('prevCanales');
const prevAsunto = $('prevAsunto');
const prevCuerpo = $('prevCuerpo');

const btnCancelarEdicion = $('btnCancelarEdicion');
const btnGuardar = $('btnGuardar');

const confirmModal = $('confirmModal');
const confirmTitle = $('confirmTitle');
const confirmText = $('confirmText');
const btnModalNo = $('btnModalNo');
const btnModalSi = $('btnModalSi');
const toast = $('toast');

// 3. Estado en memoria
let eventosCargados = [];
let eventoActual = null;

// 4. Funciones utilitarias
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2800);
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

function iconoEvento(tipo) {
  const t = String(tipo || '').toUpperCase();
  if (t.includes('CODE')) return '🔐';
  if (t.includes('PASSWORD')) return '🔑';
  if (t.includes('APPROVAL_GRANTED')) return '🩺';
  if (t.includes('APPROVAL_REJECTED')) return '⚠️';
  if (t.includes('REMINDER')) return '⏰';
  if (t.includes('RISK')) return '🚨';
  return '🔔';
}

function formatearCanales(canales) {
  if (!Array.isArray(canales) || canales.length === 0) {
    return '<span class="tag-canal">Ninguno</span>';
  }
  const iconos = {
    correo: '✉️ Correo',
    sms: '📱 SMS',
    interna: '🔔 Interna'
  };
  return canales
    .map((c) => `<span class="tag-canal">${iconos[c] || escapar(c)}</span>`)
    .join(' ');
}

function cambiarPantalla(pantalla) {
  if (pantalla === 'catalogo') {
    if (screenCatalogo) screenCatalogo.style.display = 'block';
    if (screenEditar) screenEditar.style.display = 'none';
  } else {
    if (screenCatalogo) screenCatalogo.style.display = 'none';
    if (screenEditar) screenEditar.style.display = 'block';
  }
}

function abrirModal(titulo, descripcion) {
  if (confirmTitle) confirmTitle.textContent = titulo;
  if (confirmText) confirmText.textContent = descripcion;
  if (confirmModal) {
    confirmModal.classList.add('open');
    confirmModal.setAttribute('aria-hidden', 'false');
  }
}

function cerrarModal() {
  if (confirmModal) {
    confirmModal.classList.remove('open');
    confirmModal.setAttribute('aria-hidden', 'true');
  }
}

if (btnModalNo) {
  btnModalNo.addEventListener('click', cerrarModal);
}

if (confirmModal) {
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) cerrarModal();
  });
}

// 5. Renderizado del catálogo de eventos
function renderizarCatalogo(items) {
  if (!listaEventos) return;

  if (!items || items.length === 0) {
    listaEventos.innerHTML = '';
    if (vacio) vacio.style.display = 'block';
    return;
  }

  if (vacio) vacio.style.display = 'none';

  listaEventos.innerHTML = items
    .map((ev) => {
      const ico = iconoEvento(ev.tipo);
      const canalesHtml = formatearCanales(ev.canales);
      const badgeEstado = ev.activo
        ? '<span class="badge-status badge-activo">Habilitada</span>'
        : '<span class="badge-status badge-inactivo">Deshabilitada</span>';

      return `
        <article class="fila" data-tipo="${escapar(ev.tipo)}">
          <div class="avatar-ico" aria-hidden="true">${ico}</div>
          <div class="info">
            <b>${escapar(ev.nombre || ev.tipo)}</b>
            <small>${escapar(ev.tipo)}</small>
            <div class="canales-tags" style="margin-top:6px;">${canalesHtml}</div>
          </div>
          ${badgeEstado}
          <button type="button" class="btn btn-sm btn-editar" data-tipo="${escapar(ev.tipo)}" aria-label="Configurar ${escapar(ev.nombre)}">
            Configurar
          </button>
        </article>
      `;
    })
    .join('');

  // Event listeners para botones de edición
  listaEventos.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tipo = btn.getAttribute('data-tipo');
      if (tipo) abrirEdicion(tipo);
    });
  });
}

function filtrarCatalogo() {
  const q = (fBuscar?.value || '').trim().toLowerCase();
  const c = (fCanal?.value || '').trim().toLowerCase();
  const e = (fEstado?.value || '').trim().toLowerCase();

  const filtrados = eventosCargados.filter((ev) => {
    // Filtro por texto (nombre o clave)
    if (q) {
      const nom = String(ev.nombre || '').toLowerCase();
      const tip = String(ev.tipo || '').toLowerCase();
      if (!nom.includes(q) && !tip.includes(q)) return false;
    }

    // Filtro por canal
    if (c) {
      const tieneCanal = Array.isArray(ev.canales) && ev.canales.some((k) => k.toLowerCase() === c);
      if (!tieneCanal) return false;
    }

    // Filtro por estado
    if (e) {
      if (e === 'activo' && !ev.activo) return false;
      if (e === 'inactivo' && ev.activo) return false;
    }

    return true;
  });

  renderizarCatalogo(filtrados);
}

async function cargarCatalogo() {
  if (errCatalogo) {
    errCatalogo.textContent = '';
    errCatalogo.classList.remove('show');
  }

  if (listaEventos) {
    listaEventos.innerHTML = `
      <div class="sk-card fila-sk">
        <div class="sk sk-icon"></div>
        <div class="sk-info">
          <div class="sk sk-line" style="width: 50%;"></div>
          <div class="sk sk-line" style="width: 70%;"></div>
        </div>
        <div class="sk sk-btn"></div>
      </div>
      <div class="sk-card fila-sk">
        <div class="sk sk-icon"></div>
        <div class="sk-info">
          <div class="sk sk-line" style="width: 45%;"></div>
          <div class="sk sk-line" style="width: 60%;"></div>
        </div>
        <div class="sk sk-btn"></div>
      </div>
    `;
  }
  if (vacio) vacio.style.display = 'none';

  const res = await listarNotificaciones();

  if (!res.ok) {
    if (listaEventos) listaEventos.innerHTML = '';
    if (errCatalogo) {
      errCatalogo.textContent = res.error || 'No se pudo cargar el catálogo de notificaciones.';
      errCatalogo.classList.add('show');
    }
    return;
  }

  eventosCargados = Array.isArray(res.data) ? res.data : [];

  const total = eventosCargados.length;
  if (badgeContador && contadorTexto) {
    contadorTexto.textContent = `${total} evento${total === 1 ? '' : 's'}`;
    badgeContador.style.display = 'inline-block';
  }

  filtrarCatalogo();
}

// 6. Pantalla de edición y previsualización
async function abrirEdicion(tipo) {
  if (errEditar) {
    errEditar.textContent = '';
    errEditar.classList.remove('show');
  }

  cambiarPantalla('editar');

  const res = await obtenerDetalleNotificacion(tipo);
  if (!res.ok || !res.data) {
    showToast(res.error || 'No fue posible cargar el detalle del evento.');
    cambiarPantalla('catalogo');
    return;
  }

  eventoActual = res.data;

  // Llenar campos
  if (editTitulo) editTitulo.textContent = `Configurar: ${eventoActual.nombre || eventoActual.tipo}`;
  if (editSub) editSub.textContent = `Evento del sistema: ${eventoActual.tipo}`;

  if (chkActivo) {
    chkActivo.checked = Boolean(eventoActual.activo);
  }
  actualizarTextoActivo();

  // Canales
  const canales = Array.isArray(eventoActual.canales) ? eventoActual.canales : [];
  if (chkCanalCorreo) chkCanalCorreo.checked = canales.includes('correo');
  if (chkCanalSms) chkCanalSms.checked = canales.includes('sms');
  if (chkCanalInterna) chkCanalInterna.checked = canales.includes('interna');

  // Asunto y cuerpo
  if (txtAsunto) txtAsunto.value = eventoActual.asunto || '';
  if (txtCuerpo) txtCuerpo.value = eventoActual.cuerpo || '';

  // Fecha por defecto en variables de prueba
  if (varFecha && !varFecha.value) {
    const hoy = new Date();
    varFecha.value = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  }

  actualizarVistaPrevia();
}

function actualizarTextoActivo() {
  if (lblActivoTexto && chkActivo) {
    lblActivoTexto.textContent = chkActivo.checked ? 'Habilitada' : 'Deshabilitada';
  }
}

if (chkActivo) {
  chkActivo.addEventListener('change', actualizarTextoActivo);
}

// Inserción asistida de variables dinámicas al hacer clic en los chips
if (chipsVariables && txtCuerpo) {
  chipsVariables.querySelectorAll('.chip-var').forEach((btn) => {
    btn.addEventListener('click', () => {
      const varTexto = btn.getAttribute('data-var');
      if (!varTexto) return;

      const inicio = txtCuerpo.selectionStart ?? txtCuerpo.value.length;
      const fin = txtCuerpo.selectionEnd ?? txtCuerpo.value.length;
      const antes = txtCuerpo.value.substring(0, inicio);
      const despues = txtCuerpo.value.substring(fin);

      txtCuerpo.value = antes + varTexto + despues;
      txtCuerpo.focus();
      txtCuerpo.selectionStart = txtCuerpo.selectionEnd = inicio + varTexto.length;

      actualizarVistaPrevia();
    });
  });
}

// Canales seleccionados en el formulario
function obtenerCanalesSeleccionados() {
  const seleccionados = [];
  if (chkCanalCorreo?.checked) seleccionados.push('correo');
  if (chkCanalSms?.checked) seleccionados.push('sms');
  if (chkCanalInterna?.checked) seleccionados.push('interna');
  return seleccionados;
}

// Previsualización interactiva
async function actualizarVistaPrevia() {
  if (!eventoActual) return;

  const canales = obtenerCanalesSeleccionados();
  if (prevCanales) {
    prevCanales.innerHTML = formatearCanales(canales);
  }

  const vars = {
    nombre: varNombre?.value?.trim() || 'María',
    codigo: varCodigo?.value?.trim() || '482913',
    fecha: varFecha?.value?.trim() || '10/10/2026',
    motivo: varMotivo?.value?.trim() || 'Documentación incompleta'
  };

  // Intenta consultar la previsualización al backend
  const res = await obtenerPreviewNotificacion(eventoActual.tipo, vars);

  if (res.ok && res.data) {
    if (prevAsunto) prevAsunto.textContent = res.data.asunto || '(Sin asunto definido)';
    if (prevCuerpo) prevCuerpo.textContent = res.data.cuerpo || '(Sin cuerpo definido)';
  } else {
    // Fallback de renderizado en el cliente sustituyendo las variables locales
    let asuntoRender = txtAsunto?.value || '';
    let cuerpoRender = txtCuerpo?.value || '';

    Object.entries(vars).forEach(([k, v]) => {
      const reg = new RegExp(`\\{${k}\\}`, 'gi');
      asuntoRender = asuntoRender.replace(reg, v);
      cuerpoRender = cuerpoRender.replace(reg, v);
    });

    if (prevAsunto) prevAsunto.textContent = asuntoRender || '(Sin asunto definido)';
    if (prevCuerpo) prevCuerpo.textContent = cuerpoRender || '(Sin cuerpo definido)';
  }
}

if (btnActualizarPreview) {
  btnActualizarPreview.addEventListener('click', actualizarVistaPrevia);
}

[varNombre, varCodigo, varFecha, varMotivo].forEach((input) => {
  if (input) input.addEventListener('input', actualizarVistaPrevia);
});

if (txtAsunto) txtAsunto.addEventListener('input', actualizarVistaPrevia);
if (txtCuerpo) txtCuerpo.addEventListener('input', actualizarVistaPrevia);
[chkCanalCorreo, chkCanalSms, chkCanalInterna].forEach((chk) => {
  if (chk) chk.addEventListener('change', actualizarVistaPrevia);
});

// 7. Validación y guardado
function validarFormulario() {
  const activo = chkActivo?.checked;
  const canales = obtenerCanalesSeleccionados();
  const asunto = txtAsunto?.value?.trim() || '';
  const cuerpo = txtCuerpo?.value?.trim() || '';

  if (activo) {
    if (canales.length === 0) {
      return 'Debes seleccionar al menos un canal de entrega si la notificación está habilitada.';
    }
    if (canales.includes('correo') && !asunto) {
      return 'El asunto es obligatorio cuando el canal de correo está habilitado.';
    }
    if (!cuerpo) {
      return 'El cuerpo o plantilla del mensaje es obligatorio.';
    }
  }

  return '';
}

if (formNotificacion) {
  formNotificacion.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!eventoActual) return;

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
      'Guardar configuración',
      `¿Deseas guardar los cambios en la notificación "${eventoActual.nombre || eventoActual.tipo}"?`
    );
  });
}

// 8. Confirmación y guardado en modal (btnModalSi)
if (btnModalSi) {
  btnModalSi.addEventListener('click', async () => {
    cerrarModal();
    if (!eventoActual) return;

    const payload = {
      canales: obtenerCanalesSeleccionados(),
      activo: Boolean(chkActivo?.checked),
      asunto: txtAsunto?.value?.trim() || null,
      cuerpo: txtCuerpo?.value?.trim() || null
    };

    const res = await actualizarNotificacion(eventoActual.tipo, payload);

    if (!res.ok) {
      if (errEditar) {
        errEditar.textContent = res.error || 'No fue posible guardar la configuración.';
        errEditar.classList.add('show');
      }
      showToast(res.error || 'Error al guardar la notificación.');
      return;
    }

    showToast(res.mensaje || 'Configuración guardada exitosamente.');
    eventoActual = null;
    cambiarPantalla('catalogo');
    await cargarCatalogo();
  });
}

if (btnCancelarEdicion) {
  btnCancelarEdicion.addEventListener('click', () => {
    eventoActual = null;
    cambiarPantalla('catalogo');
  });
}

if (btnVolverCatalogo) {
  btnVolverCatalogo.addEventListener('click', () => {
    eventoActual = null;
    cambiarPantalla('catalogo');
  });
}

// 9. Filtros y recarga
if (fBuscar) fBuscar.addEventListener('input', filtrarCatalogo);
if (fCanal) fCanal.addEventListener('change', filtrarCatalogo);
if (fEstado) fEstado.addEventListener('change', filtrarCatalogo);

if (btnRefrescar) {
  btnRefrescar.addEventListener('click', () => {
    cargarCatalogo();
    showToast('Catálogo actualizado.');
  });
}

// 10. Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarCatalogo();
});
