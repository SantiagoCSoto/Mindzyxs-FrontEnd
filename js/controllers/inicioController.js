/**
 * Controlador para la Página de Inicio / Bienvenida (views/inicio.html)
 * Gestiona:
 * 1. Sesión activa y datos del usuario (o invitado)
 * 2. Cierre de sesión (logout)
 * 3. Funcionalidades sensibles con modal de Mensaje Aclaratorio
 * 4. Auditoría y logs internos en consola
 */

import { authService } from '../services/authService.js';
import { avisoService } from '../services/avisoService.js';

// Elementos del DOM - Encabezado y Sesión
const btnLogout = document.getElementById('btn-logout');
const nombreUsuarioSpan = document.getElementById('nombre-usuario');
const rolUsuarioSpan = document.getElementById('rol-usuario');
const roleBadge = document.getElementById('roleBadge');

// Elementos del DOM - Modales y Footer
const avisoModal = document.getElementById('avisoModal');
const errModal = document.getElementById('errModal');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');
const errOk = document.getElementById('errOk');
const footerAviso = document.getElementById('footerAviso');
const toast = document.getElementById('toast');

// Elementos del DOM - Panel de pruebas (Demo)
const firstTimeChip = document.getElementById('firstTimeChip');
const resetAck = document.getElementById('resetAck');
const errChip = document.getElementById('errChip');

// Estado local de la vista
let loadError = false;
let pendingAction = null;

/**
 * Muestra una notificación flotante temporal
 */
function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/**
 * Carga los datos de la sesión activa
 */
function cargarDatosUsuario() {
  const usuario = authService.getSesion();
  const esInvitado = sessionStorage.getItem('es_invitado') === 'true';

  if (usuario) {
    const nombre = usuario.nombres || usuario.nombre || usuario.correo?.split('@')[0] || 'Usuario';
    const rol = usuario.rol || usuario.tipo_usuario || 'Paciente';

    if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = nombre;
    if (rolUsuarioSpan) rolUsuarioSpan.textContent = rol;
    if (roleBadge) roleBadge.textContent = rol;
  } else if (esInvitado) {
    if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = 'Invitado';
    if (rolUsuarioSpan) rolUsuarioSpan.textContent = 'Invitado';
    if (roleBadge) roleBadge.textContent = 'Invitado';
  } else {
    // Si no hay sesión ni modo invitado, permitir continuar como Paciente por defecto
    // para pruebas locales sin forzar bloqueo
    if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = 'Paciente Invitado';
    if (rolUsuarioSpan) rolUsuarioSpan.textContent = 'Paciente';
    if (roleBadge) roleBadge.textContent = 'Paciente';
  }
}

/**
 * Abre el modal del mensaje aclaratorio (o modal de error si está en modo fallo)
 * @param {string|null} fromSensitive - Nombre de la funcionalidad sensible o null si viene del footer
 */
async function openAviso(fromSensitive = null) {
  const rolActual = roleBadge?.textContent || 'Paciente';

  // Si se simula un error de carga o falla el backend
  if (loadError) {
    if (errModal) errModal.classList.add('open');
    avisoService.logAuditoria(`ERROR: no fue posible cargar el mensaje aclaratorio (rol: ${rolActual})`);
    await avisoService.registrarVisualizacion(fromSensitive ? `auto:${fromSensitive}` : 'enlace', 'error');
    return;
  }

  pendingAction = fromSensitive;
  if (avisoModal) avisoModal.classList.add('open');

  const origen = fromSensitive ? `auto:${fromSensitive}` : 'enlace';
  if (fromSensitive) {
    avisoService.logAuditoria(`VISUALIZACIÓN auto (primera vez, antes de "${fromSensitive}") rol: ${rolActual}`);
  } else {
    avisoService.logAuditoria(`VISUALIZACIÓN por enlace "Aviso: no diagnóstico" rol: ${rolActual}`);
  }

  // Registrar en auditoría de backend
  await avisoService.registrarVisualizacion(origen, 'ok');
}

/**
 * Inicializa los eventos de las funcionalidades sensibles y modales (PB-04)
 */
