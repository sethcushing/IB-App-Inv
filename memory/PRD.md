# Systems Inventory Dashboard - PRD

## Original Problem Statement
Build a Systems Inventory Dashboard (Executive View) that imports Excel/CSV files and provides:
- Executive dashboard with rollups (apps, spend, usage, categories, cost centers)
- Drill-down inventory list to application details
- Request Information workflow to contact Product Owner/Data Steward
- Filtering by Cloud/On-Prem/Hybrid/Unknown deployment types
- **Role-based views for different user types**

## User Personas & Dashboard Views
1. **Executive (admin)** 
   - Full portfolio visibility: all 342 apps, $23M total spend
   - Financial KPIs: Contract Spend, YTD Expense, Engaged Users
   - Can edit all applications
   - Can seed sample data & import files

2. **IT Manager (manager)** 
   - Multi-cost center filtered view: ~98 apps in 4 IT cost centers
   - Financial KPIs focused on their portfolio
   - Can edit applications in their scope
   - Dashboard shows "IT Management Dashboard"

3. **Analyst (viewer)** 
   - Single cost center view: ~54 apps
   - Usage-focused KPIs: Engaged Users, Provisioned Users, Engagement Rate
   - **Read-only access** (cannot edit applications)
   - Dashboard shows "Usage Analytics Dashboard"

## What's Been Implemented (December 2024)
- [x] Full authentication system with role-based permissions
- [x] Cost center assignments stored in user profiles
- [x] Role-specific dashboard views and KPIs
- [x] Executive: Full portfolio with financial focus
- [x] IT Manager: Multi-cost center filter with financial KPIs
- [x] Analyst: Single cost center with usage metrics & read-only
- [x] Role-specific executive summary narratives
- [x] Edit permissions enforced on frontend (Read Only badge for viewers)
- [x] Edit permissions enforced on backend (403 for viewers)
- [x] All 342 applications from user's Excel imported

## Demo Accounts
| Role | Email | Cost Centers |
|------|-------|--------------|
| Executive | exec@demo.com | All (no filter) |
| IT Manager | it@demo.com | 650-it executive, 651-it applications-crm, 652-it operations, 653-it applications-erp |
| Analyst | analyst@demo.com | 650-it executive |

Password for all: `demo123`

## Tech Stack
- **Backend**: FastAPI, MongoDB, PyJWT, bcrypt, pandas, openpyxl
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, React Router
- **Auth**: JWT tokens with role and cost center assignments

## Next Action Items
1. Add user profile settings page to update cost center assignments
2. Bulk deployment type update for Unknown apps
3. Export filtered data to CSV/Excel
4. Consider line-of-business grouping for IT Manager view
