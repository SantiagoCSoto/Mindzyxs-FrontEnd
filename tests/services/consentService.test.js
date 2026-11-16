import { describe, it, expect, beforeEach } from 'vitest';
import {
  obtenerConsentimiento,
  guardarConsentimiento,
  consentFuncional
} from '../../js/services/consentService.js';

describe('consentService.js', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('obtenerConsentimiento debe retornar null si no existe', () => {
    expect(obtenerConsentimiento()).toBeNull();
  });

  it('guardarConsentimiento debe persistir las preferencias correctamente', () => {
    const res = guardarConsentimiento(true);
    expect(res.necesarias).toBe(true);
    expect(res.funcionales).toBe(true);
    expect(typeof res.fecha).toBe('string');

    const obtenido = obtenerConsentimiento();
    expect(obtenido.funcionales).toBe(true);
  });

  it('consentFuncional debe retornar true solo si funcionales es true', () => {
    expect(consentFuncional()).toBe(false);

    guardarConsentimiento(false);
    expect(consentFuncional()).toBe(false);

    guardarConsentimiento(true);
    expect(consentFuncional()).toBe(true);
  });

  it('obtenerConsentimiento debe manejar JSON corrupto en localStorage', () => {
    localStorage.setItem('mz_consent', 'invalid-json{{{');
    expect(obtenerConsentimiento()).toBeNull();
  });
});
