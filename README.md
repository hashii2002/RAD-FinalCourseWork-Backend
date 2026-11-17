# 🐾 PawPath – Pet Sales & Training Management System (Backend)

<p align="center">
  <strong>A RESTful Backend API for Pet Sales and Training Management</strong>
</p>

<p align="center">
  <a href="https://rad-final-course-work-backend-j67k.vercel.app">
    <strong>🚀 Live Backend API</strong>
  </a>
</p>

---

## 📌 Project Overview

**PawPath** is a web-based Pet Sales and Training Management System designed to manage pet sales, training programs, customer orders, training bookings, payments, and administrative operations through a centralized platform.

This repository contains the backend application responsible for business logic, data management, authentication, authorization, and RESTful API services.

The backend is developed using **Node.js, Express.js, TypeScript, and MongoDB**, following a modular architecture to support three main user roles:

- **ADMIN** – Manages the overall system and its operations.
- **TRAINER** – Handles assigned training activities and sessions.
- **CUSTOMER** – Browses pets and training programs, places orders, and manages bookings.

The backend is deployed on **Vercel** and provides API endpoints for the PawPath frontend application.

## 🌐 Live Deployment

**Backend Base URL:**

https://rad-final-course-work-backend-j67k.vercel.app

**API Base URL:**

https://rad-final-course-work-backend-j67k.vercel.app/api

## ✨ Key Features

### 🔐 Authentication & Authorization
- User registration and login.
- JWT-based authentication.
- Role-based authorization.
- Protected API endpoints.
- Password hashing using bcrypt.
- Forgot password functionality.
- Password reset using secure reset tokens.
- Change password functionality.

### 👥 User Management
- Create and manage user accounts.
- Retrieve user information.
- Manage ADMIN, TRAINER, and CUSTOMER roles.
- Activate and deactivate user accounts.
- Role-based access restrictions.

### 🐶 Pet Management
- Create new pet records.
- Retrieve all pets and individual pet details.
- Update pet information.
- Delete pet records.
- Search and filter pets.
- Manage pet availability statuses.
- Upload and manage pet images using Cloudinary and Multer.

### 🛍️ Pet Order Management
- Create pet orders.
- Retrieve customer orders.
- Manage order information.
- Update order statuses.
- Handle order-related operations.

### 🎓 Training Program Management
- Create training programs.
- Retrieve available training programs.
- Update training program details.
- Delete training programs.
- Manage training program information.

### 📅 Training Booking Management
- Create training bookings.
- Retrieve booking information.
- Manage customer bookings.
- Handle booking statuses.
- Support training-related operations.

### 🏋️ Training Session Management
- Manage training sessions.
- Retrieve session information.
- Track training activities.
- Support trainer-related operations.

### 💳 Payment Management
- Manage payment records.
- Retrieve payment information.
- Track payment statuses.
- Support manual payment management.
- Handle payment-related operations.

### 📊 Analytics & Dashboards
- Admin dashboard statistics.
- Pet sales summaries.
- Training program statistics.
- Booking summaries.
- Payment summaries.
- Customer and trainer dashboard data.

### 📄 Report Generation
- Pet sales reports.
- Training reports.
- Payment reports.
- System summary reports.
- Structured JSON report data for frontend PDF generation.

### 📞 Company Contact Management
- Retrieve company contact information.
- Create contact information.
- Update company contact details.
- Support customer communication.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime environment |
| Express.js | REST API development |
| TypeScript | Type-safe backend development |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication and authorization |
| bcryptjs | Password hashing |
| dotenv | Environment variable management |
| Cloudinary | Image storage and management |
| Multer | File upload handling |
| Nodemailer | Email communication |
| Vercel | Backend deployment |

## 🏗️ Project Structure

