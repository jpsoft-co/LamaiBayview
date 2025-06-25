// Transfer JavaScript - แก้ให้ถูกต้อง
let fromInputMode = 'dropdown';
let toInputMode = 'dropdown';
let transferData = [];

// MAIN FUNCTIONS
function updateAvailablePersonOptions() {
    if (fromInputMode === 'custom' || toInputMode === 'custom') {
        // Custom mode - แปลงทุกอย่างเป็น input
        convertToInputFields();
        return;
    }
    
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value || 'departure';
    let placeFrom, placeTo;
    
    if (transferType === 'departure') {
        placeFrom = 'Lamai Bayview Boutique Resort';
        placeTo = document.getElementById('place_to_departure')?.value || '';
    } else {
        placeFrom = document.getElementById('place_from_arrival')?.value || '';
        placeTo = 'Lamai Bayview Boutique Resort';
    }
    
    if (placeFrom && placeTo && placeFrom !== '' && placeTo !== '') {
        populatePersonsDropdown(placeFrom, placeTo);
    } else {
        clearPersonsDropdown();
    }
}

function populatePersonsDropdown(placeFrom, placeTo) {
    const personsDropdown = document.getElementById('persons');
    if (!personsDropdown) return;
    
    personsDropdown.innerHTML = '<option value="">Select passengers</option>';
    
    const routeOptions = transferData.filter(route => 
        route.place_from === placeFrom && route.place_to === placeTo
    );
    
    if (routeOptions.length === 0) {
        personsDropdown.innerHTML = '<option value="">No data available</option>';
        personsDropdown.disabled = true;
        return;
    }
    
    personsDropdown.disabled = false;
    routeOptions.sort((a, b) => a.passengers - b.passengers);
    
    routeOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.passengers;
        optionElement.textContent = option.passengers;
        optionElement.dataset.price = option.received;
        personsDropdown.appendChild(optionElement);
    });
}

function updatePriceFromPersons() {
    const personsDropdown = document.getElementById('persons');
    const priceField = document.getElementById('price');
    
    if (!personsDropdown || !priceField) return;
    
    const selectedOption = personsDropdown.selectedOptions[0];
    
    if (selectedOption && selectedOption.dataset.price) {
        priceField.value = selectedOption.dataset.price;
        calculateTotal();
    } else {
        priceField.value = '';
        clearReceivedField();
    }
}

function convertToInputFields() {
    // แปลง persons เป็น input
    const personsDropdown = document.getElementById('persons');
    if (personsDropdown && personsDropdown.tagName === 'SELECT') {
        const newInput = document.createElement('input');
        newInput.type = 'number';
        newInput.id = 'persons';
        newInput.name = 'persons';
        newInput.className = personsDropdown.className;
        newInput.placeholder = 'Enter number of passengers';
        newInput.min = '1';
        newInput.step = '1';
        newInput.required = true;
        
        personsDropdown.parentNode.replaceChild(newInput, personsDropdown);
    }
    
    // แปลง price เป็น input
    const priceField = document.getElementById('price');
    if (priceField) {
        priceField.removeAttribute('readonly');
        priceField.placeholder = 'Enter price amount';
        priceField.value = '';
    }
}

function convertToDropdownFields() {
    // แปลง persons กลับเป็น dropdown
    const personsInput = document.getElementById('persons');
    if (personsInput && personsInput.tagName === 'INPUT') {
        const newSelect = document.createElement('select');
        newSelect.id = 'persons';
        newSelect.name = 'persons';
        newSelect.className = personsInput.className;
        newSelect.required = true;
        newSelect.setAttribute('onchange', 'updatePriceFromPersons()');
        newSelect.innerHTML = '<option value="">Select passengers</option>';
        
        personsInput.parentNode.replaceChild(newSelect, personsInput);
    }
    
    // แปลง price กลับเป็น readonly
    const priceField = document.getElementById('price');
    if (priceField) {
        priceField.setAttribute('readonly', true);
        priceField.placeholder = 'Auto-filled from selection';
        priceField.value = '';
    }
}

function clearPersonsDropdown() {
    const personsDropdown = document.getElementById('persons');
    if (personsDropdown && personsDropdown.tagName === 'SELECT') {
        personsDropdown.innerHTML = '<option value="">Select destination first</option>';
        personsDropdown.disabled = true;
    }
    
    const priceField = document.getElementById('price');
    if (priceField) {
        priceField.value = '';
    }
}

