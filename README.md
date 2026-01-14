# CELLTECH - Trailer Management Application

Modern web application for managing trailer orders, schedules, inventory, and contacts.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui & Radix UI
- **Icons**: Lucide Icons
- **State Management**: Zustand (UI state only)
- **Package Manager**: pnpm

## Phase 1: UI-Only Migration (Current)

This phase implements a complete UI-only version of the application with:

- ✅ Full navigation system with sidebar and dropdown menus
- ✅ All 10 main pages with complete UI structure
- ✅ Functional tabs and filters (UI state only)
- ✅ Data tables with placeholder data
- ✅ Responsive design (desktop-first, mobile usable)
- ✅ Consistent design system following LVIT guidelines

### Installed Shadcn Blocks

- Application Shell structure (manually implemented based on application-shell-01 pattern)
- DataTable components (using TanStack Table)
- Profile Dropdown (from shadcn-studio)

### Pages Implemented

1. **Trailer Orders** (`/app/trailer-orders`) - Order Book with filters, tabs, and pagination
2. **Dashboard** (`/app/dashboard`) - Status overview with filter tabs
3. **Build Schedule** (`/app/build-schedule`) - Build tracking table
4. **Ship Schedule** (`/app/ship-schedule`) - Calendar view with week/month toggle
5. **Contacts**
   - Dealers (`/app/contacts/dealers`)
   - Shipping Companies (`/app/contacts/shipping-companies`)
   - Vendors (`/app/contacts/vendors`)
6. **Inventory** (`/app/inventory`) - Parts management with collapsible groups
7. **Pricing** (`/app/pricing`) - Pricing management with expandable groups
8. **Settings** (`/app/settings`) - Models configuration
9. **Reporting** (`/app/reporting`) - Placeholder page

### Project Structure

```
src/
├── app/
│   ├── (app)/              # App route group with shell layout
│   │   ├── layout.tsx      # App shell layout
│   │   ├── trailer-orders/
│   │   ├── dashboard/
│   │   ├── build-schedule/
│   │   ├── ship-schedule/
│   │   ├── contacts/
│   │   ├── inventory/
│   │   ├── pricing/
│   │   ├── settings/
│   │   └── reporting/
│   ├── auth/               # Auth placeholder pages
│   │   └── login/
│   ├── api/                # API route stubs (Phase 2)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Root redirect
├── components/
│   ├── app-shell/          # App shell components
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   └── celltech-logo.tsx
│   ├── shared/             # Shared components
│   │   ├── page-header.tsx
│   │   ├── filter-bar.tsx
│   │   └── empty-state.tsx
│   ├── trailer-orders/     # Feature components
│   ├── dashboard/
│   ├── build-schedule/
│   ├── ship-schedule/
│   ├── contacts/
│   ├── inventory/
│   ├── pricing/
│   ├── settings/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── navigation.ts       # Navigation configuration
│   ├── utils.ts            # Utility functions
│   ├── services/           # Service layer (Phase 2)
│   ├── repositories/       # Repository layer (Phase 2)
│   ├── validators/         # Validation schemas (Phase 2)
│   └── supabase/           # Supabase client (Phase 2)
├── stores/
│   └── ui-store.ts         # Zustand UI state store
└── types/
    └── index.ts            # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Navigation

The application features a fully functional sidebar navigation with:

- Main navigation items (Trailer Orders, Dashboard, Build Schedule, etc.)
- Collapsible Contacts dropdown (Dealers, Shipping Companies, Vendors)
- Active route highlighting
- User profile section at bottom
- Status indicator

All navigation uses Next.js Link components and is fully functional.

## State Management

UI state is managed with Zustand:

- Sidebar open/collapsed state
- Contacts dropdown state
- Page-specific filter states (tabs, toggles)
- View toggles (e.g., Week/Month for Ship Schedule)

## Phase 2: Database & API Integration (Planned)

Phase 2 will add:

- Supabase PostgreSQL database
- API routes with real data
- Authentication (Supabase Auth)
- Data validation (Zod schemas)
- Service layer for business logic
- Repository layer for database access
- Real-time subscriptions (if needed)
- File upload handling
- Export functionality (CSV, PDF)

### API Routes (Stubs Created)

All API routes are created as stubs in `/src/app/api/`:

- `/api/trailer-orders`
- `/api/dashboard`
- `/api/build-schedule`
- `/api/ship-schedule`
- `/api/contacts/dealers`
- `/api/contacts/shipping-companies`
- `/api/contacts/vendors`
- `/api/inventory`
- `/api/pricing`
- `/api/settings`

### Backend Structure (Prepared)

Directories created with README files:

- `/src/lib/services/` - Business logic layer
- `/src/lib/repositories/` - Database access layer
- `/src/lib/validators/` - Zod validation schemas
- `/src/lib/supabase/` - Supabase client configuration

## Design System

The application follows LVIT Frontend Guidelines:

- **Containers**: `rounded-2xl`, no shadow, proper padding
- **Buttons**: Standard shadcn buttons
- **Colors**: Based on zinc palette with dark mode support
- **Typography**: Consistent font sizing and weights
- **Spacing**: Consistent padding and margins

## License

Private
