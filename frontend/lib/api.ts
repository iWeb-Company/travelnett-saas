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
  iweb_client?: any;
}

interface User {
  id: string;
  iweb_client_id: string;
  name: string;
  last_name: string;
  username: string;
}

export const apiClient = {

  async loginSystem(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login-system`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return response.json();
  },

  async getMe(token?: string): Promise<User> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get user info');
    return response.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => { });
  },

  // ---- PARAMETERS ----

  async getParameters(name: string, iwebClientId?: string): Promise<any> {
    const id = iwebClientId || '';
    const response = await fetch(`${API_BASE_URL}/parameters/${name}?iweb_client_id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Failed to get ${name}`);
    return response.json();
  },

  async deleteParameter(name: string, id: string, iwebClientId?: string): Promise<void> {
    const clientId = iwebClientId || '';
    const response = await fetch(`${API_BASE_URL}/parameters/${name}/${id}?iweb_client_id=${clientId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Failed to delete ${name}`);
  },

  async createParameter(name: string, data: any, iwebClientId?: string, extraHeaders: any = null): Promise<any> {
    const clientId = iwebClientId || '';
    const isFormData = data instanceof FormData;
    const fetchHeaders: any = extraHeaders || {};
    if (!isFormData && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${API_BASE_URL}/parameters/${name}?iweb_client_id=${clientId}`, {
      method: 'POST',
      headers: fetchHeaders,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create ${name}`);
    }
    return response.json();
  },

  async updateParameter(name: string, id: string, data: any, iwebClientId?: string, extraHeaders: any = null): Promise<any> {
    const clientId = iwebClientId || '';
    const isFormData = data instanceof FormData;
    const fetchHeaders: any = extraHeaders || {};
    if (!isFormData && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${API_BASE_URL}/parameters/${name}/${id}?iweb_client_id=${clientId}`, {
      method: 'PUT',
      headers: fetchHeaders,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update ${name}`);
    }
    return response.json();
  },

  // ---- USERS ----

  async getUsers(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${iwebClientId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get users');
    return response.json();
  },

  async createUser(iwebClientId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/create-user/${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user: data }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create user');
    }
    return response.json();
  },

  async updateUser(iwebClientId: string, userId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${iwebClientId}/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user: data }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update user');
    }
    return response.json();
  },

  async deleteUser(iwebClientId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${iwebClientId}/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  async toggleUserStatus(iwebClientId: string, userId: string, active: boolean): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${iwebClientId}/${userId}/status?status=${active}`, {
      method: 'PATCH',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to update user status');
    return response.json();
  },

  // ---- PERMISSIONS ----

  async getPermissions(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/get_permissions?iweb_client_id=${iwebClientId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get permissions');
    return response.json();
  },

  async createPermission(iwebClientId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/create_permission?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create permission');
    return response.json();
  },

  async updatePermission(iwebClientId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/update_permission?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update permission');
    return response.json();
  },

  async deletePermission(iwebClientId: string, permissionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/delete_permission/${permissionId}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete permission');
  },

  // ---- WEB ----

  async getFlyers(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/web/get_flyers?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get flyers');
    return response.json();
  },

  async createFlyer(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/create_flyer?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create flyer');
    return response.json();
  },

  async updateFlyer(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_flyer?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update flyer');
    return response.json();
  },

  async deleteFlyer(iwebClientId: string, flyerId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/web/delete_flyer/${flyerId}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete flyer');
  },

  async getNews(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/web/get_news?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get news');
    return response.json();
  },

  async createNews(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/create_news?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create news');
    return response.json();
  },

  async updateNews(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_news?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update news');
    return response.json();
  },

  async deleteNews(iwebClientId: string, newsId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/web/delete_news/${newsId}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete news');
  },

  async getAccounts(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/web/get_accounts?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get accounts');
    return response.json();
  },

  async createAccount(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/create_accounts?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create account');
    return response.json();
  },

  async updateAccount(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_accounts?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  },

  async deleteAccount(iwebClientId: string, accountId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/web/delete_accounts/${accountId}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete account');
  },

  // SALIDAS

  async getSalidas(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/salidas/get_salidas?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get salidas');
    return response.json();
  },

  async getSalida(iwebClientId: string, id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/salidas/get_salida/${id}?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get salida');
    return response.json();
  },

  async createSalida(iwebClientId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/salidas/create_salida?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create salida');
    return response.json();
  },

  async updateSalida(iwebClientId: string, id: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/salidas/update_salida/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update salida');
    return response.json();
  },

  async deleteSalida(iwebClientId: string, salidaId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/salidas/delete_salida/${salidaId}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete salida');
  },

  // PACKAGES

  async getPackages(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/packages/get_packages?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get packages');
    return response.json();
  },

  async getPackage(iwebClientId: string, id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/packages/get_package/${id}?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get package');
    return response.json();
  },

  async createPackage(iwebClientId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/packages/create_package?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create package');
    return response.json();
  },

  async updatePackage(iwebClientId: string, id: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/packages/update_package/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update package');
    return response.json();
  },

  async deletePackage(iwebClientId: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/packages/delete_package/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete package');
  },

  // RESERVAS / BOOKINGS

  async getReservas(iwebClientId: string, salidaId?: string): Promise<any[]> {
    const hasSalida = salidaId && salidaId !== 'undefined' && salidaId !== 'null' && salidaId !== 'none';
    const url = hasSalida 
      ? `${API_BASE_URL}/reservas/get_reservas?iweb_client_id=${iwebClientId}&salida_id=${salidaId}`
      : `${API_BASE_URL}/reservas/get_reservas?iweb_client_id=${iwebClientId}`;
    const response = await fetch(url, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get reservas');
    return response.json();
  },

  async createReserva(iwebClientId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reservas/create_reserva?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create reserva');
    return response.json();
  },

  async updateReserva(iwebClientId: string, id: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reservas/update_reserva/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update reserva');
    return response.json();
  },

  async deleteReserva(iwebClientId: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reservas/delete_reserva/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete reserva');
  },
};


