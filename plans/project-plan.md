# Financecim - Project Plan

## Overview
A minimal personal finance application for tracking and categorizing transactions from multiple sources.

## Core Objectives
- Import transactions from various financial sources
- Automatically categorize transactions using mapping rules
- Allow manual categorization and transaction management
- Provide clear visibility into spending patterns

## Data Model

### 1. Categories
- **Purpose**: Define spending categories for transaction classification
- **Fields**:
  - id (unique identifier)
  - name (e.g., "Groceries", "Transportation", "Entertainment")
  - parent_category_id (optional, for subcategories)
  - color (for UI visualization)
  - icon (optional)
  - monthlyBudget (optional, decimal for budget tracking)
  - created_at
  - updated_at

### 2. Sources
- **Purpose**: Represent different financial institutions or import sources
- **Fields**:
  - id
  - name (e.g., "Chase Bank", "Capital One")
  - type (bank, credit_card, manual)
  - created_at
  - updated_at

### 3. Auto-Categorization Rules
- **Purpose**: Automatically categorize transactions using dual rule systems
- **Unit Rules**: Assign transactions to business units/entities
  - id
  - rule_type (source, description)
  - pattern (text to match)
  - match_type (contains, starts_with, exact, regex)
  - unit_id (FK to units)
  - priority (for rule precedence)
  - active (boolean)
  - created_at
  - updated_at
- **Category Rules**: Assign transactions to spending categories
  - id
  - rule_type (description, source_category)
  - pattern (text to match)
  - match_type (contains, starts_with, exact, regex)
  - category_id (FK to categories)
  - priority (for rule precedence)
  - active (boolean)
  - created_at
  - updated_at

### 4. Units
- **Purpose**: Top-level categorization for business units/entities (e.g., "Main Business", "Side Hustle", "Personal")
- **Fields**:
  - id
  - name (e.g., "Marketing Agency", "Freelance Design", "Personal")
  - color (for UI visualization)
  - icon (optional)
  - active (boolean)
  - created_at
  - updated_at

### 5. Transactions
- **Purpose**: Core transaction data
- **Fields**:
  - id
  - source_id (FK to sources)
  - unit_id (FK to units, user-editable)
  - date (transaction date)
  - description (transaction description)
  - amount (positive for income, negative for expenses)
  - source_category (original category from source)
  - category_id (FK to categories, user-editable)
  - ignore (boolean, user-editable)
  - notes (text, user-editable)
  - created_at
  - updated_at

### 6. Import Log
- **Purpose**: Track import history and results
- **Fields**:
  - id
  - source_id (FK to sources)
  - import_date (when the import was performed)
  - file_name (optional, for file-based imports)
  - transactions_added (count of new transactions)
  - transactions_skipped (count of duplicates/ignored)
  - transactions_updated (count of updated transactions)
  - status (success, partial, failed)
  - error_message (optional, for failures)
  - metadata (JSON, for additional import details)
  - created_at

## Technology Stack

### Confirmed Stack
- **Framework**: Next.js with TypeScript
- **Database**: SQLite (local) with Turso/libSQL (remote)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Deployment**: TBD

## Phase 1: Core CRUD & Transactions

### Implementation Order

#### 1. Units Management
- List view with add/edit/delete
- Simple form for unit configuration (name, color, icon)
- Table display with actions
- Default units: "Personal", "Main Business"

#### 2. Sources Management
- List view with add/edit/delete
- Simple form for source configuration
- Table display with actions

#### 3. Categories Management
- List of categories with CRUD operations
- Add/edit category form with monthly budget input
- Parent category support for hierarchy
- Color picker for visualization
- Monthly Budget column with inline editing in table view

#### 4. Auto-Categorization Rules (Enhanced Dual System)
- **Unit Rules**: Assign transactions to business units/entities
  - Rules list with enable/disable toggle
  - Add/edit rule form with rule type (source, description)
  - Pattern matching with multiple types (contains, starts_with, exact)
  - Unit selection dropdown
  - Priority ordering with drag & drop
- **Category Rules**: Assign transactions to spending categories
  - Rules list with enable/disable toggle  
  - Add/edit rule form with rule type (description, source_category)
  - Pattern matching with multiple types (contains, starts_with, exact)
  - Category selection dropdown
  - Priority ordering with drag & drop
  - Source category fields as text input (not dropdown)

#### 5. Transactions Screen
- **Main Features**:
  - Sortable columns (date, amount, description, category)
  - Filters:
    - Date range picker
    - Unit filter
    - Source filter
    - Category filter
    - Amount range
    - Ignored/active toggle
  - Search by description
  - Pagination or infinite scroll
