/**
 * Controlador para views/admin_bd.html (PB-27)
 * Administración de base de datos: crear/restaurar/ver respaldos y mantenimiento.
 * Solo rol Administrador. Consume los endpoints /api/admin/* del backend.
 */

import { adminService } from '../services/adminService.js';
import { authService } from '../services/authService.js';
import { mostrarBanner, ocultarBanner, abrirModal, cerrarModal } from '../utils/alerts.js';

const adminContent = document.getElementById('admin-content');
const deniedBox = document.getElementById('denied-box');
const rolUsuario = document.getElementById('rol-usuario');

const msgBackup = document.getElementById('msg-backup');
const msgRestore = document.getElementById('msg-restore');
const msgMaintenance = document.getElementById('msg-maintenance');
const progress = document.getElementById('progress');
const bar = document.getElementById('bar');
const backupList = document.getElementById('backup-list');
const backupRows = document.getElementById('backup-rows');
const auditLog = document.getElementById('audit-log');

const restoreInput = document.getElementById('restore-input');
const restoreFileName = document.getElementById('restore-file-name');
const btnRestorePick = document.getElementById('btn-restore-pick');

const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmText = document.getElementById('confirm-text');
const btnConfirmNo = document.getElementById('btn-confirm-no');
const btnConfirmYes = document.getElementById('btn-confirm-yes');

let restoreFile = null;
let accionPendiente = null;

function triggerDownload(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo || 'respaldo.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function addLog(msg) {
  const t = new Date().toLocaleString();
  auditLog.textContent += `\n[${t}] ${msg}`;
  auditLog.scrollTop = auditLog.scrollHeight;
}

function mostrarMsg(el, texto, tipo = 'ok') {
  el.className = 'msg-admin ' + tipo;
  el.textContent = texto;
}

function esAdmin() {
  const sesion = authService.getSesion();
  const rol = sesion?.rol || sesion?.tipo_usuario || localStorage.getItem('rol') || '';
  return String(rol).toLowerCase() === 'administrador' || String(rol).toLowerCase() === 'admin';
}

function initPermisos() {
  if (!esAdmin()) {
    deniedBox.classList.add('show');
    adminContent.style.display = 'none';
    if (rolUsuario) rolUsuario.textContent = 'Rol sin permisos';
    addLog('INTENTO DENEGADO rol sin permisos -> Permiso denegado');
    return;
  }
  deniedBox.classList.remove('show');
  adminContent.style.display = 'block';
  if (rolUsuario) rolUsuario.textContent = 'Consola administración';
}

function renderRespaldos(respaldos = []) {
  backupRows.innerHTML = '';
  if (!respaldos.length) {
    backupRows.innerHTML = '<div class="backup-row"><span>Sin respaldos registrados</span><span>—</span><span>—</span><span>—</span></div>';
  } else {
    respaldos.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'backup-row';
      const fecha = r.fechaHora ? new Date(r.fechaHora).toLocaleString() : '';
      row.innerHTML =
        `<span>${r.nombreArchivo || ''}</span>` +
        `<span>${r.tamano || ''}</span>` +
        `<span>${fecha}</span>` +
        `<span><button class="btn-download" data-id="${r.idRespaldo}" data-name="${r.nombreArchivo || ''}" title="Descargar respaldo">&#11015;</button></span>`;
      backupRows.appendChild(row);
    });
  }
  backupList.style.display = 'block';
}

async function crearRespaldo() {
  mostrarMsg(msgBackup, '', 'ok');
  progress.classList.add('show');
  bar.style.width = '0%';
  let p = 0;
  const iv = setInterval(() => {
    p += 20;
    bar.style.width = p + '%';
  }, 200);

  const resultado = await adminService.crearRespaldo();
  clearInterval(iv);
  progress.classList.remove('show');

  if (resultado.exito) {
    const r = resultado.respaldo || {};
    mostrarMsg(msgBackup, `${resultado.mensaje} — ${r.nombreArchivo || ''} (${r.tamano || ''})`, 'ok');
    addLog(`BACKUP creado por admin: ${r.nombreArchivo || 'archivo'} (${r.tamano || ''})`);

    // Descargar el archivo al PC del administrador
    if (r.idRespaldo) {
      const dl = await adminService.descargarRespaldo(r.idRespaldo, r.nombreArchivo);
      if (dl.exito) triggerDownload(dl.blob, dl.nombreArchivo);
    }

    await verRespaldos(false);
  } else {
    mostrarMsg(msgBackup, resultado.mensaje || 'No fue posible crear el respaldo. Intente nuevamente', 'err');
    addLog('BACKUP FALLIDO por admin — ' + (resultado.mensaje || 'error'));
  }
}

