/**
 * Cliente HTTP base para comunicación con el backend (API REST ASP.NET Core)
 * Base URL: http://localhost:5015/api
 */

export const API_BASE_URL = 'http://localhost:5015/api';

/**
 * Petición POST enviando un objeto JSON
 */
export async function postJson(endpoint, data) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    console.warn(`[apiClient] Backend no disponible en ${url}:`, err.message);
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
export async function postFormData(endpoint, formData) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
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
    console.warn(`[apiClient] Backend no disponible en ${url}:`, err.message);
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
export async function getJson(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
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
    console.warn(`[apiClient] Backend no disponible en ${url}:`, err.message);
    return {
      ok: false,
      isNetworkError: true,
      error: 'No fue posible conectar con el servidor backend.'
    };
  }
}