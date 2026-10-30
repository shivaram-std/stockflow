import { AuthResponse, User, Product, DashboardData, Organization } from '../types';

const TOKEN_KEY = 'stockflow_jwt_token';

class ApiClient {
  private baseUrl: string = '/api';
  private onUnauthorizedCallback?: () => void;

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.error ||
        (data?.details ? data.details.map((d: any) => d.message).join(', ') : null) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  public auth = {
    signup: (data: { email: string; password: string; organizationName: string }) =>
      this.request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => this.request<{ user: User }>('/auth/me'),
  };

  // --- Products Endpoints ---
  public products = {
    list: (search?: string) => {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return this.request<{ products: Product[]; total: number }>(`/products${query}`);
    },

    getById: (id: string) => this.request<{ product: Product }>(`/products/${id}`),

    create: (data: {
      name: string;
      sku: string;
      description?: string | null;
      quantityOnHand: number;
      costPrice?: number | null;
      sellingPrice?: number | null;
      lowStockThreshold?: number | null;
    }) =>
      this.request<{ message: string; product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: {
        name?: string;
        sku?: string;
        description?: string | null;
        quantityOnHand?: number;
        costPrice?: number | null;
        sellingPrice?: number | null;
        lowStockThreshold?: number | null;
      }
    ) =>
      this.request<{ message: string; product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<{ message: string; id: string }>(`/products/${id}`, {
        method: 'DELETE',
      }),

    adjustStock: (id: string, adjustment: number, note?: string) =>
      this.request<{ message: string; product: Product }>(`/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ adjustment, note }),
      }),
  };

  // --- Dashboard Endpoints ---
  public dashboard = {
    getStats: () => this.request<DashboardData>('/dashboard/stats'),
  };

  // --- Settings Endpoints ---
  public settings = {
    get: () => this.request<{ settings: Organization }>('/settings'),
    update: (defaultLowStockThreshold: number) =>
      this.request<{ message: string; settings: Organization }>('/settings', {
        method: 'PUT',
        body: JSON.stringify({ defaultLowStockThreshold }),
      }),
  };
}

export const api = new ApiClient();
