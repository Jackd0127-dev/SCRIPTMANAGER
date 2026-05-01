import React, { useMemo, useState } from "react";
import { AlertTriangle, Info, Lightbulb, ToggleLeft, Zap, Cable, Home, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const wireStyles = {
  line: "bg-red-500",
  switched: "bg-amber-400",
  neutral: "bg-blue-500",
  cpc: "bg-green-500",
  strapper1: "bg-slate-800",
  strapper2: "bg-slate-500",
  inactive: "bg-slate-300",
};

const wireText = {
  line: "Permanent line/live: normally brown in modern UK wiring.",
  switched: "Switched line/live: live only when the switch path is complete. Must be sleeved brown if using a blue/grey/black core as line.",
  neutral: "Neutral: normally blue. Usually goes to the light fitting, not through a basic switch, unless the switch point has a neutral present.",
  cpc: "CPC/earth: green/yellow protective conductor. Must be continuous and correctly terminated.",
  strapper1: "Strapper: one of the conductors linking two-way or intermediate switches.",
  strapper2: "Second strapper: paired with the other strapper between switches.",
};

function Wire({ x1, y1, x2, y2, type = "line", active = false, dashed = false, label, onClick }) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <button
      onClick={onClick}
      className="absolute origin-left rounded-full focus:outline-none focus:ring-2 focus:ring-black/40"
      style={{ left: x1, top: y1, width: length, height: 10, transform: `rotate(${angle}deg)`, transformOrigin: "0 50%" }}
      title={label || wireText[type]}
    >
      <div
        className={`h-2.5 rounded-full ${active ? wireStyles[type] : wireStyles.inactive} ${dashed ? "opacity-70" : ""} ${active ? "animate-pulse" : "opacity-45"}`}
        style={{ boxShadow: active ? "0 0 12px rgba(245, 158, 11, 0.55)" : "none" }}
      />
    </button>
  );
}

function Terminal({ x, y, label, active = false, onClick }) {
  return (
    <button onClick={onClick} className="absolute -translate-x-1/2 -translate-y-1/2 text-center group" style={{ left: x, top: y }}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${active ? "bg-amber-200 border-amber-500" : "bg-white border-slate-400"}`}>{label}</div>
    </button>
  );
}

function SwitchBox({ x, y, title, terminals, activeTerms = [], onTermClick }) {
  return (
    <div className="absolute rounded-2xl border border-slate-300 bg-white/95 shadow-sm" style={{ left: x, top: y, width: 150, height: 150 }}>
      <div className="px-3 py-2 border-b text-sm font-semibold flex items-center gap-2"><ToggleLeft className="w-4 h-4" />{title}</div>
      {terminals.map(t => (
        <Terminal key={t.label} x={t.x} y={t.y} label={t.label} active={activeTerms.includes(t.label)} onClick={() => onTermClick(`${title} terminal ${t.label}`, t.note)} />
      ))}
    </div>
  );
}

function Light({ x, y, on, onClick }) {
  return (
    <button onClick={onClick} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus:ring-2 focus:ring-black/40" style={{ left: x, top: y }}>
      <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${on ? "bg-yellow-200 border-yellow-500 shadow-[0_0_35px_rgba(234,179,8,0.65)] animate-pulse" : "bg-slate-100 border-slate-300"}`}>
        <Lightbulb className={`w-11 h-11 ${on ? "text-yellow-700" : "text-slate-400"}`} />
      </div>
      <div className="mt-2 text-sm font-semibold">Light fitting</div>
    </button>
  );
}

function Supply({ x, y, onClick }) {
  return (
    <button onClick={onClick} className="absolute rounded-2xl border bg-white shadow-sm p-3 text-left" style={{ left: x, top: y, width: 150 }}>
      <div className="font-semibold flex items-center gap-2"><Home className="w-4 h-4" />Supply / rose</div>
      <div className="mt-2 text-xs text-slate-600">Permanent line, neutral and CPC originate here.</div>
    </button>
  );
}

