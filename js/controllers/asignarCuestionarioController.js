/**
 * Controlador de asignación de cuestionarios a pacientes (PB-22 HU1-PB22).
 * Conecta los ids de views/asignar_cuestionario.html con asignarCuestionarioService.js:
 *   lista de cuestionarios publicados (GET /psicologo/cuestionarios?q= filtrado),
 *   pantalla de asignación (GET /psicologo/cuestionarios/{id}/asignar),
 *   registrar asignación (POST /psicologo/cuestionarios/{id}/asignar).
 * Solo rol Psicólogo.
 */

import { authService } from '../services/authService.js';
import { listarCuestionarios } from '../services/misCuestionariosService.js';
import { obtenerPantallaAsignacion, asignarCuestionario } from '../services/asignarCuestionarioService.js';

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

const listaC = $('listaC');
const listaPac = $('listaPac');
const eSel = $('eSel');
const btnAsignar = $('btnAsignar');
const toast = $('toast');

let actualId = null; // cuestionario en curso de asignación

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

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pintarSkeleton(contenedor) {
  contenedor.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('div');
    d.className = 'sk sk-card';
    d.setAttribute('aria-hidden', 'true');
    contenedor.appendChild(d);
  }
}

function pintarVacio(contenedor, mensaje) {
  contenedor.innerHTML = '<div class="empty">' + escapar(mensaje) + '</div>';
}

// ---------- Pantalla lista: cuestionarios publicados ----------
function renderLista(items) {
  listaC.innerHTML = '';
  if (!items.length) {
    pintarVacio(listaC, 'No tiene cuestionarios publicados. Publique un cuestionario desde "Mis cuestionarios".');
    return;
  }
  items.forEach((c) => {
    const d = document.createElement('div');
    d.className = 'lista-item';
    d.innerHTML =
      '<div class="info"><b>' + escapar(c.titulo) + '</b>' +
      '<small>' + Number(c.numPreguntas ?? 0) + ' pregunta(s)</small></div>' +
      '<span class="est est-p">Publicado</span>';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-cancel btn-sm';
    b.textContent = 'Asignar';
    b.addEventListener('click', () => abrirAsignacion(c.id));
    d.appendChild(b);
    listaC.appendChild(d);
  });
}

async function cargarLista() {
  pintarSkeleton(listaC);
  try {
    const items = await listarCuestionarios('');
    // Para asignar solo interesan los cuestionarios publicados.
    renderLista(items.filter((c) => c.estado === 'Publicado'));
  } catch (error) {
    listaC.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'err-msg show';
    err.textContent = error.message || 'No fue posible cargar los cuestionarios. Intente nuevamente';
    listaC.appendChild(err);
  }
}

// ---------- Pantalla asignación ----------
async function abrirAsignacion(id) {
  actualId = id;
  listaPac.innerHTML = '';
  eSel.classList.remove('show');
  btnAsignar.disabled = false;
  pintarSkeleton(listaPac);
  try {
    const data = await obtenerPantallaAsignacion(id);
    $('asigTitulo').textContent = 'Asignar: ' + (data.titulo || 'Cuestionario');
    renderPacientes(Array.isArray(data.pacientes) ? data.pacientes : []);
    show('screenAsignar');
  } catch (error) {
    showToast(error.message);
    await cargarLista();
    show('screenLista');
  }
}

function renderPacientes(pacientes) {
  listaPac.innerHTML = '';
  if (!pacientes.length) {
    pintarVacio(listaPac, 'Aún no tiene pacientes autorizados para asignar este cuestionario.');
    btnAsignar.disabled = true;
    return;
  }
  let seleccionables = 0;
  pacientes.forEach((p) => {
    const l = document.createElement('label');
    l.className = 'fila-check' + (p.yaAsignado ? ' disabled' : '');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = String(p.id);
    input.disabled = !!p.yaAsignado;
    if (p.yaAsignado) input.setAttribute('aria-label', p.nombre + ' (ya asignado, no disponible)');
    else seleccionables += 1;
    l.appendChild(input);
    const span = document.createElement('span');
    span.innerHTML = '<b>' + escapar(p.nombre) + '</b>' +
      (p.yaAsignado ? '<small>Ya tiene este cuestionario asignado</small>' : '');
    l.appendChild(span);
    listaPac.appendChild(l);
  });
  // Si todos los pacientes ya tienen el cuestionario, no hay nada que marcar.
  btnAsignar.disabled = seleccionables === 0;
}

btnAsignar.addEventListener('click', async () => {
  const checked = Array.from(listaPac.querySelectorAll('input[type="checkbox"]:checked')).map((i) => Number(i.value));
  if (!checked.length) {
    eSel.textContent = 'Debes seleccionar al menos un paciente';
    eSel.classList.add('show');
    return;
  }
  eSel.classList.remove('show');
  btnAsignar.disabled = true;
  try {
    const r = await asignarCuestionario(actualId, checked);
    showToast(r.mensaje);
    actualId = null;
    await cargarLista();
    show('screenLista');
  } catch (error) {
    showToast(error.message);
    btnAsignar.disabled = false;
  }
});

$('btnVolver').addEventListener('click', () => {
  actualId = null;
  eSel.classList.remove('show');
  show('screenLista');
});

// La lista de publicados siempre se carga (para "Volver" tras entrar con ?id=).
cargarLista();

// Si viene con ?id= se abre directamente esa asignación (enlace desde Mis cuestionarios).
const parametroId = new URLSearchParams(window.location.search).get('id');
if (parametroId && /^\d+$/.test(parametroId)) {
  abrirAsignacion(Number(parametroId));
}

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