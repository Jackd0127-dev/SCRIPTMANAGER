// ══ NAV ══
function nav(id) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  const v = document.getElementById("view-" + id);
  if (v) v.classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((b) => {
    if (b.getAttribute("onclick") === "nav('" + id + "')")
      b.classList.add("active");
  });
  clearInfo();
  document.getElementById("content-area").scrollTop = 0;
  if (isMobile()) closeSidebar();
}
function isMobile() {
  return window.innerWidth <= 768;
}
function toggleSidebar() {
  const sb = document.getElementById("sidebar");
  const bd = document.getElementById("sidebar-backdrop");
  if (isMobile()) {
    const open = sb.classList.contains("mobile-open");
    if (open) {
      closeSidebar();
    } else {
      sb.classList.add("mobile-open");
      sb.classList.remove("collapsed");
      bd.classList.add("visible");
      document.body.style.overflow = "hidden";
    }
  } else {
    sb.classList.toggle("collapsed");
  }
}
function closeSidebar() {
  const sb = document.getElementById("sidebar");
  const bd = document.getElementById("sidebar-backdrop");
  sb.classList.remove("mobile-open");
  bd.classList.remove("visible");
  document.body.style.overflow = "";
}
function toggleCat(name) {
  const g = document.getElementById("cat-" + name);
  g.classList.toggle("open");
  g.querySelector(".cat-body").classList.toggle("open");
}
function searchNav(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle(
      "search-hide",
      q.length > 0 && !b.textContent.toLowerCase().includes(q),
    );
  });
  if (q)
    document
      .querySelectorAll(".cat-body")
      .forEach((b) => b.classList.add("open"));
}

// ══ INFO PANEL ══
const infoMap = {
  mains: "ic-mains",
  sw1: "ic-sw1",
  sw2way: "ic-sw2way",
  "inter-sw": "ic-inter-sw",
  cu: "ic-cu",
  incoming: "ic-incoming",
  mainswitch: "ic-mainswitch",
  rcbo: "ic-rcbo",
  rcd30ma: "ic-rcd30ma",
  afdd: "ic-afdd",
  socket13a: "ic-socket13a",
  ccu: "ic-ccu",
  "ccu-unit": "ic-ccu-unit",
  pullcord: "ic-pullcord",
  "shower-unit": "ic-shower-unit",
  lamp: "ic-lamp",
  cable1mm: "ic-cable1mm",
  cable25mm: "ic-cable25mm",
  mcb6a: "ic-mcb6a",
  "main-bond": "ic-main-bond",
  "supp-bond": "ic-supp-bond",
};
function showInfo(key) {
  document
    .querySelectorAll(".info-content")
    .forEach((e) => e.classList.remove("active"));
  document.getElementById("info-empty").style.display = "none";
  const id = infoMap[key];
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  } else {
    document.getElementById("info-empty").style.display = "";
  }
}
function clearInfo() {
  document
    .querySelectorAll(".info-content")
    .forEach((e) => e.classList.remove("active"));
  document.getElementById("info-empty").style.display = "";
}

