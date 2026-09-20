/**
 * Utilidades de validación para formularios
 */

export function esCampoVacio(valor) {
  return !valor || valor.trim() === '';
}

export function tieneArroba(correo) {
  return Boolean(correo && correo.includes('@'));
}

export function esCorreoValido(correo) {
  if (!correo) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo.trim());
}

export function tieneLongitudMinima(texto, min = 6) {
  return Boolean(texto && texto.trim().length >= min);
}

export function esCodigoSeisDigitos(codigo) {
  return Boolean(codigo && codigo.trim().length === 6 && /^\d{6}$/.test(codigo.trim()));
}