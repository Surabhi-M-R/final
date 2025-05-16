// Organization Dashboard Functions
function loadIssuedCertificates() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const certificatesList = document.getElementById('issued-certificates-list');
    
    // Show loading state
    certificatesList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading certificates...</p></div>';
    
    database.ref('certificates').orderByChild('issuerId').equalTo(user.uid).once('value')
        .then((snapshot) => {
            certificatesList.innerHTML = '';
            
            if (!snapshot.exists()) {
                certificatesList.innerHTML = '<div class="empty-state"><i class="fas fa-certificate"></i><p>No certificates issued yet.</p></div>';
                return;
            }
            
            // Convert to array and sort by timestamp (newest first)
            const certificates = [];
            snapshot.forEach((childSnapshot) => {
                certificates.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            certificates.sort((a, b) => b.timestamp - a.timestamp);
            
            // Use template for better performance
            const template = document.getElementById('certificate-item-template');
            
            certificates.forEach((cert) => {
                // Skip revoked certificates unless showRevoked is true
                if (cert.revoked && !window.showRevoked) return;
                
                // Clone the template
                const certItem = template ? template.content.cloneNode(true).firstElementChild : document.createElement('div');
                
                if (!template) {
                    // Fallback if template is not available
                    certItem.className = 'certificate-item';
                    certItem.innerHTML = `
                        <h3>${cert.studentName}</h3>
                        <p>Issued on: ${cert.issueDate}</p>
                        <p>Certificate ID: ${cert.hash}</p>
                        <div class="certificate-actions">
                            <button class="download-btn" onclick="downloadCertificate('${cert.id}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="view-btn" onclick="viewCertificate('${cert.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="revoke-btn" onclick="revokeCertificate('${cert.id}')">
                                <i class="fas fa-ban"></i> Revoke
                            </button>
                        </div>
                    `;
                } else {
                    // Use the template
                    certItem.querySelector('.student-name').textContent = cert.studentName;
                    certItem.querySelector('.issue-date').textContent = cert.issueDate;
                    certItem.querySelector('.certificate-hash').textContent = cert.hash;
                    
                    // Set up button click handlers
                    certItem.querySelector('.download-btn').addEventListener('click', () => downloadCertificate(cert.id));
                    certItem.querySelector('.view-btn').addEventListener('click', () => viewCertificate(cert.id));
                    certItem.querySelector('.revoke-btn').addEventListener('click', () => revokeCertificate(cert.id));
                }
                
                // Add revoked class if certificate is revoked
                if (cert.revoked) {
                    certItem.classList.add('revoked');
                    
                    // Change revoke button to restore button
                    const revokeBtn = certItem.querySelector('.revoke-btn');
                    if (revokeBtn) {
                        revokeBtn.innerHTML = '<i class="fas fa-undo"></i> Restore';
                        revokeBtn.classList.remove('revoke-btn');
                        revokeBtn.classList.add('restore-btn');
                        revokeBtn.addEventListener('click', () => restoreCertificate(cert.id));
                    }
                }
                
                certificatesList.appendChild(certItem);
            });
            
            // Add toggle for showing revoked certificates
            if (!document.getElementById('toggle-revoked')) {
                const toggleContainer = document.createElement('div');
                toggleContainer.className = 'toggle-container';
                toggleContainer.innerHTML = `
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggle-revoked">
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Show revoked certificates</span>
                `;
                
                certificatesList.parentNode.insertBefore(toggleContainer, certificatesList);
                
                // Add event listener to toggle
                document.getElementById('toggle-revoked').addEventListener('change', function() {
                    window.showRevoked = this.checked;
                    loadIssuedCertificates();
                });
            }
        })
        .catch((error) => {
            console.error('Error loading certificates:', error);
            certificatesList.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i><p>Error loading certificates: ${error.message}</p></div>`;
        });
}

function downloadCertificate(certificateId) {
    database.ref('certificates/' + certificateId).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const cert = snapshot.val();
                
                // Create a temporary link to download the image
                const link = document.createElement('a');
                link.href = cert.imageUrl;
                link.download = `Certificate_${cert.hash}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        })
        .catch((error) => {
            console.error('Error downloading certificate:', error);
            alert('Error downloading certificate. Please try again.');
        });
}

function revokeCertificate(certificateId) {
    if (!confirm('Are you sure you want to revoke this certificate? This will mark it as invalid.')) {
        return;
    }
    
    database.ref('certificates/' + certificateId + '/revoked').set(true)
        .then(() => {
            // Add revocation record
            const revocationData = {
                certificateId: certificateId,
                revokedBy: firebase.auth().currentUser.uid,
                revokedAt: firebase.database.ServerValue.TIMESTAMP,
                reason: 'Manually revoked by issuer'
            };
            
            return database.ref('revocations').push(revocationData);
        })
        .then(() => {
            alert('Certificate has been revoked.');
            loadIssuedCertificates();
        })
        .catch((error) => {
            console.error('Error revoking certificate:', error);
            alert('Error revoking certificate. Please try again.');
        });
}

function restoreCertificate(certificateId) {
    if (!confirm('Are you sure you want to restore this certificate? This will mark it as valid again.')) {
        return;
    }
    
    database.ref('certificates/' + certificateId + '/revoked').set(false)
        .then(() => {
            // Add restoration record
            const restorationData = {
                certificateId: certificateId,
                restoredBy: firebase.auth().currentUser.uid,
                restoredAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            return database.ref('restorations').push(restorationData);
        })
        .then(() => {
            alert('Certificate has been restored.');
            loadIssuedCertificates();
        })
        .catch((error) => {
            console.error('Error restoring certificate:', error);
            alert('Error restoring certificate. Please try again.');
        });
}

function issueCertificate() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const issuerName = document.getElementById('issuer-name').value;
    const studentName = document.getElementById('student-name').value;
    const studentEmail = document.getElementById('student-email').value;
    const issueDate = document.getElementById('issue-date').value;
    const certificateHash = document.getElementById('certificate-hash').value;
    const certificateImage = document.getElementById('certificate-image').files[0];
    
    if (!issuerName || !studentName || !studentEmail || !issueDate || !certificateHash || !certificateImage) {
        alert('Please fill all fields and upload an image.');
        return;
    }
    
    // Upload image to Firebase Storage
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`certificates/${certificateHash}_${certificateImage.name}`);
    
    imageRef.put(certificateImage)
        .then((snapshot) => snapshot.ref.getDownloadURL())
        .then((downloadURL) => {
            // Create certificate data
            const certificateData = {
                issuerId: user.uid,
                issuerName: issuerName,
                studentName: studentName,
                studentEmail: studentEmail,
                issueDate: issueDate,
                imageUrl: downloadURL,
                hash: certificateHash,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Save to database
            const newCertRef = database.ref('certificates').push();
            return newCertRef.set(certificateData)
                .then(() => {
                    // Return both the certificate ID and data for notification
                    return { 
                        certificateId: newCertRef.key, 
                        certificateData: certificateData 
                    };
                });
        })
        .then(({ certificateId, certificateData }) => {
            // Create detailed notification for student dashboard
            createDashboardNotification(studentEmail, certificateId, certificateData);
            
            // Reset form
            document.getElementById('certificate-form').reset();
            document.getElementById('certificate-hash').value = '';
            
            // Reload certificates list
            loadIssuedCertificates();
            
            alert('Certificate issued successfully!');
        })
        .catch((error) => {
            console.error('Error issuing certificate:', error);
            alert('Failed to issue certificate. Please try again.');
        });
}

function createDashboardNotification(studentEmail, certificateId, certificateData) {
    // Find student by email
    database.ref('students').orderByChild('email').equalTo(studentEmail).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const studentId = childSnapshot.key;
                    
                    // Create comprehensive notification
                    const notificationData = {
                        type: 'new_certificate',
                        studentId: studentId,
                        studentName: certificateData.studentName,
                        issuerName: certificateData.issuerName,
                        certificateId: certificateId,
                        certificateHash: certificateData.hash,
                        issueDate: certificateData.issueDate,
                        imageUrl: certificateData.imageUrl,
                        message: `New certificate from ${certificateData.issuerName}`,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        read: false,
                        metadata: {
                            issuerId: certificateData.issuerId,
                            verificationLink: `${window.location.origin}/verify.html?cert=${certificateId}&hash=${certificateData.hash}`
                        }
                    };
                    
                    database.ref('notifications').push(notificationData);
                });
            }
        });
}
function loadStudentNotifications() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '<p class="loading">Loading notifications...</p>';
    
    // First get student ID from students node
    database.ref('students').orderByChild('email').equalTo(user.email).once('value')
        .then((studentSnapshot) => {
            if (studentSnapshot.exists()) {
                studentSnapshot.forEach((childSnapshot) => {
                    const studentId = childSnapshot.key;
                    
                    // Get notifications for this student, newest first
                    database.ref('notifications')
                        .orderByChild('studentId')
                        .equalTo(studentId)
                        .once('value')
                        .then((notificationSnapshot) => {
                            notificationsList.innerHTML = '';
                            
                            if (!notificationSnapshot.exists()) {
                                notificationsList.innerHTML = '<p class="no-notifications">No notifications yet.</p>';
                                return;
                            }
                            
                            // Convert to array and sort by timestamp
                            const notifications = [];
                            notificationSnapshot.forEach(notifChild => {
                                notifications.push({
                                    id: notifChild.key,
                                    ...notifChild.val()
                                });
                            });
                            
                            // Sort by timestamp (newest first)
                            notifications.sort((a, b) => b.timestamp - a.timestamp);
                            
                            // Display notifications
                            notifications.forEach(notif => {
                                const notifElement = createNotificationElement(notif);
                                notificationsList.appendChild(notifElement);
                            });
                        });
                });
            }
        });
}

