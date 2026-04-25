# பஞ்சாங்கம் — Panchang PWA

Static PWA for daily Panchang + Pancha Pakshi. Chennai IST. No backend.

## Folder Structure

```
panchang-pwa/
├── generate.js          ← Node script: computes all data → public/today.json
├── public/
│   ├── today.json       ← Auto-generated daily data
│   ├── manifest.json    ← PWA manifest
│   └── sw.js            ← Service worker (offline)
├── src/
│   ├── main.jsx         ← React entry
│   └── App.jsx          ← Full UI
├── index.html
├── vite.config.js
├── package.json
├── vercel.json
└── .github/workflows/daily.yml  ← Auto-generate + deploy every day
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Generate today's data
node generate.js

# 3. Dev server
npm run dev
# → http://localhost:3000
```

## Generate Data

```bash
node generate.js
# Creates public/today.json with:
# - Rahu Kalam, Yamagandam, Gulikai
# - Abhijit Muhurat
# - 24 Horas
# - 8 Gowri Panchangam slots
# - Pancha Pakshi for all 4 persons
```

## Build & Preview

```bash
npm run build    # generates + builds to dist/
npm run preview  # preview production build
```

## Deploy to Vercel

### One-time setup:

```bash
npm i -g vercel
vercel login
vercel          # first deploy → creates project
```

### GitHub Actions (auto daily):

Add these secrets to your GitHub repo:
- `VERCEL_TOKEN` → from vercel.com → Settings → Tokens
- `VERCEL_ORG_ID` → from `.vercel/project.json` after first deploy
- `VERCEL_PROJECT_ID` → from `.vercel/project.json`

The workflow runs at 00:01 IST every day automatically.

## Customization

### Change sunrise/sunset
Edit top of `generate.js`:
```js
const SUNRISE = "06:10";
const SUNSET  = "18:25";
```

### Add/remove users
Edit the `USERS` array in `generate.js`.

### Pakshi (bird) lookup
Each user has a `pakshi` field: `vulture | owl | crow | rooster | peacock`

## Features

- ✅ Rahu Kalam, Yamagandam, Gulikai
- ✅ Abhijit Muhurat
- ✅ 24-slot Hora (planetary hour)
- ✅ Gowri Panchangam (8 slots)
- ✅ Pancha Pakshi per person (day + night jamams)
- ✅ NOW button → live active status (● / ○)
- ✅ Color coding: green / yellow / orange / red
- ✅ Bilingual: English + Tamil
- ✅ PWA (installable, offline-capable)
- ✅ Mobile-first, dark theme
- ✅ Zero external APIs

## Color Legend

| Color  | Meaning              |
|--------|----------------------|
| 🟢 Green  | Good / Rule / Eat   |
| 🟡 Yellow | Walk (moderate)     |
| 🟠 Orange | Sleep               |
| 🔴 Red    | Avoid / Death / Rahu|
