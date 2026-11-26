const TOKEN_KEY = 'bhoomi_setu_jwt_v3';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage limits
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const authTok = token !== undefined ? token : getStoredToken();
  const headers = { 'Content-Type': 'application/json' };
  if (authTok) headers.Authorization = `Bearer ${authTok}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Unexpected response from BhoomiSetu API' };
  }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export function openEventStream(token, onEvent) {
  if (!token || typeof EventSource === 'undefined') return () => {};
  const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
  const events = ['connected', 'state_updated'];
  events.forEach((evt) => {
    es.addEventListener(evt, (e) => {
      try {
        onEvent(evt, JSON.parse(e.data));
      } catch {
        onEvent(evt, {});
      }
    });
  });
  return () => es.close();
}
