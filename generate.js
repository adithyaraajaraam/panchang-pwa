#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── USERS ────────────────────────────────────────────────────────────────
const USERS = [
  { name: "N. Raajaraam", nakshatra: "Moolam", pakshi: "owl" },
  { name: "R. Madubala",  nakshatra: "Uthiradam", pakshi: "owl" },
  { name: "R. Adithya",   nakshatra: "Poosam", pakshi: "rooster" },
  { name: "R. Arudhra",   nakshatra: "Hastham", pakshi: "crow" },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
const toMins = t => {
  const [h,m] = t.split(":").map(Number);
  return h*60+m;
};
const toHHMM = m => {
  m = ((m%1440)+1440)%1440;
  return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
};

// ─── SUN (DYNAMIC + FALLBACK) ──────────────────────────────────────────────
async function getSunTimes() {
  try {
    const res = await fetch("https://api.sunrise-sunset.org/json?lat=13.0827&lng=80.2707&formatted=0");
    const j = await res.json();

    const sunrise = new Date(j.results.sunrise)
      .toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"});

    const sunset = new Date(j.results.sunset)
      .toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"});

    return { sunrise, sunset };
  } catch {
    return { sunrise:"06:00", sunset:"18:00" };
  }
}

// ─── DATE ──────────────────────────────────────────────────────────────────
function getIST() {
  const d = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
  return {
    date: d.toISOString().slice(0,10),
    weekday: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()],
    weekdayIndex: d.getDay()
  };
}

// ─── RAHU / YAMA / GULIKAI ────────────────────────────────────────────────
const RAHU=[8,2,7,5,6,4,3];
const YAMA=[5,4,3,2,1,7,6];
const GULI=[7,6,5,4,3,2,8];

function kalam(sr,ss,order,w) {
  const part=(ss-sr)/8;
  const s=sr+(order[w]-1)*part;
  return {start:toHHMM(s),end:toHHMM(s+part)};
}

// ─── ABHIJIT ──────────────────────────────────────────────────────────────
function abhijit(sr, ss) {
  const mid = (sr + ss) / 2;
  return {
    start: toHHMM(mid - 24),
    end: toHHMM(mid + 24)
  };
}

// ─── HORA ─────────────────────────────────────────────────────────────────
const PLANETS=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

function horas(sr,w) {
  return Array.from({length:24},(_,i)=>({
    planet:PLANETS[(w+i)%7],
    start:toHHMM(sr+i*60),
    end:toHHMM(sr+(i+1)*60)
  }));
}

// ─── GOWRI ────────────────────────────────────────────────────────────────
const GOWRI=[
  {en:"Amritha",ta:"அமிர்தம்",q:"good"},
  {en:"Marana",ta:"மரணம்",q:"bad"},
  {en:"Dhaanya",ta:"தான்யம்",q:"good"},
  {en:"Soumya",ta:"சௌம்யம்",q:"good"},
  {en:"Rogam",ta:"ரோகம்",q:"bad"},
  {en:"Laabham",ta:"லாபம்",q:"good"},
  {en:"Subham",ta:"சுபம்",q:"good"},
  {en:"Dhandam",ta:"தண்டம்",q:"medium"}
];
const OFF=[0,4,1,5,2,6,3];

function gowri(sr,ss,w){
  const p=(ss-sr)/8;
  const off=OFF[w];
  return GOWRI.map((g,i)=>({
    en:g.en,
    ta:g.ta,
    quality:GOWRI[(i+off)%8].q,
    start:toHHMM(sr+i*p),
    end:toHHMM(sr+(i+1)*p)
  }));
}

// ─── PANCHA PAKSHI ────────────────────────────────────────────────────────
const BIRDS=["owl","crow","rooster","peacock","falcon"];
const ACT=[
  {en:"Rule",ta:"வல்லமை",quality:"good"},
  {en:"Eat",ta:"உண்",quality:"good"},
  {en:"Walk",ta:"நடை",quality:"medium"},
  {en:"Sleep",ta:"தூக்கம்",quality:"orange"},
  {en:"Die",ta:"மரணம்",quality:"bad"}
];

function states(r){
  const s={};
  BIRDS.forEach((b,i)=>{
    const o=((i-r)%5+5)%5;
    s[b]=ACT[o];
  });
  return s;
}

function jamams(sr,ss){
  const d=ss-sr, n=1440-d;
  const dp=d/5, np=n/5;
  const out=[];

  for(let j=0;j<5;j++){
    const r=j%5;
    const st=sr+j*dp;
    out.push({
      period:"day",
      jamam:j+1,
      rulingBird:BIRDS[r],
      states:states(r),
      start:toHHMM(st),
      end:toHHMM(st+dp)
    });
  }

  for(let j=0;j<5;j++){
    const r=(4-j)%5;
    const st=ss+j*np;
    out.push({
      period:"night",
      jamam:j+1,
      rulingBird:BIRDS[r],
      states:states(r),
      start:toHHMM(st),
      end:toHHMM(st+np)
    });
  }

  return out;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
async function main(){
  const {date,weekday,weekdayIndex}=getIST();
  const {sunrise,sunset}=await getSunTimes();

  const sr=toMins(sunrise);
  const ss=toMins(sunset);

  const data={
    date,
    weekday,
    sunrise,
    sunset,
    rahuKalam:kalam(sr,ss,RAHU,weekdayIndex),
    yamagandam:kalam(sr,ss,YAMA,weekdayIndex),
    gulikai:kalam(sr,ss,GULI,weekdayIndex),
    abhijit:abhijit(sr,ss),
    horas:horas(sr,weekdayIndex),
    gowri:gowri(sr,ss,weekdayIndex),
    jamams:jamams(sr,ss),
    users:USERS
  };

  fs.writeFileSync(
    path.join(__dirname,"public","today.json"),
    JSON.stringify(data,null,2)
  );

  console.log("✅ today.json generated");
}

await main();
