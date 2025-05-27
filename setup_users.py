# setup_users_with_role.py

import mysql.connector
from werkzeug.security import generate_password_hash

def setup_users():
    try:
        # เชื่อมต่อฐานข้อมูล
        conn = mysql.connector.connect(
            host="127.0.0.1",
            port="3306",
            user="root",
            password="0821411984",
            database="booking_system"
        )
        cursor = conn.cursor()
        
        # เพิ่มคอลัมน์ role ถ้ายังไม่มี
        try:
            cursor.execute("ALTER TABLE login ADD COLUMN role VARCHAR(50) DEFAULT 'staff' NOT NULL")
            print("✅ Added role column to login table")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("ℹ️  Role column already exists")
            else:
                print(f"❌ Error adding role column: {e}")
        
        # ลบข้อมูลเก่า
        cursor.execute("DELETE FROM login")
        print("🗑️  Cleared existing user data")
        
        # รายการผู้ใช้ที่จะเพิ่ม (username, password, first_name, last_name, role)
        users = [
            ('admin', 'admin1234', 'Admin', 'User', 'admin'),
            ('staff1', 'staff123', 'Staff', 'One', 'staff'),
            ('manager', 'manager123', 'Manager', 'System', 'manager'),
            ('sr_manager', 'srmanager123', 'Senior Manager', 'System', 'senior_manager')            
        ]
        
        # เพิ่มผู้ใช้ใหม่พร้อม hash รหัสผ่านและ role
        for username, password, first_name, last_name, role in users:
            hashed_password = generate_password_hash(password)
            
            query = """
            INSERT INTO login (username, pass, first_name, last_name, role) 
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(query, (username, hashed_password, first_name, last_name, role))
            print(f"👤 Added user: {username} (role: {role})")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n🎉 All users created successfully!")
        print("\n📋 Login credentials:")
        print("=" * 50)
        
        # แสดงข้อมูล login ทั้งหมด
        for username, password, first_name, last_name, role in users:
            admin_flag = " 🔑 (CAN ACCESS SETTING)" if role == 'admin' else " 🚫 (NO SETTING ACCESS)"
            print(f"Username: {username:<12} | Password: {password:<15} | Role: {role:<12}{admin_flag}")
        
        print("=" * 50)
        print("Note: Only 'admin' role can access Data Management/Setting page")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    setup_users()