const info = {
  "Supply / rose": "In many UK domestic lighting circuits, the permanent line, neutral and CPC are present at the ceiling rose or light fitting. The switch normally only interrupts the line conductor. Never switch the neutral only.",
  "Light fitting": "The lamp works only when it receives switched line and neutral. CPC/earth must still be continuous even if the fitting itself is Class II and does not need an earth terminal.",
  "1 gang 1-way switch terminal COM": "COM is the common terminal. In 1-way switching, permanent line normally enters COM.",
  "1 gang 1-way switch terminal L1": "L1 is the switched output back to the lamp. When the switch is ON, COM connects to L1.",
  "2-way switch A terminal COM": "COM on the first two-way switch often receives the permanent line.",
  "2-way switch A terminal L1": "L1 is one strapper terminal between the two two-way switches.",
  "2-way switch A terminal L2": "L2 is the second strapper terminal between the two two-way switches.",
  "2-way switch B terminal COM": "COM on the second two-way switch often sends switched line to the lamp.",
  "2-way switch B terminal L1": "L1 is one strapper terminal. The light is on when both two-way switches select the same strapper path.",
  "2-way switch B terminal L2": "L2 is the other strapper terminal. Operating either switch changes the selected path.",
  "Intermediate terminal L1 in": "Intermediate switches sit between two two-way switches. They do not have COM. They swap or pass through the two strapper conductors.",
  "Intermediate terminal L2 in": "One side of the intermediate switch receives the pair of strappers from the first two-way switch.",
  "Intermediate terminal L1 out": "The other side sends the pair of strappers onward to the second two-way switch.",
  "Intermediate terminal L2 out": "When toggled, the intermediate either connects straight-through or crossed-over.",
};

