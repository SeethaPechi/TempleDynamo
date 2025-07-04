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
- **Relationships Table**: Family relationships between members with created_at timestamp
- **Temples Table**: Temple information including location, contact details, and deity information
- **Users Table**: Authentication (legacy compatibility)

## Key Components

### Member Management
- Member registration with comprehensive form validation
- Search functionality by name, email, phone, city, and state
- Pagination support for large member lists
- Family relationship tracking with filtered display (no duplicates)
- Auto-save functionality across all forms with localStorage persistence
- Temple association support (optional field)

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
- Family Tree visualization with generational layout and relationship filtering
- Enhanced member detail cards with comprehensive information display

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

✓ **Comprehensive Color Coding System Implementation** (June 30, 2025)
  - Implemented gender-based color coding: Male members in blue, Female members in pink
  - Created unique color scheme for each relationship type (Paternal Grandfather: Dark blue, Maternal Grandfather: Velvet purple, etc.)
  - Applied color coding throughout member cards, relationship badges, and family tree displays
  - Created shared color utility library for consistent styling across all components
  - Updated member list page to display gender-based background colors and icons
  - Enhanced visual distinction between different family relationships with comprehensive color palette

✓ **Dynamic Language Transformation for Form Data and Backend Dates** (June 29, 2025)
  - Implemented comprehensive i18n utilities for dynamic form data transformation
  - Added localized date formatting with language-specific formats and relative time
  - Enhanced translation files with complete form field translations (gender, marital status, relationships)
  - Integrated language transformation across family relationship displays and member data
  - Form data now automatically transforms based on current language selection
  - Backend dates display in localized format when language is switched
  - Relationship types, marital status, and gender values show in selected language
  - Added comprehensive Tamil translations for all form elements and relationship types

✓ **Gender Field Implementation and Database Cleanup** (June 27, 2025)
  - Added optional Gender field (Male/Female) to member registry database schema and forms
  - Updated Edit Member Details form to include gender dropdown with auto-save functionality
  - Created gender database column with proper enum constraints for Male/Female values
  - Cleaned up all database tables (members, relationships, temples) and reset ID sequences to start from 1
  - Gender field includes proper form validation and placeholder text for user experience
  - Both member registry and member details editing now support gender selection

✓ **Comprehensive Feature Implementation and Database Cleanup** (June 27, 2025)
  - Created new Temple Members page with grouping by temple and clickable location counters
  - Made phone number optional in member registry schema and forms
  - Implemented relationship counters in Family Tree with clickable functionality to view members by type
  - Added relationship counters component with color-coded badges and member detail modals
  - Fixed circular relationship display issues by removing extended connections
  - Added Temple Members navigation link for easy access to temple-based member grouping
  - Enhanced member filtering by location with clickable statistics
  - Implemented comprehensive member search across name, email, and phone fields

✓ **Complete Temple Management with Auto-Save and External Links** (June 26, 2025)
  - Implemented comprehensive auto-save functionality for all temple edit form fields
  - Added external link support (Google Maps, Website, Wikipedia) that open directly when clicked
  - Auto-save to localStorage on field blur events for data protection
  - Auto-submit to database only when closing edit modal (prevents interruption during photo uploads)
  - Form data persists in localStorage and restores when reopening edit modal
  - Complete Tamil translations for all temple management features
  - External link buttons display in temple cards with proper color-coded icons
  - Photo upload protection - modal won't close during image upload process
  - Form validation and error handling maintained with auto-save functionality

✓ **Family Tree Filtering and Display Improvements** (June 26, 2025)
  - Fixed Family Tree database error by adding missing created_at column to relationships table
  - Implemented proper relationship filtering to show only selected member's direct relationships
  - Eliminated duplicate entries in Family Tree by filtering based on memberId
  - Added "Related Name" column showing relationship descriptions (e.g., "T.V.Solairaja is the father of Venkat Thirupathy")
  - Updated all relationship counts and statistics to use filtered data instead of all relationships
  - Enhanced member display with comprehensive contact information (phone, email, location, marital status)
  - Fixed JavaScript errors related to undefined filteredMemberRelationships variable
  - Improved Family Tree visualization to display clean, focused relationships without nested duplicates
  - Updated dependency @replit/vite-plugin-cartographer to latest version

✓ **Complete Feature Implementation and Bug Fixes** (June 24, 2025)
  - Fixed critical runtime errors (Bell import, updateMutation reference, useEffect import)
  - Added comprehensive temple edit functionality on home page with full mutation support
  - Implemented temple selection dropdown in member registry (optional field)
  - Added universal auto-save functionality with onBlur triggers and localStorage persistence
  - Fixed family tree relationships display with proper member ID mapping
  - Allow duplicate phone and email addresses in member registration (removed uniqueness constraints)
  - Enhanced home page with dynamic temple-specific content and member counter
  - Added temple selection support in database schema with proper nullable handling
  - Fixed Select.Item empty value error with proper "none" fallback value
  - All autosave functionality now works across registry, member details, and temple forms

✓ **Fixed Temple Registration and Image Display Issues** (June 24, 2025)
  - Fixed PayloadTooLargeError by increasing Express server payload limit to 50MB
  - Added image compression and resizing to limit uploads to 800px max dimension
  - Added 5MB file size limit with user-friendly error messages
  - Improved temple image display on home page with proper sizing and borders
  - Images now automatically compress to JPEG with 80% quality for optimal loading
  - Enhanced image error handling with fallback temple icon SVG
  - Fixed all runtime errors related to temple registration functionality

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
- June 26, 2025: Fixed Family Tree filtering and database schema updates
- June 24, 2025: Enhanced temple functionality and auto-save features
- June 23, 2025: Comprehensive family tree visualization improvements
- June 22, 2025: Universal auto-save and mobile responsiveness
- June 21, 2025: Complete member management and family relationships
- June 20, 2025: Enhanced registration forms and temple search
- June 19, 2025: Added Tamil language support and security updates
- June 14, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```