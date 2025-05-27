
// สำหรับ loading system (ใช้ได้ทุกหน้า)
document.addEventListener('DOMContentLoaded', function() {
    // สร้าง loading overlay ถ้ายังไม่มี
    if (!document.getElementById('loadingOverlay')) {
        const loadingHTML = `
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-message" id="loadingMessage">Preparing your exclusive experience...</div>
                    <div class="loading-progress">
                        <div class="loading-progress-bar" id="loadingProgressBar"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    // Loading animation handling
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    const loadingMessage = document.getElementById('loadingMessage'); // เพิ่มตัวแปรนี้
    const cardButtons = document.querySelectorAll('.card-btn, .loading-btn, [data-loading]');
    
    cardButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetUrl = this.getAttribute('data-href') || 
                             this.getAttribute('href') || 
                             this.dataset.target;
            
            // ดึงข้อความจาก data-message หรือใช้ข้อความเริ่มต้น
            const customMessage = this.getAttribute('data-message') || 'Preparing your exclusive experience...';
            
            if (targetUrl && targetUrl !== '#' && targetUrl !== 'javascript:void(0);') {
                // อัพเดทข้อความใน loading overlay
                loadingMessage.textContent = customMessage;
                
                // Show loading overlay
                loadingOverlay.classList.add('active');
                
                // Reset progress bar
                loadingProgressBar.style.width = '0%';
                
                // Progress bar animation
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 5;
                    loadingProgressBar.style.width = progress + '%';
                    
                    if (progress >= 100) {
                        clearInterval(progressInterval);

                        // Hide overlay before navigation
                        loadingOverlay.classList.remove('active');
                        // Navigate to the target page after a short delay
                        setTimeout(() => {
                            window.location.href = targetUrl;
                        }, 300);
                    }
                }, 100);
            }
        });
    });
});