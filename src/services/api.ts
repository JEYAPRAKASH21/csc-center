// AWS Cloud API Configuration & Service Client
export const AWS_API_BASE_URL = (import.meta as any).env?.VITE_AWS_API_URL || '';

export const awsApi = {
  // Check AWS Database Health Status
  checkHealth: async () => {
    try {
      const res = await fetch(`${AWS_API_BASE_URL}/api/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Auth: Login
  login: async (email: string, password: string) => {
    const res = await fetch(`${AWS_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  },

  // Auth: Register
  register: async (userData: { email: string; password: string; vleName: string; centerName: string; cscId: string }) => {
    const res = await fetch(`${AWS_API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await res.json();
  },

  // Database Sync: Pull
  pullSync: async (userId: string) => {
    const res = await fetch(`${AWS_API_BASE_URL}/api/sync?userId=${userId}`, { method: 'GET' });
    return await res.json();
  },

  // Database Sync: Push
  pushSync: async (payload: any) => {
    const res = await fetch(`${AWS_API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }
};
