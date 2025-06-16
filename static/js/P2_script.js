// P2_scripts.js - Enhanced version with discount support
// ✅ Global variables to track current mode
let fromInputMode = 'dropdown'; // 'dropdown' or 'custom'
let toInputMode = 'dropdown';   // 'dropdown' or 'custom'

// ✅ Toggle Functions
function toggleFromInput(mode) {
    fromInputMode = mode;
    const dropdownContainer = document.getElementById('from_dropdown_container');
    const customInput = document.getElementById('place_from_input');
    const dropdownBtn = document.getElementById('from_dropdown_btn');
    const customBtn = document.getElementById('from_custom_btn');
    
    if (mode === 'dropdown') {
        dropdownContainer.style.display = 'block';
        customInput.style.display = 'none';
        dropdownBtn.classList.add('active');
        customBtn.classList.remove('active');
        // Clear custom input when switching back to dropdown
        customInput.value = '';
        // Trigger price update
        updatePriceInfo();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        // Clear price info when switching to custom
        clearPriceInfo();
    }
}

function toggleToInput(mode) {
    toInputMode = mode;
    const dropdownContainer = document.getElementById('to_dropdown_container');
    const customInput = document.getElementById('place_to_input');
    const dropdownBtn = document.getElementById('to_dropdown_btn');
    const customBtn = document.getElementById('to_custom_btn');
    
    if (mode === 'dropdown') {
        dropdownContainer.style.display = 'block';
        customInput.style.display = 'none';
        dropdownBtn.classList.add('active');
        customBtn.classList.remove('active');
        // Clear custom input when switching back to dropdown
        customInput.value = '';
        // Trigger price update
        updatePriceInfo();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        // Clear price info when switching to custom
        clearPriceInfo();
    }
}


document.addEventListener('DOMContentLoaded', function() {
    // Set current date as travel date
    const today = new Date().toISOString().split('T')[0];
    const travelDateField = document.getElementById('travel_date');
    if (travelDateField) {
        travelDateField.value = today;
    }

    // Initialize transfer options
    updateTransferOptions();

    // Initialize discount validation
    initializeDiscountValidation();

    // Calculate total when price or discount change (เอา persons listener ออก)
    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discount');
    const receivedInput = document.getElementById('received');
    
    if (priceInput && receivedInput) {
        priceInput.addEventListener('input', calculateTotal);
        if (discountInput) {
            discountInput.addEventListener('input', calculateTotal);
        }
    }
    
    // Form submission
    const form = document.getElementById('luxuryTransferForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form before submission
            if (!validateTransferForm()) {
                return;
            }
            
            // Get correct place_from and place_to values
            let placeFrom, placeTo;
            
            if (fromInputMode === 'custom') {
                placeFrom = document.getElementById('place_from_input').value;
            } else {
                const transferType = document.querySelector('input[name="transferType"]:checked').value;
                if (transferType === 'departure') {
                    placeFrom = document.getElementById('place_from_departure').value;
                } else {
                    placeFrom = document.getElementById('place_from_arrival').value;
                }
            }
            
            if (toInputMode === 'custom') {
                placeTo = document.getElementById('place_to_input').value;
            } else {
                const transferType = document.querySelector('input[name="transferType"]:checked').value;
                if (transferType === 'departure') {
                    placeTo = document.getElementById('place_to_departure').value;
                } else {
                    placeTo = document.getElementById('place_to_arrival').value;
                }
            }
            
            // Create form data
            const formData = new FormData(form);
            
            // Override place_from and place_to with correct values
            formData.set('place_from', placeFrom);
            formData.set('place_to', placeTo);
            
            // Send AJAX request to the server
            fetch('/submit_transfer_booking', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                if (data.success) {
                    showAlert(`Booking submitted successfully! Booking Number: ${data.booking_no}`, 'success');
                    // Optionally reset the form
                    form.reset();
                    // Reset to today's date after form reset
                    if (travelDateField) {
                        travelDateField.value = today;
                    }
                    // Reset transfer options
                    updateTransferOptions();
                    // Reinitialize discount validation after reset
                    initializeDiscountValidation();
                } else {
                    showAlert(`Error: ${data.message}`, 'danger');
                }
            })
            .catch(error => {
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                showAlert(`An error occurred: ${error.message}`, 'danger');
            });
        });
    }
    
    // Date validation - ensure "to" date is after "from" date
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
    
    // Date validation for search form
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

    // Handle transfer type radio button changes
    const transferTypeRadios = document.querySelectorAll('input[name="transferType"]');
    transferTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateTransferOptions);
    });

    // Handle transfer type radio button changes for edit modal
    const editTransferTypeRadios = document.querySelectorAll('input[name="edit_transferType"]');
    editTransferTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateEditTransferOptions);
    });

    // Add event listener for persons field in edit modal

    const editDiscountInput = document.getElementById('edit_discount');
    const editPriceInput = document.getElementById('edit_price');
    
    if (editPersonsInput) {
        editPersonsInput.addEventListener('input', calculateEditTotal);
    }
    if (editDiscountInput) {
        editDiscountInput.addEventListener('input', calculateEditTotal);
    }
    if (editPriceInput) {
        editPriceInput.addEventListener('input', calculateEditTotal);
    }

    // ✅ เพิ่ม event listener สำหรับ price field
    if (priceInput) {
        priceInput.addEventListener('input', calculateTotal);
    }
    
    // ✅ เพิ่ม event listener สำหรับ edit price field
    if (editPriceInput) {
        editPriceInput.addEventListener('input', calculateEditTotal);
    }

});