// ══ REGS OVERLAY ══
function openRegs() {
  document.getElementById("regs-overlay").classList.add("open");
}
function closeRegs() {
  document.getElementById("regs-overlay").classList.remove("open");
}
function regsTab(btn, id) {
  document
    .querySelectorAll(".regs-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".regs-section")
    .forEach((s) => s.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(id).classList.add("active");
}

// ══ CHECKLIST ══
function toggleCheck(box) {
  box.classList.toggle("checked");
  box.textContent = box.classList.contains("checked") ? "✓" : "";
  const total = document.querySelectorAll("#main-checklist .check-box").length;
  const done = document.querySelectorAll(
    "#main-checklist .check-box.checked",
  ).length;
  document.getElementById("checklist-progress").style.width =
    Math.round((done / total) * 100) + "%";
}

// ══ HELPERS ══
function setBulb(pre, on) {
  const LIVE = "#c0392b",
    DEAD = "#a0998e",
    WARM = "#f39c12";
  const b = document.getElementById("b-" + pre);
  const t = document.getElementById("t-" + pre);
  const bulb = document.getElementById("bulb-" + pre);
  const glow = document.getElementById("glow-" + pre);
  if (b) {
    b.className = "bulb-dot" + (on ? " on" : "");
  }
  if (t) {
    t.textContent = on ? "Light is ON" : "Light is OFF";
  }
  if (bulb) bulb.setAttribute("stroke", on ? LIVE : DEAD);
  if (glow)
    glow.setAttribute(
      "fill",
      on ? "rgba(246,224,94,0.45)" : "rgba(246,224,94,0)",
    );
  ["f1-", "f2-", "f3-"].forEach((f) => {
    const el = document.getElementById(f + pre);
    if (el) el.setAttribute("stroke", on ? WARM : DEAD);
  });
}

// ══ 1-WAY ══
let s1 = false;
function toggle1w() {
  s1 = !s1;
  const L = "#c0392b",
    D = "#a0998e";
  document.getElementById("w-1w-post").setAttribute("stroke", s1 ? L : D);
  document
    .getElementById("w-1w-post")
    .setAttribute("stroke-dasharray", s1 ? "none" : "6 3");
  document.getElementById("arm-1w").setAttribute("y2", s1 ? "91" : "76");
  document.getElementById("term-1w").setAttribute("fill", s1 ? L : D);
  document.getElementById("swlbl-1w").textContent = s1 ? "CLOSED" : "OPEN";
  document.getElementById("swlbl-1w").setAttribute("fill", s1 ? "#27ae60" : D);
  setBulb("1w", s1);
}

// ══ 2-WAY ══
let sw2 = [0, 0];
function is2On() {
  return sw2[0] === sw2[1];
}
function tog2w(i) {
  sw2[i] = sw2[i] === 0 ? 1 : 0;
  draw2w();
}
function draw2w() {
  const on = is2On(),
    L = "#c0392b",
    D = "#a0998e",
    T = "#e67e22";
  const aY = sw2[0] === 0 ? 74 : 134;
  const bY = sw2[1] === 0 ? 74 : 134;
  document.getElementById("arm-2wa").setAttribute("x2", "278");
  document.getElementById("arm-2wa").setAttribute("y2", String(aY));
  document.getElementById("lbl-2wa").textContent =
    sw2[0] === 0 ? "→ L1" : "→ L2";
  document.getElementById("arm-2wb").setAttribute("x1", "387");
  document.getElementById("arm-2wb").setAttribute("y1", String(bY));
  document.getElementById("lbl-2wb").textContent =
    sw2[1] === 0 ? "→ L1" : "→ L2";
  const t1 = sw2[0] === 0;
  document.getElementById("trav1-2w").setAttribute("stroke", t1 ? T : D);
  document
    .getElementById("trav1-2w")
    .setAttribute("stroke-dasharray", t1 ? "none" : "5 3");
  document.getElementById("trav2-2w").setAttribute("stroke", t1 ? D : T);
  document
    .getElementById("trav2-2w")
    .setAttribute("stroke-dasharray", t1 ? "5 3" : "none");
  document.getElementById("post-2w").setAttribute("stroke", on ? L : D);
  document
    .getElementById("post-2w")
    .setAttribute("stroke-dasharray", on ? "none" : "5 3");
  setBulb("2w", on);
  document.getElementById("t-2w").textContent = on
    ? "Light is ON"
    : "Light is OFF";
}
draw2w();

// ══ INTERMEDIATE ══
let swInt = [0, 0, 0];
function intOn() {
  const m = swInt[1] === 0 ? swInt[0] : swInt[0] === 0 ? 1 : 0;
  return m === swInt[2];
}
function togInt(i) {
  swInt[i] = swInt[i] === 0 ? 1 : 0;
  drawInt();
}
function drawInt() {
  const on = intOn(),
    L = "#c0392b",
    D = "#a0998e",
    T = "#e67e22";
  const aY = swInt[0] === 0 ? 76 : 132;
  document.getElementById("arm-ia").setAttribute("x2", "214");
  document.getElementById("arm-ia").setAttribute("y2", String(aY));
  document.getElementById("lbl-ia").textContent =
    swInt[0] === 0 ? "→ L1" : "→ L2";
  const aTop = swInt[0] === 0;
  document.getElementById("ita1").setAttribute("stroke", aTop ? T : D);
  document
    .getElementById("ita1")
    .setAttribute("stroke-dasharray", aTop ? "none" : "5 3");
  document.getElementById("ita2").setAttribute("stroke", aTop ? D : T);
  document
    .getElementById("ita2")
    .setAttribute("stroke-dasharray", aTop ? "5 3" : "none");
  const cross = swInt[1] === 1;
  const c1 = document.getElementById("im-c1");
  const c2 = document.getElementById("im-c2");
  if (cross) {
    c1.setAttribute("x1", "307");
    c1.setAttribute("y1", "76");
    c1.setAttribute("x2", "373");
    c1.setAttribute("y2", "132");
    c2.setAttribute("x1", "307");
    c2.setAttribute("y1", "132");
    c2.setAttribute("x2", "373");
    c2.setAttribute("y2", "76");
  } else {
    c1.setAttribute("x1", "307");
    c1.setAttribute("y1", "76");
    c1.setAttribute("x2", "373");
    c1.setAttribute("y2", "76");
    c2.setAttribute("x1", "307");
    c2.setAttribute("y1", "132");
    c2.setAttribute("x2", "373");
    c2.setAttribute("y2", "132");
  }
  document.getElementById("lbl-im").textContent = cross
    ? "crossed"
    : "straight";
  const topEx = cross ? !aTop : aTop;
  c1.setAttribute("stroke", aTop ? T : D);
  c2.setAttribute("stroke", aTop ? D : T);
  document.getElementById("itb1").setAttribute("stroke", topEx ? T : D);
  document
    .getElementById("itb1")
    .setAttribute("stroke-dasharray", topEx ? "none" : "5 3");
  document.getElementById("itb2").setAttribute("stroke", topEx ? D : T);
  document
    .getElementById("itb2")
    .setAttribute("stroke-dasharray", topEx ? "5 3" : "none");
  const bY = swInt[2] === 0 ? 76 : 132;
  document.getElementById("arm-ib").setAttribute("x1", "464");
  document.getElementById("arm-ib").setAttribute("y1", String(bY));
  document.getElementById("lbl-ib").textContent =
    swInt[2] === 0 ? "→ L1" : "→ L2";
  document.getElementById("post-int").setAttribute("stroke", on ? L : D);
  document
    .getElementById("post-int")
    .setAttribute("stroke-dasharray", on ? "none" : "5 3");
  const bulb = document.getElementById("bulb-int");
  const glow = document.getElementById("glow-int");
  if (bulb) bulb.setAttribute("stroke", on ? L : D);
  if (glow)
    glow.setAttribute(
      "fill",
      on ? "rgba(246,224,94,0.45)" : "rgba(246,224,94,0)",
    );
  ["f1-int", "f2-int", "f3-int"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("stroke", on ? "#f39c12" : D);
  });
  document.getElementById("b-int").className = "bulb-dot" + (on ? " on" : "");
  document.getElementById("t-int").textContent = on
    ? "Light is ON"
    : "Light is OFF";
}
drawInt();

// ══ CCU (COOKER) ══
let ccuOn = false;
function togCCU() {
  ccuOn = !ccuOn;
  const L = "#c0392b",
    D = "#a0998e";
  document.getElementById("ccu-wire").setAttribute("stroke", ccuOn ? L : D);
  document
    .getElementById("ccu-wire")
    .setAttribute("stroke-dasharray", ccuOn ? "none" : "6 3");
  document.getElementById("ccu-out").setAttribute("fill", ccuOn ? L : D);
  document.getElementById("ccu-lbl").textContent = ccuOn ? "ON" : "OFF";
  document
    .getElementById("ccu-lbl")
    .setAttribute("fill", ccuOn ? "#27ae60" : D);
  const col = ccuOn ? "#e67e22" : D;
  ["ck-r1", "ck-r2", "ck-r3", "ck-r4"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("stroke", col);
  });
  const dot = document.getElementById("b-ccu");
  const txt = document.getElementById("t-ccu");
  if (dot) {
    dot.style.background = ccuOn ? "#e67e22" : "#a0998e";
    dot.style.borderColor = ccuOn ? "#d35400" : "#888";
  }
  if (txt) txt.textContent = ccuOn ? "Cooker is LIVE" : "Cooker is ISOLATED";
}

// ══ SHOWER ══
let shOn = false;
function togShower() {
  shOn = !shOn;
  const L = "#c0392b",
    D = "#a0998e";
  document.getElementById("sh-wire").setAttribute("stroke", shOn ? L : D);
  document
    .getElementById("sh-wire")
    .setAttribute("stroke-dasharray", shOn ? "none" : "6 3");
  document.getElementById("sh-out").setAttribute("fill", shOn ? L : D);
  const dot = document.getElementById("b-sh");
  const txt = document.getElementById("t-sh");
  if (dot) {
    dot.style.background = shOn ? "#2980b9" : "#888";
    dot.style.borderColor = shOn ? "#1e6b8c" : "#aaa";
    if (shOn) dot.style.boxShadow = "0 0 10px rgba(41,128,185,0.5)";
    else dot.style.boxShadow = "";
  }
  if (txt)
    txt.textContent = shOn ? "Shower is LIVE (running)" : "Shower is ISOLATED";
}
