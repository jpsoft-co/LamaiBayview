// P1P3_script.js

// ===============================================
// UNIVERSAL BOOKING JAVASCRIPT - TOUR & MOTORBIKE (WITH ENHANCED DISCOUNT)
// ===============================================

// Global variables
window.tourCompanies = [];
window.motorbikeCompanies = [];

// ===============================================
// ENHANCED DISCOUNT CALCULATION FUNCTIONS
// ===============================================

/**
 * คำนวณส่วนลดที่รองรับทั้งจำนวนเงินและเปอร์เซ็นต์
 * @param {string|number} discountInput - ค่าส่วนลดที่ผู้ใช้กรอก (เช่น "100", "20%", "15.5%")
 * @param {number} subtotal - ยอดรวมก่อนหักส่วนลด
 * @returns {object} - {discountAmount: number, finalTotal: number, isPercentage: boolean}
 */
function calculateDiscount(discountInput, subtotal) {
    if (!discountInput || discountInput === '' || subtotal <= 0) {
        return {
            discountAmount: 0,
            finalTotal: subtotal,
            isPercentage: false
        };
    }
    
    // แปลงเป็น string และตัดช่องว่าง
    const discountStr = String(discountInput).trim();
    
    // ตรวจสอบว่าเป็น percentage หรือไม่
    if (discountStr.includes('%')) {
        // กรณีเป็นเปอร์เซ็นต์
        const percentageValue = parseFloat(discountStr.replace('%', ''));
        
        if (isNaN(percentageValue) || percentageValue < 0) {
            return {
                discountAmount: 0,
                finalTotal: subtotal,
                isPercentage: true,
                error: "Invalid percentage value"
            };
        }
        
        if (percentageValue > 100) {
            return {
                discountAmount: 0,
                finalTotal: subtotal,
                isPercentage: true,
                error: "Percentage cannot exceed 100%"
            };
        }
        
        const discountAmount = (subtotal * percentageValue) / 100;
        const finalTotal = subtotal - discountAmount;
        
        return {
            discountAmount: Math.round(discountAmount * 100) / 100, // ปัดเศษ 2 ตำแหน่ง
            finalTotal: Math.round(finalTotal * 100) / 100,
            isPercentage: true,
            percentageValue: percentageValue
        };
    } else {
        // กรณีเป็นจำนวนเงิน
        const discountAmount = parseFloat(discountStr);
        
        if (isNaN(discountAmount) || discountAmount < 0) {
            return {
                discountAmount: 0,
                finalTotal: subtotal,
                isPercentage: false,
                error: "Invalid discount amount"
            };
        }
        
        if (discountAmount > subtotal) {
            return {
                discountAmount: 0,
                finalTotal: subtotal,
                isPercentage: false,
                error: "Discount cannot exceed total amount"
            };
        }
        
        const finalTotal = subtotal - discountAmount;
        
        return {
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalTotal: Math.round(finalTotal * 100) / 100,
            isPercentage: false
        };
    }
}

/**
 * ฟังก์ชันตรวจสอบความถูกต้องของส่วนลดแบบ real-time
 */