// ===============================================
// ENHANCED DISCOUNT CALCULATION FUNCTIONS
// ===============================================

/**
 * คำนวณส่วนลดที่รองรับทั้งจำนวนเงินและเปอร์เซ็นต์
 */
function calculateDiscount(discountInput, subtotal) {
    if (!discountInput || discountInput === '' || subtotal <= 0) {
        return {
            discountAmount: 0,
            finalTotal: subtotal,
            isPercentage: false
        };
    }
    
    const discountStr = String(discountInput).trim();
    
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
            discountAmount: Math.round(discountAmount * 100) / 100,
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
    
    const isPercentage = value.includes('%');
    
    if (isPercentage) {
        const percentValue = parseFloat(value.replace('%', ''));
        if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
            inputElement.style.borderColor = 'red';
            inputElement.title = 'Please enter a valid percentage (0-100%)';
        } else {
            inputElement.style.borderColor = 'green';
            inputElement.title = '';
        }
    } else {
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

/**
 * เพิ่ม Event Listeners สำหรับ Discount Fields
 */
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

// Update transfer options based on selected type
function updateTransferOptions() {
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value || 'departure';
    
    // Get all elements
    const fromDeparture = document.getElementById('place_from_departure');
    const fromArrival = document.getElementById('place_from_arrival');
    const toDeparture = document.getElementById('place_to_departure');
    const toArrival = document.getElementById('place_to_arrival');
    
    // Hide all dropdowns first
    if (fromDeparture) fromDeparture.style.display = 'none';
    if (fromArrival) fromArrival.style.display = 'none';
    if (toDeparture) toDeparture.style.display = 'none';
    if (toArrival) toArrival.style.display = 'none';
    
    // ✅ Clear ฟิลด์เมื่อเปลี่ยน transfer type
    clearFormFields();
    const priceInfo = document.getElementById('priceInfo');
    if (priceInfo) priceInfo.style.display = 'none';
    
    // Show appropriate dropdowns based on transfer type
    if (transferType === 'departure') {
        if (fromDeparture) fromDeparture.style.display = 'block';
        if (toDeparture) {
            toDeparture.style.display = 'block';
            toDeparture.selectedIndex = 0; // Reset to first option
        }
    } else {
        if (fromArrival) {
            fromArrival.style.display = 'block';
            fromArrival.selectedIndex = 0; // Reset to first option
        }
        if (toArrival) toArrival.style.display = 'block';
    }
    
    // Reset toggle buttons to dropdown mode
    resetToggleButtons();
    
    // ✅ ไม่ต้อง setTimeout แล้ว เพราะจะ clear ฟิลด์แล้ว
}

// ✅ Reset toggle buttons to dropdown mode
function resetToggleButtons() {
    // Reset FROM toggle
    fromInputMode = 'dropdown';
    const fromDropdownContainer = document.getElementById('from_dropdown_container');
    const fromCustomInput = document.getElementById('place_from_input');
    const fromDropdownBtn = document.getElementById('from_dropdown_btn');
    const fromCustomBtn = document.getElementById('from_custom_btn');
    
    if (fromDropdownContainer) fromDropdownContainer.style.display = 'block';
    if (fromCustomInput) {
        fromCustomInput.style.display = 'none';
        fromCustomInput.value = '';
    }
    if (fromDropdownBtn) fromDropdownBtn.classList.add('active');
    if (fromCustomBtn) fromCustomBtn.classList.remove('active');
    
    // Reset TO toggle
    toInputMode = 'dropdown';
    const toDropdownContainer = document.getElementById('to_dropdown_container');
    const toCustomInput = document.getElementById('place_to_input');
    const toDropdownBtn = document.getElementById('to_dropdown_btn');
    const toCustomBtn = document.getElementById('to_custom_btn');
    
    if (toDropdownContainer) toDropdownContainer.style.display = 'block';
    if (toCustomInput) {
        toCustomInput.style.display = 'none';
        toCustomInput.value = '';
    }
    if (toDropdownBtn) toDropdownBtn.classList.add('active');
    if (toCustomBtn) toCustomBtn.classList.remove('active');
}

// Update price information when route is selected
function updatePriceInfo() {
    // Skip if in custom input mode
    if (fromInputMode === 'custom' || toInputMode === 'custom') {
        clearPriceInfo();
        return;
    }
    
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value || 'departure';
    let selectedOption = null;
    
    if (transferType === 'departure') {
        const toDeparture = document.getElementById('place_to_departure');
        if (toDeparture && toDeparture.style.display !== 'none') {
            selectedOption = toDeparture.selectedOptions[0];
        }
    } else {
        const fromArrival = document.getElementById('place_from_arrival');
        if (fromArrival && fromArrival.style.display !== 'none') {
            selectedOption = fromArrival.selectedOptions[0];
        }
    }
    
    if (selectedOption && selectedOption.value && selectedOption.value !== '') {
        const passengers = selectedOption.getAttribute('data-passengers');
        const price = selectedOption.getAttribute('data-price');
        
        // ✅ Update form fields - อัปเดตทุกครั้งที่เลือก dropdown ใหม่
        const priceField = document.getElementById('price');
        const personsField = document.getElementById('persons');
        
        // ✅ ลบเงื่อนไข !personsField.value ออก - อัปเดตทุกครั้ง
        if (personsField) {
            personsField.value = passengers;
        }
        
        // ✅ ลบเงื่อนไข !priceField.value ออก - อัปเดตทุกครั้ง
        if (priceField) {
            priceField.value = price;
        }
        
        // Show route info
        const routePassengers = document.getElementById('routePassengers');
        const routePrice = document.getElementById('routePrice');
        const priceInfo = document.getElementById('priceInfo');
        
        if (routePassengers) routePassengers.textContent = passengers;
        if (routePrice) routePrice.textContent = price;
        if (priceInfo) priceInfo.style.display = 'block';
        
        // Calculate total
        calculateTotal();
    } else {
        clearPriceInfo();
    }
}

function clearPriceInfo() {
    const priceInfo = document.getElementById('priceInfo');
    const receivedField = document.getElementById('received');
    
    if (priceInfo) priceInfo.style.display = 'none';
    if (receivedField) receivedField.value = '';
}


// แก้ไขฟังก์ชัน calculateTotal() - ไม่คูณจำนวนคน แค่ใช้ราคาต่อคนโดยตรง
function calculateTotal() {
    const priceField = document.getElementById('price');
    const discountField = document.getElementById('discount');
    const receivedField = document.getElementById('received');
    
    if (!priceField || !receivedField) return;
    
    const price = parseFloat(priceField.value) || 0;
    const discountValue = discountField ? discountField.value : '';
    
    if (price > 0) {
        // ✅ ใช้ราคาต่อคนโดยตรง ไม่คูณจำนวนคน เพราะ persons เป็น text
        const subtotal = price;
        
        // คำนวณส่วนลด
        const discountResult = calculateDiscount(discountValue, subtotal);
        
        // แสดงผลลัพธ์
        receivedField.value = discountResult.finalTotal.toFixed(2);
        
        // แสดงข้อผิดพลาดหากมี
        if (discountResult.error) {
            showAlert(discountResult.error, 'warning');
            if (discountField) {
                discountField.style.borderColor = 'red';
            }
        } else {
            if (discountField) {
                discountField.style.borderColor = discountValue ? 'green' : '';
            }
        }
        
        console.log(`Transfer Total: ${price} - ${discountResult.discountAmount} = ${discountResult.finalTotal}`);
    } else {
        receivedField.value = '';
    }
}

// Validate transfer form before submission
function validateTransferForm() {
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value;
    
    if (transferType === 'departure') {
        // Get destination from either dropdown or input
        const toDropdown = document.getElementById('place_to_departure');
        const toInput = document.getElementById('place_to_input');
        const destination = (toInput && toInput.style.display !== 'none') ? 
                           toInput.value : toDropdown.value;
        
        if (!destination || destination === '' || destination === 'custom') {
            showAlert('Please select or enter a destination for departure transfer.', 'warning');
            return false;
        }
    } else if (transferType === 'arrivals') {
        // Get origin from either dropdown or input  
        const fromDropdown = document.getElementById('place_from_arrival');
        const fromInput = document.getElementById('place_from_input');
        const origin = (fromInput && fromInput.style.display !== 'none') ? 
                       fromInput.value : fromDropdown.value;
        
        if (!origin || origin === '' || origin === 'custom') {
            showAlert('Please select or enter an origin for arrival transfer.', 'warning');
            return false;
        }
    }
    
    // Validate required fields
    const requiredFields = ['name', 'surname', 'time', 'staffName', 'status'];
    for (let fieldName of requiredFields) {
        const field = document.getElementById(fieldName);
        if (field && (!field.value || field.value.trim() === '')) {
            showAlert(`Please fill in the ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, 'warning');
            field.focus();
            return false;
        }
    }
    
    // ✅ ตรวจสอบ persons field (text)
    const personsField = document.getElementById('persons');
    if (personsField && (!personsField.value || personsField.value.trim() === '')) {
        showAlert('Please enter passenger information (e.g. 2 Adults, 1 Adult + 1 Child).', 'warning');
        personsField.focus();
        return false;
    }
    
    // ✅ ตรวจสอบราคา
    const priceField = document.getElementById('price');
    if (priceField && (!priceField.value || parseFloat(priceField.value) <= 0)) {
        showAlert('Please enter a valid price.', 'warning');
        priceField.focus();
        return false;
    }
    
    return true;
}

// แสดงข้อความแจ้งเตือน
function showAlert(message, type) {
    // แปลงประเภทการแจ้งเตือนจากฟังก์ชันเดิมเป็นประเภทที่ใช้ในระบบใหม่
    let notificationType;
    switch (type) {
        case 'success':
            notificationType = 'success';
            break;
        case 'danger':
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
    
    // แสดงการแจ้งเตือนด้วยระบบใหม่
    if (typeof showNotification === 'function') {
        showNotification(message, notificationType, 5000, true);
    } else {
        // Fallback to alert if notification system not available
        alert(message);
    }
    
    // สำหรับความเข้ากันได้กับระบบเดิม
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.style.display = 'none';
    }
}

// ===============================================
// UPDATED TRANSFER CANCEL FUNCTION WITH NAME INPUT MODAL
// ===============================================

// ฟังก์ชันสำหรับการยกเลิกการจอง Transfer - อัพเดตเวอร์ชัน
function cancelTransfer() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select at least one booking to cancel.', 'info');
        return;
    }
    
    // แสดง modal สำหรับกรอกชื่อผู้ cancel
    showTransferCancelModal(selectedBookings);
}

// ฟังก์ชันแสดง modal สำหรับกรอกชื่อผู้ cancel (Transfer)
function showTransferCancelModal(selectedBookings) {
    // สร้าง modal element
    const modalHtml = `
        <div id="transferCancelModal" class="modal" style="display: block; z-index: 10000;">
            <div class="modal-content" style="max-width: 400px; margin: 15% auto;">
                <div class="modal-header">
                    <span class="close" onclick="closeTransferCancelModal()">&times;</span>
                    <h2>Cancel Transfer Booking(s)</h2>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <p><strong>Selected transfers:</strong> ${selectedBookings.length} booking(s)</p>
                    <div class="form-group">
                        <label for="transferCancelName" style="display: block; margin-bottom: 8px; font-weight: bold;">
                            Name of person cancelling:
                        </label>
                        <input type="text" 
                               id="transferCancelName" 
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
                            onclick="closeTransferCancelModal()" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="button" 
                            onclick="confirmTransferCancel()" 
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
        const nameInput = document.getElementById('transferCancelName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
    
    // เพิ่ม event listener สำหรับ Enter key
    document.getElementById('transferCancelName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmTransferCancel();
        }
    });
}

// ฟังก์ชันปิด transfer cancel modal
function closeTransferCancelModal() {
    const modal = document.getElementById('transferCancelModal');
    if (modal) {
        modal.remove();
    }
}

// ฟังก์ชันยืนยันการ cancel transfer
function confirmTransferCancel() {
    const nameInput = document.getElementById('transferCancelName');
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
        closeTransferCancelModal();
        return;
    }
    
    // ปิด modal
    closeTransferCancelModal();
    
    // สร้าง form data
    const formData = new FormData();
    
    // เพิ่ม selected bookings
    selectedBookings.forEach(checkbox => {
        formData.append('selected_bookings', checkbox.value);
    });
    
    // เพิ่มชื่อผู้ cancel
    formData.append('cancelled_by', cancelName);
    
    // ส่งคำขอ
    fetch('/cancel_transfer_bookings', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            setTimeout(function() {
                location.reload();
            }, 1500);
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        showAlert('An error occurred. Please try again.', 'danger');
        console.error('Error:', error);
    });
}

// ปิด modal เมื่อคลิกข้างนอก (Transfer)
document.addEventListener('click', function(event) {
    const modal = document.getElementById('transferCancelModal');
    if (modal && event.target === modal) {
        closeTransferCancelModal();
    }
});

// ปิด modal เมื่อกด ESC (Transfer)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('transferCancelModal');
        if (modal) {
            closeTransferCancelModal();
        }
    }
});