- **Inline Editing**:
  - Unit dropdown
  - Category dropdown
  - Ignore checkbox
  - Notes field
- **Bulk Actions**:
  - Select multiple transactions
  - Bulk assign unit
  - Bulk categorize
  - Bulk ignore/unignore

#### 6. Import Flow
- **Step 1: Upload**
  - Drag & drop CSV files (supports multiple files)
  - Select source for import
  - Import History button for viewing past imports
  - Note: Multiple CSVs must have same column structure
- **Step 2: Column Mapping**
  - Auto-detect columns
  - Map CSV columns to transaction fields
  - Save mapping as template (optional)
- **Step 3: Preview**
  - Show first 10-20 rows (from each file if multiple)
  - Highlight any issues
  - Show auto-categorization preview
  - Display file names and row counts
- **Step 4: Complete**
  - Import log entry created
  - Show success/error message with statistics
  - Navigate to transactions

#### 7. Import Log
- **Purpose**: Historical view of all past imports
- **Features**:
  - Table view showing: Import Date, File Name, Rows Imported, Source, Status
  - Status indicators (completed/failed) with color coding
  - Navigation from Import page
  - Read-only view for audit purposes
  - Sample data for various financial sources

### UI Components Needed (Phase 1)
- Navigation sidebar
- Data tables with sorting/filtering
- Forms with validation
- Modals/sheets for add/edit
- Select/combobox components
- Date range picker
- File upload with drag & drop
- Bulk action toolbar
- Toast notifications
- Loading states

## Phase 2: Dashboard & Reporting

### Screens to Implement

#### 1. Dashboard
- Monthly spending overview
- Category breakdown charts
- Recent transactions widget
- Quick stats cards
- Spending trends

#### 2. Reports
- Monthly/yearly comparisons
- Category analysis
- Source-wise breakdown
- Custom date range reports
- Export functionality

## Phase 3: Implementation

### Core Features Priority
1. **MVP (Must Have)**
   - Import transactions from CSV
   - Manual categorization
   - Basic transaction list/search
   - Simple category management

2. **Enhanced (Should Have)**
   - Auto-categorization rules
   - Multiple source support
   - Source category mapping
   - Dashboard with visualizations

3. **Nice to Have**
   - Bank API integration
   - Budget tracking
   - Recurring transaction detection
   - Export functionality
   - Mobile responsive design

## Success Criteria
- Clean, intuitive interface
- Fast transaction categorization workflow
- Accurate auto-categorization (80%+ accuracy)
- Sub-second response times
- Reliable data import without duplicates

## Constraints
- Keep it minimal and focused
- Prioritize usability over features
- Local-first approach (no cloud dependency initially)
- Single-user application (no multi-tenancy initially)

## Recent Updates

### Prototype Changes (Latest)
- **Import Flow Simplified**: Removed Step 4 (Confirm) as it added no value. Now flows: Upload → Map Columns → Preview → Complete
- **Main Import Page**: Replaced with enhanced Step 1 (Upload) interface with drag & drop, file validation, and progress indicators
- **Units System Added**: New top-level categorization for business units/entities (e.g., "Personal", "Main Business", "Side Hustle")
  - Added Units table to data model
  - Added unit_id field to Transactions
  - Updated UI plans to include unit management and filtering

### Completed Prototype Features
- ✅ Compact navbar design (h-12) across all screens
- ✅ Dark/light theme toggle with localStorage persistence
- ✅ Enhanced button styling with proper icon visibility
- ✅ 4-step import flow with individual step screens
- ✅ Enhanced upload interface with drag & drop functionality
- ✅ Column mapping screen with auto-detection
- ✅ Transaction preview with validation and categorization
- ✅ Completion screen with statistics and charts
- ✅ Units system with CRUD management page
- ✅ Enhanced Rules page with dual rule systems (Unit Rules + Category Rules)
- ✅ Updated Transactions table with Unit column and filtering
- ✅ Source category mappings removed and integrated into Category Rules
- ✅ Source category fields changed from dropdown to text input
- ✅ Fixed swapped Unit/Category column headers in transactions table
- ✅ Added Monthly Budget column to Categories page with inline editing
- ✅ Import Log page with table view of past imports and navigation button

## Next Steps
1. ✅ Create project plan documentation
2. 🔄 Build HTML/Tailwind prototype (in progress - import flow complete)
3. ⏳ Add Units management to prototype
4. ⏳ Gather feedback and iterate on UI
5. ⏳ Finalize tech stack decision
6. ⏳ Implement backend and database
7. ⏳ Build frontend application
8. ⏳ Testing and refinement