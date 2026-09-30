/**
 * Controlador de la Vista de Progreso Emocional (views/progreso_emocional.html)
 * Historia de Usuario: HU1-PB14 (Progreso emocional del paciente - Rol Psicólogo)
 * 
 * Gestiona:
 *  - Verificación de sesión y rol exclusivo de Psicólogo
 *  - Carga dinámica del selector de pacientes autorizados (GET /api/progreso/pacientes)
 *  - Filtro por rango de fechas (Desde / Hasta) y validación de orden cronológico
 *  - Renderizado dinámico de gráfico vectorial SVG de progreso emocional (escala 1 a 5)
 *  - Cálculo y actualización de KPIs: Promedio, Tendencia y Total de registros
 *  - Manejo de estados:
 *      * Sin datos suficientes (< 2 registros o suficientes === false)
 *      * Paciente no autorizado (403 Forbidden)
 *      * Sin pacientes autorizados asignados
 *  - Interacción con Modal aclaratorio (PB-04), avisos toast y cierre de sesión
 */

import { authService } from '../services/authService.js';
import { progresoService } from '../services/progresoService.js';
import { avisoService } from '../services/avisoService.js';

// Elementos de encabezado y sesión
const btnLogout = document.getElementById('btn-logout');

// Elementos de controles y filtros
const controlsRow = document.getElementById('controlsRow');
const patientSel = document.getElementById('patientSel');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const applyBtn = document.getElementById('applyBtn');

// Elementos del gráfico y estadísticas
const chartBox = document.getElementById('chartBox');
const chartTitle = document.getElementById('chartTitle');
const chartRange = document.getElementById('chartRange');
const chartSvg = document.getElementById('chart');
const statAvg = document.getElementById('statAvg');
const statTrend = document.getElementById('statTrend');
const statCount = document.getElementById('statCount');

// Estados especiales
const emptyState = document.getElementById('emptyState');
const blockedState = document.getElementById('blockedState');
const noPatientsState = document.getElementById('noPatientsState');
const btnRestablecerFiltros = document.getElementById('btnRestablecerFiltros');
const solBtn = document.getElementById('solBtn');

// Aviso modal (PB-04) y toast
const footerAviso = document.getElementById('footerAviso');
const avisoModal = document.getElementById('avisoModal');
const btnCerrar = document.getElementById('btnCerrar');
const btnEntendido = document.getElementById('btnEntendido');
const toast = document.getElementById('toast');

// Estado interno
let pacientesLista = [];
let pacienteActualId = null;

/**
 * Escapa texto plano para evitar inyección en HTML
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
 * Muestra una notificación flotante (toast)
 * @param {string} mensaje 
 */
function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/**
 * Valida la sesión activa y el rol del usuario
 */
function verificarAccesoPsicologo() {
  const sesion = authService.getSesion();

  if (sesion) {
    const rol = (sesion.rol || sesion.tipo_usuario || '').toLowerCase();
    const esPsicologo = rol.includes('psicolog') || rol.includes('admin');

    if (!esPsicologo) {
      progresoService.logAuditoria('Acceso bloqueado: usuario no tiene rol de psicólogo', rol);
      alert('Esta sección está reservada exclusivamente para profesionales con rol de Psicólogo.');
      window.location.href = 'inicio.html';
      return false;
    }
  }

  return true;
}

/**
 * Establece el rango de fechas inicial predeterminado (mes actual)
 */
