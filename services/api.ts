
/**
 * api.ts - KlenCare Local API Gateway
 */

const API_BASE = 'http://localhost:3000';

export async function apiRequest(method: string, path: string, body?: any): Promise<any> {
  const token = localStorage.getItem('klencare_token');
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errorText);
        errorMsg = errJson.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err: any) {
    console.error(`[API Error] ${method} ${path}:`, err.message);
    throw err;
  }
}
