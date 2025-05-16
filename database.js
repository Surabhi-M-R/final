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
    
    // Upload image to Firebase Storage (if you set it up)
    // For simplicity, we'll just store the image name
    const imageName = certificateImage.name;
    
    // Create certificate data
    const certificateData = {
        issuerId: user.uid,
        issuerName: issuerName,
        studentName: studentName,
        studentEmail: studentEmail,
        issueDate: issueDate,
        imageName: imageName,
        hash: certificateHash,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Save to database
    const newCertRef = database.ref('certificates').push();
    newCertRef.set(certificateData)
        .then(() => {
            // Create notification for student
            createNotification(studentEmail, studentName, issuerName, newCertRef.key);
            
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

function createNotification(studentEmail, studentName, issuerName, certificateId) {
    // Find student by email
    database.ref('students').orderByChild('email').equalTo(studentEmail).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const studentId = childSnapshot.key;
                    
                    // Create notification
                    const notificationData = {
                        studentId: studentId,
                        studentName: studentName,
                        issuerName: issuerName,
                        certificateId: certificateId,
                        message: `You have received a new certificate from ${issuerName}`,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        read: false
                    };
                    
                    database.ref('notifications').push(notificationData);
                });
            }
        });
}

// Student Dashboard Functions
function loadStudentCertificates() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const certificatesList = document.getElementById('certificates-list');
    certificatesList.innerHTML = '<p>Loading certificates...</p>';
    
    database.ref('certificates').orderByChild('studentEmail').equalTo(user.email).once('value')
        .then((snapshot) => {
            certificatesList.innerHTML = '';
            
            if (!snapshot.exists()) {
                certificatesList.innerHTML = '<p>No certificates found.</p>';
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const cert = childSnapshot.val();
                const certItem = document.createElement('div');
                certItem.className = 'certificate-item';
                certItem.innerHTML = `
                    <h3>${cert.issuerName}</h3>
                    <p>Issued on: ${cert.issueDate}</p>
                    <p>Certificate ID: ${cert.hash}</p>
                    <button class="download-btn" onclick="downloadCertificate('${childSnapshot.key}')">Download</button>
                `;
                certificatesList.appendChild(certItem);
            });
        });
}

function loadStudentNotifications() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '<p>Loading notifications...</p>';
    
    // First get student ID from students node
    database.ref('students').orderByChild('email').equalTo(user.email).once('value')
        .then((studentSnapshot) => {
            if (studentSnapshot.exists()) {
                studentSnapshot.forEach((childSnapshot) => {
                    const studentId = childSnapshot.key;
                    
                    // Now get notifications for this student
                    database.ref('notifications').orderByChild('studentId').equalTo(studentId).once('value')
                        .then((notificationSnapshot) => {
                            notificationsList.innerHTML = '';
                            
                            if (!notificationSnapshot.exists()) {
                                notificationsList.innerHTML = '<p>No notifications.</p>';
                                return;
                            }
                            
                            notificationSnapshot.forEach((notifChildSnapshot) => {
                                const notif = notifChildSnapshot.val();
                                const notifItem = document.createElement('div');
                                notifItem.className = 'notification-item';
                                notifItem.innerHTML = `
                                    <h3>${notif.message}</h3>
                                    <p>${new Date(notif.timestamp).toLocaleString()}</p>
                                `;
                                notificationsList.appendChild(notifItem);
                            });
                        });
                });
            }
        });
}

function downloadCertificate(certificateId) {
    // In a real app, you would generate or retrieve the actual certificate file
    // For this example, we'll just show an alert
    alert(`Downloading certificate with ID: ${certificateId}`);
    
    // You would typically:
    // 1. Get certificate data from database
    // 2. Generate PDF or retrieve stored file
    // 3. Provide download link to user
}