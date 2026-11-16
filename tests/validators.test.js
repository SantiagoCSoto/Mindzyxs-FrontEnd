import { describe, it, expect } from 'vitest';
import {
  esCampoVacio,
  tieneArroba,
  esCorreoValido,
  tieneLongitudMinima,
  esCodigoSeisDigitos
} from '../js/utils/validators.js';

describe('validators.js', () => {
  it('esCampoVacio debe validar cadenas vacías, nulas y con espacios', () => {
    expect(esCampoVacio('')).toBe(true);
    expect(esCampoVacio(null)).toBe(true);
    expect(esCampoVacio(undefined)).toBe(true);
    expect(esCampoVacio('   ')).toBe(true);
    expect(esCampoVacio('texto')).toBe(false);
  });

  it('tieneArroba debe verificar la presencia de @', () => {
    expect(tieneArroba('correo@test.com')).toBe(true);
    expect(tieneArroba('correo.sin.arroba')).toBe(false);
    expect(tieneArroba('')).toBe(false);
    expect(tieneArroba(null)).toBe(false);
  });

  it('esCorreoValido debe validar formato estándar de correo', () => {
    expect(esCorreoValido('test@example.com')).toBe(true);
    expect(esCorreoValido('usuario.123@sub.dominio.org')).toBe(true);
    expect(esCorreoValido('invalido')).toBe(false);
    expect(esCorreoValido('invalido@')).toBe(false);
    expect(esCorreoValido('@dominio.com')).toBe(false);
    expect(esCorreoValido('')).toBe(false);
    expect(esCorreoValido(null)).toBe(false);
  });

  it('tieneLongitudMinima debe validar la longitud mínima de caracteres', () => {
    expect(tieneLongitudMinima('123456', 6)).toBe(true);
    expect(tieneLongitudMinima('1234567', 6)).toBe(true);
    expect(tieneLongitudMinima('12345', 6)).toBe(false);
    expect(tieneLongitudMinima('', 6)).toBe(false);
    expect(tieneLongitudMinima(null, 6)).toBe(false);
    expect(tieneLongitudMinima('123456')).toBe(true);
    expect(tieneLongitudMinima('123')).toBe(false);
  });

  it('esCodigoSeisDigitos debe validar exactamente 6 dígitos numéricos', () => {
    expect(esCodigoSeisDigitos('123456')).toBe(true);
    expect(esCodigoSeisDigitos('000000')).toBe(true);
    expect(esCodigoSeisDigitos('12345')).toBe(false);
    expect(esCodigoSeisDigitos('1234567')).toBe(false);
    expect(esCodigoSeisDigitos('abcdef')).toBe(false);
    expect(esCodigoSeisDigitos('12345a')).toBe(false);
    expect(esCodigoSeisDigitos('')).toBe(false);
    expect(esCodigoSeisDigitos(null)).toBe(false);
  });
});
