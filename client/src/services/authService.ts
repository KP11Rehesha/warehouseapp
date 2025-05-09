interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
  role?: 'ADMIN' | 'WAREHOUSE_STAFF';
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'WAREHOUSE_STAFF';
}

const API_URL = 'http://localhost:3001/api';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting login with:', { email, password });
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.trim(),
          password: password.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response:', data);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(email: string, password: string, name?: string, role?: 'ADMIN' | 'WAREHOUSE_STAFF'): Promise<User> {
    try {
      console.log('Attempting registration with:', { email, password, name, role });
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.trim(),
          password: password.trim(),
          name: (name || email.split('@')[0]).trim(),
          role: role || 'WAREHOUSE_STAFF'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration response:', data);
      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      console.log('Attempting logout');
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async checkAuth(): Promise<User> {
    try {
      console.log('Checking authentication status');
      const response = await fetch(`${API_URL}/auth/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Auth check failed');
      }

      const data = await response.json();
      console.log('Auth check response:', data);
      
      if (!data.user) {
        throw new Error('Invalid response format');
      }

      return data.user;
    } catch (error) {
      console.error('Auth check error:', error);
      throw error;
    }
  },
}; 