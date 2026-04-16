# Learn grid — Full-stack LMS

Learn grid is a learning management system: students browse courses, enroll (free checkout), watch YouTube-based lessons, and track progress; educators can publish courses, view dashboards, and manage enrollments. The app is a **React (Vite)** frontend and an **Express + MongoDB** API.

---

## Table of contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Repository layout](#repository-layout)
4. [Prerequisites](#prerequisites)
5. [Environment variables](#environment-variables)
6. [Local development](#local-development)
7. [API overview](#api-overview)
8. [Deploying the backend](#deploying-the-backend)
9. [Deploying the frontend](#deploying-the-frontend)
10. [Production checklist](#production-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌─────────────────┐     HTTPS / JSON      ┌──────────────────┐
│  React (Vite)   │ ◄─────────────────► │  Express API     │
│  Static / CDN   │     /api/*          │  Node.js         │
└─────────────────┘                      └────────┬─────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │   MongoDB    │
                                       │  (Atlas etc.) │
                                       └──────────────┘
```

- **Auth:** JWT in `Authorization: Bearer <token>` after login/register.
- **Enrollment:** Primary path is **free enrollment** (`POST /api/user/enroll-free`) with checkout details stored on the purchase record. Stripe checkout (`POST /api/user/purchase`) remains available if you configure Stripe and webhooks.
- **Videos:** Lesson URLs are expected to be **YouTube** links (watch, youtu.be, embed, shorts).

---

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite 5, React Router 7, Tailwind CSS, Axios, react-youtube, Quill |
| Backend  | Node.js (ES modules), Express 4, Mongoose 8, bcrypt, JWT, Stripe SDK (optional) |
| Database | MongoDB (connection string via `MONGODB_URI`) |

---

## Repository layout

```
lms-full-stack/
├── client/                 # Vite + React app
│   ├── src/
│   ├── public/
│   ├── vite.config.js      # Dev proxy: /api → backend (see below)
│   └── package.json
├── server/                 # Express API
│   ├── server.js
│   ├── configs/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (or pnpm/yarn)
- **MongoDB** — local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- (Optional) **Stripe** account if you use paid checkout and webhooks

---

## Environment variables

### Backend (`server/.env`)

Create `server/.env` (never commit real secrets):

```env
PORT=5001
JWT_SECRET=your-long-random-string
CURRENCY=USD

# Required — MongoDB connection string
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/DATABASE_NAME?appName=learngrid

# Optional — Stripe (only if you use paid purchase flow + webhooks)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- **`PORT`:** API listen port (default `5000` if omitted).
- **`JWT_SECRET`:** Used to sign and verify JWTs; must be strong and stable in production.
- **`MONGODB_URI`:** Required; server exits if missing.
- **Stripe:** Only needed for `POST /api/user/purchase` and `POST /stripe` webhook. Free enrollment does not require Stripe.

### Frontend (`client/.env`)

Create `client/.env`:

```env
# Production: set to your deployed API origin, no trailing slash
# Example: https://api.yourdomain.com
VITE_BACKEND_URL=https://your-api-host.example.com

VITE_CURRENCY=$
```

**Development:**

- If `VITE_BACKEND_URL` is **empty**, the Vite dev server proxies `/api` to `http://localhost:5001` (see `client/vite.config.js`). Ensure your API runs on the same port as the proxy target or change `vite.config.js` → `server.proxy['/api'].target`.
- If you set `VITE_BACKEND_URL=http://localhost:5001`, the browser calls the API directly; ensure **CORS** allows your Vite origin (`http://localhost:5173` or `5174`).

**Production:**

- Set `VITE_BACKEND_URL` to your **public API base URL** (scheme + host, no path). The client builds URLs like `${VITE_BACKEND_URL}/api/...`.
- Rebuild the frontend after any change to `VITE_` variables (`npm run build`).

---

## Local development

### 1. MongoDB

Have a cluster ready and copy the connection string into `server/.env` as `MONGODB_URI`.

### 2. Backend

```bash
cd server
npm install
npm run server
# or: npm start   (no file watcher)
```

You should see `Database Connected` and `Server is running on port …`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`).

### 4. First-time flow

1. Register / log in on the site.
2. (Optional) **Become Educator** to add courses.
3. Add courses with YouTube lecture URLs.
4. As a student, use **Enroll Now** → checkout (free) → **My Enrollments** → **Player** to watch lessons.

---

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Health: `Learn grid API` |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/course/all` | Published courses list |
| GET | `/api/course/:id` | Course detail |
| GET | `/api/user/data` | Current user (auth) |
| POST | `/api/user/enroll-free` | Free enrollment after checkout (auth) |
| POST | `/api/user/purchase` | Stripe checkout session (auth) |
| GET | `/api/user/enrolled-courses` | Enrolled courses (auth) |
| … | `/api/educator/*` | Educator routes (role + auth) |

Stripe webhook: `POST /stripe` (raw body; configure in Stripe Dashboard).

---

## Deploying the backend

You need a **Node.js** host that can run long-lived processes (or serverless with caveats), with **environment variables** set and **MongoDB Atlas** allowlisting the host IP (or `0.0.0.0/0` for serverless if acceptable to your security policy).

### Option A — VPS / VM (DigitalOcean, AWS EC2, Linode, etc.)

1. Install Node.js, clone the repo, `cd server && npm install --production`.
2. Copy `server/.env` to the server (use secrets manager or SSH).
3. Run with a process manager:

   ```bash
   NODE_ENV=production node server.js
   ```

   Or use **PM2**:

   ```bash
   npm install -g pm2
   cd server
   pm2 start server.js --name learngrid-api
   pm2 save && pm2 startup
   ```

4. Put **Nginx** (or Caddy) in front as reverse proxy: `https://api.yourdomain.com` → `http://127.0.0.1:5001`.
5. Open firewall for 80/443 only; keep the API on localhost.

### Option B — PaaS (Railway, Render, Fly.io, Heroku-style)

1. Set root directory to **`server`** (or monorepo build command that runs `node server.js`).
2. Set env vars in the platform UI (`MONGODB_URI`, `JWT_SECRET`, `PORT`, etc.).
3. Bind `PORT` from the platform (often injected automatically).
4. Deploy. Note the public URL (e.g. `https://learngrid-api.onrender.com`).

### Option C — Vercel (serverless)

The repo includes `server/vercel.json`. Serverless has **cold starts**, **request timeouts**, and **no persistent WebSocket**; Stripe webhooks must reach a **public HTTPS** URL. Test thoroughly.

1. Import the project; set **root** to `server` if required.
2. Add environment variables in Vercel.
3. Deploy and use the generated URL as `VITE_BACKEND_URL` for the frontend.

### CORS

The API uses `cors()` with default settings. If the browser blocks requests, ensure the frontend origin is allowed (you may need `app.use(cors({ origin: ['https://your-frontend.com'] }))` in production).

---

## Deploying the frontend

The frontend is a **static SPA** after build (`client/dist`).

### Build

```bash
cd client
npm install
npm run build
```

Output: `client/dist/`. Point your static host to this folder.

### Environment for production

Before building, set in `client/.env` (or CI env):

```env
VITE_BACKEND_URL=https://your-api.example.com
```

Then run `npm run build` again.

### Option A — Vercel (frontend)

`client/vercel.json` rewrites all routes to `/` for React Router.

1. Import repo; set **Root Directory** to `client`.
2. Build command: `npm run build`; output: `dist`.
3. Add `VITE_BACKEND_URL` in Project → Environment Variables.

### Option B — Netlify

- Build: `cd client && npm run build`
- Publish directory: `client/dist`
- Add same `VITE_*` env vars.
- Use a `_redirects` or Netlify `redirects` rule for SPA: `/* /index.html 200` (if not already covered).

### Option C — Nginx

```nginx
server {
  server_name app.yourdomain.com;
  root /var/www/learngrid/dist;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Option D — Cloudflare Pages / GitHub Pages / S3 + CloudFront

Upload `dist/` contents; configure SPA fallback to `index.html` for client-side routes.

---

## Production checklist

- [ ] `MONGODB_URI` points to production cluster; IP allowlist / VPC rules updated.
- [ ] `JWT_SECRET` is long, random, and unique to production.
- [ ] Frontend built with correct `VITE_BACKEND_URL` (HTTPS API URL).
- [ ] API served over **HTTPS**; HSTS considered at reverse proxy.
- [ ] Stripe keys and webhook URL set **only if** you use paid checkout; webhook signing secret matches.
- [ ] Remove or restrict demo credentials from any committed `.env` files.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| `EADDRINUSE` | Another process uses `PORT`; stop it or change `PORT`. |
| Mongo connection fails | `MONGODB_URI`, network access, Atlas IP allowlist. |
| Frontend calls wrong API | `VITE_BACKEND_URL` at build time; rebuild after changes. |
| CORS errors | API `cors` config; frontend origin must match. |
| Infinite loading on player | Enrolled course IDs must match URL `courseId` (fixed in code via string comparison). |
| YouTube not playing | Lecture URL must be a valid YouTube link (`watch?v=`, `youtu.be`, `embed`, etc.). |
| Auth / 401 | Token expired or `JWT_SECRET` changed between deploys. |

---

## Scripts reference

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `npm run server` | Dev API with nodemon |
| `server/` | `npm start` | Production-style API (`node server.js`) |
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Production bundle → `dist/` |
| `client/` | `npm run preview` | Preview production build locally |

---

## License

ISC (per `server/package.json`). Adjust if you add a project-wide license file.

---

## Support

For deployment issues, verify environment variables, MongoDB connectivity, and that the API root (`GET /`) returns `Learn grid API` before debugging the React app.