function inicializarFechas() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');

  if (dateFrom && !dateFrom.value) {
    dateFrom.value = `${yyyy}-${mm}-01`;
  }
  if (dateTo && !dateTo.value) {
    dateTo.value = `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Oculta todos los paneles de resultado y estados especiales
 */
function ocultarTodosLosEstados() {
  if (chartBox) chartBox.style.display = 'none';
  if (emptyState) {
    emptyState.style.display = 'none';
    emptyState.classList.remove('show');
  }
  if (blockedState) {
    blockedState.style.display = 'none';
    blockedState.classList.remove('show');
  }
  if (noPatientsState) {
    noPatientsState.style.display = 'none';
    noPatientsState.classList.remove('show');
  }
}

/**
 * Carga el catálogo de pacientes autorizados asignados al psicólogo
 */
async function cargarPacientes() {
  if (patientSel) {
    patientSel.innerHTML = '<option value="" disabled selected>Cargando pacientes...</option>';
    patientSel.disabled = true;
  }

  const res = await progresoService.obtenerPacientesAutorizados();

  if (res.noSesion) {
    window.location.href = 'login.html';
    return;
  }
  if (!res.exito || !res.data || res.data.length === 0) {
    ocultarTodosLosEstados();
    if (noPatientsState) {
      noPatientsState.style.display = 'block';
      noPatientsState.classList.add('show');
    }
    if (patientSel) {
      patientSel.innerHTML = '<option value="" disabled selected>Sin pacientes autorizados</option>';
      patientSel.disabled = true;
    }
    if (applyBtn) applyBtn.disabled = true;
    if (dateFrom) dateFrom.disabled = true;
    if (dateTo) dateTo.disabled = true;
    return;
  }

  pacientesLista = res.data;

  if (patientSel) {
    patientSel.disabled = false;
    patientSel.innerHTML = pacientesLista.map(p => 
      `<option value="${p.id}">${escaparHtml(p.nombre)}</option>`
    ).join('');

    pacienteActualId = pacientesLista[0].id;
    patientSel.value = pacienteActualId;
  }

  if (applyBtn) applyBtn.disabled = false;
  if (dateFrom) dateFrom.disabled = false;
  if (dateTo) dateTo.disabled = false;

  await cargarProgreso();
}

/**
 * Consulta y renderiza el progreso emocional del paciente seleccionado
 */
async function cargarProgreso() {
  const idPaciente = patientSel?.value || pacienteActualId;
  if (!idPaciente) return;

  pacienteActualId = idPaciente;
  const pacienteObj = pacientesLista.find(p => String(p.id) === String(idPaciente));
  const nombrePaciente = pacienteObj ? pacienteObj.nombre : `Paciente #${idPaciente}`;

  const desde = dateFrom?.value || null;
  const hasta = dateTo?.value || null;

  if (chartTitle) chartTitle.textContent = 'Cargando datos...';
  if (chartRange) chartRange.textContent = 'Consultando registros...';

  const res = await progresoService.obtenerProgresoPaciente(idPaciente, desde, hasta);

  // Caso 1: Paciente no autorizado (403 Forbidden)
  if (res.noAutorizado || res.status === 403) {
    ocultarTodosLosEstados();
    if (blockedState) {
      blockedState.style.display = 'block';
      blockedState.classList.add('show');
    }
    showToast('No tienes autorización para ver los registros de este paciente.');
    return;
  }

  // Caso 2: Error general de servicio
  if (!res.exito || !res.data) {
    ocultarTodosLosEstados();
    showToast(res.mensaje || 'Error al consultar el progreso emocional.');
    return;
  }

  const datos = res.data;
  const serie = datos.serie || [];
  const suficientes = datos.suficientes && serie.length >= 2;

  // Caso 3: Sin registros suficientes (< 2 registros)
  if (!suficientes) {
    ocultarTodosLosEstados();
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.classList.add('show');
    }
    progresoService.logAuditoria('Datos insuficientes para graficar:', `${serie.length} registros`);
    return;
  }

  // Caso 4: Registros suficientes para graficar y calcular KPIs
  ocultarTodosLosEstados();
  if (chartBox) chartBox.style.display = 'block';

  actualizarEncabezadoGrafico(nombrePaciente, serie, datos.totalRegistros);
  actualizarKpis(datos);
  renderizarGraficoSVG(serie);

  progresoService.logAuditoria('Gráfico renderizado exitosamente para:', nombrePaciente);
}

/**
 * Actualiza los títulos y el rango del gráfico
 */
function actualizarEncabezadoGrafico(nombrePaciente, serie, totalRegistros) {
  if (chartTitle) {
    chartTitle.textContent = `Evolución de ${nombrePaciente}`;
  }

  if (chartRange) {
    if (serie.length >= 2) {
      const fInicio = serie[0].fechaCorta || serie[0].fecha;
      const fFin = serie[serie.length - 1].fechaCorta || serie[serie.length - 1].fecha;
      chartRange.textContent = `${fInicio} – ${fFin} · ${totalRegistros} registro(s)`;
    } else {
      chartRange.textContent = `${totalRegistros} registro(s)`;
    }
  }
}

