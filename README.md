# DailyDesk 🖥️✨
> *“Everything you need for a more organized day.”*

DailyDesk is a modern, high-performance personal productivity and daily-life management web application. It unifies **tasks**, **expenses**, **notes**, **goals**, and a focused **My Day** command center into one cohesive, beautifully designed dashboard.

DailyDesk is built for real-world daily use and presentation at web development competitions. It is powered by **HTML5**, **CSS3**, **modern JavaScript (ES6+)**, **Chart.js**, and a live **Supabase** backend with Row Level Security (RLS).

---

## 🌟 Key Features

### 1. 🏠 Landing & Brand Identity
- **Original Visual Identity**: Custom geometric logo emblem, modern typography (Plus Jakarta Sans & JetBrains Mono), smooth gradient accents, and dark/light theme toggle.
- **Hero & Interactive Preview**: Live simulation mockup showcasing real-time task completion, spending totals, and productivity scoring.
- **Before & After Comparison**: Clearly illustrates the tangible benefits of unified life management versus chaotic, fragmented apps.

### 2. ⚡ "My Day" Focused Command Center
- **Dedicated Daily Hub**: Tailored for morning planning and execution.
- **Live Productivity Score Ring**: Dynamically computed (0–100%) from completed daily tasks and active goal progress.
- **Today's Checklist & Running Spend**: Instant visibility into today's commitments and expenses with 1-click status toggling.

### 3. ✅ Task Manager
- **Complete CRUD**: Create, edit, delete, and toggle tasks between pending and completed.
- **Priority Ranking**: High (Red), Medium (Amber), and Low (Indigo) visual badges.
- **Smart Filtering & Sorting**: Filter by status (*All, Today, Upcoming, Completed*), category (*Work, Study, Personal, Shopping, Other*), and priority. Sort by due date or priority.
- **Overdue Detection**: Highlights overdue tasks in red with warning badges.

### 4. 💰 Expense Tracker & Financial Analytics
- **Complete CRUD**: Record transactions with category, amount, payment method, date, and receipt notes.
- **Interactive Visualizations**:
  - **Category Breakdown**: Donut chart displaying percentage allocation across Food, Bills, Transport, Shopping, Education, Entertainment, and Other.
  - **Spending Timeline**: Line chart showing expenditure activity over recent dates.
- **Summary Metrics**: Real-time cards for *Today's Spending*, *Last 7 Days*, *This Month*, and *Total Tracked*.
- **Data Export**: 1-click export of transactions to CSV format (`DailyDesk_Expenses_YYYY-MM-DD.csv`).

### 5. 📝 Smart Color-Coded Notes
- **Masonry Grid**: Sticky-note aesthetic with custom accent borders.
- **Pin to Top**: Toggle important notes to stay pinned at the top with a golden star/pin badge.
- **Category Tags & Palette**: Color picker to customize visual note cards (*Indigo, Cyan, Emerald, Amber, Pink, Violet*).
- **Instant Search**: Search through note titles and content simultaneously.

### 6. 🎯 Goals & Milestones
- **Target Countdowns**: Automatic calculation of days remaining until milestone completion.
- **Interactive Progress Bars**: Quick incremental controls (+10% / -10%) and 1-click completion toggle.
- **Categories**: Career, Study, Savings, Fitness, Personal, and Other.

### 7. 🔍 Global Search (`Ctrl + K`)
- Universal search palette accessible from anywhere via the topbar search bar or `Ctrl+K` / `Cmd+K` keyboard shortcut.
- Searches across Tasks, Expenses, Notes, and Goals simultaneously with 1-click navigation.

### 8. 🛡️ Admin Panel & Supabase Database Health
- **Role-Based Access**: Restricted administrative panel for authorized accounts.
- **System KPIs**: High-level platform statistics (registered users, task completion rate, total financial volume, active milestones).
- **Live Database Health Check**: Tests connection to Supabase tables (`profiles`, `tasks`, `expenses`, `notes`, `goals`) and displays latency in milliseconds.
- **1-Click SQL Schema Viewer**: Modal with copyable schema for Supabase SQL Editor.
- **Seed Sample Data**: 1-click button to populate a fresh, realistic dataset for live demonstrations.

