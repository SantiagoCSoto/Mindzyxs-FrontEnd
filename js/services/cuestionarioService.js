/**
 * Servicio del cuestionario emocional del paciente (PB-11 HU1-PB11).
 * Consume el backend en http://localhost:5015/api:
 *   GET  /cuestionario/paciente/pendiente  -> cuestionario pendiente con preguntas/opciones
 *   POST /cuestionario/paciente/inicio     -> log de inicio (no bloquea)
 *   POST /cuestionario/paciente/finalizar  -> valida 100% y persiste en el historial
 *   GET  /historial                        -> historial reciente del paciente (PB-13)
 * Si el backend no está disponible, responde un catálogo local de respaldo
 * (modalidad localOnly) para no romper el flujo de la vista.
 */

import { getJson, postJson } from './apiClient.js';

const KEY_HISTORIAL_LOCAL = 'cuestionario_paciente_historial';

const DEMO_OPCIONES = [
  { id: 1, texto: 'Nunca', valor: 1, orden: 1 },
  { id: 2, texto: 'A veces', valor: 2, orden: 2 },
  { id: 3, texto: 'A menudo', valor: 3, orden: 3 },
  { id: 4, texto: 'Casi siempre', valor: 4, orden: 4 }
];

const DEMO_PREGUNTAS = [
  { id: 1, texto: '¿Con qué frecuencia te has sentido desanimado o triste?', orden: 1, opciones: DEMO_OPCIONES },
  { id: 2, texto: '¿Con qué frecuencia te has sentido ansioso o preocupado?', orden: 2, opciones: DEMO_OPCIONES },
  { id: 3, texto: '¿Con qué frecuencia has tenido dificultades para dormir?', orden: 3, opciones: DEMO_OPCIONES },
  { id: 4, texto: '¿Con qué frecuencia te has sentido con poca energía?', orden: 4, opciones: DEMO_OPCIONES },
  { id: 5, texto: '¿Con qué frecuencia has perdido interés en actividades que disfrutas?', orden: 5, opciones: DEMO_OPCIONES }
];

const DEMO_CUESTIONARIO = {
  disponible: true,
  id: 1,
  titulo: 'Cuestionario emocional',
  descripcion: 'Responde 5 preguntas sobre tu bienestar. Tus respuestas se guardan en tu historial.',
  avisoObligatorio: true,
  adaptativo: false,
  preguntas: DEMO_PREGUNTAS
};

/**
 * Obtiene el cuestionario emocional pendiente del paciente.
 * Devuelve { ok, data } cuando existe (o respaldo local) y
 * { ok: false, status, error } si el backend reporta un error (ej. 401 sin sesión).
 */
export async function obtenerPendientePaciente() {
  const res = await getJson('/cuestionario/paciente/pendiente');

  if (res.ok && res.data) {
    return { ok: true, data: res.data };
  }

  if (res.isNetworkError) {
    return { ok: true, localOnly: true, data: DEMO_CUESTIONARIO };
  }

  return {
    ok: false,
    status: res.status,
    error: res.error || 'No fue posible cargar el cuestionario.'
  };
}

/**
 * Obtiene los cuestionarios asignados al paciente (PB-22).
 * Devuelve { ok, data: [{ idAsignacion, idCuestionario, titulo, tipo,
 * fechaAsignacion, fechaLimite, estado }] }.
 */
export async function obtenerAsignadosPaciente() {
  const res = await getJson('/cuestionario/paciente/asignados');

  if (res.ok && res.data) {
    const lista = Array.isArray(res.data) ? res.data : [];
    return {
      ok: true,
      data: lista.map((a) => ({
        idAsignacion: a.idAsignacion ?? a.IdAsignacion,
        idCuestionario: a.idCuestionario ?? a.IdCuestionario,
        titulo: a.titulo ?? a.Titulo ?? 'Cuestionario asignado',
        tipo: a.tipo ?? a.Tipo ?? null,
        fechaAsignacion: a.fechaAsignacion ?? a.FechaAsignacion ?? null,
        fechaLimite: a.fechaLimite ?? a.FechaLimite ?? null,
        estado: a.estado ?? a.Estado ?? 'Pendiente'
      }))
    };
  }

  return { ok: false, status: res.status, error: res.error || 'No fue posible cargar los asignados.' };
}

