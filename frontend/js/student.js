// API Base URL
const API_URL = 'http://localhost:5000/api';

// Check authentication
if (!window.authUtils.isAuthenticated()) {
    window.location.href = 'index.html';
}

const user = window.authUtils.getUser();
if (user.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadFeaturedBooks();
    loadBorrowedBooks();
    setupEventListeners();
});

// Load user information
function loadUserInfo() {
    const user = window.authUtils.getUser();
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = `@${user.email.split('@')[0]}`;
    
    // Set avatar initials
    const initial = user.name.charAt(0).toUpperCase();
    const avatar = document.getElementById('userAvatar');
    avatar.querySelector('span').textContent = initial;
    
    const topAvatar = document.getElementById('topUserAvatar');
    topAvatar.querySelector('span').textContent = initial;
}

// Load featured books
async function loadFeaturedBooks() {
    const token = window.authUtils.getToken();
    const featuredBooksContainer = document.getElementById('featuredBooks');
    
    try {
        const response = await fetch(`${API_URL}/books`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch books');
        
        const books = await response.json();
        displayFeaturedBooks(books.slice(0, 6)); // Show first 6 books
    } catch (error) {
        console.error('Error loading books:', error);
        featuredBooksContainer.innerHTML = '<p>Unable to load books. Please try again later.</p>';
    }
}

// Display featured books
function displayFeaturedBooks(books) {
    const container = document.getElementById('featuredBooks');
    
    if (books.length === 0) {
        container.innerHTML = '<p>No books available at the moment.</p>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" onclick="showBookDetails(${book.id})">
            <div class="book-cover">
                📚
            </div>
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            <span class="availability-badge ${book.available_copies > 0 ? 'available' : 'unavailable'}">
                ${book.available_copies > 0 ? 'Available' : 'Not Available'}
            </span>
        </div>
    `).join('');
}

// Load borrowed books
async function loadBorrowedBooks() {
    const token = window.authUtils.getToken();
    const user = window.authUtils.getUser();
    const borrowedBooksContainer = document.getElementById('borrowedBooks');
    
    try {
        const response = await fetch(`${API_URL}/borrows/user/${user.id}`, {
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
        
        return `
            <div class="borrowed-book-item">
                <span class="book-drag-handle">⋮⋮</span>
                <div class="book-thumbnail">
                    📖
                </div>
                <div class="book-info">
                    <h4>${borrow.book_title}</h4>
                    <p class="author">${borrow.book_author}</p>
                    <div style="display: flex; align-items: center;">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span style="font-size: 12px; color: #6c757d;">${progress}%</span>
                    </div>
                </div>
                <div class="book-actions">
                    <span class="pages-info">Due: ${formatDate(borrow.due_date)}</span>
                    <button class="btn-share" onclick="shareBook(${borrow.id})">
                        🔗 Share
                    </button>
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
                <p>Click the Borrow button below to request this book. You'll have 14 days to read it before the due date.</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-borrow" onclick="borrowBook(${book.id})" 
                    ${book.available_copies === 0 ? 'disabled' : ''}>
                    ${book.available_copies > 0 ? 'Borrow' : 'Not Available'}
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
        const response = await fetch(`${API_URL}/borrows`, {
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
            loadFeaturedBooks();
            loadBorrowedBooks();
            document.getElementById('bookDetailsContainer').innerHTML = 
                '<p class="no-selection">Select a book to view details</p>';
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
        const response = await fetch(`${API_URL}/borrows/${borrowId}/return`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Book returned successfully!');
            loadFeaturedBooks();
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
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            window.authUtils.logout();
        }
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchBooks(searchTerm);
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });
    
    // Sort select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        loadBorrowedBooks(); // Reload with new sort
    });
}

// Search books
async function searchBooks(searchTerm) {
    if (searchTerm.length < 2) {
        loadFeaturedBooks();
        return;
    }
    
    const token = window.authUtils.getToken();
    
    try {
        const response = await fetch(`${API_URL}/books?search=${searchTerm}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const books = await response.json();
        displayFeaturedBooks(books);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Filter by category
async function filterByCategory(category) {
    const token = window.authUtils.getToken();
    const url = category ? `${API_URL}/books?category=${category}` : `${API_URL}/books`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Filter failed');
        
        const books = await response.json();
        displayFeaturedBooks(books);
    } catch (error) {
        console.error('Filter error:', error);
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