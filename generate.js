#!/usr/bin/env node
/**
 * generate.js  — ESM
 * Run: node generate.js
 * Output: public/today.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SUNRISE = "06:10";
const SUNSET  = "18:25";

const USERS = [
  { name: "N. Raajaraam", dob: "1970-04-26", place: "Chennai",        rasi: "Thanusu", nakshatra: "Moolam",    pakshi: "owl" },
  { name: "R. Madubala",  dob: "1977-02-16", place: "Tirutturaipundi",rasi: "Makaram", nakshatra: "Uthiradam", pakshi: "owl" },
  { name: "R. Adithya",   dob: "2001-09-14", place: "Chennai",        rasi: "Kadagam", nakshatra: "Poosam",    pakshi: "rooster" },
  { name: "R. Arudhra",   dob: "2004-09-16", place: "Chennai",        rasi: "Kanni",   nakshatra: "Hastham",   pakshi: "crow" },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function toMins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
}

// ─── DATE ──────────────────────────────────────────────────────────────────
function getISTDate() {
  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return {
    dateStr:      ist.toISOString().slice(0,10),
    weekday:      days[ist.getDay()],
    weekdayIndex: ist.getDay(),
    dayLabel:     `${ist.getDate()} ${months[ist.getMonth()]} ${ist.getFullYear()}`,
  };
}

// ─── RAHU / YAMA / GULIKAI ─────────────────────────────────────────────────
const RAHU_ORDER = [8,2,7,5,6,4,3];
const YAMA_ORDER = [5,4,3,2,1,7,6];
const GULI_ORDER = [7,6,5,4,3,2,8];

function computeKalam(sunriseMins, sunsetMins, orderArr, wday) {
  const part = (sunsetMins - sunriseMins) / 8;
  const slot  = orderArr[wday] - 1;
  const start = sunriseMins + slot * part;
  return { start: toHHMM(Math.round(start)), end: toHHMM(Math.round(start + part)) };
}

// ─── ABHIJIT ───────────────────────────────────────────────────────────────
function computeAbhijit(sunriseMins, sunsetMins) {
  const mid = (sunriseMins + sunsetMins) / 2;
  return { start: toHHMM(Math.round(mid - 24)), end: toHHMM(Math.round(mid + 24)) };
}

// ─── HORA ──────────────────────────────────────────────────────────────────
const PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

function computeHoras(sunriseMins, wday) {
  return Array.from({ length: 24 }, (_, i) => ({
    planet: PLANETS[(wday + i) % 7],
    start:  toHHMM(Math.round(((sunriseMins + i * 60) % 1440 + 1440) % 1440)),
    end:    toHHMM(Math.round(((sunriseMins + (i+1)*60) % 1440 + 1440) % 1440)),
  }));
}

// ─── GOWRI ─────────────────────────────────────────────────────────────────
const GOWRI_NAMES = [
  { en:"Amritha", ta:"அமிர்தம்",  quality:"good"   },
  { en:"Marana",  ta:"மரணம்",     quality:"bad"    },
  { en:"Dhaanya", ta:"தான்யம்",   quality:"good"   },
  { en:"Soumya",  ta:"சௌம்யம்",  quality:"good"   },
  { en:"Rogam",   ta:"ரோகம்",     quality:"bad"    },
  { en:"Laabham", ta:"லாபம்",     quality:"good"   },
  { en:"Subham",  ta:"சுபம்",     quality:"good"   },
  { en:"Dhandam", ta:"தண்டம்",    quality:"medium" },
];
const GOWRI_OFFSET = [0,4,1,5,2,6,3];

function computeGowri(sunriseMins, sunsetMins, wday) {
  const part = (sunsetMins - sunriseMins) / 8;
  const off  = GOWRI_OFFSET[wday];
  return GOWRI_NAMES.map((g, i) => ({
    ...g,
    quality: GOWRI_NAMES[(i + off) % 8].quality,
    start: toHHMM(Math.round(sunriseMins + i * part)),
    end:   toHHMM(Math.round(sunriseMins + (i+1) * part)),
  }));
}

// ─── PANCHA PAKSHI ─────────────────────────────────────────────────────────
/*
  5 birds: vulture, owl, crow, rooster, peacock
  5 activities per jamam (positional): Rule, Eat, Walk, Sleep, Die
  The RULING bird does its positional activity.
  Each other bird does the NEXT activity in sequence (rotating from the ruling bird's position).

  Standard Pancha Pakshi rule:
  - Jamam 1: ruling bird = RULE, next = EAT, next = WALK, next = SLEEP, next = DIE
  - Each bird gets the activity corresponding to its distance from the ruling bird.
*/
const BIRDS      = ["vulture","owl","crow","rooster","peacock"];
const ACTIVITIES = [
  { en:"Rule",  ta:"வல்லமை",  quality:"good"   },
  { en:"Eat",   ta:"உண்",     quality:"good"   },
  { en:"Walk",  ta:"நடை",    quality:"medium" },
  { en:"Sleep", ta:"தூக்கம்", quality:"orange" },
  { en:"Die",   ta:"மரணம்",   quality:"bad"    },
];

