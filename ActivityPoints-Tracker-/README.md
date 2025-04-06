# Activity Points Tracker

A MEAN stack application for tracking activity points of students in college.

## Features

- Three user types: Student, Teacher, and Superadmin
- Students can register, login, and upload certificates for activities
- Teachers can approve/reject student activity requests and download reports
- Superadmin has overall control of the system

## Tech Stack

- **Frontend**: Angular
- **Backend**: Node.js, Express.js
- **Database**: MongoDB

## Project Structure

```
activity-points-tracker/
├── backend/             # Node.js backend
│   ├── controllers/     # API controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded files
│   ├── .env             # Environment variables
│   ├── package.json     # Backend dependencies
│   └── server.js        # Entry point
└── frontend/            # Angular frontend
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users` - Get all users (Superadmin only)
- `GET /api/users/role/:role` - Get users by role (Superadmin, Teacher)
- `GET /api/users/:id` - Get user by ID (Superadmin, Teacher)
- `PUT /api/users/:id` - Update user (Superadmin only)
- `DELETE /api/users/:id` - Delete user (Superadmin only)

### Activities

- `POST /api/activities` - Submit a new activity (Student only)
- `GET /api/activities` - Get all activities for a student (Student only)
- `GET /api/activities/pending` - Get all pending activities (Teacher only)
- `PUT /api/activities/:id/review` - Review an activity (Teacher only)
- `GET /api/activities/all` - Get all activities (Superadmin only)
- `GET /api/activities/report` - Generate report (Teacher, Superadmin)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Angular CLI

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Configuration

1. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```
2. Start the Angular frontend:
   ```
   cd frontend
   ng serve
   ```
3. Access the application at `http://localhost:4200`

## License

This project is licensed under the MIT License. 