/**
 * Controlador del perfil profesional del psicólogo (PB-24 HU1-PB24).
 * Conecta los ids de views/perfil_profesional.html con perfilProfesionalService.js:
 *   ver perfil (GET /psicologo/perfil-profesional),
 *   editar con checklist de especialidades (GET /account/catalogos normalizado),
 *   guardar cambios (PUT /psicologo/perfil-profesional).
 * Solo rol Psicólogo.
 */

import { authService } from '../services/authService.js';
import { escaparHtml } from '../services/apiClient.js';
import {
  obtenerPerfilProfesional,
  listarEspecialidades,
  actualizarPerfilProfesional
} from '../services/perfilProfesionalService.js';

const $ = (id) => document.getElementById(id);

// Guard de sesión: solo psicólogo autenticado.
const sesion = authService.getSesion();
if (!sesion) {
  window.location.href = 'login.html';
  throw new Error('Sesión requerida');
}
const rolActual = String(sesion.rol || sesion.tipo_usuario || sessionStorage.getItem('rol') || '').toLowerCase();
if (!rolActual.includes('psicologo')) {
  window.location.href = rolActual.includes('paciente') ? 'panel_paciente.html' : 'inicio.html';
  throw new Error('Solo psicólogos');
}

const peErrores = $('peErrores');
const toast = $('toast');

let perfil = null;        // perfil actual (vista)
let especialidades = [];  // catálogo [{ id, nombre }]

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}

function iniciales(nombre) {
  return String(nombre || '').split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0].toUpperCase()).join('') || '?';
}

function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || '').trim());
}

// ---------- Vista: ver perfil ----------
function renderVer() {
  $('skPerfil').hidden = true;
  $('verDatos').hidden = false;
  $('verAvatar').textContent = iniciales(perfil.nombre);
  $('verNombre').textContent = perfil.nombre || '—';
  $('verCorreoTop').textContent = perfil.correo || '—';
  const esp = Array.isArray(perfil.especialidades) ? perfil.especialidades : [];
  $('verEsp').innerHTML = esp.length
    ? esp.map((e) => '<span>' + escaparHtml(e) + '</span>').join('')
    : '<span class="chip-vacia">Sin especialidad registrada</span>';
  $('verExp').textContent = perfil.añosExperiencia != null ? String(perfil.añosExperiencia) : '—';
  $('verDesc').textContent = perfil.descripcionProfesional ? perfil.descripcionProfesional : '—';
  $('verCont').textContent = perfil.datosContacto ? perfil.datosContacto : '—';
  $('verTarjeta').textContent = perfil.tarjetaProfesionalVerificada
    ? 'Verificada por el administrador'
    : (perfil.tieneTarjetaArchivo ? 'Pendiente de verificación' : 'No registrada');
  show('screenVer');
}

async function cargarPerfil() {
  peErrores.classList.remove('show');
  try {
    perfil = await obtenerPerfilProfesional();
    renderVer();
  } catch (error) {
    $('skPerfil').hidden = true;
    $('verDatos').hidden = false;
    peErrores.textContent = error.message || 'No fue posible cargar el perfil. Intente nuevamente';
    peErrores.classList.add('show');
  }
}

// ---------- Editor ----------
function renderEspecialidades(filtro = '') {
  const lista = $('listaEsp');
  const f = filtro.trim().toLowerCase();
  const marcadas = new Set(Array.isArray(perfil.especialidades) ? perfil.especialidades : []);
  lista.innerHTML = '';
  const items = especialidades.filter((e) => !f || e.nombre.toLowerCase().includes(f));
  if (!items.length) {
    lista.innerHTML = '<div class="checks-vacio">Sin coincidencias. Las nuevas especialidades requieren validación del administrador.</div>';
    return;
  }
  items.forEach((e) => {
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.value = String(e.id);
    check.dataset.especialidad = '1';
    check.checked = marcadas.has(e.nombre);
    label.appendChild(check);
    label.appendChild(document.createTextNode(e.nombre));
    lista.appendChild(label);
  });
}

function rellenarFormulario() {
  $('fExp').value = perfil.añosExperiencia != null ? String(perfil.añosExperiencia) : '';
  $('fDesc').value = perfil.descripcionProfesional || '';
  $('fCont').value = perfil.datosContacto || '';
  $('fCorreo').value = perfil.correo || '';
  $('buscarEsp').value = '';
  $('eCorreo').classList.remove('show');
  $('eForm').classList.remove('show');
  renderEspecialidades('');
}

$('btnEditar').addEventListener('click', async () => {
  peErrores.classList.remove('show');
  try {
    especialidades = await listarEspecialidades();
  } catch (error) {
    if (!especialidades.length) {
      showToast(error.message);
      return;
    }
  }
  rellenarFormulario();
  show('screenEditar');
});

$('buscarEsp').addEventListener('input', (e) => renderEspecialidades(e.target.value));

function especialidadesSeleccionadas() {
  return [...$('listaEsp').querySelectorAll('input:checked')]
    .map((c) => Number(c.value)).filter((n) => Number.isFinite(n) && n > 0);
}

// ---------- Guardar ----------
async function guardar() {
  $('eCorreo').classList.remove('show');
  $('eForm').classList.remove('show');
  const correo = $('fCorreo').value.trim();
  const exp = $('fExp').value;
  const añosExperiencia = exp === '' ? null : Number(exp);

  if (!correoValido(correo)) {
    $('eForm').textContent = 'Ingresa un correo válido';
    $('eForm').classList.add('show');
    return;
  }
  if (añosExperiencia != null && (!Number.isFinite(añosExperiencia) || añosExperiencia < 0)) {
    $('eForm').textContent = 'Los años de experiencia no pueden ser negativos';
    $('eForm').classList.add('show');
    return;
  }

  const payload = {
    añosExperiencia,
    descripcionProfesional: $('fDesc').value.trim() || null,
    datosContacto: $('fCont').value.trim() || null,
    especialidades: especialidadesSeleccionadas(),
    correo
  };

  try {
    const btn = $('btnGuardar');
    btn.disabled = true;
    const r = await actualizarPerfilProfesional(payload);
    showToast(r.mensaje);
    perfil.añosExperiencia = payload.añosExperiencia;
    perfil.descripcionProfesional = payload.descripcionProfesional;
    perfil.datosContacto = payload.datosContacto;
    perfil.correo = payload.correo;
    perfil.especialidades = especialidades
      .filter((e) => payload.especialidades.includes(e.id))
      .map((e) => e.nombre);
    renderVer();
  } catch (error) {
    const mensaje = error.message || 'No fue posible actualizar el perfil. Intente nuevamente';
    if (mensaje.includes('correo') && mensaje.toLowerCase().includes('registrado')) {
      $('eCorreo').textContent = mensaje;
      $('eCorreo').classList.add('show');
    } else {
      $('eForm').textContent = mensaje;
      $('eForm').classList.add('show');
    }
  } finally {
    $('btnGuardar').disabled = false;
  }
}

$('btnGuardar').addEventListener('click', guardar);

$('btnCancelar').addEventListener('click', () => show('screenVer'));

// ---------- Cerrar sesión ----------
$('btn-logout').addEventListener('click', () => {
  if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
  authService.logout();
  sessionStorage.removeItem('es_invitado');
  window.location.href = 'login.html';
});

$('footerAviso').addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Mindzyx no realiza diagnósticos clínicos');
});

// Rellena el badge de rol en el header.
const rolUsuario = document.getElementById('rol-usuario');
if (rolUsuario) rolUsuario.textContent = 'Psicólogo';

// Inicializa la vista.
cargarPerfil();