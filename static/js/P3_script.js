// P3_script.js - Motorbike Booking JavaScript (COMPLETE VERSION)
// ===============================================
// MOTORBIKE BOOKING JAVASCRIPT - COMPLETE
// ===============================================

// Global variables for motorbike
let entryCounter = 0;
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
// UTILITY FUNCTIONS
// ===============================================

function showAlert(message, type) {
    if (typeof showNotification === 'function') {
        let notificationType;
        switch (type) {
            case 'success': notificationType = 'success'; break;
            case 'danger': 
            case 'error': notificationType = 'error'; break;
            case 'info': notificationType = 'info'; break;
            case 'warning': notificationType = 'warning'; break;
            default: notificationType = 'info';
        }
        
        let duration = type === 'success' ? 4000 : type === 'error' ? 7000 : 5000;
        showNotification(message, notificationType, duration, true);
        return;
    }
    
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.textContent = message;
        alertContainer.className = `alert alert-${type}`;
        alertContainer.style.display = 'block';
        setTimeout(() => alertContainer.style.display = 'none', 3000);
        return;
    }
    
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

function closeAllModals() {
    const modals = ['editModal', 'exportModal', 'cancelModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.style.zIndex = '';
        }
    });
}

// ===============================================
// MOTORBIKE SPECIFIC FUNCTIONS
// ===============================================

function loadMotorbikeCompanies() {
    fetch('/api/companies')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.motorbikeCompanies = data.motorbike_companies;
                populateCompanyOptions(0);
            } else {
                console.error('Error loading companies:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading companies:', error);
        });
}

function populateCompanyOptions(entryId) {
    const companySelect = document.getElementById(`company_${entryId}`);
    if (!companySelect) return;
    
    companySelect.innerHTML = '<option value="">-- Select Company --</option>';
    
    window.motorbikeCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
    });
}