/**
 * Actualiza las tarjetas KPI de Promedio, Tendencia y Total de registros
 */
function actualizarKpis(datos) {
  // Promedio
  if (statAvg) {
    statAvg.textContent = datos.promedio !== null ? `${datos.promedio} / 5` : '-';
  }

  // Tendencia
  if (statTrend) {
    const tendenciaTexto = datos.tendencia || '→ Estable';
    statTrend.textContent = tendenciaTexto;

    if (tendenciaTexto.includes('Mejorando')) {
      statTrend.style.color = '#1BBF6B';
    } else if (tendenciaTexto.includes('Bajando')) {
      statTrend.style.color = '#E85D7A';
    } else {
      statTrend.style.color = '#6B5BCE';
    }
  }

  // Registros
  if (statCount) {
    statCount.textContent = `${datos.totalRegistros} en el rango`;
  }
}

/**
 * Dibuja el gráfico SVG interactivo con escala de 1 a 5
 * @param {Array} serie - Array de objetos { fecha, fechaCorta, puntaje, nivel }
 */
function renderizarGraficoSVG(serie) {
  if (!chartSvg) return;

  const W = 620;
  const H = 280;
  const padLeft = 44;
  const padRight = 20;
  const padTop = 24;
  const padBottom = 48;
  const chartW = W - padLeft - padRight; // 556
  const chartH = H - padTop - padBottom; // 208

  const n = serie.length;
  if (n < 2) {
    chartSvg.innerHTML = '';
    return;
  }

  // Mapeo Y: 1 es la base (y=padTop+chartH), 5 es el tope (y=padTop)
  const getY = (v) => padTop + chartH - ((v - 1) / 4) * chartH;
  // Mapeo X equiespaciado
  const getX = (i) => padLeft + (chartW * i) / (n - 1);

  let svgHtml = '';

  // Filtros y gradientes SVG
  svgHtml += `
    <defs>
      <linearGradient id="progresoAreaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6ECFD4" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#6ECFD4" stop-opacity="0.02" />
      </linearGradient>
      <filter id="nodoSombra" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#6ECFD4" flood-opacity="0.4" />
      </filter>
    </defs>
  `;

  // Líneas horizontales de guía (niveles 1 a 5)
  for (let v = 1; v <= 5; v++) {
    const yVal = getY(v);
    const esEstable = (v === 3);
    const strokeAttr = esEstable
      ? 'stroke="#CFBFF0" stroke-width="1.5" stroke-dasharray="5 4"'
      : 'stroke="#EDE8F0" stroke-width="1"';

    svgHtml += `
      <line x1="${padLeft}" y1="${yVal.toFixed(1)}" x2="${(W - padRight).toFixed(1)}" y2="${yVal.toFixed(1)}" ${strokeAttr} />
      <text x="${padLeft - 10}" y="${(yVal + 4).toFixed(1)}" text-anchor="end" font-size="11" font-weight="600" fill="#64748B">${v}</text>
    `;
  }

  // Cálculo de puntos de la serie
  const puntos = serie.map((pt, i) => {
    const valor = Math.max(1, Math.min(5, Number(pt.puntaje) || 1));
    return {
      x: getX(i),
      y: getY(valor),
      pt
    };
  });

  const polylineStr = puntos.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Polígono de área sombreada
  const bottomY = getY(1);
  const areaStr = `${puntos[0].x.toFixed(1)},${bottomY.toFixed(1)} ${polylineStr} ${puntos[puntos.length - 1].x.toFixed(1)},${bottomY.toFixed(1)}`;
  svgHtml += `<polygon points="${areaStr}" fill="url(#progresoAreaGrad)" />`;

  // Línea continua del progreso
  svgHtml += `
    <polyline points="${polylineStr}" fill="none" stroke="#6ECFD4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#nodoSombra)" />
  `;

  // Control para no saturar etiquetas de fechas si hay más de 12 registros
  const compactarFechas = n > 12;

  // Nodos y textos
  puntos.forEach((p, idx) => {
    // Línea vertical punteada al piso
    svgHtml += `
      <line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${bottomY.toFixed(1)}" stroke="#6ECFD4" stroke-opacity="0.18" stroke-width="1" stroke-dasharray="2 2" />
    `;

    // Círculo interactivo con tooltip
    const tituloTooltip = `Fecha: ${escaparHtml(p.pt.fechaCorta || p.pt.fecha)}&#10;Puntaje: ${Number(p.pt.puntaje) || 0} / 5${p.pt.nivel ? ` (${escaparHtml(p.pt.nivel)})` : ''}`;
    svgHtml += `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5.5" fill="#FFFFFF" stroke="#6ECFD4" stroke-width="3" class="chart-node" style="cursor: pointer; transition: r 0.2s ease;">
        <title>${tituloTooltip}</title>
      </circle>
    `;

    // Etiqueta del valor numérico
    svgHtml += `
      <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#1E293B">${Number(p.pt.puntaje) || 0}</text>
    `;

    // Etiqueta de la fecha en eje X
    const mostrarFecha = !compactarFechas || (idx === 0 || idx === n - 1 || idx % Math.ceil(n / 6) === 0);
    if (mostrarFecha) {
      svgHtml += `
        <text x="${p.x.toFixed(1)}" y="${(H - 16).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="500" fill="#64748B">${escaparHtml(p.pt.fechaCorta)}</text>
      `;
    }
  });

  chartSvg.innerHTML = svgHtml;
}

