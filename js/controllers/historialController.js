/**
 * Controlador de la Vista de Historial Emocional (views/historial.html)
 * Historia de Usuario: HU1-PB13 (Historial emocional)
 * Gestiona:
 *  - Carga y renderizado de la lista ordenada cronológicamente (recientes primero)
 *  - Filtro por rango de fechas (desde / hasta) con validación y limpieza
 *  - Modal de detalle del registro (nota personal, respuestas de cuestionario y apoyo del psicólogo)
 *  - Manejo de estados (vacío, carga, error) y notificaciones toast
 *  - Auditoría estructurada en consola [HU1-PB13]
 */

import { authService } from '../services/authService.js';
import { historialService } from '../services/historialService.js';
import { avisoService } from '../services/avisoService.js';

// Elementos de la barra de filtros
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const btnFilter = document.getElementById('btnFilter');
const btnClear = document.getElementById('btnClear');

// Elementos de lista y estados
const countLabel = document.getElementById('countLabel');
const recordList = document.getElementById('recordList');
const emptyState = document.getElementById('emptyState');
const btnRegister = document.getElementById('btnRegister');
const btnBackPanel = document.getElementById('btnBackPanel');

// Elementos del modal de detalle
const detailModal = document.getElementById('detailModal');
const detailIcon = document.getElementById('detailIcon');
const detailTitle = document.getElementById('detailTitle');
const detailMeta = document.getElementById('detailMeta');
const detailValueText = document.getElementById('detailValueText');
const detailNotesText = document.getElementById('detailNotesText');
const detailQuizText = document.getElementById('detailQuizText');
const detailSupport = document.getElementById('detailSupport');
const detailSupportText = document.getElementById('detailSupportText');
const btnBackHistory = document.getElementById('btnBackHistory');
const btnGoPanel = document.getElementById('btnGoPanel');

// Header, aviso modal (PB-04) y toast
const btnLogout = document.getElementById('btn-logout');
const toast = document.getElementById('toast');
const avisoModal = document.getElementById('avisoModal');
const footerAviso = document.getElementById('footerAviso');
const btnEntendido = document.getElementById('btnEntendido');
const btnCerrar = document.getElementById('btnCerrar');

// Estado interno
let registrosActuales = [];

/**
 * Muestra notificación flotante (toast)
 * @param {string} mensaje 
 */
function showToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/**
 * Escapa HTML (anti-XSS): todo dato de backend/usuario va escapado antes de innerHTML.
 */
function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Retorna las clases de estilo para el icono e insignia según categoría
 * @param {'pos'|'neu'|'low'} categoria
 */
function obtenerClasesVisuales(categoria) {
  if (categoria === 'pos') {
    return { icoClass: 'ico-pos', valClass: 'val-pos' };
  }
  if (categoria === 'low') {
    return { icoClass: 'ico-low', valClass: 'val-low' };
  }
  return { icoClass: 'ico-neu', valClass: 'val-neu' };
}

/**
 * Renderiza la lista de registros emocionales en el contenedor
 */
function renderizarLista() {
  if (!recordList || !emptyState) return;

  recordList.innerHTML = '';
  const total = registrosActuales.length;

  if (total === 0) {
    recordList.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.classList.add('show');
    if (countLabel) countLabel.textContent = '';
    historialService.logAuditoria('Estado vacío visible (sin registros)');
    return;
  }

  emptyState.style.display = 'none';
  emptyState.classList.remove('show');
  recordList.style.display = 'flex';

  if (countLabel) {
    countLabel.textContent = `${total} registro(s) · ordenados: recientes primero`;
  }

  registrosActuales.forEach(r => {
    const { icoClass, valClass } = obtenerClasesVisuales(r.categoria);

    const card = document.createElement('article');
    card.className = 'record';
    card.setAttribute('data-id', r.id);

    card.innerHTML = `
      <div class="record-ico ${icoClass}" aria-hidden="true">${escapar(r.emoji)}</div>
      <div class="record-body">
        <div class="record-date">${escapar(r.fecha)} · ${escapar(r.hora)}</div>
        <span class="record-val ${valClass}">${escapar(r.valorTexto)}</span>
        <p class="record-sum">${escapar(r.resumen)}</p>
        <div class="record-btns">
          <button type="button" class="btn-sm" data-action="detail" data-id="${Number(r.id) || 0}">Ver detalle</button>
        </div>
      </div>
    `;

    recordList.appendChild(card);
  });

  // Asignar listeners a los botones de cada tarjeta
  recordList.querySelectorAll('[data-action="detail"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      abrirDetalle(id);
    });
  });
}

/**
 * Abre y llena el modal con el detalle completo de un registro
 * @param {number} id 
 */
