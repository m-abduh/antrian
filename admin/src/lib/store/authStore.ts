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
  login: (admin: Admin) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  admin: null,
  isAuthenticated: false,
  login: (admin) => {
    setLocalStorage('admin_user', JSON.stringify(admin));
    set({ token: 'cookie', admin, isAuthenticated: true });
  },
  logout: () => {
    removeLocalStorage('admin_user');
    set({ token: null, admin: null, isAuthenticated: false });
  },
  hydrate: () => {
    const adminStr = getLocalStorage('admin_user');
    if (adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        set({ token: 'cookie', admin, isAuthenticated: true });
      } catch {
        removeLocalStorage('admin_user');
      }
    }
  },
}));