function handleCompanyChange(entryId) {
    const companySelect = document.getElementById(`company_${entryId}`);
    const detailSelect = document.getElementById(`detail_${entryId}`);
    const priceInput = document.getElementById(`price_${entryId}`);
    
    const selectedCompany = companySelect.value;
    
    // Clear detail and price
    detailSelect.innerHTML = '<option value="">-- Select Detail --</option>';
    priceInput.value = '';
    
    if (selectedCompany) {
        // Fetch details for selected company
        const formData = new FormData();
        formData.append('experience_type', 'motorbike');
        formData.append('company_name', selectedCompany);
        
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
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    calculateTotal();
}

function handleDetailChange(entryId) {
    const detailSelect = document.getElementById(`detail_${entryId}`);
    const priceInput = document.getElementById(`price_${entryId}`);
    
    if (detailSelect.selectedIndex > 0) {
        const selectedOption = detailSelect.options[detailSelect.selectedIndex];
        const price = selectedOption.dataset.price || '';
        priceInput.value = price;
    } else {
        priceInput.value = '';
    }
    
    calculateTotal();
}

function addMotorbikeEntry() {
    entryCounter++;
    const entriesContainer = document.getElementById('motorbikeEntries');
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'motorbike-entry';
    entryDiv.setAttribute('data-entry-id', entryCounter);
    
    entryDiv.innerHTML = `
        <div class="motorbike-entry-header">
            <span class="motorbike-entry-title">Motorbike ${entryCounter + 1}</span>
            <button type="button" class="remove-btn" onclick="removeMotorbikeEntry(${entryCounter})">Remove</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="company_${entryCounter}">Company</label>
                <select id="company_${entryCounter}" name="company[]" class="form-control" required onchange="handleCompanyChange(${entryCounter})">
                    <option value="">-- Select Company --</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="detail_${entryCounter}">Detail</label>
                <select id="detail_${entryCounter}" name="detail[]" class="form-control" required onchange="handleDetailChange(${entryCounter})">
                    <option value="">-- Select Detail --</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="persons_${entryCounter}">Persons</label>
                <input type="number" class="form-control" id="persons_${entryCounter}" name="persons[]" min="1" placeholder="Number of persons" required onchange="calculateTotal()">
            </div>
            <div class="form-group">
                <label class="form-label" for="price_${entryCounter}">Price</label>
                <input type="number" class="form-control" id="price_${entryCounter}" name="price[]" placeholder="Price per person" required readonly>
            </div>
        </div>
    `;
    
    entriesContainer.appendChild(entryDiv);
    populateCompanyOptions(entryCounter);
    updateRemoveButtons();
}

function removeMotorbikeEntry(entryId) {
    const entry = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (entry) {
        entry.remove();
        updateRemoveButtons();
        updateEntryTitles();
        calculateTotal();
    }
}

function updateRemoveButtons() {
    const entries = document.querySelectorAll('.motorbike-entry');
    entries.forEach((entry, index) => {
        const removeBtn = entry.querySelector('.remove-btn');
        if (entries.length > 1) {
            removeBtn.style.display = 'inline-block';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

function updateEntryTitles() {
    const entries = document.querySelectorAll('.motorbike-entry');
    entries.forEach((entry, index) => {
        const title = entry.querySelector('.motorbike-entry-title');
        title.textContent = `Motorbike ${index + 1}`;
    });
}

function calculateTotal() {
    let total = 0;
    const entries = document.querySelectorAll('.motorbike-entry');
    
    entries.forEach(entry => {
        const entryId = entry.getAttribute('data-entry-id');
        const personsInput = document.getElementById(`persons_${entryId}`);
        const priceInput = document.getElementById(`price_${entryId}`);
        
        const persons = parseInt(personsInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        total += persons * price;
    });
    
    const discountInput = document.getElementById('discount');
    const discountValue = discountInput ? discountInput.value : '';
    
    // คำนวณส่วนลด
    const discountResult = calculateDiscount(discountValue, total);
    
    const totalInput = document.getElementById('total');
    if (totalInput) {
        totalInput.value = discountResult.finalTotal.toFixed(2);
    }
    
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
}

// ===============================================
// EDIT MODAL FUNCTIONS - MULTI-BIKE SUPPORT
// ===============================================

// ฟังก์ชันเริ่มต้น company dropdown สำหรับ edit modal
function populateEditCompanyOptions(entryId) {
    const companySelect = document.getElementById(`edit_company_${entryId}`);
    if (!companySelect) return;
    
    companySelect.innerHTML = '<option value="">-- Select Company --</option>';
    
    window.motorbikeCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
    });
}

// ฟังก์ชันสำหรับจัดการการเปลี่ยน Company ใน Edit Modal
function handleEditCompanyChange(entryId) {
    const companyName = document.getElementById(`edit_company_${entryId}`).value;
    const detailSelect = document.getElementById(`edit_detail_${entryId}`);
    const priceInput = document.getElementById(`edit_price_${entryId}`);
    
    if (!detailSelect || !priceInput) return;
    
    // Clear detail dropdown and price
    detailSelect.innerHTML = '<option value="">-- Select Detail --</option>';
    priceInput.value = '';
    
    if (!companyName) return;
    
    // Fetch details for selected company
    const formData = new FormData();
    formData.append('experience_type', 'motorbike');
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
function handleEditDetailChange(entryId) {
    const detailSelect = document.getElementById(`edit_detail_${entryId}`);
    const priceInput = document.getElementById(`edit_price_${entryId}`);
    
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

// เพิ่ม Motorbike Entry ใน Edit Modal
function addEditMotorbikeEntry() {
    editEntryCounter++;
    const entriesContainer = document.getElementById('editMotorbikeEntries');
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'motorbike-entry';
    entryDiv.setAttribute('data-edit-entry-id', editEntryCounter);
    
    entryDiv.innerHTML = `
        <div class="motorbike-entry-header">
            <span class="motorbike-entry-title">Motorbike ${editEntryCounter}</span>
            <button type="button" class="remove-btn" onclick="removeEditMotorbikeEntry(${editEntryCounter})">Remove</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="edit_company_${editEntryCounter}">Company:</label>
                <select id="edit_company_${editEntryCounter}" name="company[]" required onchange="handleEditCompanyChange(${editEntryCounter})">
                    <option value="">-- Select Company --</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit_detail_${editEntryCounter}">Detail:</label>
                <select id="edit_detail_${editEntryCounter}" name="detail[]" required onchange="handleEditDetailChange(${editEntryCounter})">
                    <option value="">-- Select Detail --</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="edit_persons_${editEntryCounter}">Persons:</label>
                <input type="number" id="edit_persons_${editEntryCounter}" name="persons[]" min="1" required onchange="calculateEditTotal()">
            </div>
            <div class="form-group">
                <label for="edit_price_${editEntryCounter}">Price:</label>
                <input type="number" id="edit_price_${editEntryCounter}" name="price[]" step="0.01" required readonly>
            </div>
        </div>
    `;
    
    entriesContainer.appendChild(entryDiv);
    populateEditCompanyOptions(editEntryCounter);
    updateEditRemoveButtons();
}

// ลบ Motorbike Entry ใน Edit Modal
function removeEditMotorbikeEntry(entryId) {
    const entry = document.querySelector(`[data-edit-entry-id="${entryId}"]`);
    if (entry) {
        entry.remove();
        updateEditRemoveButtons();
        updateEditEntryTitles();
        calculateEditTotal();
    }
}

// อัปเดตปุ่ม Remove ใน Edit Modal
function updateEditRemoveButtons() {
    const entries = document.querySelectorAll('#editMotorbikeEntries .motorbike-entry');
    entries.forEach((entry, index) => {
        const removeBtn = entry.querySelector('.remove-btn');
        if (entries.length > 1) {
            removeBtn.style.display = 'inline-block';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// อัปเดตชื่อ Entry ใน Edit Modal
function updateEditEntryTitles() {
    const entries = document.querySelectorAll('#editMotorbikeEntries .motorbike-entry');
    entries.forEach((entry, index) => {
        const title = entry.querySelector('.motorbike-entry-title');
        title.textContent = `Motorbike ${index + 1}`;
    });
}

// ฟังก์ชันคำนวณยอดรวมใน Edit Modal
function calculateEditTotal() {
    let total = 0;
    const entries = document.querySelectorAll('#editMotorbikeEntries .motorbike-entry');
    
    entries.forEach(entry => {
        const entryId = entry.getAttribute('data-edit-entry-id');
        const personsInput = document.getElementById(`edit_persons_${entryId}`);
        const priceInput = document.getElementById(`edit_price_${entryId}`);
        
        if (personsInput && priceInput) {
            const persons = parseInt(personsInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            total += persons * price;
        }
    });
    
    const discountInput = document.getElementById('edit_discount');
    const discountValue = discountInput ? discountInput.value : '';
    
    // คำนวณส่วนลด
    const discountResult = calculateDiscount(discountValue, total);
    
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
    
    // อัพเดต display
    const totalDisplay = document.getElementById('edit_total_display');
    const totalHidden = document.getElementById('edit_total');
    if (totalDisplay) {
        totalDisplay.value = discountResult.finalTotal.toFixed(2);
    }
    if (totalHidden) {
        totalHidden.value = discountResult.finalTotal.toFixed(2);
    }
    
    console.log(`Edit Total: ${total} - ${discountResult.discountAmount} = ${discountResult.finalTotal}`);
}

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
    
    // Close other modals first
    closeAllModals();
    
    const bookingNo = selectedBookings[0].value;
    showAlert('Loading booking details...', 'info');
    
    // โหลดข้อมูล companies ก่อน (ถ้ายังไม่มี)
    if (!window.motorbikeCompanies || window.motorbikeCompanies.length === 0) {
        loadMotorbikeCompanies();
        setTimeout(() => {
            loadBookingDetailsForEdit(bookingNo);
        }, 1000);
    } else {
        loadBookingDetailsForEdit(bookingNo);
    }
}

function loadBookingDetailsForEdit(bookingNo) {
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    formData.append('booking_type', 'motorbike');
    
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
            document.getElementById('edit_status').value = booking.payment_status || 'unpaid';
            
            // ✅ แก้ไขส่วนนี้ - ใช้ current user แทนข้อมูลเก่า
            getCurrentUser().then(user => {
                const editStaffName = document.getElementById('edit_staffName');
                if (editStaffName && user && user.full_name) {
                    editStaffName.value = user.full_name;
                }
            });

            document.getElementById('edit_searchDateTo').value = booking.end_booking_date || '';
            
            // เพิ่มฟิลด์ที่ขาด
            const editMethod = document.getElementById('edit_method');
            const editRemark = document.getElementById('edit_remark');
            const editDiscount = document.getElementById('edit_discount');
            
            if (editMethod) editMethod.value = booking.payment_method || '';
            if (editRemark) editRemark.value = booking.remark || '';
            if (editDiscount) editDiscount.value = booking.discount || '0';
            
            // ล้าง edit entries container
            const entriesContainer = document.getElementById('editMotorbikeEntries');
            entriesContainer.innerHTML = '';
            editEntryCounter = 0;
            
            // สร้าง motorbike entries จากข้อมูล
            let companies = [];
            let details = [];
            let prices = [];
            let quantities = [];
            
            try {
                // แปลงข้อมูล comma-separated
                if (booking.company_name) {
                    companies = booking.company_name.split(',').map(c => c.trim());
                }
                if (booking.detail) {
                    details = booking.detail.split(',').map(d => d.trim());
                }
                if (booking.price) {
                    prices = booking.price.split(',').map(p => parseFloat(p.trim()));
                }
                if (booking.quantity) {
                    // รองรับทั้ง {1,2,3} และ 1,2,3
                    let qtyStr = booking.quantity.toString().trim();
                    if (qtyStr.startsWith('{') && qtyStr.endsWith('}')) {
                        qtyStr = qtyStr.slice(1, -1);
                    }
                    quantities = qtyStr.split(',').map(q => parseInt(q.trim()));
                }
                
                console.log('Parsed data:', { companies, details, prices, quantities });
                
                // สร้าง entries ตามจำนวนที่มี
                const maxEntries = Math.max(companies.length, details.length, prices.length, quantities.length);
                
                for (let i = 0; i < maxEntries; i++) {
                    addEditMotorbikeEntry();
                    
                    // ตั้งค่าข้อมูล
                    const currentEntryId = editEntryCounter;
                    
                    setTimeout(() => {
                        // ตั้งค่า company
                        if (i < companies.length) {
                            const companySelect = document.getElementById(`edit_company_${currentEntryId}`);
                            if (companySelect) {
                                companySelect.value = companies[i];
                                handleEditCompanyChange(currentEntryId);
                                
                                // รอให้ details โหลดเสร็จแล้วค่อยตั้งค่า
                                setTimeout(() => {
                                    if (i < details.length) {
                                        const detailSelect = document.getElementById(`edit_detail_${currentEntryId}`);
                                        if (detailSelect) {
                                            detailSelect.value = details[i];
                                            handleEditDetailChange(currentEntryId);
                                        }
                                    }
                                    
                                    // ตั้งค่า persons
                                    if (i < quantities.length) {
                                        const personsInput = document.getElementById(`edit_persons_${currentEntryId}`);
                                        if (personsInput) {
                                            personsInput.value = quantities[i];
                                        }
                                    }
                                    
                                    calculateEditTotal();
                                }, 500);
                            }
                        }
                    }, 300);
                }
                
            } catch (error) {
                console.error('Error parsing motorbike data:', error);
                // ถ้า error ให้สร้าง entry เปล่าอย่างน้อย 1 อัน
                addEditMotorbikeEntry();
            }
            
            // ซ่อน alert และแสดง modal
            const alertContainer = document.getElementById('alert-container');
            if (alertContainer) {
                alertContainer.style.display = 'none';
            }
            
            const editModal = document.getElementById('editModal');
            if (editModal) {
                editModal.style.display = 'block';
                editModal.style.zIndex = '10000';
            }
        } else {
            showAlert(data.message || 'Error fetching booking details', 'danger');
        }
    })
    .catch(error => {
        console.error('Error details:', error);
        showAlert('An error occurred while fetching booking details.', 'danger');
    });
}

function closeModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
}

function saveEditMotorbikeBooking() {
    const form = document.getElementById('editForm');
    if (!form) {
        showAlert('Edit form not found', 'danger');
        return;
    }
    
    // รวบรวมข้อมูล motorbike entries
    const entries = document.querySelectorAll('#editMotorbikeEntries .motorbike-entry');
    const companies = [];
    const details = [];
    const persons = [];
    const prices = [];
    
    entries.forEach(entry => {
        const entryId = entry.getAttribute('data-edit-entry-id');
        const company = document.getElementById(`edit_company_${entryId}`).value;
        const detail = document.getElementById(`edit_detail_${entryId}`).value;
        const person = document.getElementById(`edit_persons_${entryId}`).value;
        const price = document.getElementById(`edit_price_${entryId}`).value;
        
        companies.push(company);
        details.push(detail);
        persons.push(person);
        prices.push(price);
    });
    
    // สร้าง FormData
    const formData = new FormData();
    formData.append('booking_no', document.getElementById('edit_booking_no').value);
    formData.append('booking_type', 'motorbike');
    formData.append('searchDate', document.getElementById('edit_date').value);
    formData.append('time', document.getElementById('edit_time').value);
    formData.append('name', document.getElementById('edit_name').value);
    formData.append('surname', document.getElementById('edit_surname').value);
    formData.append('room', document.getElementById('edit_room').value);
    formData.append('status', document.getElementById('edit_status').value);
    formData.append('staffName', document.getElementById('edit_staffName').value);
    formData.append('searchDateTo', document.getElementById('edit_searchDateTo').value);
    formData.append('paymentmethod', document.getElementById('edit_method').value);
    formData.append('remark', document.getElementById('edit_remark').value);
    formData.append('discount', document.getElementById('edit_discount').value);
    formData.append('total', document.getElementById('edit_total').value);
    
    // เพิ่มข้อมูล motorbike แบบ comma-separated
    formData.append('company', companies.join(','));
    formData.append('detail', details.join(','));
    formData.append('persons', persons.join(','));
    formData.append('price', prices.join(','));
    
    fetch('/update_motorbike_booking', {
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
// EXPORT MODAL FUNCTIONS (FIXED)
// ===============================================

function exportBooking() {
    console.log('Export Motorbike - Starting...');
    
    // Close all other modals first
    closeAllModals();
    
    // Check if modal exists, if not create it
    let modal = document.getElementById('exportModal');
    if (!modal) {
        createExportModal();
        modal = document.getElementById('exportModal');
    }
    
    if (!modal) {
        showAlert('Failed to create export modal', 'error');
        return;
    }
    
    // Set default dates
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayFormatted = today.toISOString().split('T')[0];
    const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
    
    // Show modal with forced visibility
    modal.style.cssText = `
        display: block !important;
        position: fixed !important;
        z-index: 10000 !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        overflow: auto !important;
    `;
    
    // Set default values
    setTimeout(() => {
        const exportStartDate = document.getElementById('export_start_date');
        const exportEndDate = document.getElementById('export_end_date');
        
        if (exportStartDate) exportStartDate.value = firstDayFormatted;
        if (exportEndDate) exportEndDate.value = todayFormatted;
        
        toggleExportFields();
    }, 100);
    
    console.log('Export Modal should be visible now');
}

function createExportModal() {
    const modalHtml = `
        <div id="exportModal" class="modal" style="display: none;">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; position: relative; z-index: 10001;">
                <div class="modal-header" style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">
                    <span class="close" onclick="closeExportModal()" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                    <h2 style="margin: 0; color: #8c7356;">Export Motorbike Data</h2>
                </div>
                <form id="exportForm" class="export-form">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Filter Type:</label>
                        <div class="radio-group" style="display: flex; gap: 15px;">
                            <label class="radio-option" style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="exportFilterType" value="date" checked onchange="toggleExportFields()" style="margin-right: 8px;">
                                <span>Date Range</span>
                            </label>
                            <label class="radio-option" style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="exportFilterType" value="month" onchange="toggleExportFields()" style="margin-right: 8px;">
                                <span>Month Range</span>
                            </label>
                            <label class="radio-option" style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="exportFilterType" value="year" onchange="toggleExportFields()" style="margin-right: 8px;">
                                <span>Year Range</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Date Range Fields -->
                    <div id="dateRangeFields" style="margin-bottom: 20px;">
                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1;">
                                <label for="export_start_date" style="display: block; margin-bottom: 5px;">From Date:</label>
                                <input type="date" id="export_start_date" name="export_start_date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label for="export_end_date" style="display: block; margin-bottom: 5px;">To Date:</label>
                                <input type="date" id="export_end_date" name="export_end_date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Month Range Fields -->
                    <div id="monthRangeFields" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1;">
                                <label for="export_start_month" style="display: block; margin-bottom: 5px;">From Month:</label>
                                <input type="month" id="export_start_month" name="export_start_month" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label for="export_end_month" style="display: block; margin-bottom: 5px;">To Month:</label>
                                <input type="month" id="export_end_month" name="export_end_month" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Year Range Fields -->
                    <div id="yearRangeFields" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1;">
                                <label for="export_start_year" style="display: block; margin-bottom: 5px;">From Year:</label>
                                <input type="number" id="export_start_year" name="export_start_year" min="2000" max="2100" placeholder="YYYY" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label for="export_end_year" style="display: block; margin-bottom: 5px;">To Year:</label>
                                <input type="number" id="export_end_year" name="export_end_year" min="2000" max="2100" placeholder="YYYY" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Status Filter -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Payment Status (Optional):</label>
                        <div class="radio-group" style="display: flex; gap: 15px;">
                            <label class="radio-option" style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="exportPaymentStatus" value="all" checked style="margin-right: 8px;">
                                <span>All Status</span>
                            </label>
                            <label class="radio-option" style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="exportPaymentStatus" value="paid" style="margin-right: 8px;">
                                <span>Paid Only</span>
                            </label>
                            <label class="radio-option" style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="exportPaymentStatus" value="unpaid" style="margin-right: 8px;">
                                <span>Unpaid Only</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="padding-top: 20px; border-top: 1px solid #ddd; text-align: right;">
                        <button type="button" onclick="closeExportModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Cancel</button>
                        <button type="button" onclick="submitExport()" style="background: #d4b98c; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Export to Excel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('Export modal created dynamically');
}

function closeExportModal() {
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.style.display = 'none';
        exportModal.style.zIndex = '';
    }
}

function toggleExportFields() {
    const filterTypeRadio = document.querySelector('input[name="exportFilterType"]:checked');
    if (!filterTypeRadio) return;
    
    const filterType = filterTypeRadio.value;
    
    const dateRangeFields = document.getElementById('dateRangeFields');
    const monthRangeFields = document.getElementById('monthRangeFields');
    const yearRangeFields = document.getElementById('yearRangeFields');
    
    // Hide all first
    if (dateRangeFields) dateRangeFields.style.display = 'none';
    if (monthRangeFields) monthRangeFields.style.display = 'none';
    if (yearRangeFields) yearRangeFields.style.display = 'none';
    
    // Show selected
    if (filterType === 'date' && dateRangeFields) {
        dateRangeFields.style.display = 'block';
    } else if (filterType === 'month' && monthRangeFields) {
        monthRangeFields.style.display = 'block';
    } else if (filterType === 'year' && yearRangeFields) {
        yearRangeFields.style.display = 'block';
    }
}

function submitExport() {
    const filterTypeRadio = document.querySelector('input[name="exportFilterType"]:checked');
    const paymentStatusRadio = document.querySelector('input[name="exportPaymentStatus"]:checked');
    
    if (!filterTypeRadio) {
        showAlert('Please select filter type', 'warning');
        return;
    }
    
    const filterType = filterTypeRadio.value;
    const paymentStatus = paymentStatusRadio ? paymentStatusRadio.value : 'all';
    
    let formData = new FormData();
    formData.append('filter_type', filterType);
    formData.append('payment_status', paymentStatus);
    
    // Add date parameters based on filter type
    if (filterType === 'date') {
        const startDate = document.getElementById('export_start_date');
        const endDate = document.getElementById('export_end_date');
        
        if (!startDate || !endDate || !startDate.value || !endDate.value) {
            showAlert('Please select both start and end dates', 'warning');
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
            showAlert('Please select both start and end months', 'warning');
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
            showAlert('Please select both start and end years', 'warning');
            return;
        }
        
        if (parseInt(startYear.value) > parseInt(endYear.value)) {
            showAlert('Start year must be before or equal to end year', 'warning');
            return;
        }
        
        formData.append('start_year', startYear.value);
        formData.append('end_year', endYear.value);
    }
    
    showAlert('Generating Excel file...', 'info');
    
    fetch('/export_motorbike', {
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
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        a.download = `${dateStr}_Motorbike_Export.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        closeExportModal();
        showAlert('Export completed successfully', 'success');
    })
    .catch(error => {
        console.error('Export error:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// ===============================================
// BOOKING MANAGEMENT FUNCTIONS
// ===============================================

function cancelBookings() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select at least one booking to cancel.', 'info');
        return;
    }
    
    // แสดง modal สำหรับกรอกชื่อผู้ cancel
    showCancelModal(selectedBookings);
}

function showCancelModal(selectedBookings) {
    // สร้าง modal element (เหมือนเดิม)
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
                               readonly
                               required>
                        <small style="color: #666; font-size: 11px; margin-top: 4px; display: block;">
                            Auto-filled from your login account
                        </small>
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
    
    // ตั้งค่าชื่อ auto หลังจากสร้าง modal แล้ว
    setTimeout(() => {
        setCancelNameAuto();
    }, 100);
    
    // เพิ่ม event listener สำหรับ Enter key
    setTimeout(() => {
        const nameInput = document.getElementById('cancelName');
        if (nameInput) {
            nameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmCancel();
                }
            });
        }
    }, 100);

    
    // เพิ่ม event listener สำหรับ Enter key
    document.getElementById('cancelName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmCancel();
        }
    });
}

function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.remove();
    }
}

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
    formData.append('booking_type', 'motorbike');
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

function printToExcel() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select a booking', 'info');
        return;
    }
    
    if (selectedBookings.length > 1) {
        showAlert('Please select only one booking', 'info');
        return;
    }
    
    const bookingNo = selectedBookings[0].value;
    showAlert('Generating PDF...', 'info');
    
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    formData.append('booking_type', 'motorbike');
    
    fetch('/generate_excel_form', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Error');
            });
        }
        
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                throw new Error(data.message || 'Error');
            });
        } else {
            return response.blob();
        }
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const contentType = blob.type || '';
        console.log('Blob type:', contentType);
        
        if (contentType.includes('application/pdf')) {
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
                showAlert('PDF opened in new tab', 'success');
            } else {
                downloadFile(url, bookingNo, 'pdf');
                showAlert('PDF downloaded successfully', 'success');
            }
        } else {
            downloadFile(url, bookingNo, 'xlsx');
            showAlert('Excel downloaded successfully', 'success');
        }
        
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// ===============================================
// AGREEMENT PRINT FUNCTION - FIXED VERSION
// ===============================================

