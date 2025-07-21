# Replit.md - German Language Level Assessment System

## Overview

This is a full-stack German language proficiency testing application built with React, TypeScript, Node.js, and Express. The system provides a comprehensive 40-question CEFR-aligned assessment (A1-B2 levels) with AI-powered feedback using OpenAI's GPT-4o-mini model. The application features a modern, responsive UI built with shadcn/ui components and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **UI Components**: Comprehensive set of Radix UI primitives wrapped in custom components
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Theme**: German-inspired color scheme with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with a single `/api/quiz` endpoint
- **External Services**: OpenAI API integration for AI-powered feedback generation
- **Development**: Hot reloading with Vite middleware integration

### Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: PostgreSQL sessions using connect-pg-simple
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Current Implementation**: In-memory storage for user data (development phase)

## Key Components

### Quiz System
- **Question Bank**: 40 carefully crafted German language questions organized by CEFR levels (A1: 0-9, A2: 10-19, B1: 20-29, B2: 30-39)
- **Progressive Difficulty**: Questions increase in complexity as users progress through levels
- **Answer Validation**: Real-time answer checking with immediate feedback
- **Progress Tracking**: Visual progress indicators and level-based color coding

### AI Feedback Engine
- **Model**: OpenAI GPT-4o for generating personalized feedback
- **Feedback Format**: Detailed level-specific study plans with technical recommendations and WhatsApp CTA
- **Content Structure**: Congratulations, CEFR level assessment, personalized study roadmap, and direct WhatsApp integration
- **Integration**: Secure API key management through environment variables with comprehensive fallback system

### UI/UX Components
- **Design System**: shadcn/ui components with German flag-inspired color palette
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Interactive Elements**: Smooth animations, loading states, and error handling

## Data Flow

1. **Quiz Initiation**: User starts the assessment through the main interface
2. **Question Delivery**: Server sends questions sequentially based on current index
3. **Answer Processing**: Client validates answers and tracks score locally
4. **Progress Updates**: Real-time progress visualization with level indicators
5. **AI Feedback Generation**: Upon completion, server generates detailed level-specific study plans
6. **Results Display**: Comprehensive feedback with congratulations, level assessment, and personalized study roadmap
7. **Call-to-Action**: Direct WhatsApp integration for course enrollment with special offers

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Query for state management
- **UI Framework**: Radix UI primitives, Tailwind CSS, class-variance-authority
- **Backend**: Express.js, OpenAI SDK, Drizzle ORM
- **Development**: Vite, TypeScript, ESBuild for production builds
- **Database**: Neon Database serverless PostgreSQL, connect-pg-simple for sessions

### Development Tools
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint, Prettier (implicit)
- **Build Optimization**: Vite with React plugin and runtime error overlay
- **Development Experience**: Hot module replacement, fast refresh

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Assets**: Static assets served from build output directory

### Environment Configuration
- **Development**: Local development with Vite dev server and tsx runtime
- **Production**: Compiled JavaScript with Node.js runtime
- **Environment Variables**: OpenAI API key, database URL, session configuration

### Hosting Requirements
- **Platform**: Node.js environment (Replit-optimized)
- **Database**: PostgreSQL-compatible database (Neon)
- **External APIs**: OpenAI API access
- **Static Assets**: Served through Express static middleware

### Scalability Considerations
- **Session Management**: Database-backed sessions for multi-instance deployment
- **API Rate Limiting**: Built-in consideration for OpenAI API limits
- **Database Optimization**: Drizzle ORM with migration support for schema changes
- **Caching Strategy**: React Query provides client-side caching for improved performance

## Notable Architectural Decisions

### Monorepo Structure
The application uses a monorepo approach with shared schemas between client and server, enabling type safety across the full stack while maintaining clear separation of concerns.

### Progressive Enhancement
The quiz system is designed to work without JavaScript for basic functionality, with enhanced interactivity when JavaScript is available.

### AI Integration Strategy
The OpenAI integration is designed as a separate service layer, making it easy to swap providers or add fallback mechanisms for improved reliability.

### Database Flexibility
While configured for PostgreSQL through Drizzle, the application currently uses in-memory storage for rapid development, with clear migration path to full database implementation.