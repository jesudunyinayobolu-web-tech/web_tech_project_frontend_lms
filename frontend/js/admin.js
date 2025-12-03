// API Base URL
const API_URL = 'http://localhost:5000/api';

// Check authentication and admin role
if (!window.authUtils.isAuthenticated()) {
    window.location.href = 'index.html';
}

const user = window.authUtils.getUser();
if (user.role !== 'admin') {
    window.location.href = 'student-dashboard.html';
}

let currentEditingBook = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            window.authUtils.logout();
        }
    });
    
    // Add book button
    document.getElementById('addBookBtn').addEventListener('click', () => {
        openBookModal();
    });
    
    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeBookModal);
    document.getElementById('cancelBtn').addEventListener('click', closeBookModal);
    
    // Book form submit
    document.getElementById('bookForm').addEventListener('submit', handleBookSubmit);
    
    // Navigation items
    document.querySelectorAll('.sidebar .nav-item[data-section]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Search
    document.getElementById('adminSearch').addEventListener('input', (e) => {
        searchBooks(e.target.value);
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });
    
    // Close modal when clicking outside
    document.getElementById('bookModal').addEventListener('click', (e) => {
        if (e.target.id === 'bookModal') {
            closeBookModal();
        }
    });
}

// Switch sections
function switchSection(section) {
    // Update nav
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
    
    // Update title and load data
    const titles = {
        books: 'Manage Books',
        borrows: 'Borrow Requests',
        overdue: 'Overdue Books',
        students: 'Students'
    };
    document.getElementById('sectionTitle').textContent = titles[section];
    
    // Load appropriate data
    switch(section) {
        case 'books':
            loadBooks();
            break;
        case 'borrows':
            loadBorrows();
            break;
        case 'overdue':
            loadOverdueBooks();
            break;
        case 'students':
            loadStudents();
            break;
    }
}

// Load all books
async function loadBooks() {
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
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        tbody.innerHTML = '<tr><td colspan="7">Unable to load books. Please try again.</td></tr>';
    }
}

// Display books in table
function displayBooks(books) {
    const tbody = document.getElementById('booksTableBody');
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No books found</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.category || 'N/A'}</td>
            <td>${book.available_copies}</td>
            <td>${book.total_copies}</td>
            <td>
                <button class="btn-edit" onclick="editBook(${book.id})">Edit</button>
                <button class="btn-delete" onclick="deleteBook(${book.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Load borrow requests
async function loadBorrows() {
    const token = window.authUtils.getToken();
    const tbody = document.getElementById('borrowsTableBody');
    
    try {
        const response = await fetch(`${API_URL}/borrows`, {
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
        const response = await fetch(`${API_URL}/borrows/overdue`, {
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

// Open book modal for add/edit
function openBookModal(book = null) {
    const modal = document.getElementById('bookModal');
    const form = document.getElementById('bookForm');
    const title = document.getElementById('modalTitle');
    
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
}

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
    
    const token = window.authUtils.getToken();
    const bookId = document.getElementById('bookId').value;
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        category: document.getElementById('bookCategory').value,
        total_copies: parseInt(document.getElementById('totalCopies').value)
    };
    
    try {
        const url = bookId ? `${API_URL}/books/${bookId}` : `${API_URL}/books`;
        const method = bookId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(bookId ? 'Book updated successfully!' : 'Book added successfully!');
            closeBookModal();
            loadBooks();
        } else {
            alert(data.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Error saving book:', error);
        alert('Unable to save book. Please try again.');
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
        const response = await fetch(`${API_URL}/borrows/${borrowId}/return`, {
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

// Search books
async function searchBooks(searchTerm) {
    if (searchTerm.length < 2) {
        loadBooks();
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
        displayBooks(books);
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
        displayBooks(books);
    } catch (error) {
        console.error('Filter error:', error);
    }
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

// Make functions globally available
window.editBook = editBook;
window.deleteBook = deleteBook;
window.markReturned = markReturned;
window.sendReminder = sendReminder;