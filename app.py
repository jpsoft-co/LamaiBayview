# เหลือทำ cancel
# การคำนวณ discout
# เลือกเป็นช่วงผู้โดยสาร
# เลือก bike ได้หลายคัน

from flask import Flask, render_template, request, jsonify, url_for, redirect, send_file, session, flash
import os
import re
import io
from datetime import date, datetime, time
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import openpyxl
import tempfile

from functools import wraps
import secrets

app = Flask(__name__)

#---------------------------------------------- LOGIN ------------------------------------------------------
# สร้าง secret key สำหรับ session
app.secret_key = 'booking_system_secret_key_2024'

# Decorator สำหรับตรวจสอบการ login
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to continue', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ---------------------------------------Connect database ---------------------------------------

# Database connection
def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        # สำหรับ Render.com
        return psycopg2.connect(database_url)
    else:
        # สำหรับ local development
        return psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 5432)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME")
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
    # ถ้า login แล้วให้ไปหน้า home
    if 'user_id' in session:
        return redirect(url_for('home'))
    return render_template("P00_login.html")



@app.route("/process_login", methods=["POST"])
def process_login():
    try:
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        if not username or not password:
            return jsonify({
                "success": False, 
                "message": "Please enter both username and password."
            })
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query เพื่อดึงข้อมูล user รวมทั้ง role
        query = "SELECT id, username, pass, first_name, last_name, role FROM login WHERE username = %s"
        cursor.execute(query, (username,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # เปรียบเทียบ password แบบ plain text
        if user and user['pass'] == password:
            # เก็บข้อมูลใน session รวมทั้ง role
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['first_name'] = user['first_name']
            session['last_name'] = user['last_name']
            session['full_name'] = f"{user['first_name']} {user['last_name']}"
            session['role'] = user.get('role', 'staff')  # เพิ่ม role, default เป็น staff
            
            return jsonify({
                "success": True, 
                "message": "Login successful.",
                "redirect_url": url_for('home')
            })
        else:
            return jsonify({
                "success": False, 
                "message": "Invalid username or password."
            })
            
    except Exception as e:
        return jsonify({
            "success": False, 
            "message": f"An error occurred: {str(e)}"
        })

# เพิ่ม route สำหรับ logout
@app.route("/logout")
def logout():
    session.clear()
    flash('Logout Successful', 'success')
    return redirect(url_for('index'))

@app.route("/home")
@login_required
def home():
    return render_template("P0_home.html")

# -------------------------------- Tour Page (Updated) --------------------------------------------------------------

@app.route("/tour_rental")
@login_required
def tour_rental():
    # เชื่อมต่อกับฐานข้อมูล
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # ดึงข้อมูลห้องจากตาราง room
    query = "SELECT room FROM room ORDER BY room"
    cursor.execute(query)
    room_results = cursor.fetchall()
    rooms = [room[0] for room in room_results]
    
    # ดึงข้อมูล tour companies เท่านั้น (ไม่ต้อง motorbike)
    query_tour = "SELECT DISTINCT company_name FROM tour_tabel ORDER BY company_name"
    cursor.execute(query_tour)
    tour_companies = [company[0] for company in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    today = date.today().isoformat()  # YYYY-MM-DD
    
    return render_template('P1_tour_rental.html', 
                         room=rooms, 
                         today=today,
                         tour_companies=tour_companies)

# เพิ่ม API endpoint สำหรับดึงข้อมูล details ตาม company และ experience type
@app.route("/get_company_details", methods=["POST"])
@login_required
def get_company_details():
    try:
        experience_type = request.form.get('experience_type')
        company_name = request.form.get('company_name')
        
        if not experience_type or not company_name:
            return jsonify({"success": False, "message": "Missing required parameters"})
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # เลือกตารางตาม experience type
        if experience_type == 'tour':
            table_name = 'tour_tabel'
        elif experience_type == 'motorbike':
            table_name = 'motorbike_tabel'
        else:
            return jsonify({"success": False, "message": "Invalid experience type"})
        
        # ดึงข้อมูล details สำหรับ company ที่เลือก
        query = f"SELECT detail, received FROM {table_name} WHERE company_name = %s ORDER BY detail"
        cursor.execute(query, (company_name,))
        details = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "details": details})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# เพิ่ม API endpoint สำหรับดึงราคาตาม detail ที่เลือก
@app.route("/get_detail_price", methods=["POST"])
@login_required
def get_detail_price():
    try:
        experience_type = request.form.get('experience_type')
        detail = request.form.get('detail')
        
        if not experience_type or not detail:
            return jsonify({"success": False, "message": "Missing required parameters"})
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # เลือกตารางตาม experience type
        if experience_type == 'tour':
            table_name = 'tour_tabel'
        elif experience_type == 'motorbike':
            table_name = 'motorbike_tabel'
        else:
            return jsonify({"success": False, "message": "Invalid experience type"})
        
        # ดึงข้อมูลราคาสำหรับ detail ที่เลือก
        query = f"SELECT received FROM {table_name} WHERE detail = %s"
        cursor.execute(query, (detail,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return jsonify({"success": True, "price": result['received']})
        else:
            return jsonify({"success": False, "message": "Detail not found"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    
# เพิ่ม API endpoint สำหรับดึงข้อมูล companies
@app.route("/api/companies", methods=["GET"])
@login_required
def get_companies():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ดึงข้อมูล tour companies
        query_tour = "SELECT DISTINCT company_name FROM tour_tabel ORDER BY company_name"
        cursor.execute(query_tour)
        tour_companies = [company[0] for company in cursor.fetchall()]
        
        # ดึงข้อมูล motorbike companies
        query_motorbike = "SELECT DISTINCT company_name FROM motorbike_tabel ORDER BY company_name"
        cursor.execute(query_motorbike)
        motorbike_companies = [company[0] for company in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "tour_companies": tour_companies,
            "motorbike_companies": motorbike_companies
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
            "tour_companies": [],
            "motorbike_companies": []
        })
    

@app.route("/submit_tour_booking", methods=["POST"])
@login_required
def submit_tour_booking():
    try:
        # Connect to the database to get the latest booking number
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current year and month (in format YY and MM)
        current_date = datetime.now()
        year_prefix = current_date.strftime("%y")  # 2-digit year (e.g., 25 for 2025)
        month_prefix = current_date.strftime("%m")  # 2-digit month (e.g., 05 for May)
        prefix = f"{year_prefix}{month_prefix}"  # e.g., 2505
        
        # Query to find the highest booking number with the current year-month prefix
        # ⚠️ เปลี่ยนจาก tour_motobike_rental เป็น tour_rental
        query = """
        SELECT booking_no FROM tour_rental 
        WHERE booking_no LIKE %s 
        ORDER BY CAST(SUBSTRING(booking_no, 5) AS INTEGER) DESC 
        LIMIT 1
        """
        cursor.execute(query, (f"{prefix}%",))
        result = cursor.fetchone()
        
        if result:
            last_booking_no = result[0]
            try:
                running_number = int(last_booking_no[4:]) + 1
            except (ValueError, IndexError):
                running_number = 1
        else:
            running_number = 1
        
        # สร้าง booking number และตรวจสอบว่าไม่ซ้ำ
        max_attempts = 1000
        booking_no = None
        
        for attempt in range(max_attempts):
            temp_booking_no = f"T{prefix}{running_number:05d}"
            
            # ⚠️ เปลี่ยนจาก tour_motobike_rental เป็น tour_rental
            check_query = "SELECT booking_no FROM tour_rental WHERE booking_no = %s"
            cursor.execute(check_query, (temp_booking_no,))
            exists = cursor.fetchone()
            
            if not exists:
                booking_no = temp_booking_no
                break
            else:
                running_number += 1
        
        if not booking_no:
            return jsonify({"success": False, "message": "Unable to generate unique booking number"})

        # Get form data (เหมือนเดิม)
        customer_name = request.form.get('name', '')
        customer_surname = request.form.get('surname', '')
        room = request.form.get('room', '')
        # ⚠️ ไม่ต้องดึง experience_type แล้ว
        company_name = request.form.get('company', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        travel_date = request.form.get('date', '')
        quantity = request.form.get('persons', '0')
        price_per_person = request.form.get('price', '0')
        payment_status = request.form.get('status', '')
        staff_name = request.form.get('staffName', '')
        payment_method = request.form.get('paymentmethod', '') # อย่าลืมใส่ variable = paymentmethod ตัวนี้ใน tour_rental และ tour_transfer
        remark = request.form.get('remark', '') # อย่าลืมใส่ variable = remark ตัวนี้ใน tour_rental และ tour_transfer
        discount = request.form.get('discount', '')
        
        # Calculate total received
        received = float(price_per_person) * int(quantity) if price_per_person and quantity else 0
        booking_date = date.today().isoformat()
        
        # Validate required fields (ลบ experience_type ออก)
        if not all([customer_name, customer_surname, room, 
                   company_name, detail, pickup_time, travel_date, 
                   quantity, price_per_person, payment_status, staff_name, payment_method]):
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Please fill in all required fields"})
        
        # ⚠️ Insert ลงตาราง tour_rental
        query = """
        INSERT INTO tour_rental (
            travel_date, pickup_time, booking_date, booking_no, 
            customer_name, customer_surname, room, company_name, 
            detail, quantity, received, payment_status, 
            staff_name, payment_method, remark, discount
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            travel_date, pickup_time, booking_date, booking_no,
            customer_name, customer_surname, room, company_name,
            detail, quantity, received, payment_status,
            staff_name, payment_method, remark, discount
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "Tour booking successfully submitted", 
            "booking_no": booking_no,
            "total_amount": received
        })
    
    except Exception as e:
        try:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
        except:
            pass
        
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/tour_rental_form")
@login_required
def view_tour_bookings():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ดึงข้อมูล bookings
        query = """
        SELECT * FROM tour_rental
        ORDER BY booking_date DESC, booking_no DESC
        LIMIT 50
        """
        cursor.execute(query)
        bookings = cursor.fetchall()
        
        # ⚠️ เพิ่มส่วนนี้ - ดึง booking_list สำหรับ dropdown
        cursor.execute("SELECT DISTINCT booking_no, customer_name, customer_surname FROM tour_rental ORDER BY booking_no DESC")
        booking_list = cursor.fetchall()
        
        # แปลงวันที่และเวลา (โค้ดเดิม...)
        for booking in bookings:
            if booking['travel_date']:
                booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
            if booking['booking_date']:
                booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
            
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
        
        # ⚠️ เพิ่ม booking_list ในการ return
        return render_template('P1_tour_form.html', 
                             bookings=bookings,
                             booking_list=booking_list) 
    
    except Exception as e:
        return f"Error: {str(e)}"
    
# ---- อัพเดต Context Processor ----
@app.context_processor
def inject_room_list():
    # เชื่อมต่อกับฐานข้อมูล
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # ดึงข้อมูลห้องจากตาราง room
    query = "SELECT room FROM room ORDER BY room"
    cursor.execute(query)
    
    # ดึงผลลัพธ์ออกมาเป็นรายการธรรมดา
    room_results = cursor.fetchall()
    room_list = [room[0] for room in room_results]
    
    # ดึงข้อมูล companies สำหรับใช้ใน edit modal
    query_tour = "SELECT DISTINCT company_name FROM tour_tabel ORDER BY company_name"
    cursor.execute(query_tour)
    tour_companies = [company[0] for company in cursor.fetchall()]
    
    query_motorbike = "SELECT DISTINCT company_name FROM motorbike_tabel ORDER BY company_name"
    cursor.execute(query_motorbike)
    motorbike_companies = [company[0] for company in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    return dict(
        room_list=room_list,
        tour_companies=tour_companies,
        motorbike_companies=motorbike_companies
    )
        

# ---- อัพเดต Search Bookings ----
@app.route("/search_tour_bookings", methods=["GET", "POST"])
@login_required
def search_tour_bookings():
    try:
        # ดึง booking list และ room list สำหรับ dropdown (ใช้ทั้ง GET และ POST)
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ดึง booking list สำหรับ dropdown
        cursor.execute("SELECT DISTINCT booking_no, customer_name, customer_surname FROM tour_rental ORDER BY booking_no DESC")
        booking_list = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if request.method == "POST":
            # รับค่าจากฟอร์มค้นหา
            start_date = request.form.get('travel_date', '')
            end_date = request.form.get('travel_date', '')
            booking_no = request.form.get('booking_no', '')
            name_surname = request.form.get('name_surname', '')
            
            # เชื่อมต่อกับฐานข้อมูล
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # ⚠️ เปลี่ยนจาก tour_motobike_rental เป็น tour_rental
            query = """
            SELECT 
                booking_no, 
                travel_date, 
                pickup_time,
                booking_date,
                customer_name, 
                customer_surname, 
                room, 
                company_name, 
                detail, 
                quantity, 
                received, 
                payment_status,
                payment_medthod, 
                staff_name,
                remark,
                discount
            FROM tour_rental
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
            
            if booking_no:
                query += " AND booking_no = %s"
                params.append(booking_no)
                
            if name_surname:
                # แยกชื่อและนามสกุล
                name_parts = name_surname.strip().split(' ', 1)
                if len(name_parts) == 2:
                    first_name, last_name = name_parts
                    query += " AND customer_name = %s AND customer_surname = %s"
                    params.extend([first_name, last_name])
                else:
                    # ถ้าไม่สามารถแยกได้ ให้ค้นหาจากชื่อเต็ม
                    query += " AND CONCAT(customer_name, ' ', customer_surname) = %s"
                    params.append(name_surname)
            
            query += " ORDER BY travel_date DESC, booking_no DESC"
            
            cursor.execute(query, params)
            bookings = cursor.fetchall()
            
            # แปลงรูปแบบวันที่และเวลา
            for booking in bookings:
                if booking['travel_date']:
                    booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
                if booking['booking_date']:
                    booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
                
                if booking['pickup_time']:
                    if hasattr(booking['pickup_time'], 'strftime'):
                        booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                    else:
                        total_seconds = int(booking['pickup_time'].total_seconds())
                        hours = total_seconds // 3600
                        minutes = (total_seconds % 3600) // 60
                        booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
            
            cursor.close()
            conn.close()
            
            return render_template('P1_tour_form.html', 
                                 bookings=bookings,
                                 booking_list=booking_list,
                                 search_start_date=start_date, 
                                 search_end_date=end_date, 
                                 search_booking_no=booking_no,
                                 search_name_surname=name_surname)
        else:
            # ⚠️ GET request - แสดงหน้า search form พร้อม dropdown data
            return render_template('view_tour_bookings')
    
    except Exception as e:
        return f"Error: {str(e)}"

@app.route("/cancel_bookings", methods=["POST"])
@login_required
def cancel_bookings():
    try:
        # รับค่า booking_no ที่ถูกเลือกจากฟอร์ม
        selected_bookings = request.form.getlist('selected_bookings')
        
        # รับประเภทจาก form
        booking_type = request.form.get('booking_type', 'tour')  # default เป็น tour
        
        # รับชื่อผู้ cancel
        cancelled_by = request.form.get('cancelled_by', '').strip()
        
        if not selected_bookings:
            return jsonify({"success": False, "message": "No bookings selected"})
        
        if not cancelled_by:
            return jsonify({"success": False, "message": "Cancellation name is required"})
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # เลือกตารางตามประเภท
        table_name = 'tour_rental' if booking_type == 'tour' else 'motorbike_rental'
        
        # อัพเดต payment_status แทนการลบ
        placeholders = ', '.join(['%s'] * len(selected_bookings))
        query = f"UPDATE {table_name} SET payment_status = %s WHERE booking_no IN ({placeholders})"
        
        # สร้าง status ใหม่
        cancel_status = f"Cancelled by {cancelled_by}"
        params = [cancel_status] + selected_bookings
        
        cursor.execute(query, params)
        conn.commit()
        
        updated_count = cursor.rowcount
        
        cursor.close()
        conn.close()
        
        if updated_count > 0:
            return jsonify({"success": True, "message": f"Successfully cancelled {updated_count} booking(s) by {cancelled_by}"})
        else:
            return jsonify({"success": False, "message": "No bookings were cancelled"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})


# ---- อัพเดต Get Booking Details สำหรับ Edit ----
@app.route("/get_booking_details", methods=["POST"])
@login_required
def get_booking_details():
    try:
        # รับค่า booking_no จากการ request
        booking_no = request.form.get('booking_no')
        
        # ⚠️ เพิ่มตัวนี้ - รับประเภทจาก form
        booking_type = request.form.get('booking_type', 'tour')  # default เป็น tour
        
        if not booking_no:
            return jsonify({"success": False, "message": "No booking selected"})
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ⚠️ เลือกตารางตามประเภท
        if booking_type == 'tour':
            main_table = 'tour_rental'
            price_table = 'tour_tabel'
        else:
            main_table = 'motorbike_rental'
            price_table = 'motorbike_tabel'
        
        # ดึงข้อมูลการจองพร้อม JOIN เพื่อดึงราคาต่อคนจากตารางที่เกี่ยวข้อง
        query = f"""
        SELECT 
            mr.*,
            pt.received as price_per_person
        FROM {main_table} mr
        LEFT JOIN {price_table} pt ON mr.detail = pt.detail AND mr.company_name = pt.company_name
        WHERE mr.booking_no = %s
        """
        
        cursor.execute(query, (booking_no,))
        booking = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not booking:
            return jsonify({"success": False, "message": "Booking not found"})
        
        # แปลงวันที่และเวลาให้อยู่ในรูปแบบที่เหมาะสม (เหมือนเดิม)
        if booking['travel_date']:
            booking['travel_date'] = booking['travel_date'].isoformat()
        if booking['booking_date']:
            booking['booking_date'] = booking['booking_date'].isoformat()
        
        # แปลงเวลา (เหมือนเดิม)
        if booking['pickup_time']:
            if hasattr(booking['pickup_time'], 'strftime'):
                booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
            else:
                # ถ้าเป็น timedelta
                total_seconds = int(booking['pickup_time'].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
        
        # เพิ่มราคาต่อคนที่คำนวณแล้ว
        if booking['price_per_person']:
            booking['price_per_person'] = float(booking['price_per_person'])
        
        # ⚠️ เพิ่ม booking_type กลับไปด้วย
        booking['booking_type'] = booking_type
        
        return jsonify({"success": True, "booking": booking})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    
# ---- อัพเดต Update Booking ----
@app.route("/update_booking", methods=["POST"])
@login_required
def update_booking():
    try:
        # รับค่าจากฟอร์มแก้ไข
        booking_no = request.form.get('booking_no')
        
        # ⚠️ เพิ่มตัวนี้ - รับประเภทจาก form
        booking_type = request.form.get('booking_type', 'tour')
        
        customer_name = request.form.get('name', '')
        customer_surname = request.form.get('surname', '')
        room = request.form.get('room', '')
        company_name = request.form.get('company', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        travel_date = request.form.get('date', '')
        quantity = request.form.get('persons', '0')
        price_per_person = request.form.get('price', '0')
        payment_status = request.form.get('status', '')
        payment_method = request.form.get('paymentmethod', '') # อย่าลืมใส่ variable = paymentmethod ตัวนี้ใน tour_rental และ tour_transfer
        remark = request.form.get('remark', '') # อย่าลืมใส่ variable = remark ตัวนี้ใน tour_rental และ tour_transfer
        staff_name = request.form.get('staffName', '')
        discount = request.form.get('discount', '')
        
        if not booking_no:
            return jsonify({"success": False, "message": "Booking number is required"})
        
        # คำนวณ received ใหม่
        received = float(price_per_person) * int(quantity) if price_per_person and quantity else 0
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ⚠️ เลือกตารางตามประเภท
        table_name = 'tour_rental' if booking_type == 'tour' else 'motorbike_rental'
        
        # อัปเดตข้อมูลในฐานข้อมูล
        query = f"""
        UPDATE {table_name} SET
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
            payment_method = %s,
            staff_name = %s,
            remark = %s
            discount = %s
        WHERE booking_no = %s
        """
        
        values = (
            travel_date, pickup_time, customer_name, customer_surname,
            room, company_name, detail, quantity, received,
            payment_status, payment_method, staff_name, remark, discount, booking_no
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
    
# ---- EXCEL FORM GENERATION FUNCTIONALITY ----
@app.route("/generate_excel_form", methods=["POST"])
def generate_excel_form():
    try:
        # รับ booking number จาก request
        booking_no = request.form.get('booking_no')
        
        # ⚠️ เพิ่มตัวนี้ - รับประเภทจาก form
        booking_type = request.form.get('booking_type', 'tour')  # default เป็น tour
        
        # ตรวจสอบว่ามี booking number หรือไม่
        if not booking_no:
            return jsonify({"success": False, "message": "Booking number not specified"}), 400
        
        print(f"Processing Excel generation for {booking_type} booking: {booking_no}")  # Debug log
        
        # เชื่อมต่อฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ⚠️ เลือกตารางตามประเภท
        table_name = 'tour_rental' if booking_type == 'tour' else 'motorbike_rental'
        
        # ดึงข้อมูลการจอง
        query = f"""
        SELECT 
            booking_no, 
            booking_date, 
            travel_date, 
            pickup_time, 
            customer_name,
            customer_surname,
            CONCAT(customer_name, ' ', customer_surname) AS full_name,
            room, 
            payment_status, 
            staff_name, 
            received,
            quantity,
            detail,
            payment_method,
            remark,
            discount
        FROM 
            {table_name} 
        WHERE 
            booking_no = %s
        """
        cursor.execute(query, (booking_no,))
        booking = cursor.fetchone()
        
        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": f"Booking number not found: {booking_no}"}), 404
        
        print(f"Booking data retrieved: {booking}")  # Debug log
        
        # สร้างไฟล์ Excel
        try:
            excel_file = create_excel_form(booking, booking_type)  # ⚠️ ส่ง booking_type ไปด้วย
            print(f"Excel file created at: {excel_file}")  # Debug log
            
            # ปิดการเชื่อมต่อฐานข้อมูล
            cursor.close()
            conn.close()
            
            # ⚠️ เปลี่ยนชื่อไฟล์ตามประเภท
            file_prefix = "Tour" if booking_type == 'tour' else "Motorbike"
            
            # ส่งไฟล์กลับไปยังผู้ใช้
            return send_file(
                excel_file,
                as_attachment=True,
                download_name=f"{file_prefix}_Booking_{booking_no}_{datetime.now().strftime('%Y%m%d')}.xlsx",
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            
        except Exception as e:
            print(f"Error creating Excel: {str(e)}")  # Debug log
            return jsonify({"success": False, "message": f"Failed to create the Excel file: {str(e)}"}), 500
    
    except Exception as e:
        print(f"General error: {str(e)}")  # Debug log
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

def create_excel_form(booking, booking_type='tour'):  # ⚠️ เพิ่ม parameter
    """Create Excel form from booking data"""
    # Define template path in static folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # ⚠️ เลือก template ตามประเภท (ถ้าต้องการใช้ template แยก)
    template_filename = 'booking_template.xlsx'  # หรือจะแยกเป็น tour_template.xlsx, motorbike_template.xlsx
    template_path = os.path.join(script_dir, 'static', 'templates', template_filename)
    
    # ตรวจสอบว่าไฟล์ template มีอยู่จริง (เหมือนเดิม)
    if not os.path.exists(template_path):
        print(f"Template not found at: {template_path}")
        
        templates_dir = os.path.join(script_dir, 'static', 'templates')
        if not os.path.exists(templates_dir):
            os.makedirs(templates_dir)
            print(f"Created templates directory: {templates_dir}")
        
        raise FileNotFoundError(f"Not found Excel template at: {template_path}")
    
    # โหลด Excel template (เหมือนเดิม)
    workbook = openpyxl.load_workbook(template_path)
    sheet = workbook.active
    
    # Cell mappings ตามที่กำหนด (เหมือนเดิม)
    cell_mappings = {
        "booking_date": ["J3", "J30"],
        "booking_no": ["J4", "J31"],
        "customer_name": ["D11", "D38", "G25", "G52"],
        "room": ["D13", "D40"],
        "travel_date": ["F13", "F40"],
        "pickup_time": ["I13", "I40"],
        "payment_status": ["D22", "D49"],
        "staff_name": ["B25", "B52"],
        "detail": ["D16", "D43"],
        "price": ["J16", "J43"],
        "payment_method": ["H22", "H49"],
        "remark": ["D21", "D48"]
    }
    
    # Formula cells
    formula_cells = {
        "H16": "=J16/I16",  # Total = Price * Quantity for first section
        "H43": "=J43/I43"   # Total = Price * Quantity for second section
    }
    
    # Value mappings
    value_mappings = {
        "quantity": ["I16", "I43"],  # Number of people
        "price": ["J16", "J43"]
    }
    
    # ใส่ข้อมูลลงในเซลล์ตาม mappings
    for field, cells in cell_mappings.items():
        value = None
        
        # กรณีพิเศษสำหรับชื่อลูกค้าเต็ม
        if field == "customer_name":
            value = booking["full_name"]
        elif field in booking and booking[field] is not None:
            value = booking[field]
        
        # จัดรูปแบบวันที่และเวลา
        if field == "booking_date" or field == "travel_date":
            if value:
                if isinstance(value, (date, datetime)):
                    value = value.strftime("%d/%m/%Y")
        elif field == "pickup_time" and value:
            if isinstance(value, (time, datetime)):
                value = value.strftime("%H:%M")
            elif hasattr(value, 'total_seconds'):
                # กรณีเป็น timedelta
                total_seconds = int(value.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                value = f"{hours:02d}:{minutes:02d}"
            
        # ใส่ข้อมูลลงในทุกเซลล์ที่เกี่ยวข้อง
        if value is not None:
            for cell in cells:
                sheet[cell] = value
    
    # ใส่ข้อมูลจำนวนคน
    if "quantity" in booking and booking["quantity"] is not None:
        for cell in value_mappings["quantity"]:
            sheet[cell] = booking["quantity"]
    
    # ใส่ข้อมูลราคา
    if "received" in booking and booking["received"] is not None:
        for cell in value_mappings["price"]:
            sheet[cell] = booking["received"]
    
    # ใส่สูตรคำนวณ
    for cell, formula in formula_cells.items():
        sheet[cell].value = formula
    
    # สร้างไฟล์ชั่วคราว
    temp_dir = tempfile.gettempdir()
    temp_file = os.path.join(temp_dir, f"{uuid.uuid4()}.xlsx")
    
    # บันทึก workbook ไปยังไฟล์ชั่วคราว
    workbook.save(temp_file)
    
    return temp_file

@app.route("/export_tour", methods=["POST"])
@login_required
def export_tour():
    try:
        # Get filter parameters
        filter_type = request.form.get('filter_type', '')
        payment_status = request.form.get('payment_status', 'all')
        
        # ⚠️ Base query เปลี่ยนจาก tour_motobike_rental เป็น tour_rental
        query = """
        SELECT 
            tr.booking_date,
            tr.booking_no, 
            tr.travel_date, 
            tr.customer_name, 
            tr.customer_surname, 
            tr.company_name,
            tr.detail,
            tr.staff_name,
            tr.quantity, 
            tr.received,
            tr.payment_status,
            tr.payment_method,
            tr.pickup_time,
            tr.room,
            tt.paid,
            tr.remark,
            tr.discount
        FROM tour_rental tr
        LEFT JOIN tour_tabel tt ON tr.detail = tt.detail 
                                   AND tr.company_name = tt.company_name
        WHERE 1=1
        """
        
        params = []
        
        # Apply date filters (เหมือนเดิม)
        if filter_type == 'date':
            start_date = request.form.get('start_date', '')
            end_date = request.form.get('end_date', '')
            
            if start_date:
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND tr.booking_date <= %s"
                params.append(end_date)
                
        elif filter_type == 'month':
            start_month = request.form.get('start_month', '')
            end_month = request.form.get('end_month', '')
            
            if start_month:
                start_date = f"{start_month}-01"
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_month:
                year, month = map(int, end_month.split('-'))
                if month == 12:
                    next_year = year + 1
                    next_month = 1
                else:
                    next_year = year
                    next_month = month + 1
                
                end_date = f"{next_year}-{next_month:02d}-01"
                query += " AND tr.booking_date < %s"
                params.append(end_date)
                
        elif filter_type == 'year':
            start_year = request.form.get('start_year', '')
            end_year = request.form.get('end_year', '')
            
            if start_year:
                start_date = f"{start_year}-01-01"
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_year:
                end_date = f"{int(end_year) + 1}-01-01"
                query += " AND tr.booking_date < %s"
                params.append(end_date)
        
        # ⚠️ ลบ experience_type filter ออก
        
        # Apply payment status filter
        if payment_status == 'paid':
            query += " AND tr.payment_status = 'paid'"
        elif payment_status == 'unpaid':
            query += " AND tr.payment_status = 'unpaid'"
        
        query += " ORDER BY tr.booking_date DESC, tr.booking_no DESC"
        
        # Execute query (เหมือนเดิม)
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        bookings = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Create Excel file
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        
        # ⚠️ เปลี่ยน sheet title
        sheet.title = "Tour Bookings"
        
        # Headers (เหมือนเดิม แต่ลบ Type column)
        headers = [
            "Travel Date", "Time", "Booking Date", "Booking No.", "Name&Surname", 
            "Room", "Company Name", "Detail", "Quantity", "Price / Person", 
            "Received", "Paid", "Amount", "Staff Name", "Payment Method", "Remark", "Discount"
        ]
        
        # Style headers (เหมือนเดิม)
        for col_num, header in enumerate(headers, 1):
            cell = sheet.cell(row=1, column=col_num)
            cell.value = header
            cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
            cell.fill = openpyxl.styles.PatternFill(
                start_color="366092", end_color="366092", fill_type="solid"
            )
            cell.alignment = openpyxl.styles.Alignment(horizontal="center", vertical="center")
        
        # Add data rows (ลบ exp_type_display)
        for row_num, booking in enumerate(bookings, 2):
            # Format dates and times (เหมือนเดิม)
            booking_date = booking['booking_date']
            if isinstance(booking_date, (date, datetime)):
                booking_date = booking_date.strftime("%d/%m/%Y")
            
            travel_date = booking['travel_date']
            if isinstance(travel_date, (date, datetime)):
                travel_date = travel_date.strftime("%d/%m/%Y")
            
            pickup_time = ''
            if booking['pickup_time']:
                if hasattr(booking['pickup_time'], 'strftime'):
                    pickup_time = booking['pickup_time'].strftime('%H:%M')
                elif hasattr(booking['pickup_time'], 'total_seconds'):
                    total_seconds = int(booking['pickup_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    pickup_time = f"{hours:02d}:{minutes:02d}"
                else:
                    pickup_time = str(booking['pickup_time'])
            
            price_per_person = 0
            if booking['quantity'] and booking['quantity'] > 0:
                price_per_person = booking['received'] / booking['quantity']
            
            paid_amount = booking['paid'] if booking['paid'] else 0
            amount = booking['received'] - paid_amount
            full_name = f"{booking['customer_name']} {booking['customer_surname']}"
            
            # ⚠️ Row data ลบ exp_type_display ออก
            row_data = [
                travel_date,                     # Travel Date
                pickup_time,                     # Time
                booking_date,                    # Booking Date
                booking['booking_no'],           # Booking No.
                full_name,                       # Name&Surname
                booking['room'],                 # Room
                booking['company_name'],         # Company Name
                booking['detail'],               # Detail
                booking['quantity'],             # Quantity
                round(price_per_person, 2),      # Price / Person
                booking['received'],             # Received
                paid_amount,                     # Paid
                round(amount, 2),                # Amount
                booking['staff_name'],            # Staff Name
                booking['payment_method'],                
                booking['remark'],
                booking['discount']
            ]
            
            for col_num, cell_value in enumerate(row_data, 1):
                cell = sheet.cell(row=row_num, column=col_num)
                cell.value = cell_value
        
        # Add Total row (เหมือนเดิม แต่ปรับ column numbers)
        if bookings:
            total_row = len(bookings) + 2
            sheet.cell(row=total_row, column=9).value = "TOTAL"
            sheet.cell(row=total_row, column=9).font = openpyxl.styles.Font(bold=True)
            
            start_data_row = 2
            end_data_row = total_row - 1
            
            # ปรับ column numbers สำหรับ formulas
            sheet.cell(row=total_row, column=11).value = f"=SUM(K{start_data_row}:K{end_data_row})"  # Received
            sheet.cell(row=total_row, column=11).font = openpyxl.styles.Font(bold=True)
            
            sheet.cell(row=total_row, column=12).value = f"=SUM(L{start_data_row}:L{end_data_row})"  # Paid
            sheet.cell(row=total_row, column=12).font = openpyxl.styles.Font(bold=True)
            
            sheet.cell(row=total_row, column=13).value = f"=SUM(M{start_data_row}:M{end_data_row})"  # Amount
            sheet.cell(row=total_row, column=13).font = openpyxl.styles.Font(bold=True)
        
        # Auto-size columns (เหมือนเดิม)
        for column in sheet.columns:
            max_length = 0
            column_letter = openpyxl.utils.get_column_letter(column[0].column)
            for cell in column:
                if cell.value:
                    cell_length = len(str(cell.value))
                    if cell_length > max_length:
                        max_length = cell_length
            
            adjusted_width = min(max_length + 2, 50)
            sheet.column_dimensions[column_letter].width = adjusted_width
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        workbook.save(temp_file.name)
        temp_file.close()
        
        # Send the file
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f"Tour_Export_{datetime.now().strftime('%Y%m%d')}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    
# -------------------------------- Motorbike Page --------------------------------------------------------------

@app.route("/motorbike_rental")
@login_required
def motorbike_rental():
    # เชื่อมต่อกับฐานข้อมูล
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # ดึงข้อมูลห้องจากตาราง room
    query = "SELECT room FROM room ORDER BY room"
    cursor.execute(query)
    room_results = cursor.fetchall()
    rooms = [room[0] for room in room_results]
    
    # ดึงข้อมูล motorbike companies เท่านั้น
    query_motorbike = "SELECT DISTINCT company_name FROM motorbike_tabel ORDER BY company_name"
    cursor.execute(query_motorbike)
    motorbike_companies = [company[0] for company in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    today = date.today().isoformat()  # YYYY-MM-DD
    
    
    return render_template('P3_motorbike_rental.html',
                         room=rooms, 
                         today=today,
                         motorbike_companies=motorbike_companies)
    

@app.route("/submit_motorbike_booking", methods=["POST"])
@login_required
def submit_motorbike_booking():
    try:
        # Connect to the database to get the latest booking number
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current year and month (in format YY and MM)
        current_date = datetime.now()
        year_prefix = current_date.strftime("%y")  # 2-digit year (e.g., 25 for 2025)
        month_prefix = current_date.strftime("%m")  # 2-digit month (e.g., 05 for May)
        prefix = f"{year_prefix}{month_prefix}"  # e.g., 2505
        
        # Query to find the highest booking number with the current year-month prefix
        query = """
        SELECT booking_no FROM motorbike_rental 
        WHERE booking_no LIKE %s 
        ORDER BY CAST(SUBSTRING(booking_no, 5) AS INTEGER) DESC 
        LIMIT 1
        """
        cursor.execute(query, (f"{prefix}%",))
        result = cursor.fetchone()
        
        if result:
            last_booking_no = result[0]
            try:
                running_number = int(last_booking_no[4:]) + 1
            except (ValueError, IndexError):
                running_number = 1
        else:
            running_number = 1
        
        
        max_attempts = 1000
        booking_no = None
        
        for attempt in range(max_attempts):
            temp_booking_no = f"M{prefix}{running_number:05d}"
            
            check_query = "SELECT booking_no FROM motorbike_rental WHERE booking_no = %s"
            cursor.execute(check_query, (temp_booking_no,))
            exists = cursor.fetchone()
            
            if not exists:
                booking_no = temp_booking_no
                break
            else:
                running_number += 1
        
        if not booking_no:
            return jsonify({"success": False, "message": "Unable to generate unique booking number"})

        # Get form data (เหมือนเดิม)
        customer_name = request.form.get('name', '')
        customer_surname = request.form.get('surname', '')
        room = request.form.get('room', '')
        # ⚠️ ไม่ต้องดึง experience_type แล้ว
        company_name = request.form.get('company', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        travel_date = request.form.get('searchDate', '')
        quantity = request.form.get('persons', '0')
        price_per_person = request.form.get('price', '0')
        payment_status = request.form.get('status', '')
        staff_name = request.form.get('staffName', '')
        start_booking_date = request.form.get('searchDate', '')
        end_booking_date = request.form.get('searchDateTo', '')
        payment_method = request.form.get('paymentmethod', '') # อย่าลืมใส่ variable = paymentmethod ตัวนี้ใน tour_rental และ tour_transfer
        remark = request.form.get('remark', '') # อย่าลืมใส่ variable = remark ตัวนี้ใน tour_rental และ tour_transfer
        discount = request.form.get('discount', '')
        
        # Calculate total received
        received = float(price_per_person) * int(quantity) if price_per_person and quantity else 0
        booking_date = request.form.get('searchDate', '')
        
        # Validate required fields (ลบ experience_type ออก)
        if not all([customer_name, customer_surname, room, 
                   company_name, detail, pickup_time, travel_date, 
                   quantity, price_per_person, payment_status, staff_name, payment_method]):
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Please fill in all required fields"})
        
        query = """
        INSERT INTO motorbike_rental (
            travel_date, pickup_time, booking_date, booking_no, 
            customer_name, customer_surname, room, company_name, 
            detail, quantity, received, payment_status, 
            staff_name, start_booking_date, end_booking_date, payment_method, remark, discount
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            travel_date, pickup_time, booking_date, booking_no,
            customer_name, customer_surname, room, company_name,
            detail, quantity, received, payment_status,
            staff_name, start_booking_date, end_booking_date, payment_method, remark, discount
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "Motorbike booking successfully submitted", 
            "booking_no": booking_no,
            "total_amount": received
        })
    
    except Exception as e:
        try:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
        except:
            pass
        
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/motorbike_rental_form")
@login_required
def view_motorbike_bookings():
    try:
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ดึงข้อมูลจากตาราง motorbike_rental เท่านั้น
        query = """
        SELECT 
            *
        FROM motorbike_rental
        ORDER BY booking_date DESC, booking_no DESC
        LIMIT 50
        """
        
        cursor.execute(query)
        bookings = cursor.fetchall()
        
        # ⚠️ เพิ่มส่วนนี้ - ดึง booking_list สำหรับ dropdown
        cursor.execute("SELECT DISTINCT booking_no, customer_name, customer_surname FROM motorbike_rental ORDER BY booking_no DESC")
        booking_list = cursor.fetchall()
        
        # แปลงรูปแบบวันที่และเวลา (เหมือนเดิม)
        for booking in bookings:
            if booking['travel_date']:
                booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
            if booking['booking_date']:
                booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
            if booking['start_booking_date'] and booking['start_booking_date']:
                booking['start_booking_date'] = booking['start_booking_date'].strftime('%d/%m/%Y')
            if booking['end_booking_date'] and booking['end_booking_date']:
                booking['end_booking_date'] = booking['end_booking_date'].strftime('%d/%m/%Y')
            
            # แปลงเวลา
            if booking['pickup_time']:
                if hasattr(booking['pickup_time'], 'strftime'):
                    booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                else:
                    total_seconds = int(booking['pickup_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
        
        cursor.close()
        conn.close()
        
        # ⚠️ เพิ่ม booking_list ในการ return
        return render_template('P3_motorbike_form.html', 
                             bookings=bookings,
                             booking_list=booking_list)
    
    except Exception as e:
        return f"Error: {str(e)}"
        

# ---- อัพเดต Search Bookings ----
@app.route("/search_motorbike_bookings", methods=["GET", "POST"])
@login_required
def search_motorbike_bookings():
    try:
        if request.method == "POST":
            # รับค่าจากฟอร์มค้นหา
            start_date = request.form.get('start_date', '')
            end_date = request.form.get('start_date', '')
            booking_no = request.form.get('booking_no', '')
            name_surname = request.form.get('name_surname', '')
            
            # เชื่อมต่อกับฐานข้อมูล
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
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
                start_booking_date, 
                end_booking_date,
                booking_date,
                payment_method,
                remark,
                discount
            FROM motorbike_rental
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
            
            if booking_no:
                query += " AND booking_no = %s"
                params.append(booking_no)
                
            if name_surname:
                # แยกชื่อและนามสกุล
                name_parts = name_surname.strip().split(' ', 1)
                if len(name_parts) == 2:
                    first_name, last_name = name_parts
                    query += " AND customer_name = %s AND customer_surname = %s"
                    params.extend([first_name, last_name])
                else:
                    # ถ้าไม่สามารถแยกได้ ให้ค้นหาจากชื่อเต็ม
                    query += " AND CONCAT(customer_name, ' ', customer_surname) = %s"
                    params.append(name_surname)
            
            # ⚠️ ลบ experience_type filter ออก
            
            query += " ORDER BY travel_date DESC, booking_no DESC"
            
            cursor.execute(query, params)
            bookings = cursor.fetchall()
            
            # แปลงรูปแบบวันที่และเวลา (เหมือนเดิม)
            for booking in bookings:
                if booking['travel_date']:
                    booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
                if booking['booking_date']:
                    booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
                if booking['start_booking_date']:
                    booking['start_booking_date'] = booking['start_booking_date'].strftime('%d/%m/%Y')
                if booking['end_booking_date']:
                    booking['end_booking_date'] = booking['end_booking_date'].strftime('%d/%m/%Y')
                
                if booking['pickup_time']:
                    if hasattr(booking['pickup_time'], 'strftime'):
                        booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                    else:
                        total_seconds = int(booking['pickup_time'].total_seconds())
                        hours = total_seconds // 3600
                        minutes = (total_seconds % 3600) // 60
                        booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
            
            # ดึง booking list สำหรับ dropdown
            cursor.execute("SELECT DISTINCT booking_no, customer_name, customer_surname FROM motorbike_rental ORDER BY booking_no DESC")
            booking_list = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            # ดึงข้อมูล room list สำหรับ dropdown
            conn = get_db_connection()
            cursor = conn.cursor()
            query = "SELECT room FROM room ORDER BY room"
            cursor.execute(query)
            room_results = cursor.fetchall()
            room_list = [room[0] for room in room_results]
            cursor.close()
            conn.close()
            
            return render_template('P3_motorbike_form.html', 
                                 bookings=bookings,
                                 booking_list=booking_list,
                                 search_start_date=start_date, 
                                 search_end_date=end_date, 
                                 search_booking_no=booking_no,
                                 search_name_surname=name_surname,
                                 room_list=room_list)
        else:
            # ถ้าเป็น GET request ให้ redirect ไปที่หน้าแสดงการจองทั้งหมด
            return redirect(url_for('view_motorbike_bookings'))
    
    except Exception as e:
        return f"Error: {str(e)}"


@app.route("/export_motorbike", methods=["POST"])
@login_required
def export_motorbike():
    try:
        # Get filter parameters
        filter_type = request.form.get('filter_type', '')
        payment_status = request.form.get('payment_status', 'all')
        
        query = """
        SELECT 
            tr.booking_date,
            tr.booking_no, 
            tr.travel_date, 
            tr.customer_name, 
            tr.customer_surname, 
            tr.company_name,
            tr.detail,
            tr.staff_name,
            tr.quantity, 
            tr.received,
            tr.payment_status,
            tr.pickup_time,
            tr.room,
            tt.paid,
            tt.payment_method,
            tt.remark,
            tt.discount
        FROM motorbike_rental tr
        LEFT JOIN motorbike_tabel tt ON tr.detail = tt.detail 
                                   AND tr.company_name = tt.company_name
        WHERE 1=1
        """
        
        params = []
        
        # Apply date filters (เหมือนเดิม)
        if filter_type == 'date':
            start_date = request.form.get('start_date', '')
            end_date = request.form.get('end_date', '')
            
            if start_date:
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND tr.booking_date <= %s"
                params.append(end_date)
                
        elif filter_type == 'month':
            start_month = request.form.get('start_month', '')
            end_month = request.form.get('end_month', '')
            
            if start_month:
                start_date = f"{start_month}-01"
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_month:
                year, month = map(int, end_month.split('-'))
                if month == 12:
                    next_year = year + 1
                    next_month = 1
                else:
                    next_year = year
                    next_month = month + 1
                
                end_date = f"{next_year}-{next_month:02d}-01"
                query += " AND tr.booking_date < %s"
                params.append(end_date)
                
        elif filter_type == 'year':
            start_year = request.form.get('start_year', '')
            end_year = request.form.get('end_year', '')
            
            if start_year:
                start_date = f"{start_year}-01-01"
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_year:
                end_date = f"{int(end_year) + 1}-01-01"
                query += " AND tr.booking_date < %s"
                params.append(end_date)
        
        # ⚠️ ลบ experience_type filter ออก
        
        # Apply payment status filter
        if payment_status == 'paid':
            query += " AND tr.payment_status = 'paid'"
        elif payment_status == 'unpaid':
            query += " AND tr.payment_status = 'unpaid'"
        
        query += " ORDER BY tr.booking_date DESC, tr.booking_no DESC"
        
        # Execute query (เหมือนเดิม)
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        bookings = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Create Excel file
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        
        # ⚠️ เปลี่ยน sheet title
        sheet.title = "motorbike Bookings"
        
        # Headers (เหมือนเดิม แต่ลบ Type column)
        headers = [
            "Travel Date", "Time", "Booking Date", "Booking No.", "Name&Surname", 
            "Room", "Company Name", "Detail", "Quantity", "Price / Person", 
            "Received", "Paid", "Amount", "Staff Name", "Payment Method", "Remark", "Discount"
        ]
        
        # Style headers (เหมือนเดิม)
        for col_num, header in enumerate(headers, 1):
            cell = sheet.cell(row=1, column=col_num)
            cell.value = header
            cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
            cell.fill = openpyxl.styles.PatternFill(
                start_color="366092", end_color="366092", fill_type="solid"
            )
            cell.alignment = openpyxl.styles.Alignment(horizontal="center", vertical="center")
        
        # Add data rows (ลบ exp_type_display)
        for row_num, booking in enumerate(bookings, 2):
            # Format dates and times (เหมือนเดิม)
            booking_date = booking['booking_date']
            if isinstance(booking_date, (date, datetime)):
                booking_date = booking_date.strftime("%d/%m/%Y")
            
            travel_date = booking['travel_date']
            if isinstance(travel_date, (date, datetime)):
                travel_date = travel_date.strftime("%d/%m/%Y")
            
            pickup_time = ''
            if booking['pickup_time']:
                if hasattr(booking['pickup_time'], 'strftime'):
                    pickup_time = booking['pickup_time'].strftime('%H:%M')
                elif hasattr(booking['pickup_time'], 'total_seconds'):
                    total_seconds = int(booking['pickup_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    pickup_time = f"{hours:02d}:{minutes:02d}"
                else:
                    pickup_time = str(booking['pickup_time'])
            
            price_per_person = 0
            if booking['quantity'] and booking['quantity'] > 0:
                price_per_person = booking['received'] / booking['quantity']
            
            paid_amount = booking['paid'] if booking['paid'] else 0
            amount = booking['received'] - paid_amount
            full_name = f"{booking['customer_name']} {booking['customer_surname']}"
            
            # ⚠️ Row data ลบ exp_type_display ออก
            row_data = [
                travel_date,                     # Travel Date
                pickup_time,                     # Time
                booking_date,                    # Booking Date
                booking['booking_no'],           # Booking No.
                full_name,                       # Name&Surname
                booking['room'],                 # Room
                booking['company_name'],         # Company Name
                booking['detail'],               # Detail
                booking['quantity'],             # Quantity
                round(price_per_person, 2),      # Price / Person
                booking['received'],             # Received
                paid_amount,                     # Paid
                round(amount, 2),                # Amount
                booking['staff_name'],            # Staff Name
                booking['payment_method'],
                booking['remark'],
                booking['discount']
            ]
            
            for col_num, cell_value in enumerate(row_data, 1):
                cell = sheet.cell(row=row_num, column=col_num)
                cell.value = cell_value
        
        # Add Total row (เหมือนเดิม แต่ปรับ column numbers)
        if bookings:
            total_row = len(bookings) + 2
            sheet.cell(row=total_row, column=9).value = "TOTAL"  # เปลี่ยนจาก column 10 เป็น 9
            sheet.cell(row=total_row, column=9).font = openpyxl.styles.Font(bold=True)
            
            start_data_row = 2
            end_data_row = total_row - 1
            
            # ปรับ column numbers สำหรับ formulas
            sheet.cell(row=total_row, column=11).value = f"=SUM(K{start_data_row}:K{end_data_row})"  # Received
            sheet.cell(row=total_row, column=11).font = openpyxl.styles.Font(bold=True)
            
            sheet.cell(row=total_row, column=12).value = f"=SUM(L{start_data_row}:L{end_data_row})"  # Paid
            sheet.cell(row=total_row, column=12).font = openpyxl.styles.Font(bold=True)
            
            sheet.cell(row=total_row, column=13).value = f"=SUM(M{start_data_row}:M{end_data_row})"  # Amount
            sheet.cell(row=total_row, column=13).font = openpyxl.styles.Font(bold=True)
        
        # Auto-size columns (เหมือนเดิม)
        for column in sheet.columns:
            max_length = 0
            column_letter = openpyxl.utils.get_column_letter(column[0].column)
            for cell in column:
                if cell.value:
                    cell_length = len(str(cell.value))
                    if cell_length > max_length:
                        max_length = cell_length
            
            adjusted_width = min(max_length + 2, 50)
            sheet.column_dimensions[column_letter].width = adjusted_width
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        workbook.save(temp_file.name)
        temp_file.close()
        
        # Send the file
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f"Motorbike_Export_{datetime.now().strftime('%Y%m%d')}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# -------------------------------- home transfer Page --------------------------------------------------------------
# app.py

@app.route("/home_transfer")
@login_required
def home_transfer():
    try:
        # Connect to database to get transfer locations
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all unique destinations for departure transfers (where place_from is resort)
        departure_query = """
        SELECT DISTINCT place_to as destination, passengers, received, paid 
        FROM transfer_tabel 
        WHERE place_from = 'Lamai Bayview Boutique Resort'
        ORDER BY place_to
        """
        cursor.execute(departure_query)
        departure_destinations = cursor.fetchall()
        
        # Get all unique origins for arrival transfers (where place_to is resort)
        arrival_query = """
        SELECT DISTINCT place_from as origin, passengers, received, paid 
        FROM transfer_tabel 
        WHERE place_to = 'Lamai Bayview Boutique Resort'
        ORDER BY place_from
        """
        cursor.execute(arrival_query)
        arrival_origins = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("P2_home_transfer.html", 
                             departure_destinations=departure_destinations,
                             arrival_origins=arrival_origins)
    
    except Exception as e:
        print(f"Error loading transfer data: {str(e)}")
        return render_template("P2_home_transfer.html", 
                             departure_destinations=[],
                             arrival_origins=[])

@app.route("/get_transfer_price", methods=["POST"])
@login_required
def get_transfer_price():
    """Get price information for selected transfer route"""
    try:
        transfer_type = request.json.get('transfer_type')  # 'departure' or 'arrival'
        location = request.json.get('location')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if transfer_type == 'departure':
            # For departure: from resort to selected destination
            query = """
            SELECT passengers, received, paid 
            FROM transfer_tabel 
            WHERE place_from = 'Lamai Bayview Boutique Resort' 
            AND place_to = %s
            LIMIT 1
            """
            cursor.execute(query, (location,))
        else:
            # For arrival: from selected origin to resort
            query = """
            SELECT passengers, received, paid 
            FROM transfer_tabel 
            WHERE place_from = %s 
            AND place_to = 'Lamai Bayview Boutique Resort'
            LIMIT 1
            """
            cursor.execute(query, (location,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return jsonify({
                "success": True,
                "data": {
                    "passengers": result['passengers'],
                    "price": result['received'],  # Using 'received' as the base price
                    "paid": result['paid']
                }
            })
        else:
            return jsonify({"success": False, "message": "Price not found for this route"})
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/submit_transfer_booking", methods=["POST"])
@login_required
def submit_transfer_booking():
    try:
        # Connect to the database to get the latest booking number
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current year and month (in format YY and MM)
        current_date = datetime.now()
        year_prefix = current_date.strftime("%y")  # 2-digit year (e.g., 25 for 2025)
        month_prefix = current_date.strftime("%m")  # 2-digit month (e.g., 04 for April)
        prefix = f"H{year_prefix}{month_prefix}"  # e.g., 2504
        
        # Query to find the highest booking number with the current year-month prefix
        query = """
        SELECT booking_no FROM transfer_rental 
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
        place_from = request.form.get('place_from', '')
        place_to = request.form.get('place_to', '')
        departure = request.form.get('departure', '')
        arrivals = request.form.get('arrivals', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        quantity = request.form.get('persons', '0')
        received = request.form.get('received', '0')
        payment_status = request.form.get('status', '')
        staff_name = request.form.get('staffName', '')
        driver_name = request.form.get('driverName', '')
        price = request.form.get('price', '0')
        payment_method = request.form.get('paymentmethod', '') # อย่าลืมใส่ variable = paymentmethod ตัวนี้ใน tour_rental และ tour_transfer
        remark = request.form.get('remark', '') # อย่าลืมใส่ variable = remark ตัวนี้ใน tour_rental และ tour_transfer
        discount = request.form.get('discount', '')
        
        # Set booking date to today
        booking_date = date.today().isoformat()
        travel_date = request.form.get('travel_date', date.today().isoformat())
        
        # Insert data into the database - 17 fields
        query = """
        INSERT INTO transfer_rental (
            travel_date, pickup_time, booking_date, booking_no, 
            customer_name, customer_surname, place_from, place_to, 
            departure, arrivals, detail, quantity, received,
            payment_status, staff_name, driver_name, price, payment_method, remark, discount
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # 17 values ตรงกับ 17 placeholders
        values = (
            travel_date, pickup_time, booking_date, booking_no,
            customer_name, customer_surname, place_from, place_to,
            departure, arrivals, detail, quantity, received,
            payment_status, staff_name, driver_name, price, payment_method, remark, discount
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Transfer booking successfully submitted", "booking_no": booking_no})
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})


@app.route("/home_transfer_form")
@login_required
def home_transfer_form():
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Retrieve all bookings from transfer_rental table
        query = """
        SELECT 
            *
        FROM transfer_rental
        ORDER BY booking_date DESC, booking_no DESC
        LIMIT 50
        """
        
        cursor.execute(query)
        bookings = cursor.fetchall()
        
        # Format dates and times
        for booking in bookings:
            if booking['travel_date']:
                booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
            if booking['booking_date']:
                booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
            
            # Handle pickup_time formatting
            if booking['pickup_time']:
                if hasattr(booking['pickup_time'], 'strftime'):
                    booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                else:
                    # If it's a timedelta
                    total_seconds = int(booking['pickup_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
        
        # ดึงข้อมูลจาก transfer_tabel สำหรับ dropdown ใน edit modal
        # Get all unique destinations for departure transfers (where place_from is resort)
        departure_query = """
        SELECT DISTINCT place_to as destination, passengers, received, paid 
        FROM transfer_tabel 
        WHERE place_from = 'Lamai Bayview Boutique Resort'
        ORDER BY place_to
        """
        cursor.execute(departure_query)
        departure_destinations = cursor.fetchall()
        
        # Get all unique origins for arrival transfers (where place_to is resort)
        arrival_query = """
        SELECT DISTINCT place_from as origin, passengers, received, paid 
        FROM transfer_tabel 
        WHERE place_to = 'Lamai Bayview Boutique Resort'
        ORDER BY place_from
        """
        cursor.execute(arrival_query)
        arrival_origins = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template('P2_home_transfer_form.html', 
                             transfers=bookings,
                             departure_destinations=departure_destinations,
                             arrival_origins=arrival_origins)
    
    except Exception as e:
        return f"Error: {str(e)}"

# Add search functionality for transfer bookings
@app.route("/search_transfer_bookings", methods=["POST"])
@login_required
def search_transfer_bookings():
    try:
        if request.method == "POST":
            # Get search parameters
            start_date = request.form.get('travel_date', '')
            end_date = request.form.get('travel_date', '')
            
            # Connect to database
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Base query
            query = """
            SELECT * FROM transfer_rental
            WHERE 1=1
            """
            
            params = []
            
            # Add search conditions
            if start_date:
                query += " AND travel_date >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND travel_date <= %s"
                params.append(end_date)
            
            query += " ORDER BY travel_date DESC, booking_no DESC"
            
            cursor.execute(query, params)
            bookings = cursor.fetchall()
            
            # Format dates and times
            for booking in bookings:
                if booking['travel_date']:
                    booking['travel_date'] = booking['travel_date'].strftime('%d/%m/%Y')
                if booking['booking_date']:
                    booking['booking_date'] = booking['booking_date'].strftime('%d/%m/%Y')
                
                # Handle pickup_time formatting
                if booking['pickup_time']:
                    if hasattr(booking['pickup_time'], 'strftime'):
                        booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
                    else:
                        # If it's a timedelta
                        total_seconds = int(booking['pickup_time'].total_seconds())
                        hours = total_seconds // 3600
                        minutes = (total_seconds % 3600) // 60
                        booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
            
            # ดึงข้อมูลจาก transfer_tabel สำหรับ dropdown ใน edit modal
            departure_query = """
            SELECT DISTINCT place_to as destination, passengers, received, paid 
            FROM transfer_tabel 
            WHERE place_from = 'Lamai Bayview Boutique Resort'
            ORDER BY place_to
            """
            cursor.execute(departure_query)
            departure_destinations = cursor.fetchall()
            
            arrival_query = """
            SELECT DISTINCT place_from as origin, passengers, received, paid 
            FROM transfer_tabel 
            WHERE place_to = 'Lamai Bayview Boutique Resort'
            ORDER BY place_from
            """
            cursor.execute(arrival_query)
            arrival_origins = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return render_template('P2_home_transfer_form.html', 
                                 transfers=bookings,
                                 departure_destinations=departure_destinations,
                                 arrival_origins=arrival_origins,
                                 search_start_date=start_date, 
                                 search_end_date=end_date)
        else:
            # If GET request, redirect to main form
            return redirect(url_for('home_transfer_form'))
    
    except Exception as e:
        return f"Error: {str(e)}"

# Add route for canceling transfer bookings
@app.route("/cancel_transfer_bookings", methods=["POST"])
@login_required
def cancel_transfer_bookings():
    try:
        # รับค่า booking_no ที่ถูกเลือกจากฟอร์ม
        selected_bookings = request.form.getlist('selected_bookings')
        
        # รับชื่อผู้ cancel
        cancelled_by = request.form.get('cancelled_by', '').strip()
        
        if not selected_bookings:
            return jsonify({"success": False, "message": "No bookings selected"})
        
        if not cancelled_by:
            return jsonify({"success": False, "message": "Cancellation name is required"})
        
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # อัพเดต payment_status แทนการลบ
        placeholders = ', '.join(['%s'] * len(selected_bookings))
        query = f"UPDATE transfer_rental SET payment_status = %s WHERE booking_no IN ({placeholders})"
        
        # สร้าง status ใหม่
        cancel_status = f"Cancelled by {cancelled_by}"
        params = [cancel_status] + selected_bookings
        
        cursor.execute(query, params)
        conn.commit()
        
        updated_count = cursor.rowcount
        
        cursor.close()
        conn.close()
        
        if updated_count > 0:
            return jsonify({"success": True, "message": f"Successfully cancelled {updated_count} booking(s) by {cancelled_by}"})
        else:
            return jsonify({"success": False, "message": "No bookings were cancelled"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# Add route for getting transfer booking details for editing
@app.route("/get_transfer_booking_details", methods=["POST"])
@login_required
def get_transfer_booking_details():
    try:
        # Get booking number
        booking_no = request.form.get('booking_no')
        
        if not booking_no:
            return jsonify({"success": False, "message": "No booking selected"})
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get booking details with paid amount from transfer_tabel
        query = """
        SELECT 
            tr.*,
            COALESCE(tt.paid, 0) as paid_from_table
        FROM transfer_rental tr
        LEFT JOIN transfer_tabel tt ON (
            (tr.departure = 'yes' AND tr.place_from = tt.place_from AND tr.place_to = tt.place_to) OR
            (tr.arrivals = 'yes' AND tr.place_from = tt.place_from AND tr.place_to = tt.place_to)
        )
        WHERE tr.booking_no = %s
        """
        cursor.execute(query, (booking_no,))
        booking = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not booking:
            return jsonify({"success": False, "message": "Booking not found"})
        
        # Use paid amount from transfer_tabel if available, otherwise use 0
        booking['paid'] = booking['paid_from_table'] if booking['paid_from_table'] is not None else 0
        
        # Format dates and times
        if booking['travel_date']:
            booking['travel_date'] = booking['travel_date'].isoformat()
        if booking['booking_date']:
            booking['booking_date'] = booking['booking_date'].isoformat()
        
        # Format pickup time
        if booking['pickup_time']:
            if hasattr(booking['pickup_time'], 'strftime'):
                booking['pickup_time'] = booking['pickup_time'].strftime('%H:%M')
            else:
                # If it's a timedelta
                total_seconds = int(booking['pickup_time'].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                booking['pickup_time'] = f"{hours:02d}:{minutes:02d}"
        
        return jsonify({"success": True, "booking": booking})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# Add route for updating transfer bookings
@app.route("/update_transfer_booking", methods=["POST"])
@login_required
def update_transfer_booking():
    try:
        # Get form data
        booking_no = request.form.get('booking_no')
        customer_name = request.form.get('name', '')
        customer_surname = request.form.get('surname', '')
        place_from = request.form.get('place_from', '')
        place_to = request.form.get('place_to', '')
        departure = request.form.get('departure', '')
        arrivals = request.form.get('arrivals', '')
        detail = request.form.get('detail', '')
        pickup_time = request.form.get('time', '')
        travel_date = request.form.get('travel_date', '')
        quantity = request.form.get('persons', '0')
        received = request.form.get('received', '0')
        payment_status = request.form.get('status', '')
        staff_name = request.form.get('staffName', '')
        driver_name = request.form.get('driverName', '')
        price = request.form.get('price', '0')
        payment_method = request.form.get('paymentmethod', '') # อย่าลืมใส่ variable = paymentmethod ตัวนี้ใน tour_rental และ tour_transfer
        remark = request.form.get('remark', '') # อย่าลืมใส่ variable = remark ตัวนี้ใน tour_rental และ tour_transfer
        discount = request.form.get('discounr', '')
        
        if not booking_no:
            return jsonify({"success": False, "message": "Booking number is required"})
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update booking - 15 fields + WHERE booking_no
        query = """
        UPDATE transfer_rental SET
            travel_date = %s,
            pickup_time = %s,
            customer_name = %s,
            customer_surname = %s,
            place_from = %s,
            place_to = %s,
            departure = %s,
            arrivals = %s,
            detail = %s,
            quantity = %s,
            received = %s,
            payment_status = %s,
            staff_name = %s,
            driver_name = %s,
            price = %s,
            payment_method = %s,
            remark = %s,
            discount = %s
        WHERE booking_no = %s
        """
        
        # 15 values + booking_no = 16 parameters total
        values = (
            travel_date, pickup_time, customer_name, customer_surname,
            place_from, place_to, departure, arrivals, detail, 
            quantity, received, payment_status, staff_name, 
            driver_name, price, payment_method, remark, discount, booking_no
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        updated = cursor.rowcount > 0
        
        cursor.close()
        conn.close()
        
        if updated:
            return jsonify({"success": True, "message": "Transfer booking successfully updated"})
        else:
            return jsonify({"success": False, "message": "No changes were made or booking not found"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# ---- EXCEL FORM GENERATION FUNCTIONALITY ----
@app.route("/generate_excel_form_transfer", methods=["POST"])
def generate_excel_form_transfer():
    try:
        # รับ booking number จาก request
        booking_no = request.form.get('booking_no')
        
        # ตรวจสอบว่ามี booking number หรือไม่
        if not booking_no:
            return jsonify({"success": False, "message": "Booking not found"}), 400
        
        print(f"Processing Excel generation for booking: {booking_no}")  # Debug log
        
        # เชื่อมต่อฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ดึงข้อมูลการจอง
        query = """
        SELECT 
            booking_no, 
            booking_date, 
            travel_date, 
            pickup_time, 
            customer_name,
            customer_surname,
            CONCAT(customer_name, ' ', customer_surname) AS full_name,
            place_from,
            place_to,
            departure,
            arrivals,
            detail,
            quantity,
            received,
            payment_status,
            staff_name,
            driver_name,
            price,
            payment_method,
            remark,
            discount
        FROM 
            transfer_rental 
        WHERE 
            booking_no = %s
        """
        cursor.execute(query, (booking_no,))
        booking = cursor.fetchone()
        
        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": f"Booking not found: {booking_no}"}), 404
        
        print(f"Booking data retrieved: {booking}")  # Debug log
        
        # สร้างไฟล์ Excel
        try:
            excel_file = create_excel_form_transfer(booking)
            print(f"Excel file created at: {excel_file}")  # Debug log
            
            # ปิดการเชื่อมต่อฐานข้อมูล
            cursor.close()
            conn.close()
            
            # ส่งไฟล์กลับไปยังผู้ใช้
            return send_file(
                excel_file,
                as_attachment=True,
                download_name=f"Booking_{booking_no}_{datetime.now().strftime('%Y%m%d')}.xlsx",
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            
        except Exception as e:
            print(f"Error creating Excel: {str(e)}")  # Debug log
            return jsonify({"success": False, "message": f"Failed to create the Excel file: {str(e)}"}), 500
    
    except Exception as e:
        print(f"General error: {str(e)}")  # Debug log
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

def create_excel_form_transfer(booking):
    """Create Excel form from booking data"""
    # Define template path in static folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, 'static', 'templates', 'transfer_template.xlsx')
    
    # ตรวจสอบว่าไฟล์ template มีอยู่จริง
    if not os.path.exists(template_path):
        print(f"Template not found at: {template_path}")  # Debug log
        
        # ตรวจสอบโฟลเดอร์
        templates_dir = os.path.join(script_dir, 'static', 'templates')
        if not os.path.exists(templates_dir):
            os.makedirs(templates_dir)
            print(f"Created templates directory: {templates_dir}")
        
        raise FileNotFoundError(f"Could not find the Excel template file at: {template_path}")
    
    # โหลด Excel template
    workbook = openpyxl.load_workbook(template_path)
    sheet = workbook.active
    
    # Cell mappings ตามที่กำหนด
    cell_mappings = {
        "booking_date": ["J3", "J30"],
        "booking_no": ["J4", "J31"],
        "customer_name": ["D11", "D38", "G25", "G52"],
        "place_from": ["D13", "D40"],
        "place_to": ["D15", "D42"],
        "travel_date": ["H13", "H40"],
        "pickup_time": ["H15", "H42"],
        "quantity": ["E17", "E44"],
        "received": ["H17", "H44"],
        "detail": ["D16", "D19"],
        "payment_status": ["D22", "D49"],
        "staff_name": ["B25", "B52"],
        "remark": ["D21", "D48"],
        "payment_method": ["H22", "H49"]
    }
    
    
    # ใส่ข้อมูลลงในเซลล์ตาม mappings
    for field, cells in cell_mappings.items():
        value = None
        
        # กรณีพิเศษสำหรับชื่อลูกค้าเต็ม
        if field == "customer_name":
            value = booking["full_name"]
        elif field in booking and booking[field] is not None:
            value = booking[field]
        
        # จัดรูปแบบวันที่และเวลา
        if field == "booking_date" or field == "travel_date":
            if value:
                if isinstance(value, (date, datetime)):
                    value = value.strftime("%d/%m/%Y")
        elif field == "pickup_time" and value:
            if isinstance(value, (time, datetime)):
                value = value.strftime("%H:%M")
            elif hasattr(value, 'total_seconds'):
                # กรณีเป็น timedelta
                total_seconds = int(value.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                value = f"{hours:02d}:{minutes:02d}"
            
        # ใส่ข้อมูลลงในทุกเซลล์ที่เกี่ยวข้อง
        if value is not None:
            for cell in cells:
                sheet[cell] = value
    
    
    # สร้างไฟล์ชั่วคราว
    temp_dir = tempfile.gettempdir()
    temp_file = os.path.join(temp_dir, f"{uuid.uuid4()}.xlsx")
    
    # บันทึก workbook ไปยังไฟล์ชั่วคราว
    workbook.save(temp_file)
    
    return temp_file

@app.route("/export_transfers", methods=["POST"])
@login_required
def export_transfers():
    try:
        # Get filter parameters
        filter_type = request.form.get('filter_type', '')
        transfer_type = request.form.get('transfer_type', 'all')
        payment_status = request.form.get('payment_status', 'all')
        
        # Base query - Updated to match new schema with JOIN to get paid amount
        query = """
        SELECT 
            tr.booking_date,
            tr.booking_no, 
            tr.travel_date,
            tr.customer_name, 
            tr.customer_surname, 
            tr.place_from, 
            tr.place_to, 
            tr.detail, 
            tr.staff_name,
            tr.driver_name,
            tr.quantity, 
            tr.received,
            tr.payment_status,
            tr.departure,
            tr.arrivals,
            tr.price,
            tr.payment_method,
            tr.remark,
            tr.discount,
            COALESCE(tt.paid, 0) as paid
        FROM transfer_rental tr
        LEFT JOIN transfer_tabel tt ON (
            (tr.departure = 'yes' AND tr.place_from = tt.place_from AND tr.place_to = tt.place_to) OR
            (tr.arrivals = 'yes' AND tr.place_from = tt.place_from AND tr.place_to = tt.place_to)
        )
        WHERE 1=1
        """
        
        params = []
        
        # Apply date filters based on filter type
        if filter_type == 'date':
            start_date = request.form.get('start_date', '')
            end_date = request.form.get('end_date', '')
            
            if start_date:
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND tr.booking_date <= %s"
                params.append(end_date)
                
        elif filter_type == 'month':
            start_month = request.form.get('start_month', '')
            end_month = request.form.get('end_month', '')
            
            if start_month:
                start_date = f"{start_month}-01"
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_month:
                year, month = map(int, end_month.split('-'))
                if month == 12:
                    next_year = year + 1
                    next_month = 1
                else:
                    next_year = year
                    next_month = month + 1
                
                end_date = f"{next_year}-{next_month:02d}-01"
                query += " AND tr.booking_date < %s"
                params.append(end_date)
                
        elif filter_type == 'year':
            start_year = request.form.get('start_year', '')
            end_year = request.form.get('end_year', '')
            
            if start_year:
                start_date = f"{start_year}-01-01"
                query += " AND tr.booking_date >= %s"
                params.append(start_date)
            
            if end_year:
                end_date = f"{int(end_year) + 1}-01-01"
                query += " AND tr.booking_date < %s"
                params.append(end_date)
        
        # Apply transfer type filter
        if transfer_type == 'departure':
            query += " AND tr.departure = 'yes'"
        elif transfer_type == 'arrivals':
            query += " AND tr.arrivals = 'yes'"
        # 'all' = no additional filter
        
        # Apply payment status filter
        if payment_status == 'paid':
            query += " AND tr.payment_status = 'paid'"
        elif payment_status == 'unpaid':
            query += " AND tr.payment_status = 'unpaid'"
        elif payment_status == 'partial':
            query += " AND tr.payment_status = 'partial'"
        # 'all' = no additional filter
        
        # Order by date and booking number
        query += " ORDER BY tr.booking_date DESC, tr.booking_no DESC"
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Execute query
        cursor.execute(query, params)
        transfers = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Create Excel file
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        
        # Set sheet title based on transfer type
        if transfer_type == 'departure':
            sheet.title = "Departure Transfers"
        elif transfer_type == 'arrivals':
            sheet.title = "Arrival Transfers"
        else:
            sheet.title = "Transfer Bookings"
        
        # Add headers - Updated to match your requested format
        headers = [
            "Booking date", "Booking No.", "Name&Surname", "Driver name", 
            "Departure/Arrivals", "From", "To", "Detail", "Staff Name", 
            "Person", "Price/Person", "Received", "Paid", "Amount", "Payment Method", "Remark", "Discount"
        ]
        
        # Style headers
        for col_num, header in enumerate(headers, 1):
            cell = sheet.cell(row=1, column=col_num)
            cell.value = header
            cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
            cell.fill = openpyxl.styles.PatternFill(
                start_color="366092", end_color="366092", fill_type="solid"
            )
            cell.alignment = openpyxl.styles.Alignment(horizontal="center", vertical="center")
        
        # Add data rows
        for row_num, transfer in enumerate(transfers, 2):
            # Format booking date
            booking_date = transfer['booking_date']
            if isinstance(booking_date, (date, datetime)):
                booking_date = booking_date.strftime("%d/%m/%Y")
            
            # Calculate price per person
            price_per_person = 0
            if transfer['quantity'] and transfer['quantity'] > 0:
                price_per_person = transfer['received'] / transfer['quantity']
            
            # Calculate amount (difference between received and paid)
            paid_amount = transfer['paid'] if transfer['paid'] else 0
            amount = transfer['received'] - paid_amount
            
            # Full name
            full_name = f"{transfer['customer_name']} {transfer['customer_surname']}"
            
            # Transfer type display
            transfer_type_text = "Unknown"
            if transfer['departure'] == 'yes':
                transfer_type_text = "Departure"
            elif transfer['arrivals'] == 'yes':
                transfer_type_text = "Arrivals"
            
            # Add row data
            row_data = [
                booking_date,                    # Booking date
                transfer['booking_no'],          # Booking No.
                full_name,                       # Name&Surname
                transfer['driver_name'] or '',   # Driver name
                transfer_type_text,              # Departure/Arrivals
                transfer['place_from'],          # From
                transfer['place_to'],            # To
                transfer['detail'] or '',        # Detail
                transfer['staff_name'],          # Staff Name
                transfer['quantity'],            # Person
                round(price_per_person, 2),      # Price/Person
                transfer['received'],            # Received
                paid_amount,                     # Paid
                round(amount, 2),                 # Amount (Received - Paid)
                transfer['payment_method'],
                transfer['remark'],
                transfer['discount']
            ]
            
            for col_num, cell_value in enumerate(row_data, 1):
                cell = sheet.cell(row=row_num, column=col_num)
                cell.value = cell_value
                
                # Add alternating row colors for better readability
                if row_num % 2 == 0:
                    cell.fill = openpyxl.styles.PatternFill(
                        start_color="F8F9FA", end_color="F8F9FA", fill_type="solid"
                    )
        
        # Auto-size columns
        for column in sheet.columns:
            max_length = 0
            column_letter = openpyxl.utils.get_column_letter(column[0].column)
            for cell in column:
                if cell.value:
                    cell_length = len(str(cell.value))
                    if cell_length > max_length:
                        max_length = cell_length
            
            adjusted_width = min(max_length + 2, 50)  # Cap at 50 characters
            sheet.column_dimensions[column_letter].width = adjusted_width

        # Add TOTAL row at the end of data
        total_row = len(transfers) + 2
        sheet.cell(row=total_row, column=11).value = "Total"
        sheet.cell(row=total_row, column=11).font = openpyxl.styles.Font(bold=True)

        # SUM formulas for columns M (13), N (14), and O (15)
        sheet.cell(row=total_row, column=12).value = f"=SUM(L2:L{total_row - 1})"
        sheet.cell(row=total_row, column=13).value = f"=SUM(M2:M{total_row - 1})"
        sheet.cell(row=total_row, column=14).value = f"=SUM(N2:N{total_row - 1})"
        # Optional styling for TOTAL row
        for col in range(11, 15):
            cell = sheet.cell(row=total_row, column=col)
            cell.fill = openpyxl.styles.PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid")
            cell.font = openpyxl.styles.Font(bold=True)

        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        workbook.save(temp_file.name)
        temp_file.close()
        
        # Send the file
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f"Transfers_Export_{datetime.now().strftime('%Y%m%d')}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    
# ---------------------------------- For update Tabel ----------------------------------------------
# เพิ่ม routes เหล่านี้ใน Flask app ของคุณ

@app.route("/data_management")
@login_required
def data_management():
        # ตรวจสอบว่าเป็น admin หรือไม่
    if session.get('role') != 'admin':
        flash('Access Denied: Admin only feature', 'error')
        return redirect(url_for('home'))
        
    return render_template("P3_data_management.html")

# API สำหรับ Tour Data
@app.route("/api/tour_data", methods=["GET"])
@login_required
def get_tour_data():

    if session.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access Denied: Admin only"})

    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM tour_tabel ORDER BY id"
        cursor.execute(query)
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/api/update_tour_data", methods=["POST"])
@login_required
def update_tour_data():

    
    if session.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access Denied: Admin only"})

    try:
        data = request.json.get('data', [])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ลบข้อมูลทั้งหมดในตาราง
        cursor.execute("DELETE FROM tour_tabel")
        
        # เพิ่มข้อมูลใหม่
        for item in data:
            query = """
            INSERT INTO tour_tabel (company_name, detail, received, paid) 
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (
                item['company_name'], 
                item['detail'], 
                item['received'], 
                item['paid']
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Tour data updated successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# API สำหรับ Motorbike Data
@app.route("/api/motorbike_data", methods=["GET"])
@login_required
def get_motorbike_data():

    
    if session.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access Denied: Admin only"})

    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM motorbike_tabel ORDER BY id"
        cursor.execute(query)
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/api/update_motorbike_data", methods=["POST"])
@login_required
def update_motorbike_data():

    
    if session.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access Denied: Admin only"})

    try:
        data = request.json.get('data', [])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ลบข้อมูลทั้งหมดในตาราง
        cursor.execute("DELETE FROM motorbike_tabel")
        
        # เพิ่มข้อมูลใหม่
        for item in data:
            query = """
            INSERT INTO motorbike_tabel (company_name, detail, received, paid) 
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (
                item['company_name'], 
                item['detail'], 
                item['received'], 
                item['paid']
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Motorbike data updated successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

# API สำหรับ Transfer Data
@app.route("/api/transfer_data", methods=["GET"])
@login_required
def get_transfer_data():

    
    if session.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access Denied: Admin only"})

    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM transfer_tabel ORDER BY id"
        cursor.execute(query)
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route("/api/update_transfer_data", methods=["POST"])
@login_required
def update_transfer_data():

    
    if session.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access Denied: Admin only"})

    try:
        data = request.json.get('data', [])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ลบข้อมูลทั้งหมดในตาราง
        cursor.execute("DELETE FROM transfer_tabel")
        
        # เพิ่มข้อมูลใหม่
        for item in data:
            query = """
            INSERT INTO transfer_tabel (place_from, place_to, passengers, received, paid) 
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                item['place_from'], 
                item['place_to'], 
                item['passengers'], 
                item['received'], 
                item['paid']
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Transfer data updated successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    
if __name__ == "__main__":   
    app.run()