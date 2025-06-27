# Dockerfile
FROM python:3.11-slim

# ติดตั้ง LibreOffice และ dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    default-jre \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ตั้ง working directory
WORKDIR /app

# คัดลอก requirements.txt ก่อน
COPY requirements.txt .

# ติดตั้ง Python packages
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้าง directory สำหรับ temp files
RUN mkdir -p /tmp/excel_temp

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Expose port
EXPOSE 5000

# Run the application
CMD gunicorn --bind 0.0.0.0:$PORT app:app