/**
 * Servicio para la pantalla "Recomendaciones básicas (Invitado)" (PB-09).
 * Consume los endpoints del backend en http://localhost:5015/api.
 * Si el backend no está disponible, responde con contenido de demostración
 * para no romper el flujo invitado.
 */

import { getJson, postJson } from './apiClient.js';

const DEMO_AVISO = {
  titulo: 'Mensaje aclaratorio',
  texto: 'Mindzyx es una plataforma de monitoreo y apoyo del bienestar emocional.\nEste sistema no realiza diagnósticos clínicos y no sustituye la atención de un profesional de la salud mental.\nEl contenido de autocuidado es de carácter básico e informativo y no constituye un tratamiento clínico.\nAnte un riesgo alto o una situación de urgencia, busca ayuda profesional o utiliza las líneas de ayuda disponibles en tu país.'
};

const DEMO_RECOMENDACIONES = [
  {
    id: 1,
    icono: '💡',
    titulo: 'Respiración consciente',
    intro: 'Técnica rápida para calmar la ansiedad en momentos de tensión.',
    duracion: '5 min',
    prioritaria: true,
    pasos: [
      'Siéntate en una posición cómoda con la espalda recta.',
      'Inhala por la nariz contando hasta 4.',
      'Sostén el aire contando hasta 4.',
      'Exhala lentamente por la boca contando hasta 6.',
      'Repite durante 5 minutos.'
    ],
    instrucciones: 'Practica esta técnica cuando notes los primeros signos de ansiedad. Úsala 2 o 3 veces al día si lo necesitas.'
  },
  {
    id: 2,
    icono: '🧘',
    titulo: 'Pausa de mindfulness',
    intro: 'Un espacio de atención plena para reconectar con el presente.',
    duracion: '10 min',
    prioritaria: false,
    pasos: [
      'Busca un lugar tranquilo y sin interrupciones.',
      'Coloca la atención en tu respiración sin juzgarla.',
      'Si tu mente divaga, vuelve con suavidad a la respiración.',
      'Observa tu cuerpo y las sensaciones del momento.',
      'Cierra la sesión estirando suavemente el cuerpo.'
    ],
    instrucciones: 'Realízalo una vez al día, preferiblemente a la misma hora, para crear un hábito estable.'
  },
  {
    id: 3,
    icono: '🆘',
    titulo: 'Contacta con líneas de ayuda',
    intro: 'Canales de apoyo disponibles si sientes que necesitas hablar con alguien.',
    duracion: 'Cuando lo necesites',
    prioritaria: true,
    pasos: [
      'Identifica la línea de ayuda de tu país.',
      'Marca el número desde un lugar seguro y privado.',
      'Describe cómo te sientes de forma honesta.',
      'Sigue las indicaciones del personal que te atiende.'
    ],
    instrucciones: 'Si estás en crisis, no esperes a estar peor: llama o escribe de inmediato. Es una señal de fortaleza pedir ayuda.'
  },
  {
    id: 4,
    icono: '📝',
    titulo: 'Diario de emociones',
    intro: 'Registra cómo te sientes para identificar patrones y desahogarte.',
    duracion: '5 min diarios',
    prioritaria: false,
    pasos: [
      'Elige un momento fijo del día para escribir.',
      'Anota la emoción principal que sentiste.',
      'Describe qué la provocó en una o dos frases.',
      'Escribe una acción de cuidado para el día siguiente.'
    ],
    instrucciones: 'No busques redacción perfecta. El objetivo es reconocer y verbalizar tus emociones, no escribir un informe.'
  }
];

export async function obtenerRecomendaciones(nivel) {
  const url = '/recomendaciones/invitado' + (nivel ? '?nivel=' + encodeURIComponent(nivel) : '');
  const res = await getJson(url);

  if (res.ok && res.data) {
    return { ok: true, data: res.data };
  }

  if (!res.ok && !res.isNetworkError) {
    return { ok: false, error: res.error || 'No fue posible cargar las recomendaciones.' };
  }

  return {
    ok: true,
    localOnly: true,
    data: {
      disponible: true,
      nivel: nivel || null,
      recomendaciones: DEMO_RECOMENDACIONES
    }
  };
}

export async function obtenerRecomendacion(id) {
  const res = await getJson('/recomendaciones/invitado/' + id);

  if (res.ok && res.data) {
    return { ok: true, data: res.data };
  }

  const demo = DEMO_RECOMENDACIONES.find((r) => String(r.id) === String(id));
  if (demo) {
    return { ok: true, localOnly: true, data: demo };
  }

  return {
    ok: false,
    error: (!res.ok && !res.isNetworkError ? res.error : '') || 'Recomendación no disponible.'
  };
}

export async function obtenerAviso() {
  const res = await getJson('/aviso');

  if (res.ok && res.data) {
    return { ok: true, data: res.data };
  }

  return { ok: true, localOnly: true, data: DEMO_AVISO };
}

export async function registrarVisualizacion(origen, resultado) {
  try {
    await postJson('/aviso/visualizacion', { origen, resultado });
  } catch (_) {
    // La visualización es informativa; si el backend no responde, se ignora.
  }
}