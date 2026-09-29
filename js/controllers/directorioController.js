/**
 * Controlador del Directorio de psicólogos (views/directorio_psicologos.html).
 * Solo pacientes: tarjetas con nombre, especialidades y pacientes asignados.
 * Si no hay sesión de paciente, redirige a login.html.
 */

import { authService } from '../services/authService.js';
import { obtenerDirectorio } from '../services/psicologoService.js';

const sesion = authService.getSesion();
const rol = String(sesion?.rol || sesion?.tipo_usuario || '').toLowerCase();
if (!sesion || !rol.includes('paciente')) {
  window.location.href = 'login.html';
}

const dirGrid = document.getElementById('dirGrid');
const dirEmpty = document.getElementById('dirEmpty');
const toast = document.getElementById('toast');

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function cargar() {
  const res = await obtenerDirectorio();
  if (!res.ok) {
    showToast(res.error);
    if (dirEmpty) dirEmpty.style.display = 'block';
    return;
  }
  if (!res.data.length) {
    if (dirEmpty) dirEmpty.style.display = 'block';
    return;
  }
  res.data.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'tile tile-dir';
    const tieneEsp = p.especialidades && p.especialidades.length;
    const espHtml = tieneEsp
      ? '<div class="esp-chips">' + p.especialidades.map((e) => '<span>' + escapar(e) + '</span>').join('') + '</div>'
      : '<p class="esp-none">Sin especialidad registrada</p>';
    card.innerHTML =
      '<div class="tile-icon" aria-hidden="true">🧑‍⚕️</div>' +
      '<h3>' + escapar(p.nombre) + '</h3>' +
      espHtml +
      '<p class="dir-count">' + p.pacientesAsignados + ' paciente(s) asignado(s)</p>';
    dirGrid.appendChild(card);
  });
}

if (sesion) {
  cargar();
}
