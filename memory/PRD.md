# Systems Inventory Dashboard - PRD

## Original Problem Statement
Build a Systems Inventory Dashboard (Executive View) that imports Excel/CSV files and provides:
- Executive dashboard with rollups (apps, spend, usage, categories, cost centers)
- Drill-down inventory list to application details
- Request Information workflow to contact Product Owner/Data Steward
- Filtering by Cloud/On-Prem/Hybrid/Unknown deployment types

## User Personas
1. **Executive** - Needs high-level portfolio visibility, spend analytics, risk identification
2. **IT Manager** - Manages application ownership, handles information requests
3. **Analyst** - Reviews detailed app data, validates usage/cost metrics

## Core Requirements (Static)
- JWT authentication with role-based demo accounts
- Excel/CSV file import with auto column mapping
- Dashboard KPIs: Total Apps, Annual Spend, YTD Expense, Engaged Users
- Deployment breakdown (Cloud/On-Prem/Hybrid/Unknown)
- Executive summary with auto-generated narrative
- Charts: Spend by Category, Apps by Category, Spend by Cost Center
- High Spend/Low Engagement analysis with threshold controls
- Sortable/filterable inventory table
- Application detail page with tabs (Overview, Usage, Financials, Data, Ownership, Requests)
- Request Information workflow (in-app tracking, no email)
- Download CSV template

## What's Been Implemented (December 2024)
- [x] Full authentication system (JWT, register, login, quick demo access)
- [x] Executive Dashboard with all KPI cards and charts
- [x] Auto-generated executive summary with insights
- [x] Dashboard filters (search, category, deployment, status, vendor)
- [x] Inventory page with sortable/filterable table
- [x] Application detail page with 6 tabs and edit mode
- [x] Request Information modal with prefilled contacts
- [x] Requests Center with status management
- [x] Import page with Excel/CSV upload
- [x] Sample data seeding functionality
- [x] Currency parsing for various formats
- [x] Deployment type inference from vendor hints
- [x] Successfully imported user's 342 applications dataset

## Tech Stack
- **Backend**: FastAPI, MongoDB, PyJWT, bcrypt, pandas, openpyxl
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, React Router
- **Auth**: JWT tokens stored in localStorage

## Prioritized Backlog

### P0 (Critical) - Done
- All core functionality implemented

### P1 (High Priority)
- [ ] Bulk deployment type update (many apps are "Unknown")
- [ ] Export inventory data to CSV/Excel
- [ ] More detailed cost center analysis

### P2 (Nice to Have)
- [ ] Email integration for actual request sending
- [ ] User management (admin can manage users)
- [ ] Audit trail for data changes
- [ ] Data validation warnings on import
- [ ] Custom dashboard widget arrangement

## Next Tasks
1. Consider adding deployment type bulk edit feature
2. Export functionality for filtered data
3. Data validation/cleanup tools for imported data