// Agreement Print Function - Fixed
function printToAgreement() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select a booking', 'info');
        return;
    }
    
    if (selectedBookings.length > 1) {
        showAlert('Please select only one booking', 'info');
        return;
    }
    
    const bookingNo = selectedBookings[0].value;
    showAlert('Generating Agreement PDF...', 'info');
    
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    // ✅ เพิ่ม booking_type ที่หายไป
    formData.append('booking_type', 'motorbike'); // หรือ 'tour' ตามความเหมาะสม
    
    fetch('/generate_agreement_excel_form', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Error generating agreement');
            });
        }
        
        const contentType = response.headers.get('content-type');
        console.log('Agreement response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                throw new Error(data.message || 'Error generating agreement');
            });
        } else {
            return response.blob();
        }
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const contentType = blob.type || '';
        console.log('Agreement blob type:', contentType);
        
        if (contentType.includes('application/pdf')) {
            // เปิด PDF ในแท็บใหม่
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
                showAlert('Agreement PDF opened in new tab', 'success');
            } else {
                // ถ้าเปิดแท็บใหม่ไม่ได้ ให้ download
                downloadAgreementFile(url, bookingNo, 'pdf');
                showAlert('Agreement PDF downloaded successfully', 'success');
            }
        } else {
            // ถ้าไม่ใช่ PDF ให้ download Excel
            downloadAgreementFile(url, bookingNo, 'xlsx');
            showAlert('Agreement Excel downloaded successfully', 'success');
        }
        
        // ทำความสะอาด URL หลังจาก 5 วินาที
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    })
    .catch(error => {
        console.error('Agreement generation error:', error);
        showAlert(`Error generating agreement: ${error.message}`, 'error');
    });
}