/**
 * Registra todos los escuchadores de eventos
 */
function registrarEventos() {
  // Cambio de paciente
  if (patientSel) {
    patientSel.addEventListener('change', () => {
      progresoService.logAuditoria('Cambio de paciente en selector a id:', patientSel.value);
      cargarProgreso();
    });
  }

  // Botón Aplicar filtros
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const desde = dateFrom?.value || '';
      const hasta = dateTo?.value || '';

      if (desde && hasta && desde > hasta) {
        showToast('La fecha inicial no puede ser posterior a la fecha final.');
        return;
      }

      progresoService.logAuditoria('Aplicando filtros de fecha:', `${desde || 'inicio'} a ${hasta || 'fin'}`);
      cargarProgreso();
    });
  }

  // Botón Restablecer fechas desde el estado vacío
  if (btnRestablecerFiltros) {
    btnRestablecerFiltros.addEventListener('click', () => {
      if (dateFrom) dateFrom.value = '';
      if (dateTo) dateTo.value = '';
      showToast('Filtros de fecha restablecidos.');
      progresoService.logAuditoria('Filtros de fecha restablecidos');
      cargarProgreso();
    });
  }

  // Botón Solicitar autorización desde el estado bloqueado
  if (solBtn) {
    solBtn.addEventListener('click', () => {
      const nombre = patientSel?.options[patientSel.selectedIndex]?.text || 'el paciente';
      showToast(`Solicitud de autorización enviada a ${nombre}.`);
      progresoService.logAuditoria(`SOLICITUD de autorización enviada a id=${patientSel?.value}`);
    });
  }

  // Cierre de sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
      authService.logout();
      window.location.href = 'inicio.html';
    });
  }

  // Modal Aviso: no diagnóstico (PB-04)
  if (footerAviso) {
    footerAviso.addEventListener('click', async (e) => {
      e.preventDefault();
      if (avisoModal) {
        avisoModal.classList.add('open');
        avisoModal.setAttribute('aria-hidden', 'false');
      }
      await avisoService.registrarVisualizacion('enlace', 'ok');
    });
  }

  if (btnEntendido) {
    btnEntendido.addEventListener('click', () => {
      if (avisoModal) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
      avisoService.marcarAvisoAceptado();
    });
  }

  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      if (avisoModal) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (avisoModal) {
    avisoModal.addEventListener('click', (e) => {
      if (e.target === avisoModal) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

/**
 * Inicialización general de la vista
 */
async function inicializar() {
  if (!verificarAccesoPsicologo()) return;

  inicializarFechas();
  registrarEventos();
  await cargarPacientes();

  progresoService.logAuditoria('Sistema listo - Vista de Progreso Emocional inicializada');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
