# AI-Driven Traffic Violation Detection System - Frontend

This repository contains the **frontend** part of the AI-Driven Traffic Violation Detection System, which provides a responsive and user-friendly dashboard for traffic officers to monitor traffic violations in real-time.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

The **frontend** is designed to provide traffic officers, city authorities, and system administrators a centralized dashboard to:

- View real-time traffic violations (over-speeding, red-light jumping, seatbelt violations).
- Filter violations by date, location, or type.
- Export reports in PDF/Excel format.
- Access violation evidence such as images and timestamps.
- Manage officer accounts (for Admin role).

The frontend interacts with backend APIs (Flask/Node.js) to fetch, display, and manage violation data efficiently.

---

## Features

- **Officer Dashboard**
  - Display live violations with timestamped evidence.
  - Filter violations by type, date, and location.
  - Export reports (PDF/Excel).
  
- **User Management**
  - Login authentication for officers and admins.
  - Role-based access control.
  
- **Responsive Design**
  - Optimized for desktop and tablet use.
  - Dynamic sidebar with hamburger menu for smaller screens.

- **Alerts & Notifications**
  - Real-time updates on new violations.
  
---

## Tech Stack

- **Frontend Framework:** React.js (Vite)
- **Styling:** Tailwind CSS, Bootstrap
- **Icons:** React Icons, Bootstrap Icons
- **State Management:** React Hooks (`useState`, `useEffect`)
- **HTTP Requests:** Axios
- **Routing:** React Router

---

## Folder Structure

frontend/
│
├── public/ # Static assets (images, icons, etc.)
├── src/
│ ├── assets/ # Images and media files
│ ├── components/ # Reusable UI components (Navbar, Sidebar, Cards)
│ ├── pages/ # Page components (Dashboard, Login, Reports)
│ ├── services/ # Axios API service files
│ ├── App.jsx # Main app component
│ ├── main.jsx # Entry point
│ └── index.css # Global CSS
├── .env # Environment variables
├── package.json # Project dependencies
└── vite.config.js # Vite configuration


---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/adityavar808/AI_Driven_Traffic_Violation_Detection_System.git
cd AI_Driven_Traffic_Violation_Detection_System/frontend
```

2. Install the Dependencies

```bash
npm install
```

3. BASE URL

```bash
VITE_API_BASE_URL=http://localhost:5000
```

## Usage 
Start the frontend development server: ```npm run dev```.
The app will be available at http://localhost:5173 (default Vite port).