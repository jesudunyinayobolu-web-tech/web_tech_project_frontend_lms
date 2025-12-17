
// API Base URL - Update this with your Render backend URL after deployment
const API_URL = 'https://web-tech-project-backend-lms.onrender.com/api';
window.API_URL = API_URL; // Make it globally accessible
// Check if user is already logged in
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    const token = localStorage.getItem('token');
    if (token) {
        checkTokenAndRedirect();
    }
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect based on role
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'student-dashboard.html';
                }
            } else {
                showError(errorMessage, data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(errorMessage, 'Unable to connect to server. Please try again.');
        }
    });
}

// Register Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showError(errorMessage, 'Passwords do not match');
            return;
        }
        
        // Validate password length
        if (password.length < 6) {
            showError(errorMessage, 'Password must be at least 6 characters');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, confirmPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess(successMessage, 'Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showError(errorMessage, data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError(errorMessage, 'Unable to connect to server. Please try again.');
 `  `       }
    });
}

// Helper Functions
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

async function checkTokenAndRedirect() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'student-dashboard.html';
        }
    }
}

// Export for use in other files
window.authUtils = {
    getToken: () => localStorage.getItem('token'),
    getUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },
    isAuthenticated: () => !!localStorage.getItem('token')
};