# 🏋️ ElevateFit

**A premium multi‑page fitness & lifestyle web app built with Next.js 16, React 19, and the App Router — featuring workouts, recipes, daily routines, progress tracking, and user profiles.**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [API Routes](#api-routes)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**ElevateFit** is a full‑stack fitness companion web application designed with a glassmorphic, mobile‑first UI. Users can browse curated workouts and recipes, build personalized daily routines with a day‑by‑day task planner, track their progress over time with interactive charts, manage their health & diet profiles, and receive smart reminders via email and push notifications. The app uses Firebase for authentication, MongoDB (via Mongoose) for persistent data, and Framer Motion for fluid page transitions and micro‑interactions.

---

## Features

- **Dashboard** — Quick stats (sleep, streak, mood), daily summary cards, focus grid with personalized wellness tips, and a primary action shortcut to your next workout.
- **Gym / Workouts** — Browse a curated workout library, view exercise details, and edit/customize workouts with an in‑app editor. Changes are saved locally for offline access.
- **Recipes** — Explore meal recipes organized by meal type, view detailed ingredients & instructions, and set up a diet profile during onboarding.
- **Daily Routines** — Build a full week of tasks (workouts, recipes, general to‑dos) in a day‑by‑day planner. Check off items with a daily checklist that syncs to the server.
- **Progress Tracking** — Visualize your fitness journey with interactive area charts, bar charts, and pie charts powered by Recharts. Filter by day, week, month, or year.
- **User Profiles** — Edit username, display name, and avatar with photo uploads. Profile data is validated with Zod schemas.
- **Health Plan & Guidance** — Dedicated pages for managing your personal health plan and accessing guided wellness content.
- **Settings** — Configure notification preferences (email, push, SMS), manage recurring reminders, and personalize your weekly program.
- **Authentication** — Email/password & Google sign‑in via Firebase Auth, with JWT‑based server sessions stored as HTTP‑only cookies. Includes username/email login resolution and password reset.
- **Push Notifications & Reminders** — Web Push support, one‑time & recurring reminders, and a cron‑based delivery system with email (Resend) and push channels.
- **PWA‑Ready** — Ships with a web app manifest for add‑to‑home‑screen support.
- **3D Visuals** — Immersive Three.js scenes via React Three Fiber & Drei for select UI elements.
- **Glassmorphic UI** — A polished dark/light theme system with frosted‑glass cards, smooth Framer Motion animations, and the Sora + Space Grotesk type pairing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (98.4%) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **3D Graphics** | [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) (Client + Admin SDK) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Email** | [Resend](https://resend.com/) |
| **Push Notifications** | [web‑push](https://github.com/web-push-libs/web-push) |
| **Session Management** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (JWT) |
| **Icons** | [React Icons](https://react-icons.github.io/react-icons/) |
| **Linting** | [ESLint 9](https://eslint.org/) with next config |
| **Compiler** | [React Compiler](https://react.dev/learn/react-compiler) (Babel plugin) |

---

## Project Structure

```
elevate-fit/
├── app/                        # Next.js App Router pages & API routes
│   ├── layout.tsx              # Root layout (fonts, theme, bottom nav)
│   ├── page.tsx                # Home / Dashboard
│   ├── globals.css             # Global styles & CSS variables
│   ├── auth/
│   │   ├── login/page.tsx      # Login page (email/password + Google)
│   │   └── register/page.tsx   # Registration page
│   ├── gym/
│   │   ├── page.tsx            # Workout library listing
│   │   └── [id]/page.tsx       # Dynamic workout detail
│   ├── recipes/
│   │   ├── page.tsx            # Recipe listing
│   │   └── [id]/page.tsx       # Dynamic recipe detail
│   ├── routine/
│   │   └── [id]/page.tsx       # Dynamic routine item detail
│   ├── progress/page.tsx       # Progress charts & analytics
│   ├── profile/page.tsx        # User profile editor
│   ├── settings/page.tsx       # App settings & preferences
│   ├── health-plan/            # Health plan management
│   ├── guidance/               # Guided wellness content
│   ├── welcome/                # Onboarding / welcome flow
│   └── api/                    # Server‑side API route handlers
│       ├── auth/               # Session, login resolution, /me
│       ├── profile/            # Profile CRUD
│       ├── routine/            # Tasks, checklist, weekly program
│       ├── diet/               # Diet profile management
│       ├── notifications/      # Preferences, reminders, push, recurring
│       └── cron/               # Scheduled reminder delivery
├── components/                 # Reusable React components (by feature)
│   ├── layout/                 # DashboardShell, BottomNav, ThemeProvider
│   ├── shared/                 # GlassCard, SectionHeader
│   ├── dashboard/              # HomeClient, SummaryCard, FocusGrid, QuickStatRow
│   ├── workouts/               # GymClient, WorkoutDetailClient, WorkoutEditor
│   ├── recipes/                # RecipeDetailClient
│   ├── routine/                # RoutineDetailLoader, RoutineHeader
│   ├── progress/               # ProgressClient (charts & analytics)
│   ├── profile/                # AvatarUpload
│   ├── settings/               # SettingsClient
│   └── health/                 # Health‑plan editing components
├── lib/                        # Shared utilities & server logic
│   ├── auth/                   # Firebase client/admin SDK, JWT helpers, session
│   ├── data/                   # Static data (workouts, recipes, routines)
│   ├── db/                     # Mongoose connection
│   ├── diet/                   # Diet profile utilities
│   ├── models/                 # Mongoose models (User, Reminder, etc.)
│   ├── notifications/          # Email (Resend) & push notification senders
│   └── validation/             # Zod schemas & username validation
├── types/                      # Shared TypeScript type definitions
├── scripts/                    # Utility scripts
├── public/                     # Static assets & PWA manifest
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Dashboard — quick stats, focus tips, primary action |
| `/auth/login` | Login with email/password or Google |
| `/auth/register` | Create a new account |
| `/gym` | Browse the workout library |
| `/gym/[id]` | View & edit a specific workout |
| `/recipes` | Browse meal recipes |
| `/recipes/[id]` | View a specific recipe in detail |
| `/routine/[id]` | View & manage a routine item |
| `/progress` | Track fitness progress with charts |
| `/profile` | Edit user profile & avatar |
| `/settings` | Manage notification preferences & reminders |
| `/health-plan` | Personal health plan management |
| `/guidance` | Guided wellness content |
| `/welcome` | Onboarding flow for new users |

---

## API Routes

| Endpoint | Method(s) | Description |
|---|---|---|
| `/api/auth/session` | `POST` | Create a JWT session from a Firebase ID token |
| `/api/auth/me` | `GET` | Return the current authenticated user |
| `/api/auth/resolve` | `POST` | Resolve a username to an email for login |
| `/api/profile` | `PATCH` | Update user profile (username, name, avatar) |
| `/api/diet` | `GET` / `PUT` | Get or update diet profile |
| `/api/diet/daily` | `GET` | Generate a personalized daily diet plan |
| `/api/routine/tasks` | `GET` / `PUT` | Get or update weekly routine tasks |
| `/api/routine/checklist` | `GET` / `PUT` | Track daily task completion |
| `/api/routine/weekly-program` | `GET` / `PUT` | Manage weekly program preferences |
| `/api/notifications/preferences` | `GET` / `PUT` | Notification channel preferences |
| `/api/notifications/reminders` | `GET` / `POST` | One‑time reminders |
| `/api/notifications/recurring` | `GET` / `POST` / `PATCH` / `DELETE` | Recurring reminders |
| `/api/cron/reminders` | `GET` | Process and deliver due reminders |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A **MongoDB** instance (local or Atlas)
- A **Firebase** project with Authentication enabled
- *(Optional)* A [Resend](https://resend.com/) API key for email notifications

### 1. Clone the Repository

```bash
git clone https://github.com/ghanatherohit/elevate-fit.git
cd elevate-fit
```

### 2. Install Dependencies

```bash
pm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables) below).

### 4. Start the Development Server

```bash
pm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file with the following keys:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# MongoDB
MONGODB_URI=

# JWT Session Secret
JWT_SECRET=

# Resend (email)
RESEND_API_KEY=

# Web Push (VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

---

## Scripts

| Script | Command | Description |
|---|---|---|
| **Dev** | `npm run dev` | Start the Next.js development server |
| **Build** | `npm run build` | Create an optimized production build |
| **Start** | `npm run start` | Serve the production build |
| **Lint** | `npm run lint` | Run ESLint across the codebase |

---

## Contributing

Contributions are welcome! To get started:

1. **Fork** the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m "Add your feature"`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a **Pull Request**

---

## License

This project is licensed under the [MIT License](LICENSE).

---

**Built with 💪 by [@ghanatherohit](https://github.com/ghanatherohit)**