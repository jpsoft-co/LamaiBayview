// ===============================================
// UNIVERSAL BOOKING JAVASCRIPT - TOUR & MOTORBIKE
// ===============================================

// Global variables
window.tourCompanies = [];
window.motorbikeCompanies = [];

// ===============================================
// UTILITY FUNCTIONS - AUTO DETECTION
// ===============================================

// ⚠️ Function ตรวจสอบประเภทหน้าปัจจุบัน
function getCurrentBookingType() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('tour')) {
        return 'tour';
    } else if (currentPath.includes('motorbike')) {
        return 'motorbike';
    }
    return 'tour'; // default
}

// ⚠️ Function ดึง API endpoint ที่ถูกต้อง
function getApiEndpoint(action) {
    const bookingType = getCurrentBookingType();
    
    const endpoints = {
        'tour': {
            'submit': '/submit_tour_booking',
            'search': '/search_tour_bookings',
            'export': '/export_tour',
            'companies': '/api/companies'  // ใช้ร่วมกัน
        },
        'motorbike': {
            'submit': '/submit_motorbike_booking',
            'search': '/search_motorbike_bookings', 
            'export': '/export_motorbike',
            'companies': '/api/companies'  // ใช้ร่วมกัน
        }
    };
    
    return endpoints[bookingType][action];
}

// ⚠️ Function ดึง companies ตามประเภท
function getCurrentCompanies() {
    const bookingType = getCurrentBookingType();
    return bookingType === 'tour' ? window.tourCompanies : window.motorbikeCompanies;
}

// ===============================================
// MAIN FORM FUNCTIONS (สำหรับหน้า form)
// ===============================================