// TOGGLE FUNCTIONS
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
        customInput.value = '';
        
        // กลับเป็น dropdown mode
        convertToDropdownFields();
        updateAvailablePersonOptions();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        
        // เปลี่ยนเป็น input mode
        convertToInputFields();
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
        customInput.value = '';
        
        // กลับเป็น dropdown mode
        convertToDropdownFields();
        updateAvailablePersonOptions();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        
        // เปลี่ยนเป็น input mode
        convertToInputFields();
    }
}



function updateTransferOptions() {
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value || 'departure';
    
    // Hide all dropdowns
    document.getElementById('place_from_departure')?.style.setProperty('display', 'none');
    document.getElementById('place_from_arrival')?.style.setProperty('display', 'none');
    document.getElementById('place_to_departure')?.style.setProperty('display', 'none');
    document.getElementById('place_to_arrival')?.style.setProperty('display', 'none');
    
    // Show appropriate dropdowns
    if (transferType === 'departure') {
        document.getElementById('place_from_departure')?.style.setProperty('display', 'block');
        document.getElementById('place_to_departure')?.style.setProperty('display', 'block');
    } else {
        document.getElementById('place_from_arrival')?.style.setProperty('display', 'block');
        document.getElementById('place_to_arrival')?.style.setProperty('display', 'block');
    }
    
    // Reset everything
    clearFormFields();
    convertToDropdownFields();
    resetToggleButtons();
}

function resetToggleButtons() {
    fromInputMode = 'dropdown';
    toInputMode = 'dropdown';
    
    const fromDropdownBtn = document.getElementById('from_dropdown_btn');
    const fromCustomBtn = document.getElementById('from_custom_btn');
    const toDropdownBtn = document.getElementById('to_dropdown_btn');
    const toCustomBtn = document.getElementById('to_custom_btn');
    
    if (fromDropdownBtn) fromDropdownBtn.classList.add('active');
    if (fromCustomBtn) fromCustomBtn.classList.remove('active');
    if (toDropdownBtn) toDropdownBtn.classList.add('active');
    if (toCustomBtn) toCustomBtn.classList.remove('active');
    
    const fromDropdownContainer = document.getElementById('from_dropdown_container');
    const fromCustomInput = document.getElementById('place_from_input');
    const toDropdownContainer = document.getElementById('to_dropdown_container');
    const toCustomInput = document.getElementById('place_to_input');
    
    if (fromDropdownContainer) fromDropdownContainer.style.display = 'block';
    if (fromCustomInput) {
        fromCustomInput.style.display = 'none';
        fromCustomInput.value = '';
    }
    if (toDropdownContainer) toDropdownContainer.style.display = 'block';
    if (toCustomInput) {
        toCustomInput.style.display = 'none';
        toCustomInput.value = '';
    }
}

// UTILITY FUNCTIONS
function clearFormFields() {
    const priceField = document.getElementById('price');
    const personsField = document.getElementById('persons');
    const receivedField = document.getElementById('received');
    
    if (priceField) priceField.value = '';
    if (personsField) personsField.value = '';
    if (receivedField) receivedField.value = '';
}

function clearReceivedField() {
    const receivedField = document.getElementById('received');
    if (receivedField) receivedField.value = '';
}

function calculateTotal() {
    const priceField = document.getElementById('price');
    const discountField = document.getElementById('discount');
    const receivedField = document.getElementById('received');
    
    if (!priceField || !receivedField) return;
    
    const price = parseFloat(priceField.value) || 0;
    const discountValue = discountField ? discountField.value : '';
    
    if (price > 0) {
        const subtotal = price;
        const discountResult = calculateDiscount(discountValue, subtotal);
        
        receivedField.value = discountResult.finalTotal.toFixed(2);
        
        if (discountResult.error) {
            showAlert(discountResult.error, 'warning');
            if (discountField) discountField.style.borderColor = 'red';
        } else {
            if (discountField) {
                discountField.style.borderColor = discountValue ? 'green' : '';
            }
        }
    } else {
        receivedField.value = '';
    }
}

