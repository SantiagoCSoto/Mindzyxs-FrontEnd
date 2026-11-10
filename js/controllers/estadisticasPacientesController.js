/**
 * Controlador de estadísticas de pacientes autorizados (PB-23 HU1-PB23).
 * Conecta los ids de views/estadisticas_pacientes.html con estadisticasPacientesService.js:
 *   selector de pacientes autorizados (GET /progreso/pacientes),
 *   generar estadísticas (GET /progreso/{idPaciente}?desde=&hasta=) con KPIs,
 *   barras por semana/mes y distribución por niveles.
 * Solo rol Psicólogo.
 */

import { authService } from '../services/authService.js';
import { listarPacientesAutorizados, obtenerEstadisticas } from '../services/estadisticasPacientesService.js';

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

const selPac = $('selPac');
const skSelPac = $('skSelPac');
const fDesde = $('fDesde');
const fHasta = $('fHasta');
const btnGenerar = $('btnGenerar');
const errStats = $('errStats');
const vacioPac = $('vacioPac');
const sinDatos = $('sinDatos');
const resultados = $('resultados');
const skResultados = $('skResultados');
const toast = $('toast');

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function ocultarErrores() {
  errStats.classList.remove('show');
}

function mostrarSkeleton() {
  skSelPac.hidden = false;
  skResultados.hidden = false;
}

function limpiarSkeleton() {
  skSelPac.hidden = true;
  skResultados.hidden = true;
}

function mostrarResultado(visible) {
  resultados.hidden = !visible;
  sinDatos.hidden = visible;
}

// ---------- Selector de pacientes ----------
async function cargarPacientes() {
  limpiarErroresYEstados();
  mostrarSkeleton();
  try {
    const pacientes = await listarPacientesAutorizados();
    selPac.hidden = false;
    selPac.innerHTML = '<option value="">Seleccione un paciente</option>';
    if (!pacientes.length) {
      vacioPac.hidden = false;
      btnGenerar.disabled = true;
      return;
    }
    pacientes.forEach((p) => {
      const o = document.createElement('option');
      o.value = String(p.id);
      o.textContent = p.nombre;
      selPac.appendChild(o);
    });
    fDesde.disabled = false;
    fHasta.disabled = false;
    btnGenerar.disabled = false;
  } catch (error) {
    selPac.hidden = false;
    selPac.innerHTML = '';
    btnGenerar.disabled = true;
    errStats.textContent = error.message || 'No fue posible cargar tus pacientes. Intente nuevamente';
    errStats.classList.add('show');
  } finally {
    limpiarSkeleton();
  }
}

function limpiarErroresYEstados() {
  errStats.classList.remove('show');
  vacioPac.hidden = true;
}

selPac.addEventListener('change', () => {
  ocultarErrores();
  mostrarResultado(false);
});

// ---------- Generar estadísticas ----------
function etiquetaCorta(fecha) {
  // aaaa-MM-dd -> dd/mm ; aaaa-MM -> mm/aaaa
  const partes = String(fecha || '').split('-');
  if (partes.length >= 3) return partes[2] + '/' + partes[1];
  if (partes.length === 2) return partes[1] + '/' + partes[0];
  return String(fecha || '');
}

function pintarBarras(contenedor, items, prefijo) {
  contenedor.innerHTML = '';
  const max = Math.max(...items.map((s) => Number(s.registros) || 0), 1);
  items.forEach((s, i) => {
    const valor = Number(s.registros) || 0;
    const etiqueta = etiquetaCorta(s.semana || s.mes);
    const barra = document.createElement('div');
    barra.className = 'barra';
    barra.style.height = Math.max(Math.round((valor / max) * 100), 8) + '%';
    barra.setAttribute('aria-label', etiqueta + ': ' + valor + ' registro(s)');
    const et = document.createElement('span');
    et.textContent = prefijo + (i + 1);
    et.setAttribute('aria-hidden', 'true');
    barra.appendChild(et);
    contenedor.appendChild(barra);
  });
  contenedor.style.display = 'flex';
}

function pintarDistribucion(distribucion) {
  const body = $('distBody');
  body.innerHTML = '';
  const claves = ['Bajo', 'Medio', 'Alto'];
  claves.forEach((nivel) => {
    const cantidad = distribucion ? Number(distribucion[nivel]) || 0 : 0;
    if (!cantidad) return;
    const tr = document.createElement('tr');
    const tdN = document.createElement('td');
    tdN.textContent = nivel;
    const tdC = document.createElement('td');
    tdC.textContent = String(cantidad);
    tr.appendChild(tdN);
    tr.appendChild(tdC);
    body.appendChild(tr);
  });
  if (!body.hasChildNodes()) {
    body.innerHTML = '<tr><td colspan="2">Sin registros por nivel.</td></tr>';
  }
}

function renderEstadisticas(data) {
  $('kProm').textContent = data.promedio != null ? Number(data.promedio).toFixed(1) : '—';
  $('kTend').textContent = data.tendencia || 'Estable';
  $('kReg').textContent = String(data.totalRegistros ?? 0);
  $('kNiv').textContent = data.nivelFrecuente || '—';
  pintarBarras($('barrasSemana'), Array.isArray(data.porSemana) ? data.porSemana : [], 'S');
  pintarBarras($('barrasMes'), Array.isArray(data.porMes) ? data.porMes : [], 'M');
  pintarDistribucion(data.distribucion);
}

async function generar() {
  ocultarErrores();
  const id = Number(selPac.value);
  if (!id) {
    errStats.textContent = 'Seleccione un paciente';
    errStats.classList.add('show');
    return;
  }
  const desde = fDesde.value;
  const hasta = fHasta.value;
  if (desde && hasta && desde > hasta) {
    errStats.textContent = 'La fecha inicial no puede ser posterior a la final.';
    errStats.classList.add('show');
    return;
  }
  mostrarResultado(false);
  limpiarSkeleton();
  skResultados.hidden = false;
  btnGenerar.disabled = true;
  try {
    const data = await obtenerEstadisticas(id, desde, hasta);
    if (data.suficientes === false) {
      limpiarSkeleton();
      mostrarResultado(false);
      return;
    }
    limpiarSkeleton();
    renderEstadisticas(data);
    mostrarResultado(true);
    vacioPac.hidden = true;
  } catch (error) {
    limpiarSkeleton();
    errStats.textContent = error.message || 'No fue posible cargar las estadísticas. Intente nuevamente';
    errStats.classList.add('show');
    mostrarResultado(false);
  } finally {
    btnGenerar.disabled = false;
  }
}

$('btnGenerar').addEventListener('click', generar);

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

// Inicializa el selector de pacientes.
cargarPacientes();