/**
 * Obtiene un cuestionario asignado completo para responderlo (PB-22).
 */
export async function obtenerAsignadoDetalle(idAsignacion) {
  const res = await getJson(`/cuestionario/paciente/asignados/${idAsignacion}`);

  if (res.ok && res.data) {
    return { ok: true, data: res.data };
  }

  return { ok: false, status: res.status, error: res.error || 'No fue posible cargar el cuestionario asignado.' };
}

/**
 * Registra el inicio del cuestionario del paciente (log en dbo.auth).
 * No bloquea: si falla, solo se registra en consola.
 */
export async function registrarInicioPaciente(cuestionarioId) {
  try {
    await postJson('/cuestionario/paciente/inicio', { cuestionarioId });
  } catch (error) {
    void error;
  }
}

/**
 * Finaliza el cuestionario al 100% y persiste las respuestas en el historial.
 * Devuelve { mensaje, idEvento, cuestionarioId, puntaje, nivel, totalPreguntas, respondidas }.
 * Lanza Error con el mensaje exacto del backend (400/404).
 * Si el backend no responde, devuelve un resultado local (localOnly: true) para
 * no romper la vista en modo de demostración.
 */
export async function finalizarCuestionarioPaciente(cuestionarioId, respuestas, preguntas) {
  const res = await postJson('/cuestionario/paciente/finalizar', { cuestionarioId, respuestas });

  if (res.ok && res.data) {
    return { ...res.data, localOnly: false };
  }

  if (res.isNetworkError) {
    const local = calcularLocal(cuestionarioId, respuestas, preguntas);
    return { ...local, localOnly: true };
  }

  throw new Error(res.error || 'Debes seleccionar una respuesta para continuar');
}

/**
 * Calcula el resultado local (puntaje = promedio redondeado, 1-2 bajo, 3 medio, 4 alto)
 * cuando el backend no está disponible. Refleja la regla del backend (PB-07/PB-11).
 */
function calcularLocal(cuestionarioId, respuestas, preguntas) {
  const catalogo = preguntas || DEMO_PREGUNTAS;
  let suma = 0;
  let total = 0;
  respuestas.forEach((r) => {
    const p = catalogo.find((x) => x.id === r.preguntaId);
    const o = p && p.opciones.find((x) => x.id === r.opcionId);
    if (o) {
      suma += o.valor || 0;
      total += 1;
    }
  });
  const puntaje = total ? Math.round(suma / total) : 0;
  const nivel = puntaje <= 2 ? 'Bajo' : puntaje === 3 ? 'Medio' : 'Alto';
  return {
    mensaje: 'Cuestionario completado',
    idEvento: null,
    cuestionarioId,
    puntaje,
    nivel,
    totalPreguntas: catalogo.length,
    respondidas: total
  };
}

/**
 * Obtiene el historial emocional reciente del paciente (recientes primero).
 * Devuelve { ok, data } con la lista, o { ok: false, error } ante error del backend.
 * Sin conexión, devuelve el historial guardado localmente en la sesión.
 */
export async function obtenerHistorial() {
  const res = await getJson('/historial');

  if (res.ok && Array.isArray(res.data)) {
    return { ok: true, data: res.data };
  }

  if (res.isNetworkError) {
    return { ok: true, localOnly: true, data: leerHistorialLocal() };
  }

  return {
    ok: false,
    error: res.error || 'No fue posible cargar el historial.'
  };
}

/**
 * Guarda un ítem de historial en la sesión local (solo modo sin conexión).
 * Máximo 8 registros recientes para no crecer indefinidamente.
 */
export function guardarHistorialLocal(item) {
  const lista = leerHistorialLocal();
  lista.unshift(item);
  try {
    sessionStorage.setItem(KEY_HISTORIAL_LOCAL, JSON.stringify(lista.slice(0, 8)));
  } catch (error) {
    void error;
  }
}

function leerHistorialLocal() {
  try {
    const raw = sessionStorage.getItem(KEY_HISTORIAL_LOCAL);
    if (!raw) return [];
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    void error;
    return [];
  }
}