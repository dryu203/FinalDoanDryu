/**
 * API Configuration cho Mobile App
 * 
 * Để cấu hình API URL:
 * 1. Tạo file .env trong mobile/
 * 2. Thêm: EXPO_PUBLIC_API_BASE=https://your-backend-url.com
 * 3. Rebuild app
 * 
 * Hoặc sử dụng Constants.expoConfig.extra.apiBase nếu có
 */

import Constants from 'expo-constants';

export function getApiBase(): string {
  // 1. Kiểm tra EXPO_PUBLIC_API_BASE từ .env (Expo tự động load)
  // Lưu ý: Expo chỉ load biến env khi khởi động, cần restart sau khi sửa .env
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE) {
    const publicApiBase = process.env.EXPO_PUBLIC_API_BASE;
    console.log('[API] Using EXPO_PUBLIC_API_BASE from .env:', publicApiBase);
    return String(publicApiBase).replace(/\/$/, '');
  }

  // 2. Kiểm tra environment variable từ app.json extra
  const envApiBase = Constants.expoConfig?.extra?.apiBase;
  if (envApiBase) {
    console.log('[API] Using apiBase from app.json extra:', envApiBase);
    return String(envApiBase).replace(/\/$/, '');
  }

  // 4. Development default: localhost (cần ngrok hoặc IP thật cho device)
  // Lưu ý: 
  // - Trên Android emulator dùng 10.0.2.2 thay vì 127.0.0.1
  // - Trên iOS simulator dùng localhost hoặc 127.0.0.1
  // - Trên thiết bị thật CẦN dùng IP máy tính (VD: 192.168.1.100) hoặc ngrok URL
  //   KHÔNG thể dùng localhost/127.0.0.1 vì đó là IP của chính thiết bị, không phải máy tính
  const isDev = __DEV__;
  if (isDev) {
    // Detect platform để dùng IP phù hợp
    const platform = Constants.platform?.ios ? 'ios' : 'android';
    
    // Nếu chạy trên thiết bị thật, cần dùng IP máy tính hoặc ngrok
    // Tạm thời để localhost, user cần thay bằng IP thật trong .env
    // Hoặc có thể dùng IP cố định nếu biết
    const defaultUrl = 'http://127.0.0.1:5000';
    
    // Android emulator dùng 10.0.2.2
    if (platform === 'android') {
      // Check nếu là emulator hay thiết bị thật (có thể check qua Constants.isDevice)
      // Nhưng tốt nhất là để user config trong .env
      return defaultUrl; // Hoặc 'http://10.0.2.2:5000' cho Android emulator
    }
    
    return defaultUrl;
  }

  // 5. Production: same-origin hoặc production URL
  // Nếu backend serve static files, có thể dùng relative URL
  return '';
}

export const API_BASE = getApiBase();

// Log API base để debug
if (__DEV__) {
  console.log('[API] API_BASE configured as:', API_BASE);
}

