
export async function apiRequest(method: string, path: string, body?: any) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
}
