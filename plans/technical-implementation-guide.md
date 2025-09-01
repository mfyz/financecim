# Financecim - Technical Implementation Guide

## Project Overview

Based on the comprehensive prototype review and project plan analysis, this document outlines the detailed technical implementation strategy for Financecim - a personal finance application for tracking and categorizing transactions from multiple sources.

## Architecture Summary

**Application Type:** Full-stack web application with local-first approach  
**Frontend:** Next.js 15 with App Router, TypeScript, Tailwind CSS, shadcn/ui  
**Backend:** Next.js API routes with proper error handling  
**Database:** SQLite (local development) with Turso/libSQL (production)  
**ORM:** Drizzle ORM with migration-first approach  
**Authentication:** None - local-first single-user application  
**Icons:** Lucide React for consistent iconography  
**Deployment:** Vercel with proper environment configuration

## Prototype Analysis

The HTML/Tailwind prototypes demonstrate a polished, fully-functional UI with:
- ✅ Complete navigation system with mobile responsive design
- ✅ Dark/light theme toggle with localStorage persistence  
- ✅ Advanced transaction filtering and bulk operations
- ✅ Multi-step import flow with drag & drop file handling
- ✅ Dual auto-categorization rules system (Unit + Category)
- ✅ Inline editing capabilities with real-time updates
- ✅ Modal-based CRUD operations across all entities
- ✅ Comprehensive data visualization on dashboard

## Project Structure & Conventions

### Directory Structure
```
app/
├── api/              # API routes
│   ├── units/        # Units CRUD endpoints
│   ├── sources/      # Sources CRUD endpoints
│   ├── categories/   # Categories CRUD endpoints
│   ├── transactions/ # Transaction management endpoints
│   ├── rules/        # Auto-categorization rules
│   ├── import/       # Import flow endpoints
│   └── analytics/    # Dashboard analytics
├── units/           # Units management page
├── sources/         # Sources management page
├── categories/      # Categories management page
├── transactions/    # Transaction list and management
├── rules/           # Auto-categorization rules
├── import/          # Import flow pages
└── page.tsx         # Dashboard home page

components/          # Reusable React components
├── ui/             # shadcn/ui components
├── forms/          # Form components
├── tables/         # Table components
└── charts/         # Chart/visualization components

db/                 # Database schema and models
├── schema.ts       # Drizzle schema definitions
├── migrate.ts      # Migration runner
├── connection.ts   # Database connection utilities
└── seed.ts         # Development seed data

lib/                # Utility functions
├── validations.ts  # Zod validation schemas
├── utils.ts        # General utilities
└── tags.ts         # Tag manipulation utilities

__tests__/          # Unit tests (mirrors app structure)
├── api/            # API endpoint tests
├── components/     # Component tests
└── lib/            # Utility function tests

__e2e__/            # Playwright E2E tests (conservative approach)
└── critical-flows/ # Only critical user journeys
```

### Naming Conventions
- **Files**: kebab-case for pages, PascalCase for components
- **API Routes**: RESTful naming (`/api/transactions/[id]`)
- **Database**: snake_case for table and column names
- **TypeScript**: PascalCase for types/interfaces, camelCase for functions

## Database Schema & Data Model

### Core Tables

#### 1. Units
```sql
CREATE TABLE units (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL,
    icon TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Sources  
```sql
CREATE TABLE sources (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'credit_card', 'manual')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Categories
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    parent_category_id INTEGER REFERENCES categories(id),
    color TEXT NOT NULL,
    icon TEXT,
    monthly_budget DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Transactions
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    unit_id INTEGER REFERENCES units(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    source_category TEXT,
    category_id INTEGER REFERENCES categories(id),
    ignore BOOLEAN DEFAULT false,
    notes TEXT,
    tags TEXT, -- Comma-separated list of tags (e.g., "business,travel,client-meeting")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Unit Rules
```sql
CREATE TABLE unit_rules (
    id INTEGER PRIMARY KEY,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('source', 'description')),
    pattern TEXT NOT NULL,
    match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'starts_with', 'exact', 'regex')),
    unit_id INTEGER NOT NULL REFERENCES units(id),
    priority INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Category Rules  
```sql
CREATE TABLE category_rules (
    id INTEGER PRIMARY KEY,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('description', 'source_category')),
    pattern TEXT NOT NULL,
    match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'starts_with', 'exact', 'regex')),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    priority INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Import Log
