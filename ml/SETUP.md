# Hướng dẫn cài đặt ML Service

## Yêu cầu
- Python 3.8 trở lên
- pip (Python package manager)

## Cài đặt

### 1. Tạo virtual environment (khuyến nghị)

```bash
cd ml
python -m venv venv
```

### 2. Kích hoạt virtual environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 4. Chạy service

**Cách 1: Chạy từ thư mục cha (khuyến nghị)**
```bash
# Quay về thư mục cha
cd ..

# Chạy service
uvicorn ml.app:app --reload --port 8000
```

**Cách 2: Chạy từ trong thư mục ml**
```bash
# Đảm bảo đang ở trong thư mục ml
cd ml

# Chạy service
uvicorn app:app --reload --port 8000
```

Service sẽ chạy tại: http://localhost:8000

## Kiểm tra

```bash
curl http://localhost:8000/health
```

Hoặc mở browser: http://localhost:8000/docs (FastAPI Swagger UI)

## Troubleshooting

### Lỗi: "python is not recognized"
- Cài đặt Python từ https://www.python.org/downloads/
- Hoặc dùng `py` thay vì `python` trên Windows

### Lỗi: "uvicorn is not recognized"
- Đảm bảo đã kích hoạt virtual environment
- Chạy lại: `pip install -r requirements.txt`

### Lỗi khi cài đặt packages
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