// ฟังก์ชันสำหรับจัดการการเปลี่ยน Company
function handleCompanyChange() {
    const bookingType = getCurrentBookingType();
    const companyName = document.getElementById('company').value;
    const detailSelect = document.getElementById('detail');
    const priceInput = document.getElementById('price');
    
    if (!detailSelect || !priceInput) return;
    
    // Clear detail dropdown and price
    detailSelect.innerHTML = '<option value="">-- Select Detail --</option>';
    priceInput.value = '';
    
    if (!companyName) {
        calculateTotal();
        return;
    }
    
    // Fetch details for selected company
    const formData = new FormData();
    formData.append('experience_type', bookingType);  // ⚠️ ใช้ dynamic type
    formData.append('company_name', companyName);
    
    fetch('/get_company_details', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            data.details.forEach(detailData => {
                const option = document.createElement('option');
                option.value = detailData.detail;
                option.textContent = detailData.detail;
                option.dataset.price = detailData.received;
                detailSelect.appendChild(option);
            });
        } else {
            console.error('Error loading details:', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
    
    calculateTotal();
}

// ฟังก์ชันสำหรับจัดการการเปลี่ยน Detail
function handleDetailChange() {
    const detailSelect = document.getElementById('detail');
    const priceInput = document.getElementById('price');
    
    if (!detailSelect || !priceInput) return;
    
    if (detailSelect.selectedIndex > 0) {
        const selectedOption = detailSelect.options[detailSelect.selectedIndex];
        const price = selectedOption.dataset.price || '';
        priceInput.value = price;
    } else {
        priceInput.value = '';
    }
    
    calculateTotal();
}

// ฟังก์ชันคำนวณยอดรวม
function calculateTotal() {
    const priceInput = document.getElementById('price');
    const personsInput = document.getElementById('persons');
    const totalInput = document.getElementById('total');
    
    if (!priceInput || !personsInput || !totalInput) return;
    
    const price = parseFloat(priceInput.value) || 0;
    const persons = parseInt(personsInput.value) || 0;
    const total = price * persons;
    totalInput.value = total.toFixed(2);
}

// ===============================================
// EDIT MODAL FUNCTIONS (สำหรับ Edit Modal)
// ===============================================

// ฟังก์ชันสำหรับจัดการการเปลี่ยน Company ใน Edit Modal
function handleEditCompanyChange() {
    const bookingType = getCurrentBookingType();
    const companyName = document.getElementById('edit_company').value;
    const detailSelect = document.getElementById('edit_detail');
    const priceInput = document.getElementById('edit_price');
    
    if (!detailSelect || !priceInput) return;
    
    // Clear detail dropdown and price
    detailSelect.innerHTML = '<option value="">-- Select Detail --</option>';
    priceInput.value = '';
    
    if (!companyName) return;
    
    // Fetch details for selected company
    const formData = new FormData();
    formData.append('experience_type', bookingType);  // ⚠️ ใช้ dynamic type
    formData.append('company_name', companyName);
    
    fetch('/get_company_details', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            data.details.forEach(detailData => {
                const option = document.createElement('option');
                option.value = detailData.detail;
                option.textContent = detailData.detail;
                option.dataset.price = detailData.received;
                detailSelect.appendChild(option);
            });
        } else {
            console.error('Error loading details:', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// ฟังก์ชันสำหรับจัดการการเปลี่ยน Detail ใน Edit Modal
function handleEditDetailChange() {
    const detailSelect = document.getElementById('edit_detail');
    const priceInput = document.getElementById('edit_price');
    
    if (!detailSelect || !priceInput) return;
    
    if (detailSelect.selectedIndex > 0) {
        const selectedOption = detailSelect.options[detailSelect.selectedIndex];
        const price = selectedOption.dataset.price || '';
        priceInput.value = price;
    } else {
        priceInput.value = '';
    }
}

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// ฟังก์ชันโหลดข้อมูล companies
function loadCompaniesData() {
    return fetch('/api/companies')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.tourCompanies = data.tour_companies;
                window.motorbikeCompanies = data.motorbike_companies;
                
                // Initialize dropdowns after data is loaded
                if (typeof initializeCompanyDropdown === 'function') {
                    initializeCompanyDropdown();
                }
                return true;
            } else {
                console.error('Error loading companies:', data.message);
                return false;
            }
        })
        .catch(error => {
            console.error('Error loading companies:', error);
            return false;
        });
}

// ⚠️ ฟังก์ชันเริ่มต้น company dropdown ตามประเภท
function initializeCompanyDropdown() {
    const companySelect = document.getElementById('company');
    if (!companySelect) return;
    
    const companies = getCurrentCompanies();
    
    // Clear existing options
    companySelect.innerHTML = '<option value="">-- Select Company --</option>';
    
    // Populate company dropdown
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
    });
}

// ปรับปรุงฟังก์ชัน showAlert ให้ทำงานร่วมกับ notification system ได้ดีขึ้น
function showAlert(message, type) {
    // ลองใช้ notification system ก่อน (ดีกว่า alert container)
    if (typeof showNotification === 'function') {
        let notificationType;
        switch (type) {
            case 'success': 
                notificationType = 'success'; 
                break;
            case 'danger': 
            case 'error':
                notificationType = 'error'; 
                break;
            case 'info': 
                notificationType = 'info'; 
                break;
            case 'warning': 
                notificationType = 'warning'; 
                break;
            default: 
                notificationType = 'info';
        }
        
        let duration = 5000; // default 5 seconds
        if (type === 'success') duration = 4000;
        if (type === 'error' || type === 'danger') duration = 7000;
        if (type === 'info') duration = 3000;
        
        showNotification(message, notificationType, duration, true);
        return;
    }
    
    // Fallback 1: ใช้ alert container ถ้ามี
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.textContent = message;
        alertContainer.className = `alert alert-${type}`;
        alertContainer.style.display = 'block';
        
        setTimeout(() => {
            alertContainer.style.display = 'none';
        }, 3000);
        return;
    }
    
    // Fallback 2: ใช้ browser alert เป็นทางเลือกสุดท้าย
    console.warn('No notification system found, using browser alert');
    alert(message);
}

