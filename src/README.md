# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teacher-only sign up/unregister for activities
- Teacher login/logout with credentials stored in `teachers.json`

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up student for an activity (teacher token required)           |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister student from activity (teacher token required)      |
| POST   | `/auth/login`                                                     | Teacher login (`username`, `password`)                              |
| GET    | `/auth/status`                                                    | Validate current teacher token                                      |
| POST   | `/auth/logout`                                                    | Logout teacher session                                              |

## Admin Mode

- The UI includes a teacher icon in the top-right corner.
- Logged-out users can only view activities and participants.
- Logged-in teachers can register or unregister students.

Default demo credentials are defined in `teachers.json`.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
