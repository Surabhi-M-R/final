// Organization Dashboard Functions
function loadIssuedCertificates() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const certificatesList = document.getElementById('issued-certificates-list');
    certificatesList.innerHTML = '<p>Loading certificates...</p>';
    
    database.ref('certificates').orderByChild('issuerId').equalTo(user.uid).once('value')
        .then((snapshot) => {
            certificatesList.innerHTML = '';
            
            if (!snapshot.exists()) {
                certificatesList.innerHTML = '<p>No certificates issued yet.</p>';
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const cert = childSnapshot.val();
                const certItem = document.createElement('div');
                certItem.className = 'certificate-item';
                certItem.innerHTML = `
                    <h3>${cert.studentName}</h3>
                    <p>Issued on: ${cert.issueDate}</p>
                    <p>Certificate ID: ${cert.hash}</p>
                    <button class="download-btn" onclick="downloadCertificate('${childSnapshot.key}')">Download</button>
                `;
                certificatesList.appendChild(certItem);
            });
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
    const imageRef = storageRef.child(certificates/${certificateHash}_${certificateImage.name});
    
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
                        message: New certificate from ${certificateData.issuerName},
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        read: false,
                        metadata: {
                            issuerId: certificateData.issuerId,
                            verificationLink: https://your-app-url.com/verify.html?cert=${certificateId}&hash=${certificateData.hash}
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
    notifElement.className = notification-item ${notification.read ? 'read' : 'unread'};
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
            database.ref(notifications/${notification.id}/read).set(true);
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
    window.location.href = view-certificate.html?id=${certificateId};
}

function verifyCertificate(certificateId, hash) {
    // Implement verification logic
    window.open(verify.html?cert=${certificateId}&hash=${hash}, '_blank');
}
