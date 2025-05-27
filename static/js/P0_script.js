document.addEventListener('DOMContentLoaded', function() {
    // Enhance hover effect
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const btn = card.querySelector('.card-btn');
        const img = card.querySelector('.card-image img');
        
        btn.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.15)';
            img.style.filter = 'brightness(1.2) contrast(1.2)';
        });
        
        btn.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1.1)';
            img.style.filter = 'brightness(1.1) contrast(1.1)';
        });
    });
    
    // Loading animation handling
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    const cardButtons = document.querySelectorAll('.card-btn');
    
    cardButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetUrl = this.getAttribute('data-href');
            
            // Show loading overlay
            loadingOverlay.classList.add('active');
            
            // Progress bar animation
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                loadingProgressBar.style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(progressInterval);

                    // Hide overlay before navigation (optional)
                    loadingOverlay.classList.remove('active');
                    // Navigate to the target page after a short delay
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 300);
                }
            }, 100); // This will take approximately 2 seconds to complete
        });
    });
});