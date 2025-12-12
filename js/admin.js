
// Wrap in IIFE to avoid API_URL declaration conflicts with auth.js
(function() {
    'use strict';
    
    // API Base URL - use global from auth.js or fallback
    // Inside this IIFE scope, we can safely declare const API_URL
    
    const API_URL = window.API_URL || 'http://localhost:5000/api';

// Declare functions early so they're available
let currentEditingBook = null;

// Open book modal for add/edit - declare early
function openBookModal(book = null) {
    console.log('openBookModal called', book);
    const modal = document.getElementById('bookModal');
    const form = document.getElementById('bookForm');
    const title = document.getElementById('modalTitle');
    
    if (!modal) {
        console.error('Modal element (bookModal) not found!');
        alert('Error: Modal not found. Please refresh the page.');
        return;
    }
    
    if (!form) {
        console.error('Form element (bookForm) not found!');
        return;
    }
    
    if (!title) {
        console.error('Title element (modalTitle) not found!');
        return;
    }
    
    if (book) {
        title.textContent = 'Edit Book';
        document.getElementById('bookId').value = book.id;
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookISBN').value = book.isbn;
        document.getElementById('bookCategory').value = book.category || 'fiction';
        document.getElementById('totalCopies').value = book.total_copies;
        currentEditingBook = book;
    } else {
        title.textContent = 'Add New Book';
        form.reset();
        document.getElementById('bookId').value = '';
        currentEditingBook = null;
    }
    
    modal.classList.add('active');
    console.log('✅ Modal opened, class added:', modal.classList.toString());
    console.log('Modal display style:', window.getComputedStyle(modal).display);
    
    // Force display if needed
    if (!modal.classList.contains('active')) {
        modal.style.display = 'flex';
        console.log('Forced modal display');
    }
}

// Make openBookModal available immediately
window.openBookModal = openBookModal;

// Wait for authUtils to be available, then check authentication and admin role
function checkAuth() {
    // Wait for authUtils if not available yet
    if (!window.authUtils) {
        console.log('Waiting for authUtils...');
        return false; // Will retry
    }
    
    // Check if token exists in localStorage directly first (more reliable)
    const tokenFromStorage = localStorage.getItem('token');
    if (!tokenFromStorage) {
        console.log('No token found in localStorage');
        // Don't redirect immediately - might be a timing issue
        return false;
    }
    
    // Verify authUtils can also get it
    const token = window.authUtils.getToken();
    if (!token) {
        console.log('authUtils.getToken() returned null');
        return false;
    }
    
    if (!window.authUtils.isAuthenticated()) {
        console.log('isAuthenticated() returned false');
        return false;
    }

    const user = window.authUtils.getUser();
    if (!user) {
        console.log('getUser() returned null');
        return false;
    }
    
    if (user.role !== 'admin') {
        console.log('User is not admin, redirecting to student dashboard...');
        window.location.href = 'student-dashboard.html';
        return false;
    }
    
    console.log('✅ Authentication check passed for admin:', user.email);
    return true;
}

// Wait for both DOM and authUtils to be ready
function initializeAdmin() {
    console.log('initializeAdmin called, readyState:', document.readyState);
    
    // Wait for auth.js to load and DOM to be ready
    function tryInitialize() {
        console.log('Trying to initialize...');
        console.log('authUtils available?', !!window.authUtils);
        console.log('Token exists?', !!localStorage.getItem('token'));
        console.log('DOM ready?', document.readyState);
        
        // Always set up event listeners first (they need to work regardless of auth)
        console.log('Setting up event listeners...');
        setupEventListeners();
        
        // Then check auth and load data
        const authResult = checkAuth();
        if (!authResult) {
            // If authUtils wasn't available, retry after a short delay
            if (!window.authUtils) {
                console.log('authUtils not ready, retrying in 100ms...');
                setTimeout(tryInitialize, 100);
            } else {
                // authUtils is available but check failed - don't redirect immediately
                // Give it a moment in case token is still being set
                const token = localStorage.getItem('token');
                console.log('Authentication check failed. Token exists?', !!token);
                if (!token) {
                    console.log('No token found, redirecting to login...');
                    // Small delay before redirect to avoid race condition
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    console.log('Token exists but auth check failed - might be timing issue, retrying...');
                    setTimeout(tryInitialize, 200);
                }
            }
            return;
        }
        
        console.log('Authentication passed, loading data...');
        loadUserInfo();
        // Delay loadBooks slightly to ensure everything is ready
        setTimeout(() => {
            loadBooks();
        }, 100);
    }
    
    // Wait for DOM and scripts to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(tryInitialize, 200); // Give auth.js more time to execute
        });
    } else {
        setTimeout(tryInitialize, 200); // Give auth.js more time to execute
    }
}