// ✅ ฟังก์ชันสำหรับ download agreement file
function downloadAgreementFile(url, bookingNo, fileType) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const extension = fileType === 'pdf' ? 'pdf' : 'xlsx';
    a.download = `${dateStr}_${bookingNo}_Agreement.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadFile(url, bookingNo, fileType) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const extension = fileType === 'pdf' ? 'pdf' : 'xlsx';
    a.download = `${dateStr}_${bookingNo}_Motorbike_Booking.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ===============================================
// DISCOUNT VALIDATION FUNCTIONS
// ===============================================

function initializeDiscountValidation() {
    const discountInput = document.getElementById('discount');
    const editDiscountInput = document.getElementById('edit_discount');
    
    // สำหรับหน้าหลัก
    if (discountInput) {
        discountInput.addEventListener('input', function() {
            validateDiscountInput(this);
            clearTimeout(this.calculationTimeout);
            this.calculationTimeout = setTimeout(calculateTotal, 300);
        });
        
        discountInput.addEventListener('blur', function() {
            validateDiscountInput(this);
            calculateTotal();
        });
        
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
// EVENT LISTENERS & INITIALIZATION
// ===============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Motorbike script loaded successfully');
    
    // Load companies data
    loadMotorbikeCompanies();
    
    // Initialize discount validation first
    initializeDiscountValidation();

    setStaffNameAuto();
    
    // Initialize form elements if they exist - สำหรับ motorbike form
    const discountInput = document.getElementById('discount');
    
    if (discountInput) {
        discountInput.addEventListener('input', calculateTotal);
    }
    
    // Event listeners สำหรับ Edit Modal
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
    
    // Form submission handler - สำหรับ motorbike form
    const form = document.getElementById('luxuryBookingForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect all motorbike data
            const entries = document.querySelectorAll('.motorbike-entry');
            const companies = [];
            const details = [];
            const persons = [];
            const prices = [];
            
            entries.forEach(entry => {
                const entryId = entry.getAttribute('data-entry-id');
                companies.push(document.getElementById(`company_${entryId}`).value);
                details.push(document.getElementById(`detail_${entryId}`).value);
                persons.push(document.getElementById(`persons_${entryId}`).value);
                prices.push(document.getElementById(`price_${entryId}`).value);
            });
            
            // Create form data
            const formData = new FormData(this);
            
            // Replace array values with comma-separated strings
            formData.delete('company[]');
            formData.delete('detail[]');
            formData.delete('persons[]');
            formData.delete('price[]');
            
            formData.append('company', companies.join(','));
            formData.append('detail', details.join(','));
            formData.append('persons', persons.join(','));
            formData.append('price', prices.join(','));
            
            // แสดง loading notification
            const loadingNotif = showLoadingNotification('Submitting motorbike booking...');
            
            // Submit the form
            fetch('/submit_motorbike_booking', {
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
                    showSuccessAlert(`Motorbike booking submitted successfully! Booking Number: ${data.booking_no}`);
                    this.reset();
                    location.reload();
                } else {
                    showErrorAlert(`Error: ${data.message}`);
                }
            })
            .catch(error => {
                // ปิด loading notification
                if (loadingNotif) {
                    hideLoadingNotification(loadingNotif);
                }
                console.error('Error:', error);
                showErrorAlert(`Error submitting booking: ${error.message}`);
            });
        });
    }
    
    // Date validation สำหรับ Motorbike Period
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
    
    // Date validation สำหรับ search form
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
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const exportModal = document.getElementById('exportModal');
        const editModal = document.getElementById('editModal');
        
        if (event.target === exportModal) {
            closeExportModal();
        } else if (event.target === editModal) {
            closeModal();
        }
    });
    
    // Close modals on ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const cancelModal = document.getElementById('cancelModal');
            const editModal = document.getElementById('editModal');
            const exportModal = document.getElementById('exportModal');
            
            if (cancelModal) {
                closeCancelModal();
            } else if (editModal && editModal.style.display === 'block') {
                closeModal();
            } else if (exportModal && exportModal.style.display === 'block') {
                closeExportModal();
            }
        }
    });
    
    console.log('Motorbike script initialization complete');
});

