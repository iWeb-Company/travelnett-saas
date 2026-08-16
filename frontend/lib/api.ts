const API_BASE_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.INTERNAL_API_URL || 'http://localhost:8000');

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

interface PublicTenantInfo {
  id: string;
  name: string;
  slug: string;
  status: boolean;
  logo_xl: string;
  logo_s: string;
}

const IWEB_CLIENT_ID = 'fdd2a8bf-4c81-4743-99e0-5d0443b5465b';
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

function setTokenCookie(token: string) {
  if (typeof window === 'undefined') return;
  const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  document.cookie = `access_token=${encodeURIComponent(bearerToken)}; path=/; max-age=2592000; SameSite=Lax`;
}

export const apiClient = {
  async getPublicTenantInfo(slug: string): Promise<PublicTenantInfo> {
    const response = await fetch(`${API_BASE_URL}/iweb-clients/public/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Tenant '${slug}' no encontrado`);
    }

    return response.json();
  },


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
    const res: LoginResponse = await response.json();
    if (res.access_token) {
      setTokenCookie(res.access_token);
    }
    return res;
  },

  async getMe(token?: string): Promise<User> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const activeToken = token || getStoredToken();
    if (activeToken) {
      headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
    }
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('iweb_client');
        await this.logout().catch(() => { });
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error('Session expired');
    }
    if (!response.ok) throw new Error('Failed to get user info');
    return response.json();
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
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
    });
    if (!response.ok) throw new Error(`Failed to get ${name}`);
    return response.json();
  },

  async getTransportCompanies(iwebClientId?: string): Promise<any[]> {
    const id = iwebClientId || '';
    const response = await fetch(`${API_BASE_URL}/parameters/get_transport_companies?iweb_client_id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return [];
    return response.json();
  },

  async getAllParameters(iwebClientId?: string): Promise<{ destinos: any[]; hotels: any[]; excursions: any[]; periods: any[]; regimenes: any[] }> {
    const id = iwebClientId || '';
    const response = await fetch(`${API_BASE_URL}/parameters/get_all_parameters?iweb_client_id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get all parameters');
    return response.json();
  },

  async deleteParameter(name: string, id: string, iwebClientId?: string): Promise<any> {
    const clientId = iwebClientId || '';
    const response = await fetch(`${API_BASE_URL}/parameters/${name}/${id}?iweb_client_id=${clientId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const error: any = new Error(err.detail || `Failed to delete ${name}`);
      error.status = response.status;
      error.statusCode = response.status;
      error.detail = err.detail || `Failed to delete ${name}`;
      throw error;
    }
    return response.json().catch(() => ({ success: true }));
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

  async duplicateReserva(iwebClientId: string, id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reservas/duplicate_reserva/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to duplicate reserva');
    return response.json();
  },

  async getReservaById(iwebClientId: string, id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reservas/get_reserva/${id}?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get reserva by id');
    return response.json();
  },

  async updateReservationPassenger(iwebClientId: string, rpId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reservas/update_reservation_passenger/${rpId}?iweb_client_id=${iwebClientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update reservation passenger');
    return response.json();
  },

  async getVoucher(iwebClientId: string, reservaId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/vouchers/get_voucher/${reservaId}?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('iweb_client');
        await this.logout().catch(() => { });
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to get voucher');
    }
    return response.json();
  },

  async generateVoucher(iwebClientId: string, reservaId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/vouchers/generate_voucher?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reserva_id: reservaId }),
    });
    if (!response.ok) throw new Error('Failed to generate voucher');
    return response.json();
  },

  async getPassengers(
    iwebClientId: string,
    filters?: { name?: string; last_name?: string; dni?: string | number; reservation_number?: string }
  ): Promise<any[]> {
    let url = `${API_BASE_URL}/parameters/get_passengers?iweb_client_id=${iwebClientId}`;
    if (filters) {
      if (filters.name) url += `&name=${encodeURIComponent(filters.name)}`;
      if (filters.last_name) url += `&last_name=${encodeURIComponent(filters.last_name)}`;
      if (filters.dni) url += `&dni=${filters.dni}`;
      if (filters.reservation_number) url += `&reservation_number=${encodeURIComponent(filters.reservation_number)}`;
    }
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to get passengers');
    return response.json();
  },

  async getPassengerByName(iwebClientId: string, name: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/parameters/get_passengers?iweb_client_id=${iwebClientId}&name=${encodeURIComponent(name)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get passengers by name');
    return response.json();
  },

  async getPassengerByLastName(iwebClientId: string, lastName: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/parameters/get_passengers?iweb_client_id=${iwebClientId}&last_name=${encodeURIComponent(lastName)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get passengers by last name');
    return response.json();
  },

  async getPassengerByDNI(iwebClientId: string, dni: number | string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/parameters/get_passengers?iweb_client_id=${iwebClientId}&dni=${dni}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get passengers by DNI');
    return response.json();
  },

  async getPassengerByReservationNumber(iwebClientId: string, reservationNumber: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/parameters/get_passengers?iweb_client_id=${iwebClientId}&reservation_number=${encodeURIComponent(reservationNumber)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get passengers by reservation number');
    return response.json();
  },

  // PAGOS
  async getPagosReserva(iwebClientId: string, reservaId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/get_pagos_reserva/${reservaId}?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get pagos');
    return response.json();
  },

  async getSaldosClientes(
    iwebClientId: string,
    params?: {
      clientId?: string;
      fechaCreaDesde?: string;
      fechaCreaHasta?: string;
      fechaInDesde?: string;
      fechaInHasta?: string;
    } | string
  ): Promise<any[]> {
    let url = `${API_BASE_URL}/get_saldos_clientes?iweb_client_id=${iwebClientId}`;
    if (typeof params === 'string') {
      if (params) url += `&client_id=${params}`;
    } else if (params) {
      if (params.clientId) url += `&client_id=${params.clientId}`;
      if (params.fechaCreaDesde) url += `&fecha_crea_desde=${params.fechaCreaDesde}`;
      if (params.fechaCreaHasta) url += `&fecha_crea_hasta=${params.fechaCreaHasta}`;
      if (params.fechaInDesde) url += `&fecha_in_desde=${params.fechaInDesde}`;
      if (params.fechaInHasta) url += `&fecha_in_hasta=${params.fechaInHasta}`;
    }
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to get saldos');
    return response.json();
  },

  async getCCProvidersConsumptionPayments(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/get_cc_providers_consumption_payments?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get cc providers consumption payments');
    return response.json();
  },

  async createCCProviderConsumptionPayment(data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/create_cc_providers_consumption_payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create cc provider consumption payment');
    return response.json();
  },

  async createPago(iwebClientId: string, data: FormData | Record<string, any>): Promise<any> {
    let bodyData: FormData;
    if (data instanceof FormData) {
      bodyData = data;
    } else {
      bodyData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          bodyData.append(key, String(val));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/create_pago?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: bodyData,
    });
    if (!response.ok) throw new Error('Failed to create pago');
    return response.json();
  },

  async deletePago(iwebClientId: string, id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/delete_pago/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete pago');
    return response.json();
  },

  async getTesoroMovimientos(
    iwebClientId: string,
    params?: {
      accountId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    movimientos: any[];
    total_ingresos: number;
    total_egresos: number;
    saldo_total: number;
  }> {
    let url = `${API_BASE_URL}/tesoro/get_movimientos?iweb_client_id=${iwebClientId}`;
    if (params?.accountId) url += `&account_id=${params.accountId}`;
    if (params?.startDate) url += `&start_date=${params.startDate}`;
    if (params?.endDate) url += `&end_date=${params.endDate}`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to get tesoro movimientos');
    return response.json();
  },

  async createTesoroMovimiento(data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tesoro/create_movimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create tesoro movimiento');
    return response.json();
  },

  async createTesoroPase(data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tesoro/create_pase_dinero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create tesoro pase de dinero');
    return response.json();
  },

  async getLiquidacionByBooking(bookingId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/liquidaciones/get_liquidacion_by_booking/${bookingId}`, {
      credentials: 'include',
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to get liquidacion');
    return response.json();
  },

  async createLiquidacion(data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/liquidaciones/create_liquidacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create liquidacion');
    return response.json();
  },

  async updateLiquidacion(id: string, data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/liquidaciones/update_liquidacion/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update liquidacion');
    return response.json();
  },

  // --- FORMA DE PAGO & WEB ACCOUNTS/CARDS ---
  async getFormaDePago(iwebClientId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/get_forma_de_pago?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch forma de pago');
    return response.json();
  },

  async updateFormaDePago(iwebClientId: string, data: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_forma_de_pago?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      credentials: 'include',
      body: data,
    });
    if (!response.ok) throw new Error('Failed to update forma de pago');
    return response.json();
  },

  async getAccountsWeb(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/web/get_accounts_web?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch web accounts');
    return response.json();
  },

  async createAccountWeb(iwebClientId: string, data: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/create_account_web?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: data,
    });
    if (!response.ok) throw new Error('Failed to create web account');
    return response.json();
  },

  async updateAccountWeb(iwebClientId: string, data: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_account_web?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      credentials: 'include',
      body: data,
    });
    if (!response.ok) throw new Error('Failed to update web account');
    return response.json();
  },

  async deleteAccountWeb(iwebClientId: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/web/delete_account_web/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete web account');
  },

  async getCardsWeb(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/web/get_cards_web?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch cards web');
    return response.json();
  },

  async createCardWeb(iwebClientId: string, data: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/create_card_web?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: data,
    });
    if (!response.ok) throw new Error('Failed to create card web');
    return response.json();
  },

  async updateCardWeb(iwebClientId: string, data: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_card_web?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      credentials: 'include',
      body: data,
    });
    if (!response.ok) throw new Error('Failed to update card web');
    return response.json();
  },

  async deleteCardWeb(iwebClientId: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/web/delete_card_web/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete card web');
  },

  async getCards(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/cards/get_cards?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch cards');
    return response.json();
  },

  async createCard(iwebClientId: string, payload: { name: string; status?: boolean }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/cards/create_card?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create card');
    return response.json();
  },

  async updateCard(iwebClientId: string, id: string, payload: { name?: string; status?: boolean }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/cards/update_card/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to update card');
    return response.json();
  },

  async deleteCard(iwebClientId: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cards/delete_card/${id}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to delete card');
  },

  async getDashboardSummary(iwebClientId: string): Promise<{
    proxima_salida: string;
    reservas_hoy: number;
    saldo_mes: string;
    reservas_mes: number;
    paquetes_activos: number;
    cliente_del_mes: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard summary');
    return response.json();
  },

  async getDocumentations(iwebClientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/web/get_documentations?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch documentations');
    return response.json();
  },

  async createDocumentation(iwebClientId: string, payload: { title: string; body: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/create_documentation?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create documentation');
    return response.json();
  },

  async updateDocumentation(iwebClientId: string, payload: { id: string; title?: string; body?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_documentation?iweb_client_id=${iwebClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update documentation');
    return response.json();
  },

  async deleteDocumentation(iwebClientId: string, docId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/web/delete_documentation/${docId}?iweb_client_id=${iwebClientId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete documentation');
  },

  async getInicioWeb(iwebClientId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/get_inicio?iweb_client_id=${iwebClientId}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch inicio web');
    return response.json();
  },

  async updateInicioWeb(iwebClientId: string, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/update_inicio?iweb_client_id=${iwebClientId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update inicio web');
    return response.json();
  },
};