function validateDiscountInput(inputElement) {
    if (!inputElement) return;
    
    const value = inputElement.value.trim();
    if (!value) {
        inputElement.style.borderColor = '';
        inputElement.title = '';
        return;
    }
    
    // ตรวจสอบรูปแบบ
    const isPercentage = value.includes('%');
    
    if (isPercentage) {
        // ตรวจสอบเปอร์เซ็นต์
        const percentValue = parseFloat(value.replace('%', ''));
        if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
            inputElement.style.borderColor = 'red';
            inputElement.title = 'Please enter a valid percentage (0-100%)';
        } else {
            inputElement.style.borderColor = 'green';
            inputElement.title = '';
        }
    } else {
        // ตรวจสอบจำนวนเงิน
        const amount = parseFloat(value);
        if (isNaN(amount) || amount < 0) {
            inputElement.style.borderColor = 'red';
            inputElement.title = 'Please enter a valid discount amount';
        } else {
            inputElement.style.borderColor = 'green';
            inputElement.title = '';
        }
    }
}

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
            'companies': '/api/companies'
        },
        'motorbike': {
            'submit': '/submit_motorbike_booking',
            'search': '/search_motorbike_bookings', 
            'export': '/export_motorbike',
            'companies': '/api/companies'
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
    formData.append('experience_type', bookingType);
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

// 🆕 อัปเดตฟังก์ชันคำนวณยอดรวมในหน้าหลัก (Main Form)
function calculateTotal() {
    const priceInput = document.getElementById('price');
    const personsInput = document.getElementById('persons');
    const discountInput = document.getElementById('discount');
    const totalInput = document.getElementById('total');
    
    if (!priceInput || !personsInput || !totalInput) return;
    
    const price = parseFloat(priceInput.value) || 0;
    const persons = parseInt(personsInput.value) || 0;
    const discountValue = discountInput ? discountInput.value : '';
    
    // คำนวณยอดรวมก่อนหักส่วนลด
    const subtotal = price * persons;
    
    // คำนวณส่วนลด
    const discountResult = calculateDiscount(discountValue, subtotal);
    
    // แสดงผลลัพธ์
    totalInput.value = discountResult.finalTotal.toFixed(2);
    
    // แสดงข้อผิดพลาดหากมี
    if (discountResult.error) {
        showAlert(discountResult.error, 'warning');
        // รีเซ็ตค่า discount หากไม่ถูกต้อง
        if (discountInput) {
            discountInput.style.borderColor = 'red';
        }
    } else {
        // ล้าง error state
        if (discountInput) {
            discountInput.style.borderColor = discountValue ? 'green' : '';
        }
    }
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
    formData.append('experience_type', bookingType);
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
    
    calculateEditTotal();
}

// 🆕 อัปเดตฟังก์ชันคำนวณยอดรวมใน Edit Modal
function calculateEditTotal() {
    const priceInput = document.getElementById('edit_price');
    const personsInput = document.getElementById('edit_persons');
    const discountInput = document.getElementById('edit_discount');
    
    if (!priceInput || !personsInput) return;
    
    const price = parseFloat(priceInput.value) || 0;
    const persons = parseInt(personsInput.value) || 0;
    const discountValue = discountInput ? discountInput.value : '';
    
    // คำนวณยอดรวมก่อนหักส่วนลด
    const subtotal = price * persons;
    
    // คำนวณส่วนลด
    const discountResult = calculateDiscount(discountValue, subtotal);
    
    // แสดงข้อผิดพลาดหากมี
    if (discountResult.error) {
        showAlert(discountResult.error, 'warning');
        if (discountInput) {
            discountInput.style.borderColor = 'red';
        }
    } else {
        if (discountInput) {
            discountInput.style.borderColor = discountValue ? 'green' : '';
        }
    }
    
    // อัพเดต display ถ้ามี element สำหรับแสดงผล
    const totalDisplay = document.getElementById('edit_total');
    if (totalDisplay) {
        totalDisplay.value = discountResult.finalTotal.toFixed(2);
    }
    
    console.log(`Edit Total: ${price} × ${persons} - ${discountResult.discountAmount} = ${discountResult.finalTotal}`);
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

// 🆕 เพิ่ม Event Listeners สำหรับ Discount Fields
function initializeDiscountValidation() {
    const discountInput = document.getElementById('discount');
    const editDiscountInput = document.getElementById('edit_discount');
    
    // สำหรับหน้าหลัก
    if (discountInput) {
        discountInput.addEventListener('input', function() {
            validateDiscountInput(this);
            // Debounce การคำนวณเพื่อไม่ให้คำนวณบ่อยเกินไป
            clearTimeout(this.calculationTimeout);
            this.calculationTimeout = setTimeout(calculateTotal, 300);
        });
        
        discountInput.addEventListener('blur', function() {
            validateDiscountInput(this);
            calculateTotal(); // คำนวณทันทีเมื่อออกจากช่อง
        });
        
        // เพิ่ม placeholder และ hint
        discountInput.placeholder = 'e.g. 100 or 20%';
        discountInput.title = 'Enter discount amount (e.g. 100) or percentage (e.g. 20%)';
    }
    
    // สำหรับ Edit Modal
    if (editDiscountInput) {
        editDiscountInput.addEventListener('input', function() {
            validateDiscountInput(this);
            clearTimeout(this.calculationTimeout);
            this.calculationTimeout = setTimeout(calculateEditTotal, 300);
        });
        
        editDiscountInput.addEventListener('blur', function() {
            validateDiscountInput(this);
            calculateEditTotal();
        });
        
        editDiscountInput.placeholder = 'e.g. 100 or 20%';
        editDiscountInput.title = 'Enter discount amount (e.g. 100) or percentage (e.g. 20%)';
    }
}

// ===============================================
// BOOKING MANAGEMENT FUNCTIONS
// ===============================================

// ===============================================
// UPDATED CANCEL FUNCTIONS WITH NAME INPUT MODAL
// ===============================================

// ⚠️ ฟังก์ชันยกเลิกการจอง - เปลี่ยนเป็น modal input name
function cancelBookings() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select at least one booking to cancel.', 'info');
        return;
    }
    
    // แสดง modal สำหรับกรอกชื่อผู้ cancel
    showCancelModal(selectedBookings);
}

