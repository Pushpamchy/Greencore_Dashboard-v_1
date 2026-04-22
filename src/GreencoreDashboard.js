import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from "recharts";

const COLORS = {
  wind: "#00e5a0",
  battery: "#3b9eff",
  gas: "#f5a623",
  bg: "#080d14",
  panel: "#0d1520",
  border: "#1a2940",
  accent: "#00e5a0",
  red: "#ff4d6a",
  amber: "#f5a623",
};

const revenueData = [
  { t: "06:00", v: 1800 },
  { t: "07:00", v: 3200 },
  { t: "08:00", v: 4100 },
  { t: "09:00", v: 5600 },
  { t: "10:00", v: 7200 },
  { t: "11:00", v: 8900 },
  { t: "12:00", v: 10100 },
  { t: "13:00", v: 12500 },
];

const energyMix = [
  { name: "Wind", value: 60, color: COLORS.wind },
  { name: "Battery", value: 20, color: COLORS.battery },
  { name: "Gas", value: 20, color: COLORS.gas },
];

function Blink({ on }) {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setVis(v => !v), 900);
    return () => clearInterval(t);
  }, [on]);
  return (
    <span style={{
      display: "inline-block", width: 10, height: 10,
      borderRadius: "50%",
      background: on ? COLORS.accent : COLORS.red,
      boxShadow: on && vis ? `0 0 8px ${COLORS.accent}` : "none",
      opacity: on ? (vis ? 1 : 0.4) : 1,
      transition: "opacity 0.3s",
      marginRight: 8,
    }} />
  );
}

function CarbonGauge({ value = 312, max = 600 }) {
  const pct = Math.min(value / max, 1);
  const angle = -150 + pct * 300;
  const r = 80;
  const cx = 110, cy = 110;

  const arc = (startDeg, endDeg, color) => {
    const toRad = d => (d * Math.PI) / 180;
    const s = toRad(startDeg - 90);
    const e = toRad(endDeg - 90);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none" stroke={color} strokeWidth={14}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    );
  };

  const needleRad = ((angle - 90) * Math.PI) / 180;
  const nx = cx + (r - 10) * Math.cos(needleRad);
  const ny = cy + (r - 10) * Math.sin(needleRad);

  const zone = pct < 0.4 ? "LOW CARBON" : pct < 0.7 ? "MODERATE" : "HIGH CARBON";
  const zoneColor = pct < 0.4 ? COLORS.wind : pct < 0.7 ? COLORS.amber : COLORS.red;

  return (
    <svg width={220} height={160} style={{ overflow: "visible" }}>
      {arc(-150, -50, "#1a3a2a")}
      {arc(-50, 50, "#3a3010")}
      {arc(50, 150, "#3a1020")}
      {arc(-150, -150 + pct * 300, zoneColor)}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="white" strokeWidth={2.5} strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px #fff)" }} />
      <circle cx={cx} cy={cy} r={5} fill="white" />
      <text x={cx} y={cy + 34} textAnchor="middle"
        fill="white" fontSize={22} fontFamily="'Share Tech Mono', monospace" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy + 52} textAnchor="middle"
        fill="#8a9bb0" fontSize={10} fontFamily="'Share Tech Mono', monospace">
        gCO₂/kWh
      </text>
      <text x={cx} y={cy + 68} textAnchor="middle"
        fill={zoneColor} fontSize={10} fontFamily="'Share Tech Mono', monospace"
        style={{ filter: `drop-shadow(0 0 4px ${zoneColor})` }}>
        ▌ {zone} ▐
      </text>
    </svg>
  );
}

function FlowNode({ x, y, label, sub, color, active }) {
  return (
    <g>
      <rect x={x - 52} y={y - 22} width={104} height={44} rx={8}
        fill={active ? color + "22" : "#111c2a"}
        stroke={active ? color : "#1a2940"} strokeWidth={active ? 1.5 : 1}
        style={active ? { filter: `drop-shadow(0 0 8px ${color}55)` } : {}} />
      <text x={x} y={y - 4} textAnchor="middle"
        fill={active ? color : "#4a6080"} fontSize={11}
        fontFamily="'Share Tech Mono', monospace" fontWeight="bold">
        {label}
      </text>
      <text x={x} y={y + 11} textAnchor="middle"
        fill={active ? color + "bb" : "#2a4060"} fontSize={9}
        fontFamily="'Share Tech Mono', monospace">
        {sub}
      </text>
    </g>
  );
}

