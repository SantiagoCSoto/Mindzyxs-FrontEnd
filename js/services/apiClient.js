/**
 * Cliente HTTP base para comunicación con el backend (API REST ASP.NET Core)
 * Base URL: http://localhost:5015/api
 */

export const API_BASE_URL = 'http://localhost:5015/api';

function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
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
      body: JSON.stringify(data)
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
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
    return {
      ok: false,
      isNetworkError: true,
      error: 'No fue posible conectar con el servidor backend.'
    };
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
      body: formData
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
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
    return {
      ok: false,
      isNetworkError: true,
      error: 'No fue posible conectar con el servidor backend.'
    };
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
      }
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const resData = isJson ? await response.json() : null;

    if (!response.ok) {
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
    return {
      ok: false,
      isNetworkError: true,
      error: 'No fue posible conectar con el servidor backend.'
    };
  }
}

/**
 * Petición GET devolviendo un Blob (para descarga de archivos).
 */
export async function getBlob(endpoint, opciones = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders(),
        ...opciones.headers
      }
    });

    if (!response.ok) {
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
    return { ok: false, isNetworkError: true, error: 'No fue posible conectar con el servidor backend.' };
  }
}
