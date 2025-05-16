// Firebase configuration (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyBymvT0jI1SJoPy1xOWxiiKGV3OxnnCn2o",
    authDomain: "edu-chain-2e94c.firebaseapp.com",
    databaseURL: "https://edu-chain-2e94c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "edu-chain-2e94c",
    storageBucket: "edu-chain-2e94c.firebasestorage.app",
    messagingSenderId: "694860359043",
    appId: "1:694860359043:android:b339ed654690fff69e42b6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Organization Authentication
function orgSignup() {
    const orgName = document.getElementById('org-name').value;
    const email = document.getElementById('org-email').value;
    const password = document.getElementById('org-password').value;
    const confirmPassword = document.getElementById('org-confirm-password').value;
    
    if (password !== confirmPassword) {
        document.getElementById('org-auth-message').textContent = "Passwords don't match!";
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Save additional org info to database
            database.ref('organizations/' + user.uid).set({
                name: orgName,
                email: email
            }).then(() => {
                window.location.href = 'org-dashboard.html';
            });
        })
        .catch((error) => {
            document.getElementById('org-auth-message').textContent = error.message;
        });
}

function orgLogin() {
    const email = document.getElementById('org-email-login').value;
    const password = document.getElementById('org-password-login').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Verify this is an organization account
            const user = userCredential.user;
            database.ref('organizations/' + user.uid).once('value')
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        window.location.href = 'org-dashboard.html';
                    } else {
                        document.getElementById('org-auth-message').textContent = "This is not an organization account.";
                        auth.signOut();
                    }
                });
        })
        .catch((error) => {
            document.getElementById('org-auth-message').textContent = error.message;
        });
}

// Student Authentication
function studentSignup() {
    const studentName = document.getElementById('student-name').value;
    const email = document.getElementById('student-email').value;
    const password = document.getElementById('student-password').value;
    const confirmPassword = document.getElementById('student-confirm-password').value;
    
    if (password !== confirmPassword) {
        document.getElementById('student-auth-message').textContent = "Passwords don't match!";
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Save additional student info to database
            database.ref('students/' + user.uid).set({
                name: studentName,
                email: email
            }).then(() => {
                window.location.href = 'student-dashboard.html';
            });
        })
        .catch((error) => {
            document.getElementById('student-auth-message').textContent = error.message;
        });
}

function studentLogin() {
    const email = document.getElementById('student-email-login').value;
    const password = document.getElementById('student-password-login').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'student-dashboard.html';
        })
        .catch((error) => {
            document.getElementById('student-auth-message').textContent = error.message;
        });
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Check auth state and redirect
// Initialize auth check
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const currentPage = window.location.pathname.split('/').pop();
            
            if (currentPage === 'index.html' || currentPage === '') {
                // Check user type and redirect appropriately
                database.ref('organizations/' + user.uid).once('value')
                    .then((orgSnapshot) => {
                        if (orgSnapshot.exists()) {
                            window.location.href = 'org-dashboard.html';
                        } else {
                            database.ref('employees/' + user.uid).once('value')
                                .then((empSnapshot) => {
                                    if (empSnapshot.exists()) {
                                        window.location.href = 'employee-dashboard.html';
                                    } else {
                                        database.ref('students/' + user.uid).once('value')
                                            .then((studentSnapshot) => {
                                                if (studentSnapshot.exists()) {
                                                    window.location.href = 'student-dashboard.html';
                                                }
                                            });
                                    }
                                });
                        }
                    });
            }
        } else {
            // If not logged in and trying to access dashboard, redirect to home
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'org-dashboard.html' || 
                currentPage === 'student-dashboard.html' ||
                currentPage === 'employee-dashboard.html' ||
                currentPage === 'employee.html') {
                window.location.href = 'index.html';
            }
        }
    });
}

// Initialize auth check
checkAuthState();
// Employee Authentication
function employeeSignup() {
    const employeeName = document.getElementById('employee-name').value;
    const email = document.getElementById('employee-email').value;
    const password = document.getElementById('employee-password').value;
    const confirmPassword = document.getElementById('employee-confirm-password').value;
    
    if (password !== confirmPassword) {
        document.getElementById('employee-auth-message').textContent = "Passwords don't match!";
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Save additional employee info to database
            database.ref('employees/' + user.uid).set({
                name: employeeName,
                email: email
            }).then(() => {
                window.location.href = 'employee-dashboard.html';
            });
        })
        .catch((error) => {
            document.getElementById('employee-auth-message').textContent = error.message;
        });
}

function employeeLogin() {
    const email = document.getElementById('employee-email-login').value;
    const password = document.getElementById('employee-password-login').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'employee-dashboard.html';
        })
        .catch((error) => {
            document.getElementById('employee-auth-message').textContent = error.message;
        });
}

// Employee Authentication functions are defined above
