/**
 * Servicio para la encuesta de invitado.
 * Permite enviar la encuesta al backend, y si no está disponible
 * guarda la información localmente para no romper el flujo.
 */

import { postJson } from './apiClient.js';

const STORAGE_KEY = 'encuesta_invitado_ultima';
const STORAGE_KEY_SESION = 'encuesta_invitado_front';

/**
 * Guarda las respuestas temporalmente en la sesión del invitado (PB-07).
 * sessionStorage dura lo que dura la sesión del navegador.
 */
export function guardarEncuestaTemporal(payload) {
  const datos = {
    ...payload,
    completado: true,
    fecha: new Date().toISOString()
  };
  sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(datos));
  return datos;
}

export async function enviarEncuestaInvitado(payload) {
  try {
    const result = await postJson('/encuesta/invitado', payload);

    if (result.ok) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enviado: true,
        fecha: new Date().toISOString(),
        payload
      }));
      return { ok: true, data: result.data ?? payload };
    }

    if (result.isNetworkError) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enviado: false,
        fecha: new Date().toISOString(),
        payload,
        error: result.error
      }));

      return {
        ok: true,
        localOnly: true,
        message: 'La encuesta se guardó localmente porque el servidor no respondió.',
        data: payload
      };
    }

    return {
      ok: false,
      error: result.error || 'No se pudo enviar la encuesta.'
    };
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enviado: false,
      fecha: new Date().toISOString(),
      payload,
      error: error.message
    }));

    return {
      ok: true,
      localOnly: true,
      message: 'La encuesta fue guardada localmente.',
      data: payload
    };
  }
}
