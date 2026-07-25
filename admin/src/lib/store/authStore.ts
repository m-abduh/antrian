import { create } from 'zustand';
import type { Admin } from '../types';

function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeLocalStorage(key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  admin: null,
  isAuthenticated: false,
  login: (token, admin) => {
    setLocalStorage('admin_token', token);
    setLocalStorage('admin_user', JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },
  logout: () => {
    removeLocalStorage('admin_token');
    removeLocalStorage('admin_user');
    set({ token: null, admin: null, isAuthenticated: false });
  },
  hydrate: () => {
    const token = getLocalStorage('admin_token');
    const adminStr = getLocalStorage('admin_user');
    if (token && adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        set({ token, admin, isAuthenticated: true });
      } catch {
        removeLocalStorage('admin_token');
        removeLocalStorage('admin_user');
      }
    }
  },
}));