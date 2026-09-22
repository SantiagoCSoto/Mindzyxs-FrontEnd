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
    icono: '🌬',
    titulo: 'Respiración guiada',
    intro: 'Ejercicio simple de respiración consciente para reducir la tensión del momento.',
    duracion: 'Duración sugerida: 5 minutos',
    nivel_riesgo: 'Bajo',
    pasos: [
      'Siéntate o recuéstate en una posición cómoda y cierra los ojos si lo prefieres.',
      'Inhala lentamente por la nariz contando hasta 4.',
      'Sostén la respiración contando hasta 4.',
      'Exhala por la boca contando hasta 6.',
      'Repite el ciclo durante 5 minutos, llevando tu atención solo a la respiración.'
    ],
    instrucciones: 'Realiza este ejercicio en un lugar tranquilo. Si sientes mareo, vuelve a la respiración normal y descansa. No reemplaza la supervisión de un profesional de la salud.'
  },
  {
    id: 2,
    icono: '🌱',
    titulo: 'Puedes mejorar paso a paso',
    intro: 'Está bien no sentirse bien siempre: pequeños pasos también cuentan.',
    duracion: 'Duración sugerida: 5 minutos',
    nivel_riesgo: 'Medio',
    pasos: [
      'Haz una pausa consciente de 3 minutos y observa cómo te sientes.',
      'Elige una sola cosa pequeña de la lista de recomendaciones y pruébala hoy.',
      'Registra cómo te sientes mañana para notar tu propio avance.'
    ],
    instrucciones: 'No te exijas resultados inmediatos: el bienestar se cultiva por pasos. Si lo necesitas, revisa las demás recomendaciones básicas.'
  },
  {
    id: 3,
    icono: '🚨',
    titulo: 'Alerta: busca apoyo ahora',
    intro: 'Si estás en riesgo, busca apoyo ahora: no te quedes solo con esto.',
    duracion: 'Ahora mismo',
    nivel_riesgo: 'Alto',
    pasos: [
      'Contacta ahora a una línea de ayuda de tu país.',
      'Si puedes, avisa a alguien de confianza cómo te sientes.',
      'Busca ayuda profesional o acude al servicio de urgencias más cercano.'
    ],
    instrucciones: 'En riesgo: consulta a las líneas de ayuda o a un profesional de la salud mental. Ante urgencia, usa los servicios de emergencia.'
  },
  {
    id: 4,
    icono: '💆',
    titulo: 'Relajación muscular',
    intro: 'Técnica de tensión y distensión muscular para soltar la tensión acumulada.',
    duracion: 'Duración sugerida: 10 minutos',
    nivel_riesgo: 'Medio',
    pasos: [
      'Acuéstate o siéntate cómodamente.',
      'Tensa los músculos de los pies durante 5 segundos y luego suelta.',
      'Sube por cada grupo muscular: piernas, abdomen, manos, brazos, hombros, cuello y rostro.',
      'En cada zona tensa 5 segundos y relaja 10 segundos.',
      'Termina respirando despacio durante 1 minuto.'
    ],
    instrucciones: 'Evita tensar zonas con dolor o lesión. Si el dolor aumenta, detén el ejercicio. Es autocuidado básico y no sustituye un tratamiento clínico.'
  },
  {
    id: 5,
    icono: '🧘',
    titulo: 'Pausa consciente',
    intro: 'Toma un momento para reconectar con el presente y calmar la mente.',
    duracion: 'Duración sugerida: 3 minutos',
    nivel_riesgo: null,
    pasos: [
      'Detén cualquier actividad y deja a un lado distracciones.',
      'Observa tu entorno: nombra 3 cosas que ves, 2 que escuchas y 1 que sientes.',
      'Lleva tu atención a la respiración durante 1 minuto.',
      'Pregúntate cómo te sientes en este momento, sin juzgar la respuesta.'
    ],
    instrucciones: 'Puedes hacer esta pausa varias veces al día cuando te sientas abrumado. Es autocuidado básico, no un tratamiento clínico.'
  },
  {
    id: 6,
    icono: '🌙',
    titulo: 'Higiene del sueño',
    intro: 'Hábitos simples para favorecer un descanso de mejor calidad.',
    duracion: 'Duración sugerida: 15 minutos (rutina nocturna)',
    nivel_riesgo: null,
    pasos: [
      'Define una hora fija para ir a dormir y para despertar.',
      '30 minutos antes, apaga pantallas y baja las luces.',
      'Evita cafeína y comidas pesadas cerca de la hora de dormir.',
      'Crea una rutina relajante: lectura breve, respiración suave o música tranquila.',
      'Mantén el dormitorio oscuro, fresco y silencioso.'
    ],
    instrucciones: 'Establece estos hábitos de forma progresiva. Si los problemas de sueño persisten, consulta a un profesional de la salud. Es autocuidado básico, no tratamiento clínico.'
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