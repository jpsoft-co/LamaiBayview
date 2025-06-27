# Dockerfile - ทางเลือก (ถ้า build fail)
FROM python:3.11-slim

# อัพเดต system
RUN apt-get update && apt-get upgrade -y

# อัพเดต pip
RUN pip install --upgrade pip

# ติดตั้ง LibreOffice และ dependencies แบบแยกขั้นตอน
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    software-properties-common

# ติดตั้ง Java ก่อน
RUN apt-get install -y default-jre-headless

# ติดตั้ง LibreOffice
RUN apt-get install -y \
    libreoffice \
    libreoffice-calc \
    libreoffice-writer \
    libreoffice-common

# ติดตั้ง fonts
RUN apt-get install -y \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto-cjk

# ทำความสะอาด
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

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
RUN libreoffice --version || echo "LibreOffice version check failed"

# ตั้งค่า environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV FLASK_ENV=production

# Expose port
EXPOSE 5000

# Run the application
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --log-level info app:app