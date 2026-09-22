/**
 * Controlador para la Página de Inicio / Bienvenida (views/inicio.html)
 * Gestiona:
 * 1. Sesión activa y datos del usuario (o modo invitado PB-06)
 * 2. Visualización condicional (servicios registrados vs opciones de invitado)
 * 3. Bloqueo y auditoría de funciones exclusivas para invitados
 * 4. Integración del Mensaje Aclaratorio (PB-04) antes del cuestionario
 * 5. Cierre de sesión y retorno a landing
 */

import { authService } from '../services/authService.js';
import { avisoService } from '../services/avisoService.js';
import { invitadoService } from '../services/invitadoService.js';

// Elementos del DOM - Encabezado y Sesión
const btnLogout = document.getElementById('btn-logout');
const btnLoginHeader = document.getElementById('btn-login-header');
const nombreUsuarioSpan = document.getElementById('nombre-usuario');
const rolUsuarioSpan = document.getElementById('rol-usuario');
const roleBadge = document.getElementById('roleBadge');
const badgeGuestHero = document.getElementById('badgeGuestHero');
const heroTitulo = document.getElementById('heroTitulo');
const heroSubtitulo = document.getElementById('heroSubtitulo');
const sesionPill = document.getElementById('sesionPill');

// Elementos del DOM - Secciones y Cuadrículas
const sectionTitleDisponibles = document.getElementById('sectionTitleDisponibles');
const gridRegistrado = document.getElementById('gridRegistrado');
const dashInvitado = document.getElementById('dashInvitado');
const sectionExclusivas = document.getElementById('sectionExclusivas');

// Elementos del DOM - Botones de Modo Invitado (PB-06, dashboard estilo Main/Index)
const btnInvitadoCuestionario = document.getElementById('btn-invitado-cuestionario');
const btnInvitadoRecomendaciones = document.getElementById('btn-invitado-recomendaciones');
const btnInvitadoAyuda = document.getElementById('btn-invitado-ayuda');
const btnInvitadoResultado = document.getElementById('btn-invitado-resultado');
const btnInvitadoAviso = document.getElementById('btn-invitado-aviso');
const btnSalirInvitado = document.getElementById('btn-salir-invitado');

// Elementos del DOM - Modales y Notificaciones
const avisoModal = document.getElementById('avisoModal');
const errModal = document.getElementById('errModal');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');
const errOk = document.getElementById('errOk');
const modalLineasAyuda = document.getElementById('modalLineasAyuda');
const btnCerrarAyuda = document.getElementById('btnCerrarAyuda');
const footerAviso = document.getElementById('footerAviso');
const toast = document.getElementById('toast');

// Estado local de la vista
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
 * Configura la interfaz según si es un usuario registrado o un invitado (PB-06)
 */
function cargarDatosUsuario() {
  const esInvitado = invitadoService.esInvitado();
  const usuario = authService.getSesion();

  if (esInvitado) {
    // -------------------------------------------------------------
    // DASHBOARD EN MODO INVITADO (estilo Main/Index del proyecto original)
    // -------------------------------------------------------------
    if (gridRegistrado) gridRegistrado.style.display = 'none';
    if (dashInvitado) dashInvitado.style.display = 'block';
    if (sectionExclusivas) sectionExclusivas.style.display = 'block';

    if (btnLogout) btnLogout.style.display = 'none';
    if (btnLoginHeader) btnLoginHeader.style.display = 'inline-flex';
    if (badgeGuestHero) badgeGuestHero.style.display = 'inline-block';
    if (sesionPill) sesionPill.style.display = 'none';

    if (sectionTitleDisponibles) sectionTitleDisponibles.textContent = 'Explora como invitado';
    if (heroTitulo) heroTitulo.textContent = 'Mindzyxs';
    if (heroSubtitulo) {
      heroSubtitulo.innerHTML = 'Tu espacio de apoyo y <b>seguimiento emocional</b>.';
    }

    if (roleBadge) {
      roleBadge.textContent = 'Invitado';
      roleBadge.style.color = '#B45309';
      roleBadge.style.background = '#FFF4E5';
      roleBadge.style.borderColor = '#FDE68A';
    }
    if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = 'Invitado';
    if (rolUsuarioSpan) rolUsuarioSpan.textContent = 'Invitado';

    invitadoService.logAuditoria('Panel de inicio renderizado en MODO INVITADO (dashboard): cuestionario, resultado, recomendaciones, aviso y exclusivas bloqueadas');
  } else {
    // -------------------------------------------------------------
    // VISTA PARA USUARIO REGISTRADO (PACIENTE / PSICÓLOGO)
    // -------------------------------------------------------------
    if (gridRegistrado) gridRegistrado.style.display = 'grid';
    if (dashInvitado) dashInvitado.style.display = 'none';
    if (sectionExclusivas) sectionExclusivas.style.display = 'none';

    if (btnLogout) btnLogout.style.display = 'inline-flex';
    if (btnLoginHeader) btnLoginHeader.style.display = 'none';
    if (badgeGuestHero) badgeGuestHero.style.display = 'none';
    if (sesionPill) sesionPill.style.display = 'inline-flex';
    if (sectionTitleDisponibles) sectionTitleDisponibles.textContent = 'Servicios disponibles';

    if (usuario) {
      const nombre = usuario.nombres || usuario.nombre || usuario.correo?.split('@')[0] || 'Usuario';
      const rol = usuario.rol || usuario.tipo_usuario || 'Paciente';

      if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = nombre;
      if (rolUsuarioSpan) rolUsuarioSpan.textContent = rol;
      if (roleBadge) {
        roleBadge.textContent = rol;
        roleBadge.style.color = '';
        roleBadge.style.background = '';
        roleBadge.style.borderColor = '';
      }
    } else {
      if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = 'Paciente';
      if (rolUsuarioSpan) rolUsuarioSpan.textContent = 'Paciente';
      if (roleBadge) roleBadge.textContent = 'Paciente';
    }
  }
}

