# BIA | Blox App Inventory - Product Requirements Document

## Overview
BIA (Blox App Inventory) is an executive-friendly Systems Inventory Dashboard application that provides comprehensive visibility into an organization's application portfolio, including spend analysis, usage metrics, and capability overlap detection.

## Original Problem Statement
Build a clean, minimal, executive-friendly Systems Inventory application that imports an Excel/CSV file and provides:
1. A single-page executive dashboard with rollups (apps, spend, usage, categories, cost centers)
2. A drill-down inventory list to each application's details
3. A Request Information workflow to contact the Product Owner/Data Steward
4. Filtering and segmentation by Cloud vs On-Prem vs Unknown

## Core Requirements

### Data & Import
- Import screen for Excel or CSV files
- Auto-detect and map columns to internal schema
- Handle missing fields with default values
- Normalize spend fields from currency strings to numeric values
- Derive 'deployment_type' field (Cloud, On-Prem, Hybrid, Unknown)
- Duplicate detection when adding new applications
- Download template CSV functionality

### User Experience / Pages
1. **Executive Dashboard**: KPI tiles, charts (Spend by Category, Apps by Category), global filters, Executive Summary
2. **Inventory List**: Full, sortable, filterable table with Add Application functionality
3. **Application Detail Page**: Profile view with tabs (Overview, YoY Trends, Usage, Financials, Ownership, Requests)
4. **AI Capability Scanner**: Intelligent detection of overlapping application capabilities
5. **Requests Center**: Inbox for information requests
6. **Import/Admin**: File upload, field mapping, template download

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
- [x] Clickable dashboard charts → Filter inventory
- [x] Year-over-Year trend charts (simulated data)
- [x] Add Application modal with form
- [x] Duplicate detection (409 error on duplicate titles)
- [x] Download Template CSV button

### Phase 3: AI & UX Improvements (Completed - Dec 2025)
- [x] **AI Capability Scanner**: GPT-4o-mini powered analysis to find applications with overlapping capabilities
- [x] **Light/Dark Mode Toggle**: Full theme support with glassmorphic design
- [x] **Rebranding**: Changed from generic to "BIA | Blox App Inventory"
- [x] **Removed Emergent badge**
- [x] Updated color scheme from lime to emerald green
- [x] Modern glassmorphic styling with CSS variables for theming
- [x] **Inline Grid Editing**: Edit application data directly in the inventory table
- [x] **Column Selector**: Customize visible columns in the inventory grid with persistence to localStorage
- [x] **5-Year Financials View**: Enhanced Financials tab with:
  - Current financial summary cards
  - YoY change indicator
  - 5-Year total spend summary
  - 5-Year spend trend chart
  - Detailed 5-year financial history table with YoY change %, engaged users, and cost per user
- [x] **AI Portfolio Heatmap** (GPT-4o powered C-Suite executive view):
  - Capability overlap cluster detection with severity ratings
  - Consolidation opportunities with savings estimates
  - Risk area identification (vendor concentration, security, compliance)
  - Underutilized high-cost application flagging
  - Priority action items with estimated savings
  - Category breakdown with overlap risk indicators

## Technical Architecture

### Backend (FastAPI)
- `/app/backend/server.py`: All routes, models, business logic
- MongoDB collections: `applications`, `requests`
- AI integration via `emergentintegrations` library with OpenAI GPT-4o-mini

### Frontend (React)
- `/app/frontend/src/pages/`: DashboardPage, InventoryPage, ApplicationDetailPage, RequestsPage, ImportPage
- `/app/frontend/src/components/Layout.js`: Main layout with sidebar and theme toggle
- `/app/frontend/src/context/ThemeContext.js`: Light/dark mode state management
- Shadcn/UI components for consistent styling

### Key API Endpoints
- `GET /api/applications`: List with filtering, sorting, pagination
- `POST /api/applications`: Create new (with duplicate detection)
- `GET /api/dashboard/*`: KPIs, charts data, executive summary
- `POST /api/ai/scan-capabilities`: AI-powered capability overlap detection
- `POST /api/import/upload`: Excel/CSV import
- `GET /api/import/template`: Download CSV template

## Known Limitations
- YoY trend data is simulated (no historical data source)
- AI capability scanner uses GPT-4o-mini via Emergent LLM key

## Future Enhancements (Backlog)
- [ ] **Bulk Edit Capability** (P1): Select multiple rows in inventory grid and edit a common field
- [ ] **Export Functionality** (P2): Export inventory to PDF or Excel, respecting filters and visible columns
- [ ] **Historical Data Integration** (P2): Connect YoY trend charts to actual historical data
- [ ] **Portfolio-wide AI Analysis** (P3): Consolidated report on application redundancies and cost savings
- [ ] Batch-update deployment_type for "Unknown" apps
- [ ] Enhanced Executive Summary narrative generation
- [ ] Email notifications for request workflow
- [ ] Integration with SSO providers for actual usage data
- [ ] Cost optimization recommendations based on overlap analysis