async function verRespaldos(logear = true) {
  const resultado = await adminService.listarRespaldos();
  if (resultado.exito) {
    renderRespaldos(resultado.respaldos);
    if (logear) addLog('VIEW respaldos consultado por admin');
  } else {
    mostrarMsg(msgBackup, resultado.mensaje || 'No fue posible consultar los respaldos. Intente nuevamente', 'err');
    addLog('VIEW RESPALDOS FALLIDO — ' + (resultado.mensaje || 'error'));
  }
}

async function restaurarRespaldo() {
  mostrarMsg(msgRestore, '', 'ok');
  const resultado = await adminService.restaurarRespaldo(restoreFile);
  if (resultado.exito) {
    mostrarMsg(msgRestore, resultado.mensaje, 'ok');
    addLog(`RESTORE exitoso por admin desde archivo: ${restoreFile?.name || ''}`);
    restoreFile = null;
    restoreFileName.textContent = 'Ningún archivo seleccionado';
  } else {
    mostrarMsg(msgRestore, resultado.mensaje || 'No fue posible restaurar el respaldo. Verifique el archivo e intente nuevamente', 'err');
    addLog(`RESTORE FALLIDO por admin — ${restoreFile?.name || 'archivo'}`);
  }
}

async function ejecutarMantenimiento() {
  mostrarMsg(msgMaintenance, '', 'ok');
  const resultado = await adminService.ejecutarMantenimiento();
  if (resultado.exito) {
    const d = resultado.detalle || {};
    mostrarMsg(msgMaintenance, `${resultado.mensaje}. Códigos: ${d.codigosExpiradosEliminados ?? 0}, sesiones: ${d.sesionesExpiradasEliminadas ?? 0}, logs: ${d.logsAntiguosEliminados ?? 0}`, 'ok');
    addLog('MANTENIMIENTO ejecutado por admin — limpia temporales, sin afectar pacientes');
  } else {
    mostrarMsg(msgMaintenance, resultado.mensaje || 'No fue posible ejecutar el mantenimiento. Intente nuevamente', 'err');
    addLog('MANTENIMIENTO FALLIDO por admin — ' + (resultado.mensaje || 'error'));
  }
}

// ----- Listeners -----
document.getElementById('btn-backup').addEventListener('click', crearRespaldo);
document.getElementById('btn-view-backups').addEventListener('click', () => verRespaldos(true));
document.getElementById('btn-maintenance').addEventListener('click', ejecutarMantenimiento);

backupRows.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-download');
  if (!btn) return;
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const dl = await adminService.descargarRespaldo(id, name);
  if (dl.exito) {
    triggerDownload(dl.blob, dl.nombreArchivo);
    addLog(`DOWNLOAD respaldo por admin: ${name || id}`);
  } else {
    mostrarMsg(msgBackup, dl.mensaje || 'No fue posible descargar el respaldo', 'err');
  }
});

btnRestorePick.addEventListener('click', () => restoreInput.click());
restoreInput.addEventListener('change', () => {
  const f = restoreInput.files[0];
  if (f) {
    restoreFile = f;
    restoreFileName.textContent = f.name;
    restoreFileName.style.color = '#1e293b';
  } else {
    restoreFile = null;
    restoreFileName.textContent = 'Ningún archivo seleccionado';
    restoreFileName.style.color = '';
  }
  mostrarMsg(msgRestore, '', 'ok');
});

document.getElementById('btn-restore').addEventListener('click', () => {
  mostrarMsg(msgRestore, '', 'ok');
  if (!restoreFile) {
    mostrarMsg(msgRestore, 'Debes seleccionar un archivo de respaldo (.backup) antes de restaurar', 'err');
    return;
  }
  accionPendiente = 'restore';
  confirmTitle.textContent = '¿Restaurar respaldo?';
  confirmText.textContent = `Se restaurará el archivo "${restoreFile.name}" (${(restoreFile.size / 1024 / 1024).toFixed(2)} MB). Esta operación crítica requiere confirmación explícita y sobrescribirá los datos actuales.`;
  abrirModal(confirmModal);
});

btnConfirmNo.addEventListener('click', () => {
  cerrarModal(confirmModal);
  accionPendiente = null;
});

btnConfirmYes.addEventListener('click', () => {
  cerrarModal(confirmModal);
  const accion = accionPendiente;
  accionPendiente = null;
  if (accion === 'restore') restaurarRespaldo();
});

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    cerrarModal(confirmModal);
    accionPendiente = null;
  }
});

document.getElementById('btn-cerrar-sesion').addEventListener('click', (e) => {
  e.preventDefault();
  authService.logout();
  window.location.href = 'login.html';
});

initPermisos();
verRespaldos(false);