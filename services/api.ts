
/**
 * api.ts - KlenCare Production Gateway with Persistence Shield
 */

const API_BASE_URL = ""; 

const vault = {
  get: (key: string) => {
    const data = localStorage.getItem(`klencare_db_${key}`);
    return data ? JSON.parse(data) : null;
  },
  set: (key: string, data: any) => {
    if (Array.isArray(data)) {
      const local = vault.get(key) || [];
      const localMap = new Map(local.map((i: any) => [i.id, i]));
      data.forEach((item: any) => {
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
  
  if (method === 'GET' && !path.includes('email')) {
    const localData = vault.get(moduleName);
    if (localData) {
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
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();
    if (!response.ok) return { success: false, message: data.message || `Error ${response.status}`, isError: true };

    if (method === 'GET') vault.set(moduleName, data);
    return data;
  } catch (err: any) {
    // Detect if we are in a preview environment without a real backend
    if (path.includes('email')) {
      return { 
        success: false, 
        message: "BACKEND OFFLINE: Email requires KlenCare to be installed on your Hostinger VPS. The 'server.js' file is not running in this preview.", 
        isError: true 
      };
    }

    if (method === 'GET') return vault.get(moduleName) || [];
    if (method === 'POST' || method === 'PUT') return vault.post(moduleName, body);
    
    return { success: false, message: err.message };
  }
}
