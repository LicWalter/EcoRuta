const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data.message ||
      data.error ||
      (Array.isArray(data.errors) ? data.errors.map((e) => e.msg || e.message).join(', ') : null) ||
      `Error HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function listarConductores() {
  const res = await fetch(`${API_URL}/api/conductores`, { headers: getAuthHeaders() });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : data.conductores || data.data || [];
}

export async function obtenerConductor(id) {
  const res = await fetch(`${API_URL}/api/conductores/${id}`, { headers: getAuthHeaders() });
  const data = await handleResponse(res);
  return data.conductor || data.data || data;
}

export async function crearConductor(payload) {
  const res = await fetch(`${API_URL}/api/conductores`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function actualizarConductor(id, payload) {
  const res = await fetch(`${API_URL}/api/conductores/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function cambiarEstadoConductor(id, estado) {
  const res = await fetch(`${API_URL}/api/conductores/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estado }),
  });
  return handleResponse(res);
}