// Ruling bird index per weekday for DAY start
const DAY_START_BIRD = [0, 2, 4, 1, 3, 0, 2]; // Sun=vulture Mon=crow Tue=peacock Wed=owl Thu=rooster Fri=vulture Sat=crow

function buildStates(rulingBirdIdx) {
  // Each bird's activity = offset from ruling bird in BIRDS array
  const states = {};
  BIRDS.forEach((bird, i) => {
    const offset = ((i - rulingBirdIdx) % 5 + 5) % 5;
    states[bird] = ACTIVITIES[offset];
  });
  return states;
}

function computeJamams(sunriseMins, sunsetMins, wday) {
  const dayLen    = sunsetMins - sunriseMins;
  const nightLen  = 1440 - dayLen;
  const dayPart   = dayLen / 5;
  const nightPart = nightLen / 5;
  const startBird = DAY_START_BIRD[wday];
  const jamams    = [];

  // Day: 5 jamams
  for (let j = 0; j < 5; j++) {
    const rulingBirdIdx = (startBird + j) % 5;
    const start = sunriseMins + j * dayPart;
    jamams.push({
      period: "day",
      jamam:  j + 1,
      rulingBird: BIRDS[rulingBirdIdx],
      states: buildStates(rulingBirdIdx),
      start:  toHHMM(Math.round(start)),
      end:    toHHMM(Math.round(start + dayPart)),
    });
  }

  // Night: 5 jamams (reverse bird order)
  for (let j = 0; j < 5; j++) {
    const rulingBirdIdx = (startBird + 4 - j) % 5;
    const start = sunsetMins + j * nightPart;
    jamams.push({
      period: "night",
      jamam:  j + 1,
      rulingBird: BIRDS[rulingBirdIdx],
      states: buildStates(rulingBirdIdx),
      start:  toHHMM(Math.round(((start % 1440) + 1440) % 1440)),
      end:    toHHMM(Math.round((((start + nightPart) % 1440) + 1440) % 1440)),
    });
  }
  return jamams;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
function generate() {
  const { dateStr, weekday, weekdayIndex, dayLabel } = getISTDate();
  const sunriseMins = toMins(SUNRISE);
  const sunsetMins  = toMins(SUNSET);

  const out = {
    generated: new Date().toISOString(),
    date:      dateStr,
    dayLabel,
    weekday,
    sunrise:   SUNRISE,
    sunset:    SUNSET,
    rahuKalam:  computeKalam(sunriseMins, sunsetMins, RAHU_ORDER, weekdayIndex),
    yamagandam: computeKalam(sunriseMins, sunsetMins, YAMA_ORDER, weekdayIndex),
    gulikai:    computeKalam(sunriseMins, sunsetMins, GULI_ORDER, weekdayIndex),
    abhijit:    computeAbhijit(sunriseMins, sunsetMins),
    horas:      computeHoras(sunriseMins, weekdayIndex),
    gowri:      computeGowri(sunriseMins, sunsetMins, weekdayIndex),
    // Shared jamam schedule (10 slots: 5 day + 5 night)
    jamams: computeJamams(sunriseMins, sunsetMins, weekdayIndex),
    // User list (no per-person slot duplication)
    users: USERS,
  };

  const outPath = path.join(__dirname, "public", "today.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`✅ Generated ${outPath} for ${dateStr} (${weekday})`);
}

generate();
