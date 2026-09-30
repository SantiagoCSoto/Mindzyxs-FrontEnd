/**
 * Controlador de la Vista de Recordatorios (views/recordatorios.html)
 * Historia de Usuario: HU1-PB15 (Recordatorios para el registro emocional - Rol Paciente)
 * 
 * Gestiona:
 *  - Verificación de sesión de Paciente
 *  - Carga de la configuración actual desde el backend (GET /api/recordatorios)
 *  - Alternancia interactiva entre frecuencia Diaria y Semanal
 *  - Despliegue dinámico de selector de días para frecuencia Semanal
 *  - Switch toggle para activar o desactivar avisos
 *  - Validaciones de campos requeridos (frecuencia, hora y días si es semanal)
 *  - Envío y guardado de configuración (POST /api/recordatorios)
 *  - Descarte de cambios y retorno a configuración previa
 *  - Verificación de avisos programados vencidos hoy (GET /api/recordatorios/hoy)
 *  - Modal aclaratorio (PB-04), notificaciones toast y auditoría [HU1-PB15]
 */

import { authService } from '../services/authService.js';
import { recordatorioService, DIAS_MAP, DIAS_REVERSE } from '../services/recordatorioService.js';
import { avisoService } from '../services/avisoService.js';

// Elementos de encabezado y sesión
const backBtn = document.getElementById('backBtn');

// Elementos de tarjeta de estado actual
const currentBox = document.getElementById('currentBox');
const currentText = document.getElementById('currentText');
const currentStatusText = document.getElementById('currentStatusText');
const statusDot = document.getElementById('statusDot');

// Elementos del formulario
const toggleActive = document.getElementById('toggleActive');
const chipDiaria = document.getElementById('chipDiaria');
const chipSemanal = document.getElementById('chipSemanal');
const horaInput = document.getElementById('horaInput');
const daysBlock = document.getElementById('daysBlock');
const daysGrid = document.getElementById('daysGrid');
const msgBox = document.getElementById('msgBox');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Elementos de aviso modal (PB-04) y toast
const footerAviso = document.getElementById('footerAviso');
const avisoModal = document.getElementById('avisoModal');
const btnCerrar = document.getElementById('btnCerrar');
const btnEntendido = document.getElementById('btnEntendido');
const toast = document.getElementById('toast');

// Estado local
let configGuardada = null;
let borrador = {
  activo: true,
  frecuencia: 'Diaria',
  hora: '08:00',
  dias: []
};

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
  }, 2600);
}

/**
 * Muestra u oculta el banner de mensaje en tarjeta
 * @param {'err'|'ok'|''} tipo 
 * @param {string} texto 
 */
function showMsg(tipo, texto) {
  if (!msgBox) return;

  if (!tipo || !texto) {
    msgBox.style.display = 'none';
    msgBox.textContent = '';
    msgBox.className = 'msg';
    return;
  }

  msgBox.className = `msg ${tipo}`;
  msgBox.textContent = texto;
  msgBox.style.display = 'block';
}

/**
 * Valida la sesión activa del usuario
 */
function verificarSesionPaciente() {
  const sesion = authService.getSesion();

  if (sesion) {
    const rol = (sesion.rol || sesion.tipo_usuario || '').toLowerCase();
    const esPaciente = rol.includes('paciente') || rol.includes('invitado');

    if (!esPaciente && !rol.includes('admin')) {
      recordatorioService.logAuditoria('Acceso bloqueado: usuario no tiene rol de paciente', rol);
      alert('Esta sección está reservada para el rol de Paciente.');
      window.location.href = 'inicio.html';
      return false;
    }
  }

  return true;
}

/**
 * Renderiza la interfaz gráfica con el estado guardado y el borrador
 */
