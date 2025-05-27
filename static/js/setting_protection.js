// static/js/setting_protection.js

document.addEventListener('DOMContentLoaded', function() {
    // อ่านข้อมูล role จาก data attribute
    const userRole = document.body.getAttribute('data-user-role');
    const isAdmin = userRole === 'admin';
    
    // หาลิงก์ data_management
    const settingLink = document.querySelector('a[href="data_management"]');
    
    if (settingLink && !isAdmin) {
        // ถ้าไม่ใช่ admin ให้ป้องกันการคลิก
        settingLink.addEventListener('click', function(e) {
            e.preventDefault(); // ป้องกันการคลิก
            alert('Access Denied: Admin only feature');
            return false;
        });
        
        // เปลี่ยนสีให้ดูเป็น disabled (optional)
        settingLink.style.opacity = '0.5';
        settingLink.style.cursor = 'not-allowed';
        settingLink.title = 'Admin access required';
    }
    
    // Debug: แสดงข้อมูลใน console
    console.log('User role:', userRole);
    console.log('Is admin:', isAdmin);
});