/**
 * Abre el modal del mensaje aclaratorio (PB-04)
 * @param {string|null} fromSensitive - Nombre de la funcionalidad sensible o null si viene del footer
 */
async function openAviso(fromSensitive = null) {
  const rolActual = roleBadge?.textContent || 'Paciente';

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
 * Inicializa los eventos interactivos específicos para el Modo Invitado (PB-06)
 */
function inicializarEventosInvitado() {
  // 1. Opción disponible 1: Responder cuestionario (requiere aviso PB-04 si no ha sido aceptado)
  if (btnInvitadoCuestionario) {
    btnInvitadoCuestionario.addEventListener('click', () => {
      const feature = 'Responder cuestionario';
      if (!avisoService.haAceptadoAviso()) {
        pendingAction = 'cuestionario_invitado';
        avisoService.logAuditoria(`INTENTO de acceder por primera vez a: "${feature}" (Invitado) -> se muestra aviso antes de continuar`);
        openAviso(feature);
      } else {
        avisoService.logAuditoria(`ACCESO directo a "${feature}" (aviso ya aceptado) -> Navegando a encuesta_invitado.html`);
        window.location.href = 'encuesta_invitado.html';
      }
    });
  }

  // 2. Ver recomendaciones básicas (dashboard invitado)
  if (btnInvitadoRecomendaciones) {
    btnInvitadoRecomendaciones.addEventListener('click', () => {
      invitadoService.logAuditoria('ACCESO a "Ver recomendaciones básicas"');
      window.location.href = 'recomendaciones_invitado.html';
    });
  }

  // 2b. Ver resultado (dashboard invitado -> pantalla de riesgo PB-08)
  if (btnInvitadoResultado) {
    btnInvitadoResultado.addEventListener('click', () => {
      invitadoService.logAuditoria('ACCESO a "Ver resultado" (dashboard invitado)');
      window.location.href = 'resultado_riesgo.html';
    });
  }

  // 2c. Aviso importante (dashboard invitado -> modal aclaratorio PB-04)
  if (btnInvitadoAviso) {
    btnInvitadoAviso.addEventListener('click', () => {
      openAviso(null);
    });
  }

  // 3. Opción disponible 3: Líneas de ayuda
  if (btnInvitadoAyuda) {
    btnInvitadoAyuda.addEventListener('click', () => {
      invitadoService.logAuditoria('APERTURA de modal "Líneas de ayuda"');
      if (modalLineasAyuda) modalLineasAyuda.classList.add('open');
    });
  }

  // Cerrar modal de líneas de ayuda
  if (btnCerrarAyuda) {
    btnCerrarAyuda.addEventListener('click', () => {
      if (modalLineasAyuda) modalLineasAyuda.classList.remove('open');
    });
  }

  if (modalLineasAyuda) {
    modalLineasAyuda.addEventListener('click', (e) => {
      if (e.target === modalLineasAyuda) {
        modalLineasAyuda.classList.remove('open');
      }
    });
  }

  // 4. Funciones exclusivas bloqueadas (4 tarjetas)
  const tilesBloqueadas = document.querySelectorAll('.tile-locked');
  tilesBloqueadas.forEach(tile => {
    tile.addEventListener('click', async () => {
      const nombreFuncion = tile.dataset.exclusive || tile.querySelector('h3')?.textContent || 'Función exclusiva';
      showToast(`🔒 "${nombreFuncion}" requiere crear una cuenta o iniciar sesión`);
      await invitadoService.registrarBloqueo(nombreFuncion);
    });
  });

  // 5. Botón inferior para salir del modo invitado y volver a la Landing
  if (btnSalirInvitado) {
    btnSalirInvitado.addEventListener('click', async () => {
      await invitadoService.salirModoInvitado('panel');
      window.location.href = 'login.html';
    });
  }

  // 6. Botón superior del header para iniciar sesión
  if (btnLoginHeader) {
    btnLoginHeader.addEventListener('click', async (e) => {
      e.preventDefault();
      await invitadoService.salirModoInvitado('header');
      window.location.href = 'login.html';
    });
  }
}

/**
 * Inicializa los eventos del Mensaje Aclaratorio (PB-04) y servicios registrados
 */
function inicializarAvisoAclaratorio() {
  // Clic en las tarjetas del usuario registrado
  if (gridRegistrado) {
    const botonesRegistrados = gridRegistrado.querySelectorAll('.btn-tile, [data-feature]');
    botonesRegistrados.forEach(btn => {
      btn.addEventListener('click', () => {
        const feature = btn.dataset.feature || btn.closest('.tile')?.querySelector('h3')?.textContent || 'Funcionalidad';

        if (!avisoService.haAceptadoAviso()) {
          pendingAction = feature;
          avisoService.logAuditoria(`INTENTO de acceder por primera vez a: "${feature}" -> se muestra aviso antes de continuar`);
          openAviso(feature);
        } else {
          avisoService.logAuditoria(`ACCESO directo (aviso ya visualizado previamente): "${feature}"`);
          showToast(`Accediendo a: ${feature} ✓`);
        }
      });
    });
  }

  // Botón "Entendido" del modal aclaratorio
  if (btnEntendido) {
    btnEntendido.addEventListener('click', () => {
      if (avisoModal) avisoModal.classList.remove('open');
      avisoService.marcarAvisoAceptado();

      if (pendingAction) {
        const accion = pendingAction;
        pendingAction = null;

        if (accion === 'cuestionario_invitado' || accion === 'Responder cuestionario') {
          avisoService.logAuditoria('ACCESO PERMITIDO tras aceptar aviso -> Redirigiendo a encuesta_invitado.html');
          window.location.href = 'encuesta_invitado.html';
        } else {
          avisoService.logAuditoria(`ACCESO PERMITIDO tras aceptar aviso: "${accion}"`);
          showToast(`Accediendo a: ${accion} ✓`);
        }
      }
    });
  }

  // Botón "Cerrar" del modal aclaratorio (cancela el acceso y retorna)
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      if (avisoModal) avisoModal.classList.remove('open');
      avisoService.logAuditoria('AVISO CERRADO - botón "Cerrar" - retorna a la pantalla anterior sin alterar información');

      if (pendingAction) {
        const accion = pendingAction;
        pendingAction = null;
        avisoService.logAuditoria(`ACCESO CANCELADO por "Cerrar": "${accion}"`);
        showToast(`Acceso cancelado - retornaste a la pantalla de inicio`);
      }
    });
  }

  // Botón del modal de error
  if (errOk) {
    errOk.addEventListener('click', () => {
      if (errModal) errModal.classList.remove('open');
      if (pendingAction) {
        showToast('No fue posible cargar el mensaje aclaratorio. Intente nuevamente');
        pendingAction = null;
      }
    });
  }

  // Enlace permanente del pie de página "Aviso: no diagnóstico"
  if (footerAviso) {
    footerAviso.addEventListener('click', (e) => {
      e.preventDefault();
      openAviso(null);
    });
  }

  avisoService.logAuditoria('Sistema listo - el enlace "Aviso: no diagnóstico" está disponible en la barra inferior');
}

/**
 * Función de cierre de sesión para usuarios registrados
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

// Cargar datos de sesión e inicializar componentes
cargarDatosUsuario();
inicializarEventosInvitado();
inicializarAvisoAclaratorio();