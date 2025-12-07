# Hướng dẫn Deploy lên Vercel

## ⚠️ Vấn đề: Vercel không chạy được `cd` trong build command

## ✅ Giải pháp: Cấu hình Vercel để set Root Directory là `frontend`

### Bước 1: Vào Vercel Dashboard
1. Mở project của bạn trên Vercel
2. Vào **Settings** → **General**

### Bước 2: Cấu hình Root Directory
1. Tìm phần **Root Directory**
2. Click **Edit**
3. Nhập: `frontend`
4. Click **Save**

### Bước 3: Cấu hình Build Settings
1. Vào **Settings** → **Build & Development Settings**
2. **Build Command**: `npm install && npm run build`
3. **Output Directory**: `../backend/public`
4. **Install Command**: `npm install` (hoặc để trống)

### Bước 4: Deploy lại
1. Vào **Deployments**
2. Click **Redeploy** trên deployment mới nhất
3. Hoặc push code mới lên git để trigger auto-deploy

## 📝 File cấu hình

File `frontend/vercel.json` đã được tạo (không bắt buộc nếu cấu hình trong Dashboard):
```json
{
  "version": 2,
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "../backend/public",
  "installCommand": "npm install",
  "framework": null
}
```

## ⚠️ Lưu ý
- Nếu deploy frontend riêng, backend API sẽ không hoạt động
- Cần deploy backend riêng trên một platform khác (Railway, Render, Heroku, etc.)
- Hoặc sử dụng Vercel Serverless Functions cho backend API