// เพิ่มฟังก์ชันสำหรับแสดง notification แบบเฉพาะเจาะจง
function showSuccessAlert(message) { showAlert(message, 'success'); }
function showErrorAlert(message) { showAlert(message, 'danger'); }
function showInfoAlert(message) { showAlert(message, 'info'); }
function showWarningAlert(message) { showAlert(message, 'warning'); }

// ฟังก์ชันสำหรับแสดง loading notification
function showLoadingNotification(message = 'Processing...') {
    if (typeof showNotification === 'function') {
        return showNotification(message, 'info', 0, false);
    }
    return null;
}

// ฟังก์ชันสำหรับปิด loading notification
function hideLoadingNotification(notification) {
    if (notification && typeof removeNotification === 'function') {
        removeNotification(notification);
    }
}

// ===============================================
// BOOKING MANAGEMENT FUNCTIONS
// ===============================================

// ⚠️ ฟังก์ชันยกเลิกการจอง - เพิ่ม booking_type
function cancelBookings() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select at least one booking to cancel.');
        return;
    }
    
    if (confirm('Are you sure you want to cancel the selected bookings?')) {
        const form = document.getElementById('actionForm');
        const formData = new FormData(form);
        
        // ⚠️ เพิ่ม booking_type
        formData.append('booking_type', getCurrentBookingType());
        
        fetch('/cancel_bookings', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert(data.message, 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showAlert(data.message, 'danger');
            }
        })
        .catch(error => {
            showAlert('An error occurred. Please try again.', 'danger');
            console.error('Error:', error);
        });
    }
}

// ⚠️ ฟังก์ชันแก้ไขการจอง - เพิ่ม booking_type
function editBooking() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select a booking to edit.', 'info');
        return;
    }
    
    if (selectedBookings.length > 1) {
        showAlert('Please select only one booking to edit.', 'info');
        return;
    }
    
    const bookingNo = selectedBookings[0].value;
    showAlert('Loading booking details...', 'info');
    
    // โหลดข้อมูล companies ก่อน (ถ้ายังไม่มี)
    if (!window.tourCompanies || !window.motorbikeCompanies || 
        window.tourCompanies.length === 0 || window.motorbikeCompanies.length === 0) {
        
        fetch('/api/companies')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.tourCompanies = data.tour_companies;
                    window.motorbikeCompanies = data.motorbike_companies;
                    loadBookingDetailsForEdit(bookingNo);
                } else {
                    showAlert('Error loading company data', 'danger');
                }
            })
            .catch(error => {
                console.error('Error loading companies:', error);
                showAlert('Error loading company data', 'danger');
            });
    } else {
        loadBookingDetailsForEdit(bookingNo);
    }
}

// ⚠️ ฟังก์ชันโหลดข้อมูลการจองสำหรับแก้ไข - เพิ่ม booking_type
function loadBookingDetailsForEdit(bookingNo) {
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    formData.append('booking_type', getCurrentBookingType());  // ⚠️ เพิ่มบรรทัดนี้
    
    fetch('/get_booking_details', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const booking = data.booking;
            console.log("Booking data received:", booking);
            
            // ข้อมูลพื้นฐาน
            document.getElementById('edit_booking_no').value = booking.booking_no;
            document.getElementById('edit_date').value = booking.travel_date || '';
            document.getElementById('edit_time').value = booking.pickup_time || '';
            document.getElementById('edit_name').value = booking.customer_name || '';
            document.getElementById('edit_surname').value = booking.customer_surname || '';
            document.getElementById('edit_room').value = booking.room || '';
            document.getElementById('edit_persons').value = booking.quantity || '1';
            document.getElementById('edit_status').value = booking.payment_status || 'unpaid';
            document.getElementById('edit_staffName').value = booking.staff_name || '';
            
            // ⚠️ ตั้งค่า companies ตามประเภทปัจจุบัน
            initializeEditCompanies();
            
            // รอให้ companies โหลดเสร็จแล้วค่อยตั้งค่า
            setTimeout(() => {
                if (booking.company_name) {
                    document.getElementById('edit_company').value = booking.company_name;
                    handleEditCompanyChange();
                    
                    // รอให้ details โหลดเสร็จแล้วค่อยตั้งค่า
                    setTimeout(() => {
                        if (booking.detail) {
                            document.getElementById('edit_detail').value = booking.detail;
                            handleEditDetailChange(); // ตั้งค่าราคา
                        }
                    }, 500);
                }
            }, 300);
            
            // ซ่อน alert และแสดง modal
            const alertContainer = document.getElementById('alert-container');
            if (alertContainer) {
                alertContainer.style.display = 'none';
            }
            
            document.getElementById('editModal').style.display = 'block';
        } else {
            showAlert(data.message || 'Error fetching booking details', 'danger');
        }
    })
    .catch(error => {
        console.error('Error details:', error);
        showAlert('An error occurred while fetching booking details.', 'danger');
    });
}