function renderizar() {
  // 1. Actualizar tarjeta de configuración actual
  if (currentStatusText && statusDot) {
    if (!configGuardada || !configGuardada.hora) {
      currentStatusText.textContent = 'Sin configuración previa · Desactivada';
      statusDot.className = 'status-dot off';
    } else {
      currentStatusText.textContent = recordatorioService.formatearTextoResumen(configGuardada);
      statusDot.className = configGuardada.activo ? 'status-dot' : 'status-dot off';
    }
  }

  // 2. Actualizar controles del formulario con el borrador
  if (toggleActive) {
    toggleActive.checked = borrador.activo !== false;
  }

  if (chipDiaria) {
    chipDiaria.classList.toggle('active', borrador.frecuencia === 'Diaria');
  }

  if (chipSemanal) {
    chipSemanal.classList.toggle('active', borrador.frecuencia === 'Semanal');
  }

  if (horaInput) {
    horaInput.value = borrador.hora || '';
  }

  // Desplegar u ocultar bloque de días
  if (daysBlock) {
    daysBlock.style.display = borrador.frecuencia === 'Semanal' ? 'block' : 'none';
  }

  // 3. Sincronizar selección de días semanales
  if (daysGrid) {
    const diasSeleccionados = Array.isArray(borrador.dias) ? borrador.dias : [];

    daysGrid.querySelectorAll('.day').forEach(label => {
      const input = label.querySelector('input');
      const valNum = Number(input.dataset.val || input.value);
      const valText = input.value;

      const estaSeleccionado = diasSeleccionados.includes(valNum) || 
                               diasSeleccionados.includes(valText) ||
                               (borrador.diasNombres && borrador.diasNombres.includes(valText));

      input.checked = estaSeleccionado;
      label.classList.toggle('sel', estaSeleccionado);
    });
  }
}

/**
 * Cambia la frecuencia seleccionada (Diaria o Semanal)
 * @param {'Diaria'|'Semanal'} freq 
 */
function cambiarFrecuencia(freq) {
  borrador.frecuencia = freq;
  showMsg('', '');
  recordatorioService.logAuditoria('Frecuencia seleccionada:', freq);
  renderizar();
}

/**
 * Recopila los días seleccionados en la cuadrícula semanal
 */
function actualizarDiasSeleccionados() {
  if (!daysGrid) return;

  const seleccionados = [];
  daysGrid.querySelectorAll('input:checked').forEach(cb => {
    const num = cb.dataset.val ? Number(cb.dataset.val) : DIAS_REVERSE[cb.value] || null;
    if (num) seleccionados.push(num);
  });

  borrador.dias = seleccionados;
  borrador.diasNombres = seleccionados.map(n => DIAS_MAP[n] || n);

  recordatorioService.logAuditoria('Días seleccionados:', borrador.diasNombres.join(', ') || '(ninguno)');

  // Actualizar clases visuales .sel
  daysGrid.querySelectorAll('.day').forEach(label => {
    const cb = label.querySelector('input');
    label.classList.toggle('sel', cb.checked);
  });
}

/**
 * Guarda o actualiza la configuración de recordatorios
 */
async function manejarGuardar() {
  borrador.hora = horaInput ? horaInput.value.trim() : '';

  // Validaciones
  if (!borrador.frecuencia || !borrador.hora) {
    recordatorioService.logAuditoria('ERROR validación: falta frecuencia u hora. No se guarda.');
    showMsg('err', 'Debes seleccionar frecuencia y hora');
    showToast('Debes seleccionar frecuencia y hora');
    return;
  }

  if (borrador.frecuencia === 'Semanal' && (!borrador.dias || borrador.dias.length === 0)) {
    recordatorioService.logAuditoria('ERROR validación: frecuencia semanal sin días');
    showMsg('err', 'Debes seleccionar al menos un día para la frecuencia semanal');
    showToast('Debes seleccionar al menos un día');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
  }

  const res = await recordatorioService.guardarConfiguracion({
    frecuencia: borrador.frecuencia,
    hora: borrador.hora,
    dias: borrador.dias,
    activo: borrador.activo !== false
  });

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
  }

  if (res.exito && res.data) {
    configGuardada = res.data;
    borrador = {
      activo: configGuardada.activo,
      frecuencia: configGuardada.frecuencia,
      hora: configGuardada.hora,
      dias: [...(configGuardada.dias || [])],
      diasNombres: [...(configGuardada.diasNombres || [])]
    };

    showMsg('ok', 'Recordatorios configurados correctamente');
    showToast('Recordatorios configurados correctamente ✓');
    renderizar();
  } else {
    showMsg('err', res.mensaje || 'Error al guardar la configuración.');
    showToast(res.mensaje || 'Error al guardar');
  }
}

