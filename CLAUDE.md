# Claude Development Guide

## Development Process & Standards

### 1. Visual Verification Protocol
**MANDATORY: Always verify work visually in browser before marking complete**

- Never claim work is "done" without visual browser verification
- Use Puppeteer MCP to take screenshots and verify rendering
- Check both light and dark modes
- Verify responsive design on multiple viewport sizes
- Test interactive elements (buttons, navigation, forms)

### 2. Development Workflow
1. **Plan**: Use TodoWrite to break down tasks
2. **Code**: Implement following established patterns
3. **Test**: Run type checking and linting
4. **Visual Check**: Use Puppeteer to verify in browser
5. **E2E Test**: Run automated tests
6. **Mark Complete**: Only after visual verification

### 3. Current Issues to Address

#### CSS Rendering Problem (Phase 1.2) - ✅ RESOLVED
- **Issue**: Tailwind CSS 4 compatibility issues with CSS variables and @apply directive  
- **Root Cause**: `@apply bg-background` and similar CSS variable usage not supported in TW4
- **Solution**: Removed all CSS variables and @apply directives, simplified to basic Tailwind imports
- **Status**: ✅ FULLY FIXED
- **Current State**:
  - ✅ Server running on fixed port 5601
  - ✅ Navigation component working (7 links detected)
  - ✅ Theme toggle functional (dark mode switching)
  - ✅ Content structure correct (main, h1, cards detected)
  - ✅ No CSS compilation errors
  - ✅ Screenshots generated successfully (light/dark/mobile)
  - ✅ All E2E tests passing (9/9)

#### CSS Classes Not Applying (Phase 1.2) - ✅ RESOLVED
- **Issue**: Tailwind classes present in HTML but not rendering visually
- **Root Cause**: Tailwind CSS 4 PostCSS plugin compatibility issues with Next.js 15
- **Solution**: Reverted to Tailwind CSS 3 with standard PostCSS plugin
- **Status**: ✅ FULLY FIXED
- **Current State**:
  - ✅ Downgraded to `tailwindcss@3.4.17`
  - ✅ Removed `@tailwindcss/postcss` plugin
  - ✅ Using standard `tailwindcss` PostCSS plugin
  - ✅ All styling now rendering correctly

### 4. Security & Privacy

#### Git Ignore Strategy
Comprehensive .gitignore implemented to prevent personal data commits:
- Environment variables and secrets
- Personal files (*personal*, user-data/, etc.)
- Financial data files (*.csv, transactions.json, etc.)
- Development artifacts and logs
- OS-specific files

### 5. Testing Standards

#### E2E Testing
- Conservative approach: Focus on critical user journeys only
- Location: `__e2e__/critical-flows/`
- Runner script: `__e2e__/run-e2e.sh`
- Current status: 9/9 tests passing

#### Unit Testing
- Focus on business logic and utilities
- High coverage on critical paths
- Location: `__tests__/` (mirrors source structure)

### 6. Code Quality Standards

#### TypeScript
- Strict mode enabled
- No `any` types allowed
- Proper type definitions for all interfaces

#### ESLint
- Next.js recommended rules
- Custom rules for unused variables
- Error on explicit any usage

#### File Organization
```
app/               # Next.js app router pages
components/        # Reusable React components
  ui/             # shadcn/ui components
  forms/          # Form-specific components
  tables/         # Table components
  charts/         # Data visualization
db/               # Database schema and utilities
lib/              # Utility functions and helpers
__tests__/        # Unit tests
__e2e__/          # E2E tests
```

### 7. Technical Implementation Notes

#### Phase 1.1 - Project Setup ✅
- ✅ Next.js 15 with TypeScript and App Router
- ✅ Tailwind CSS with shadcn/ui  
- ✅ ESLint and TypeScript strict mode
- ✅ Development scripts configured

#### Phase 1.2 - Design System ✅ COMPLETED
- ✅ Navigation component with active states
- ✅ Theme system with localStorage
- ✅ Lucide React icons
- ✅ CSS rendering (Tailwind CSS 3 compatibility fixed)
- ✅ Table components (implemented in import system)
- ❌ Modal system (not implemented yet)
- ✅ Form components (file upload, dropdowns, search)

#### Phase 1.3 - Import System ✅ COMPLETED  
- ✅ Main import page (`/app/import/page.tsx`)
  - ✅ Drag & drop file upload functionality
  - ✅ File validation and error handling
  - ✅ Navigation to next step
- ✅ Column mapping page (`/app/import/step2/page.tsx`)  
  - ✅ Auto-detection of CSV columns
  - ✅ Mapping templates for common banks
  - ✅ Live preview of mapped data
  - ✅ Validation and error highlighting
- ✅ Data preview page (`/app/import/step3/page.tsx`)
  - ✅ Comprehensive statistics dashboard
  - ✅ Advanced filtering (search, category, errors)
  - ✅ Pagination for large datasets
  - ✅ Auto-categorization with confidence scores
  - ✅ Error highlighting and validation
- ✅ Import history page (`/app/import/history/page.tsx`)
  - ✅ Previous import records with status
  - ✅ File information and row counts
  - ✅ Success/failure indicators
- ✅ Import overview page (`/app/import/overview/page.tsx`)
  - ✅ Testing hub for all import functionality
  - ✅ Feature checklist and workflow guidance
- ✅ Step-by-step navigation system
  - ✅ Clickable progress indicators across all pages
  - ✅ Proper routing between import steps
  - ✅ Navigation breadcrumbs

#### Phase 1.4 - Core Pages (PENDING)
- ❌ Dashboard page enhancements
- ❌ Transaction management system
- ❌ Category management
- ❌ Reports and analytics
- ❌ Settings page

### 8. Commands Reference

```bash
# Development
npm run dev          # Start development server on port 5601
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run lint         # ESLint checking
npm run kill-server  # Safely kill server on port 5601 (SIGTERM)
npm run restart      # Kill and restart server

# Testing
npm run test:e2e     # Run E2E tests
./__e2e__/run-e2e.sh # E2E with server management

# Visual Verification
npm run visual-check # Puppeteer screenshots + analysis
```

### 9. Puppeteer MCP Setup Requirements

#### Configuration Needed:
- Headless browser mode for CI/CD compatibility
- Screenshot capabilities
- Mobile/desktop viewport testing
- Dark/light theme verification
- Interactive element testing

#### Integration Points:
- Pre-commit hooks for visual regression
- CI/CD pipeline integration
- Development workflow verification
- Manual testing assistance

### 10. Next Steps

1. ✅ **COMPLETED**: Set up Puppeteer MCP for visual verification
2. ✅ **COMPLETED**: Debug CSS rendering issues in Phase 1.2
3. ✅ **COMPLETED**: Phase 1.2 components (tables, forms, navigation)
4. ✅ **COMPLETED**: Phase 1.3 Import System implementation
5. **NEXT**: Phase 1.4 Core Pages development
   - Dashboard enhancements
   - Transaction management system
   - Category management
   - Reports and analytics
   - Settings page
6. **FUTURE**: Modal system implementation
7. **FUTURE**: Visual regression testing setup

---

**Remember**: No task is complete without visual browser verification! 🚫➡️✅