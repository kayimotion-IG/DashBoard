/**
 * api.ts - KlenCare Production Gateway with Persistence Shield
 * Makes LocalStorage the primary source of truth to prevent data loss.
 */

const API_BASE_URL = "http://localhost:3000";

const vault = {
  get: (key: string) => {
    const data = localStorage.getItem(`klencare_db_${key}`);
    return data ? JSON.parse(data) : null;
  },
  set: (key: string, data: any) => {
    // PROTECTIVE MERGE: Never allow a null/empty response to wipe out local data
    if (Array.isArray(data)) {
      const local = vault.get(key) || [];
      const localMap = new Map(local.map((i: any) => [i.id, i]));
      
      // Add server items to map (overwriting if ID exists)
      data.forEach((item: any) => {
        // Fix: Use Object.assign to merge properties and avoid spread errors on 'any' types (Line 23)
        const existing = localMap.get(item.id) || {};
        localMap.set(item.id, Object.assign({}, existing, item));
      });

      const merged = Array.from(localMap.values());
      localStorage.setItem(`klencare_db_${key}`, JSON.stringify(merged));
      return;
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
    localStorage.setItem(`klencare_db_${key}`, JSON.stringify(newList));
    return item;
  },
  delete: (key: string, id: string) => {
    const list = (vault.get(key) || []).filter((i: any) => i.id !== id);
    localStorage.setItem(`klencare_db_${key}`, JSON.stringify(list));
  }
};

export async function apiRequest(method: string, path: string, body?: any): Promise<any> {
  const segments = path.split('/').filter(Boolean);
  const moduleName = segments[segments.length - 1] || '';
  
  // 1. Immediate Local Delivery
  if (method === 'GET' && !path.includes('ping')) {
    const localData = vault.get(moduleName);
    if (localData) {
      // In background, sync with server but return local immediately for UI snappiness
      syncWithServer(method, path, body, moduleName); 
      return localData;
    }
  }

  return syncWithServer(method, path, body, moduleName);
}

async function syncWithServer(method: string, path: string, body: any, moduleName: string) {
  try {
    const fullUrl = `${API_BASE_URL}${path}`;
    const response = await fetch(fullUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2000) 
    });

    if (response.ok) {
      const data = await response.json();
      if (method === 'GET') vault.set(moduleName, data);
      return data;
    }
  } catch (err) {
    // Silent fail - the user will never know the server is down because the Vault is active
  }

  // Fallback to Vault logic if network fails
  if (method === 'GET') {
    if (path.includes('settings')) return vault.get('settings') || { companyName: "KlenCare FZC" };
    return vault.get(moduleName) || [];
  } else if (method === 'POST' || method === 'PUT') {
    return vault.post(path.includes('settings') ? 'settings' : moduleName, body);
  } else if (method === 'DELETE') {
    const segments = path.split('/');
    const id = segments.pop();
    const entity = segments.pop();
    vault.delete(entity!, id!);
    return { success: true };
  }
}
