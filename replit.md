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

## Recent Changes

✓ **Enhanced Registration Forms** (June 20, 2025)
  - Expanded country dropdown options from 5 to 195+ countries in both registry forms
  - Added comprehensive state lists for major countries (US, India, Canada, Australia, UK, Germany)
  - Implemented dependent dropdown functionality - states only appear after country selection
  - Rearranged field order to Country → State → City for both birth and current location
  - Form automatically clears state selection when country changes
  - Improved global accessibility and data consistency for international users

✓ **Temple Search on Home Page** (June 20, 2025)
  - Added temple search dropdown to hero section with dynamic title changes
  - Implemented real-time temple information display when temple is selected
  - Created temple information card showing deity, location, and description
  - Page title updates dynamically to show selected temple name

✓ **Temple Registry System Added** (June 19, 2025)
  - Created complete temple management system with registration and listing
  - Added temple database schema with location, contact, and linking capabilities
  - Built temple registration form with multi-choice temple connections
  - Implemented search and filter functionality for temple discovery
  - Added temple navigation menu with full Tamil translation support

✓ **Tamil Language Support Added** (June 19, 2025)
  - Integrated React i18next for internationalization
  - Added comprehensive Tamil translations for all UI elements
  - Created language switcher component with temple-themed styling
  - Updated all pages (Home, Members, Registry, WhatsApp, Temples) with translation support
  - Language preference persists in localStorage

✓ **Security Update** (June 19, 2025)
  - Upgraded Vite from 5.4.14 to 5.4.15 to fix CVE-2025-30208
  - Resolved path traversal vulnerability in development server

## Changelog

```
Changelog:
- June 19, 2025: Added Tamil language support and security updates
- June 14, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```