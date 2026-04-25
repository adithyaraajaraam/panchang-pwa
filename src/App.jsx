import { useState, useEffect } from "react";

// ─── THEME ─────────────────────────────────────────────────────────────────
const T = {
  bg:        "#ffffff",
  bgAlt:     "#f8f8f8",
  bgActive:  "#f5f5f5",
  border:    "#e5e5e5",
  text:      "#000000",
  textSub:   "#444444",
  textMuted: "#888888",
  accent:    "#92400e",
  good:      "#15803d",
  medium:    "#b45309",
  orange:    "#c2410c",
  bad:       "#b91c1c",
};

function qColor(q) {
  if (q === "good")   return T.good;
  if (q === "medium") return T.medium;
  if (q === "orange") return T.orange;
  if (q === "bad")    return T.bad;
  return T.textMuted;
}
function qBg(q) {
  if (q === "good")   return "#f0fdf4";
  if (q === "medium") return "#fffbeb";
  if (q === "orange") return "#fff7ed";
  if (q === "bad")    return "#fef2f2";
  return "transparent";
}

// ─── TIME ENGINE ───────────────────────────────────────────────────────────
function toMins(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function nowIST() {
  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const h = ist.getHours(), m = ist.getMinutes();
  return {
    mins: h * 60 + m,
    str:  `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,
  };
}
// handles midnight crossing: if end < start → end += 1440
function isActive(start, end) {
  const now = nowIST().mins;
  const s = toMins(start);
  let e = toMins(end);
  if (e <= s) e += 1440;
  const adj = now < s ? now + 1440 : now;
  return adj >= s && adj < e;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const PLANET_Q = {
  Sun:"good", Moon:"good", Mars:"bad",
  Mercury:"good", Jupiter:"good", Venus:"good", Saturn:"medium",
};
const BIRD_TA  = { vulture:"கழுகு", owl:"ஆந்தை", crow:"காகம்", rooster:"சேவல்", peacock:"மயில்" };
const BIRD_ICO = { vulture:"🦅", owl:"🦉", crow:"🪶", rooster:"🐓", peacock:"🦚" };

// ─── DOT ───────────────────────────────────────────────────────────────────
function Dot({ q }) {
  return (
    <span style={{
      display:"inline-block", width:11, height:11, borderRadius:"50%",
      background: qColor(q), flexShrink:0, marginRight:9,
    }} />
  );
}

// ─── ROW (for Rahu/Hora/Gowri etc) ────────────────────────────────────────
function Row({ label, labelTa, start, end, quality }) {
  const active = isActive(start, end);
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"11px 14px", borderBottom:`1px solid ${T.border}`,
      background: active ? qBg(quality) : "transparent",
    }}>
      <div style={{ display:"flex", alignItems:"center" }}>
        <Dot q={active ? quality : "none"} />
        <div>
          <span style={{ color:T.text, fontSize:14, fontWeight: active ? 700 : 400 }}>{label}</span>
          {labelTa && <span style={{ color:T.textMuted, fontSize:12, marginLeft:6 }}>{labelTa}</span>}
          {active && (
            <span style={{
              marginLeft:8, fontSize:10, fontWeight:700,
              color:qColor(quality), border:`1px solid ${qColor(quality)}`,
              borderRadius:3, padding:"1px 5px"
            }}>NOW</span>
          )}
        </div>
      </div>
      <span style={{
        fontSize:12, fontFamily:"monospace",
        color: active ? T.text : T.textMuted,
        fontWeight: active ? 600 : 400,
      }}>{start}–{end}</span>
    </div>
  );
}

// ─── SECTION ───────────────────────────────────────────────────────────────
function Section({ title, titleTa, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:18, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", textAlign:"left", background:T.bgAlt,
        border:"none", padding:"11px 14px", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderBottom: open ? `1px solid ${T.border}` : "none",
      }}>
        <span style={{ fontSize:14, fontWeight:700, color:T.accent }}>
          {title}
          {titleTa && <span style={{ color:T.textMuted, fontSize:12, fontWeight:400, marginLeft:6 }}>{titleTa}</span>}
        </span>
        <span style={{ fontSize:11, color:T.textMuted }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── PAKSHI SECTION ────────────────────────────────────────────────────────
// The KEY fix: every person always has a state — from the current jamam's states map
function PakshiSection({ jamams, users }) {
  const [open, setOpen] = useState(true);

  // Find the ONE active jamam
  const activeJamam = jamams.find(j => isActive(j.start, j.end));

  return (
    <div style={{ marginBottom:18, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      {/* Section header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", textAlign:"left", background:T.bgAlt,
        border:"none", padding:"11px 14px", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderBottom:`1px solid ${T.border}`,
      }}>
        <span style={{ fontSize:14, fontWeight:700, color:T.accent }}>
          Pancha Pakshi <span style={{ color:T.textMuted, fontSize:12, fontWeight:400 }}>பஞ்ச பட்சி</span>
        </span>
        <span style={{ fontSize:11, color:T.textMuted }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div>
          {/* Current jamam info bar */}
          {activeJamam && (
            <div style={{
              padding:"8px 14px", background:"#fffbeb",
              borderBottom:`1px solid ${T.border}`,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <span style={{ fontSize:12, color:T.textSub }}>
                {activeJamam.period === "day" ? "☀️" : "🌙"} Jamam {activeJamam.jamam} · Ruling: {BIRD_ICO[activeJamam.rulingBird]} {activeJamam.rulingBird}
              </span>
              <span style={{ fontSize:11, fontFamily:"monospace", color:T.textMuted }}>
                {activeJamam.start}–{activeJamam.end}
              </span>
            </div>
          )}

          {/* ALL PERSONS — always show a state, never "resting" */}
          {users.map((user, i) => {
            const state = activeJamam
              ? activeJamam.states[user.pakshi]
              : { en:"—", ta:"—", quality:"none" };
            const q = state.quality;
            return (
              <div key={i} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"13px 14px", borderBottom:`1px solid ${T.border}`,
                background: activeJamam ? qBg(q) : "transparent",
              }}>
                <div style={{ display:"flex", alignItems:"center" }}>
                  <Dot q={q} />
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{user.name}</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>
                      {BIRD_ICO[user.pakshi]} {BIRD_TA[user.pakshi]} · {user.nakshatra}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:15, fontWeight:800, color:qColor(q) }}>
                    {state.en}
                  </div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{state.ta}</div>
                </div>
              </div>
            );
          })}

          {/* ALL JAMAMS detail (collapsed sub-toggle) */}
          <JamamDetail jamams={jamams} users={users} />
        </div>
      )}
    </div>
  );
}

function JamamDetail({ jamams, users }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", background:T.bgAlt, border:"none",
        borderTop:`1px solid ${T.border}`,
        padding:"8px 14px", cursor:"pointer",
        display:"flex", justifyContent:"space-between",
        fontSize:12, color:T.textMuted,
      }}>
        <span>All 10 Jamams (day + night)</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && jamams.map((j, ji) => {
        const active = isActive(j.start, j.end);
        return (
          <div key={ji} style={{
            borderTop:`1px solid ${T.border}`,
            background: active ? "#fffbeb" : "transparent",
          }}>
            {/* Jamam header */}
            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"7px 14px",
              background: active ? "#fef9c3" : T.bgAlt,
              borderBottom:`1px solid ${T.border}`,
            }}>
              <span style={{ fontSize:12, fontWeight:700, color: active ? T.accent : T.textSub }}>
                {j.period === "day" ? "☀️" : "🌙"} J{j.jamam} · {BIRD_ICO[j.rulingBird]} {j.rulingBird}
                {active && <span style={{ marginLeft:6, fontSize:10, color:T.accent }}>← NOW</span>}
              </span>
              <span style={{ fontSize:11, fontFamily:"monospace", color:T.textMuted }}>
                {j.start}–{j.end}
              </span>
            </div>
            {/* Per-user states */}
            {users.map((u, ui) => {
              const s = j.states[u.pakshi];
              return (
                <div key={ui} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"5px 14px 5px 28px",
                  borderBottom:`1px solid ${T.border}`,
                  background: active ? qBg(s.quality) : "transparent",
                }}>
                  <span style={{ fontSize:12, color:T.textSub }}>
                    <Dot q={s.quality} />
                    {u.name}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:qColor(s.quality) }}>
                    {s.en} <span style={{ fontSize:11, color:T.textMuted }}>{s.ta}</span>
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [clock, setClock] = useState(nowIST());

  useEffect(() => {
    fetch("/today.json")
      .then(r => r.json())
      .then(setData)
      .catch(() => setError("today.json missing. Run: node generate.js"));
  }, []);

  // Tick every 60s → re-render; clock string every second
  useEffect(() => {
    const id = setInterval(() => setClock(nowIST()), 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return (
    <div style={{ padding:24, color:T.bad, fontFamily:"monospace", background:T.bg, minHeight:"100vh" }}>
      ⚠️ {error}
    </div>
  );
  if (!data) return (
    <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:T.textMuted }}>
        <div style={{ fontSize:36 }}>🕉️</div>
        <div style={{ marginTop:8, fontSize:14 }}>Loading…</div>
      </div>
    </div>
  );

  const hora          = data.horas.find(h => isActive(h.start, h.end));
  const gowri         = data.gowri.find(g => isActive(g.start, g.end));
  const rahuActive    = isActive(data.rahuKalam.start, data.rahuKalam.end);
  const abhijitActive = isActive(data.abhijit.start, data.abhijit.end);

  return (
    <div style={{
      fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",
      background:T.bg, color:T.text,
      minHeight:"100vh", maxWidth:480, margin:"0 auto",
    }}>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position:"sticky", top:0, zIndex:100,
        background:T.bg, borderBottom:`2px solid ${T.border}`,
        padding:"10px 14px 10px",
      }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:17, fontWeight:800, color:T.accent }}>🕉️ பஞ்சாங்கம்</span>
          <span style={{ fontSize:11, color:T.textMuted }}>{data.weekday} · ☀️{data.sunrise} 🌙{data.sunset}</span>
        </div>

        {/* Live status bar */}
        <div style={{
          background:T.bgAlt, borderRadius:8, padding:"8px 12px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          border:`1px solid ${T.border}`
        }}>
          <div>
            <span style={{ fontSize:26, fontWeight:800, fontFamily:"monospace", color:T.text, letterSpacing:1 }}>
              {clock.str}
            </span>
            <span style={{ fontSize:12, color:T.textMuted, marginLeft:5 }}>IST</span>
          </div>
          <div style={{ textAlign:"right", lineHeight:1.5 }}>
            {hora && (
              <div style={{ fontSize:13, fontWeight:700, color: PLANET_Q[hora.planet]==="bad" ? T.bad : T.good }}>
                ⭐ {hora.planet} Hora
              </div>
            )}
            {gowri && (
              <div style={{ fontSize:12, color:qColor(gowri.quality) }}>
                {gowri.en} · {gowri.ta}
              </div>
            )}
            {rahuActive    && <div style={{ fontSize:12, color:T.bad, fontWeight:700 }}>⚠️ Rahu Kalam</div>}
            {abhijitActive && <div style={{ fontSize:12, color:T.good, fontWeight:700 }}>✨ Abhijit</div>}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding:"14px 12px 40px" }}>

        {/* S1: Inauspicious */}
        <Section title="Inauspicious Times" titleTa="தீய நேரங்கள்">
          <Row label="Rahu Kalam"  labelTa="ராகு காலம்" quality="bad"
            start={data.rahuKalam.start}  end={data.rahuKalam.end} />
          <Row label="Yamagandam"  labelTa="யமகண்டம்"  quality="bad"
            start={data.yamagandam.start} end={data.yamagandam.end} />
          <Row label="Gulikai"     labelTa="குளிகை"    quality="bad"
            start={data.gulikai.start}    end={data.gulikai.end} />
        </Section>

        {/* S2: Abhijit */}
        <Section title="Abhijit Muhurat" titleTa="அபிஜித் முகூர்த்தம்">
          <Row label="Abhijit" labelTa="அபிஜித்" quality="good"
            start={data.abhijit.start} end={data.abhijit.end} />
        </Section>

        {/* S3: Hora — all 24 */}
        <Section title="Hora — 24h" titleTa="ஹோரா" defaultOpen={false}>
          {data.horas.map((h, i) => (
            <Row key={i} label={h.planet} quality={PLANET_Q[h.planet] || "medium"}
              start={h.start} end={h.end} />
          ))}
        </Section>

        {/* S4: Gowri */}
        <Section title="Gowri Panchangam" titleTa="கௌரி பஞ்சாங்கம்">
          {data.gowri.map((g, i) => (
            <Row key={i} label={g.en} labelTa={g.ta} quality={g.quality}
              start={g.start} end={g.end} />
          ))}
        </Section>

        {/* S5: Pancha Pakshi — THE BIG FIX */}
        <PakshiSection jamams={data.jamams} users={data.users} />

        {/* LEGEND */}
        <div style={{
          display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center",
          borderTop:`1px solid ${T.border}`, paddingTop:12,
        }}>
          {[["good","Rule / Eat"],["medium","Walk"],["orange","Sleep"],["bad","Die / Avoid"]].map(([q,l]) => (
            <div key={q} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:qColor(q) }}>
              <span style={{ width:9, height:9, borderRadius:"50%", background:qColor(q), display:"inline-block" }} />
              {l}
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center", color:T.textMuted, fontSize:10, marginTop:10 }}>
          Auto-updates every minute · IST · Chennai
        </div>
      </div>
    </div>
  );
}