// ⚠️ ฟังก์ชันเริ่มต้น companies ใน edit modal
function initializeEditCompanies() {
    const companySelect = document.getElementById('edit_company');
    if (!companySelect) return;
    
    const companies = getCurrentCompanies();
    
    // Clear existing options
    companySelect.innerHTML = '<option value="">-- Select Company --</option>';
    
    // Populate company dropdown
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
    });
}

// ฟังก์ชันปิด Modal
function closeModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
}

// ⚠️ ฟังก์ชันบันทึกการแก้ไข - เพิ่ม booking_type
function saveBooking() {
    const form = document.getElementById('editForm');
    if (!form) {
        showAlert('Edit form not found', 'danger');
        return;
    }
    
    const formData = new FormData(form);
    formData.append('booking_type', getCurrentBookingType());  // ⚠️ เพิ่มบรรทัดนี้
    
    fetch('/update_booking', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();
            showAlert(data.message, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        showAlert('An error occurred while saving booking data.', 'danger');
        console.error('Error:', error);
    });
}

// ===============================================
// EXPORT FUNCTIONS - Updated for Dynamic Type
// ===============================================

// ⚠️ ฟังก์ชันเปิด Export Modal - รองรับทั้ง Tour และ Motorbike
function exportBooking() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Format dates for input fields
    const todayFormatted = today.toISOString().split('T')[0];
    const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
    
    // Set default values for date range
    const exportStartDate = document.getElementById('export_start_date');
    const exportEndDate = document.getElementById('export_end_date');
    
    if (exportStartDate) exportStartDate.value = firstDayFormatted;
    if (exportEndDate) exportEndDate.value = todayFormatted;
    
    // Set default values for month range
    const currentYearMonth = today.toISOString().substr(0, 7); // YYYY-MM format
    const exportStartMonth = document.getElementById('export_start_month');
    const exportEndMonth = document.getElementById('export_end_month');
    
    if (exportStartMonth) exportStartMonth.value = currentYearMonth;
    if (exportEndMonth) exportEndMonth.value = currentYearMonth;
    
    // Set default values for year range
    const currentYear = today.getFullYear();
    const exportStartYear = document.getElementById('export_start_year');
    const exportEndYear = document.getElementById('export_end_year');
    
    if (exportStartYear) exportStartYear.value = currentYear;
    if (exportEndYear) exportEndYear.value = currentYear;
    
    // ⚠️ อัพเดตชื่อ modal ตามประเภท
    const exportModal = document.getElementById('exportModal');
    const modalTitle = exportModal.querySelector('h2');
    if (modalTitle) {
        const bookingType = getCurrentBookingType();
        const typeName = bookingType === 'tour' ? 'Tour' : 'Motorbike';
        modalTitle.textContent = `Export ${typeName} Data`;
    }
    
    // Display the export modal
    if (exportModal) {
        exportModal.style.display = 'block';
        // Initialize the fields display
        toggleExportFields();
    }
}

// ฟังก์ชันปิด Export Modal
function closeExportModal() {
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.style.display = 'none';
    }
}

