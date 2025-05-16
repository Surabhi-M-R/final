// Navigation
function navigateTo(page) {
    window.location.href = page;
}

// Tab functionality
function openTab(tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Generate hash for certificate
function generateHash() {
    const hash = 'cert-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    document.getElementById('certificate-hash').value = hash;
}

// Initialize dashboard
function initDashboard() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'org-dashboard.html') {
        // Load organization dashboard
        document.getElementById('certificate-form').addEventListener('submit', function(e) {
            e.preventDefault();
            issueCertificate();
        });
        
        loadIssuedCertificates();
    } else if (currentPage === 'student-dashboard.html') {
        // Load student dashboard
        loadStudentCertificates();
        loadStudentNotifications();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});
// 3D Mouse Position Effects
document.addEventListener('DOMContentLoaded', function() {
    // Mouse position tracking for card effects
    const cards = document.querySelectorAll('.option-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const x = e.offsetX;
            const y = e.offsetY;
            const centerX = card.offsetWidth / 2;
            const centerY = card.offsetHeight / 2;
            
            // Update hover effect position
            const hoverEffect = card.querySelector('.hover-effect');
            hoverEffect.style.setProperty('--x', `${x}px`);
            hoverEffect.style.setProperty('--y', `${y}px`);
            
            // 3D tilt effect
            const angleX = (y - centerY) / 20;
            const angleY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
    
    // Animate elements on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.option-card, .dashboard-card').forEach(card => {
        observer.observe(card);
    });
});