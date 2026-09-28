/**
 * Controlador del Panel de invitado (views/panel_invitado.html).
 * Dashboard estilo Main/Index del proyecto original (PB-06):
 * héroe + acciones (cuestionario, crear cuenta) + lista Explora
 * (resultado, recomendaciones, líneas, aviso) + exclusivas bloqueadas.
 * Si no hay modo invitado activo, redirige a la landing (inicio.html).
 */

import { avisoService } from '../services/avisoService.js';
import { invitadoService } from '../services/invitadoService.js';

if (!invitadoService.esInvitado()) {
  window.location.href = 'inicio.html';
}

const btnInvitadoCuestionario = document.getElementById('btn-invitado-cuestionario');
const btnInvitadoRecomendaciones = document.getElementById('btn-invitado-recomendaciones');
const btnInvitadoAyuda = document.getElementById('btn-invitado-ayuda');
const btnInvitadoResultado = document.getElementById('btn-invitado-resultado');
const btnInvitadoAviso = document.getElementById('btn-invitado-aviso');
const btnSalirInvitado = document.getElementById('btn-salir-invitado');
const btnSalirTop = document.getElementById('btn-salir-invitado-top');

const avisoModal = document.getElementById('avisoModal');
const errModal = document.getElementById('errModal');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');
const errOk = document.getElementById('errOk');
const modalLineasAyuda = document.getElementById('modalLineasAyuda');
const btnCerrarAyuda = document.getElementById('btnCerrarAyuda');
const footerAviso = document.getElementById('footerAviso');
const toast = document.getElementById('toast');

let pendingAction = null;

function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function openAviso(fromSensitive = null) {
  pendingAction = fromSensitive;
  if (avisoModal) avisoModal.classList.add('open');

  const origen = fromSensitive ? `auto:${fromSensitive}` : 'enlace';
  invitadoService.logAuditoria(`VISUALIZACIÓN ${fromSensitive ? `auto (primera vez, antes de "${fromSensitive}")` : 'por enlace "Aviso: no diagnóstico"'} (Invitado)`);
  await avisoService.registrarVisualizacion(origen, 'ok');
}

// 1. Responder cuestionario (aviso PB-04 si no aceptado)
if (btnInvitadoCuestionario) {
  btnInvitadoCuestionario.addEventListener('click', () => {
    const feature = 'Responder cuestionario';
    if (!avisoService.haAceptadoAviso()) {
      pendingAction = 'cuestionario_invitado';
      invitadoService.logAuditoria(`INTENTO de acceder por primera vez a: "${feature}" (Invitado) -> se muestra aviso`);
      openAviso(feature);
    } else {
      invitadoService.logAuditoria(`ACCESO directo a "${feature}" (aviso ya aceptado)`);
      window.location.href = 'encuesta_invitado.html';
    }
  });
}

// 2. Ver recomendaciones básicas
if (btnInvitadoRecomendaciones) {
  btnInvitadoRecomendaciones.addEventListener('click', () => {
    invitadoService.logAuditoria('ACCESO a "Ver recomendaciones básicas"');
    window.location.href = 'recomendaciones_invitado.html';
  });
}

// 2b. Ver resultado -> pantalla de riesgo PB-08
if (btnInvitadoResultado) {
  btnInvitadoResultado.addEventListener('click', () => {
    invitadoService.logAuditoria('ACCESO a "Ver resultado" (dashboard invitado)');
    window.location.href = 'resultado_riesgo.html';
  });
}

// 2c. Aviso importante -> modal aclaratorio
if (btnInvitadoAviso) {
  btnInvitadoAviso.addEventListener('click', () => {
    openAviso(null);
  });
}

// 3. Líneas de ayuda (modal)
if (btnInvitadoAyuda) {
  btnInvitadoAyuda.addEventListener('click', () => {
    invitadoService.logAuditoria('APERTURA de modal "Líneas de ayuda"');
    if (modalLineasAyuda) modalLineasAyuda.classList.add('open');
  });
}
if (btnCerrarAyuda) {
  btnCerrarAyuda.addEventListener('click', () => {
    if (modalLineasAyuda) modalLineasAyuda.classList.remove('open');
  });
}
const btnXAyuda = document.getElementById('btnXAyuda');
if (btnXAyuda) {
  btnXAyuda.addEventListener('click', () => {
    if (modalLineasAyuda) modalLineasAyuda.classList.remove('open');
  });
}
if (modalLineasAyuda) {
  modalLineasAyuda.addEventListener('click', (e) => {
    if (e.target === modalLineasAyuda) modalLineasAyuda.classList.remove('open');
  });
}

// 4. Funciones exclusivas bloqueadas
document.querySelectorAll('.tile-locked').forEach((tile) => {
  tile.addEventListener('click', async () => {
    const nombreFuncion = tile.dataset.exclusive || tile.querySelector('h3')?.textContent || 'Función exclusiva';
    showToast(`🔒 "${nombreFuncion}" requiere crear una cuenta o iniciar sesión`);
    await invitadoService.registrarBloqueo(nombreFuncion);
  });
});

// 5. Salir del modo invitado -> landing
async function salir(origen) {
  await invitadoService.salirModoInvitado(origen);
  window.location.href = 'inicio.html';
}
if (btnSalirInvitado) btnSalirInvitado.addEventListener('click', () => salir('panel'));
if (btnSalirTop) btnSalirTop.addEventListener('click', () => salir('header'));

// Aviso: Entendido / Cerrar / error / footer
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
      }
    }
  });
}
if (btnCerrar) {
  btnCerrar.addEventListener('click', () => {
    if (avisoModal) avisoModal.classList.remove('open');
    invitadoService.logAuditoria('AVISO CERRADO - retorna al panel sin alterar información');
    if (pendingAction) {
      pendingAction = null;
      showToast('Acceso cancelado - retornó al panel de invitado');
    }
  });
}
if (errOk) {
  errOk.addEventListener('click', () => {
    if (errModal) errModal.classList.remove('open');
    if (pendingAction) {
      showToast('No fue posible cargar el mensaje aclaratorio. Intente nuevamente');
      pendingAction = null;
    }
  });
}
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    openAviso(null);
  });
}

invitadoService.logAuditoria('Panel de invitado renderizado (dashboard): cuestionario, resultado, recomendaciones, aviso y exclusivas bloqueadas');
