# Ai-tutor_assignment

Submission Format

Deadline: Saturday Midnight

Submit by replying to this assignment message with:

Demo Video URL: [Your YouTube/Vimeo link]

Live Application URL: [Your hosted app link]

GitHub Repository URL: [Your repo link]

Evaluation Process

Initial review of hosted application functionality

Code quality assessment via GitHub repository

Technical implementation evaluation through demo video

Overall user experience and feature completeness testing# Full-Stack Engineering Intern Assignment: Goal Achievement Platform

Assignment Overview

Build a comprehensive goal achievement platform that helps users break down large objectives into manageable learning journeys with AI-powered tutoring support.

Timeline: 72 hours

Core Features Required

1. Authentication System

User Registration/Login Flow

Email/password authentication

Input validation and error handling

Password strength requirements

Email verification (bonus)

Session management

Logout functionality

2. Goal Management System

Goal Creation Interface

User inputs their overall objective (e.g., "Learn machine learning")

System breaks goal into 6-week to 6-month journeys based on complexity

Auto-suggestion of journey timelines

User can customize timeline and milestones

Journey Breakdown

Split journeys into weekly/bi-weekly chunks

Each chunk has specific learning objectives

Progress tracking for each chunk

Dependency management between chunks

3. Check-in System

Flexible Frequency Settings

User-configurable check-in intervals (daily, weekly, bi-weekly)

Calendar integration for scheduling

Reminder notifications

Progress assessment forms

4. AI Avatar Tutor (Core Challenge)

Conversational Interface

2-way video chat simulation (can use placeholder avatar)

Real-time chat functionality

Context-aware responses based on current learning module

Theory explanation capabilities

Application to user's specific use case

Learning Modules

Theoretical content delivery

Interactive Q&A sessions

Personalized examples based on user's goal

Practice problem generation

5. Progress Tracking & Analytics

Data Recording

All chat interactions stored

Progress metrics tracked

Learning velocity calculations

Completion rates per module

Session Summaries

Auto-generated chat summaries

Key learning points extraction

Action items and next steps

Progress visualization

Technical Requirements

Frontend

Framework: React.js or Next.js

Styling: Tailwind CSS or styled-components

State Management: Context API or Redux

Video/Chat: WebRTC implementation or

[Socket.io](http://socket.io/)

UI Components: Custom or library (Material-UI/Chakra)

Backend

Framework: Node.js with Express or Python with FastAPI

Database: PostgreSQL or MongoDB

Authentication: JWT tokens

Real-time: WebSocket implementation

AI Integration: You choice of model

Evaluation Criteria

Technical Implementation (40%)

Code Quality: Clean, readable, well-structured code

Architecture: Proper separation of concerns, scalable design

Database Design: Efficient schema and queries

Security: Proper authentication, data validation, CORS handling

Error Handling: Comprehensive error management

Feature Completeness (35%)

Core Functionality: All major features working

User Experience: Intuitive navigation and interactions

Responsive Design: Works across devices

Performance: Fast loading times and smooth interactions

Innovation & Problem Solving (25%)

AI Integration: Creative implementation of conversational AI

User Journey Design: Thoughtful goal breakdown logic

Data Insights: Meaningful progress tracking and summaries

Technical Challenges: How complex problems were solved

Deliverables

1. Live Application

Deployed and accessible via URL

Demo account with sample data

All core features functional

2. Source Code

GitHub repository with clear README

Proper commit history

Installation and setup instructions

API documentation

3. Demo video (5 minutes)

Live walkthrough of all features

Technical architecture explanation

Challenges faced and solutions

Future improvements discussion

Sample User Journey

Registration: New user signs up with email/password

Goal Setting: "I want to become a data scientist"

Journey Planning: System suggests 4-month journey with weekly milestones

Learning Path: Breaks into modules (Python basics → Statistics → ML algorithms → Projects)

AI Interaction: User chats with avatar about linear regression theory

Application: Avatar helps apply concepts to user's specific dataset

Progress Tracking: System records learning, provides summary and next steps

Success Metrics

All authentication flows work seamlessly

Users can input problems and get meaningful solution journeys

System properly handles generic inputs by asking for specificity

AI advisor provides actionable, implementation-focused guidance

Progress tracking reflects real-world milestone completion

Application is deployed and demo-ready