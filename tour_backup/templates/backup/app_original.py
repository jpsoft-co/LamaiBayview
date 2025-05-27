from flask import Flask, render_template, request, jsonify, url_for, redirect
import os
import re
import io
from datetime import date, datetime
import mysql.connector
import uuid

app = Flask(__name__)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port="3306",
        user="root",
        password="0821411984",
        database="booking_system" # เดี๋ยวต้องทำให้ dynamic โดยการแบ่งหน้าในการใข้ database ระหว่าง P1 และ P2
    )

def load_data_from_file(filename):
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, filename)
        
        with open(file_path, 'r') as f:
            data = [line.strip() for line in f.readlines() if line.strip()]
        
        return data
    except Exception as e:
        print(f"Error loading file {filename}: {str(e)}")
        return []

@app.route("/")
def index():
    return render_template("P00_login.html")

@app.route("/home")
def home():
    return render_template("P0_home.html")

@app.route("/home_tour_and_motorbike_rental")
def tour_and_motorbike_rental():
    # Load room data from file
    rooms = load_data_from_file('static/config/room.txt')
    today = date.today().isoformat()  # YYYY-MM-DD
    return render_template('P1_home_tour_and_motorbike_rental.html', room=rooms, today=today)

@app.route("/submit_tour_booking", methods=["POST"])
def submit_tour_booking():
    try:
        # Connect to the database to get the latest booking number
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current year and month (in format YY and MM)
        current_date = datetime.now()
        year_prefix = current_date.strftime("%y")  # 2-digit year (e.g., 25 for 2025)
        month_prefix = current_date.strftime("%m")  # 2-digit month (e.g., 04 for April)
        prefix = f"{year_prefix}{month_prefix}"  # e.g., 2504
        
        # Query to find the highest booking number with the current year-month prefix
        query = """
        SELECT booking_no FROM tour_motobike_rental 
        WHERE booking_no LIKE %s 
        ORDER BY booking_no DESC LIMIT 1
        """
        cursor.execute(query, (f"{prefix}%",))
        result = cursor.fetchone()
        
        if result:
            # If a booking number with this prefix exists, increment the running number
            last_booking_no = result[0]
            running_number = int(last_booking_no[4:]) + 1
        else:
            # If no booking number with this prefix exists, start at 1
            running_number = 1
        
        # Format the booking number: YYMMXXXXX (where XXXXX is a 5-digit running number)
        booking_no = f"{prefix}{running_number:05d}"  # Pad with leading zeros to 5 digits

        
        # Get form data
        customer_name = request.form.get('name', '')
        customer_surname = request.form.get('surname', '')
        room = request.form.get('room', '')
        experience_type = request.form.get('experienceType', '')
        company_name = request.form.get('company', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        travel_date = request.form.get('date', '')
        quantity = request.form.get('persons', '0')
        received = request.form.get('price', '0')
        payment_status = request.form.get('status', '')
        staff_name = request.form.get('staffName', '')
        start_booking_date = request.form.get('searchDate', '')
        end_booking_date = request.form.get('searchDateTo', '')
        
        # Set booking date to today
        booking_date = date.today().isoformat()
        
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert data into the database
        query = """
        INSERT INTO tour_motobike_rental (
            travel_date, pickup_time, booking_date, booking_no, 
            customer_name, customer_surname, room, company_name, 
            detail, quantity, received, payment_status, 
            staff_name, experience_type, start_booking_date, end_booking_date
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            travel_date, pickup_time, booking_date, booking_no,
            customer_name, customer_surname, room, company_name,
            detail, quantity, received, payment_status,
            staff_name, experience_type, start_booking_date, end_booking_date
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        #เดี๋ยวทำ funtion เพิ่มด้วยการทำ JS สวยๆเด้งขึ้นมาว่ามีการ update แล้ว
        return jsonify({"success": True, "message": "Booking successfully submitted", "booking_no": booking_no})
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    
# เพิ่ม route นี้ในไฟล์ app.py ของคุณ

@app.route("/tour_and_motorbike_form")
def view_tour_bookings():
    try:
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)  # ใช้ dictionary cursor เพื่อให้ได้ผลลัพธ์เป็น dictionary
        
        # ดึงข้อมูลทั้งหมดจากตาราง
        query = """
        SELECT 
            *
        FROM tour_motobike_rental
        ORDER BY booking_date DESC, booking_no DESC
        """
        
        cursor.execute(query)
        bookings = cursor.fetchall()
        
        # แปลงรูปแบบวันที่และเวลา
        for booking in bookings:
            if booking['travel_date']:
                booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
            if booking['booking_date']:
                booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
            if booking['start_booking_date']:
                booking['start_booking_date'] = booking['start_booking_date'].strftime('%d/%m/%Y')
            if booking['end_booking_date']:
                booking['end_booking_date'] = booking['end_booking_date'].strftime('%d/%m/%Y')
            
            # แก้ไขส่วนนี้ - ตรวจสอบว่า pickup_time เป็น datetime.time ไม่ใช่ timedelta
            if booking['pickup_time']:
                if hasattr(booking['pickup_time'], 'strftime'):
                    booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                else:
                    # ถ้าเป็น timedelta ให้แปลงเป็นรูปแบบชั่วโมง:นาที
                    total_seconds = int(booking['pickup_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
        
        cursor.close()
        conn.close()
        
        return render_template('P1_tour_and_motorbike_form.html', bookings=bookings)
    
    except Exception as e:
        return f"เกิดข้อผิดพลาด: {str(e)}"
    
@app.context_processor
def inject_room_list():
    room_list = load_data_from_file('static/config/room.txt')
    return dict(room_list=room_list)

# เพิ่ม route สำหรับค้นหาการจองตามวันที่
@app.route("/search_bookings", methods=["GET", "POST"])
def search_bookings():

    room_list = load_data_from_file('static/config/room.txt')

    try:
        if request.method == "POST":
            # รับค่าจากฟอร์มค้นหา
            start_date = request.form.get('start_date', '')
            end_date = request.form.get('end_date', '')
            room = request.form.get('room', '')
            experience_type = request.form.get('experience_type', '')
            
            # เชื่อมต่อกับฐานข้อมูล
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # สร้าง query พื้นฐาน
            query = """
            SELECT 
                booking_no, 
                travel_date, 
                pickup_time,
                customer_name, 
                customer_surname, 
                room, 
                company_name, 
                detail, 
                quantity, 
                received, 
                payment_status, 
                staff_name, 
                experience_type, 
                start_booking_date, 
                end_booking_date,
                booking_date
            FROM tour_motobike_rental
            WHERE 1=1
            """
            
            params = []
            
            # เพิ่มเงื่อนไขการค้นหา
            if start_date:
                query += " AND travel_date >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND travel_date <= %s"
                params.append(end_date)
            
            if room:
                query += " AND room = %s"
                params.append(room)
            
            if experience_type and experience_type != 'all':
                query += " AND experience_type = %s"
                params.append(experience_type)
            
            query += " ORDER BY travel_date DESC, booking_no DESC"
            
            cursor.execute(query, params)
            bookings = cursor.fetchall()
            
            # แปลงรูปแบบวันที่และเวลา
            for booking in bookings:
                if booking['travel_date']:
                    booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
                if booking['booking_date']:
                    booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
                if booking['start_booking_date']:
                    booking['start_booking_date'] = booking['start_booking_date'].strftime('%d/%m/%Y')
                if booking['end_booking_date']:
                    booking['end_booking_date'] = booking['end_booking_date'].strftime('%d/%m/%Y')
                
                # แก้ไขส่วนนี้ - ตรวจสอบว่า pickup_time เป็น datetime.time ไม่ใช่ timedelta
                if booking['pickup_time']:
                    if hasattr(booking['pickup_time'], 'strftime'):
                        booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                    else:
                        # ถ้าเป็น timedelta ให้แปลงเป็นรูปแบบชั่วโมง:นาที
                        total_seconds = int(booking['pickup_time'].total_seconds())
                        hours = total_seconds // 3600
                        minutes = (total_seconds % 3600) // 60
                        booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
            
            return render_template('P1_tour_and_motorbike_form.html', bookings=bookings, 
                                 search_start_date=start_date, search_end_date=end_date, 
                                 search_room=room, search_experience_type=experience_type,
                                 room_list=room_list)
        else:
            # ถ้าเป็น GET request ให้ redirect ไปที่หน้าแสดงการจองทั้งหมด
            return redirect(url_for('view_tour_bookings'))
    
    except Exception as e:
        return f"เกิดข้อผิดพลาด: {str(e)}"

# เพิ่ม route สำหรับการลบข้อมูล (cancel booking)
@app.route("/cancel_bookings", methods=["POST"])
def cancel_bookings():
    try:
        # รับค่า booking_no ที่ถูกเลือกจากฟอร์ม
        selected_bookings = request.form.getlist('selected_bookings')
        
        if not selected_bookings:
            return jsonify({"success": False, "message": "No bookings selected"})
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ลบข้อมูลที่ถูกเลือก
        placeholders = ', '.join(['%s'] * len(selected_bookings))
        query = f"DELETE FROM tour_motobike_rental WHERE booking_no IN ({placeholders})"
        
        cursor.execute(query, selected_bookings)
        conn.commit()
        
        deleted_count = cursor.rowcount
        
        cursor.close()
        conn.close()
        
        if deleted_count > 0:
            return jsonify({"success": True, "message": f"Successfully cancelled {deleted_count} booking(s)"})
        else:
            return jsonify({"success": False, "message": "No bookings were cancelled"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# เพิ่ม route สำหรับการดึงข้อมูลเพื่อแก้ไข
@app.route("/get_booking_details", methods=["POST"])
def get_booking_details():
    try:
        # รับค่า booking_no จากการ request
        booking_no = request.form.get('booking_no')
        
        if not booking_no:
            return jsonify({"success": False, "message": "No booking selected"})
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # ดึงข้อมูลการจองตาม booking_no
        query = "SELECT * FROM tour_motobike_rental WHERE booking_no = %s"
        cursor.execute(query, (booking_no,))
        booking = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not booking:
            return jsonify({"success": False, "message": "Booking not found"})
        
        # แปลงวันที่และเวลาให้อยู่ในรูปแบบที่เหมาะสม
        if booking['travel_date']:
            booking['travel_date'] = booking['travel_date'].isoformat()
        if booking['booking_date']:
            booking['booking_date'] = booking['booking_date'].isoformat()
        if booking['start_booking_date'] and booking['start_booking_date'] != '0000-00-00':
            booking['start_booking_date'] = booking['start_booking_date'].isoformat()
        if booking['end_booking_date'] and booking['end_booking_date'] != '0000-00-00':
            booking['end_booking_date'] = booking['end_booking_date'].isoformat()
        
        # แปลงเวลา
        if booking['pickup_time']:
            if hasattr(booking['pickup_time'], 'strftime'):
                booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
            else:
                # ถ้าเป็น timedelta
                total_seconds = int(booking['pickup_time'].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
        
        return jsonify({"success": True, "booking": booking})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# เพิ่ม route สำหรับการอัปเดตข้อมูล (edit booking)
@app.route("/update_booking", methods=["POST"])
def update_booking():
    try:
        # รับค่าจากฟอร์มแก้ไข
        booking_no = request.form.get('booking_no')
        customer_name = request.form.get('name', '')
        customer_surname = request.form.get('surname', '')
        room = request.form.get('room', '')
        experience_type = request.form.get('experienceType', '')
        company_name = request.form.get('company', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        travel_date = request.form.get('date', '')
        quantity = request.form.get('persons', '0')
        received = request.form.get('price', '0')
        payment_status = request.form.get('status', '')
        staff_name = request.form.get('staffName', '')
        
        if not booking_no:
            return jsonify({"success": False, "message": "Booking number is required"})
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # อัปเดตข้อมูลในฐานข้อมูล
        query = """
        UPDATE tour_motobike_rental SET
            travel_date = %s,
            pickup_time = %s,
            customer_name = %s,
            customer_surname = %s,
            room = %s,
            company_name = %s,
            detail = %s,
            quantity = %s,
            received = %s,
            payment_status = %s,
            staff_name = %s,
            experience_type = %s
        WHERE booking_no = %s
        """
        
        values = (
            travel_date, pickup_time, customer_name, customer_surname,
            room, company_name, detail, quantity, received,
            payment_status, staff_name, experience_type, booking_no
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        updated = cursor.rowcount > 0
        
        cursor.close()
        conn.close()
        
        if updated:
            return jsonify({"success": True, "message": "Booking successfully updated"})
        else:
            return jsonify({"success": False, "message": "No changes were made or booking not found"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/home_transfer")
def home_transfer():
    return render_template("P2_home_transfer.html")

@app.route("/login")
def login():
    return render_template("P00_login.html")

if __name__ == "__main__":   
    app.run(debug=True)