Build and/or upgrade a SIMPLE, CLEAN, MOBILE-FIRST Progressive Web App (PWA) for daily Panchang + Pancha Pakshi.

IMPORTANT:

- If project already exists → MODIFY (do NOT rebuild)
- If not → create full project

---

GOAL

Single URL app (iPhone Safari compatible) showing:

1. Pancha Pakshi
2. Rahu Kalam
3. Yamagandam
4. Gulikai
5. Hora (24 hours)
6. Gowri Panchangam
7. Abhijit Muhurat

---

CORE REQUIREMENTS

✔ Fully static (NO backend)
✔ JSON-based data
✔ Node script for daily generation
✔ Deployable on Vercel
✔ Works 24/7 (00:00 → 23:59)
✔ Real-time updates
✔ White theme (high contrast)
✔ Mobile-first UI

---

INPUT (PREDEFINED USERS)

[
{
"name": "N. Raajaraam",
"dob": "1970-04-26",
"time": "00:42",
"place": "Chennai",
"rasi": "Thanusu",
"nakshatra": "Moolam",
"pakshi": "vulture"
},
{
"name": "R. Madubala",
"dob": "1977-02-16",
"time": "10:00",
"place": "Tirutturaipundi",
"rasi": "Makaram",
"nakshatra": "Uthiradam",
"pakshi": "crow"
},
{
"name": "R. Adithya",
"dob": "2001-09-14",
"time": "13:50",
"place": "Chennai",
"rasi": "Kadagam",
"nakshatra": "Poosam",
"pakshi": "owl"
},
{
"name": "R. Arudhra",
"dob": "2004-09-16",
"time": "08:50",
"place": "Chennai",
"rasi": "Kanni",
"nakshatra": "Hastham",
"pakshi": "rooster"
}
]

---

FEATURES

A) DAILY DATA GENERATION (generate.js)

Compute:

- Rahu Kalam (weekday formula)
- Yamagandam
- Gulikai
- Abhijit Muhurat (solar midpoint ±24 min)
- Hora → 24 slots (full 24h)
- Gowri → 8 slots
- Pancha Pakshi → rule engine (jamams)

Output:
public/today.json

---

B) TIME ENGINE (CRITICAL)

- Convert all times → minutes (0–1440)
- Handle midnight crossing:

IF end < start:
end += 1440

- System must run 24/7 (00:00–23:59)

---

C) REAL-TIME SYSTEM

- Recalculate every 60 seconds
- No manual refresh
- No API calls

---

D) CURRENT TIME DISPLAY (TOP)

Show:

Now: HH:MM IST · 🌟 Hora: <planet>

Must auto update

---

E) PAKSHI ENGINE (CRITICAL FIX)

RULE:

At ANY time:
→ EVERY PERSON must have ONE state

NO "resting"

Allowed states only:

- rule → GOOD
- eat → GOOD
- walk → WALK
- sleep → SLEEP
- death → AVOID

Logic:

currentJamam = findCurrentSlot()

For each person:
state = currentJamam.states[person.pakshi]

---

F) UI RULE (VERY IMPORTANT)

❌ Do NOT highlight only one person  
✔ Show ALL persons always  
✔ Each person shows their current state

Example:

Raajaraam → 🟢 Eat  
Madubala → 🟡 Walk  
Adithya → 🟢 Rule  
Arudhra → 🟠 Sleep

---

G) COLOR SYSTEM

GOOD → green
WALK → yellow
SLEEP → orange
AVOID → red

---

H) WHITE THEME (HIGH VISIBILITY)

background: #ffffff  
text: #000000  
divider: #e5e5e5

current row:
background: #f5f5f5

---

I) UI STRUCTURE

TOP:
Now time + current Hora

SECTION 1:
Rahu / Yamagandam / Gulikai

SECTION 2:
Abhijit

SECTION 3:
Hora (highlight current)

SECTION 4:
Gowri

SECTION 5:
Pancha Pakshi (per person)

---

J) MOBILE UX

- Large readable text
- Clean spacing
- Scroll-friendly
- No clutter

---

K) PERFORMANCE

- No backend
- No APIs
- JSON only
- <100KB bundle

---

FILES

/public/today.json  
/generate.js  
/src/App.jsx  
/public/manifest.json  
.github/workflows/daily.yml

---

AUTOMATION

GitHub Action:

- Runs daily
- Executes generate.js
- Updates today.json
- Push → Vercel auto deploy

---

FAILURE POINTS (MUST HANDLE)

- Midnight crossing bug
- Wrong time comparison
- Missing pakshi states
- Showing "resting"
- Only one person highlighted
- Hora not 24h
- timezone mismatch

---

IMPORTANT RULES

- Keep code SIMPLE
- No overengineering
- No backend
- No heavy libraries
- Minimal logic, maximum clarity

---

DELIVER

- Full working code OR patch update
- Clean App.jsx
- Working generate.js
- Ready to run + deploy steps

---

SUCCESS CRITERIA

✔ Works 24/7  
✔ All persons always have a state  
✔ No “resting”  
✔ Correct colors  
✔ Current time visible  
✔ Real-time updates  
✔ Clean white UI  
✔ Mobile friendly
