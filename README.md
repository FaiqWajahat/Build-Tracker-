# BuildTrack ERP – Premium Construction ERP System

BuildTrack ERP is a state-of-the-art, high-performance Enterprise Resource Planning (ERP) platform custom-designed for modern construction project management. It provides builders, project managers, and administrators with real-time control over project status, daily work logs, labor resources, invoicing, and subcontractor accounting.

---

## 🚀 Key Features

### 1. Unified Project & Financial Dashboard
* **Dynamic KPIs**: Instant tracking of Total Invoiced, Received Payments, Outstanding Receivables, and Overdue Bills.
* **Interactive Charts**: Interactive Revenue vs. Cost visualizations powered by Chart.js.
* **Portfolio Analytics**: Modal overlay with aggregated KPI cards and CSV export capability comparing gross revenue, total cost, net profit, and profit margin per project.
* **Real-time Notifications**: Bell alert dropdown and a dedicated system-wide notifications feed that monitors delayed logs, pending payment vouchers, and equipment inspections.

### 2. Daily Progress Feed (`/daily-progress`)
* **Unit & Phase Breakdown**: Granular tracking of quantities completed against target capacities.
* **Interactive Timeline**: Chronological logs grouped by date, showing earned value, assignee teams, and supervisor sign-offs.
* **Approval Workflows**: Fast actions to approve, reject, or flag issues (Blocked/Delayed) directly from the feed.

### 3. Labor & Workforce Management (`/labour-teams`)
* **Worker Profiles**: Comprehensive records including Iqama credentials (with color-coded 60-day expiry notifications), trades, contact info, and salary scales (monthly salary vs. daily wage).
* **On-Demand Ledgers**: Worker attendance history and cash advances are loaded page-by-page to minimize initial payload sizes.
* **Automated Payroll**: Context-aware payroll engine calculating regular wages, overtime bonuses, and advance deductions over a customizable date range.
* **Labour Teams**: Organizes workers into specialization groups (Civil, Finishes, Steel, MEP) assigned to specific project sectors under team leaders.

### 4. Client Invoicing (`/invoices`)
* **Auto-Generation**: Builds drafts from logged progress values, quantities, and client rates automatically.
* **Progress Valuation**: Itemized line items comparing previous quantity, current quantity, unit rates, retention deductions (default 5%), and VAT (default 15%).
* **Document Explorer**: Generates clean invoice layouts ready for client presentation and tracking of status (Draft, Submitted, Approved, Paid, Overdue).

### 5. Contractor Ledger & Reconciliation (`/contractors`)
* **Contractor Cards**: Grid showing specialists, ratings, trades, and status.
* **Scope Ledger**: Side-by-side comparison of Sub Rate vs. Client Rate showing profit margins per unit.
* **Cash Flow Reconciliation**: Dynamic ledger comparing earned subcontract values against project deductions (penalties, materials damage, cash advances) and cleared payment vouchers to calculate the Net Payable.

---

## 🛠️ Technology Stack

* **Frontend Framework**: Next.js 15+ (App Router) with React 19.
* **Styling**: Tailwind CSS & Vanilla CSS modules.
* **State Management**: Zustand (with isolated paginated sub-stores).
* **Database**: Serverless PostgreSQL via Neon.
* **HTTP Client**: Axios.
* **Icons**: Lucide React.

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18.x or higher) and [npm](https://npmjs.com) installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd buildtrack-erp
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and configure the database link and admin credentials:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/buildtrack_db?sslmode=require"
ADMIN_PASSWORD="your-secure-admin-password"
JWT_SECRET="your-jwt-secret-string"
```

### 4. Running the Development Server
Launch the local Turbopack development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Building for Production
Compile the optimized static and server-rendered pages:
```bash
npm run build
npm run start
```

---

## ⚡ Query & Performance Optimizations

BuildTrack ERP is designed to remain fast and light as your database grows. The following query and pagination architectures have been implemented:

### Database Indexes
Indexes have been added to speed up queries sorting by date or filtering by worker/contractor:
```sql
CREATE INDEX IF NOT EXISTS idx_progress_logs_project_date_desc ON progress_logs (project_id, date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date_desc ON attendance (worker_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_project_date_desc ON invoices (project_id, invoice_date DESC);
```

### API Pagination
All listing endpoints support `page` and `limit` parameters to execute backend-offset pagination (`LIMIT` and `OFFSET` in SQL), returning formatted objects matching:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 125, "totalPages": 13 }
}
```
*If pagination parameters are omitted, endpoints default to returning a raw array capped at a maximum of 500 rows for backward compatibility.*

### On-Demand Data Loading
* **Workforce (`/api/labour`)**: Initial loads fetch only worker profiles and the last 15 days of attendance logs to populate dashboard overview indicators. Complete attendance histories are loaded on-demand when opening individual profiles.
* **Subcontractors (`/api/contractors`)**: Excludes historical payment and deduction arrays on load, pulling them dynamically when entering a contractor&apos;s billing detail page.
