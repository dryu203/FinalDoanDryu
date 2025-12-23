# 📱 Study Tracker Mobile App

Ứng dụng mobile cho hệ thống quản lý tiến độ học tập, được xây dựng bằng **React Native** và **Expo SDK 54**.

## 🚀 Tính năng

- ✅ **Dashboard**: Xem tổng quan GPA, tín chỉ, chuyên ngành
- ✅ **Kết quả học tập**: Xem điểm số theo học kỳ
- ✅ **Deadline**: Quản lý deadline và lịch thi
- ✅ **Chat real-time**: Chat với sinh viên khác
- ✅ **Profile**: Quản lý thông tin cá nhân
- ✅ **Authentication**: Đăng nhập/đăng ký với email/password

## 📋 Yêu cầu

- **Node.js** >= 18
- **npm** >= 9
- **Expo CLI** (sẽ được cài đặt tự động)
- **Expo Go app** trên điện thoại (iOS/Android) để test
- Hoặc **iOS Simulator** / **Android Emulator**

## 🔧 Cài đặt

### 1. Cài đặt dependencies

```bash
cd mobile
npm install
```

### 2. Cấu hình API Base URL

Tạo file `.env` trong thư mục `mobile/`:

```env
EXPO_PUBLIC_API_BASE=http://192.168.1.46:5000
```

**Lưu ý quan trọng về API URL:**

- **Android Emulator**: Sử dụng `http://10.0.2.2:5000`
- **iOS Simulator**: Sử dụng `http://localhost:5000` hoặc `http://127.0.0.1:5000`
- **Thiết bị thật**: Cần dùng **IP của máy tính** (VD: `http://192.168.1.46:5000`) hoặc dùng **ngrok**
- **Production**: Thay bằng URL production của backend

**Cách lấy IP máy tính:**
- **Windows**: Chạy `ipconfig` trong Command Prompt, tìm "IPv4 Address"
- **Mac/Linux**: Chạy `ifconfig` hoặc `ip addr`, tìm IP của WiFi adapter

### 3. Đảm bảo Backend đang chạy

Backend phải đang chạy tại port 5000:

```bash
cd ../backend
npm run dev
```

Backend phải hiển thị:
```
[server] listening on http://localhost:5000
```

### 4. Kiểm tra kết nối (Optional)

Trước khi chạy app, có thể test API từ browser trên điện thoại:

Mở trình duyệt trên điện thoại và truy cập:
```
http://192.168.1.46:5000/api/health
```

Nếu thấy `{"status":"ok"}`, backend accessible từ điện thoại.

## 🏃 Chạy ứng dụng

### Cách 1: LAN Mode (Khuyến nghị - Default)

```bash
cd mobile
npm start
```

Lệnh này sẽ:
- Start Expo với `--lan` mode
- Tự động detect IP máy tính
- Tạo QR code với IP thật (không phải localhost)
- Thiết bị thật có thể quét QR và kết nối

**Sau khi start, bạn sẽ thấy:**
```
Metro waiting on exp://192.168.1.46:8081
```

Quét QR code bằng **Expo Go** app (iOS/Android).

---

### Cách 2: Tunnel Mode

```bash
cd mobile
npm run start:tunnel
```

**Lưu ý quan trọng:**
- Tunnel mode chỉ tạo tunnel cho **Metro bundler** (code JavaScript)
- **Backend API vẫn cần cùng WiFi** hoặc phải dùng **ngrok** cho backend
- Nếu backend đang chạy trên IP local (192.168.x.x), app sẽ **không kết nối được** khi không cùng WiFi

**Khi nào dùng:**
- Khi cần test từ xa nhưng **đã setup ngrok cho backend**
- Khi backend đã deploy lên server công khai
- LAN mode không hoạt động (firewall/network issues)

**Hạn chế:**
- Chậm hơn LAN mode
- Vẫn cần cùng WiFi hoặc ngrok cho backend API

---

### Cách 3: Localhost (Chỉ cho Simulator)

```bash
cd mobile
npm run start:localhost
```

**Chỉ dùng cho:**
- iOS Simulator (Mac)
- Android Emulator

**KHÔNG work** với thiết bị thật.

---

### Cách 4: Clear Cache và Start

```bash
cd mobile
npm run start:clear
```

Dùng khi:
- Sau khi sửa code hoặc .env
- Gặp lỗi lạ, cần clear cache
- App không load được

---

## 📱 Sử dụng App

### Trên thiết bị thật:

1. **Cài Expo Go:**
   - iOS: App Store → tìm "Expo Go"
   - Android: Google Play → tìm "Expo Go"

