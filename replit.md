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

✓ **Complete System Implementation with All Requirements** (June 24, 2025)
  - Fixed all temple registry auto-save runtime errors by replacing autoSaveDraft with localStorage
  - Allowed duplicate phone and email addresses in member registry (removed uniqueness checks)
  - Added optional temple selection dropdown to member registry form with proper non-empty values
  - Enhanced home page with comprehensive temple information display including images and member counter
  - Updated home page title to "Welcome to Our [Temple Name]" when temple is selected
  - Added default temple image fallback with SVG placeholder when no image is available
  - Fixed Select Item value prop errors by using "none" instead of empty strings
  - Implemented auto-save functionality across all forms without runtime errors
  - Enhanced family tree relationships display with improved error handling and logging
  - Confirmed state selection by country works correctly across all forms

✓ **Enhanced Family Tree Visualization with Comprehensive Relationship Display** (June 23, 2025)
  - Created comprehensive family tree visualization with generational layout organization
  - Added "All Relations" tab showing complete family connections when member is clicked
  - Implemented relationship grouping by type (parents, siblings, children, etc.)
  - Added extended family network discovery showing 2nd-degree connections
  - Created color-coded relationship badges for easy identification
  - Added interactive member cards with contact information and navigation
  - Implemented family network analysis with cluster detection and statistics
  - Enhanced member details page with tabbed family information display
  - Added family statistics dashboard showing connections and relationship types
  - Fixed JavaScript errors and improved overall user experience

✓ **Universal Auto-Save Functionality** (June 22, 2025)
  - Implemented auto-save functionality across all forms (Member Registry, Temple Registry, Member Details)
  - Added draft persistence using localStorage for form data protection
  - Auto-save triggers on field blur events for all text inputs
  - Auto-save triggers on value change for all dropdown selections
  - Forms automatically restore draft data when users return to incomplete forms
  - Draft data is cleared when forms are successfully submitted
  - Enhanced user experience with seamless data persistence across all screens
  - Prevents data loss from accidental navigation or browser closure

✓ **Mobile-Responsive Member Details Page Redesign** (June 22, 2025)
  - Completely redesigned "Edit Member Details" modal for mobile responsiveness
  - Implemented responsive grid layouts (1 column mobile → 2-3 columns desktop)
  - Added sticky headers and action buttons for better mobile UX
  - Optimized button sizes and text for different screen sizes
  - Enhanced touch targets with proper spacing and sizing (h-10 sm:h-11)
  - Improved text wrapping and overflow handling for long names/emails
  - Made all form fields and dropdowns mobile-friendly
  - Updated "Manage Relatives" modal with responsive design
  - Enhanced member profile card layout for mobile devices

✓ **Complete Member Management System** (June 21, 2025)
  - Built comprehensive family tree management system with relationship tracking
  - Created dedicated Family Tree page with member search and selection
  - Implemented relationship creation with 12 different relationship types
  - Added clickable member names displaying full member details and family relationships
  - Created individual member detail pages showing complete family connections
  - Enhanced registry search to display member names prominently (bold, large text)
  - Added full CRUD operations: Create, Read, Update, Delete members
  - Implemented member editing with complete form validation and country/state dependencies
  - Added member deletion with relationship cleanup and confirmation dialogs
  - Fixed navigation routing issues and import errors
  - Sample family relationship created: Sona Venkat as child of Venkat Thirupathy

✓ **Comprehensive Relatives Management** (June 21, 2025)
  - Added "Manage Relatives" button to member detail pages
  - Implemented full relative management system allowing 5+ family connections
  - Created searchable member database for adding new relationships
  - Added relationship deletion with confirmation
  - Enhanced member search with name, email, and phone filtering
  - Built comprehensive relationship tracking with 12 relationship types
  - Added direct navigation to related member profiles

✓ **Enhanced Member Registry with Marital Status** (June 21, 2025)
  - Added marital status field with options: Single, Married, Divorced, Widowed
  - Added spouse name field next to father and mother names
  - Updated registry form with 3-column layout for parents and spouse
  - Enhanced member display to show marital status and spouse information
  - Updated database schema to support new fields
  - Form automatically clears spouse name when marital status is not "Married"

✓ **Critical Member Display Fix** (June 21, 2025)
  - Fixed persistent "Member #1" display issue by removing React component dependencies
  - Implemented direct HTML rendering with inline styles for name display
  - Restored Search button functionality alongside Clear Filters
  - Enhanced search functionality to work across name, email, and phone fields
  - User data preserved: Venkat Thirupathy profile remains intact in database

## Previous Changes

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