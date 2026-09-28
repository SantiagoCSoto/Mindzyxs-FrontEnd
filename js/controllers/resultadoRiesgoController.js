/**
 * Front-end del resultado del riesgo del invitado (PB-08 HU1-PB8).
 * Lee las respuestas completas de la sesión (guardadas por PB-07),
 * muestra el mensaje aclaratorio si aplica, calcula el nivel con el backend
 * y presenta explicación + alerta de urgencia si es Alto, con accesos a
 * recomendaciones (priorizadas por ?nivel=) y líneas de ayuda.
 */

import { abrirModal, cerrarModal } from '../utils/alerts.js';
import { avisoService } from '../services/avisoService.js';
import { calcularRiesgo, obtenerLineas } from '../services/riesgoService.js';
import { leerRiesgos } from '../services/encuestaService.js';

const KEY_SESION = 'encuesta_invitado_front';

const resLevel = document.getElementById('resLevel');
const resScore = document.getElementById('resScore');
const resExpl = document.getElementById('resExpl');
const alertEl = document.getElementById('alertUrgente');
const lineasBtn = document.getElementById('btnLineas');
const btnRecom = document.getElementById('btnRecom');
const errorCard = document.getElementById('errorCard');
const errorMsg = document.getElementById('errorMsg');
const avisoModal = document.getElementById('avisoModal');
const lineasModal = document.getElementById('lineasModal');

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function leerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY_SESION));
  } catch (_) {
    return null;
  }
}

function mostrarError(mensaje) {
  document.querySelector('.result-card').hidden = true;
  errorMsg.textContent = mensaje || 'No se encontraron respuestas para calcular el riesgo. Por favor responde el cuestionario nuevamente';
  errorCard.hidden = false;
}

function pintarResultado(r, esPrevio = false) {
  resLevel.textContent = 'Riesgo ' + r.nivel;
  resLevel.className = 'result-level ' + String(r.nivel).toLowerCase();
  resScore.textContent = 'Puntaje ' + r.puntaje + ' / 5' + (esPrevio ? ' (resultado anterior)' : '');
  resExpl.textContent = r.explicacion || '';

  const alto = (r.alerta && r.alerta.mostrar) || r.alerta === true || (esPrevio && String(r.nivel).toLowerCase() === 'alto');
  alertEl.classList.toggle('show', !!alto);
  lineasBtn.classList.toggle('urgente', !!alto);
  lineasBtn.textContent = alto ? '🚨 Líneas de ayuda (urgente)' : 'Líneas de ayuda';
  btnRecom.href = 'recomendaciones_invitado.html?nivel=' + encodeURIComponent(r.nivel);
}

async function mostrarAvisoSiAplica() {
  try {
    const aviso = await avisoService.obtenerAviso();
    if (aviso?.data?.texto) {
      document.getElementById('avisoText').innerHTML =
        '<b>' + escapar(aviso.data.titulo || 'Mensaje aclaratorio') + '</b><br><br>' +
        escapar(aviso.data.texto).replace(/\n/g, '<br>');
    }
  } catch (_) { /* aviso por defecto del HTML */ }
}

async function iniciar() {
  const sesion = leerSesion();
  if (sesion && sesion.cuestionarioId && sesion.respuestas && sesion.respuestas.length) {
    // Flujo normal: calcula con las respuestas de la sesión.
    await mostrarAvisoSiAplica();
    avisoService.registrarVisualizacion('resultado-riesgo', 'ok');
    if (avisoModal) abrirModal(avisoModal);

    try {
      const r = await calcularRiesgo(sesion.cuestionarioId, sesion.respuestas);
      pintarResultado(r);
    } catch (error) {
      mostrarError(error.message);
    }
    return;
  }

  // Sin sesión (reentró como invitado): usa el riesgo guardado en cookies.
  const params = new URLSearchParams(location.search);
  const pedido = Number(params.get('cuestionarioId'));
  const previos = leerRiesgos();
  const previo = previos.find((p) => p.cuestionarioId === pedido) || previos[previos.length - 1];
  if (previo) {
    pintarResultado(
      {
        nivel: previo.nivel,
        puntaje: previo.puntaje,
        explicacion: previo.explicacion || '',
        alerta: previo.alerta
      },
      true
    );
    return;
  }

  mostrarError();
}

document.getElementById('avisoOk')?.addEventListener('click', () => cerrarModal(avisoModal));
document.getElementById('avisoCerrar')?.addEventListener('click', () => cerrarModal(avisoModal));
document.getElementById('footerAviso')?.addEventListener('click', (e) => {
  e.preventDefault();
  mostrarAvisoSiAplica().then(() => abrirModal(avisoModal));
});

lineasBtn?.addEventListener('click', async () => {
  const list = document.getElementById('lineasList');
  list.innerHTML = '<div class="line-item">Cargando…</div>';
  abrirModal(lineasModal);
  try {
    lineasCache = await obtenerLineas();
    pintarLineas();
  } catch (error) {
    list.innerHTML = '<div class="line-item">No fue posible cargar las líneas de ayuda. Intente nuevamente.</div>';
  }
});
document.getElementById('lineasClose')?.addEventListener('click', () => cerrarModal(lineasModal));
document.getElementById('lineasX')?.addEventListener('click', () => cerrarModal(lineasModal));
document.getElementById('lineasQ')?.addEventListener('input', pintarLineas);
document.getElementById('lineasTipo')?.addEventListener('change', pintarLineas);

let lineasCache = [];

function pintarLineas() {
  const list = document.getElementById('lineasList');
  const q = (document.getElementById('lineasQ')?.value || '').trim().toLowerCase();
  const tipo = document.getElementById('lineasTipo')?.value || '';
  const fil = lineasCache.filter((l) =>
    (!tipo || (l.tipoAtencion || '') === tipo) &&
    (!q || [l.nombre, l.departamento, l.municipio, l.cobertura].filter(Boolean).join(' ').toLowerCase().includes(q))
  );
  list.innerHTML = fil.length ? fil.map((l) =>
    '<div class="line-item">🆘 <b>' + escapar(l.nombre) + '</b>' +
    (l.telefono ? '<br>📞 ' + escapar(l.telefono) : '') +
    (l.whatsapp ? '<br>💬 WhatsApp: ' + escapar(l.whatsapp) : '') +
    (l.url ? '<br>🌐 ' + escapar(l.url) : '') +
    (l.horario ? '<br>🕒 ' + escapar(l.horario) : '') +
    (l.cobertura ? '<br>📍 ' + escapar(l.cobertura) : '') +
    `<div class="linea-tags">` +
    (l.tipoAtencion ? `<span class="linea-tag">${escapar(tipoLabel(l.tipoAtencion))}</span>` : '') +
    (l.departamento ? `<span class="linea-tag">${escapar(l.departamento)}</span>` : '') +
    (l.fuente ? `<span class="linea-tag">Fuente: ${escapar(l.fuente)}</span>` : '') +
    `</div></div>`
  ).join('') : '<div class="line-item">Sin coincidencias. Probá con otra búsqueda.</div>';
}

function tipoLabel(t) {
  return {
    apoyo_emocional: 'Apoyo emocional',
    intervencion_crisis: 'Intervención en crisis',
    emergencia: 'Emergencia',
    violencia_genero: 'Violencia de género',
    infancia_adolescencia: 'Infancia y adolescencia',
    orientacion_institucional: 'Orientación institucional'
  }[t] || t;
}

iniciar();