function AnimatedArrow({ x1, y1, x2, y2, color, active, dashed }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setOffset(o => (o + 1) % 20), 60);
    return () => clearInterval(t);
  }, [active]);
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const mx = x1 + dx * 0.5, my = y1 + dy * 0.5;
  const ax = mx - uy * 6, ay = my + ux * 6;
  const bx = mx + uy * 6, by = my - ux * 6;
  const ex = x2 - ux * 10, ey = y2 - uy * 10;

  return (
    <g style={{ opacity: active ? 1 : 0.2 }}>
      <line x1={x1} y1={y1} x2={ex} y2={ey}
        stroke={active ? color : "#1a2940"} strokeWidth={2}
        strokeDasharray={dashed ? "6 4" : "none"}
        strokeDashoffset={active && dashed ? -offset : 0}
        style={active ? { filter: `drop-shadow(0 0 3px ${color})` } : {}} />
      <polygon points={`${ex + ux * 10},${ey + uy * 10} ${ax},${ay} ${bx},${by}`}
        fill={active ? color : "#1a2940"}
        style={active ? { filter: `drop-shadow(0 0 3px ${color})` } : {}} />
    </g>
  );
}

export default function GreencoreDashboard() {
  const [tick, setTick] = useState(0);
  const [gasActive, setGasActive] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IE", { hour12: false });

  const Panel = ({ children, style = {}, className }) => (
    <div style={{
      background: COLORS.panel,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${COLORS.accent}44, transparent)`,
      }} />
      {children}
    </div>
  );

  const SectionTitle = ({ children, accent }) => (
    <div style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 10, letterSpacing: "0.2em",
      color: accent || COLORS.accent, marginBottom: 14,
      textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 3, height: 12, background: accent || COLORS.accent, borderRadius: 2, display: "inline-block" }} />
      {children}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      fontFamily: "'Share Tech Mono', monospace",
      padding: "16px 20px",
      backgroundImage: `
        radial-gradient(ellipse 60% 40% at 20% 0%, #00e5a008 0%, transparent 70%),
        radial-gradient(ellipse 40% 30% at 80% 100%, #3b9eff06 0%, transparent 60%)
      `,
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080d14; }
        ::-webkit-scrollbar-thumb { background: #1a2940; }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,160,0.012) 2px, rgba(0,229,160,0.012) 4px)",
      }} />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.accent}33, ${COLORS.accent}11)`,
              border: `1px solid ${COLORS.accent}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>⚡</div>
            <div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: 20, color: "white", letterSpacing: "0.05em",
              }}>GREENCORE ENERGY OS</div>
              <div style={{ fontSize: 9, color: "#3a6050", letterSpacing: "0.15em" }}>
                DATA CENTRE OPERATIONS · DUBLIN NODE 01
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#3a6050", letterSpacing: "0.15em" }}>SYSTEM UPTIME</div>
            <div style={{ fontSize: 13, color: COLORS.accent, fontWeight: "bold" }}>99.999%</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#3a6050", letterSpacing: "0.15em" }}>LOCAL TIME</div>
            <div style={{ fontSize: 13, color: "white", fontWeight: "bold" }}>{timeStr}</div>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 20,
            background: `${COLORS.accent}15`, border: `1px solid ${COLORS.accent}44`,
            fontSize: 9, color: COLORS.accent, letterSpacing: "0.2em",
            animation: "pulse-green 2s ease-in-out infinite",
          }}>
            ● LIVE
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto", gap: 14 }}>

        {/* 1. Energy Mix */}
        <Panel style={{ gridColumn: "1 / 2", gridRow: "1 / 2" }}>
          <SectionTitle>Live Energy Distribution</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={energyMix} cx={65} cy={65} innerRadius={38} outerRadius={62}
                  dataKey="value" strokeWidth={0} paddingAngle={3}>
                  {energyMix.map((e, i) => (
                    <Cell key={i} fill={e.color}
                      style={{ filter: `drop-shadow(0 0 6px ${e.color}88)` }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {energyMix.map(e => (
                <div key={e.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#8a9bb0" }}>{e.name}</span>
                    <span style={{ fontSize: 13, color: e.color, fontWeight: "bold" }}>{e.value}%</span>
                  </div>
                  <div style={{ background: "#0a1520", borderRadius: 4, height: 5, overflow: "hidden" }}>
                    <div style={{
                      width: `${e.value}%`, height: "100%",
                      background: e.color, borderRadius: 4,
                      boxShadow: `0 0 8px ${e.color}88`,
                      transition: "width 1s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 8,
            background: `${COLORS.accent}08`, border: `1px solid ${COLORS.accent}22`,
            fontSize: 9, color: "#4a8070", letterSpacing: "0.12em",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>TOTAL CAPACITY</span>
            <span style={{ color: COLORS.accent }}>48.5 MW LIVE</span>
          </div>
        </Panel>

        {/* 2. System Status */}
        <Panel style={{ gridColumn: "2 / 3", gridRow: "1 / 2" }}>
          <SectionTitle>System Status</SectionTitle>
          {[
            { label: "Wind Farm", sub: "North Array — 18 turbines", status: "ACTIVE", color: COLORS.wind, on: true },
            { label: "Battery Storage", sub: "LiFePO₄ — 12.4 MWh", status: "CHARGING", color: COLORS.battery, on: true },
            { label: "Gas Turbine", sub: "GE LM6000 — 20 MW", status: "STANDBY", color: COLORS.amber, on: false },
            { label: "National Grid", sub: "EirGrid 220kV", status: "OFFLINE", color: COLORS.red, on: false },
          ].map(({ label, sub, status, color, on }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: 8, marginBottom: 8,
              background: on ? `${color}08` : "#090f18",
              border: `1px solid ${on ? color + "33" : COLORS.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Blink on={on && status !== "STANDBY"} />
                <div>
                  <div style={{ fontSize: 12, color: on ? "white" : "#3a5070", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 9, color: "#2a4060", letterSpacing: "0.1em" }}>{sub}</div>
                </div>
              </div>
              <div style={{
                padding: "3px 10px", borderRadius: 12, fontSize: 9,
                background: `${color}22`, color, border: `1px solid ${color}44`,
                letterSpacing: "0.1em", fontWeight: "bold",
              }}>{status}</div>
            </div>
          ))}
          <div style={{
            marginTop: 4, textAlign: "center", fontSize: 9,
            color: COLORS.accent, letterSpacing: "0.15em",
            borderTop: `1px solid ${COLORS.border}`, paddingTop: 10,
          }}>
            ⬡ SYSTEM STATUS: 99.999% UPTIME READY
          </div>
        </Panel>

        {/* 3. Carbon Intensity */}
        <Panel style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }}>
          <SectionTitle accent="#f5a623">Carbon Intensity Tracker</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CarbonGauge value={312} max={600} />
            <div style={{
              marginTop: 4, width: "100%", padding: "8px 12px", borderRadius: 8,
              background: "#2a1a0a", border: "1px solid #f5a62333",
              fontSize: 9, color: "#8a7060", letterSpacing: "0.12em",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>CURRENT INTENSITY</span>
                <span style={{ color: COLORS.amber }}>312 gCO₂/kWh</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>GRID BASELINE</span>
                <span style={{ color: COLORS.red }}>450 gCO₂/kWh</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CARBON SAVING</span>
                <span style={{ color: COLORS.wind }}>▼ 30.7%</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* 4. Revenue */}
        <Panel style={{ gridColumn: "1 / 3", gridRow: "2 / 3" }}>
          <SectionTitle accent={COLORS.battery}>Grid Services Revenue — Live</SectionTitle>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "#3a5070", letterSpacing: "0.15em", marginBottom: 4 }}>TODAY'S EARNINGS</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 38, color: "white", lineHeight: 1 }}>
                €12,<span style={{ color: COLORS.battery }}>500</span>
              </div>
              <div style={{ fontSize: 9, color: COLORS.wind, marginTop: 4 }}>▲ +18.3% vs yesterday</div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Balancing", val: "€6,200" },
                { label: "Capacity", val: "€3,800" },
                { label: "Frequency", val: "€2,500" },
              ].map(({ label, val }) => (
                <div key={label} style={{
                  padding: "8px 14px", borderRadius: 8,
                  background: "#090f1a", border: `1px solid ${COLORS.border}`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 9, color: "#3a5070", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: COLORS.battery, fontWeight: "bold" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.battery} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.battery} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0d1a2a" />
              <XAxis dataKey="t" tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "Share Tech Mono" }} />
              <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "Share Tech Mono" }}
                tickFormatter={v => `€${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: "#0d1520", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "Share Tech Mono", fontSize: 11 }}
                labelStyle={{ color: "#8a9bb0" }}
                itemStyle={{ color: COLORS.battery }}
                formatter={v => [`€${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="v" stroke={COLORS.battery} strokeWidth={2}
                fill="url(#revGrad)"
                dot={{ fill: COLORS.battery, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: COLORS.battery, boxShadow: `0 0 8px ${COLORS.battery}` }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* 5. Smart Switching */}
        <Panel style={{ gridColumn: "3 / 4", gridRow: "2 / 3" }}>
          <SectionTitle>Intelligent Power Routing</SectionTitle>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 9, color: "#3a5070", letterSpacing: "0.1em" }}>SIMULATE GAS ACTIVATION</span>
            <div
              onClick={() => setGasActive(g => !g)}
              style={{
                width: 40, height: 20, borderRadius: 10, cursor: "pointer",
                background: gasActive ? COLORS.amber + "44" : "#0d1a2a",
                border: `1px solid ${gasActive ? COLORS.amber : COLORS.border}`,
                position: "relative", transition: "all 0.3s",
              }}>
              <div style={{
                position: "absolute", top: 2, left: gasActive ? 22 : 2,
                width: 14, height: 14, borderRadius: "50%",
                background: gasActive ? COLORS.amber : "#2a4060",
                transition: "all 0.3s",
                boxShadow: gasActive ? `0 0 6px ${COLORS.amber}` : "none",
              }} />
            </div>
          </div>

          <svg width="100%" viewBox="0 0 260 220" style={{ overflow: "visible" }}>
            {/* Sources */}
            <FlowNode x={50} y={45} label="🌬 WIND" sub="60% · 29 MW" color={COLORS.wind} active={true} />
            <FlowNode x={50} y={110} label="🔋 BATTERY" sub="20% · 9.7 MW" color={COLORS.battery} active={true} />
            <FlowNode x={50} y={175} label="🔥 GAS" sub={gasActive ? "ACTIVE · 9.7 MW" : "20% · STANDBY"} color={COLORS.amber} active={gasActive} />

            {/* Data Centre */}
            <rect x={145} y={70} width={115} height={80} rx={10}
              fill={`${COLORS.accent}12`} stroke={COLORS.accent} strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 10px ${COLORS.accent}44)` }} />
            <text x={202} y={103} textAnchor="middle" fill={COLORS.accent}
              fontSize={10} fontFamily="'Share Tech Mono', monospace" fontWeight="bold">DATA CENTRE</text>
            <text x={202} y={118} textAnchor="middle" fill={`${COLORS.accent}88`}
              fontSize={9} fontFamily="'Share Tech Mono', monospace">Dublin Node 01</text>
            <text x={202} y={135} textAnchor="middle" fill="white"
              fontSize={11} fontFamily="'Share Tech Mono', monospace" fontWeight="bold">48.5 MW</text>

            {/* Arrows: sources → data centre */}
            <AnimatedArrow x1={102} y1={45} x2={145} y2={100} color={COLORS.wind} active={true} dashed={true} />
            <AnimatedArrow x1={102} y1={110} x2={145} y2={110} color={COLORS.battery} active={true} dashed={true} />
            <AnimatedArrow x1={102} y1={175} x2={145} y2={125} color={COLORS.amber} active={gasActive} dashed={gasActive} />
          </svg>

          <div style={{
            padding: "7px 12px", borderRadius: 8, marginTop: -10,
            background: "#090f18", border: `1px solid ${COLORS.border}`,
            fontSize: 9, color: "#4a6080", letterSpacing: "0.1em",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>AI ROUTING MODE</span>
            <span style={{ color: COLORS.wind }}>● OPTIMAL · 0ms LATENCY</span>
          </div>
        </Panel>

      </div>

      {/* Footer */}
      <div style={{
        marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: `1px solid ${COLORS.border}`, paddingTop: 10,
        fontSize: 9, color: "#1a3040", letterSpacing: "0.12em",
      }}>
        <span>GREENCORE ENERGY OS v4.2.1 · SECURE CHANNEL AES-256</span>
        <span>DATA REFRESH: 1s INTERVAL · OPERATOR: OPS-ADMIN-01</span>
        <span>© 2026 GREENCORE SYSTEMS LTD</span>
      </div>
    </div>
  );
}
