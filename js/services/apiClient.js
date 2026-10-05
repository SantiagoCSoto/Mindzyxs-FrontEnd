/**
 * Cliente HTTP base para comunicación con el backend (API REST ASP.NET Core)
 * Base URL: http://localhost:5015/api
 */

export const API_BASE_URL = 'http://localhost:5015/api';

const TIMEOUT_MS = 8000;

function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/** Endpoints de autenticación: un 401 aquí es error de credenciales, no sesión expirada. */
function esEndpointAuth(endpoint) {
  return ['/account/login', '/account/verify', '/account/resend', '/account/forgot']
    .some((p) => endpoint.startsWith(p));
}

/** Escapado estricto contra XSS para renderizar texto del backend en el DOM. */
export function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function conTimeout(signal) {
  try {
    const t = AbortSignal.timeout(TIMEOUT_MS);
    if (signal && typeof AbortSignal.any === 'function') return AbortSignal.any([signal, t]);
    return t;
  } catch {
    return signal;
  }
}

/** 401 fuera de auth = sesión expirada/inválida: limpia sesión y va a login. */
function manejarNoAutorizado(endpoint) {
  if (esEndpointAuth(endpoint)) return;
  try {
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('autenticado');
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
  } catch {
    // sin almacenamiento o sin DOM: no se puede redirigir
  }
}

function errorRed(err) {
  const timeout = err && err.name === 'AbortError';
  return {
    ok: false,
    isNetworkError: true,
    error: timeout ? 'La solicitud tardó demasiado. Intente nuevamente.' : 'No fue posible conectar con el servidor backend.'
  };
}

/**
 * Petición POST enviando un objeto JSON
 */
export async function postJson(endpoint, data, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
        ...opciones.headers
      },
      body: JSON.stringify(data),
      signal: conTimeout(opciones.signal)
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) manejarNoAutorizado(endpoint);
      return {
        ok: false,
        status: response.status,
        error: resData?.error || resData?.message || 'Error en la solicitud'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: resData
    };
  } catch (err) {
    return errorRed(err);
  }
}

/**
 * Petición PUT enviando un objeto JSON
 */
export async function putJson(endpoint, data, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
        ...opciones.headers
      },
      body: JSON.stringify(data),
      signal: conTimeout(opciones.signal)
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) manejarNoAutorizado(endpoint);
      return {
        ok: false,
        status: response.status,
        error: resData?.error || resData?.message || 'Error en la solicitud'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: resData
    };
  } catch (err) {
    return errorRed(err);
  }
}

/**
 * Petición POST enviando un FormData (multipart/form-data)
 */
export async function postFormData(endpoint, formData, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        ...opciones.headers
      },
      body: formData,
      signal: conTimeout(opciones.signal)
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) manejarNoAutorizado(endpoint);
      return {
        ok: false,
        status: response.status,
        error: resData?.error || resData?.message || 'Error en la solicitud'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: resData
    };
  } catch (err) {
    return errorRed(err);
  }
}

/**
 * Petición GET esperando respuesta JSON
 */
export async function getJson(endpoint, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...authHeaders(),
        ...opciones.headers
      },
      signal: conTimeout(opciones.signal)
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) manejarNoAutorizado(endpoint);
      return {
        ok: false,
        status: response.status,
        error: resData?.error || resData?.message || 'Error en la solicitud'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: resData
    };
  } catch (err) {
    return errorRed(err);
  }
}

/**
 * Petición DELETE esperando respuesta JSON
 */
export async function deleteJson(endpoint, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...authHeaders(),
        ...opciones.headers
      },
      signal: conTimeout(opciones.signal)
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) manejarNoAutorizado(endpoint);
      return {
        ok: false,
        status: response.status,
        error: resData?.error || resData?.message || 'Error en la solicitud'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: resData
    };
  } catch (err) {
    return errorRed(err);
  }
}

/**
 * Petición GET devolviendo un Blob (para descarga de archivos).
 */export async function getBlob(endpoint, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders(),
        ...opciones.headers
      },
      signal: conTimeout(opciones.signal)
    });

    if (!response.ok) {
      if (response.status === 401) manejarNoAutorizado(endpoint);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const resData = isJson ? await response.json() : null;
      return {
        ok: false,
        status: response.status,
        error: resData?.error || 'Error al descargar archivo'
      };
    }

    const blob = await response.blob();
    return { ok: true, status: response.status, blob };
  } catch (err) {
    return errorRed(err);
  }
}
