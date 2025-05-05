interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

const API_URL = 'http://localhost:3001';

export const authService = {
  async login(email: string, password: string) {
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
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(email: string, password: string, name?: string) {
    try {
      console.log('Attempting registration with:', { email, password, name });
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.trim(),
          password: password.trim(),
          name: (name || email.split('@')[0]).trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration response:', data);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      console.log('Attempting logout');
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }

      const data = await response.json();
      console.log('Logout response:', data);
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async checkAuth() {
    try {
      console.log('Checking authentication status');
      const response = await fetch(`${API_URL}/auth/check`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Auth check failed');
      }

      const data = await response.json();
      console.log('Auth check response:', data);
      return data;
    } catch (error) {
      console.error('Auth check error:', error);
      throw error;
    }
  },
}; 