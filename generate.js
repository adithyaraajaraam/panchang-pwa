#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ───────── USERS ───────── */
const USERS = [
  { name: "N. Raajaraam", nakshatra: "Moolam",    pakshi: "owl" },
  { name: "R. Madubala",  nakshatra: "Uthiradam", pakshi: "owl" },
  { name: "R. Adithya",   nakshatra: "Poosam",    pakshi: "rooster" },
  { name: "R. Arudhra",   nakshatra: "Hastham",   pakshi: "crow" },
];

/* ───────── HELPERS ───────── */
const toMins = t => {
  const [h,m] = t.split(":").map(Number);
  return h*60+m;
};

const toHHMM = m => {
  m = ((Math.round(m)%1440)+1440)%1440;
  return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
};

/* ───────── SUN (Chennai) ───────── */
async function getSunTimes(){
  try{
    const res = await fetch("https://api.sunrise-sunset.org/json?lat=13.0827&lng=80.2707&formatted=0");
    const j = await res.json();

    const sunrise = new Date(j.results.sunrise)
      .toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"});

    const sunset = new Date(j.results.sunset)
      .toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"});

    return { sunrise, sunset };
  }catch{
    return { sunrise:"06:00", sunset:"18:00" };
  }
}

/* ───────── DATE ───────── */
function getIST(){
  const d = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
  return {
    date: d.toISOString().slice(0,10),
    weekdayIndex: d.getDay(),
    weekday: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]
  };
}

/* ───────── RAHU/YAMA/GULI ───────── */
const RAHU=[8,2,7,5,6,4,3];
const YAMA=[5,4,3,2,1,7,6];
const GULI=[7,6,5,4,3,2,8];

function kalam(sr,ss,order,w){
  const p=(ss-sr)/8;
  const s=sr+(order[w]-1)*p;
  return { start:toHHMM(s), end:toHHMM(s+p) };
}

/* ───────── ABHIJIT ───────── */
function abhijit(sr,ss){
  const mid=(sr+ss)/2;
  return {
    start:toHHMM(mid-24),
    end:toHHMM(mid+24)
  };
}

/* ───────── HORA (CORRECT) ───────── */
const PLANETS=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

function horas(sr,ss,w){
  const d=ss-sr;
  const n=1440-d;

  const dh=d/12;
  const nh=n/12;

  const out=[];

  for(let i=0;i<12;i++){
    out.push({
      planet:PLANETS[(w+i)%7],
      start:toHHMM(sr+i*dh),
      end:toHHMM(sr+(i+1)*dh)
    });
  }

  for(let i=0;i<12;i++){
    out.push({
      planet:PLANETS[(w+12+i)%7],
      start:toHHMM(ss+i*nh),
      end:toHHMM(ss+(i+1)*nh)
    });
  }

  return out;
}

/* ───────── GOWRI (REAL NAMES + MEANING) ───────── */
const GOWRI = [
  { en:"Soram",   ta:"சோரம்",   quality:"bad"   }, // Bad
  { en:"Uthi",    ta:"உத்தி",   quality:"good"  }, // Good
  { en:"Visham",  ta:"விஷம்",   quality:"bad"   }, // Bad
  { en:"Amirdha", ta:"அமிர்தம்", quality:"good" }, // BEST
  { en:"Rogam",   ta:"ரோகம்",   quality:"bad"   }, // Evil
  { en:"Laabam",  ta:"லாபம்",   quality:"good"  }, // Gain
  { en:"Dhanam",  ta:"தனம்",    quality:"good"  }, // Wealth
  { en:"Sugam",   ta:"சுகம்",    quality:"good"  }  // Good
];

function gowri(sr,ss){
  const d=ss-sr;
  const n=1440-d;

  const dp=d/8;
  const np=n/8;

  const out=[];

  // Day
  for(let i=0;i<8;i++){
    out.push({
      period:"day",
      ...GOWRI[i],
      start:toHHMM(sr+i*dp),
      end:toHHMM(sr+(i+1)*dp)
    });
  }

  // Night
  for(let i=0;i<8;i++){
    out.push({
      period:"night",
      ...GOWRI[i],
      start:toHHMM(ss+i*np),
      end:toHHMM(ss+(i+1)*np)
    });
  }

  return out;
}

/* ───────── PANCHA PAKSHI ───────── */
const BIRDS=["owl","crow","rooster","peacock","falcon"];

const ACT=[
  { en:"Rule",ta:"வல்லமை",quality:"good" },
  { en:"Eat",ta:"உண்",quality:"good" },
  { en:"Walk",ta:"நடை",quality:"medium" },
  { en:"Sleep",ta:"தூக்கம்",quality:"orange" },
  { en:"Die",ta:"மரணம்",quality:"bad" }
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
  const d=ss-sr;
  const n=1440-d;

  const dp=d/5;
  const np=n/5;

  const out=[];

  for(let j=0;j<5;j++){
    const st=sr+j*dp;
    out.push({
      period:"day",
      jamam:j+1,
      rulingBird:BIRDS[j],
      states:states(j),
      start:toHHMM(st),
      end:toHHMM(st+dp)
    });
  }

  for(let j=0;j<5;j++){
    const st=ss+j*np;
    const r=(4-j)%5;
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

/* ───────── MAIN ───────── */
async function main(){
  const {date,weekdayIndex,weekday}=getIST();
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

    horas:horas(sr,ss,weekdayIndex),
    gowri:gowri(sr,ss),
    jamams:jamams(sr,ss),
    users:USERS
  };

  fs.writeFileSync(
    path.join(__dirname,"public","today.json"),
    JSON.stringify(data,null,2)
  );

  console.log("✅ Generated");
}

await main();