function createNotificationElement(notification) {
    const notifElement = document.createElement('div');
    notifElement.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
    notifElement.dataset.notificationId = notification.id;
    
    let notificationHTML = `
        <div class="notification-header">
            <h3>${notification.message}</h3>
            <span class="notification-time">${formatTime(notification.timestamp)}</span>
        </div>
    `;
    
    // Special handling for certificate notifications
    if (notification.type === 'new_certificate') {
        notificationHTML += `
            <div class="certificate-notification-details">
                <p><strong>Issuer:</strong> ${notification.issuerName}</p>
                <p><strong>Issued on:</strong> ${notification.issueDate}</p>
                <div class="certificate-ids">
                    <p><strong>Certificate ID:</strong> <span class="monospace">${notification.certificateId}</span></p>
                    <p><strong>Verification Hash:</strong> <span class="monospace">${notification.certificateHash}</span></p>
                </div>
                <div class="notification-actions">
                    <button class="view-certificate-btn" 
                            onclick="viewCertificate('${notification.certificateId}')">
                        <i class="fas fa-certificate"></i> View Certificate
                    </button>
                    <button class="verify-certificate-btn" 
                            onclick="verifyCertificate('${notification.certificateId}', '${notification.certificateHash}')">
                        <i class="fas fa-shield-alt"></i> Verify
                    </button>
                </div>
            </div>
        `;
    }
    
    notifElement.innerHTML = notificationHTML;
    
    // Mark as read when clicked
    notifElement.addEventListener('click', function() {
        if (!notification.read) {
            database.ref(`notifications/${notification.id}/read`).set(true);
            notifElement.classList.add('read');
            notifElement.classList.remove('unread');
        }
    });
    
    return notifElement;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function viewCertificate(certificateId) {
    // Implement certificate viewing logic
    window.location.href = `view-certificate.html?id=${certificateId}`;
}

function verifyCertificate(certificateId, hash) {
    // Implement verification logic
    window.open(`verify.html?cert=${certificateId}&hash=${hash}`, '_blank');
}
function searchStudentCertificates() {
    const studentEmail = document.getElementById('student-search-email').value.trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!studentEmail) {
        resultsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Please enter a student email address</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching for certificates...</p>
        </div>
    `;
    
    // Search certificates by student email
    database.ref('certificates').orderByChild('studentEmail').equalTo(studentEmail).once('value')
        .then((snapshot) => {
            resultsContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-certificate"></i>
                        <p>No certificates found for ${studentEmail}</p>
                    </div>
                `;
                return;
            }
            
            // Add to verification history
            addToVerificationHistory(studentEmail, snapshot.numChildren());
            
            // Display certificates
            snapshot.forEach((certSnapshot) => {
                const cert = certSnapshot.val();
                const certElement = createCertificateElement(cert, certSnapshot.key);
                resultsContainer.appendChild(certElement);
            });
        })
        .catch((error) => {
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error searching certificates: ${error.message}</p>
                </div>
            `;
        });
}

function createCertificateElement(certificate, certificateId) {
    const certElement = document.createElement('div');
    certElement.className = 'certificate-result';
    certElement.innerHTML = `
        <div class="certificate-header">
            <h3>${certificate.issuerName}</h3>
            <span class="certificate-date">Issued: ${certificate.issueDate}</span>
        </div>
        <div class="certificate-details">
            <p><strong>Student:</strong> ${certificate.studentName}</p>
            <p><strong>Student Email:</strong> ${certificate.studentEmail}</p>
            <div class="certificate-ids">
                <p><strong>Certificate ID:</strong> <span class="monospace">${certificateId}</span></p>
                <p><strong>Verification Hash:</strong> <span class="monospace">${certificate.hash}</span></p>
            </div>
            <div class="certificate-actions">
                <button class="view-certificate-btn" 
                        onclick="viewCertificate('${certificateId}')">
                    <i class="fas fa-eye"></i> View Certificate
                </button>
                <button class="verify-certificate-btn" 
                        onclick="verifyCertificate('${certificateId}', '${certificate.hash}')">
                    <i class="fas fa-shield-alt"></i> Verify
                </button>
            </div>
        </div>
    `;
    return certElement;
}

function addToVerificationHistory(studentEmail, count) {
    const user = auth.currentUser;
    if (!user) return;
    
    const historyData = {
        employeeId: user.uid,
        employeeEmail: user.email,
        studentEmail: studentEmail,
        certificateCount: count,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    database.ref('verificationHistory').push(historyData)
        .then(() => loadVerificationHistory());
}

function loadVerificationHistory() {
    const user = auth.currentUser;
    if (!user) return;
    
    const historyContainer = document.getElementById('verification-history');
    historyContainer.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i></div>';
    
    database.ref('verificationHistory').orderByChild('employeeId').equalTo(user.uid).limitToLast(5).once('value')
        .then((snapshot) => {
            historyContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                historyContainer.innerHTML = '<div class="empty-state">No verification history yet</div>';
                return;
            }
            
            const historyItems = [];
            snapshot.forEach((childSnapshot) => {
                historyItems.push(childSnapshot.val());
            });
            
            // Sort by timestamp (newest first)
            historyItems.sort((a, b) => b.timestamp - a.timestamp);
            
            historyItems.forEach((item) => {
                const historyElement = document.createElement('div');
                historyElement.className = 'history-item';
                historyElement.innerHTML = `
                    <p><strong>Student:</strong> ${item.studentEmail}</p>
                    <p><strong>Certificates found:</strong> ${item.certificateCount}</p>
                    <p class="history-time">${formatTime(item.timestamp)}</p>
                `;
                historyContainer.appendChild(historyElement);
            });
        });
}

// Function to load student certificates
function loadStudentCertificates() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const certificatesList = document.getElementById('student-certificates-list');
    if (!certificatesList) return;
    
    certificatesList.innerHTML = '<p class="loading">Loading your certificates...</p>';
    
    // Search certificates by student email
    database.ref('certificates').orderByChild('studentEmail').equalTo(user.email).once('value')
        .then((snapshot) => {
            certificatesList.innerHTML = '';
            
            if (!snapshot.exists()) {
                certificatesList.innerHTML = '<p class="no-certificates">You have no certificates yet.</p>';
                return;
            }
            
            // Convert to array and sort by timestamp (newest first)
            const certificates = [];
            snapshot.forEach((certSnapshot) => {
                certificates.push({
                    id: certSnapshot.key,
                    ...certSnapshot.val()
                });
            });
            
            certificates.sort((a, b) => b.timestamp - a.timestamp);
            
            // Display certificates
            certificates.forEach(cert => {
                const certElement = document.createElement('div');
                certElement.className = 'certificate-card';
                certElement.innerHTML = `
                    <div class="certificate-header">
                        <h3>${cert.issuerName}</h3>
                        <span class="certificate-date">Issued: ${cert.issueDate}</span>
                    </div>
                    <div class="certificate-preview">
                        <img src="${cert.imageUrl}" alt="Certificate preview">
                    </div>
                    <div class="certificate-actions">
                        <button class="view-certificate-btn" 
                                onclick="viewCertificate('${cert.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="verify-certificate-btn" 
                                onclick="verifyCertificate('${cert.id}', '${cert.hash}')">
                            <i class="fas fa-shield-alt"></i> Verify
                        </button>
                        <button class="share-certificate-btn" 
                                onclick="shareCertificate('${cert.id}', '${cert.hash}')">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                `;
                certificatesList.appendChild(certElement);
            });
            
            // Also populate the certificate dropdown for sharing
            populateCertificateDropdown(certificates);
        })
        .catch((error) => {
            certificatesList.innerHTML = `<p class="error">Error loading certificates: ${error.message}</p>`;
        });
}

function populateCertificateDropdown(certificates) {
    const certificateSelect = document.getElementById('certificate-select');
    if (!certificateSelect) return;
    
    // Clear existing options except the first one
    while (certificateSelect.options.length > 1) {
        certificateSelect.remove(1);
    }
    
    // Add certificates to dropdown
    certificates.forEach(cert => {
        const option = document.createElement('option');
        option.value = JSON.stringify({id: cert.id, hash: cert.hash});
        option.textContent = `${cert.issuerName} - ${cert.issueDate}`;
        certificateSelect.appendChild(option);
    });
    
    // Enable the generate link button when a certificate is selected
    certificateSelect.addEventListener('change', function() {
        const generateLinkBtn = document.getElementById('generate-link-btn');
        if (generateLinkBtn) {
            generateLinkBtn.disabled = this.value === '';
        }
    });
}

function shareCertificate(certificateId, hash) {
    // Create a modal for sharing options
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Share Certificate</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Share your certificate with others:</p>
                <div class="share-buttons">
                    <button onclick="shareViaEmail('${certificateId}', '${hash}')">
                        <i class="fas fa-envelope"></i> Email
                    </button>
                    <button onclick="shareViaSocial('linkedin', '${certificateId}', '${hash}')">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </button>
                    <button onclick="shareViaSocial('twitter', '${certificateId}', '${hash}')">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                </div>
                <div class="share-link">
                    <p>Or copy this verification link:</p>
                    <div class="copy-link-container">
                        <input type="text" id="share-link-input" 
                               value="${window.location.origin}/verify.html?cert=${certificateId}&hash=${hash}" 
                               readonly>
                        <button onclick="copyToClipboard('share-link-input')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateShareableLink() {
    const certificateSelect = document.getElementById('certificate-select');
    const shareableLinkContainer = document.getElementById('shareable-link-container');
    const shareableLink = document.getElementById('shareable-link');
    
    if (certificateSelect.value) {
        try {
            const certData = JSON.parse(certificateSelect.value);
            const verificationUrl = `${window.location.origin}/verify.html?cert=${certData.id}&hash=${certData.hash}`;
            
            shareableLink.value = verificationUrl;
            shareableLinkContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating link:', error);
        }
    }
}

function copyShareableLink() {
    const shareableLink = document.getElementById('shareable-link');
    shareableLink.select();
    document.execCommand('copy');
    
    // Show copy confirmation
    const copyBtn = event.currentTarget;
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
}

function shareViaEmail(certificateId, hash) {
    const verificationUrl = `${window.location.origin}/verify.html?cert=${certificateId}&hash=${hash}`;
    const subject = 'Verify my certificate';
    const body = `Please verify my certificate using this link: ${verificationUrl}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function shareViaSocial(platform, certificateId, hash) {
    const verificationUrl = `${window.location.origin}/verify.html?cert=${certificateId}&hash=${hash}`;
    let shareUrl = '';
    
    switch (platform) {
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Verify my certificate:')}&url=${encodeURIComponent(verificationUrl)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank');
    }
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    
    // Show copy confirmation
    const copyBtn = event.currentTarget;
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
}