function calculateDiscount(discountInput, subtotal) {
    if (!discountInput || discountInput === '' || subtotal <= 0) {
        return { discountAmount: 0, finalTotal: subtotal, isPercentage: false };
    }
    
    const discountStr = String(discountInput).trim();
    
    if (discountStr.includes('%')) {
        const percentageValue = parseFloat(discountStr.replace('%', ''));
        
        if (isNaN(percentageValue) || percentageValue < 0) {
            return { discountAmount: 0, finalTotal: subtotal, isPercentage: true, error: "Invalid percentage value" };
        }
        
        if (percentageValue > 100) {
            return { discountAmount: 0, finalTotal: subtotal, isPercentage: true, error: "Percentage cannot exceed 100%" };
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
        const discountAmount = parseFloat(discountStr);
        
        if (isNaN(discountAmount) || discountAmount < 0) {
            return { discountAmount: 0, finalTotal: subtotal, isPercentage: false, error: "Invalid discount amount" };
        }
        
        if (discountAmount > subtotal) {
            return { discountAmount: 0, finalTotal: subtotal, isPercentage: false, error: "Discount cannot exceed total amount" };
        }
        
        const finalTotal = subtotal - discountAmount;
        
        return {
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalTotal: Math.round(finalTotal * 100) / 100,
            isPercentage: false
        };
    }
}

function validateTransferForm() {
    const transferType = document.querySelector('input[name="transferType"]:checked')?.value;
    
    if (transferType === 'departure') {
        const toDropdown = document.getElementById('place_to_departure');
        const toInput = document.getElementById('place_to_input');
        const destination = (toInput && toInput.style.display !== 'none') ? 
                           toInput.value : toDropdown.value;
        
        if (!destination || destination === '' || destination === 'custom') {
            showAlert('Please select or enter a destination for departure transfer.', 'warning');
            return false;
        }
    } else if (transferType === 'arrivals') {
        const fromDropdown = document.getElementById('place_from_arrival');
        const fromInput = document.getElementById('place_from_input');
        const origin = (fromInput && fromInput.style.display !== 'none') ? 
                       fromInput.value : fromDropdown.value;
        
        if (!origin || origin === '' || origin === 'custom') {
            showAlert('Please select or enter an origin for arrival transfer.', 'warning');
            return false;
        }
    }
    
    const requiredFields = ['name', 'surname', 'time', 'staffName', 'status'];
    for (let fieldName of requiredFields) {
        const field = document.getElementById(fieldName);
        if (field && (!field.value || field.value.trim() === '')) {
            showAlert(`Please fill in the ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, 'warning');
            field.focus();
            return false;
        }
    }
    
    const personsField = document.getElementById('persons');
    if (personsField && (!personsField.value || personsField.value === '')) {
        showAlert('Please select or enter number of passengers.', 'warning');
        personsField.focus();
        return false;
    }
    
    const priceField = document.getElementById('price');
    if (priceField && (!priceField.value || parseFloat(priceField.value) <= 0)) {
        showAlert('Please enter a valid price.', 'warning');
        priceField.focus();
        return false;
    }
    
    return true;
}

// DATA LOADING
function loadTransferData() {
    fetch('/api/get_transfer_routes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                transferData = data.routes;
                console.log('Transfer data loaded:', transferData);
            } else {
                console.error('Error loading transfer data:', data.message);
                transferData = [];
            }
        })
        .catch(error => {
            console.error('Error fetching transfer data:', error);
            transferData = [
                {place_from: 'Lamai Bayview Boutique Resort', place_to: 'Airport', passengers: 3, received: 500},
                {place_from: 'Lamai Bayview Boutique Resort', place_to: 'Airport', passengers: 5, received: 600},
                {place_from: 'Lamai Bayview Boutique Resort', place_to: 'Bus Station', passengers: 3, received: 400},
                {place_from: 'Airport', place_to: 'Lamai Bayview Boutique Resort', passengers: 3, received: 500},
                {place_from: 'Bus Station', place_to: 'Lamai Bayview Boutique Resort', passengers: 3, received: 400}
            ];
            console.log('Using test transfer data:', transferData);
        });
}

function showAlert(message, type) {
    let notificationType;
    switch (type) {
        case 'success': notificationType = 'success'; break;
        case 'danger': notificationType = 'error'; break;
        case 'info': notificationType = 'info'; break;
        case 'warning': notificationType = 'warning'; break;
        default: notificationType = 'info';
    }
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, notificationType, 5000, true);
    } else if (typeof showNotification === 'function') {
        showNotification(message, notificationType, 5000, true);
    } else {
        alert(message);
    }
}

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

function setStaffNameAuto() {
    const staffNameField = document.getElementById('staffName');
    
    if (staffNameField && staffNameField.value) {
        return Promise.resolve();
    }
    
    return getCurrentUser().then(user => {
        if (user && user.full_name && staffNameField) {
            staffNameField.value = user.full_name;
        }
    });
}

// EDIT MODAL FUNCTIONS
function updateEditTransferOptions() {
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    
    // Hide all edit dropdowns
    const fromDeparture = document.getElementById('edit_place_from_departure');
    const fromArrival = document.getElementById('edit_place_from_arrival');
    const toDeparture = document.getElementById('edit_place_to_departure');
    const toArrival = document.getElementById('edit_place_to_arrival');
    
    if (fromDeparture) fromDeparture.style.display = 'none';
    if (fromArrival) fromArrival.style.display = 'none';
    if (toDeparture) toDeparture.style.display = 'none';
    if (toArrival) toArrival.style.display = 'none';
    
    if (transferType === 'departure') {
        if (fromDeparture) fromDeparture.style.display = 'block';
        if (toDeparture) toDeparture.style.display = 'block';
    } else {
        if (fromArrival) fromArrival.style.display = 'block';
        if (toArrival) toArrival.style.display = 'block';
    }
    
    // Reset edit fields
    clearEditFormFields();
}

function updateEditPersonOptions() {
    // ตรวจสอบว่าเป็น custom input หรือไม่
    const fromInput = document.getElementById('edit_place_from_input');
    const toInput = document.getElementById('edit_place_to_input');
    
    const isFromCustom = fromInput && fromInput.style.display !== 'none';
    const isToCustom = toInput && toInput.style.display !== 'none';
    
    if (isFromCustom || isToCustom) {
        // Custom mode - แปลงเป็น input fields
        convertEditToInputFields();
        return;
    }
    
    // Dropdown mode - populate persons dropdown
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    let placeFrom, placeTo;
    
    if (transferType === 'departure') {
        placeFrom = 'Lamai Bayview Boutique Resort';
        placeTo = document.getElementById('edit_place_to_departure')?.value || '';
    } else {
        placeFrom = document.getElementById('edit_place_from_arrival')?.value || '';
        placeTo = 'Lamai Bayview Boutique Resort';
    }
    
    if (placeFrom && placeTo && placeFrom !== '' && placeTo !== '') {
        populateEditPersonsDropdown(placeFrom, placeTo);
    } else {
        clearEditPersonsDropdown();
    }
}

function populateEditPersonsDropdown(placeFrom, placeTo) {
    const personsDropdown = document.getElementById('edit_persons');
    if (!personsDropdown) return;
    
    // ถ้าเป็น input field แล้ว ไม่ต้องทำอะไร
    if (personsDropdown.tagName === 'INPUT') return;
    
    personsDropdown.innerHTML = '<option value="">Select passengers</option>';
    
    const routeOptions = transferData.filter(route => 
        route.place_from === placeFrom && route.place_to === placeTo
    );
    
    if (routeOptions.length === 0) {
        personsDropdown.innerHTML = '<option value="">No data available</option>';
        personsDropdown.disabled = true;
        return;
    }
    
    personsDropdown.disabled = false;
    routeOptions.sort((a, b) => a.passengers - b.passengers);
    
    routeOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.passengers;
        optionElement.textContent = option.passengers;
        optionElement.dataset.price = option.received;
        personsDropdown.appendChild(optionElement);
    });
}

function updateEditPriceFromPersons() {
    const personsDropdown = document.getElementById('edit_persons');
    const priceField = document.getElementById('edit_price');
    
    if (!personsDropdown || !priceField) return;
    if (personsDropdown.tagName === 'INPUT') return; // Skip if it's input field
    
    const selectedOption = personsDropdown.selectedOptions[0];
    
    if (selectedOption && selectedOption.dataset.price) {
        priceField.value = selectedOption.dataset.price;
        calculateEditTotal();
    } else {
        priceField.value = '';
        clearEditReceivedField();
    }
}

function convertEditToInputFields() {
    // แปลง edit persons เป็น input
    const personsDropdown = document.getElementById('edit_persons');
    if (personsDropdown && personsDropdown.tagName === 'SELECT') {
        const currentValue = personsDropdown.value;
        
        const newInput = document.createElement('input');
        newInput.type = 'number';
        newInput.id = 'edit_persons';
        newInput.name = 'persons';
        newInput.className = personsDropdown.className;
        newInput.placeholder = 'Enter number of passengers';
        newInput.min = '1';
        newInput.step = '1';
        newInput.value = currentValue;
        newInput.required = true;
        
        personsDropdown.parentNode.replaceChild(newInput, personsDropdown);
    }
    
    // แปลง edit price เป็น input
    const priceField = document.getElementById('edit_price');
    if (priceField) {
        priceField.removeAttribute('readonly');
        priceField.placeholder = 'Enter price amount';
    }
}

function convertEditToDropdownFields() {
    // แปลง edit persons กลับเป็น dropdown
    const personsInput = document.getElementById('edit_persons');
    if (personsInput && personsInput.tagName === 'INPUT') {
        const currentValue = personsInput.value;
        
        const newSelect = document.createElement('select');
        newSelect.id = 'edit_persons';
        newSelect.name = 'persons';
        newSelect.className = personsInput.className;
        newSelect.required = true;
        newSelect.setAttribute('onchange', 'updateEditPriceFromPersons()');
        newSelect.innerHTML = '<option value="">Select passengers</option>';
        newSelect.value = currentValue;
        
        personsInput.parentNode.replaceChild(newSelect, personsInput);
    }
    
    // แปลง edit price กลับเป็น readonly
    const priceField = document.getElementById('edit_price');
    if (priceField) {
        priceField.setAttribute('readonly', true);
        priceField.placeholder = 'Auto-filled from selection';
    }
}

function clearEditPersonsDropdown() {
    const personsDropdown = document.getElementById('edit_persons');
    if (personsDropdown && personsDropdown.tagName === 'SELECT') {
        personsDropdown.innerHTML = '<option value="">Select destination first</option>';
        personsDropdown.disabled = true;
    }
    
    const priceField = document.getElementById('edit_price');
    if (priceField) {
        priceField.value = '';
    }
}

function clearEditFormFields() {
    const priceField = document.getElementById('edit_price');
    const personsField = document.getElementById('edit_persons');
    const receivedField = document.getElementById('edit_received');
    
    if (priceField) priceField.value = '';
    if (personsField) personsField.value = '';
    if (receivedField) receivedField.value = '';
}

function clearEditReceivedField() {
    const receivedField = document.getElementById('edit_received');
    if (receivedField) receivedField.value = '';
}

function calculateEditTotal() {
    const priceField = document.getElementById('edit_price');
    const discountField = document.getElementById('edit_discount');
    const receivedField = document.getElementById('edit_received');
    
    if (!priceField || !receivedField) return;
    
    const price = parseFloat(priceField.value) || 0;
    const discountValue = discountField ? discountField.value : '';
    
    if (price > 0) {
        const subtotal = price;
        const discountResult = calculateDiscount(discountValue, subtotal);
        
        receivedField.value = discountResult.finalTotal.toFixed(2);
        
        if (discountResult.error) {
            showAlert(discountResult.error, 'warning');
            if (discountField) discountField.style.borderColor = 'red';
        } else {
            if (discountField) {
                discountField.style.borderColor = discountValue ? 'green' : '';
            }
        }
    } else {
        receivedField.value = '';
    }
}

// Edit modal functions (existing ones)
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
    
    const formData = new FormData();
    formData.append('booking_no', bookingNo);
    
    showAlert('Loading booking details...', 'info');
    
    fetch('/get_transfer_booking_details', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateEditModal(data.booking);
            
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

let editFromInputMode = 'dropdown';
let editToInputMode = 'dropdown';

// Toggle functions for edit modal
function toggleEditFromInput(mode) {
    editFromInputMode = mode;
    const dropdownContainer = document.getElementById('edit_from_dropdown_container');
    const customInput = document.getElementById('edit_place_from_input');
    const dropdownBtn = document.getElementById('edit_from_dropdown_btn');
    const customBtn = document.getElementById('edit_from_custom_btn');
    
    if (mode === 'dropdown') {
        dropdownContainer.style.display = 'block';
        customInput.style.display = 'none';
        dropdownBtn.classList.add('active');
        customBtn.classList.remove('active');
        customInput.value = '';
        
        // กลับเป็น dropdown mode
        convertEditToDropdownFields();
        updateEditPersonOptions();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        
        // เปลี่ยนเป็น input mode
        convertEditToInputFields();
    }
}

function toggleEditToInput(mode) {
    editToInputMode = mode;
    const dropdownContainer = document.getElementById('edit_to_dropdown_container');
    const customInput = document.getElementById('edit_place_to_input');
    const dropdownBtn = document.getElementById('edit_to_dropdown_btn');
    const customBtn = document.getElementById('edit_to_custom_btn');
    
    if (mode === 'dropdown') {
        dropdownContainer.style.display = 'block';
        customInput.style.display = 'none';
        dropdownBtn.classList.add('active');
        customBtn.classList.remove('active');
        customInput.value = '';
        
        // กลับเป็น dropdown mode
        convertEditToDropdownFields();
        updateEditPersonOptions();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        
        // เปลี่ยนเป็น input mode
        convertEditToInputFields();
    }
}

function resetEditToggleButtons() {
    editFromInputMode = 'dropdown';
    editToInputMode = 'dropdown';
    
    const editFromDropdownBtn = document.getElementById('edit_from_dropdown_btn');
    const editFromCustomBtn = document.getElementById('edit_from_custom_btn');
    const editToDropdownBtn = document.getElementById('edit_to_dropdown_btn');
    const editToCustomBtn = document.getElementById('edit_to_custom_btn');
    
    if (editFromDropdownBtn) editFromDropdownBtn.classList.add('active');
    if (editFromCustomBtn) editFromCustomBtn.classList.remove('active');
    if (editToDropdownBtn) editToDropdownBtn.classList.add('active');
    if (editToCustomBtn) editToCustomBtn.classList.remove('active');
    
    const editFromDropdownContainer = document.getElementById('edit_from_dropdown_container');
    const editFromCustomInput = document.getElementById('edit_place_from_input');
    const editToDropdownContainer = document.getElementById('edit_to_dropdown_container');
    const editToCustomInput = document.getElementById('edit_place_to_input');
    
    if (editFromDropdownContainer) editFromDropdownContainer.style.display = 'block';
    if (editFromCustomInput) {
        editFromCustomInput.style.display = 'none';
        editFromCustomInput.value = '';
    }
    if (editToDropdownContainer) editToDropdownContainer.style.display = 'block';
    if (editToCustomInput) {
        editToCustomInput.style.display = 'none';
        editToCustomInput.value = '';
    }
}


function populateEditModal(booking) {
    console.log("Booking data received:", booking);
    
    document.getElementById('edit_booking_no').value = booking.booking_no;
    
    if (document.getElementById('edit_name')) {
        document.getElementById('edit_name').value = booking.customer_name || '';
    }
    
    if (document.getElementById('edit_surname')) {
        document.getElementById('edit_surname').value = booking.customer_surname || '';
    }
    
    // ✅ Reset toggle buttons first
    resetEditToggleButtons();
    
    // Handle transfer type and locations
    if (booking.transfer_type === 'departure') {
        const deptRadio = document.getElementById('edit_transferType_departure');
        if (deptRadio) {
            deptRadio.checked = true;
            updateEditTransferOptions();
            
            setTimeout(() => {
                const toDeparture = document.getElementById('edit_place_to_departure');
                const toInput = document.getElementById('edit_place_to_input');
                
                if (toDeparture && toInput) {
                    const option = Array.from(toDeparture.options).find(opt => opt.value === booking.place_to);
                    if (option) {
                        // ✅ Standard location - use dropdown
                        toDeparture.value = booking.place_to;
                        toggleEditToInput('dropdown'); // ใช้ toggle function แทน
                        updateEditPersonOptions();
                    } else {
                        // ✅ Custom location - use input
                        toInput.value = booking.place_to || '';
                        toggleEditToInput('custom'); // ใช้ toggle function แทน
                    }
                }
            }, 100);
        }
    } else if (booking.transfer_type === 'arrivals') {
        const arrRadio = document.getElementById('edit_transferType_arrivals');
        if (arrRadio) {
            arrRadio.checked = true;
            updateEditTransferOptions();
            
            setTimeout(() => {
                const fromArrival = document.getElementById('edit_place_from_arrival');
                const fromInput = document.getElementById('edit_place_from_input');
                
                if (fromArrival && fromInput) {
                    const option = Array.from(fromArrival.options).find(opt => opt.value === booking.place_from);
                    if (option) {
                        // ✅ Standard location - use dropdown
                        fromArrival.value = booking.place_from;
                        toggleEditFromInput('dropdown'); // ใช้ toggle function แทน
                        updateEditPersonOptions();
                    } else {
                        // ✅ Custom location - use input
                        fromInput.value = booking.place_from || '';
                        toggleEditFromInput('custom'); // ใช้ toggle function แทน
                    }
                }
            }, 100);
        }
    }
    
    // Other fields remain the same...
    if (document.getElementById('edit_time')) {
        document.getElementById('edit_time').value = booking.pickup_time || '';
    }
    
    if (document.getElementById('edit_travel_date')) {
        document.getElementById('edit_travel_date').value = booking.travel_date || '';
    }
    
    if (document.getElementById('edit_persons')) {
        setTimeout(() => {
            document.getElementById('edit_persons').value = booking.quantity || '';
        }, 200);
    }
    
    if (document.getElementById('edit_price')) {
        setTimeout(() => {
            document.getElementById('edit_price').value = booking.price || '0';
            calculateEditTotal();
        }, 200);
    }
    
    if (document.getElementById('edit_discount')) {
        document.getElementById('edit_discount').value = booking.discount || '';
    }
    
    if (document.getElementById('edit_detail')) {
        document.getElementById('edit_detail').value = booking.detail || '';
    }
    
    if (document.getElementById('edit_status')) {
        document.getElementById('edit_status').value = booking.payment_status || 'unpaid';
    }
    
    getCurrentUser().then(user => {
        const editStaffName = document.getElementById('edit_staffName');
        if (editStaffName && user && user.full_name) {
            editStaffName.value = user.full_name;
        }
    });
    
    if (document.getElementById('edit_driverName')) {
        document.getElementById('edit_driverName').value = booking.driver_name || '';
    }
    
    if (document.getElementById('edit_method')) {
        document.getElementById('edit_method').value = booking.payment_method || '';
    }
    
    if (document.getElementById('edit_remark')) {
        document.getElementById('edit_remark').value = booking.remark || '';
    }
    
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.style.display = 'none';
    }
}

function saveTransfer() {
    const form = document.getElementById('editForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value;
    formData.set('edit_transferType', transferType);
    
    // ✅ Get correct place values using edit mode variables
    if (transferType === 'departure') {
        if (editToInputMode === 'custom') {
            // Custom input mode
            const toInput = document.getElementById('edit_place_to_input');
            formData.set('place_to', toInput ? toInput.value : '');
        } else {
            // Dropdown mode
            const toDeparture = document.getElementById('edit_place_to_departure');
            formData.set('place_to', toDeparture ? toDeparture.value : '');
        }
    } else {
        if (editFromInputMode === 'custom') {
            // Custom input mode
            const fromInput = document.getElementById('edit_place_from_input');
            formData.set('place_from', fromInput ? fromInput.value : '');
        } else {
            // Dropdown mode
            const fromArrival = document.getElementById('edit_place_from_arrival');
            formData.set('place_from', fromArrival ? fromArrival.value : '');
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('Transfer form initializing...');
    
    setStaffNameAuto();

    const today = new Date().toISOString().split('T')[0];
    const travelDateField = document.getElementById('travel_date');
    if (travelDateField) {
        travelDateField.value = today;
    }

    updateTransferOptions();
    loadTransferData();

    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discount');
    
    if (priceInput) {
        priceInput.addEventListener('input', calculateTotal);
    }
    if (discountInput) {
        discountInput.addEventListener('input', calculateTotal);
        discountInput.placeholder = 'e.g. 100 or 20%';
    }
    
    const transferTypeRadios = document.querySelectorAll('input[name="transferType"]');
    transferTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateTransferOptions);
    });
    
    // Edit modal event listeners
    const editTransferTypeRadios = document.querySelectorAll('input[name="edit_transferType"]');
    editTransferTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateEditTransferOptions);
    });

    // Edit modal price calculation
    const editPriceInput = document.getElementById('edit_price');
    const editDiscountInput = document.getElementById('edit_discount');
    
    if (editPriceInput) {
        editPriceInput.addEventListener('input', calculateEditTotal);
    }
    if (editDiscountInput) {
        editDiscountInput.addEventListener('input', calculateEditTotal);
        editDiscountInput.placeholder = 'e.g. 100 or 20%';
    }
    
    const form = document.getElementById('luxuryTransferForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateTransferForm()) {
                return;
            }
            
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
            
            const formData = new FormData(form);
            formData.set('place_from', placeFrom);
            formData.set('place_to', placeTo);
            
            fetch('/submit_transfer_booking', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(`Booking submitted successfully! Booking Number: ${data.booking_no}`, 'success');
                    form.reset();
                    if (travelDateField) {
                        travelDateField.value = today;
                    }
                    updateTransferOptions();
                } else {
                    showAlert(`Error: ${data.message}`, 'danger');
                }
            })
            .catch(error => {
                showAlert(`An error occurred: ${error.message}`, 'danger');
            });
        });
    }
    
    console.log('Transfer form initialized successfully');
});

// ✅ Modal Functions ที่หายไป

function closeModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
    
    // Reset form และ toggle buttons เมื่อปิด modal
    clearEditFormFields();
    resetEditToggleButtons();
    convertEditToDropdownFields();
}

function closeExportModal() {
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.style.display = 'none';
    }
}

// ✅ Export Modal Functions
function exportTransfer() {
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.style.display = 'block';
    }
}

function toggleExportFields() {
    const filterType = document.querySelector('input[name="exportFilterType"]:checked')?.value;
    
    const dateFields = document.getElementById('dateRangeFields');
    const monthFields = document.getElementById('monthRangeFields');
    const yearFields = document.getElementById('yearRangeFields');
    
    // Hide all fields first
    if (dateFields) dateFields.style.display = 'none';
    if (monthFields) monthFields.style.display = 'none';
    if (yearFields) yearFields.style.display = 'none';
    
    // Show appropriate fields
    if (filterType === 'date' && dateFields) {
        dateFields.style.display = 'block';
    } else if (filterType === 'month' && monthFields) {
        monthFields.style.display = 'block';
    } else if (filterType === 'year' && yearFields) {
        yearFields.style.display = 'block';
    }
}

function submitExport() {
    const form = document.getElementById('exportForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    // Send export request
    fetch('/export_transfer_bookings', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Export failed');
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'transfer_bookings.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        closeExportModal();
        showAlert('Export completed successfully!', 'success');
    })
    .catch(error => {
        showAlert('Export failed. Please try again.', 'danger');
        console.error('Export error:', error);
    });
}

// ✅ Other missing functions
function cancelTransfer() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select bookings to cancel.', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to cancel the selected bookings?')) {
        const bookingNos = Array.from(selectedBookings).map(cb => cb.value);
        
        const formData = new FormData();
        bookingNos.forEach(bookingNo => {
            formData.append('booking_nos[]', bookingNo);
        });
        
        fetch('/cancel_transfer_bookings', {
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
            showAlert('An error occurred while canceling bookings.', 'danger');
            console.error('Cancel error:', error);
        });
    }
}

function printToExcel() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select bookings to print.', 'info');
        return;
    }
    
    const bookingNos = Array.from(selectedBookings).map(cb => cb.value);
    
    const formData = new FormData();
    bookingNos.forEach(bookingNo => {
        formData.append('booking_nos[]', bookingNo);
    });
    
    fetch('/print_transfer_bookings', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Print failed');
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'transfer_bookings_print.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        showAlert('Print file generated successfully!', 'success');
    })
    .catch(error => {
        showAlert('Print failed. Please try again.', 'danger');
        console.error('Print error:', error);
    });
}

// ✅ Modal click outside to close
document.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    const exportModal = document.getElementById('exportModal');
    
    // Close edit modal if clicking outside
    if (editModal && event.target === editModal) {
        closeModal();
    }
    
    // Close export modal if clicking outside
    if (exportModal && event.target === exportModal) {
        closeExportModal();
    }
});

// ✅ ESC key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const editModal = document.getElementById('editModal');
        const exportModal = document.getElementById('exportModal');
        
        if (editModal && editModal.style.display === 'block') {
            closeModal();
        }
        
        if (exportModal && exportModal.style.display === 'block') {
            closeExportModal();
        }
    }
});