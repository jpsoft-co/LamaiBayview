// Transfer JavaScript - รวมฟังก์ชันเดิมและใหม่
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

// ============= ฟังก์ชัน EDIT ใหม่ (จาก PASTED-1) =============
let editFromInputMode = 'dropdown';
let editToInputMode = 'dropdown';

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
        
        convertEditToDropdownFields();
        updateEditPersonOptions();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        
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
        
        convertEditToDropdownFields();
        updateEditPersonOptions();
    } else {
        dropdownContainer.style.display = 'none';
        customInput.style.display = 'block';
        dropdownBtn.classList.remove('active');
        customBtn.classList.add('active');
        customInput.focus();
        
        convertEditToInputFields();
    }
}

function updateEditTransferOptions() {
    const transferType = document.querySelector('input[name="edit_transferType"]:checked')?.value || 'departure';
    
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
    
    clearEditFormFields();
}

function updateEditPersonOptions() {
    const fromInput = document.getElementById('edit_place_from_input');
    const toInput = document.getElementById('edit_place_to_input');
    
    const isFromCustom = fromInput && fromInput.style.display !== 'none';
    const isToCustom = toInput && toInput.style.display !== 'none';
    
    if (isFromCustom || isToCustom) {
        convertEditToInputFields();
        return;
    }
    
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
    if (personsDropdown.tagName === 'INPUT') return;
    
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
    
    const priceField = document.getElementById('edit_price');
    if (priceField) {
        priceField.removeAttribute('readonly');
        priceField.placeholder = 'Enter price amount';
    }
}

function convertEditToDropdownFields() {
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
    
    resetEditToggleButtons();
    
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
                        toDeparture.value = booking.place_to;
                        toggleEditToInput('dropdown');
                        updateEditPersonOptions();
                    } else {
                        toInput.value = booking.place_to || '';
                        toggleEditToInput('custom');
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
                        fromArrival.value = booking.place_from;
                        toggleEditFromInput('dropdown');
                        updateEditPersonOptions();
                    } else {
                        fromInput.value = booking.place_from || '';
                        toggleEditFromInput('custom');
                    }
                }
            }, 100);
        }
    }
    
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
    
    if (transferType === 'departure') {
        if (editToInputMode === 'custom') {
            const toInput = document.getElementById('edit_place_to_input');
            formData.set('place_to', toInput ? toInput.value : '');
        } else {
            const toDeparture = document.getElementById('edit_place_to_departure');
            formData.set('place_to', toDeparture ? toDeparture.value : '');
        }
    } else {
        if (editFromInputMode === 'custom') {
            const fromInput = document.getElementById('edit_place_from_input');
            formData.set('place_from', fromInput ? fromInput.value : '');
        } else {
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

// ============= ฟังก์ชัน PRINT, CANCEL, EXPORT เดิม (จาก PASTED-3) =============

// PRINT FUNCTION
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

// CANCEL FUNCTION
function cancelTransfer() {
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('Please select at least one booking to cancel.', 'info');
        return;
    }
    
    showTransferCancelModal(selectedBookings);
}

function showTransferCancelModal(selectedBookings) {
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    setTimeout(() => {
        setTransferCancelNameAuto();
    }, 100);
    
    setTimeout(() => {
        const nameInput = document.getElementById('transferCancelName');
        if (nameInput) {
            nameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmTransferCancel();
                }
            });
        }
    }, 100);
}

function closeTransferCancelModal() {
    const modal = document.getElementById('transferCancelModal');
    if (modal) {
        modal.remove();
    }
}

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
    
    const selectedBookings = document.querySelectorAll('input[name="selected_bookings"]:checked');
    
    if (selectedBookings.length === 0) {
        showAlert('No bookings selected.', 'warning');
        closeTransferCancelModal();
        return;
    }
    
    closeTransferCancelModal();
    
    const formData = new FormData();
    
    selectedBookings.forEach(checkbox => {
        formData.append('selected_bookings', checkbox.value);
    });
    
    formData.append('cancelled_by', cancelName);
    
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

function setTransferCancelNameAuto() {
    const cancelNameField = document.getElementById('transferCancelName');
    
    if (cancelNameField) {
        getCurrentUser().then(user => {
            if (user && user.full_name) {
                cancelNameField.value = user.full_name;
                cancelNameField.style.borderColor = '';
            }
        });
    }
}

// EXPORT FUNCTION
function exportTransfer() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const todayFormatted = today.toISOString().split('T')[0];
    const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
    
    const exportStartDate = document.getElementById('export_start_date');
    const exportEndDate = document.getElementById('export_end_date');
    if (exportStartDate) exportStartDate.value = firstDayFormatted;
    if (exportEndDate) exportEndDate.value = todayFormatted;
    
    const currentYearMonth = today.toISOString().substr(0, 7);
    const exportStartMonth = document.getElementById('export_start_month');
    const exportEndMonth = document.getElementById('export_end_month');
    if (exportStartMonth) exportStartMonth.value = currentYearMonth;
    if (exportEndMonth) exportEndMonth.value = currentYearMonth;
    
    const currentYear = today.getFullYear();
    const exportStartYear = document.getElementById('export_start_year');
    const exportEndYear = document.getElementById('export_end_year');
    if (exportStartYear) exportStartYear.value = currentYear;
    if (exportEndYear) exportEndYear.value = currentYear;
    
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.style.display = 'block';
        toggleExportFields();
    }
}

function closeExportModal() {
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.style.display = 'none';
    }
}

function toggleExportFields() {
    const filterTypeRadio = document.querySelector('input[name="exportFilterType"]:checked');
    if (!filterTypeRadio) return;
    
    const filterType = filterTypeRadio.value;
    
    const dateRange = document.getElementById('dateRangeFields');
    const monthRange = document.getElementById('monthRangeFields');
    const yearRange = document.getElementById('yearRangeFields');
    
    if (dateRange) dateRange.style.display = 'none';
    if (monthRange) monthRange.style.display = 'none';
    if (yearRange) yearRange.style.display = 'none';
    
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
    
    showAlert('Generating Excel file...', 'info');
    
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
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        a.download = `Transfers_Export_${dateStr}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        closeExportModal();
        showAlert('Export completed successfully', 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert(`Error: ${error.message}`, 'danger');
    });
}

// ============= MODAL AND EVENT HANDLERS =============
function closeModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
    
    clearEditFormFields();
    resetEditToggleButtons();
    convertEditToDropdownFields();
}

document.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    const exportModal = document.getElementById('exportModal');
    const cancelModal = document.getElementById('transferCancelModal');
    
    if (editModal && event.target === editModal) {
        closeModal();
    }
    
    if (exportModal && event.target === exportModal) {
        closeExportModal();
    }
    
    if (cancelModal && event.target === cancelModal) {
        closeTransferCancelModal();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const editModal = document.getElementById('editModal');
        const exportModal = document.getElementById('exportModal');
        const cancelModal = document.getElementById('transferCancelModal');
        
        if (editModal && editModal.style.display === 'block') {
            closeModal();
        }
        
        if (exportModal && exportModal.style.display === 'block') {
            closeExportModal();
        }
        
        if (cancelModal) {
            closeTransferCancelModal();
        }
    }
});

// ============= DOCUMENT READY =============
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
    
    const editTransferTypeRadios = document.querySelectorAll('input[name="edit_transferType"]');
    editTransferTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateEditTransferOptions);
    });

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