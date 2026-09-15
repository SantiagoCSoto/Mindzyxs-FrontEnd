/**
 * Cliente HTTP base para comunicación con el backend (API REST)
 * Contiene la configuración compartida y helpers de red.
 */

export const API_BASE_URL = 'http://localhost:3000/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[apiClient] Petición a ${url} simulada o fallida:`, error.message);
    throw error;
  }
}