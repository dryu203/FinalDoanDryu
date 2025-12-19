import { API_BASE } from '../config/api';
import { getAuthToken } from './auth';

/**
 * Base API client functions
 */

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${path}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${path}`);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${path}`);
  }
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${path}`);
  }
  return res.json();
}