// Start initialization
initializeAdmin();

// Page initialization is now handled by initializeAdmin() function above

// Load user information
function loadUserInfo() {
    const user = window.authUtils.getUser();
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) {
        userNameEl.textContent = user.name || 'Admin';
    }
    if (userEmailEl) {
        userEmailEl.textContent = `@${(user.email || 'administrator').split('@')[0]}`;
    }
    if (userAvatarEl) {
        const initial = (user.name || 'A').charAt(0).toUpperCase();
        userAvatarEl.querySelector('span').textContent = initial;
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('=== Setting up event listeners ===');
    console.log('Document ready state:', document.readyState);
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    console.log('Logout button element:', logoutBtn);
    if (logoutBtn) {
        // Remove existing listeners by cloning
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked!');
            if (window.authUtils && window.authUtils.logout) {
                if (confirm('Are you sure you want to logout?')) {
                    window.authUtils.logout();
                }
            } else {
                console.error('authUtils.logout not available');
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
        console.log('✅ Logout button listener attached');
    } else {
        console.error('❌ Logout button not found!');
    }
    
    // Add book button
    const addBookBtn = document.getElementById('addBookBtn');
    console.log('Add book button element:', addBookBtn);
    if (addBookBtn) {
        // Remove existing listeners by cloning
        const newAddBookBtn = addBookBtn.cloneNode(true);
        addBookBtn.parentNode.replaceChild(newAddBookBtn, addBookBtn);
        
        // Attach click handler
        newAddBookBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Add book button clicked!', e);
            try {
                openBookModal();
            } catch (error) {
                console.error('❌ Error opening modal:', error);
                alert('Error opening modal: ' + error.message);
            }
        });
        
        console.log('✅ Add book button listener attached successfully', newAddBookBtn);
    } else {
        console.error('❌ Add book button (addBookBtn) not found!');
        // Try to find it by class or text content as fallback
        setTimeout(() => {
            const buttons = document.querySelectorAll('button');
            console.log('Found', buttons.length, 'buttons on page');
            buttons.forEach(btn => {
                if (btn.textContent && (btn.textContent.includes('Add New Book') || btn.textContent.includes('Add'))) {
                    console.log('Found button by text:', btn);
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('Fallback button clicked!');
                        openBookModal();
                    });
                }
            });
        }, 100);
    }
    
    // Close modal
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    if (closeModal) {
        closeModal.addEventListener('click', closeBookModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeBookModal);
    }
    
    // Book form submit
    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
        bookForm.addEventListener('submit', handleBookSubmit);
    }
    
    // Search
    const adminSearch = document.getElementById('adminSearch');
    if (adminSearch) {
        adminSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const category = document.getElementById('categoryFilter')?.value || '';
            searchAndFilterBooks(searchTerm, category);
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const category = e.target.value;
            const searchTerm = document.getElementById('adminSearch')?.value.trim() || '';
            searchAndFilterBooks(searchTerm, category);
        });
    }
    
    // Close modal when clicking outside
    const bookModal = document.getElementById('bookModal');
    if (bookModal) {
        bookModal.addEventListener('click', (e) => {
            if (e.target.id === 'bookModal') {
                closeBookModal();
            }
        });
    }
}

// Combined search and filter function
async function searchAndFilterBooks(searchTerm, category) {
    const token = window.authUtils.getToken();
    let url = `${API_URL}/books?`;
    const params = [];
    
    if (searchTerm && searchTerm.length >= 1) {
        params.push(`search=${encodeURIComponent(searchTerm)}`);
    }
    
    if (category) {
        params.push(`category=${encodeURIComponent(category)}`);
    }
    
    url += params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Search/Filter failed');
        
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Search/Filter error:', error);
        const tbody = document.getElementById('booksTableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Error loading books. Please try again.</td></tr>';
    }
}

