# BRD Tracker

Internal product tracking system for Feature Requests and BRDs (Business Requirements Documents). Used by Product, QA, Developers, and Founders across four business verticals: **Sales**, **Operations**, **Finance**, and **Marketing**.

## Tech Stack

- **Next.js 16** (React) – App Router
- **Node.js** – API Routes
- **SQLite** (better-sqlite3) – Database
- **Tailwind CSS** – Styling
- **Chart.js** – Analytics charts

## Project Structure

```
/app
  /api          – API routes (features, developers, QA)
  /features     – Features list and detail pages
  /add-feature  – Add feature form
  /developers   – Developer performance
  /qa           – QA performance
/components     – Reusable UI (Sidebar, DataTable, StatCard, Charts)
/database       – Schema and seed script
/lib            – Types and DB helpers
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Stats, charts (releases by month, by vertical, success rate, usage score), recent releases, features awaiting testing |
| **Features** | Full table with filters (vertical, developer, QA, status, release month), search, sorting |
| **Feature Detail** | Full description, BRD link, timeline, team, metrics, feedback |
| **Add Feature** | Form to create a new feature |
| **Users** | Add/delete developers and QA |
| **Developers** | Per-developer stats and feature list |
| **QA** | Per-QA stats, bugs found, feature list |

## Database

SQLite database file: `brds.db` (created in project root on first run).

Schema: `features` table with fields as specified in the requirements.
