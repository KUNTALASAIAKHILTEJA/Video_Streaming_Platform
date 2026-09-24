# 🎥 Video Streaming Backend Service

A high-performance, secure **Video Streaming Backend REST API** built with **Django 6.1**, **Django REST Framework (DRF)**, and **SimpleJWT**.

Features stateless **JWT Bearer Token Authentication**, global **Role-Based Access Control (RBAC)** middleware, subscriber viewing history, user comments, automated **Audit Logging**, and interactive **Swagger API Documentation**.

---

## 🌟 Key Features

- **JWT Authentication**: Secure login and token refresh endpoints (`/api/token/`, `/api/token/refresh/`).
- **Global RBAC Middleware (`JWTRBACMiddleware`)**: Centralized access control ensuring regular subscribers have read-only access to catalog items while Admin staff (`is_staff=True`) have full CRUD capabilities.
- **Relational Data Catalog**: Clean database schema for `Genre`, `Series`, `Season`, and `Episode` management.
- **Subscriber Activities**: Tracks user playback progress (`WatchHistory`) and episode/series discussions (`Comment`).
- **Audit Logging**: Automated system compliance audit trail (`AuditLog`) capturing `CREATE`, `UPDATE`, and `DELETE` actions.
- **Signal-Based File Cleanup**: Django `post_delete` signals automatically remove media files (videos & thumbnails) from disk upon record deletion.
- **Interactive API Docs**: Built-in Swagger UI powered by `drf-spectacular`.

---

## 📋 Technology Stack

- **Framework**: Django 6.1
- **API Engine**: Django REST Framework (DRF 3.18)
- **Authentication**: `rest_framework_simplejwt` (5.5)
- **Database**: SQLite (Development) / PostgreSQL ready
- **API Documentation**: `drf-spectacular` (OpenAPI 3)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Python 3.10+ installed on your system.

### 2. Clone Repository & Setup Virtual Environment
```bash
git clone <repository_url>
cd video_streaming_BE/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Database Setup & Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Admin Account)
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

Access the service at: **`http://127.0.0.1:8000/`**

---

## 📖 API Documentation & Endpoints

### Interactive Documentation UI
- **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
- **ReDoc**: `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema**: `http://127.0.0.1:8000/api/schema/`
- **Django Admin Portal**: `http://127.0.0.1:8000/admin/`

---

## 🔒 RBAC Authorization Matrix

| Endpoint Route | Resource | Subscriber (`is_staff=False`) | Admin Staff (`is_staff=True`) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/token/` | Auth Token | 🟢 Public Obtain Token | 🟢 Public Obtain Token | `200 OK` |
| `/api/series/` | Series Catalog | 🟢 Read-Only (`GET`) | 🟢 Full Access (`GET, POST, PUT, DELETE`) | `200 OK` / `403` |
| `/api/genre/` | Genre Catalog | 🟢 Read-Only (`GET`) | 🟢 Full Access (`GET, POST, PUT, DELETE`) | `200 OK` / `403` |
| `/api/seasons/` | Season Catalog | 🟢 Read-Only (`GET`) | 🟢 Full Access (`GET, POST, PUT, DELETE`) | `200 OK` / `403` |
| `/api/episodes/` | Episode Catalog | 🟢 Read-Only (`GET`) | 🟢 Full Access (`GET, POST, PUT, DELETE`) | `200 OK` / `403` |
| `/api/watchhistory/` | Watch Progress | 🟢 Read & Write (Own History) | 🟢 Read & Write (All History) | `200 OK` / `201` |
| `/api/comments/` | User Comments | 🟢 Post & Edit Own Comments | 🟢 Full Access & Moderation Delete | `200 OK` / `403` |
| `/api/auditlog/` | System Logs | 🔴 Blocked (`403 Forbidden`) | 🟢 Read-Only Access (`GET`) | `200 OK` / `403` |

---

## 🧪 Running Automated Tests

Run the Django unit test suite:
```bash
python manage.py test streaming
```

Test suite verifies:
1. JWT token generation & validation.
2. Catalog read-only restriction for regular subscribers.
3. Catalog CRUD privileges for admin staff.
4. Comment ownership protection.
5. Audit log restriction to admin users.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).