// Update transfer options for edit modal
function updateEditTransferOptions() {
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    
    // Get all dropdown elements for edit modal
    const fromDeparture = document.getElementById('edit_place_from_departure');
    const fromArrival = document.getElementById('edit_place_from_arrival');
    const toDeparture = document.getElementById('edit_place_to_departure');
    const toArrival = document.getElementById('edit_place_to_arrival');
    const fromInput = document.getElementById('edit_place_from_input');
    const toInput = document.getElementById('edit_place_to_input');
    
    // Hide all dropdowns and inputs first
    if (fromDeparture) fromDeparture.style.display = 'none';
    if (fromArrival) fromArrival.style.display = 'none';
    if (toDeparture) toDeparture.style.display = 'none';
    if (toArrival) toArrival.style.display = 'none';
    if (fromInput) fromInput.style.display = 'none';
    if (toInput) toInput.style.display = 'none';
    
    // Reset form fields
    const priceField = document.getElementById('edit_price');
    const receivedField = document.getElementById('edit_received');
    
    if (priceField) priceField.value = '';
    if (receivedField) receivedField.value = '';
    
    if (transferType === 'departure') {
        // Show departure dropdowns
        if (fromDeparture) fromDeparture.style.display = 'block';
        if (toDeparture) toDeparture.style.display = 'block';
        
        // Reset departure destination selection
        if (toDeparture) {
            toDeparture.selectedIndex = 0;
        }
    } else {
        // Show arrival dropdowns
        if (fromArrival) fromArrival.style.display = 'block';
        if (toArrival) toArrival.style.display = 'block';
        
        // Reset arrival origin selection
        if (fromArrival) {
            fromArrival.selectedIndex = 0;
        }
    }
}

