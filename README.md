# AI Tutor - Goal Achievement Platform

## Overview
AI Tutor is a comprehensive goal achievement platform designed to help users break down large objectives into manageable learning journeys with AI-powered tutoring support. This project is built as part of a Full-Stack Engineering Intern Assignment.

## Features
- **Authentication System**: User registration and login with JWT-based session management.
- **Goal Management System**: Create and customize goals with automated journey breakdowns into weekly/bi-weekly chunks.
- **Check-in System**: Configurable check-in intervals with reminders and progress assessments.
- **AI Avatar Tutor**: Conversational AI for theory explanation, personalized examples, and interactive Q&A (pending integration).
- **Progress Tracking & Analytics**: Track learning progress with metrics, summaries, and visualizations.

## Technology Stack
- **Frontend**: Next.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Real-time Communication**: Socket.io

## Setup Instructions

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```
   npm install
   ```
3. Set up the PostgreSQL database using the schema in `db.sql`
4. Configure environment variables in a `.env` file
5. Run the development servers:
   - Frontend: `npm run dev`
   - Backend: `npm run server`

## Project Structure
- `/app`: Next.js frontend components
- `/pages/api`: Next.js API routes
- `server.js`: Express backend server
- `db.sql`: Database schema

## Deployment
The application is configured for deployment on Vercel.