// ฟังก์ชันสลับระหว่างช่องกรอกข้อมูลตามประเภทการกรอง
function toggleExportFields() {
    const filterTypeRadio = document.querySelector('input[name="exportFilterType"]:checked');
    if (!filterTypeRadio) return;
    
    const filterType = filterTypeRadio.value;
    
    // ซ่อนทุกช่องกรอกก่อน
    const dateRangeFields = document.getElementById('dateRangeFields');
    const monthRangeFields = document.getElementById('monthRangeFields');
    const yearRangeFields = document.getElementById('yearRangeFields');
    
    if (dateRangeFields) dateRangeFields.style.display = 'none';
    if (monthRangeFields) monthRangeFields.style.display = 'none';
    if (yearRangeFields) yearRangeFields.style.display = 'none';
    
    // แสดงช่องกรอกตามประเภทที่เลือก
    if (filterType === 'date' && dateRangeFields) {
        dateRangeFields.style.display = 'block';
    } else if (filterType === 'month' && monthRangeFields) {
        monthRangeFields.style.display = 'block';
    } else if (filterType === 'year' && yearRangeFields) {
        yearRangeFields.style.display = 'block';
    }
}

// ⚠️ ฟังก์ชันส่งข้อมูลเพื่อ Export - ใช้ dynamic endpoint
function submitExport() {
    const filterTypeRadio = document.querySelector('input[name="exportFilterType"]:checked');
    const paymentStatusRadio = document.querySelector('input[name="exportPaymentStatus"]:checked');
    
    if (!filterTypeRadio) {
        showAlert('Please select filter type', 'info');
        return;
    }
    
    const filterType = filterTypeRadio.value;
    const paymentStatus = paymentStatusRadio ? paymentStatusRadio.value : 'all';
    
    let formData = new FormData();
    formData.append('filter_type', filterType);
    formData.append('payment_status', paymentStatus);
    
    // เพิ่มข้อมูลตามประเภทการกรอง (เหมือนเดิม)
    if (filterType === 'date') {
        const startDate = document.getElementById('export_start_date');
        const endDate = document.getElementById('export_end_date');
        
        if (!startDate || !endDate || !startDate.value || !endDate.value) {
            showAlert('Please select both start and end dates', 'info');
            return;
        }
        
        if (new Date(startDate.value) > new Date(endDate.value)) {
            showAlert('Start date must be before or equal to end date', 'warning');
            return;
        }
        
        formData.append('start_date', startDate.value);
        formData.append('end_date', endDate.value);
        
    } else if (filterType === 'month') {
        const startMonth = document.getElementById('export_start_month');
        const endMonth = document.getElementById('export_end_month');
        
        if (!startMonth || !endMonth || !startMonth.value || !endMonth.value) {
            showAlert('Please select both start and end months', 'info');
            return;
        }
        
        if (new Date(startMonth.value + '-01') > new Date(endMonth.value + '-01')) {
            showAlert('Start month must be before or equal to end month', 'warning');
            return;
        }
        
        formData.append('start_month', startMonth.value);
        formData.append('end_month', endMonth.value);
        
    } else if (filterType === 'year') {
        const startYear = document.getElementById('export_start_year');
        const endYear = document.getElementById('export_end_year');
        
        if (!startYear || !endYear || !startYear.value || !endYear.value) {
            showAlert('Please select both start and end years', 'info');
            return;
        }
        
        if (parseInt(startYear.value) > parseInt(endYear.value)) {
            showAlert('Start year must be before or equal to end year', 'warning');
            return;
        }
        
        formData.append('start_year', startYear.value);
        formData.append('end_year', endYear.value);
    }
    
    // แสดงข้อความกำลังดำเนินการ
    showAlert('Generating Excel file...', 'info');
    
    // ⚠️ ส่งข้อมูลไปยัง dynamic endpoint
    fetch(getApiEndpoint('export'), {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'An error occurred');
            });
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                throw new Error(data.message || 'An error occurred');
            });
        } else {
            return response.blob();
        }
    })
    .then(blob => {
        // สร้าง URL สำหรับ blob object
        const url = window.URL.createObjectURL(blob);
        
        // สร้าง element สำหรับดาวน์โหลด
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // ⚠️ กำหนดชื่อไฟล์ตามประเภท
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const bookingType = getCurrentBookingType();
        const typeName = bookingType === 'tour' ? 'Tour' : 'Motorbike';
        
        let filename = `${typeName}_Export_${dateStr}.xlsx`;
        a.download = filename;
        
        // เพิ่ม element ไปที่ DOM และ trigger การคลิก
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // ปิด modal และแสดงข้อความสำเร็จ
        closeExportModal();
        showAlert('Export completed successfully', 'success');
    })
    .catch(error => {
        console.error('Export error:', error);
        showAlert(`Error: ${error.message}`, 'danger');
    });
}