// Update price information for edit modal when route is selected
function updateEditPriceInfo() {
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    let selectedOption;
    
    if (transferType === 'departure') {
        const toDeparture = document.getElementById('edit_place_to_departure');
        selectedOption = toDeparture ? toDeparture.selectedOptions[0] : null;
    } else {
        const fromArrival = document.getElementById('edit_place_from_arrival');
        selectedOption = fromArrival ? fromArrival.selectedOptions[0] : null;
    }
    
    if (selectedOption && selectedOption.value && selectedOption.value !== '' && selectedOption.value !== 'custom') {
        const passengers = selectedOption.getAttribute('data-passengers');
        const price = selectedOption.getAttribute('data-price');
        
        const priceField = document.getElementById('edit_price');
        const personsField = document.getElementById('edit_persons');
        
        // ✅ อัปเดตทุกครั้งที่เลือก dropdown ใหม่
        if (personsField) {
            personsField.value = passengers;
        }
        
        if (priceField) {
            priceField.value = price;
        }
        
        // Calculate total
        calculateEditTotal();
    } else {
        // Clear fields when no valid selection
        const priceField = document.getElementById('edit_price');
        const personsField = document.getElementById('edit_persons');
        const receivedField = document.getElementById('edit_received');
        
        if (personsField) personsField.value = '';
        if (priceField) priceField.value = '';
        if (receivedField) receivedField.value = '';
    }
}

