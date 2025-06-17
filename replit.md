# replit.md

## Overview

This is a full-stack temple community management system built with React, Express.js, and PostgreSQL. The application serves as a member registry and communication platform for Sri Lakshmi Temple, allowing community members to register, search for other members, and manage WhatsApp communications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom temple-themed color palette
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development**: TSX for TypeScript execution

### Database Schema
- **Members Table**: Core member information including personal details and location data
- **Relationships Table**: Family relationships between members
- **Users Table**: Authentication (legacy compatibility)

## Key Components

### Member Management
- Member registration with comprehensive form validation
- Search functionality by name, email, phone, city, and state
- Pagination support for large member lists
- Family relationship tracking

### WhatsApp Integration
- Template-based message system for community communications
- Bulk messaging capabilities
- QR code generation for WhatsApp links
- Pre-built templates for events, festivals, donations, and schedules

### UI Components
- Comprehensive component library using shadcn/ui
- Custom temple-themed design system with saffron and gold colors
- Responsive design with mobile-first approach
- Accessible components following ARIA guidelines

## Data Flow

1. **Registration Flow**: User fills form → Client validation → Server validation → Database insertion → Success confirmation
2. **Search Flow**: User enters criteria → Client debounced request → Server query with filters → Paginated results
3. **WhatsApp Flow**: User selects template → Fills variables → Server generates URLs → Bulk WhatsApp link creation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database queries
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form management
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tailwindcss**: Styling
- **tsx**: TypeScript execution

## Deployment Strategy

### Development
- **Environment**: Replit with Node.js 20 and PostgreSQL 16
- **Dev Server**: Runs on port 5000 with Vite HMR
- **Database**: Environment variable `DATABASE_URL` required

### Production Build
- **Build Process**: Vite builds client assets, esbuild bundles server
- **Output**: Static assets in `dist/public`, server bundle in `dist/index.js`
- **Deployment**: Autoscale deployment target on Replit

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific identifier for development features

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```