// ⚠️ ฟังก์ชันสำหรับ Print Excel - เพิ่ม booking_type
function printToExcel() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('กรุณาเลือกรายการที่ต้องการพิมพ์', 'info');
        return;
    }
    
    if (selectedBookings.length > 1) {
        showAlert('กรุณาเลือกเพียงรายการเดียวเท่านั้น', 'info');
        return;
    }
    
    const bookingNo = selectedBookings[0].value;
    
    // Show loading message
    showAlert('กำลังสร้างไฟล์ Excel...', 'info');
    
    // ⚠️ เพิ่ม booking_type
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    formData.append('booking_type', getCurrentBookingType());
    
    fetch('/generate_excel_form', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'เกิดข้อผิดพลาด');
            });
        }
        
        // ตรวจสอบประเภทของ response ก่อนดาวน์โหลด
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            // กรณีเป็น JSON (error message)
            return response.json().then(data => {
                throw new Error(data.message || 'เกิดข้อผิดพลาด');
            });
        } else {
            // กรณีเป็นไฟล์ Excel
            return response.blob();
        }
    })
    .then(blob => {
        // สร้าง URL สำหรับ blob object
        const url = window.URL.createObjectURL(blob);
        
        // สร้าง element สำหรับดาวน์โหลด
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // ⚠️ กำหนดชื่อไฟล์ตามประเภท
        const bookingType = getCurrentBookingType();
        const typeName = bookingType === 'tour' ? 'Tour' : 'Motorbike';
        a.download = `${typeName}_Booking_${bookingNo}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
        
        // เพิ่ม element ไปที่ DOM และ trigger การคลิก
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('ดาวน์โหลดไฟล์สำเร็จ', 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    });
}

// ===============================================
// EVENT LISTENERS & INITIALIZATION
// ===============================================

// Event listener สำหรับปิด modal เมื่อคลิกนอกพื้นที่
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const exportModal = document.getElementById('exportModal');
    
    if (event.target == editModal) {
        closeModal();
    } else if (event.target == exportModal) {
        closeExportModal();
    }
};

// Initialize เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    // Load companies data
    loadCompaniesData().then(success => {
        console.log('Companies data loaded:', success);
        
        // Initialize form elements if they exist
        const priceInput = document.getElementById('price');
        const personsInput = document.getElementById('persons');
        const totalInput = document.getElementById('total');
        
        if (priceInput && personsInput && totalInput) {
            priceInput.addEventListener('input', calculateTotal);
            personsInput.addEventListener('input', calculateTotal);
        }
        
        // ⚠️ Form submission handler - ใช้ dynamic endpoint
        const form = document.getElementById('luxuryBookingForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // แสดง loading notification
                const loadingNotif = showLoadingNotification('Submitting booking...');
                
                const formData = new FormData(form);
                
                // ⚠️ ส่งไปยัง dynamic endpoint
                fetch(getApiEndpoint('submit'), {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    // ปิด loading notification
                    if (loadingNotif) {
                        hideLoadingNotification(loadingNotif);
                    }
                    
                    if (data.success) {
                        // ใช้ showSuccessAlert แทน alert
                        const bookingType = getCurrentBookingType();
                        const typeName = bookingType === 'tour' ? 'Tour' : 'Motorbike';
                        showSuccessAlert(`${typeName} booking submitted successfully! Booking Number: ${data.booking_no}`);
                        form.reset();
                        initializeCompanyDropdown(); // ⚠️ Reset dropdown
                    } else {
                        // ใช้ showErrorAlert แทน alert  
                        showErrorAlert(`Error: ${data.message}`);
                    }
                })
                .catch(error => {
                    // ปิด loading notification
                    if (loadingNotif) {
                        hideLoadingNotification(loadingNotif);
                    }
                    // ใช้ showErrorAlert แทน alert
                    showErrorAlert(`An error occurred: ${error.message}`);
                });
            });
        }
        
        // ⚠️ Search form submission - ใช้ dynamic endpoint
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            // เปลี่ยน action ตาม booking type
            const bookingType = getCurrentBookingType();
            if (bookingType === 'tour') {
                searchForm.action = '/search_tour_bookings';
            } else {
                searchForm.action = '/search_motorbike_bookings';
            }
        }
        
        // Date validation
        const startDate = document.getElementById('start_date');
        const endDate = document.getElementById('end_date');
        
        if (startDate && endDate) {
            startDate.addEventListener('change', function() {
                if (startDate.value) {
                    endDate.min = startDate.value;
                    if (endDate.value && endDate.value < startDate.value) {
                        endDate.value = startDate.value;
                    }
                } else {
                    endDate.min = "";
                }
            });
        }
        
        const searchDate = document.getElementById('searchDate');
        const searchDateTo = document.getElementById('searchDateTo');
        
        if (searchDate && searchDateTo) {
            searchDate.addEventListener('change', function() {
                searchDateTo.min = searchDate.value;
                if (searchDateTo.value && searchDateTo.value < searchDate.value) {
                    searchDateTo.value = searchDate.value;
                }
            });
        }
    });
    
    // เพิ่ม event listeners สำหรับ Export Modal radio buttons
    const exportFilterRadios = document.querySelectorAll('input[name="exportFilterType"]');
    exportFilterRadios.forEach(radio => {
        radio.addEventListener('change', toggleExportFields);
    });
    
    // ปิด modal เมื่อคลิกนอกพื้นที่
    window.addEventListener('click', function(event) {
        const exportModal = document.getElementById('exportModal');
        const editModal = document.getElementById('editModal');
        
        if (event.target === exportModal) {
            closeExportModal();
        } else if (event.target === editModal) {
            closeModal();
        }
    });
});

// ===============================================
// SHARED UTILITY FUNCTIONS
// ===============================================

// เพิ่มฟังก์ชันสำหรับ calculate total ใน edit modal
function calculateEditTotal() {
    const priceInput = document.getElementById('edit_price');
    const personsInput = document.getElementById('edit_persons');
    
    if (!priceInput || !personsInput) return;
    
    const price = parseFloat(priceInput.value) || 0;
    const persons = parseInt(personsInput.value) || 0;
    const total = price * persons;
    
    // อัพเดต display ถ้ามี element สำหรับแสดงผล
    const totalDisplay = document.getElementById('edit_total');
    if (totalDisplay) {
        totalDisplay.value = total.toFixed(2);
    }
    
    console.log(`Edit Total: ${price} × ${persons} = ${total}`);
}

// ===============================================
// DEBUG & LOGGING FUNCTIONS
// ===============================================

// ฟังก์ชันสำหรับ debug ข้อมูล booking type
function debugBookingType() {
    const currentType = getCurrentBookingType();
    const currentPath = window.location.pathname;
    const companies = getCurrentCompanies();
    
    console.log('=== BOOKING TYPE DEBUG ===');
    console.log('Current Path:', currentPath);
    console.log('Detected Type:', currentType);
    console.log('Available Companies:', companies.length);
    console.log('Companies:', companies);
    console.log('========================');
}

// เรียกใช้ debug เมื่อโหลดหน้า (สำหรับ development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(debugBookingType, 1000);
    });
}