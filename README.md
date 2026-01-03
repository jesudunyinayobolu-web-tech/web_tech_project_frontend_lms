# web_tech_project_frontend_lms

# Library Management System - Frontend

## Project Overview

This is the frontend application for the Academic City University Library Management System. It provides a modern, responsive user interface for both administrators and students to manage library operations.

## Deployment

 ``
🔗 **Backend**: `https://web-tech-project-backend-lms.onrender.com`
🔗 **Live URL**: https://jesudunyinayobolu-web-tech.github.io/web_tech_project_frontend_lms/

## Features

- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ User authentication (Login/Register)
- ✅ Admin dashboard for book management
- ✅ Student dashboard for browsing and borrowing books
- ✅ Search and filter functionality
- ✅ Book details sidebar
- ✅ Mobile-friendly navigation

## Technologies

- HTML5
- CSS3 (Responsive Design)
- Vanilla JavaScript
- Fetch API

## Installation

1. Clone the repository or download the frontend folder
2. Update the API URL in `js/auth.js`:
   ```javascript
   const API_URL = 'https://your-backend-url.onrender.com/api';
   ```
3. Serve the files using any static file server:
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server -p 8000`
   - VS Code Live Server extension
4. Open `http://localhost:8000` in your browser

## Project Structure

```
frontend/
├── css/
│   └── styles.css          # All styles (responsive)
├── js/
│   ├── auth.js             # Authentication
│   ├── admin.js            # Admin dashboard
│   └── student.js          # Student dashboard
├── images/                 # Assets
├── index.html              # Login page
├── register.html           # Registration page
├── admin-dashboard.html    # Admin interface
└── student-dashboard.html  # Student interface
```

## Login Credentials

### Admin
- Email: `jesudunyinayobolu@gmail.com`
- Password: `123456`

### Student
- Email: `king1@gmail.com`
- Password: `123456`
- Or create a student by registering

