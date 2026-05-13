# Notion Clone

A full-stack Notion-inspired workspace application featuring nested pages, block-based editing, drag-and-drop reordering, debounced autosave, JWT authentication, and multi-workspace support.

## Live Demo

[Click here for a Demo](https://notion-clone-lilac-two.vercel.app)

## Screenshots

### Login Page

![Login Page](images/Notion-Clone-Login-Page.png)

<br>

### Signup Page

![Signup Page](images/Notion-Clone-Signup-Page.png)

<br>

### Demo Account

![Demo account](images/Notion-Clone-Demo-Account.png)

## Features

- JWT authentication with protected frontend routes
- Multi-workspace support with workspace switching
- Nested page hierarchy similar to Notion
- Recursive soft delete and restore system for nested content
- Circular nesting prevention for hierarchical page integrity
- Block-based editor with inline text editing
- Drag-and-drop page and block reordering using dnd-kit and fractional indexing
- Debounced autosave for block content editing
- Dynamic page navigation with parent/child traversal
- Optimistic UI updates for smoother interactions
- Demo account with automatic backend reset functionality

## Tech Stack

### Frontend

- React
- Vite
- React Router
- dnd-kit

### Backend

- Node.js
- Express
- JWT (authentication)
- bcrypt (password hashing)
- node-postgres (pg)
- node-cron

### Database

- PostgreSQL

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/brn-lin/Notion-Clone.git
cd Notion-Clone
```

### 2. Install dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `server` directory based on the example:

```bash
cd server
cp .env.example .env
```

Then fill in the required values:

```env
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=your_postgres_connection_string
```

### 4. Start the server

#### Backend

```bash
cd server
npm run dev
```

#### Frontend

```bash
cd client
npm run dev
```

### 5. Open the application

#### Backend

http://localhost:5000

#### Frontend

http://localhost:5173
