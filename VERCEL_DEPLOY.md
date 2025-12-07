# Hướng dẫn Deploy lên Vercel

## Phương án 1: Deploy từ Root (Hiện tại)

Cấu hình trong `vercel.json`:
- Root Directory: `/` (root của repo)
- Build Command: `mkdir -p backend/public && cd frontend && npm install && npm run build`
- Output Directory: `backend/public`

## Phương án 2: Deploy Frontend như Project riêng (Nếu Phương án 1 không hoạt động)

### Bước 1: Tạo Project mới trên Vercel
1. Vào Vercel Dashboard
2. Tạo project mới
3. Connect với repository của bạn

### Bước 2: Cấu hình trong Vercel Dashboard
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `../backend/public` hoặc `dist` (nếu sửa vite.config)

### Bước 3: Nếu dùng Output Directory là `dist`
Cần sửa `frontend/vite.config.ts`:
```typescript
build: {
  outDir: 'dist', // Thay vì '../backend/public'
  emptyOutDir: true,
}
```

Sau đó trong Vercel, set Output Directory là `dist`.

## Lưu ý
- Nếu deploy frontend riêng, backend API sẽ không hoạt động
- Cần deploy backend riêng trên một platform khác (Railway, Render, Heroku, etc.)

