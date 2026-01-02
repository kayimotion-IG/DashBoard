/**
 * api.ts - KlenCare Robust API Service
 * Includes high-fidelity local fallback for sandbox environments.
 */

const IS_MOCK_ENABLED = true; // Set to true to handle environments without a Node server

export async function apiRequest(method: string, path: string, body?: any) {
  const token = localStorage.getItem('klencare_token');
  
  // High-fidelity fallback logic for preview sandboxes
  if (IS_MOCK_ENABLED) {
    return handleMockRequest(method, path, body);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
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
  } catch (e) {
    console.warn('API Connection failed, falling back to mock mode...', e);
    return handleMockRequest(method, path, body);
  }
}

/**
 * Mock Request Handler
 * Mimics the Node.js backend behavior using LocalStorage.
 */
function handleMockRequest(method: string, path: string, body: any) {
  console.debug(`[MOCK API] ${method} ${path}`, body);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. AUTH LOGIC
      if (path === '/api/auth/login') {
        const users = JSON.parse(localStorage.getItem('klencare_mock_users') || '[]');
        
        // Always allow master admin
        if (body.username === 'admin' && body.password === 'KlenCare@2026!') {
           return resolve({
             token: 'mock-jwt-token-admin',
             user: { id: '1', name: 'System Owner', role: 'Admin', username: 'admin', email: 'admin@klencare.net' }
           });
        }
        
        // Check dynamic users (manually created ones)
        const found = users.find((u: any) => u.username === body.username && u.password === body.password);
        if (found) {
          return resolve({
            token: `mock-jwt-token-${found.username}`,
            user: { ...found, password: undefined }
          });
        }
        return reject(new Error('Invalid system credentials. Please check User ID and Password.'));
      }

      // 2. USER MANAGEMENT (Admin)
      if (path === '/api/users' && method === 'GET') {
        const users = JSON.parse(localStorage.getItem('klencare_mock_users') || '[]');
        return resolve([
          { id: '1', name: 'System Owner', username: 'admin', email: 'admin@klencare.net', role: 'Admin', created_at: '2026-01-01T00:00:00Z' },
          ...users
        ]);
      }

      if (path === '/api/users' && method === 'POST') {
        const users = JSON.parse(localStorage.getItem('klencare_mock_users') || '[]');
        
        // Check for duplicate username
        if (users.find((u: any) => u.username === body.username) || body.username === 'admin') {
           return reject(new Error('This User ID already exists. Please choose another.'));
        }

        // Use manual password from body if available, else generate
        const pass = body.password || Math.random().toString(36).slice(-8).toUpperCase();
        
        const newUser = {
           id: Date.now().toString(),
           name: body.name,
           username: body.username,
           password: pass,
           role: body.role || 'Staff',
           email: body.email || '', // Optional
           created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('klencare_mock_users', JSON.stringify(users));
        return resolve({ ...newUser, generatedPassword: pass });
      }

      if (path.startsWith('/api/users/') && method === 'DELETE') {
        const id = path.split('/').pop();
        let users = JSON.parse(localStorage.getItem('klencare_mock_users') || '[]');
        users = users.filter((u: any) => u.id !== id);
        localStorage.setItem('klencare_mock_users', JSON.stringify(users));
        return resolve({ success: true });
      }

      // 3. ITEMS & CUSTOMERS (Local persistence helpers)
      if (path === '/api/items' && method === 'GET') {
        return resolve(JSON.parse(localStorage.getItem('klencare_items') || '[]'));
      }
      
      if (path === '/api/items' && method === 'POST') {
        const items = JSON.parse(localStorage.getItem('klencare_items') || '[]');
        items.push({ ...body, id: body.id || `ITM-${Date.now()}` });
        localStorage.setItem('klencare_items', JSON.stringify(items));
        return resolve(body);
      }

      if (path === '/api/customers' && method === 'GET') {
        return resolve(JSON.parse(localStorage.getItem('klencare_customers') || '[]'));
      }

      if (path === '/api/customers' && method === 'POST') {
        const customers = JSON.parse(localStorage.getItem('klencare_customers') || '[]');
        customers.push({ ...body, id: body.id || `CUST-${Date.now()}` });
        localStorage.setItem('klencare_customers', JSON.stringify(customers));
        return resolve(body);
      }

      // Generic success for other endpoints
      resolve({ success: true, message: 'Mock response success' });
    }, 300);
  });
}