---

## 🚀 Live Competition Demonstration Guide

For presentation or competition evaluation, DailyDesk provides two entry points:

### Option A: 1-Click Instant Demo Mode (Zero Setup Required)
1. Open `index.html` in any browser (or start with VS Code Live Server / static server).
2. Click **"⚡ 1-Click Evaluator Demo"** on the landing page or click **"Live Demo →"** in the top navigation.
3. You immediately enter the workspace pre-loaded with realistic sample tasks, expenses, notes, and goals.
4. Try adding a new task, logging an expense, adjusting a goal progress bar, pinning a note, or pressing `Ctrl+K` to search.
5. To test the Admin panel, click **Admin Panel** in the sidebar, or log in using **"Demo Admin"**.

### Option B: Supabase Cloud Database Integration
DailyDesk is pre-configured with the provided Supabase project:
- **Supabase Project URL**: `https://lfinbgixmzqwoqzkwqdx.supabase.co`
- **Supabase Anon Key**: Loaded and configured in `js/config.js`.

#### Setting up tables in Supabase:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/lfinbgixmzqwoqzkwqdx/sql).
2. Go to the **SQL Editor**.
3. Copy the contents of [`schema.sql`](file:///c:/Users/omc%20shafeeq%20ahmed/Desktop/daily%20tasks/schema.sql) (or click **"View SQL Schema"** inside the DailyDesk Admin Panel and click **"Copy SQL to Clipboard"**).
4. Paste into the SQL Editor and click **Run**.
5. All tables (`profiles`, `tasks`, `expenses`, `notes`, `goals`) with Row Level Security (RLS) policies and automatic trigger will be created!
6. Sign up with your own email in DailyDesk and all your personal data will persist directly in your Supabase PostgreSQL cloud database!

---

## 📁 Project Architecture

```
daily tasks/
├── index.html              # Main HTML entrypoint (Landing Page + Complete App shell)
├── schema.sql              # Complete Supabase PostgreSQL schema with RLS & Triggers
├── README.md               # Project documentation & presentation guide
├── css/
│   ├── main.css            # Design tokens, typography, buttons, animations
│   ├── landing.css         # Landing page hero, showcase grid, comparison
│   ├── dashboard.css       # App layout, sidebar, header, stat cards, tables
│   └── components.css      # Toasts, modals, search palette, score dial
└── js/
    ├── config.js           # Supabase keys, categories, sample dataset
    ├── supabase-client.js  # Supabase client wrapper (Auth, CRUD, health check)
    ├── state.js            # Reactive state management store & stats engine
    ├── router.js           # Hash-based SPA router & view controller
    ├── ui-dashboard.js     # Dashboard & My Day view renderers & Chart.js setup
    ├── ui-tasks.js         # Task manager CRUD, filters, and priority handlers
    ├── ui-expenses.js      # Expense tracker CRUD, analytics charts, CSV export
    ├── ui-notes.js         # Smart notes CRUD, pinboard, and color picker
    ├── ui-goals.js         # Goal milestones, progress slider, target countdown
    ├── ui-admin.js         # Admin panel, user table, health check, seed data
    ├── ui-search.js        # Global search modal (Ctrl+K)
    └── app.js              # Application bootstrapper, auth listener, toasts & modals
```

---

## 💻 Recommended Competition Workflow
```
Antigravity → VS Code → GitHub → Supabase → Live Web Deployment
```

1. **Antigravity**: Generated complete, modular, battle-tested codebase.
2. **VS Code**: Open project folder and preview with *Live Server* or browser.
3. **GitHub**: Push code repository to GitHub.
4. **Supabase**: Run `schema.sql` in SQL Editor for cloud-native persistence with RLS.
5. **Deployment**: Deploy instantly to Vercel, Netlify, or GitHub Pages.
