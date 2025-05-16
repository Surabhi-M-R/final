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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    
    // Add tab functionality for auth pages
    if (document.querySelector('.tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.textContent.toLowerCase();
                openTab(tabName);
            });
        });
    }
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

// Navigation functions
function navigateTo(page) {
    // Add transition effect
    document.querySelector('.container')?.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = page;
    }, 300);
}

function logout() {
    // Show loading state
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
        logoutBtn.disabled = true;
    }
    
    auth.signOut().then(() => {
        // Add success effect before redirect
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }).catch((error) => {
        console.error('Logout error:', error);
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            logoutBtn.disabled = false;
        }
        alert('Logout failed. Please try again.');
    });
}
// Advanced UI features and animations
// Complete initDashboard function with all dashboard types
function initDashboard() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Add common dashboard animations
    addDashboardAnimations();
    
    if (currentPage === 'org-dashboard.html') {
        // Organization dashboard initialization
        if (document.getElementById('certificate-form')) {
            document.getElementById('certificate-form').addEventListener('submit', function(e) {
                e.preventDefault();
                issueCertificate();
            });
            loadIssuedCertificates();
        }
    } else if (currentPage === 'student-dashboard.html') {
        // Student dashboard initialization
        if (document.getElementById('notifications-list')) {
            loadStudentCertificates();
            loadStudentNotifications();
        }
    } else if (currentPage === 'employee-dashboard.html') {
        // Employee dashboard initialization
        if (document.getElementById('verification-history')) {
            loadVerificationHistory();
            
            // Set up search form enter key functionality
            const emailSearch = document.getElementById('student-search-email');
            if (emailSearch) {
                emailSearch.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        searchStudentCertificates();
                    }
                });
            }
            
            const hashSearch = document.getElementById('certificate-hash-search');
            if (hashSearch) {
                hashSearch.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        searchCertificateByHash();
                    }
                });
            }
        }
    }
}

// Add animations to dashboard elements
function addDashboardAnimations() {
    // Animate dashboard cards on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.dashboard-card').forEach(card => {
        observer.observe(card);
    });
    
    // Add hover effects to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Setup drag and drop for certificate upload
function setupDragDropUpload() {
    const dropArea = document.createElement('div');
    dropArea.className = 'drop-area';
    dropArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Drag & drop certificate image here</p>
        <p class="small">or</p>
        <label for="certificate-image" class="upload-btn">Choose File</label>
    `;
    
    const fileInput = document.getElementById('certificate-image');
    if (!fileInput) return;
    
    // Insert drop area before file input
    fileInput.parentNode.insertBefore(dropArea, fileInput);
    fileInput.style.display = 'none';
    
    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            updateFileInfo(files[0].name);
        }
    }
    
    // Show selected file name
    function updateFileInfo(fileName) {
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
            <i class="fas fa-file-image"></i>
            <span>${fileName}</span>
            <button type="button" class="remove-file">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Remove existing file info
        const existingFileInfo = dropArea.parentNode.querySelector('.file-info');
        if (existingFileInfo) {
            existingFileInfo.remove();
        }
        
        dropArea.parentNode.insertBefore(fileInfo, dropArea.nextSibling);
        
        // Add remove button functionality
        fileInfo.querySelector('.remove-file').addEventListener('click', function() {
            fileInput.value = '';
            fileInfo.remove();
        });
    }
    
    // Handle normal file selection
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            updateFileInfo(this.files[0].name);
        }
    });
    
    // Make the label clickable to open file dialog
    dropArea.querySelector('.upload-btn').addEventListener('click', function() {
        fileInput.click();
    });
}

// Setup certificate templates
function setupCertificateTemplates() {
    const templateSection = document.createElement('div');
    templateSection.className = 'template-section';
    templateSection.innerHTML = `
        <h3><i class="fas fa-palette"></i> Certificate Templates</h3>
        <p>Choose a template for your certificate:</p>
        <div class="template-options">
            <div class="template-option active" data-template="classic">
                <img src="https://via.placeholder.com/100x70?text=Classic" alt="Classic template">
                <span>Classic</span>
            </div>
            <div class="template-option" data-template="modern">
                <img src="https://via.placeholder.com/100x70?text=Modern" alt="Modern template">
                <span>Modern</span>
            </div>
            <div class="template-option" data-template="professional">
                <img src="https://via.placeholder.com/100x70?text=Pro" alt="Professional template">
                <span>Professional</span>
            </div>
        </div>
        <input type="hidden" id="certificate-template" value="classic">
    `;
    
    const certificateForm = document.getElementById('certificate-form');
    if (!certificateForm) return;
    
    // Insert template section after the first input
    const firstInput = certificateForm.querySelector('input');
    if (firstInput) {
        firstInput.parentNode.insertBefore(templateSection, firstInput);
    }
    
    // Handle template selection
    const templateOptions = templateSection.querySelectorAll('.template-option');
    templateOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            templateOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to selected option
            this.classList.add('active');
            
            // Update hidden input value
            document.getElementById('certificate-template').value = this.dataset.template;
        });
    });
}

// Setup certificate sharing
function setupCertificateSharing() {
    const certificateSelect = document.getElementById('certificate-select');
    if (!certificateSelect) return;
    
    // Add QR code generation
    const generateLinkBtn = document.getElementById('generate-link-btn');
    if (generateLinkBtn) {
        generateLinkBtn.addEventListener('click', function() {
            const shareableLinkContainer = document.getElementById('shareable-link-container');
            if (shareableLinkContainer) {
                // Add QR code
                const qrCodeContainer = document.createElement('div');
                qrCodeContainer.className = 'qr-code-container';
                qrCodeContainer.innerHTML = `
                    <h4>QR Code</h4>
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(document.getElementById('shareable-link').value)}" alt="QR Code">
                    </div>
                    <p>Scan this QR code to verify the certificate</p>
                `;
                
                // Remove existing QR code
                const existingQrCode = shareableLinkContainer.querySelector('.qr-code-container');
                if (existingQrCode) {
                    existingQrCode.remove();
                }
                
                shareableLinkContainer.appendChild(qrCodeContainer);
            }
        });
    }
}

// Setup advanced search for employee dashboard
function setupAdvancedSearch() {
    const searchForm = document.querySelector('.search-form');
    if (!searchForm) return;
    
    // Add advanced search toggle
    const advancedSearchToggle = document.createElement('button');
    advancedSearchToggle.type = 'button';
    advancedSearchToggle.className = 'advanced-search-toggle';
    advancedSearchToggle.innerHTML = '<i class="fas fa-sliders-h"></i> Advanced';
    
    searchForm.appendChild(advancedSearchToggle);
    
    // Create advanced search options
    const advancedOptions = document.createElement('div');
    advancedOptions.className = 'advanced-search-options hidden';
    advancedOptions.innerHTML = `
        <div class="form-group">
            <label for="issuer-filter">Filter by Issuer</label>
            <input type="text" id="issuer-filter" placeholder="Issuer name">
        </div>
        <div class="form-group">
            <label for="date-from">Date From</label>
            <input type="date" id="date-from">
        </div>
        <div class="form-group">
            <label for="date-to">Date To</label>
            <input type="date" id="date-to">
        </div>
        <div class="form-group">
            <label for="sort-by">Sort By</label>
            <select id="sort-by">
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="issuer">Issuer Name</option>
            </select>
        </div>
    `;
    
    searchForm.parentNode.insertBefore(advancedOptions, searchForm.nextSibling);
    
    // Toggle advanced search options
    advancedSearchToggle.addEventListener('click', function() {
        advancedOptions.classList.toggle('hidden');
        this.classList.toggle('active');
    });
}