2. **Quét QR code:**
   - Mở Expo Go app
   - Chọn "Scan QR code"
   - Quét QR code từ terminal
   - App sẽ tự động load

3. **Hoặc nhập URL manually:**
   - Trong Expo Go, chọn "Enter URL manually"
   - Nhập URL từ terminal (VD: `exp://192.168.1.46:8081`)

---

### Trên Simulator/Emulator:

Sau khi start, nhấn:
- `i` → Mở iOS Simulator (chỉ trên Mac)
- `a` → Mở Android Emulator
- `w` → Mở trên web browser

---

## 🔍 Troubleshooting

### Lỗi: "Could not connect to the server"

**Nguyên nhân:**
- Backend không chạy
- IP máy tính sai
- Firewall chặn port 5000
- Máy tính và điện thoại không cùng WiFi

**Giải pháp:**

1. **Kiểm tra Backend:**
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Kiểm tra IP:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Đảm bảo IP trong `.env` đúng với IP máy tính.

3. **Kiểm tra Firewall (Windows):**
   ```powershell
   # Mở port 5000
   New-NetFirewallRule -DisplayName "Allow Port 5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
   ```

4. **Dùng ngrok (Đơn giản nhất):**
   ```bash
   # Cài ngrok từ https://ngrok.com/download
   ngrok http 5000
   
   # Copy URL (VD: https://abc123.ngrok-free.app)
   # Sửa .env:
   EXPO_PUBLIC_API_BASE=https://abc123.ngrok-free.app
   
   # Restart Expo
   npm start
   ```

5. **Đảm bảo cùng WiFi:**
   - Máy tính và điện thoại phải cùng WiFi network
   - Không dùng WiFi khách (guest WiFi)

---

### Lỗi: "Metro waiting on exp://127.0.0.1:8081"

**Nguyên nhân:** Expo đang dùng localhost thay vì IP thật.

**Giải pháp:**
```bash
# Dừng Expo (Ctrl+C)
# Restart với LAN mode
npm start
```

Hoặc chỉ định IP:
```bash
npx expo start --lan --host 192.168.1.46
```

---

### Lỗi: "Cannot find module" hoặc dependency errors

**Giải pháp:**
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Hoặc trên Windows
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

### App không load sau khi sửa .env

**Giải pháp:**
```bash
# Dừng Expo (Ctrl+C)
# Clear cache và restart
npm run start:clear
```

---

### QR code không scan được

**Nguyên nhân:** QR code đang dùng localhost.

**Giải pháp:**
- Restart với `npm start` (LAN mode) - **khuyến nghị**
- Hoặc dùng tunnel mode: `npm run start:tunnel` (nhưng vẫn cần cùng WiFi hoặc ngrok cho backend)

---

### Lỗi: Tunnel mode không kết nối được backend khi không cùng WiFi

**Nguyên nhân:** Tunnel mode chỉ tunnel Metro bundler, không tunnel backend API.

**Giải pháp:**
1. **Dùng ngrok cho backend** (Khuyến nghị):
   ```bash
   # Terminal 1: Chạy ngrok
   ngrok http 5000
   
   # Copy URL (VD: https://abc123.ngrok-free.app)
   # Sửa mobile/.env:
   EXPO_PUBLIC_API_BASE=https://abc123.ngrok-free.app
   
   # Terminal 2: Restart Expo
   cd mobile
   npm run start:tunnel
   ```

2. **Hoặc đảm bảo cùng WiFi** - Vẫn là cách đơn giản nhất

---

### Lỗi: ERR_NGROK_8012 - "agent failed to establish a connection to the upstream web service at localhost:5000"

**Nguyên nhân:** 
- Backend không đang chạy tại port 5000
- Hoặc backend đang chạy nhưng không accessible từ localhost:5000
- Ngrok đã tunnel nhưng không tìm thấy service tại địa chỉ đó

**Giải pháp:**

1. **Kiểm tra Backend có đang chạy không:**
   ```bash
   # Mở terminal mới
   cd backend
   npm run dev
   ```
   
   Phải thấy dòng:
   ```
   [server] listening on http://localhost:5000
   ```

2. **Kiểm tra port 5000 có bị chiếm không:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

3. **Test backend từ browser:**
   ```
   http://localhost:5000/api/health
   ```
   
   Phải thấy `{"status":"ok"}`

4. **Đảm bảo ngrok đang trỏ đúng port:**
   ```bash
   # Ngrok phải trỏ đến đúng port mà backend đang chạy
   ngrok http 5000
   ```
   
   Kiểm tra ngrok dashboard tại `http://localhost:4040` để xem có traffic không

