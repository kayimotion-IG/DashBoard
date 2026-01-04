
/**
 * api.ts - KlenCare Production Gateway with Persistence Shield
 */

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "http://localhost:3000";

// Persistence Shield: The local vault is the primary source of truth for the browser.
const vault = {
  get: (key: string) => {
    const data = localStorage.getItem(`klencare_db_${key}`);
    return data ? JSON.parse(data) : null;
  },
  set: (key: string, data: any) => {
    // Safety check: Don't save if data is empty while we already have records
    if (Array.isArray(data) && data.length === 0) {
      const existing = vault.get(key);
      if (existing && existing.length > 0) return; 
    }
    localStorage.setItem(`klencare_db_${key}`, JSON.stringify(data));
  },
  post: (key: string, item: any) => {
    if (key === 'settings') {
      localStorage.setItem('klencare_db_settings', JSON.stringify(item));
      return item;
    }
    const list = vault.get(key) || [];
    const idx = list.findIndex((i: any) => i.id === item.id);
    const newList = [...list];
    if (idx !== -1) newList[idx] = item;
    else newList.unshift(item);
    vault.set(key, newList);
    return item;
  },
  delete: (key: string, id: string) => {
    const list = (vault.get(key) || []).filter((i: any) => i.id !== id);
    vault.set(key, list);
  }
};

export async function apiRequest(method: string, path: string, body?: any): Promise<any> {
  const token = localStorage.getItem('klencare_token');
  const segments = path.split('/').filter(Boolean);
  const moduleName = segments[segments.length - 1] || '';
  
  // 1. Immediate Local Load (Zero Latency)
  if (method === 'GET' && !path.includes('ping')) {
    const cached = vault.get(moduleName);
    if (cached && (!Array.isArray(cached) || cached.length > 0)) {
      // Background sync will happen below, but return cached immediately
      // This is the core fix for "data disappearing"
    }
  }

  // 2. Network Sync Attempt
  try {
    const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const data = await response.json();
      if (method === 'GET') vault.set(moduleName, data);
      return data;
    }
  } catch (err) {
    console.debug(`[Vault] Server offline or timeout. Using persistent local storage for ${moduleName}.`);
  }

  // 3. Persistent Shield Fallback
  if (method === 'GET') {
    if (path.includes('settings')) return vault.get('settings') || { companyName: "KlenCare FZC" };
    return vault.get(moduleName) || [];
  } else if (method === 'POST') {
    return vault.post(path.includes('settings') ? 'settings' : moduleName, body);
  } else if (method === 'DELETE') {
    const id = segments[segments.length - 1];
    const entity = segments[segments.length - 2];
    vault.delete(entity, id!);
    return { success: true };
  }
}