```text
rad-finalProject-backend/
│
├── src/
│   ├── config/
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── utils/
│   │
│   └── index.ts
│
├── dist/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*Note: This structure represents the main backend organization. Actual folders and files may vary according to the current implementation.*

## 🔌 API Modules

The backend provides RESTful API endpoints for the following modules:

| Module | Base Endpoint | Description |
|---|---|---|
| Health | `/api` | API health check |
| Authentication | `/api/auth` | Registration, login and password management |
| Users | `/api/users` | User management |
| Pets | `/api/pets` | Pet management |
| Pet Orders | `/api/pet-orders` | Pet order management |
| Training Programs | `/api/training-programs` | Training program management |
| Training Bookings | `/api/training-bookings` | Training booking management |
| Training Sessions | `/api/training-sessions` | Training session management |
| Payments | `/api/payments` | Payment management |
| Analytics | `/api/analytics` | Dashboard analytics |
| Customer Dashboard | `/api/customer-dashboard` | Customer dashboard data |
| Trainer Dashboard | `/api/trainer-dashboard` | Trainer dashboard data |
| Company Contact | `/api/company-contact` | Company contact information |
| Reports | `/api/reports` | Report data generation |

### 📄 Report Endpoints

```http
GET /api/reports/pet-sales
GET /api/reports/training
GET /api/reports/payments
GET /api/reports/system-summary
```

Report endpoints require appropriate authentication and authorization.

## 🔐 Authentication

PawPath uses **JSON Web Tokens (JWT)** to secure protected API endpoints.

After successful login, the backend generates an authentication token. The frontend sends this token with protected API requests using the Authorization header.

Example:

```http
Authorization: Bearer <your_access_token>
```

Role-based authorization ensures that users can only access endpoints permitted for their assigned roles.

## ⚙️ Installation & Setup

Follow these steps to run the backend application locally.

### 1. Clone the Repository

```bash
git clone <YOUR_BACKEND_GITHUB_REPOSITORY_URL>
```

### 2. Navigate to the Project Directory

```bash
cd rad-finalProject-backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory.

Add the required environment variables according to your backend configuration.

Example:

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=<YOUR_MONGODB_CONNECTION_STRING>

JWT_SECRET=<YOUR_JWT_SECRET>
JWT_EXPIRES_IN=<YOUR_JWT_EXPIRATION>

CLOUDINARY_CLOUD_NAME=<YOUR_CLOUDINARY_CLOUD_NAME>
CLOUDINARY_API_KEY=<YOUR_CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_CLOUDINARY_API_SECRET>

EMAIL_USER=<YOUR_EMAIL_ADDRESS>
EMAIL_PASS=<YOUR_EMAIL_APP_PASSWORD>

FRONTEND_URL=http://localhost:5173
```

**Important:** Replace the placeholder values with your own credentials. Never upload `.env` files or expose database credentials, API keys, email passwords, or JWT secrets on GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

The backend will normally run at:

```text
http://localhost:3000
```

### 6. Build the Project

```bash
npm run build
```

This command compiles the TypeScript source code into JavaScript files inside the `dist/` directory.

### 7. Run the Production Build Locally

```bash
npm start
```

## 🧪 API Testing

API endpoints can be tested using tools such as:

- Postman
- Thunder Client
- Browser (for suitable GET endpoints)

Test the authentication endpoints first to obtain a JWT token before testing protected endpoints.

## 🗄️ Database

PawPath uses **MongoDB** as its database and **Mongoose** for schema definition and database operations.

The database stores information related to:

- Users
- Pets
- Pet Orders
- Training Programs
- Training Bookings
- Training Sessions
- Payments
- Counters
- Company Contact Information

MongoDB Atlas can be used to host the database in the cloud.

## 🚀 Deployment

The PawPath backend is deployed using **Vercel**.

**Production Backend URL:**

https://rad-final-course-work-backend-j67k.vercel.app

**Production API Base URL:**

https://rad-final-course-work-backend-j67k.vercel.app/api

Configure the required environment variables in the Vercel project settings before deploying.

## 🔒 Security Considerations

- Passwords are hashed before being stored.
- JWT authentication protects restricted endpoints.
- Role-based authorization controls access to resources.
- Sensitive configuration values are stored in environment variables.
- CORS is configured to control frontend access.
- Input validation and error handling are implemented through backend logic.

## 🎯 Project Objectives

- Develop a centralized pet sales and training management platform.
- Provide secure RESTful API services.
- Simplify pet order and training booking operations.
- Support role-based access for administrators, trainers, and customers.
- Maintain reliable and organized data management.
- Provide analytics and report data for business decision-making.

## 👩‍💻 Project Information

| Detail | Description |
|---|---|
| Project Name | PawPath – Pet Sales & Training Management System |
| Project Type | RAD Coursework |
| Backend Architecture | RESTful API |
| Backend Language | TypeScript |
| Database | MongoDB |
| Deployment Platform | Vercel |

---

<p align="center">
  <strong>🐾 PawPath – Making Pet Sales and Training Management Easier!</strong>
</p>
