/**
 * Cliente HTTP base para comunicación con el backend (ASP.NET Core Web API)
 * Apunta a http://localhost:5015/api con soporte para JSON y multipart/form-data.
 */

export const API_BASE_URL = 'http://localhost:5015/api';

/**
 * Petición POST con JSON
 */
export async function postJson(endpoint, data = {}, customHeaders = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders
      },
      body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: result.error || 'Ocurrió un error en el servidor.'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: result
    };
  } catch (err) {
    console.warn(`[apiClient] No se pudo conectar con el servidor en ${url}:`, err.message);
    return {
      ok: false,
      isNetworkError: true,
      error: 'No se pudo conectar con el servidor.'
    };
  }
}

/**
 * Petición POST con FormData (para subida de archivos y formularios multipart)
 */
export async function postFormData(endpoint, formData, customHeaders = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    // Al enviar FormData, NO se define 'Content-Type' manualmente
    // para que el navegador genere automáticamente el boundary multipart
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...customHeaders
      },
      body: formData
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: result.error || 'Ocurrió un error al procesar el formulario.'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: result
    };
  } catch (err) {
    console.warn(`[apiClient] No se pudo conectar con el servidor en ${url}:`, err.message);
    return {
      ok: false,
      isNetworkError: true,
      error: 'No se pudo conectar con el servidor.'
    };
  }
}

/**
 * Petición GET con soporte opcional para token Bearer
 */
export async function getJson(endpoint, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: result.error || 'Error al obtener datos.'
      };
    }

    return {
      ok: true,
      status: response.status,
      data: result
    };
  } catch (err) {
    console.warn(`[apiClient] No se pudo conectar con el servidor en ${url}:`, err.message);
    return {
      ok: false,
      isNetworkError: true,
      error: 'No se pudo conectar con el servidor.'
    };
  }
}
