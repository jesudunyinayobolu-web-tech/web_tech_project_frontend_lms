// Wait for authUtils to be available before checking authentication
function checkStudentAuth() {
    // Wait for auth.js to load
    if (!window.authUtils) {
        console.log('Waiting for authUtils...');
        setTimeout(checkStudentAuth, 50);
        return;
    }
    
    // Check if authenticated
    if (!window.authUtils.isAuthenticated()) {
        console.log('Not authenticated, redirecting to login...');
        window.location.href = 'index.html';
        return;
    }

    const user = window.authUtils.getUser();
    if (!user) {
        console.log('No user data, redirecting to login...');
        window.location.href = 'index.html';
        return;
    }

    // Redirect admin users to admin dashboard
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    // User is authenticated student, proceed with initialization
    initializeStudent();
}

function initializeStudent() {
    loadUserInfo();
    loadAllBooks();
    loadBorrowedBooks();
    setupEventListeners();
}

// Start authentication check when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkStudentAuth);
} else {
    checkStudentAuth();
}

// Load user information
function loadUserInfo() {
    const user = window.authUtils.getUser();
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl && user) {
        userNameEl.textContent = user.name || 'Student';
    }
    if (userEmailEl && user) {
        userEmailEl.textContent = `@${(user.email || 'student').split('@')[0]}`;
    }
    
    // Set avatar initials
    if (userAvatarEl && user) {
        const initial = (user.name || 'S').charAt(0).toUpperCase();
        const span = userAvatarEl.querySelector('span');
        if (span) {
            span.textContent = initial;
        }
    }
}

