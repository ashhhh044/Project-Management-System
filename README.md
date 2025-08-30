Project Management System

A web-based project and task management system that helps teams organise, track, and collaborate on projects efficiently. Built with modern web technologies, this system supports project creation, task assignment, and progress tracking.

Tech Stack

Frontend: HTML, CSS, JavaScript, React  
Backend: Node.js, Express.js  
Database: MySQL  

Features

Project Management: Create, view, and manage multiple projects.  
Task Management: Add, edit, delete, and assign tasks to team members.  
Progress Tracking: Mark tasks as complete and monitor project status.  
User-Friendly Interface: Intuitive dashboard for easy navigation.  

Installation

1. Clone the repository:

git clone https://github.com/ashhhh044/Project-Management-System.git
cd Project-Management-System

2. Backend setup:

cd backend
npm install

Configure MySQL database and import the provided schema.
Create a .env file with:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=mydb

Start the backend server:

npm start

3. Frontend setup:

cd ../frontend
npm install
npm start

The app will run at http://localhost:3000

Usage

* Add Projects: Click “Add Project” on the dashboard.
* Manage Tasks: Within each project, create or edit tasks.
* Track Progress: Mark tasks as complete to update project status.

Future Improvements

* User authentication with roles (Admin, Team Member)
* Task prioritisation and deadlines
* Notifications for task updates
