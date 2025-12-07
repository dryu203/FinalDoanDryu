## Hệ thống quản lý tiến độ học tập cá nhân (React + Node.js)

Monorepo cho đồ án tốt nghiệp: Xây dựng hệ thống quản lý tiến độ học tập cá nhân cho sinh viên ngành Công nghệ đa phương tiện.

### Kiến trúc
- frontend: React + Vite + TypeScript (Web app)
- mobile: React Native + TypeScript (Mobile app)
- backend: Node.js + Express + TypeScript
- Quản lý bằng npm workspaces, lint/format đồng bộ, CI GitHub Actions

### Yêu cầu hệ thống
- Node.js >= 18
- npm >= 9

### Chạy nhanh (dev)

**Web App:**
```bash
npm install
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

**Mobile App:**
```bash
cd mobile
npm install
npm start
# Terminal khác: npm run android (hoặc npm run ios)
```
Xem chi tiết trong `mobile/README.md`

### Scripts chính
- `npm run dev`: chạy đồng thời client và server
- `npm run build`: build cả 2 workspace
- `npm run lint`: ESLint toàn repo
- `npm run format`: Prettier toàn repo
- `npm run typecheck`: kiểm tra kiểu TypeScript

### Cấu trúc thư mục
```
.
├─ frontend/      # Ứng dụng React (Web)
│  └─ src/
│     ├─ pages/
│     ├─ components/
│     ├─ hooks/
│     └─ services/
├─ mobile/        # Ứng dụng React Native (Mobile)
│  └─ src/
│     ├─ screens/
│     ├─ navigation/
│     ├─ services/
│     └─ utils/
├─ backend/       # API Express
│  └─ src/
│     ├─ routes/
│     ├─ models/
│     └─ controllers/
├─ .github/       # CI workflow
├─ .editorconfig
├─ .gitignore
├─ .prettierrc.json
├─ package.json   # Workspaces + scripts
└─ README.md
```

### Màu thương hiệu
- Primary (cam): `#f59e0b`
- Secondary (xanh navy): `#1f3b5b`
- Accent: `#5ec6df`
- Đã khai báo trong `frontend/src/styles.css` dưới dạng CSS variables (`--color-primary`, `--color-secondary`, `--color-accent`).

### Quy ước commit (khuyến nghị)
- feat: tính năng mới
- fix: sửa lỗi
- docs: cập nhật tài liệu
- style: format/code style
- refactor: tái cấu trúc
- test: bổ sung test
- chore: việc vặt (build, deps, CI)

### Biến môi trường
- `backend/.env` (tham khảo `backend/.env.example`)
- `frontend/.env` (không bắt buộc do đã cấu hình proxy)

### Cộng tác qua Git
1. Khởi tạo repo, đẩy lên GitHub, mời collaborator
2. Tạo nhánh từ `main`, mở Pull Request để review

### Bản quyền
MIT License — xem file LICENSE


cd D:\Study\thuc_tap_tot_nghiep\FinalDoAn
$env:LLM_PROVIDER = "Gemini"
$env:GEMINI_API_KEY = "AIzaSyAnFMyQ4D32zM31lj4iHvIeWHOobmr0JWM"
$env:GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"