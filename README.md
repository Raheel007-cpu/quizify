# Quizify

Quizify is a full-stack interactive quiz and learning platform with role-based access for **Students** and **Admins**. Students can browse published quizzes, take timed randomized assessments, review detailed answer explanations, and track their performance and leaderboard rankings. Admins can manage subjects, categories, a reusable question bank (supporting 2-option True/False, 3-option, and 4-option MCQs), and publish quizzes.

**Live Demo**: https://quizify-2026.duckdns.org/
---

## Features

### Student Experience
- **Authentication & Sessions**: Secure registration and sign-in backed by JWT stored in `HttpOnly` cookies.
- **Quiz Catalog**: Filter published quizzes by subject, category, difficulty (`EASY`, `MEDIUM`, `HARD`), or search query.
- **Timed Quiz Attempts**:
  - Server-randomized question selection per attempt.
  - Answer choices are never exposed before submission.
  - Auto-save progress, keyboard shortcuts (`A–D` / `1–4`, arrow keys), and backend-enforced timer expiration.
- **Results & Answer Review**: Instant score calculation, pass/fail status, and per-question review with explanations.
- **Analytics & Leaderboard**: Personal performance trends, subject-wise breakdown, and global leaderboard rankings.

### Admin Dashboard
- **Subjects & Categories**: Organize quizzes and questions hierarchically.
- **Question Bank**: Create, edit, search, and filter reusable questions with **2, 3, or 4 options** (including a **True / False Preset**), correct answer validation, and explanations.
- **Quiz Management**: Assemble quizzes from the question bank and control `DRAFT` vs `PUBLISHED` visibility.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, React Router, Recharts, CSS Modules |
| **Backend** | Node.js, Express, Zod (validation), Helmet, CORS |
| **ORM & Database** | Prisma ORM, PostgreSQL 16 |
| **Auth & Security** | JWT (`jsonwebtoken`), `bcryptjs`, `HttpOnly` cookies |
| **Testing & Linting** | Node.js built-in test runner (`node --test`), Vitest, React Testing Library, ESLint |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## Architecture

### Production Deployment (AWS)

```text
User Browser (HTTPS)
   │
   ▼
DuckDNS (quizify-2026.duckdns.org)
   │
   ▼
Amazon EC2 (Ubuntu + Docker Compose)
   ├── Caddy (Automatic Let's Encrypt TLS / HTTPS termination)
   │      │
   │      ▼
   ├── Client Container (Nginx 1.27 serving React/Vite static bundle)
   │      ├── /*      ──> React SPA (index.html fallback)
   │      └── /api/*  ──> Reverse-proxied to http://server:5000/api/
   │
   └── Server Container (Node.js + Express API on port 5000)
          │
          ▼
   Amazon RDS (PostgreSQL 16)
```

### Local Development

- **Frontend (`client/`)**: Runs on Vite dev server (`http://localhost:5173`) and proxies `/api` requests to `http://127.0.0.1:5000`.
- **Backend (`server/`)**: Runs Express on `http://localhost:5000` connected to local PostgreSQL via `server/.env`.

---

## Project Structure

```text
quizify/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (QuestionCard, Modal, Timer, etc.)
│   │   ├── pages/          # Student & Admin pages
│   │   ├── tests/          # Vitest + React Testing Library tests
│   │   └── utils/          # Validators & API helpers
│   ├── nginx.conf          # Production Nginx config + /api reverse proxy
│   └── Dockerfile
├── server/                 # Node.js + Express backend
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, RBAC, error handling
│   ├── prisma/             # Prisma schema, migrations, and dev seed
│   ├── routes/             # Express API routes
│   ├── services/           # Business logic
│   ├── tests/              # API integration tests (node --test)
│   ├── validators/         # Zod request schemas
│   └── Dockerfile
├── docker-compose.yml      # Local/single-VM Docker Compose (Postgres + Server + Client)
└── DEPLOYMENT_AWS.md       # AWS deployment guide
```

---

## Local Setup

1. **Install dependencies:**
   ```bash
   npm --prefix server install
   npm --prefix client install
   ```

2. **Configure environment variables:**
   - Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and `JWT_SECRET`.
   - Copy `client/.env.example` to `client/.env`.

3. **Run database migrations:**
   ```bash
   npm --prefix server run prisma:migrate:deploy
   ```

4. **Start development servers:**
   ```bash
   npm --prefix server run dev
   npm --prefix client run dev
   ```

---

## Running Tests & Checks

```bash
# Backend integration tests & lint
npm --prefix server test
npm --prefix server run lint

# Frontend unit tests, lint & production build
npm --prefix client test
npm --prefix client run lint
npm --prefix client run build
```