// Load all books
async function loadAllBooks() {
    const token = window.authUtils.getToken();
    const tbody = document.getElementById('booksTableBody');
    
    try {
        const response = await fetch(`${API_URL}/books`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch books');
        
        const books = await response.json();
        displayAllBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Unable to load books. Please try again later.</td></tr>';
    }
}

// Display all books in table
function displayAllBooks(books) {
    const tbody = document.getElementById('booksTableBody');
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No books available at the moment.</td></tr>';
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
            <td>${book.category || 'General'}</td>
            <td>
                <span class="availability-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <button class="btn-read" onclick="showBookDetails(${book.id})" style="padding: 6px 16px;">
                    View Details
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Load borrowed books
async function loadBorrowedBooks() {
    const token = window.authUtils.getToken();
    const user = window.authUtils.getUser();
    const borrowedBooksContainer = document.getElementById('borrowedBooks');
    
    try {
        const response = await fetch(`${API_URL}/borrow/user/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch borrowed books');
        
        const borrows = await response.json();
        displayBorrowedBooks(borrows);
    } catch (error) {
        console.error('Error loading borrowed books:', error);
        borrowedBooksContainer.innerHTML = '<p>Unable to load your books. Please try again later.</p>';
    }
}

// Display borrowed books
function displayBorrowedBooks(borrows) {
    const container = document.getElementById('borrowedBooks');
    
    if (borrows.length === 0) {
        container.innerHTML = '<p>You haven\'t borrowed any books yet.</p>';
        return;
    }
    
    container.innerHTML = borrows.map(borrow => {
        const daysRemaining = calculateDaysRemaining(borrow.due_date);
        const progress = calculateProgress(borrow.borrow_date, borrow.due_date);
        const isOverdue = daysRemaining < 0;
        const dueDateText = formatDate(borrow.due_date);
        const daysText = isOverdue ? 
            `<span style="color: var(--primary-red); font-weight: 600;">${Math.abs(daysRemaining)} days overdue</span>` :
            `${daysRemaining} days remaining`;
        
        return `
            <div class="borrowed-book-item">
                <div class="book-thumbnail">
                    📖
                </div>
                <div class="book-info">
                    <h4>${borrow.book_title}</h4>
                    <p class="author">${borrow.book_author || 'Unknown Author'}</p>
                    <div style="margin-top: 8px;">
                        <p style="font-size: 13px; color: var(--text-light); margin-bottom: 4px;">
                            <strong>Due Date:</strong> ${dueDateText}
                        </p>
                        <p style="font-size: 13px; color: var(--text-light);">
                            ${daysText}
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; margin-top: 8px;">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span style="font-size: 12px; color: #6c757d; margin-left: 8px;">${progress}%</span>
                    </div>
                </div>
                <div class="book-actions">
                    ${borrow.status === 'borrowed' ? 
                        `<button class="btn-read" onclick="returnBook(${borrow.id})">Return Book</button>` :
                        `<span class="status-badge status-returned">Returned</span>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Show book details in sidebar
async function showBookDetails(bookId) {
    const token = window.authUtils.getToken();
    const sidebar = document.getElementById('bookDetailsSidebar');
    const container = document.getElementById('bookDetailsContainer');
    
    try {
        const response = await fetch(`${API_URL}/books/${bookId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch book details');
        
        const book = await response.json();
        
        container.innerHTML = `
            <div class="book-detail-cover">
                📚
            </div>
            <h2 class="book-detail-title">${book.title}</h2>
            <p class="book-detail-author">${book.author}</p>
            <div class="rating">
                ${'⭐'.repeat(4)}${'☆'}
            </div>
            <div class="book-stats">
                <div class="stat">
                    <span class="stat-value">${book.total_copies || 1}</span>
                    <span class="stat-label">Copies</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${book.category || 'General'}</span>
                    <span class="stat-label">Category</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${book.available_copies}</span>
                    <span class="stat-label">Available</span>
                </div>
            </div>
            <div class="book-description">
                <p><strong>ISBN:</strong> ${book.isbn}</p>
                <p><strong>Category:</strong> ${book.category || 'General'}</p>
                <p>Click the Borrow button below to request this book. You'll have 14 days to read it before the due date.</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-borrow" onclick="borrowBook(${book.id})" 
                    ${book.available_copies === 0 ? 'disabled' : ''}>
                    ${book.available_copies > 0 ? 'Borrow Book' : 'Not Available'}
                </button>
                <button class="btn-favorite">❤️</button>
            </div>
        `;
    } catch (error) {
        console.error('Error loading book details:', error);
        container.innerHTML = '<p>Unable to load book details.</p>';
    }
}

// Borrow a book
async function borrowBook(bookId) {
    const token = window.authUtils.getToken();
    
    if (!confirm('Do you want to borrow this book?')) return;
    
    try {
        const response = await fetch(`${API_URL}/borrow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ book_id: bookId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Book borrowed successfully!');
            loadAllBooks();
            loadBorrowedBooks();
            // Refresh book details if the same book is still selected
            const container = document.getElementById('bookDetailsContainer');
            const currentContent = container.innerHTML;
            if (currentContent.includes(`onclick="borrowBook(${bookId})"`)) {
                showBookDetails(bookId);
            } else {
                container.innerHTML = '<p class="no-selection">Select a book to view details</p>';
            }
        } else {
            alert(data.message || 'Failed to borrow book');
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        alert('Unable to borrow book. Please try again.');
    }
}

// Return a book
async function returnBook(borrowId) {
    const token = window.authUtils.getToken();
    
    if (!confirm('Do you want to return this book?')) return;
    
    try {
        const response = await fetch(`${API_URL}/borrow/${borrowId}/return`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Book returned successfully!');
            loadAllBooks();
            loadBorrowedBooks();
        } else {
            alert(data.message || 'Failed to return book');
        }
    } catch (error) {
        console.error('Error returning book:', error);
        alert('Unable to return book. Please try again.');
    }
}

// Share book
function shareBook(borrowId) {
    const shareUrl = `${window.location.origin}?share=${borrowId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        alert('Unable to copy link');
    });
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                window.authUtils.logout();
            }
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
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
            const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
            searchAndFilterBooks(searchTerm, category);
        });
    }
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            loadBorrowedBooks(); // Reload with new sort
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
        displayAllBooks(books);
    } catch (error) {
        console.error('Search/Filter error:', error);
        const tbody = document.getElementById('booksTableBody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Error loading books. Please try again.</td></tr>';
    }
}

// Helper functions
function calculateDaysRemaining(dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function calculateProgress(borrowDate, dueDate) {
    const borrow = new Date(borrowDate);
    const due = new Date(dueDate);
    const today = new Date();
    
    const totalDays = (due - borrow) / (1000 * 60 * 60 * 24);
    const daysPassed = (today - borrow) / (1000 * 60 * 60 * 24);
    
    return Math.min(Math.round((daysPassed / totalDays) * 100), 100);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Make functions globally available
window.showBookDetails = showBookDetails;
window.borrowBook = borrowBook;
window.returnBook = returnBook;
window.shareBook = shareBook;