```sql
CREATE TABLE import_log (
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_name TEXT,
    transactions_added INTEGER DEFAULT 0,
    transactions_skipped INTEGER DEFAULT 0,
    transactions_updated INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Phases

## Phase 1: Full Frontend Implementation (Week 1-3)

### 1.1 Project Initialization & Setup
- [ ] Create Next.js 15 project with TypeScript and App Router
- [ ] Configure Tailwind CSS and shadcn/ui components
- [ ] Setup project structure following conventions
- [ ] Configure TypeScript strict mode and ESLint
- [ ] Setup development scripts (dev, build, lint)

### 1.2 Design System & Core Components
- [ ] Convert prototype navigation to React component
- [ ] Implement dark/light theme toggle with localStorage
- [ ] Create reusable table components with sorting/filtering
- [ ] Build modal system for CRUD operations
- [ ] Implement form components with validation UI
- [ ] Setup Lucide React icons throughout

### 1.3 Mock Data & Type Definitions
- [ ] Create comprehensive TypeScript interfaces for all data models
- [ ] Implement mock data with "Test" prefix naming convention
- [ ] Setup mock API endpoints returning static JSON
- [ ] Define Zod schemas for validation (UI-only for now)

#### Mock Data Naming Convention
```typescript
// All mock data MUST use "Test" or "TEST" prefix
// Examples:
// - Units: "Test Personal", "Test Main Business"
// - Categories: "Test Groceries", "Test Transportation"
// - Sources: "Test Chase Bank", "Test Capital One"
// - Descriptions: "TEST WALMART PURCHASE #1234"
```

### 1.4 Screen-by-Screen Frontend Implementation

#### Dashboard (/)
- [ ] Convert index.html prototype to Next.js page
- [ ] Implement metric cards with mock data
- [ ] Create recent transactions widget
- [ ] Build category breakdown chart
- [ ] Add responsive mobile layout

#### Units Management (/units)
- [ ] Convert units.html to React components
- [ ] Implement grid layout with unit cards
- [ ] Create add/edit unit modals
- [ ] Add color picker and icon selection
- [ ] Wire up mock CRUD operations

#### Sources Management (/sources)
- [ ] Convert sources.html to React
- [ ] Build sources table with actions
- [ ] Create add/edit source modals
- [ ] Implement source type selection

#### Categories Management (/categories)
- [ ] Convert categories.html with hierarchy display
- [ ] Implement inline budget editing
- [ ] Create category modals with parent selection
- [ ] Add color and icon customization

#### Auto-Categorization Rules (/rules)
- [ ] Convert dual rules system UI
- [ ] Implement priority drag-and-drop (UI only)
- [ ] Create rule testing interface
- [ ] Build rule modals for both types

#### Transactions (/transactions)
- [ ] Convert complex filtering system
- [ ] Implement sortable table columns
- [ ] Build bulk operations UI
- [ ] Create inline editing for all fields
- [ ] Add tag input with autocomplete
- [ ] Implement advanced filters panel

#### Import Flow (/import)
- [ ] Convert 4-step import wizard
- [ ] Implement drag-and-drop file upload UI
- [ ] Create column mapping interface
- [ ] Build preview table with validation
- [ ] Design completion summary screen

### 1.5 Mock API Implementation
```typescript
// app/api/mock/route.ts pattern for all endpoints
// Returns static JSON with proper TypeScript types
// All data prefixed with "Test" for clarity