// ===============================================
// USER INFO FUNCTIONS
// ===============================================

/**
 * ดึงข้อมูล user ปัจจุบันจาก server
 */
function getCurrentUser() {
    return fetch('/api/current_user')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.user;
            } else {
                console.error('Error getting current user:', data.message);
                return null;
            }
        })
        .catch(error => {
            console.error('Error fetching current user:', error);
            return null;
        });
}

/**
 * ตั้งค่า Staff Name อัตโนมัติ
 */
function setStaffNameAuto() {
    const staffNameField = document.getElementById('staffName');
    const editStaffNameField = document.getElementById('edit_staffName');
    
    // ถ้ามีข้อมูลใน template แล้ว (จาก context processor) ไม่ต้องทำอะไร
    if (staffNameField && staffNameField.value) {
        return Promise.resolve();
    }
    
    // ถ้าไม่มี ให้ดึงจาก API
    return getCurrentUser().then(user => {
        if (user && user.full_name) {
            if (staffNameField) {
                staffNameField.value = user.full_name;
            }
            if (editStaffNameField) {
                editStaffNameField.value = user.full_name;
            }
        }
    });
}

/**
 * ตั้งค่า Cancel Name อัตโนมัติ
 */
function setCancelNameAuto() {
    const cancelNameField = document.getElementById('cancelName');
    
    if (cancelNameField) {
        getCurrentUser().then(user => {
            if (user && user.full_name) {
                cancelNameField.value = user.full_name;
                // ลบสี error ถ้ามี
                cancelNameField.style.borderColor = '';
            }
        });
    }
}