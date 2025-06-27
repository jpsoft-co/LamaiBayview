# Dockerfile - แก้ไขแล้ว
FROM python:3.11-slim

# อัพเดต pip ก่อน
RUN pip install --upgrade pip==24.2

# ติดตั้ง system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    default-jre \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ตั้ง working directory
WORKDIR /app

# คัดลอก requirements.txt ก่อน
COPY requirements.txt .

# ติดตั้ง Python packages แบบแยกขั้นตอน
RUN pip install --no-cache-dir --upgrade setuptools wheel

# ติดตั้ง dependencies หลัก
RUN pip install --no-cache-dir \
    Flask==2.3.3 \
    gunicorn==21.2.0 \
    psycopg2-binary==2.9.9

# ติดตั้ง dependencies อื่นๆ
RUN pip install --no-cache-dir \
    openpyxl==3.1.2 \
    Pillow==10.0.1 \
    python-dotenv==1.0.0

# ติดตั้ง dependencies ที่เหลือ
RUN pip install --no-cache-dir \
    click==8.1.7 \
    colorama==0.4.6 \
    et-xmlfile==1.1.0 \
    itsdangerous==2.1.2 \
    Jinja2==3.1.3 \
    MarkupSafe==2.1.3 \
    Werkzeug==2.3.7 \
    packaging==23.2

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้าง directory สำหรับ temp files
RUN mkdir -p /tmp/excel_temp && chmod 777 /tmp/excel_temp

# ตั้งค่า environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV PYTHONPATH=/app

# ทดสอบ LibreOffice
RUN libreoffice --version || echo "LibreOffice test failed but continuing..."

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Run the application
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app