// ✅ ฟังก์ชันสำหรับ clear ฟิลด์เมื่อไม่มีการเลือก
function clearFormFields() {
    const priceField = document.getElementById('price');
    const personsField = document.getElementById('persons');
    const receivedField = document.getElementById('received');
    
    if (priceField) priceField.value = '';
    if (personsField) personsField.value = '';
    if (receivedField) receivedField.value = '';
}

// ✅ แก้ไข clearPriceInfo ให้ clear ฟิลด์ด้วย
function clearPriceInfo() {
    const priceInfo = document.getElementById('priceInfo');
    const receivedField = document.getElementById('received');
    
    if (priceInfo) priceInfo.style.display = 'none';
    if (receivedField) receivedField.value = '';
    
    // ✅ เมื่อไม่มีข้อมูล route ให้ clear ฟิลด์ทั้งหมด
    clearFormFields();
}


// 🆕 Enhanced Calculate total amount for edit modal with discount support
function calculateEditTotal() {
    const priceField = document.getElementById('edit_price');
    const discountField = document.getElementById('edit_discount');
    const receivedField = document.getElementById('edit_received');
    
    if (!priceField || !receivedField) return;
    
    const price = parseFloat(priceField.value) || 0;
    const discountValue = discountField ? discountField.value : '';
    
    if (price > 0) {
        // ✅ ใช้ราคาต่อคนโดยตรง ไม่คูณจำนวนคน เพราะ persons เป็น text
        const subtotal = price;
        
        // คำนวณส่วนลด
        const discountResult = calculateDiscount(discountValue, subtotal);
        
        // แสดงผลลัพธ์
        receivedField.value = discountResult.finalTotal.toFixed(2);
        
        // แสดงข้อผิดพลาดหากมี
        if (discountResult.error) {
            showAlert(discountResult.error, 'warning');
            if (discountField) {
                discountField.style.borderColor = 'red';
            }
        } else {
            if (discountField) {
                discountField.style.borderColor = discountValue ? 'green' : '';
            }
        }
        
        console.log(`Edit Transfer Total: ${price} - ${discountResult.discountAmount} = ${discountResult.finalTotal}`);
    } else {
        receivedField.value = '';
    }
}