// ฟังก์ชันแสดง modal สำหรับกรอกชื่อผู้ cancel
function showCancelModal(selectedBookings) {
    // สร้าง modal element
    const modalHtml = `
        <div id="cancelModal" class="modal" style="display: block; z-index: 10000;">
            <div class="modal-content" style="max-width: 400px; margin: 15% auto;">
                <div class="modal-header">
                    <span class="close" onclick="closeCancelModal()">&times;</span>
                    <h2>Cancel Booking(s)</h2>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <p><strong>Selected bookings:</strong> ${selectedBookings.length} booking(s)</p>
                    <div class="form-group">
                        <label for="cancelName" style="display: block; margin-bottom: 8px; font-weight: bold;">
                            Name of person cancelling:
                        </label>
                        <input type="text" 
                               id="cancelName" 
                               placeholder="Enter your name" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                               maxlength="50"
                               required>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 8px;">
                        This will update the payment status to "Cancelled by [Your Name]"
                    </p>
                </div>
                <div class="modal-footer" style="padding: 15px 20px; text-align: right; border-top: 1px solid #eee;">
                    <button type="button" 
                            onclick="closeCancelModal()" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="button" 
                            onclick="confirmCancel()" 
                            style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // เพิ่ม modal ไปยัง body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // focus ที่ input field
    setTimeout(() => {
        const nameInput = document.getElementById('cancelName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
    
    // เพิ่ม event listener สำหรับ Enter key
    document.getElementById('cancelName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmCancel();
        }
    });
}

// ฟังก์ชันปิด cancel modal
function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.remove();
    }
}

// ฟังก์ชันยืนยันการ cancel
function confirmCancel() {
    const nameInput = document.getElementById('cancelName');
    const cancelName = nameInput ? nameInput.value.trim() : '';
    
    if (!cancelName) {
        showAlert('Please enter your name.', 'warning');
        if (nameInput) {
            nameInput.focus();
            nameInput.style.borderColor = 'red';
        }
        return;
    }
    
    if (cancelName.length < 2) {
        showAlert('Name must be at least 2 characters long.', 'warning');
        if (nameInput) {
            nameInput.focus();
            nameInput.style.borderColor = 'red';
        }
        return;
    }
    
    // ดึง selected bookings
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('No bookings selected.', 'warning');
        closeCancelModal();
        return;
    }
    
    // ปิด modal
    closeCancelModal();
    
    // แสดง loading
    const loadingNotif = showLoadingNotification('Cancelling bookings...');
    
    // สร้าง form data
    const form = document.getElementById('actionForm');
    const formData = new FormData(form);
    
    // เพิ่มข้อมูลพิเศษ
    formData.append('booking_type', getCurrentBookingType());
    formData.append('cancelled_by', cancelName);
    
    // ส่งคำขอ
    fetch('/cancel_bookings', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // ปิด loading
        if (loadingNotif) {
            hideLoadingNotification(loadingNotif);
        }
        
        if (data.success) {
            showAlert(data.message, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        // ปิด loading
        if (loadingNotif) {
            hideLoadingNotification(loadingNotif);
        }
        
        showAlert('An error occurred. Please try again.', 'danger');
        console.error('Error:', error);
    });
}

// ฟังก์ชันสำหรับ restore booking (เพิ่มเติม - optional)
function restoreBooking(bookingNo) {
    if (!confirm('Are you sure you want to restore this cancelled booking?')) {
        return;
    }
    
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    formData.append('booking_type', getCurrentBookingType());
    
    fetch('/restore_booking', {
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

// CSS สำหรับ modal (เพิ่มลงใน head หรือ CSS file)
const cancelModalStyles = `
<style id="cancelModalStyles">
#cancelModal .modal-content {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

#cancelModal input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

#cancelModal button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    transition: all 0.2s ease;
}

