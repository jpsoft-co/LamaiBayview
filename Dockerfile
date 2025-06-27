# Dockerfile
FROM python:3.11-slim

# อัพเดต pip
RUN pip install --upgrade pip

# ติดตั้ง system dependencies รวม LibreOffice
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-common \
    default-jre-headless \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ตั้ง working directory
WORKDIR /app

# คัดลอก requirements.txt
COPY requirements.txt .

# ติดตั้ง Python packages
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้าง directory สำหรับ temp files
RUN mkdir -p /tmp/excel_temp && chmod 777 /tmp/excel_temp

# ทดสอบ LibreOffice
RUN libreoffice --version

# ตั้งค่า environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV FLASK_ENV=production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run the application
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --log-level info app:app