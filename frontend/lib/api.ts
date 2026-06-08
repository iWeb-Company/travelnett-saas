const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

interface LoginRequest {
  slug: string;
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface User {
  id: string;
  iweb_client_id: string;
  name: string;
  last_name: string;
  username: string;
}

const IWEB_CLIENT_ID = 'fdd2a8bf-4c81-4743-99e0-5d0443b5465b';

export const apiClient = {

  async loginSystem(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login-system`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  async getMe(token?: string): Promise<User> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    // Logout
  },

  async getParameters(name: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/parameters/${name}?iweb_client_id=${IWEB_CLIENT_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  async deleteParameter(name: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/parameters/${name}/${id}?iweb_client_id=${IWEB_CLIENT_ID}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user info');
    }

    return response.json();
  },

  async createParameter(name: string, data: any, headers: any = null): Promise<void> {
    const isFormData = data instanceof FormData;
    const fetchHeaders: any = headers || {};

    if (!isFormData && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/parameters/${name}?iweb_client_id=${IWEB_CLIENT_ID}`, {
      method: 'POST',
      headers: fetchHeaders,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create user info');
    }

    return response.json();
  },
  async updateParameter(name: string, id: string, data: any, headers: any = null): Promise<void> {
    const isFormData = data instanceof FormData;
    const fetchHeaders: any = headers || {};

    if (!isFormData && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/parameters/${name}/${id}?iweb_client_id=${IWEB_CLIENT_ID}`, {
      method: 'PUT',
      headers: fetchHeaders,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update user info');
    }

    return response.json();
  },
};