// Load all books
async function loadBooks() {
    if (!window.authUtils || !window.authUtils.isAuthenticated()) {
        console.log('Skipping loadBooks - not authenticated');
        return;
    }
    
    const token = window.authUtils.getToken();
    if (!token) {
        console.log('Skipping loadBooks - no token');
        return;
    }
    
    const tbody = document.getElementById('booksTableBody');
    if (!tbody) {
        console.log('Skipping loadBooks - table body not found');
        return;
    }
    
    try {
        console.log('Loading books from API...');
        const response = await fetch(`${API_URL}/books`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Books API response status:', response.status);
        
        if (response.status === 401 || response.status === 403) {
            // Only show alert if we're sure it's an auth error (not a server error)
            const errorData = await response.json().catch(() => ({}));
            console.error('Authentication error:', errorData);
            
            // Check if token exists before assuming session expired
            if (token && window.authUtils.isAuthenticated()) {
                // Token exists but API rejected it - might be server issue
                console.warn('Token exists but API rejected it. Check backend connection.');
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Authentication error. Please refresh the page or login again.</td></tr>';
            } else {
                alert('Your session has expired. Please login again.');
                window.authUtils.logout();
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch books: ${response.status}`);
        }
        
        const books = await response.json();
        console.log('Books loaded successfully:', books.length);
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        // Don't show alert for network errors - just show error in table
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Unable to connect to server. Please check if backend is running.</td></tr>';
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Unable to load books. Please try again.</td></tr>';
        }
    }
}

// Display books in table
function displayBooks(books) {
    const tbody = document.getElementById('booksTableBody');
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No books found</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => {
        const available = book.available_copies || 0;
        const total = book.total_copies || 0;
        const isAvailable = available > 0;
        const statusText = isAvailable ? `Available (${available}/${total})` : `Unavailable (0/${total})`;
        const statusClass = isAvailable ? 'available' : 'unavailable';
        
        return `
        <tr>
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>
                <span class="availability-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <button class="btn-edit" onclick="editBook(${book.id})">Edit</button>
                <button class="btn-delete" onclick="deleteBook(${book.id})">Delete</button>
            </td>
        </tr>
        `;
    }).join('');
}

// Load borrow requests
async function loadBorrows() {
    const token = window.authUtils.getToken();
    const tbody = document.getElementById('borrowsTableBody');
    
    try {
        const response = await fetch(`${API_URL}/borrow`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch borrows');
        
        const borrows = await response.json();
        displayBorrows(borrows);
    } catch (error) {
        console.error('Error loading borrows:', error);
        tbody.innerHTML = '<tr><td colspan="6">Unable to load borrow requests.</td></tr>';
    }
}

// Display borrows
function displayBorrows(borrows) {
    const tbody = document.getElementById('borrowsTableBody');
    
    if (borrows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No borrow records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = borrows.map(borrow => `
        <tr>
            <td>${borrow.user_name}</td>
            <td>${borrow.book_title}</td>
            <td>${formatDate(borrow.borrow_date)}</td>
            <td>${formatDate(borrow.due_date)}</td>
            <td>
                <span class="status-badge status-${borrow.status}">
                    ${borrow.status}
                </span>
            </td>
            <td>
                ${borrow.status === 'borrowed' ? 
                    `<button class="btn-edit" onclick="markReturned(${borrow.id})">Mark Returned</button>` :
                    'Returned'
                }
            </td>
        </tr>
    `).join('');
}

// Load overdue books
async function loadOverdueBooks() {
    const token = window.authUtils.getToken();
    const tbody = document.getElementById('overdueTableBody');
    
    try {
        const response = await fetch(`${API_URL}/borrow/overdue`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch overdue books');
        
        const overdue = await response.json();
        displayOverdue(overdue);
    } catch (error) {
        console.error('Error loading overdue books:', error);
        tbody.innerHTML = '<tr><td colspan="5">Unable to load overdue books.</td></tr>';
    }
}

// Display overdue books
function displayOverdue(overdueBooks) {
    const tbody = document.getElementById('overdueTableBody');
    
    if (overdueBooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No overdue books! 🎉</td></tr>';
        return;
    }
    
    tbody.innerHTML = overdueBooks.map(borrow => {
        const daysOverdue = calculateDaysOverdue(borrow.due_date);
        return `
            <tr>
                <td>${borrow.user_name}</td>
                <td>${borrow.book_title}</td>
                <td>${formatDate(borrow.due_date)}</td>
                <td style="color: var(--red); font-weight: 600;">${daysOverdue} days</td>
                <td>
                    <button class="btn-edit" onclick="sendReminder(${borrow.id})">Send Reminder</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load students
async function loadStudents() {
    const token = window.authUtils.getToken();
    const tbody = document.getElementById('studentsTableBody');
    
    try {
        const response = await fetch(`${API_URL}/auth/students`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch students');
        
        const students = await response.json();
        displayStudents(students);
    } catch (error) {
        console.error('Error loading students:', error);
        tbody.innerHTML = '<tr><td colspan="4">Unable to load students.</td></tr>';
    }
}

// Display students
function displayStudents(students) {
    const tbody = document.getElementById('studentsTableBody');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No students registered</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.books_count || 0}</td>
            <td>${formatDate(student.created_at)}</td>
        </tr>
    `).join('');
}

// openBookModal is already defined at the top of the file

// Close book modal
function closeBookModal() {
    const modal = document.getElementById('bookModal');
    modal.classList.remove('active');
    document.getElementById('bookForm').reset();
    currentEditingBook = null;
}

// Handle book form submission
async function handleBookSubmit(e) {
    e.preventDefault();
    
    // Check if authUtils is available and get token
    if (!window.authUtils || !window.authUtils.isAuthenticated()) {
        alert('Your session has expired. Please login again.');
        window.location.href = 'index.html';
        return;
    }
    
    const token = window.authUtils.getToken();
    if (!token) {
        alert('Authentication token not found. Please login again.');
        window.location.href = 'index.html';
        return;
    }
    
    const bookId = document.getElementById('bookId').value;
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const isbn = document.getElementById('bookISBN').value.trim();
    const category = document.getElementById('bookCategory').value;
    const totalCopies = parseInt(document.getElementById('totalCopies').value);
    
    // Validate required fields
    if (!title || !author || !isbn) {
        alert('Please fill in all required fields (Title, Author, ISBN)');
        return;
    }
    
    if (isNaN(totalCopies) || totalCopies < 1) {
        alert('Total copies must be at least 1');
        return;
    }
    
    const bookData = {
        title,
        author,
        isbn,
        category,
        total_copies: totalCopies
    };
    
    try {
        const url = bookId ? `${API_URL}/books/${bookId}` : `${API_URL}/books`;
        const method = bookId ? 'PUT' : 'POST';
        
        console.log('Submitting book:', { url, method, bookData });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookData)
        });
        
        const data = await response.json();
        console.log('Response:', { status: response.status, data });
        
        if (response.ok) {
            alert(bookId ? 'Book updated successfully!' : 'Book added successfully!');
            closeBookModal();
            loadBooks();
        } else {
            // Handle authentication errors specifically
            if (response.status === 401 || response.status === 403) {
                alert('Your session has expired. Please login again.');
                window.authUtils.logout();
            } else {
                alert(data.message || data.errors?.[0]?.msg || 'Operation failed');
            }
        }
    } catch (error) {
        console.error('Error saving book:', error);
        alert('Unable to save book. Please check your connection and try again.');
    }
}

// Edit book
async function editBook(bookId) {
    const token = window.authUtils.getToken();
    
    try {
        const response = await fetch(`${API_URL}/books/${bookId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch book');
        
        const book = await response.json();
        openBookModal(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        alert('Unable to load book details.');
    }
}

// Delete book
async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        return;
    }
    
    const token = window.authUtils.getToken();
    
    try {
        const response = await fetch(`${API_URL}/books/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Book deleted successfully!');
            loadBooks();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Unable to delete book. Please try again.');
    }
}

// Mark borrow as returned
async function markReturned(borrowId) {
    const token = window.authUtils.getToken();
    
    try {
        const response = await fetch(`${API_URL}/borrow/${borrowId}/return`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Book marked as returned!');
            loadBorrows();
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error('Error marking returned:', error);
        alert('Unable to update status. Please try again.');
    }
}

// Send reminder
function sendReminder(borrowId) {
    alert('Reminder feature coming soon! Email notification would be sent to the student.');
}


// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateDaysOverdue(dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

    // Make functions globally available (must be inside IIFE)
    window.editBook = editBook;
    window.deleteBook = deleteBook;
    window.markReturned = markReturned;
    window.sendReminder = sendReminder;
    window.openBookModal = openBookModal;
})(); // Close IIFE