GET /api/units          → Returns mockUnits[]
GET /api/categories     → Returns mockCategories[]
GET /api/transactions   → Returns mockTransactions[]
POST/PUT/DELETE         → Returns success with mock response
```

## Phase 2: Backend Implementation - Database & Core CRUD (Week 4-5)

### 2.1 Database Setup
- [ ] Setup Drizzle ORM with SQLite for local development
- [ ] Create migration system with versioned schemas
- [ ] Implement all database tables with relationships
- [ ] Setup Turso/libSQL for production
- [ ] Create seed data (replacing mock data)
- [ ] Implement database connection utilities in `/db`

### 2.2 Replace Mock APIs with Real Implementation

#### Units Management
- [ ] Replace mock `/api/units` with database operations
- [ ] Implement real CRUD operations with Drizzle
- [ ] Add proper error handling and validation
- [ ] Remove "Test" prefix from seed data

#### Sources Management  
- [ ] Replace mock `/api/sources` with database operations
- [ ] Implement source type validation
- [ ] Add relationship constraints

#### Categories Management
- [ ] Replace mock `/api/categories` with database operations
- [ ] Implement parent-child relationships
- [ ] Add budget field handling

#### Tags System
- [ ] Implement tag utilities in `/lib/tags.ts`
- [ ] Add tag parsing/validation to transaction endpoints
- [ ] Create tag suggestions endpoint from real data

## Phase 3: Auto-Categorization System (Week 5-6)

### 3.1 Dual Rules Engine
**Screens:** `/rules`
- [x] Unit Rules: Source-based and description-based rules
- [x] Category Rules: Description and source category rules
- [x] Priority-based rule ordering with drag & drop
- [x] Rule testing interface with live preview
- [x] Bulk rule management operations

**Features:**
- [x] Multiple match types: contains, starts_with, exact, regex
- [x] Rule precedence system based on priority
- [x] Enable/disable rules functionality
- [x] Rule testing with sample data

**API Endpoints:**
- `GET /api/rules/units` - List unit rules
- `POST /api/rules/units` - Create unit rule
- `PUT /api/rules/units/[id]` - Update unit rule
- `DELETE /api/rules/units/[id]` - Delete unit rule
- `GET /api/rules/categories` - List category rules
- `POST /api/rules/categories` - Create category rule
- `PUT /api/rules/categories/[id]` - Update category rule
- `DELETE /api/rules/categories/[id]` - Delete category rule
- `POST /api/rules/test` - Test rule against sample data

### 3.2 Auto-Categorization Engine
**Core Logic:**
```typescript
interface AutoCategorizationEngine {
  applyUnitRules(transaction: Transaction): string | null;
  applyCategoryRules(transaction: Transaction): number | null;
  processTransaction(transaction: Transaction): ProcessedTransaction;
  batchProcessTransactions(transactions: Transaction[]): ProcessedTransaction[];
}
```

**Implementation Priority:**
1. Rule matching algorithm with regex support
2. Priority-based rule execution
3. Performance optimization for bulk processing
4. Caching system for rule evaluation

## Phase 4: Transaction Management (Week 7-8)

### 4.1 Advanced Transaction Interface
**Screens:** `/transactions`
- [x] Comprehensive filtering system:
  - Date range picker with presets
  - Unit, source, category filters
  - Amount range filtering
  - Search by description
  - Show/hide ignored transactions
  - **Tag-based filtering and search**
- [x] Sortable columns (date, amount, description)
- [x] Bulk operations:
  - Select multiple transactions
  - Bulk unit assignment  
  - Bulk categorization
  - Bulk ignore/unignore
  - **Bulk tag assignment/removal**
- [x] Inline editing for all editable fields
- [x] Real-time filtering and search
- [ ] **Tag management per transaction:**
  - Visual tag indicators with colors
  - Add/remove tags inline
  - Tag suggestions based on description/category
  - Tag autocomplete functionality

**API Endpoints:**
- `GET /api/transactions` - List transactions with filtering (includes tags)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction
- `PATCH /api/transactions/bulk` - Bulk update operations
- `PATCH /api/transactions/[id]/tags` - Update tags for transaction
- `PATCH /api/transactions/bulk/tags` - Bulk tag operations (add/remove tags)

### 4.2 Transaction Processing
**Features:**
- Automatic unit assignment via rules
- Automatic categorization via rules
- Duplicate detection and prevention
- Data validation and sanitization
- Transaction history tracking

## Phase 5: Import System (Week 9-10)

### 5.1 Multi-Step Import Flow
**Screens:** `/import` (4-step process)
- [x] **Step 1 - Upload:** Drag & drop multiple CSV files
- [x] **Step 2 - Map Columns:** Auto-detection with manual override
- [x] **Step 3 - Preview:** Validation with auto-categorization preview
- [x] **Step 4 - Complete:** Results summary with statistics

**Features:**
- [x] Multiple CSV file support with validation
- [x] Column mapping with templates
- [x] Real-time preview with error detection
- [x] Progress tracking and file processing status
- [x] Import history logging

**API Endpoints:**
- `POST /api/import/upload` - Handle file upload
- `POST /api/import/analyze` - Analyze CSV structure
- `POST /api/import/preview` - Generate preview with validation
- `POST /api/import/execute` - Execute import with logging
- `GET /api/import/history` - List import history

### 5.2 Import Processing Engine
**Core Features:**
- CSV parsing with multiple format support
- Data validation and transformation
- Duplicate detection across sources
- Batch processing for large files
- Error handling and rollback capabilities
- Auto-categorization during import

## Phase 6: Dashboard & Analytics (Week 11-12)

### 6.1 Financial Dashboard
**Screens:** `/` (Dashboard)
- [x] Key metrics cards (spending, income, balance)
- [x] Recent transactions widget
- [x] Category breakdown with charts
- [x] Spending trends visualization
- [x] Monthly comparison data

**API Endpoints:**
- `GET /api/analytics/summary` - Dashboard summary data
- `GET /api/analytics/trends` - Spending trends
- `GET /api/analytics/categories` - Category breakdown
- `GET /api/analytics/monthly` - Monthly comparisons

### 6.2 Advanced Analytics (Future)
- Custom date range reports
- Unit-wise financial analysis
- Budget vs actual spending
- Export functionality (CSV, PDF)
- Recurring transaction detection

## Technical Implementation Details

### 6.3 State Management
**Approach:** React Server Components + Client state
- Server Components for data fetching
- Client state for UI interactions
- Optimistic updates for better UX
- Real-time data synchronization

### 6.4 Data Validation
**Schema Validation:**
```typescript
// Using Zod for runtime validation
const TransactionSchema = z.object({
  source_id: z.number(),
  unit_id: z.number().optional(),
  date: z.date(),
  description: z.string().min(1).max(255),
  amount: z.number(),
  source_category: z.string().optional(),
  category_id: z.number().optional(),
  ignore: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z.string().optional().refine(
    (tags) => !tags || tags.split(',').every(tag => tag.trim().length > 0),
    "All tags must be non-empty"
  )
});

const TagSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-_]+$/, "Tags can only contain letters, numbers, hyphens, and underscores"),
});
```

### 6.5 Performance Considerations
- Database indexing on frequently queried columns
- Pagination for large transaction lists  
- Debounced search and filtering
- Lazy loading for large datasets
- Optimized SQL queries with proper joins

### 6.6 Security & Data Handling
- Input sanitization and validation
- SQL injection prevention via parameterized queries
- File upload security (type validation, size limits)
- Data backup and recovery procedures
- Privacy-focused design (local-first approach)

## UI/UX Implementation

### 6.7 Design System
- **Colors:** Tailwind CSS with custom color palette
- **Typography:** System fonts with proper hierarchy
- **Components:** shadcn/ui with custom extensions
- **Icons:** Lucide React for consistent iconography
- **Themes:** Dark/light mode with system preference detection

### 6.8 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface elements
- Optimized table layouts for mobile
- Collapsible navigation for smaller screens

### 6.9 User Experience Features
- Loading states and skeleton screens
- Toast notifications for actions
- Confirmation dialogs for destructive actions
- Keyboard shortcuts for power users
- Undo/redo functionality for bulk operations

## Testing Strategy

### 6.10 Testing Philosophy (Conservative Approach)
**Unit Testing Focus:** Prioritize unit tests over E2E tests for maintainability

#### Unit Testing with Jest
- **Framework:** Jest with TypeScript support
- **Coverage:** Focus on business logic and critical paths
- **Location:** `__tests__/` directory mirroring source structure
- **Naming:** `.test.ts[x]` file naming convention
- **Target:** Core utilities, API logic, data transformations

#### E2E Testing with Playwright (Minimal)
- **Conservative approach:** Only test critical user journeys
- **Critical flows only:**
  - Transaction import flow (upload → map → preview → complete)
  - Auto-categorization workflow
  - Transaction filtering and bulk operations
- **Location:** `__e2e__/critical-flows/` directory
- **Maintenance:** Keep E2E tests minimal to reduce maintenance overhead

#### Test Verification Protocol
Always verify test success with exit codes:
```bash
npm run test:unit && echo "EXIT_CODE=0 TESTS_PASSED" || echo "EXIT_CODE=$? TESTS_FAILED"
npm run test:e2e && echo "EXIT_CODE=0 E2E_PASSED" || echo "EXIT_CODE=$? E2E_FAILED"
```

### 6.11 Quality Assurance Standards
- **TypeScript strict mode** enabled (no `any` types)
- **ESLint** for code quality and consistency
- **Migration testing** before database schema changes
- **API documentation** with OpenAPI/Swagger (future enhancement)
- **Environment-based testing** with mock configurations

## Deployment & DevOps

### 6.12 Environment Configuration

#### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL="file:./dev.db"                    # Local SQLite
TURSO_DATABASE_URL="libsql://..."              # Production Turso
TURSO_AUTH_TOKEN="..."                         # Turso authentication

# Application Configuration
NODE_ENV="development"                         # Environment mode
NEXT_PUBLIC_APP_URL="http://localhost:3000"   # Base URL

# No authentication needed - single-user local application
```

