/**
 * Controlador de la vista de Pacientes Autorizados y Registros (views/pacientes_autorizados.html).
 * PB-18 HU1-PB18: Permite al psicólogo consultar pacientes autorizados,
 * visualizar su historial cronológico con filtros y ver el detalle clínico de cada registro.
 */

import { authService } from '../services/authService.js';
import { psicologoRegistrosService } from '../services/psicologoRegistrosService.js';
import { postJson } from '../services/apiClient.js';

// 1. Verificación obligatoria de sesión y rol de Psicólogo
const sesion = authService.getSesion();
const rol = String(sesion?.rol || sesion?.tipo_usuario || '').toLowerCase();
if (!sesion || !rol.includes('psicologo')) {
  window.location.href = 'login.html';
}

// 2. Elementos del DOM
const screenPacientes = document.getElementById('screenPacientes');
const screenRegistros = document.getElementById('screenRegistros');
const screenDetalle = document.getElementById('screenDetalle');

// Pantalla 1: Pacientes
const buscarPac = document.getElementById('buscarPac');
const tablaPac = document.getElementById('tablaPac');
const sinPac = document.getElementById('sinPac');

// Pantalla 2: Registros
const regTitulo = document.getElementById('regTitulo');
const fDesde = document.getElementById('fDesde');
const fHasta = document.getElementById('fHasta');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const listaReg = document.getElementById('listaReg');
const btnVolverPac = document.getElementById('btnVolverPac');

// Pantalla 3: Detalle
const detMeta = document.getElementById('detMeta');
const detValor = document.getElementById('detValor');
const detNota = document.getElementById('detNota');
const detQuiz = document.getElementById('detQuiz');
const detObs = document.getElementById('detObs');
const btnVolverReg = document.getElementById('btnVolverReg');
const btnAgregarObs = document.getElementById('btnAgregarObs');

// Modal Observación (PB-18 / PB-19)
const obsModal = document.getElementById('obsModal');
const obsReg = document.getElementById('obsReg');
const obsText = document.getElementById('obsText');
const eObs = document.getElementById('eObs');
const obsCancel = document.getElementById('obsCancel');
const obsSave = document.getElementById('obsSave');

// Controles Globales
const toast = document.getElementById('toast');
const btnLogout = document.getElementById('btn-logout');
const btnVolverPanel = document.getElementById('btnVolverPanel');
const footerAviso = document.getElementById('footerAviso');

// 3. Estado local
let listaPacientes = [];
let pacienteSeleccionado = null;
let listaRegistrosActual = [];
let idRegistroSeleccionado = null;
let debounceBuscar = null;

/**
 * Muestra notificación flotante
 */
function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/**
 * Escapado seguro contra XSS
 */
function escaparHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/**
 * Formatea fechas ISO a formato legible
 */
function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return String(fechaStr);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  } catch {
    return String(fechaStr);
  }
}

/**
 * Determina clase CSS para nivel de riesgo / estado
 */
function nivelClase(valor, nivel, puntaje) {
  const v = String(nivel || valor || puntaje || '').toLowerCase();
  if (v.includes('alto') || v.includes('1') || v.includes('2')) return 'n-alto';
  if (v.includes('medio') || v.includes('3')) return 'n-medio';
  return 'n-bajo';
}