async function abrirDetalle(id) {
  historialService.logAuditoria(`Solicitando detalle del registro id=${id}`);

  const res = await historialService.obtenerDetalle(id);

  if (!res.exito || !res.data) {
    showToast(res.mensaje || 'No se pudo cargar el detalle del registro.');
    return;
  }

  const d = res.data;

  if (detailIcon) detailIcon.textContent = d.emoji;
  if (detailTitle) detailTitle.textContent = `Detalle del registro #${d.id}`;
  if (detailMeta) detailMeta.textContent = `${d.fecha} · ${d.hora} hs`;

  // 1. Valor / Estado
  if (detailValueText) {
    const tipoLabel = d.tipo === 'RegistroEmocional' ? 'Registro de estado de ánimo' : 'Cuestionario de bienestar';
    detailValueText.innerHTML = `<b>${escapar(d.valorTexto)}</b> &mdash; <small style="color:var(--muted);">${tipoLabel}</small>`;
  }

  // 2. Nota personal (Cómo me sentí)
  if (detailNotesText) {
    if (d.nota && d.nota.trim()) {
      detailNotesText.textContent = d.nota.trim();
    } else {
      detailNotesText.innerHTML = '<span style="color:var(--muted); font-style:italic;">Sin notas registradas para este evento.</span>';
    }
  }

  // 3. Resultado de cuestionario o respuestas
  if (detailQuizText) {
    if (Array.isArray(d.respuestas) && d.respuestas.length > 0) {
      const listaResp = d.respuestas
        .map(r => `<li style="margin-bottom:6px;"><b>${escapar(r.pregunta)}:</b> ${escapar(r.texto || r.valor)}</li>`)
        .join('');
      detailQuizText.innerHTML = `<ul style="margin:4px 0 0 16px; padding:0;">${listaResp}</ul>`;
    } else if (d.tipo === 'Cuestionario') {
      detailQuizText.innerHTML = `<b>${escapar(d.cuestionario || 'Cuestionario')}</b>${d.puntaje ? ` &middot; Puntaje: ${Number(d.puntaje) || 0}` : ''}`;
    } else {
      detailQuizText.innerHTML = '<span style="color:var(--muted);">No aplica (registro directo de estado emocional).</span>';
    }
  }

  // 4. Apoyo de psicólogo asignado
  if (detailSupport && detailSupportText) {
    if (Array.isArray(d.observaciones) && d.observaciones.length > 0) {
      detailSupport.style.display = 'block';
      detailSupportText.innerHTML = d.observaciones
        .map(o => `
          <div style="margin-bottom:6px;">
            <p style="margin:0 0 4px; font-style:italic;">&ldquo;${escapar(o.contenido)}&rdquo;</p>
            <small style="color:var(--muted);">${escapar(o.firma)} &middot; ${escapar(o.fecha)}</small>
          </div>
        `)
        .join('<hr style="margin:8px 0; border:0; border-top:1px dashed #EDE8F0;" />');
    } else {
      detailSupport.style.display = 'none';
      detailSupportText.innerHTML = '';
    }
  }

  if (detailModal) {
    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');
  }

  historialService.logAuditoria(`Detalle visualizado para registro id=${id}`);
}

/**
 * Cierra el modal de detalle
 */
function cerrarDetalle() {
  if (detailModal) {
    detailModal.classList.remove('open');
    detailModal.setAttribute('aria-hidden', 'true');
    historialService.logAuditoria('Detalle cerrado');
  }
}

/**
 * Carga el historial desde el servicio aplicando filtros si existen
 * @param {string|null} desde 
 * @param {string|null} hasta 
 */
async function cargarHistorial(desde = null, hasta = null) {
  if (recordList) {
    recordList.style.display = 'flex';
    recordList.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('div');
      d.className = 'sk sk-card';
      d.setAttribute('aria-hidden', 'true');
      recordList.appendChild(d);
    }
  }
  if (emptyState) emptyState.style.display = 'none';
  if (countLabel) countLabel.textContent = 'Cargando historial...';
  if (btnFilter) btnFilter.disabled = true;
  if (btnClear) btnClear.disabled = true;

  const res = await historialService.obtenerHistorial(desde, hasta);

  if (btnFilter) btnFilter.disabled = false;
  if (btnClear) btnClear.disabled = false;
  if (res.noSesion) {
    window.location.href = 'login.html';
    return;
  }
  if (res.exito) {
    registrosActuales = res.data || [];
    renderizarLista();
  } else {
    showToast(res.mensaje || 'Error al obtener el historial.');
    registrosActuales = [];
    renderizarLista();
  }
}

/**
 * Maneja el evento de filtrado por rango de fechas
 */
function manejarFiltrar() {
  const vDesde = (dateFrom?.value || '').trim();
  const vHasta = (dateTo?.value || '').trim();

  if (vDesde && vHasta && vDesde > vHasta) {
    showToast('La fecha "Desde" no puede ser posterior a "Hasta".');
    return;
  }

  historialService.logAuditoria(`Aplicando filtro: desde=${vDesde || 'inicio'}, hasta=${vHasta || 'hoy'}`);
  cargarHistorial(vDesde || null, vHasta || null).then(() => {
    showToast(`Filtro aplicado: ${registrosActuales.length} registro(s)`);
  });
}

/**
 * Limpia los campos de filtro y recarga la lista completa
 */
function manejarLimpiar() {
  if (dateFrom) dateFrom.value = '';
  if (dateTo) dateTo.value = '';

  historialService.logAuditoria('Filtro limpiado - recargando historial completo');
  cargarHistorial().then(() => {
    showToast('Filtro limpiado');
  });
}

/**
 * Configura los eventos del DOM
 */
function registrarEventos() {
  if (btnFilter) {
    btnFilter.addEventListener('click', manejarFiltrar);
  }

  if (btnClear) {
    btnClear.addEventListener('click', manejarLimpiar);
  }

  // Cerrar modal de detalle
  if (btnBackHistory) {
    btnBackHistory.addEventListener('click', cerrarDetalle);
  }

  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        cerrarDetalle();
      }
    });
  }

  // Cerrar sesión
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

  // Cerrar modales con tecla ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (detailModal && detailModal.classList.contains('open')) cerrarDetalle();
      if (avisoModal && avisoModal.classList.contains('open')) {
        avisoModal.classList.remove('open');
        avisoModal.setAttribute('aria-hidden', 'true');
      }
    }
  });
}

/**
 * Inicialización de la pantalla
 */
async function inicializar() {
  registrarEventos();
  await cargarHistorial();

  historialService.logAuditoria('Sistema listo - Pantalla de Historial Emocional cargada');
}

// Iniciar al cargar el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