/**
 * Descarta los cambios en borrador y restablece la última configuración guardada
 */
function manejarCancelar(silencioso = false) {
  if (configGuardada) {
    borrador = {
      activo: configGuardada.activo,
      frecuencia: configGuardada.frecuencia,
      hora: configGuardada.hora,
      dias: [...(configGuardada.dias || [])],
      diasNombres: [...(configGuardada.diasNombres || [])]
    };
  } else {
    borrador = {
      activo: true,
      frecuencia: 'Diaria',
      hora: '08:00',
      dias: []
    };
  }

  showMsg('', '');
  recordatorioService.logAuditoria('CANCELAR: cambios descartados, vuelve a la configuración guardada:', JSON.stringify(borrador));
  if (!silencioso) showToast('Cambios descartados');
  renderizar();
}

/**
 * Consulta si existen avisos programados que vencen hoy
 */
async function verificarAvisosHoy() {
  const res = await recordatorioService.obtenerAvisosHoy();
  if (res.exito && Array.isArray(res.data) && res.data.length > 0) {
    const aviso = res.data[0];
    const titulo = aviso.titulo || 'Es hora de tu registro emocional';
    showToast(`🔔 ${titulo}`);
    recordatorioService.logAuditoria('Aviso vencido detectado para hoy:', titulo);
  }
}

/**
 * Registra todos los escuchadores de eventos
 */
function registrarEventos() {
  // Switch de activación
  if (toggleActive) {
    toggleActive.addEventListener('change', () => {
      borrador.activo = toggleActive.checked;
      recordatorioService.logAuditoria('Toggle recordatorios:', borrador.activo ? 'ACTIVADO' : 'DESACTIVADO');
    });
  }

  // Chips de frecuencia
  if (chipDiaria) {
    chipDiaria.addEventListener('click', () => cambiarFrecuencia('Diaria'));
  }

  if (chipSemanal) {
    chipSemanal.addEventListener('click', () => cambiarFrecuencia('Semanal'));
  }

  // Campo de hora
  if (horaInput) {
    horaInput.addEventListener('change', () => {
      borrador.hora = horaInput.value;
      showMsg('', '');
      recordatorioService.logAuditoria('Hora seleccionada:', borrador.hora || '(vacía)');
    });
  }

  // Checkboxes de días de la semana
  if (daysGrid) {
    daysGrid.querySelectorAll('input').forEach(cb => {
      cb.addEventListener('change', () => {
        showMsg('', '');
        actualizarDiasSeleccionados();
      });
    });
  }

  // Botón Guardar
  if (saveBtn) {
    saveBtn.addEventListener('click', manejarGuardar);
  }

  // Botón Cancelar
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => manejarCancelar());
  }

  // Volver al panel: descarta el borrador como Cancelar y navega
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      manejarCancelar(true);
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
 * Inicialización de la vista
 */
async function inicializar() {
  if (!verificarSesionPaciente()) return;

  registrarEventos();

  // Cargar configuración actual desde backend / storage
  const res = await recordatorioService.obtenerConfiguracion();

  if (res.exito && res.data) {
    configGuardada = res.data;
    borrador = {
      activo: configGuardada.activo,
      frecuencia: configGuardada.frecuencia,
      hora: configGuardada.hora,
      dias: [...(configGuardada.dias || [])],
      diasNombres: [...(configGuardada.diasNombres || [])]
    };
  } else {
    // Sin configuración previa
    configGuardada = null;
    borrador = {
      activo: true,
      frecuencia: 'Diaria',
      hora: '08:00',
      dias: []
    };
  }

  renderizar();
  recordatorioService.logAuditoria('Sistema listo - pantalla Recordatorios.');

  // Verificar avisos vencidos para hoy
  await verificarAvisosHoy();
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

// Cerrar sesión (header unificado)
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (!confirm('¿Está seguro de que desea cerrar sesión?')) return;
    authService.logout();
    avisoService.resetearAviso();
    sessionStorage.removeItem('es_invitado');
    window.location.href = 'login.html';
  });
}