/**
 * Alterna la pantalla visible
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// -------------------------------------------------------------
// PANTALLA 1: LISTADO DE PACIENTES AUTORIZADOS
// -------------------------------------------------------------

function renderPacientes(filtro = '') {
  if (!tablaPac || !sinPac) return;
  tablaPac.innerHTML = '';

  const q = filtro.trim().toLowerCase();
  const items = listaPacientes.filter((p) => p.nombre.toLowerCase().includes(q));

  if (items.length === 0) {
    sinPac.style.display = 'block';
    return;
  }

  sinPac.style.display = 'none';

  let html = `
    <table>
      <thead>
        <tr>
          <th>Nombre del Paciente</th>
          <th>Estado de Acceso</th>
          <th style="text-align: right;">Acción</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((p) => {
    html += `
      <tr>
        <td><b>${escaparHtml(p.nombre)}</b></td>
        <td><span class="nivel n-bajo">Autorizado</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-sec" data-pac="${p.id}">
            Ver registros
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  tablaPac.innerHTML = html;

  // Asignar listeners a los botones de registros
  tablaPac.querySelectorAll('[data-pac]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idPac = Number(btn.getAttribute('data-pac'));
      const pac = listaPacientes.find((x) => x.id === idPac);
      if (pac) abrirRegistros(pac);
    });
  });
}

async function cargarPacientes(q = '') {
  try {
    const res = await psicologoRegistrosService.obtenerPacientes(q);
    if (res.ok) {
      listaPacientes = res.data || [];
      renderPacientes(buscarPac ? buscarPac.value : '');
    } else {
      console.warn('[HU1-PB18] Error al cargar pacientes:', res.error);
      tablaPac.innerHTML = '';
      sinPac.style.display = 'block';
      showToast(res.error || 'No fue posible cargar los pacientes.');
    }
  } catch (err) {
    console.error('[HU1-PB18] Excepción al cargar pacientes:', err);
    tablaPac.innerHTML = '';
    sinPac.style.display = 'block';
    showToast('Error de conexión al cargar pacientes.');
  }
}

// -------------------------------------------------------------
// PANTALLA 2: REGISTROS DEL PACIENTE
// -------------------------------------------------------------

async function abrirRegistros(paciente) {
  pacienteSeleccionado = paciente;
  if (regTitulo) {
    regTitulo.textContent = `Registros de ${paciente.nombre}`;
  }

  if (fDesde) fDesde.value = '';
  if (fHasta) fHasta.value = '';

  showScreen('screenRegistros');
  await cargarRegistrosPaciente();
}

async function cargarRegistrosPaciente() {
  if (!pacienteSeleccionado || !listaReg) return;

  const desde = fDesde ? fDesde.value : '';
  const hasta = fHasta ? fHasta.value : '';

  if (desde && hasta && desde > hasta) {
    showToast('La fecha "Desde" no puede ser posterior a "Hasta".');
    return;
  }

  // Skeletons mientras carga
  listaReg.innerHTML = `
    <div class="sk-card fila-sk">
      <div style="flex:1;">
        <div class="sk sk-line" style="width:50%;height:14px;margin-bottom:6px;"></div>
        <div class="sk sk-line" style="width:30%;height:12px;"></div>
      </div>
      <div class="sk" style="width:80px;height:24px;border-radius:20px;"></div>
      <div class="sk" style="width:90px;height:38px;border-radius:18px;"></div>
    </div>
  `;

  try {
    const res = await psicologoRegistrosService.obtenerRegistrosPaciente(
      pacienteSeleccionado.id,
      desde,
      hasta
    );

    if (res.ok) {
      listaRegistrosActual = res.data || [];
      renderRegistros();
    } else {
      listaReg.innerHTML = `<div class="empty">${escaparHtml(res.error || 'Sin registros en el rango seleccionado.')}</div>`;
      showToast(res.error || 'No fue posible obtener los registros.');
    }
  } catch (err) {
    console.error('[HU1-PB18] Excepción al cargar registros:', err);
    listaReg.innerHTML = '<div class="empty">Error de conexión al consultar registros.</div>';
  }
}

function renderRegistros() {
  if (!listaReg) return;
  listaReg.innerHTML = '';

  if (listaRegistrosActual.length === 0) {
    listaReg.innerHTML = '<div class="empty">Sin registros en el rango seleccionado.</div>';
    return;
  }

  listaRegistrosActual.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'fila-rec';

    const fechaFmt = formatearFecha(r.fecha);
    const tipoTexto = r.tipo === 'Cuestionario' ? 'Cuestionario' : 'Registro emocional';
    const nivelLabel = r.nivel || (r.puntaje != null ? `${r.puntaje} / 5` : 'Normal');

    div.innerHTML = `
      <div class="info">
        <b>${escaparHtml(fechaFmt)}</b>
        <small>${escaparHtml(tipoTexto)}${r.cuestionario ? ` · ${escaparHtml(r.cuestionario)}` : ''}</small>
      </div>
      <span class="nivel ${nivelClase(r.resumen, r.nivel, r.puntaje)}">
        ${escaparHtml(nivelLabel)}
      </span>
      <button type="button" class="btn btn-sec" data-det="${r.id}">
        Ver detalle
      </button>
    `;

    listaReg.appendChild(div);
  });

  // Listeners a los botones de detalle
  listaReg.querySelectorAll('[data-det]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idReg = Number(btn.getAttribute('data-det'));
      abrirDetalle(idReg);
    });
  });
}

// -------------------------------------------------------------
// PANTALLA 3: DETALLE DEL REGISTRO
// -------------------------------------------------------------

async function abrirDetalle(idEvento) {
  idRegistroSeleccionado = idEvento;
  showScreen('screenDetalle');

  if (detMeta) detMeta.textContent = 'Cargando detalle del registro...';
  if (detValor) detValor.textContent = '...';
  if (detNota) detNota.textContent = '...';
  if (detQuiz) detQuiz.textContent = '...';
  if (detObs) detObs.innerHTML = '<div class="empty">Cargando observaciones...</div>';

  try {
    const res = await psicologoRegistrosService.obtenerDetalleRegistro(idEvento);
    if (res.ok && res.data) {
      const d = res.data;
      const fechaFmt = formatearFecha(d.fecha);
      const tipoTexto = d.tipo === 'Cuestionario' ? 'Cuestionario' : 'Registro Emocional';

      if (detMeta) {
        detMeta.textContent = `${fechaFmt} · ${tipoTexto}${pacienteSeleccionado ? ` · ${pacienteSeleccionado.nombre}` : ''}`;
      }

      if (detValor) {
        if (d.tipo === 'Cuestionario') {
          detValor.textContent = `Nivel: ${d.nivel || 'No especificado'}${d.puntaje != null ? ` (Puntaje: ${d.puntaje})` : ''}`;
        } else {
          detValor.textContent = d.puntaje != null
            ? `${d.puntaje} / 5${d.nivel ? ` (${d.nivel})` : ''}`
            : (d.nivel || 'Registrado');
        }
      }

      if (detNota) {
        detNota.textContent = d.nota && d.nota.trim()
          ? d.nota
          : 'Sin nota registrada por el paciente.';
      }

      if (detQuiz) {
        if (d.cuestionario) {
          let extra = '';
          if (d.respuestas && d.respuestas.length > 0) {
            extra = ` · ${d.respuestas.length} respuesta(s) registradas`;
          }
          detQuiz.textContent = `${d.cuestionario}${extra}`;
        } else {
          detQuiz.textContent = 'No aplica.';
        }
      }

      // Observaciones clínicas
      if (detObs) {
        detObs.innerHTML = '';
        if (d.observaciones && d.observaciones.length > 0) {
          d.observaciones.forEach((o) => {
            const item = document.createElement('div');
            item.className = 'obs';
            const firma = o.firma ? ` · ${o.firma}` : '';
            const fObs = formatearFecha(o.fecha);
            item.innerHTML = `
              ${escaparHtml(o.contenido)}
              <small>${escaparHtml(fObs)}${escaparHtml(firma)}</small>
            `;
            detObs.appendChild(item);
          });
        } else {
          detObs.innerHTML = '<div class="empty">Sin observaciones clínicas registradas para este evento.</div>';
        }
      }

      // Cargar opciones en el select del modal de observaciones
      if (obsReg) {
        obsReg.innerHTML = listaRegistrosActual
          .map((r) => `<option value="${r.id}" ${r.id === idEvento ? 'selected' : ''}>${escaparHtml(formatearFecha(r.fecha))} - ${escaparHtml(r.tipo)}</option>`)
          .join('');
      }
    } else {
      showToast(res.error || 'No fue posible cargar el detalle del registro.');
      if (detMeta) detMeta.textContent = 'Error al cargar detalle.';
    }
  } catch (err) {
    console.error('[HU1-PB18] Excepción al obtener detalle de registro:', err);
    showToast('Error de conexión al cargar detalle del registro.');
  }
}

// -------------------------------------------------------------
// MODAL DE OBSERVACIÓN CLÍNICA (PB-18 / PB-19)
// -------------------------------------------------------------

function abrirModalObs() {
  if (!obsModal) return;
  if (obsText) obsText.value = '';
  if (eObs) eObs.classList.remove('show');
  if (obsSave) {
    obsSave.disabled = false;
    obsSave.textContent = 'Guardar observación';
  }
  obsModal.classList.add('open');
  obsModal.setAttribute('aria-hidden', 'false');
  if (obsText) obsText.focus();
}

function cerrarModalObs() {
  if (!obsModal) return;
  obsModal.classList.remove('open');
  obsModal.setAttribute('aria-hidden', 'true');
}

async function guardarObservacion() {
  const contenido = obsText ? obsText.value.trim() : '';
  if (!contenido) {
    if (eObs) eObs.classList.add('show');
    return;
  }

  if (eObs) eObs.classList.remove('show');
  if (!pacienteSeleccionado) return;

  const idEventoTarget = obsReg ? Number(obsReg.value) : idRegistroSeleccionado;

  if (obsSave) {
    obsSave.disabled = true;
    obsSave.textContent = 'Guardando...';
  }

  try {
    const res = await postJson('/observaciones', {
      idPaciente: pacienteSeleccionado.id,
      idEvento: idEventoTarget || null,
      contenido: contenido
    });

    if (res.ok) {
      cerrarModalObs();
      showToast('Observación guardada correctamente');
      if (idEventoTarget) {
        await abrirDetalle(idEventoTarget);
      }
    } else {
      showToast(res.error || 'No fue posible guardar la observación.');
      if (obsSave) {
        obsSave.disabled = false;
        obsSave.textContent = 'Guardar observación';
      }
    }
  } catch (err) {
    console.error('[HU1-PB18] Excepción al guardar observación:', err);
    showToast('Ocurrió un error al guardar la observación.');
    if (obsSave) {
      obsSave.disabled = false;
      obsSave.textContent = 'Guardar observación';
    }
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS GLOBALES
// -------------------------------------------------------------

// Buscador de pacientes
if (buscarPac) {
  buscarPac.addEventListener('input', (e) => {
    const q = e.target.value;
    renderPacientes(q);

    clearTimeout(debounceBuscar);
    debounceBuscar = setTimeout(() => {
      cargarPacientes(q);
    }, 400);
  });
}

// Filtros de fecha
if (btnFiltrar) {
  btnFiltrar.addEventListener('click', cargarRegistrosPaciente);
}

if (btnLimpiarFiltros) {
  btnLimpiarFiltros.addEventListener('click', () => {
    if (fDesde) fDesde.value = '';
    if (fHasta) fHasta.value = '';
    cargarRegistrosPaciente();
  });
}

// Botones de retroceso entre pantallas
if (btnVolverPac) {
  btnVolverPac.addEventListener('click', () => {
    showScreen('screenPacientes');
  });
}

if (btnVolverReg) {
  btnVolverReg.addEventListener('click', () => {
    showScreen('screenRegistros');
  });
}

if (btnVolverPanel) {
  btnVolverPanel.addEventListener('click', (e) => {
    e.preventDefault();
    if (screenPacientes && !screenPacientes.classList.contains('active')) {
      showScreen('screenPacientes');
    } else {
      window.location.href = 'inicio.html';
    }
  });
}

// Observación Modal
if (btnAgregarObs) {
  btnAgregarObs.addEventListener('click', abrirModalObs);
}
if (obsCancel) {
  obsCancel.addEventListener('click', cerrarModalObs);
}
if (obsSave) {
  obsSave.addEventListener('click', guardarObservacion);
}
if (obsModal) {
  obsModal.addEventListener('click', (e) => {
    if (e.target === obsModal) cerrarModalObs();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && obsModal?.classList.contains('open')) {
    cerrarModalObs();
  }
});

// Cierre de sesión
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
      authService.logout();
      window.location.href = 'login.html';
    }
  });
}

// Aviso footer
if (footerAviso) {
  footerAviso.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Mindzyxs no realiza diagnósticos clínicos.');
  });
}

// Inicializar carga de pacientes al montar el módulo
cargarPacientes();
