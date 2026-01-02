export async function apiRequest(method: string, path: string, body?: any) {
  const token = localStorage.getItem('klencare_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('klencare_session');
    localStorage.removeItem('klencare_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API Error: ${res.statusText}`);
  }

  return res.json();
}