# Wedding Hall Seating Planner (מתכנן הושבה לחתונה)

A modern, production-grade, Apple-inspired wedding seating web application designed specifically for arranging guests on an interactive wedding hall sketch.

Built to replace spreadsheet-based seating workflows with a visual, responsive drag-and-drop floor planner.

---

## 🌟 Key Features

- **Secret Access Gate**: Lightweight private access screen with secret `kingabso`, remembered in browser storage.
- **Interactive 2D Floor Plan**: 34 visual tables arranged around Stage, Dance Floor, DJ Booth, Bars, and Entrance.
- **Table Rearrangement & Design**: Freely drag tables to reposition them in **Edit Layout Mode**, toggle table shapes (**Round / Rectangle**), customize table names & zones, and adjust capacities.
- **Continuous 10-Minute Playwright Sync Daemon**:
  - Auto-logs in (`0503505350` / `962317`), scrapes latest RSVP status changes, and saves session tokens.
  - Automatically recovers from session expirations and errors without crashing.
- **Telegram Bot Notifications**:
  - Pushes live updates directly to your Telegram bot (`8608609950:AAEGt_bCtuHmmWR5ORKl1uEOKC0eOLFfzYg`).
  - Reports newly approved guests, cancellations/rejections, attendee count changes, and totals.
- **Non-Destructive Live State Reconciliation**:
  - Preserves all your existing table assignments when refreshed data arrives from the scraper!
  - Never removes seated guests or duplicates entries.
- **Full Multi-Format Export Suite**:
  - 📊 **Excel / CSV Table List**: Complete breakdown with table numbers, guest names, seat counts, phone numbers, and notes.
  - 🌐 **Interactive Standalone HTML**: Single-file shareable web map with Hebrew guest search and table click popups.
  - 👁️ **Public Guest Lookup View**: View-only mode with instant table highlight search.
  - 📄 **High-Res PDF Chart & PNG Image**: Printable floor plan snapshots.
  - 💾 **Full JSON Backup & Restore**: Snapshot backup of entire venue state.
- **Automatic Server-Side Persistence**: Every move, drag, note, and shape change is automatically saved to `data/event-state.json`.

---

## 🚀 Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/utilities`, `@dnd-kit/modifiers`
- **Icons**: Lucide Icons
- **Animation**: Framer Motion & Canvas Confetti
- **Document Export**: jsPDF & html2canvas
- **CSV Parser**: PapaParse

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🔐 Environment Variables for Git Persistence

Configure these variables in your deployment dashboard (e.g. Vercel or Netlify):

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=rotemk83
GITHUB_REPO=wedding-seating-planner
GITHUB_BRANCH=main
```

> **Note**: Secrets are handled strictly inside `/api/state.ts` and are never embedded into frontend JavaScript bundles.

---

## 📊 CSV Input Format

The application directly accepts `WeddingGuests.csv` exported from web scrapers or RSVP spreadsheets:

| Header | Description | Example |
| :--- | :--- | :--- |
| `Name` | Full Invitation / Party Name (Hebrew UTF-8) | `"אורלי ורמי גואטה"` |
| `Approved` | Confirmed Attendee Count (Primary seat count) | `"2"` |
| `Invited` | Initial Invited Count | `"2"` |
| `Group` | Guest Category / Circle | `"חברים הורים"` |
| `HasPhone` | Phone availability (`Yes` / `No` / phone string) | `"0505340766"` |
| `HasNotes` | Indicates if notes exist (`Yes` / `No`) | `"No"` |
| `UIExtra` | Optional extra scrapings | `""` |
| `RawName` | Raw unmodified string | `"אורלי ורמי גואטה"` |

---

## 📁 Repository Structure

```
wedding-seating-planner/
├── api/
│   └── state.ts              # Serverless GitHub Git persistence endpoint
├── data/
│   └── event-state.json      # Remote Git state snapshot
├── public/
├── src/
│   ├── components/
│   │   ├── ExportModal.tsx
│   │   ├── GuestCard.tsx     # Draggable RTL Hebrew guest item
│   │   ├── HallCanvas.tsx    # 2D Venue floor plan canvas (Zoom, Pan, Fit)
│   │   ├── Header.tsx        # Top metrics bar, undo/redo, theme, save
│   │   ├── LandingImport.tsx # First-use CSV drag-and-drop onboarding
│   │   ├── ReconcileModal.tsx# CSV re-import diff report modal
│   │   ├── SecretGate.tsx    # Secret entry screen (kingabso)
│   │   ├── Sidebar.tsx       # Unassigned / Assigned / All tabs & search
│   │   ├── TableDetailsDrawer.tsx # Table inspector & guest mover
│   │   └── TableNode.tsx     # 34 visual table nodes & occupancy rings
│   ├── hooks/
│   │   └── useSeatingState.ts # Undo/redo, autosave, mutations
│   ├── lib/
│   │   ├── csvParser.ts      # UTF-8 BOM Hebrew parser & sample data
│   │   ├── defaultHallLayout.ts # 34 tables layout topology
│   │   ├── pdfExport.ts      # PNG & PDF export generators
│   │   ├── reconciliation.ts # Non-destructive CSV updater
│   │   └── storage.ts        # Local cache & API sync engine
│   ├── types/
│   │   └── index.ts          # Complete TypeScript definitions
│   ├── App.tsx               # Main application coordinator
│   ├── index.css             # Tailwind v4 theme variables
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```
