/**
 * API Configuration
 * 
 * Để cấu hình API URL cho production:
 * 1. Tạo file .env trong frontend/
 * 2. Thêm: VITE_API_BASE=https://your-backend-url.com
 * 3. Rebuild: npm run build
 * 
 * Hoặc có thể set qua URL query param: ?api_base=https://backend-url.com
 */

export function getApiBase(): string {
  // 1. Kiểm tra environment variable trước (từ .env khi build)
  const env = (import.meta as any).env;
  if (env?.VITE_API_BASE) {
    const base = String(env.VITE_API_BASE).replace(/\/$/, '');
    if (base) {
      console.log('[API] Using VITE_API_BASE:', base);
      return base;
    }
  }

  // 2. Kiểm tra URL query parameter (để test nhanh: ?api_base=https://...)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const apiBaseFromUrl = params.get('api_base');
    if (apiBaseFromUrl) {
      // Lưu vào localStorage để dùng cho các request sau
      try {
        localStorage.setItem('app_api_base', apiBaseFromUrl);
        console.log('[API] Using api_base from URL param:', apiBaseFromUrl);
      } catch {}
      return apiBaseFromUrl.replace(/\/$/, '');
    }

    // 3. Kiểm tra localStorage (fallback)
    try {
      const apiBaseFromStorage = localStorage.getItem('app_api_base');
      if (apiBaseFromStorage) {
        console.log('[API] Using api_base from localStorage:', apiBaseFromStorage);
        return apiBaseFromStorage.replace(/\/$/, '');
      }
    } catch {}
  }

  // 4. Trong development (localhost:5173)
  if (typeof window !== 'undefined') {
    const isDev = location.port === '5173';
    if (isDev) {
      console.log('[API] Using dev backend:', 'http://127.0.0.1:5000');
      return 'http://127.0.0.1:5000';
    }
  }

  // 5. Production: dùng same-origin (nếu frontend và backend cùng domain)
  // Khi backend serve cả frontend, API_BASE = '' (same-origin)
  console.log('[API] Using same-origin (empty string)');
  return '';
}

export const API_BASE = getApiBase();

