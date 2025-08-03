# replit.md

## Overview
This is a full-stack temple community management system designed for Sri Lakshmi Temple. It functions as a member registry and communication platform, enabling community members to register, search for others, manage family relationships, and facilitate WhatsApp-based communications. The project aims to provide a centralized, user-friendly system for temple administration and community engagement.

**Recent Completion (August 2025)**: Comprehensive authentication and role-based access control system successfully implemented and tested. All routes are now protected with cookie-based session management, supporting three user roles (System Admin, Temple Admin, Temple Guest) with appropriate permissions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Framework**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom temple-themed color palette (saffron and gold)
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite
- **UI/UX Decisions**: Responsive design (mobile-first), accessible components (ARIA guidelines), family tree visualization with circular nodes and hierarchical layout, comprehensive component library, dynamic language switching.

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Session Management**: connect-pg-simple (PostgreSQL session storage)
- **Development**: TSX

### Database Schema
- **Members**: Core member information (personal details, location, gender, marital status).
- **Relationships**: Family relationships between members.
- **Temples**: Temple information (location, contact, deity).
- **Users**: Authentication (legacy compatibility).

### Key Features
- **Authentication & Security**: Cookie-based session management with role-based access control (System Admin, Temple Admin, Temple Guest). All pages except home require authentication. Bilingual login interface with Tamil support.
- **Member Management**: Registration, search (by name, email, phone, city, state), pagination, family relationship tracking, auto-save with localStorage, optional temple association.
- **Family Tree**: Elegant circular visualization, generational layout, 12 relationship types, direct navigation to member details, family story export (Markdown).
- **WhatsApp Integration**: Template-based messaging, bulk capabilities, QR code generation, pre-built templates.
- **Temple Management**: Registration, listing, search, dynamic city/state filtering, auto-save for temple forms, external link support (Google Maps, Website, Wikipedia), image uploads with compression.
- **Internationalization**: Comprehensive Tamil language support with dynamic language switching for UI and form data.
- **Data Flow**: Structured flows for registration, search, and WhatsApp message generation.
- **Deployment**: Optimized for Replit with autoscale target, supports environment variables for configuration.

## External Dependencies

- `@neondatabase/serverless`: PostgreSQL database connection.
- `drizzle-orm`: Type-safe database queries.
- `@tanstack/react-query`: Server state management.
- `wouter`: Lightweight client-side routing.
- `@radix-ui/*`: Accessible UI primitives.
- `react-hook-form`: Form management.
- `zod`: Schema validation.
- `tailwindcss`: CSS framework.
- `vite`: Build tool.
- `tsx`: TypeScript execution.
- `i18next` / `react-i18next`: Internationalization.
```