// ฟังก์ชันสำหรับการเปิด Modal แก้ไขข้อมูล
function editTransfer() {
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
    
    // สร้าง FormData สำหรับส่งข้อมูล
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    
    // แสดง loading message
    showAlert('Loading booking details...', 'info');
    
    // ดึงข้อมูลการจองจาก server
    fetch('/get_transfer_booking_details', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // เติมข้อมูลลงในฟอร์มแก้ไข
            const booking = data.booking;
            
            console.log("Booking data received:", booking);
            
            // ข้อมูลพื้นฐาน
            document.getElementById('edit_booking_no').value = booking.booking_no;
            
            // ข้อมูลลูกค้า
            if (document.getElementById('edit_name')) {
                document.getElementById('edit_name').value = booking.customer_name || '';
            }
            
            if (document.getElementById('edit_surname')) {
                document.getElementById('edit_surname').value = booking.customer_surname || '';
            }
            
            // เปลี่ยนการตรวจสอบ transfer_type แทน departure/arrivals
            if (booking.transfer_type === 'departure') {
                const deptRadio = document.getElementById('edit_transferType_departure');
                if (deptRadio) {
                    deptRadio.checked = true;
                    updateEditTransferOptions();
                    
                    // ตั้งค่า dropdown ที่เหมาะสม
                    setTimeout(() => {
                        const toDeparture = document.getElementById('edit_place_to_departure');
                        if (toDeparture) {
                            // ลองหาค่าที่ตรงกันใน dropdown ก่อน
                            const option = Array.from(toDeparture.options).find(opt => opt.value === booking.place_to);
                            if (option) {
                                toDeparture.value = booking.place_to;
                                updateEditPriceInfo();
                            } else {
                                // ถ้าไม่พบใน dropdown ให้ใช้ input field
                                toDeparture.style.display = 'none';
                                const toInput = document.getElementById('edit_place_to_input');
                                if (toInput) {
                                    toInput.style.display = 'block';
                                    toInput.value = booking.place_to || '';
                                }
                            }
                        }
                    }, 100);
                }
            } else if (booking.transfer_type === 'arrivals') {
                const arrRadio = document.getElementById('edit_transferType_arrivals');
                if (arrRadio) {
                    arrRadio.checked = true;
                    updateEditTransferOptions();
                    
                    // ตั้งค่า dropdown ที่เหมาะสม
                    setTimeout(() => {
                        const fromArrival = document.getElementById('edit_place_from_arrival');
                        if (fromArrival) {
                            // ลองหาค่าที่ตรงกันใน dropdown ก่อน
                            const option = Array.from(fromArrival.options).find(opt => opt.value === booking.place_from);
                            if (option) {
                                fromArrival.value = booking.place_from;
                                updateEditPriceInfo();
                            } else {
                                // ถ้าไม่พบใน dropdown ให้ใช้ input field
                                fromArrival.style.display = 'none';
                                const fromInput = document.getElementById('edit_place_from_input');
                                if (fromInput) {
                                    fromInput.style.display = 'block';
                                    fromInput.value = booking.place_from || '';
                                }
                            }
                        }
                    }, 100);
                }
            }
            
            // เวลารับ
            if (document.getElementById('edit_time')) {
                document.getElementById('edit_time').value = booking.pickup_time || '';
            }
            
            // วันที่เดินทาง
            if (document.getElementById('edit_travel_date')) {
                document.getElementById('edit_travel_date').value = booking.travel_date || '';
            }
            
            // ข้อมูลจำนวนและราคา
            if (document.getElementById('edit_persons')) {
                // ใส่ข้อมูล passengers จาก database ลงใน persons field
                document.getElementById('edit_persons').value = booking.quantity || '';
            }
            
            if (document.getElementById('edit_price')) {
                document.getElementById('edit_price').value = booking.price || '0';
            }
            
            // 🆕 ตั้งค่า discount
            if (document.getElementById('edit_discount')) {
                document.getElementById('edit_discount').value = booking.discount || '';
            }
            
            // ข้อมูลการเงิน - คำนวณ total จาก persons * price - discount
            if (document.getElementById('edit_received')) {
                // ใช้ calculateEditTotal() เพื่อคำนวณรวม discount
                setTimeout(() => {
                    calculateEditTotal();
                }, 200);
            }
            
            // ข้อมูลรายละเอียด - ใช้จากตาราง transfer_rental
            if (document.getElementById('edit_detail')) {
                document.getElementById('edit_detail').value = booking.detail || '';
            }
            
            // ข้อมูลสถานะและพนักงาน
            if (document.getElementById('edit_status')) {
                document.getElementById('edit_status').value = booking.payment_status || 'unpaid';
            }
            
            if (document.getElementById('edit_staffName')) {
                document.getElementById('edit_staffName').value = booking.staff_name || '';
            }
            
            // ข้อมูลคนขับ
            if (document.getElementById('edit_driverName')) {
                document.getElementById('edit_driverName').value = booking.driver_name || '';
            }
            
            // 🆕 ข้อมูล payment method และ remark
            if (document.getElementById('edit_method')) {
                document.getElementById('edit_method').value = booking.payment_method || '';
            }
            
            if (document.getElementById('edit_remark')) {
                document.getElementById('edit_remark').value = booking.remark || '';
            }
            
            // ปิด alert
            const alertContainer = document.getElementById('alert-container');
            if (alertContainer) {
                alertContainer.style.display = 'none';
            }
            
            // แสดง Modal
            const editModal = document.getElementById('editModal');
            if (editModal) {
                editModal.style.display = 'block';
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

// ฟังก์ชันปิด Modal
function closeModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
}

// ฟังก์ชันบันทึกการแก้ไขข้อมูล
function saveTransfer() {
    const form = document.getElementById('editForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    // Get correct place_from and place_to based on transfer type and current display
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value;
    
    // เพิ่มการส่ง transfer_type แทน
    formData.set('edit_transferType', transferType);
    
    // ตั้งค่า place_from และ place_to
    if (transferType === 'departure') {
        const toDeparture = document.getElementById('edit_place_to_departure');
        const toInput = document.getElementById('edit_place_to_input');
        
        if (toDeparture && toDeparture.style.display !== 'none') {
            formData.set('place_to', toDeparture.value);
        } else if (toInput && toInput.style.display !== 'none') {
            formData.set('place_to', toInput.value);
        }
    } else {
        const fromArrival = document.getElementById('edit_place_from_arrival');
        const fromInput = document.getElementById('edit_place_from_input');
        
        if (fromArrival && fromArrival.style.display !== 'none') {
            formData.set('place_from', fromArrival.value);
        } else if (fromInput && fromInput.style.display !== 'none') {
            formData.set('place_from', fromInput.value);
        }
    }
    
    fetch('/update_transfer_booking', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();
            showAlert(data.message, 'success');
            setTimeout(function() {
                location.reload();
            }, 1500);
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        showAlert('An error occurred while saving booking data.', 'danger');
        console.error('Error:', error);
    });
}


// Function to generate and download Excel form
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
    
    // Show loading message - เปลี่ยนข้อความเป็น PDF
    showAlert('กำลังสร้างไฟล์ PDF...', 'info');
    
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    
    fetch('/generate_excel_form_transfer', {
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
        console.log('Transfer Response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                throw new Error(data.message || 'เกิดข้อผิดพลาด');
            });
        } else {
            return response.blob();
        }
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const contentType = blob.type || '';
        console.log('Transfer Blob type:', contentType);
        
        if (contentType.includes('application/pdf')) {
            // กรณีเป็น PDF - เปิดใน tab ใหม่
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
                showAlert('เปิดไฟล์ Transfer PDF ในแท็บใหม่สำเร็จ', 'success');
            } else {
                downloadTransferFile(url, bookingNo, 'pdf');
                showAlert('ดาวน์โหลดไฟล์ Transfer PDF สำเร็จ', 'success');
            }
        } else {
            downloadTransferFile(url, bookingNo, 'xlsx');
            showAlert('ดาวน์โหลดไฟล์ Transfer Excel สำเร็จ', 'success');
        }
        
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 5000);
    })
    .catch(error => {
        console.error('Transfer Error:', error);
        showAlert(`เกิดข้อผิดพลาด: ${error.message}`, 'danger');
    });
}

