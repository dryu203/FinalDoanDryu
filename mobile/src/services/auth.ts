import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

const STORAGE_KEY_USER = 'auth.user';
const STORAGE_KEY_TOKEN = 'auth.token';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'local' | 'google';
  role?: 'user' | 'admin';
  status?: 'active' | 'locked';
};

// Lưu token vào SecureStore (an toàn hơn)
// Lưu user vào AsyncStorage (chỉ là metadata)
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function setAuthUser(user: AuthUser | null): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
    await SecureStore.deleteItemAsync(STORAGE_KEY_TOKEN);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export async function signOut(): Promise<void> {
  await setAuthUser(null);
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (!token) {
    await SecureStore.deleteItemAsync(STORAGE_KEY_TOKEN);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY_TOKEN, token);
}

// Login với email/password
export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  try {
    console.log('[Auth] Attempting login to:', `${API_BASE}/api/auth/login`);
    
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = errorText;
      
      // Try to parse as JSON for better error message
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        // Not JSON, use text as is
      }
      
      console.error('[Auth] Login failed:', res.status, errorMessage);
      throw new Error(errorMessage || `Đăng nhập thất bại: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    if (!data.user || !data.token) {
      throw new Error('Server không trả về thông tin đăng nhập đầy đủ');
    }
    
    const { user, token } = data;
    
    console.log('[Auth] Login successful, saving user and token');
    await setAuthUser(user);
    await setAuthToken(token);
    
    // Verify saved
    const savedUser = await getAuthUser();
    if (!savedUser) {
      throw new Error('Không thể lưu thông tin đăng nhập');
    }
    
    console.log('[Auth] User saved successfully');
    return { user, token };
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    
    // Improve error message for network errors
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch') ||
        error.name === 'TypeError') {
      throw new Error(`Không thể kết nối đến server.\n\nKiểm tra:\n- Backend đang chạy?\n- API URL: ${API_BASE}\n- Cùng WiFi network?\n- Firewall không chặn?`);
    }
    throw error;
  }
}

// Register
export async function register(email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `Registration failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const { user, token } = data;

    await setAuthUser(user);
    await setAuthToken(token);

    return { user, token };
  } catch (error: any) {
    // Improve error message for network errors
    if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
      throw new Error(`Không thể kết nối đến server. Kiểm tra:\n- Backend đang chạy?\n- API URL: ${API_BASE}\n- Cùng WiFi network?`);
    }
    throw error;
  }
}

// Lấy thông tin user hiện tại từ server
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const user = await res.json();
    await setAuthUser(user);
    return user;
  } catch {
    return null;
  }
}

// Helper để tạo headers với auth token
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