#### Development vs Production
- **Local Development:** SQLite file database
- **Production:** Turso/libSQL with edge replication
- **Migration Strategy:** Run migrations before deployment
- **Environment Validation:** Validate required variables on startup

### 6.13 Development Workflow Standards

#### Feature Development Process
1. **Plan:** Create detailed specifications and database migrations
2. **Test:** Write unit tests before implementation (TDD approach)
3. **Implement:** Follow established patterns and TypeScript strict mode
4. **Verify:** Run tests with exit code verification
5. **Migrate:** Test database migrations on staging
6. **Document:** Update API documentation if needed

#### Code Quality Standards
- **TypeScript Strict Mode:** No `any` types allowed
- **Consistent Error Handling:** Standardized API error responses
- **Migration-First Database:** All schema changes through migrations
- **Performance Focus:** Optimize database queries and bundle size

### 6.14 Production Deployment Strategy
- **Platform:** Vercel for Next.js optimization and edge functions
- **Database:** Turso for SQLite with global edge replication
- **Monitoring:** Built-in Vercel analytics and error tracking
- **Backups:** Automated Turso database backups
- **Security:** HTTPS enforcement and secure environment variables
- **Performance:** Next.js built-in optimizations and bundle analysis

## Success Metrics & KPIs

### 6.14 Technical KPIs
- Page load times < 2 seconds
- Auto-categorization accuracy > 85%
- Import processing < 1 minute for 1000+ transactions
- Zero data loss during operations
- 99.9% uptime

### 6.15 User Experience KPIs
- Transaction categorization time < 30 seconds
- Import flow completion rate > 90%
- User satisfaction with categorization accuracy
- Feature adoption rates
- Error rate < 1% for critical operations

## Future Enhancements

### 6.16 Planned Features (Phase 2)
- Bank API integration (Plaid, Open Banking)
- Recurring transaction detection and management
- Budget tracking and alerts
- Multi-user support with sharing
- Mobile application (React Native)
- Advanced reporting and visualizations
- Export functionality (multiple formats)
- Receipt attachment system

### 6.17 Technical Improvements
- Real-time collaboration features
- Offline-first capabilities with sync
- Advanced caching strategies
- Machine learning for better categorization
- API for third-party integrations
- Webhook system for external notifications

## Conclusion

This technical implementation guide provides a comprehensive roadmap for building Financecim based on the proven prototypes and well-defined requirements. The phased approach ensures manageable development cycles while maintaining focus on core user needs.

The combination of modern web technologies (Next.js, TypeScript, Tailwind) with a robust data model and user-centric design will deliver a powerful yet intuitive personal finance management solution.

Key success factors:
1. **Prototype-driven development** - UI/UX already validated
2. **Incremental delivery** - Core features first, enhancements later  
3. **Performance focus** - Fast, responsive user experience
4. **Data integrity** - Reliable transaction processing and categorization
5. **User feedback integration** - Continuous improvement based on usage patterns

The estimated timeline for Phase 1 implementation is 12 weeks with a team of 2-3 developers, resulting in a production-ready application with all core features functional.