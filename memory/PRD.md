# BIA | Blox App Inventory - Product Requirements Document

## Overview
BIA (Blox App Inventory) is an executive-friendly Systems Inventory Dashboard application that provides comprehensive visibility into an organization's application portfolio, including spend analysis, usage metrics, and capability overlap detection.

## Original Problem Statement
Build a clean, minimal, executive-friendly Systems Inventory application that imports an Excel/CSV file and provides:
1. A single-page executive dashboard with rollups (apps, spend, usage, categories, cost centers)
2. A drill-down inventory list to each application's details
3. A Request Information workflow to contact the Product Owner/Data Steward
4. Active/Inactive application status tracking

## Current Data State (Updated April 2026)
- **Total Applications**: 441
- **Active Applications**: 244
- **Inactive Applications**: 197
- **Total Contract Spend**: $21.8M
- **Engaged Users**: 3,325

### Data Sources Merged
1. **MasterSoftwareList** - Base application list with vendors, OKTA mappings
2. **OKTA_Engagement_audit** - SSO user counts, engagement metrics, wastage %
3. **software_renewal_lookup** - Contract expiry dates
4. **SoftwareSpend** - Financial data, cost centers, PO amounts
5. **MasterSoftwareListUpdate04102026_v1** - Custom/COTS classification, deployment model (SaaS/On-Premise/IaaS_PaaS), primary functional area, vendor parent data

### Key Field Additions (April 2026 Data Merge)
- `deployment_model`: SaaS (306), On-Premise (47), Unknown (82), IaaS/PaaS (5), Multiple (1)
- `app_type`: COTS (424), Custom (17)
- `is_custom`, `is_saas`, `is_on_premise`, `is_iaas_paas`: Boolean flags
- `primary_functional_area`: IT (66), Sales (43), Engineering (34), Enterprise (30), HR (24), Marketing (23), Product (16), Finance (15), Legal (6)

## Core Requirements

### Data & Import
- Import screen for Excel or CSV files
- Auto-detect and map columns to internal schema
- Handle missing fields with default values
- Normalize spend fields from currency strings to numeric values
- Active/Inactive status based on spend, renewal dates, and OKTA engagement
- Duplicate detection when adding new applications
- Download template CSV functionality

### User Experience / Pages
1. **Executive Dashboard**: KPI tiles, Active/Inactive counts, charts (Spend by Category, Status Distribution, Deployment Model, Custom vs COTS, Apps by Functional Area, Apps by Category, Owner by Department)
2. **Inventory List**: Full, sortable, filterable table with column customization
3. **Application Detail Page**: Profile view with tabs (Overview, YoY Trends, Usage, Financials, Ownership, Requests)
4. **AI Portfolio Heatmap**: GPT-4o powered C-Suite analysis of overlaps and consolidation opportunities
5. **AI Capability Scanner**: Intelligent detection of overlapping application capabilities
6. **Requests Center**: Inbox for information requests
7. **Import/Admin**: File upload, field mapping, template download

## What's Been Implemented

### Phase 1: Core MVP (Completed)
- [x] Backend setup with FastAPI + MongoDB
- [x] Data models for applications, requests
- [x] Excel/CSV import with column auto-mapping
- [x] Executive Dashboard with KPIs and Recharts visualizations
- [x] Inventory list with sorting, filtering, pagination
- [x] Application detail pages with all tabs
- [x] Request creation and management workflow
- [x] Sample data seeding

### Phase 2: Enhanced Features (Completed)
- [x] Clickable dashboard charts -> Filter inventory
- [x] Year-over-Year trend charts (simulated data)
- [x] Add Application modal with form
- [x] Duplicate detection (409 error on duplicate titles)
- [x] Download Template CSV button

### Phase 3: AI & UX Improvements (Completed - Dec 2025)
- [x] **AI Capability Scanner**: GPT-4o-mini powered analysis to find applications with overlapping capabilities
- [x] **Light/Dark Mode Toggle**: Full theme support with glassmorphic design
- [x] **Rebranding**: Changed from generic to "BIA | Blox App Inventory"
- [x] Updated color scheme from lime to emerald green
- [x] Modern glassmorphic styling with CSS variables for theming
- [x] **Inline Grid Editing**: Edit application data directly in the inventory table
- [x] **Column Selector**: Customize visible columns in the inventory grid with persistence to localStorage
- [x] **5-Year Financials View**: Enhanced Financials tab
- [x] **AI Portfolio Heatmap** (GPT-4o powered C-Suite executive view)