function DetailPanel({ selected, mode }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Selected detail</h3>
            <p className="text-sm text-slate-700 mt-1">{selected?.text || "Click a wire, terminal, switch, supply, or lamp to see what it does."}</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <h4 className="font-semibold mb-2">How this setup works</h4>
          {mode === "one" && <p>A 1-way switch controls one light from one position. Permanent line goes to the switch COM. When switched ON, COM connects to L1 and sends switched line to the lamp. Neutral goes directly to the lamp.</p>}
          {mode === "two" && <p>2-way switching controls one light from two positions. Two strapper conductors link L1 and L2 between both switches. Permanent line enters one COM, switched line leaves the other COM. Either switch can change the route and turn the light on or off.</p>}
          {mode === "intermediate" && <p>2-way plus intermediate switching controls one light from three or more positions. The two end switches are two-way switches. Any middle switch is an intermediate switch that either passes the strappers straight through or crosses them over.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Legend() {
  const items = [
    ["line", "Permanent line"], ["switched", "Switched line"], ["neutral", "Neutral"], ["cpc", "CPC/earth"], ["strapper1", "Strapper 1"], ["strapper2", "Strapper 2"]
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {items.map(([type, label]) => <button key={type} className="flex items-center gap-2 rounded-full border bg-white px-3 py-2" title={wireText[type]}><span className={`w-8 h-2 rounded-full ${wireStyles[type]}`} />{label}</button>)}
    </div>
  );
}

function OneWay({ setSelected }) {
  const [on, setOn] = useState(true);
  return (
    <div className="relative h-[420px] rounded-3xl bg-slate-100 overflow-hidden border">
      <Supply x={30} y={40} onClick={() => setSelected({ text: info["Supply / rose"] })} />
      <Light x={690} y={120} on={on} onClick={() => setSelected({ text: info["Light fitting"] })} />
      <SwitchBox x={320} y={210} title="1 gang 1-way switch" terminals={[{label:"COM",x:45,y:75},{label:"L1",x:105,y:75}]} activeTerms={on ? ["COM","L1"] : ["COM"]} onTermClick={(name, note) => setSelected({ text: info[name] || note })} />
      <Wire x1={180} y1={90} x2={365} y2={285} type="line" active onClick={() => setSelected({ text: wireText.line + " This goes to COM at the switch." })} />
      <Wire x1={425} y1={285} x2={650} y2={120} type="switched" active={on} onClick={() => setSelected({ text: wireText.switched + " This returns from L1 to the lamp." })} />
      <Wire x1={180} y1={125} x2={650} y2={125} type="neutral" active onClick={() => setSelected({ text: wireText.neutral })} />
      <Wire x1={180} y1={155} x2={650} y2={155} type="cpc" active onClick={() => setSelected({ text: wireText.cpc })} />
      <button onClick={() => setOn(!on)} className="absolute left-[352px] top-[345px] rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow">Toggle switch: {on ? "ON" : "OFF"}</button>
    </div>
  );
}

function TwoWay({ setSelected }) {
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const on = a === b;
  return (
    <div className="relative h-[470px] rounded-3xl bg-slate-100 overflow-hidden border">
      <Supply x={25} y={40} onClick={() => setSelected({ text: info["Supply / rose"] })} />
      <Light x={770} y={105} on={on} onClick={() => setSelected({ text: info["Light fitting"] })} />
      <SwitchBox x={230} y={245} title="2-way switch A" terminals={[{label:"COM",x:75,y:112},{label:"L1",x:45,y:65},{label:"L2",x:105,y:65}]} activeTerms={["COM", a === 1 ? "L1" : "L2"]} onTermClick={(name, note) => setSelected({ text: info[name] || note })} />
      <SwitchBox x={545} y={245} title="2-way switch B" terminals={[{label:"COM",x:75,y:112},{label:"L1",x:45,y:65},{label:"L2",x:105,y:65}]} activeTerms={["COM", b === 1 ? "L1" : "L2"]} onTermClick={(name, note) => setSelected({ text: info[name] || note })} />
      <Wire x1={175} y1={95} x2={305} y2={357} type="line" active onClick={() => setSelected({ text: wireText.line + " Permanent line feeds COM on the first two-way switch." })} />
      <Wire x1={620} y1={357} x2={730} y2={105} type="switched" active={on} onClick={() => setSelected({ text: wireText.switched + " Switched line leaves COM on the second switch." })} />
      <Wire x1={275} y1={310} x2={590} y2={310} type="strapper1" active={a === 1 || b === 1} onClick={() => setSelected({ text: wireText.strapper1 + " This links L1 to L1." })} />
      <Wire x1={335} y1={310} x2={650} y2={310} type="strapper2" active={a === 2 || b === 2} onClick={() => setSelected({ text: wireText.strapper2 + " This links L2 to L2." })} />
      <Wire x1={175} y1={125} x2={730} y2={125} type="neutral" active onClick={() => setSelected({ text: wireText.neutral })} />
      <Wire x1={175} y1={155} x2={730} y2={155} type="cpc" active onClick={() => setSelected({ text: wireText.cpc })} />
      <button onClick={() => setA(a === 1 ? 2 : 1)} className="absolute left-[252px] top-[405px] rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow">Toggle A: {a === 1 ? "L1" : "L2"}</button>
      <button onClick={() => setB(b === 1 ? 2 : 1)} className="absolute left-[568px] top-[405px] rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow">Toggle B: {b === 1 ? "L1" : "L2"}</button>
      <div className={`absolute right-6 bottom-6 rounded-2xl px-4 py-3 text-sm font-semibold ${on ? "bg-yellow-100 text-yellow-900" : "bg-slate-200 text-slate-700"}`}>Lamp is {on ? "ON — selected paths match" : "OFF — selected paths differ"}</div>
    </div>
  );
}

function Intermediate({ setSelected }) {
  const [a, setA] = useState(1);
  const [midCross, setMidCross] = useState(false);
  const [b, setB] = useState(1);
  const effectiveB = midCross ? (b === 1 ? 2 : 1) : b;
  const on = a === effectiveB;
  return (
    <div className="relative h-[520px] rounded-3xl bg-slate-100 overflow-hidden border">
      <Supply x={20} y={35} onClick={() => setSelected({ text: info["Supply / rose"] })} />
      <Light x={860} y={100} on={on} onClick={() => setSelected({ text: info["Light fitting"] })} />
      <SwitchBox x={190} y={285} title="2-way switch A" terminals={[{label:"COM",x:75,y:112},{label:"L1",x:45,y:65},{label:"L2",x:105,y:65}]} activeTerms={["COM", a === 1 ? "L1" : "L2"]} onTermClick={(name, note) => setSelected({ text: info[name] || note })} />
      <div className="absolute rounded-2xl border border-slate-300 bg-white/95 shadow-sm" style={{ left: 430, top: 260, width: 170, height: 190 }}>
        <div className="px-3 py-2 border-b text-sm font-semibold flex items-center gap-2"><Cable className="w-4 h-4" />Intermediate</div>
        {[["L1 in",45,70],["L2 in",45,120],["L1 out",125,70],["L2 out",125,120]].map(([label,x,y]) => <Terminal key={label} x={x} y={y} label={label} active={true} onClick={() => setSelected({ text: info[`Intermediate terminal ${label}`] })} />)}
        <div className="absolute left-0 right-0 bottom-3 text-center text-xs text-slate-600">Mode: {midCross ? "crossed" : "straight"}</div>
      </div>
      <SwitchBox x={680} y={285} title="2-way switch B" terminals={[{label:"COM",x:75,y:112},{label:"L1",x:45,y:65},{label:"L2",x:105,y:65}]} activeTerms={["COM", b === 1 ? "L1" : "L2"]} onTermClick={(name, note) => setSelected({ text: info[name] || note })} />
      <Wire x1={170} y1={90} x2={265} y2={397} type="line" active onClick={() => setSelected({ text: wireText.line + " Permanent line feeds COM on the first end switch." })} />
      <Wire x1={755} y1={397} x2={825} y2={100} type="switched" active={on} onClick={() => setSelected({ text: wireText.switched + " Switched line leaves COM on the final two-way switch." })} />
      <Wire x1={235} y1={350} x2={475} y2={330} type="strapper1" active onClick={() => setSelected({ text: wireText.strapper1 + " First strapper from switch A into the intermediate." })} />
      <Wire x1={295} y1={350} x2={475} y2={380} type="strapper2" active onClick={() => setSelected({ text: wireText.strapper2 + " Second strapper from switch A into the intermediate." })} />
      <Wire x1={555} y1={330} x2={725} y2={350} type={midCross ? "strapper2" : "strapper1"} active onClick={() => setSelected({ text: midCross ? "Intermediate is crossed: the strapper paths swap over." : "Intermediate is straight-through: each strapper continues to the same side." })} />
      <Wire x1={555} y1={380} x2={785} y2={350} type={midCross ? "strapper1" : "strapper2"} active onClick={() => setSelected({ text: midCross ? "Crossed-over connection: this is what lets a middle switch change the state." : "Straight-through connection: no swap at the intermediate." })} />
      <Wire x1={170} y1={125} x2={825} y2={125} type="neutral" active onClick={() => setSelected({ text: wireText.neutral })} />
      <Wire x1={170} y1={155} x2={825} y2={155} type="cpc" active onClick={() => setSelected({ text: wireText.cpc })} />
      <button onClick={() => setA(a === 1 ? 2 : 1)} className="absolute left-[210px] top-[465px] rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow">Toggle A: {a === 1 ? "L1" : "L2"}</button>
      <button onClick={() => setMidCross(!midCross)} className="absolute left-[450px] top-[465px] rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow">Toggle intermediate: {midCross ? "Crossed" : "Straight"}</button>
      <button onClick={() => setB(b === 1 ? 2 : 1)} className="absolute left-[700px] top-[465px] rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow">Toggle B: {b === 1 ? "L1" : "L2"}</button>
      <div className={`absolute right-6 bottom-6 rounded-2xl px-4 py-3 text-sm font-semibold ${on ? "bg-yellow-100 text-yellow-900" : "bg-slate-200 text-slate-700"}`}>Lamp is {on ? "ON" : "OFF"}</div>
    </div>
  );
}

export default function LightingSwitchingVisualisation() {
  const [mode, setMode] = useState("one");
  const [selected, setSelected] = useState({ text: "Click around the diagram. Start with the supply, then follow permanent line, switch terminals, switched line, neutral, and CPC." });
  const tabs = [
    ["one", "1-way switching"],
    ["two", "2-way switching"],
    ["intermediate", "2-way + intermediate"],
  ];
  return (
    <div className="min-h-screen bg-white text-slate-950 p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Interactive UK Lighting Switching Visualisation</h1>
            <p className="mt-2 text-slate-700 max-w-3xl">Understand 1-way, 2-way, and 2-way plus intermediate switching by toggling switches and following the active conductor path.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map(([key, label]) => <Button key={key} onClick={() => { setMode(key); setSelected({ text: "Click any part of the new diagram to inspect it." }); }} variant={mode === key ? "default" : "outline"} className="rounded-xl">{label}</Button>)}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex gap-3 text-sm text-amber-950">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div><strong>Safety:</strong> this is for understanding only, not a substitute for testing, safe isolation, BS 7671 compliance, manufacturer instructions, or competence. Lighting circuits can contain borrowed neutrals, permanent lives at fittings, and old cable colours. Dead testing and safe isolation are essential before work.</div>
        </div>

        <Legend />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div>
            {mode === "one" && <OneWay setSelected={setSelected} />}
            {mode === "two" && <TwoWay setSelected={setSelected} />}
            {mode === "intermediate" && <Intermediate setSelected={setSelected} />}
          </div>
          <DetailPanel selected={selected} mode={mode} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl"><CardContent className="p-5"><h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />1-way essentials</h3><p className="mt-2 text-sm text-slate-700">One switch position. COM receives permanent line. L1 sends switched line to the lamp. Neutral remains at the light.</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />2-way essentials</h3><p className="mt-2 text-sm text-slate-700">Two switch positions. COM to COM is not normally linked directly. L1 and L2 are the two strappers. Either switch can change the state.</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />Intermediate essentials</h3><p className="mt-2 text-sm text-slate-700">Three or more positions. Two-way switches go at the ends. Intermediate switches go in the middle and swap the strapper pair.</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
