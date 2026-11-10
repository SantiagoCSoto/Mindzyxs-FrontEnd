/**
 * Consentimiento de cookies y almacenamiento local (Mindzyxs).
 * Categorías honestas:
 *  - necesarias: sesión (token, usuario, rol, autenticado). Sin ellas no hay login.
 *  - funcionales: modo invitado (cuest_*, riesgo_*), aviso aceptado, borradores
 *    locales (historiales, último registro, alerta, recordatorio). Sin ellas el
 *    invitado repite cuestionarios y se pierden borradores (nada esencial se bloquea).
 * No hay analytics ni marketing.
 */

const KEY = 'mz_consent';

export function obtenerConsentimiento() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (typeof c.funcionales !== 'boolean') return null;
    return c;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(funcionales) {
  const c = { necesarias: true, funcionales: !!funcionales, fecha: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    // almacenamiento no disponible: se trata como no otorgado
  }
  return c;
}

/** True solo si el usuario aceptó funcionales explícitamente. */
export function consentFuncional() {
  const c = obtenerConsentimiento();
  return !!c && c.funcionales === true;
}
