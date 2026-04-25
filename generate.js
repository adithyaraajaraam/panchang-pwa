#!/usr/bin/env node
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ───────── USERS ───────── */
const USERS = [
  { name: "N. Raajaraam", nakshatra: "Moolam", pakshi: "owl" },
  { name: "R. Madubala",  nakshatra: "Uthiradam", pakshi: "owl" },
  { name: "R. Adithya",   nakshatra: "Poosam", pakshi: "rooster" },
  { name: "R. Arudhra",   nakshatra: "Hastham", pakshi: "crow" },
];

/* ───────── HELPERS ───────── */
const toMins = t => {
  if(!t) return 0;
  const [h,m] = t.split(":").map(Number);
  return h*60+m;
};

const toHHMM = m => {
  m = ((Math.round(m)%1440)+1440)%1440;
  return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
};

/* ───────── IST TIME ───────── */
function getCurrentIST(){
  return new Date().toLocaleTimeString("en-GB",{
    timeZone:"Asia/Kolkata",
    hour:"2-digit",
    minute:"2-digit"
  });
}

/* ───────── PANCHANG DATE (SUNRISE BASED) ───────── */
function getPanchangDate(sunriseStr){
  const nowIST = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));

  const [h,m] = sunriseStr.split(":").map(Number);

  const sunrise = new Date(nowIST);
  sunrise.setHours(h,m,0,0);

  let ref = new Date(nowIST);

  if(nowIST < sunrise){
    ref.setDate(ref.getDate() - 1);
  }

  return {
    date: ref.toISOString().slice(0,10),
    weekdayIndex: ref.getDay(),
    weekday: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][ref.getDay()]
  };
}

/* ───────── SUN (CHENNAI) ───────── */
async function getSunTimes(){
  try{
    const res = await fetch("https://api.sunrise-sunset.org/json?lat=13.0827&lng=80.2707&formatted=0");
    const j = await res.json();

    if(!j?.results) throw new Error("bad api");

    const sunrise = new Date(j.results.sunrise)
      .toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"});

    const sunset = new Date(j.results.sunset)
      .toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"});

    return {sunrise, sunset};

  }catch{
    return {sunrise:"05:50", sunset:"18:23"};
  }
}

/* ───────── RAHU/YAMA/GULI ───────── */
const RAHU=[8,2,7,5,6,4,3];
const YAMA=[5,4,3,2,1,7,6];
const GULI=[7,6,5,4,3,2,8];

function kalam(sr, ss, order, w){
  const part=(ss-sr)/8;
  const s=sr+(order[w]-1)*part;
  return {start:toHHMM(s), end:toHHMM(s+part)};
}

/* ───────── ABHIJIT ───────── */
function abhijit(sr, ss){
  const mid=(sr+ss)/2;
  return { start:toHHMM(mid-24), end:toHHMM(mid+24) };
}

/* ───────── HORA ───────── */
const HORA_SEQ=["Sun","Venus","Mercury","Moon","Saturn","Jupiter","Mars"];
const DAY_START=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

function horas(sr, ss, w){
  const d=ss-sr;
  const n=1440-d;

  const dh=d/12;
  const nh=n/12;

  let idx = HORA_SEQ.indexOf(DAY_START[w]);

  const out=[];

  for(let i=0;i<12;i++){
    out.push({
      planet:HORA_SEQ[(idx+i)%7],
      start:toHHMM(sr+i*dh),
      end:toHHMM(sr+(i+1)*dh)
    });
  }

  for(let i=0;i<12;i++){
    out.push({
      planet:HORA_SEQ[(idx+12+i)%7],
      start:toHHMM(ss+i*nh),
      end:toHHMM(ss+(i+1)*nh)
    });
  }

  return out;
}

/* ───────── GOWRI (SAFE + NO CRASH) ───────── */
const GOWRI_SEQ=[
  {en:"Soram", ta:"சோரம்", quality:"bad"},
  {en:"Uthi", ta:"உத்தி", quality:"good"},
  {en:"Visham", ta:"விஷம்", quality:"bad"},
  {en:"Amirdha", ta:"அமிர்தம்", quality:"good"},
  {en:"Rogam", ta:"ரோகம்", quality:"bad"},
  {en:"Laabam", ta:"லாபம்", quality:"good"},
  {en:"Dhanam", ta:"தனம்", quality:"good"},
  {en:"Sugam", ta:"சுகம்", quality:"good"}
];

function gowri(sr, ss, w){
  const d = ss - sr;
  const n = 1440 - d;

  const dp = d / 8;
  const np = n / 8;

  // ✅ FIXED (all 7 days mapped)
  const startIndex = [0,1,2,3,4,5,6][w];

  const out=[];

  for(let i=0;i<8;i++){
    const g = GOWRI_SEQ[(startIndex+i)%8] || GOWRI_SEQ[0];
    out.push({
      period:"day",
      ...g,
      start:toHHMM(sr+i*dp),
      end:toHHMM(sr+(i+1)*dp)
    });
  }

  for(let i=0;i<8;i++){
    const g = GOWRI_SEQ[(startIndex+8+i)%8] || GOWRI_SEQ[0];
    out.push({
      period:"night",
      ...g,
      start:toHHMM(ss+i*np),
      end:toHHMM(ss+(i+1)*np)
    });
  }

  return out;
}

/* ───────── MAIN ───────── */
async function main(){

  const {sunrise,sunset}=await getSunTimes();
  const {date,weekdayIndex,weekday}=getPanchangDate(sunrise);

  const now = getCurrentIST();

  const sr=toMins(sunrise);
  const ss=toMins(sunset);

  const data={
    date: date || "",
    weekday: weekday || "",
    now: now || "",
    sunrise: sunrise || "",
    sunset: sunset || "",

    rahuKalam:kalam(sr,ss,RAHU,weekdayIndex),
    yamagandam:kalam(sr,ss,YAMA,weekdayIndex),
    gulikai:kalam(sr,ss,GULI,weekdayIndex),

    abhijit:abhijit(sr,ss),

    horas:horas(sr,ss,weekdayIndex) || [],
    gowri:gowri(sr,ss,weekdayIndex) || [],

    users: USERS
  };

  fs.writeFileSync(
    path.join(__dirname,"public","today.json"),
    JSON.stringify(data,null,2)
  );

  console.log("✅ Generated today.json");
}

await main();
