// Notification System - Elegant Popup Notifications
// Global notification container that will hold all notifications
let notificationContainer;

// Initialize the notification system
function initNotificationSystem() {
    // Create container if it doesn't exist
    if (!document.querySelector('.notification-container')) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    } else {
        notificationContainer = document.querySelector('.notification-container');
    }
}

/**
 * Show a beautiful notification popup
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info, warning)
 * @param {number} duration - How long to show the notification in ms (default: 5000ms)
 * @param {boolean} dismissable - Whether the notification can be dismissed (default: true)
 */
function showNotification(message, type = 'info', duration = 5000, dismissable = true) {
    // Initialize the system if it hasn't been already
    if (!notificationContainer) {
        initNotificationSystem();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Determine the icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✗';
            break;
        case 'warning':
            icon = '⚠';
            break;
        case 'info':
        default:
            icon = 'ℹ';
            break;
    }
    
    // Create notification content
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <p class="notification-message">${message}</p>
        </div>
        ${dismissable ? '<button class="notification-close">×</button>' : ''}
        <div class="notification-progress">
            <div class="notification-progress-bar"></div>
        </div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animation timing
    setTimeout(() => {
        notification.classList.add('show');
        
        // Start progress bar animation
        const progressBar = notification.querySelector('.notification-progress-bar');
        progressBar.style.width = '100%';
        progressBar.style.transitionDuration = `${duration}ms`;
        
        // Wait for the transitions to apply
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 10);
    }, 10);
    
    // Add close button functionality if dismissable
    if (dismissable) {
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            removeNotification(notification);
        });
    }
    
    // Auto remove after duration
    const timeoutId = setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    // Store the timeout ID on the notification element
    notification.dataset.timeoutId = timeoutId;
    
    return notification;
}

/**
 * Remove a notification with animation
 * @param {Element} notification - The notification element to remove
 */
function removeNotification(notification) {
    // Clear the timeout
    if (notification.dataset.timeoutId) {
        clearTimeout(parseInt(notification.dataset.timeoutId));
    }
    
    // Add the remove class which triggers the exit animation
    notification.classList.add('remove');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
        
        // If this was the last notification, remove the container
        if (notificationContainer && notificationContainer.children.length === 0) {
            // Optional: remove container when empty
            // document.body.removeChild(notificationContainer);
            // notificationContainer = null;
        }
    }, 500); // Match the animation duration from CSS
}

/**
 * Show a success notification
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the notification
 */
function showSuccessNotification(message, duration = 5000) {
    return showNotification(message, 'success', duration);
}

/**
 * Show an error notification
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the notification
 */
function showErrorNotification(message, duration = 5000) {
    return showNotification(message, 'error', duration);
}

/**
 * Show an info notification
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the notification
 */
function showInfoNotification(message, duration = 5000) {
    return showNotification(message, 'info', duration);
}

/**
 * Show a warning notification
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the notification
 */
function showWarningNotification(message, duration = 5000) {
    return showNotification(message, 'warning', duration);
}

// Initialize the notification system when the DOM is loaded
document.addEventListener('DOMContentLoaded', initNotificationSystem);

/**
 * แสดงกล่องยืนยันแบบกำหนดเอง (ทดแทน confirm() ของเบราว์เซอร์)
 * @param {string} message - ข้อความที่ต้องการแสดง
 * @param {Function} confirmCallback - ฟังก์ชันที่จะทำงานเมื่อกดยืนยัน
 * @param {string} confirmText - ข้อความปุ่มยืนยัน (เริ่มต้น: "ยืนยัน")
 * @param {string} cancelText - ข้อความปุ่มยกเลิก (เริ่มต้น: "ยกเลิก")
 */
function showConfirmDialog(message, confirmCallback, confirmText = "ยืนยัน", cancelText = "ยกเลิก") {
    const modal = document.getElementById('confirmationModal');
    const messageEl = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // ตั้งค่าข้อความและปุ่ม
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    
    // แสดงกล่อง modal
    modal.style.display = 'flex';
    
    // เมื่อกดปุ่มยืนยัน
    const handleConfirm = function() {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
    };
    
    // เมื่อกดปุ่มยกเลิก
    const handleCancel = function() {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    // เพิ่ม event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    // ปิดเมื่อคลิกพื้นหลัง
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            handleCancel();
        }
    }, { once: true });
    
    // กด Escape เพื่อปิด
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            handleCancel();
        }
    }, { once: true });
}

function showAlert(message, type) {
    // ตรวจสอบว่ามี showNotification function หรือไม่
    if (typeof showNotification === 'function') {
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
        
        showNotification(message, notificationType, 5000, true);
    } else {
        // Fallback to browser alert
        alert(message);
        console.error('showNotification function not found');
    }
}