// ฟังก์ชันช่วยสำหรับดาวน์โหลดไฟล์ Transfer
function downloadTransferFile(url, bookingNo, fileType) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const extension = fileType === 'pdf' ? 'pdf' : 'xlsx';
    
    a.download = `Transfer_Booking_${bookingNo}_${dateStr}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ⚠️ เพิ่มฟังก์ชันสำหรับเปิด PDF ในหน้าใหม่โดยตรง (optional)
function openTransferPdfInNewTab() {
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
    
    // สร้าง URL สำหรับเปิด PDF โดยตรง
    const pdfUrl = `/generate_excel_form_transfer?booking_no=${bookingNo}&format=pdf`;
    
    // เปิดใน tab ใหม่
    const newTab = window.open(pdfUrl, '_blank');
    if (newTab) {
        newTab.focus();
        showAlert('กำลังเปิด Transfer PDF ในแท็บใหม่...', 'info');
    } else {
        showAlert('กรุณาอนุญาตการเปิดป็อปอัพสำหรับเว็บไซต์นี้', 'warning');
    }
}

// ฟังก์ชันสำหรับเปิด Modal Export
function exportTransfer() {
   // Set today's date as default
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
   const currentYearMonth = today.toISOString().substr(0, 7);
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
   
   // Display the export modal
   const exportModal = document.getElementById('exportModal');
   if (exportModal) {
       exportModal.style.display = 'block';
       // Initialize the fields display
       toggleExportFields();
   }
}

// ฟังก์ชันปิด Modal Export
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
   const dateRange = document.getElementById('dateRangeFields');
   const monthRange = document.getElementById('monthRangeFields');
   const yearRange = document.getElementById('yearRangeFields');
   
   if (dateRange) dateRange.style.display = 'none';
   if (monthRange) monthRange.style.display = 'none';
   if (yearRange) yearRange.style.display = 'none';
   
   // แสดงช่องกรอกตามประเภทที่เลือก
   if (filterType === 'date' && dateRange) {
       dateRange.style.display = 'block';
   } else if (filterType === 'month' && monthRange) {
       monthRange.style.display = 'block';
   } else if (filterType === 'year' && yearRange) {
       yearRange.style.display = 'block';
   }
}

function submitExport() {
   const filterTypeRadio = document.querySelector('input[name="exportFilterType"]:checked');
   const transferTypeRadio = document.querySelector('input[name="exportTransferType"]:checked');
   const paymentStatusRadio = document.querySelector('input[name="exportPaymentStatus"]:checked');
   
   if (!filterTypeRadio || !transferTypeRadio) {
       showAlert('Please select filter and transfer type', 'warning');
       return;
   }
   
   const filterType = filterTypeRadio.value;
   const transferType = transferTypeRadio.value;
   const paymentStatus = paymentStatusRadio ? paymentStatusRadio.value : 'all';
   
   let formData = new FormData();
   formData.append('filter_type', filterType);
   formData.append('transfer_type', transferType);
   formData.append('payment_status', paymentStatus);
   
   // เพิ่มข้อมูลตามประเภทการกรอง
   if (filterType === 'date') {
       const startDate = document.getElementById('export_start_date')?.value;
       const endDate = document.getElementById('export_end_date')?.value;
       
       if (!startDate || !endDate) {
           showAlert('Please select both start and end dates', 'info');
           return;
       }
       
       formData.append('start_date', startDate);
       formData.append('end_date', endDate);
   } else if (filterType === 'month') {
       const startMonth = document.getElementById('export_start_month')?.value;
       const endMonth = document.getElementById('export_end_month')?.value;
       
       if (!startMonth || !endMonth) {
           showAlert('Please select both start and end months', 'info');
           return;
       }
       
       formData.append('start_month', startMonth);
       formData.append('end_month', endMonth);
   } else if (filterType === 'year') {
       const startYear = document.getElementById('export_start_year')?.value;
       const endYear = document.getElementById('export_end_year')?.value;
       
       if (!startYear || !endYear) {
           showAlert('Please select both start and end years', 'info');
           return;
       }
       
       formData.append('start_year', startYear);
       formData.append('end_year', endYear);
   }
   
   // แสดงข้อความกำลังดำเนินการ
   showAlert('Generating Excel file...', 'info');
   
   // ส่งข้อมูลไปยัง server
   fetch('/export_transfers', {
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
       
       // กำหนดชื่อไฟล์ตามวันที่ปัจจุบัน
       const today = new Date();
       const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
       a.download = `Transfers_Export_${dateStr}.xlsx`;
       
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
       console.error('Error:', error);
       showAlert(`Error: ${error.message}`, 'danger');
   });
}

// ปรับปรุง window.onclick เพื่อรองรับ modal export
window.onclick = function(event) {
   const editModal = document.getElementById('editModal');
   const exportModal = document.getElementById('exportModal');
   
   if (event.target == editModal) {
       closeModal();
   } else if (event.target == exportModal) {
       closeExportModal();
   }
};

// ✅ Functions สำหรับ Main Form
function handleFromChange() {
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value || 'departure';
    let selectedDropdown, customInput;
    
    if (transferType === 'departure') {
        selectedDropdown = document.getElementById('place_from_departure');
        customInput = document.getElementById('place_from_input');
    } else {
        selectedDropdown = document.getElementById('place_from_arrival');
        customInput = document.getElementById('place_from_input');
    }
    
    if (selectedDropdown && customInput) {
        if (selectedDropdown.value === 'custom') {
            customInput.style.display = 'block';
            customInput.focus();
            selectedDropdown.style.display = 'none';
        } else {
            customInput.style.display = 'none';
            updatePriceInfo();
        }
    }
}

function handleToChange() {
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value || 'departure';
    let selectedDropdown, customInput;
    
    if (transferType === 'departure') {
        selectedDropdown = document.getElementById('place_to_departure');
        customInput = document.getElementById('place_to_input');
    } else {
        selectedDropdown = document.getElementById('place_to_arrival');
        customInput = document.getElementById('place_to_input');
    }
    
    if (selectedDropdown && customInput) {
        if (selectedDropdown.value === 'custom') {
            customInput.style.display = 'block';
            customInput.focus();
            selectedDropdown.style.display = 'none';
        } else {
            customInput.style.display = 'none';
            updatePriceInfo();
        }
    }
}

// ✅ Functions สำหรับ Edit Modal
function handleEditFromChange() {
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    let selectedDropdown, customInput;
    
    if (transferType === 'departure') {
        selectedDropdown = document.getElementById('edit_place_from_departure');
    } else {
        selectedDropdown = document.getElementById('edit_place_from_arrival');
    }
    
    customInput = document.getElementById('edit_place_from_input');
    
    if (selectedDropdown && customInput && selectedDropdown.value !== 'custom') {
        customInput.value = selectedDropdown.value;
        updateEditPriceInfo();
    }
}

function handleEditToChange() {
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    let selectedDropdown, customInput;
    
    if (transferType === 'departure') {
        selectedDropdown = document.getElementById('edit_place_to_departure');
    } else {
        selectedDropdown = document.getElementById('edit_place_to_arrival');
    }
    
    customInput = document.getElementById('edit_place_to_input');
    
    if (selectedDropdown && customInput && selectedDropdown.value !== 'custom') {
        customInput.value = selectedDropdown.value;
        updateEditPriceInfo();
    }
}