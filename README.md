# Code Review AI

## Project Overview

Code Review AI is an AI-powered platform where developers paste code and receive detailed, structured reviews and recommendations. This foundational build sets up the full-stack Next.js architecture, authentication, API routing, database models, and UI scaffolding.

## Features

- AI-driven code review workflow
- Review history and dashboard pages
- Chat-based assistant interface
- Google Gemini integration placeholder
- MongoDB data storage with Mongoose
- NextAuth authentication setup
- Tailwind CSS and shadcn-style UI component scaffolding

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Mongoose
- NextAuth (Auth.js v5)
- Google Generative AI client
- Monaco Editor
- React Hook Form + Zod
- Framer Motion
- Lucide Icons

## Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env.local` file with required environment variables
4. Run the development server
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key |

## Folder Structure

- `app/` - Next.js app routes, API endpoints, and layouts
- `components/` - Reusable UI and layout components
- `hooks/` - Custom React hooks
- `lib/` - Utility and integration helpers
- `models/` - Mongoose models
- `services/` - Service modules for review and chat logic
- `types/` - Shared TypeScript interfaces
- `utils/` - Helper utilities and constants

## Screenshots

Placeholder for future screenshots.

## Deployment

- Build the app: `npm run build`
- Start the app: `npm run start`

## Future Improvements

- Add real shadcn UI components and dynamic pages
- Implement full authentication flows
- Integrate Gemini AI review generation
- Add persisted review history and chat state
- Improve dashboard and landing page layouts
