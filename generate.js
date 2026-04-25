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

// ─── DYNAMIC SUN (with fallback) ───────────────────────────────────────────
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
    // fallback
    return { sunrise:"06:00", sunset:"18:00" };
  }
}

// ─── DATE ──────────────────────────────────────────────────────────────────
function getIST() {
  const d = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
  return {
    date: d.toISOString().slice(0,10),
    weekdayIndex: d.getDay()
  };
}

// ─── RAHU/YAMA/GULI ────────────────────────────────────────────────────────
const RAHU=[8,2,7,5,6,4,3];
const YAMA=[5,4,3,2,1,7,6];
const GULI=[7,6,5,4,3,2,8];

function kalam(sunrise,sunset,order,w) {
  const part=(sunset-sunrise)/8;
  const s=sunrise+(order[w]-1)*part;
  return {start:toHHMM(s),end:toHHMM(s+part)};
}

// ─── HORA ──────────────────────────────────────────────────────────────────
const PLANETS=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

function horas(sunrise,w) {
  return Array.from({length:24},(_,i)=>({
    planet:PLANETS[(w+i)%7],
    start:toHHMM(sunrise+i*60),
    end:toHHMM(sunrise+(i+1)*60)
  }));
}

// ─── GOWRI ─────────────────────────────────────────────────────────────────
const GOWRI=[
  {en:"Amritha",q:"good"},
  {en:"Marana",q:"bad"},
  {en:"Dhaanya",q:"good"},
  {en:"Soumya",q:"good"},
  {en:"Rogam",q:"bad"},
  {en:"Laabham",q:"good"},
  {en:"Subham",q:"good"},
  {en:"Dhandam",q:"medium"}
];
const OFF=[0,4,1,5,2,6,3];

function gowri(sunrise,sunset,w){
  const p=(sunset-sunrise)/8;
  const off=OFF[w];
  return GOWRI.map((g,i)=>({
    ...g,
    quality:GOWRI[(i+off)%8].q,
    start:toHHMM(sunrise+i*p),
    end:toHHMM(sunrise+(i+1)*p)
  }));
}

// ─── PANCHA PAKSHI (FINAL PRACTICAL) ───────────────────────────────────────
const BIRDS=["owl","crow","rooster","peacock","falcon"];
const ACT=[
  {en:"Rule",q:"good"},
  {en:"Eat",q:"good"},
  {en:"Walk",q:"medium"},
  {en:"Sleep",q:"orange"},
  {en:"Die",q:"bad"}
];

// practical: owl start (since you’re not computing paksha)
function states(rIdx){
  const s={};
  BIRDS.forEach((b,i)=>{
    const o=((i-rIdx)%5+5)%5;
    s[b]=ACT[o];
  });
  return s;
}

function jamams(sunrise,sunset){
  const d=sunset-sunrise;
  const n=1440-d;
  const dp=d/5, np=n/5;

  const out=[];

  for(let j=0;j<5;j++){
    const r=j%5;
    const st=sunrise+j*dp;
    out.push({
      period:"day",
      ruling:BIRDS[r],
      states:states(r),
      start:toHHMM(st),
      end:toHHMM(st+dp)
    });
  }

  for(let j=0;j<5;j++){
    const r=(4-j)%5;
    const st=sunset+j*np;
    out.push({
      period:"night",
      ruling:BIRDS[r],
      states:states(r),
      start:toHHMM(st),
      end:toHHMM(st+np)
    });
  }

  return out;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main(){
  const {date,weekdayIndex}=getIST();
  const {sunrise,sunset}=await getSunTimes();

  const sr=toMins(sunrise);
  const ss=toMins(sunset);

  const data={
    date,
    sunrise,
    sunset,
    rahu:kalam(sr,ss,RAHU,weekdayIndex),
    yama:kalam(sr,ss,YAMA,weekdayIndex),
    gulikai:kalam(sr,ss,GULI,weekdayIndex),
    horas:horas(sr,weekdayIndex),
    gowri:gowri(sr,ss,weekdayIndex),
    jamams:jamams(sr,ss),
    users:USERS
  };

  fs.writeFileSync(
    path.join(__dirname,"public","today.json"),
    JSON.stringify(data,null,2)
  );

  console.log("✅ done");
}

await main();