function inicializarAvisoAclaratorio() {
  // 1. Clic en las 3 tarjetas de funcionalidades sensibles
  const botonesTarjetas = document.querySelectorAll('.tile .btn-tile, [data-feature]');
  botonesTarjetas.forEach(btn => {
    btn.addEventListener('click', () => {
      const feature = btn.dataset.feature || btn.closest('.tile')?.querySelector('h3')?.textContent || 'Funcionalidad';

      if (loadError) {
        pendingAction = feature;
        openAviso(feature);
        return;
      }

      // Si no ha aceptado el aviso en la sesión, se muestra el modal antes de continuar
      if (!avisoService.haAceptadoAviso()) {
        pendingAction = feature;
        avisoService.logAuditoria(`INTENTO de acceder por primera vez a: "${feature}" -> se muestra aviso antes de continuar`);
        openAviso(feature);
      } else {
        // Si ya lo aceptó previamente en la sesión, accede directo
        avisoService.logAuditoria(`ACCESO directo (aviso ya visualizado previamente): "${feature}"`);
        showToast(`Accediendo a: ${feature} ✓`);
      }
    });
  });

  // 2. Botón "Entendido" del modal
  if (btnEntendido) {
    btnEntendido.addEventListener('click', () => {
      if (avisoModal) avisoModal.classList.remove('open');
      avisoService.marcarAvisoAceptado();

      if (firstTimeChip) firstTimeChip.classList.remove('active');

      if (pendingAction) {
        const accion = pendingAction;
        pendingAction = null;
        avisoService.logAuditoria(`ACCESO PERMITIDO tras aceptar aviso: "${accion}"`);
        showToast(`Accediendo a: ${accion} ✓`);
      }
    });
  }

  // 3. Botón "Cerrar" del modal (cancela el acceso y retorna a la pantalla anterior sin alterar nada)
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      if (avisoModal) avisoModal.classList.remove('open');
      avisoService.logAuditoria('AVISO CERRADO - botón "Cerrar" - retorna a la pantalla anterior sin alterar información');

      if (pendingAction) {
        const accion = pendingAction;
        avisoService.logAuditoria(`ACCESO CANCELADO por "Cerrar": "${accion}"`);
        showToast(`Acceso a "${accion}" cancelado - retornaste a la pantalla de inicio`);
        pendingAction = null;
      }
    });
  }

  // 4. Botón "Entendido" del modal de error
  if (errOk) {
    errOk.addEventListener('click', () => {
      if (errModal) errModal.classList.remove('open');
      if (pendingAction) {
        showToast('No fue posible cargar el mensaje aclaratorio. Intente nuevamente');
        pendingAction = null;
      }
    });
  }

  // 5. Enlace permanente del pie de página "Aviso: no diagnóstico"
  if (footerAviso) {
    footerAviso.addEventListener('click', (e) => {
      e.preventDefault();
      openAviso(null);
    });
  }

  // 6. Controles interactivos de prueba (Demo)
  if (resetAck) {
    resetAck.addEventListener('click', () => {
      avisoService.resetearAviso();
      if (firstTimeChip) firstTimeChip.classList.add('active');
      showToast('Aviso reiniciado (se volverá a mostrar automáticamente al acceder)');
    });
  }

  if (firstTimeChip) {
    // Reflejar estado inicial según si ya aceptó o no
    firstTimeChip.classList.toggle('active', !avisoService.haAceptadoAviso());

    firstTimeChip.addEventListener('click', () => {
      avisoService.resetearAviso();
      firstTimeChip.classList.add('active');
      showToast('Modo primera vez activado');
    });
  }

  if (errChip) {
    errChip.addEventListener('click', () => {
      loadError = !loadError;
      errChip.classList.toggle('active', loadError);
      avisoService.logAuditoria(loadError
        ? 'DEMO: modo error de carga ACTIVADO - el mensaje no podrá cargarse'
        : 'DEMO: modo error de carga DESACTIVADO');
      showToast(loadError ? 'Simulación de error ACTIVADA' : 'Simulación de error DESACTIVADA');
    });
  }

  // Log inicial de sistema listo
  avisoService.logAuditoria('Sistema listo - el enlace "Aviso: no diagnóstico" está disponible en la barra inferior');
}

/**
 * Función de cierre de sesión
 */
function logout() {
  const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
  if (confirmacion) {
    authService.logout();
    avisoService.resetearAviso();
    sessionStorage.removeItem('es_invitado');
    window.location.href = 'login.html';
  }
}

// Inicialización de eventos generales
if (btnLogout) {
  btnLogout.addEventListener('click', logout);
}

// Cargar datos y arrancar controlador
cargarDatosUsuario();
inicializarAvisoAclaratorio();