5. **Nếu vẫn lỗi, thử restart cả backend và ngrok:**
   ```bash
   # Terminal 1: Dừng và restart backend
   cd backend
   npm run dev
   
   # Terminal 2: Dừng và restart ngrok
   ngrok http 5000
   ```

---

## 🛠️ Scripts

| Script | Mô tả |
|--------|-------|
| `npm start` | Start với LAN mode (default) |
| `npm run start:localhost` | Start với localhost (chỉ simulator) |
| `npm run start:tunnel` | Start với tunnel mode (từ xa) |
| `npm run start:clear` | Start với LAN + clear cache |
| `npm run android` | Start và mở Android emulator |
| `npm run ios` | Start và mở iOS simulator |
| `npm run web` | Start và mở web browser |
| `npm run lint` | Chạy ESLint |
| `npm run typecheck` | Kiểm tra TypeScript |

---

## 📦 Build cho Production

### Android

```bash
# Build APK
npx expo build:android

# Hoặc build locally
npx expo run:android --variant release
```

### iOS

```bash
# Build (cần Apple Developer account)
npx expo build:ios

# Hoặc build locally (chỉ trên macOS)
npx expo run:ios --configuration Release
```

---

## 🏗️ Cấu trúc dự án

```
mobile/
├── app/                      # Expo Router (file-based routing)
│   ├── _layout.tsx          # Root layout với auth guard
│   ├── (auth)/              # Auth screens
│   │   ├── login.tsx        # Login/Register screen
│   │   └── test-connection.tsx  # Test API connection (dev only)
│   └── (tabs)/              # Main app screens
│       ├── _layout.tsx      # Tab navigation
│       ├── index.tsx        # Dashboard
│       ├── results.tsx      # Results
│       ├── deadlines.tsx    # Deadlines
│       ├── chat.tsx         # Chat
│       └── profile.tsx      # Profile
├── src/
│   ├── components/          # Reusable components
│   ├── services/            # API services
│   │   ├── api.ts          # Base API client
│   │   ├── auth.ts         # Authentication
│   │   ├── results.ts      # Results API
│   │   ├── deadlines.ts    # Deadlines API
│   │   ├── curriculum.ts   # Curriculum API
│   │   ├── chat.ts         # Chat API
│   │   └── socket.ts       # Socket.io client
│   ├── config/             # Configuration
│   │   └── api.ts          # API base URL config
│   ├── theme/              # Theme & styling
│   │   ├── colors.ts       # Color palette
│   │   └── index.ts        # Theme constants
│   └── types/              # TypeScript types
├── assets/                  # Images, fonts, etc.
├── .env                     # Environment variables (tạo file này)
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

---

## 🔐 Authentication

App sử dụng JWT tokens:
- Token được lưu trong **Expo SecureStore** (encrypted storage)
- User info được lưu trong **AsyncStorage**
- Token tự động được thêm vào mọi API requests

---

## 📡 Real-time Communication

App sử dụng **Socket.io** cho:
- Real-time chat messages
- Online status updates

Socket connection được tự động initialize sau khi login.

---

## 🎨 Design System

App sử dụng design system khớp với frontend web:
- **Brand colors**: Orange (#f59e0b) và Navy (#1f3b5b)
- **Typography**: System fonts
- **Spacing**: Consistent spacing scale
- **Shadows**: Material Design shadows

Xem `src/theme/` để biết thêm chi tiết.

---

## 📝 Notes

- Sau khi sửa `.env`, **PHẢI restart Expo** (`npm start` hoặc `npm run start:clear`)
- Backend phải đang chạy trước khi start mobile app
- Trên thiết bị thật, **KHÔNG thể dùng** `localhost` hoặc `127.0.0.1`
- Nếu gặp lỗi network, thử dùng **ngrok** (đơn giản nhất)

---

## 🆘 Cần giúp đỡ?

1. Kiểm tra Backend đang chạy tại `http://localhost:5000`
2. Kiểm tra `.env` có đúng IP/URL không
3. Kiểm tra máy tính và điện thoại cùng WiFi
4. Thử restart Expo với `npm run start:clear`
5. Xem logs trong terminal để biết lỗi cụ thể

---

## ✅ Checklist khi chạy lần đầu

- [ ] Backend đang chạy (`cd ../backend && npm run dev`)
- [ ] Đã cài dependencies (`npm install`)
- [ ] Đã tạo file `.env` với API_BASE đúng
- [ ] Đã cài Expo Go trên điện thoại (nếu dùng thiết bị thật)
- [ ] Máy tính và điện thoại cùng WiFi (nếu dùng thiết bị thật)
- [ ] Firewall không chặn port 5000
- [ ] Đã chạy `npm start` và quét QR code

---

Happy coding! 🚀