### Phase 4: Data Enrichment & New Visualizations (Completed - April 2026)
- [x] **Data Merge from MasterSoftwareListUpdate**: Merged 441 rows, updated 394 existing apps, inserted 44 new apps
- [x] **New Fields**: deployment_model, app_type, is_custom, is_saas, is_on_premise, is_iaas_paas, primary_functional_area
- [x] **Dashboard: Deployment Model Chart**: Pie chart showing SaaS vs On-Premise vs IaaS/PaaS with click-through to inventory
- [x] **Dashboard: Custom vs COTS Chart**: Pie chart showing Custom vs Commercial Off-The-Shelf apps
- [x] **Dashboard: Apps by Functional Area Chart**: Bar chart showing IT, Sales, Engineering, etc. distribution
- [x] **Inventory: New Columns**: Deployment and App Type columns in default view
- [x] **Inventory: New Filters**: Filter by deployment_model, app_type, primary_functional_area
- [x] **App Detail: New Fields**: Deployment Model badge, App Type badge, Functional Area in Overview tab
- [x] **Backend: New Endpoints**: /api/dashboard/custom-vs-cots, /api/dashboard/deployment-model, /api/dashboard/apps-by-functional-area
- [x] **Backend: Updated Filters**: /api/applications now supports deployment_model, app_type, primary_functional_area query params

## Technical Architecture

### Backend (FastAPI)
- `/app/backend/server.py`: All routes, models, business logic
- MongoDB collections: `applications`, `requests`
- AI integration via `emergentintegrations` library with OpenAI GPT-4o

### Frontend (React)
- `/app/frontend/src/pages/`: DashboardPage, InventoryPage, ApplicationDetailPage, HeatmapPage, RequestsPage, ImportPage
- `/app/frontend/src/components/Layout.js`: Main layout with sidebar and theme toggle
- `/app/frontend/src/context/ThemeContext.js`: Light/dark mode state management
- Shadcn/UI components for consistent styling

### Key API Endpoints
- `GET /api/applications`: List with filtering (status, category, vendor, deployment_model, app_type, primary_functional_area), sorting, pagination
- `POST /api/applications`: Create new (with duplicate detection)
- `GET /api/dashboard/kpis`: KPIs including active/inactive counts
- `GET /api/dashboard/custom-vs-cots`: Custom vs COTS breakdown
- `GET /api/dashboard/deployment-model`: Deployment model breakdown
- `GET /api/dashboard/apps-by-functional-area`: Functional area breakdown
- `POST /api/ai/scan-capabilities`: AI-powered capability overlap detection (single app)
- `POST /api/ai/portfolio-heatmap`: AI-powered C-Suite portfolio analysis (GPT-4o)
- `POST /api/import/upload`: Excel/CSV import
- `GET /api/import/template`: Download CSV template

## Known Limitations
- YoY trend data is simulated (no historical data source)
- AI capability scanner uses GPT-4o-mini via Emergent LLM key
- Capability L2/L3, App Tiering, and Funding Source data not yet available

## Future Enhancements (Backlog)
- [ ] **Bulk Edit Capability** (P1): Select multiple rows in inventory grid and edit a common field
- [ ] **Backend Refactor** (P2): Split server.py (1000+ lines) into /routes, /models, /services
- [ ] **Export Functionality** (P2): Export inventory to PDF or Excel, respecting filters and visible columns
- [ ] **Capability L2/L3 Charts** (P2): When data becomes available, add Capability drill-down
- [ ] **App Tiering** (P2): When data becomes available, add tiering visualization
- [ ] **Funding Source by Department** (P2): When data becomes available
- [ ] **Historical Data Integration** (P3): Connect YoY trend charts to actual historical data
- [ ] Enhanced Executive Summary narrative generation
- [ ] Email notifications for request workflow
- [ ] Integration with SSO providers for actual usage data
- [ ] Cost optimization recommendations based on overlap analysis