#cancelModal .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    line-height: 1;
}

#cancelModal .close:hover {
    color: #000;
}
</style>
`;

// เพิ่ม styles ตอน DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('cancelModalStyles')) {
        document.head.insertAdjacentHTML('beforeend', cancelModalStyles);
    }
});

// ปิด modal เมื่อคลิกข้างนอก
document.addEventListener('click', function(event) {
    const modal = document.getElementById('cancelModal');
    if (modal && event.target === modal) {
        closeCancelModal();
    }
});

// ปิด modal เมื่อกด ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('cancelModal');
        if (modal) {
            closeCancelModal();
        }
    }
});

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
    formData.append('booking_type', getCurrentBookingType());
    
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
            
            // 🆕 เพิ่มฟิลด์ที่ขาด
            const editMethod = document.getElementById('edit_method');
            const editRemark = document.getElementById('edit_remark');
            const editDiscount = document.getElementById('edit_discount');
            
            if (editMethod) editMethod.value = booking.payment_method || '';
            if (editRemark) editRemark.value = booking.remark || '';
            if (editDiscount) editDiscount.value = booking.discount || '0';
            
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
    formData.append('booking_type', getCurrentBookingType());
    
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
    
    // เพิ่มข้อมูลตามประเภทการกรอง
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
    showAlert('กำลังสร้างไฟล์ PDF...', 'info');
    
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
        
        // ตรวจสอบประเภทของ response
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            // กรณีเป็น JSON (error message)
            return response.json().then(data => {
                throw new Error(data.message || 'เกิดข้อผิดพลาด');
            });
        } else {
            // กรณีเป็นไฟล์ (Excel หรือ PDF)
            return response.blob();
        }
    })
    .then(blob => {
        // สร้าง URL สำหรับ blob object
        const url = window.URL.createObjectURL(blob);
        
        // ⚠️ ตรวจสอบประเภทไฟล์จาก response headers
        const contentType = blob.type || '';
        console.log('Blob type:', contentType);
        
        if (contentType.includes('application/pdf')) {
            // กรณีเป็น PDF - เปิดใน tab ใหม่
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
                showAlert('เปิดไฟล์ PDF ในแท็บใหม่สำเร็จ', 'success');
            } else {
                // ถ้าป็อปอัพถูกบล็อก ให้ดาวน์โหลดแทน
                downloadFile(url, bookingNo, 'pdf');
                showAlert('ดาวน์โหลดไฟล์ PDF สำเร็จ', 'success');
            }
        } else {
            // กรณีเป็น Excel - ดาวน์โหลดตามปกติ
            downloadFile(url, bookingNo, 'xlsx');
            showAlert('ดาวน์โหลดไฟล์ Excel สำเร็จ', 'success');
        }
        
        // Cleanup URL object หลังจาก 5 วินาที
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 5000);
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    });
}

// ⚠️ ฟังก์ชันช่วยสำหรับดาวน์โหลดไฟล์
function downloadFile(url, bookingNo, fileType) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // กำหนดชื่อไฟล์และ extension ตามประเภท
    const bookingType = getCurrentBookingType();
    const typeName = bookingType === 'tour' ? 'Tour' : 'Motorbike';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const extension = fileType === 'pdf' ? 'pdf' : 'xlsx';
    
    a.download = `${typeName}_Booking_${bookingNo}_${dateStr}.${extension}`;
    
    // เพิ่ม element ไปที่ DOM และ trigger การคลิก
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
}

// ⚠️ เพิ่มฟังก์ชันสำหรับเปิด PDF ในหน้าใหม่โดยตรง (optional)
function openPdfInNewTab() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('กรุณาเลือกรายการที่ต้องการดู PDF', 'info');
        return;
    }
    
    if (selectedBookings.length > 1) {
        showAlert('กรุณาเลือกเพียงรายการเดียวเท่านั้น', 'info');
        return;
    }
    
    const bookingNo = selectedBookings[0].value;
    const bookingType = getCurrentBookingType();
    
    // สร้าง URL สำหรับเปิด PDF โดยตรง
    const pdfUrl = `/generate_excel_form?booking_no=${bookingNo}&booking_type=${bookingType}&format=pdf`;
    
    // เปิดใน tab ใหม่
    const newTab = window.open(pdfUrl, '_blank');
    if (newTab) {
        newTab.focus();
        showAlert('กำลังเปิด PDF ในแท็บใหม่...', 'info');
    } else {
        showAlert('กรุณาอนุญาตการเปิดป็อปอัพสำหรับเว็บไซต์นี้', 'warning');
    }
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
        
        // 🆕 Initialize discount validation first
        initializeDiscountValidation();
        
        // Initialize form elements if they exist
        const priceInput = document.getElementById('price');
        const personsInput = document.getElementById('persons');
        const discountInput = document.getElementById('discount');
        const totalInput = document.getElementById('total');
        
        if (priceInput && personsInput && totalInput) {
            priceInput.addEventListener('input', calculateTotal);
            personsInput.addEventListener('input', calculateTotal);
            if (discountInput) {
                discountInput.addEventListener('input', calculateTotal);
            }
        }
        
        // 🆕 Event listeners สำหรับ Edit Modal
        const editPriceInput = document.getElementById('edit_price');
        const editPersonsInput = document.getElementById('edit_persons');
        const editDiscountInput = document.getElementById('edit_discount');
        
        if (editPriceInput && editPersonsInput) {
            editPriceInput.addEventListener('input', calculateEditTotal);
            editPersonsInput.addEventListener('input', calculateEditTotal);
            if (editDiscountInput) {
                editDiscountInput.addEventListener('input', calculateEditTotal);
            }
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
                        
                        // 🆕 Reset ฟิลด์ที่เป็น readonly หรือ calculated
                        const priceField = document.getElementById('price');
                        const totalField = document.getElementById('total');
                        const detailField = document.getElementById('detail');
                        
                        if (priceField) priceField.value = '';
                        if (totalField) totalField.value = '';
                        if (detailField) detailField.innerHTML = '<option value="">-- Select Detail --</option>';
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
        
        // 🆕 Date validation สำหรับ Motorbike Period
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

// ฟังก์ชันสำหรับทดสอบ discount calculation
function testDiscountCalculation() {
    console.log('=== DISCOUNT CALCULATION TEST ===');
    console.log('Subtotal: 1000');
    console.log('Discount "100" =>', calculateDiscount('100', 1000));
    console.log('Discount "20%" =>', calculateDiscount('20%', 1000));
    console.log('Discount "15.5%" =>', calculateDiscount('15.5%', 1000));
    console.log('Discount "150" =>', calculateDiscount('150', 1000));
    console.log('Discount "120%" =>', calculateDiscount('120%', 1000));
    console.log('Discount "" =>', calculateDiscount('', 1000));
    console.log('Discount "invalid" =>', calculateDiscount('invalid', 1000));
    console.log('==================================');
}

// เรียกใช้ debug เมื่อโหลดหน้า (สำหรับ development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            debugBookingType();
            testDiscountCalculation();
        }, 1000);
    });
}