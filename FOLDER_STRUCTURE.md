# Project folder structure

This file contains the recursive folder tree for this repository (generated automatically).

- `README.md`
- `backend/`
  - `package.json`
  - `package-lock.json`
  - `.gitignore`
  - `prisma.config.ts`
  - `prisma.config.mjs`
  - `prisma/`
    - `schema.prisma`
    - `migrations/`
      - `migration_lock.toml`
      - `20251107182638_init/`
        - `migration.sql`
      - `20251107214239_add_tournaments/`
        - `migration.sql`
  - `src/`
    - `server.js` (backend entrypoint)
    - `lib/`
      - `prisma.js`
    - `middleware/`
      - `auth.js`
    - `routes/`
      - `auth.js`
      - `tournaments.js`
      - `admin.tournaments.js`

- `frontend/`
  - `package.json`
  - `package-lock.json`
  - `.env`
  - `vite.config.js`
  - `INTEGRATION_GUIDE.md`
  - `index.html`
  - `dist/` (built assets)
    - `index.html`
    - `assets/`
      - `index-BuExQVFx.css`
      - `index-BigdOH2G.js`
  - `src/`
    - `main.jsx` (frontend entrypoint)
    - `App.jsx`
    - `services/`
      - `api.js`
    - `components/`
      - `Navbar.jsx`
      - `ProtectedRoute.jsx`
      - `AdminRoute.jsx`
    - `contexts/`
      - `AuthContext.jsx`
      - `LanguageContext.jsx`
    - `hooks/`
      - `useTournaments.js`
      - `useLeaderboard.js`
    - `i18n/`
      - `translations.js`
    - `pages/`
      - `HomePage.jsx`
      - `HomePage.jsx.backup`
      - `LeaderboardPage.jsx`
      - `LoginPage.jsx`
      - `ProfilePage.jsx`
      - `SignUpPage.jsx`
      - `TournamentsPage.jsx`
      - `admin/`
        - `AdminTournaments.jsx`
    - `styles/`
      - `global.css`
      - `HomePage.css`
      - `LeaderboardPage.css`
      - `Navbar.css`
      - `ProfilePage.css`
      - `SignUpPage.css`
      - `TournamentsPage.css`

## Notes
- Backend uses Prisma (schema at `backend/prisma/schema.prisma`) and has existing migrations under `backend/prisma/migrations/`.
- Backend server entrypoint: `backend/src/server.js`.
- Frontend entrypoint: `frontend/src/main.jsx` and `frontend/index.html`.
- Built frontend artifacts exist in `frontend/dist/` — remove or regenerate as needed when building locally.

If you want this tree in a different format (JSON, plain text, or added to `.gitignore`), tell me and I will update it.
