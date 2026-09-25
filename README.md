# 🎓 Event Manager - Full-Stack Web Application

A clean, modern, and full-stack Event Management System built with a decoupled architecture featuring a **Django REST Framework** backend API and an independent **HTML/CSS/Vanilla JavaScript** frontend.

---

## 📌 Architecture Overview

The system uses a decoupled client-server architecture where the frontend HTML/JS client communicates exclusively via asynchronous `fetch()` API calls to the Django REST Framework backend.

```text
Frontend (HTML5 / CSS3 / Vanilla JS)
           │
           ▼  (JSON over HTTP / fetch)
Django REST Framework (APIs & Serializers)
           │
           ▼
Django ORM (Models & Validation)
           │
           ▼
SQLite Database
```

---

## ✨ Features

- **Decoupled REST Architecture:** Fully separated frontend client consuming JSON endpoints.
- **User Authentication:** API-based user signup, login, logout, and session state tracking (`/api/register/`, `/api/login/`, `/api/user/`).
- **Event CRUD Operations:** Create events, browse/search event listings, view detailed event summaries, and update/delete hosted events.
- **Role-Based Authorization:** Server-side permission enforcement ensuring only event organizers can update or delete their respective events.
- **Event Registration System:** One-click event registration with database-level duplicate prevention (`unique_together`).
- **Real-Time Search & Filtering:** Keyword search across titles, locations, and descriptions, with time-based filtering (All, Upcoming, Past).
- **Personal Dashboard:** Dedicated views for tracking events organized by the user ("My Events") and events registered for ("My Registrations").
- **Responsive Frontend:** Clean CSS design with custom cards, badges, modal drawer navigation, and alerts.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 `async/await`, `fetch` API)
- **Backend:** Python 3, Django 5, Django REST Framework (DRF), `django-cors-headers`
- **Database:** SQLite
- **Icons & Fonts:** FontAwesome 6, Google Fonts (Poppins)

---

## 📂 Project Structure

```text
Event-Manager/
│
├── backend/                    # Django REST Framework Backend
│   ├── manage.py               # Django management CLI
│   ├── requirements.txt        # Backend dependencies
│   ├── db.sqlite3              # Database
│   │
│   ├── event_manager/          # Django project configuration
│   │   ├── settings.py         # Apps, CORS, and DRF settings
│   │   ├── urls.py             # Root URL dispatcher
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   └── events/                 # Events app module
│       ├── admin.py            # Admin panel configuration
│       ├── models.py           # Event & EventRegistration models
│       ├── serializers.py      # DRF ModelSerializers
│       ├── views.py            # REST API view functions
│       ├── urls.py             # API routes
│       └── tests.py            # Automated API test suite
│
├── frontend/                   # Decoupled Web Client
│   ├── index.html              # Homepage & event discovery
│   ├── login.html              # Login page
│   ├── register.html           # User registration page
│   ├── event-detail.html       # Event details & registration page
│   ├── create-event.html       # Create event page
│   ├── edit-event.html         # Edit event page
│   ├── my-events.html          # User's hosted events page
│   ├── my-registrations.html   # User's registered events page
│   │
│   ├── css/
│   │   └── style.css           # Responsive stylesheet
│   │
│   └── js/
│       ├── api.js              # Centralized fetch API wrapper
│       ├── auth.js             # Authentication state & navbar sync
│       └── events.js           # Event DOM handling & API integration
│
├── README.md                   # Documentation
└── .gitignore                  # Git ignore rules
```

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register/` | Register a new user account | No |
| `POST` | `/api/login/` | Log in user and establish session | No |
| `POST` | `/api/logout/` | Log out current user | Yes |
| `GET` | `/api/user/` | Get currently logged-in user profile | No |
| `GET` | `/api/events/` | List all events (supports `?search=` and `?filter=`) | No |
| `POST` | `/api/events/` | Create a new event | Yes |
| `GET` | `/api/events/<id>/` | Retrieve event details | No |
| `PUT` | `/api/events/<id>/` | Update event details | Yes (Organizer) |
| `DELETE` | `/api/events/<id>/` | Delete an event | Yes (Organizer) |
| `GET` | `/api/my-events/` | List events created by current user | Yes |
| `POST` | `/api/events/<id>/register/` | Register for an event | Yes |
| `POST` | `/api/events/<id>/cancel/` | Cancel event registration | Yes |
| `GET` | `/api/registrations/` | List user's registered events | Yes |

---

## 🚀 Installation & Running

### 1. Running the Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start Django development server
python manage.py runserver
```
The backend API server will run at: `http://127.0.0.1:8000/api/`

---

### 2. Running the Frontend

The frontend is completely independent and can be served using any local HTTP server (such as VS Code Live Server or Python `http.server`).

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Serve frontend static files
python -m http.server 5500
```

Open your browser and navigate to:
`http://127.0.0.1:5500/index.html`

---

## 🧪 Testing Backend APIs

Run the automated DRF test suite:

```bash
cd backend
python manage.py test
```

Test coverage includes:
- User registration and login APIs
- Public event listing and details endpoints
- Authenticated event creation
- Event registration and duplicate registration prevention
- Server-side organizer permission enforcement on update/delete

---

## 🔮 Future Improvements

- JWT Authentication integration (`djangorestframework-simplejwt`).
- Image upload support for event banners.
- Email confirmation upon event registration.
- Pagination support for large event datasets.
