window.DEFAULT_SETTINGS = {
  displayName: "",
  role: "Creator",
  handle: "",
  language: "English",
  timezone: "Europe/London",
  theme: "system",
  accent: "#00cbbf",
  density: "comfortable",
  defaultView: "full",
  defaultProject: "",
  autosave: true,
  smartTitles: true,
  aiTone: "punchy",
  aiCreativity: "52",
  aiAutoShots: true,
  aiBackgroundImports: true,
  emailNotifications: true,
  pushNotifications: false,
  dueReminders: true,
  importNotifications: true,
  weeklyDigest: true,
  twoFactor: false,
  publicProfile: false,
  analytics: true,
  sessionTimeout: "30",
  drive: false,
  notion: false,
  slack: false,
  plan: "Creator",
  keyboardShortcuts: true,
  customTypes: [],
};

window.currentProfile = { email: "", displayName: "", provider: "password" };

window.S = {
  projects: [],
  scripts: [],
  apid: null,
  asid: null,
  view: "full",
  settings: { ...window.DEFAULT_SETTINGS },
};

const COLORS = [
  "#00cbbf",
  "#ff4d8d",
  "#8f6dff",
  "#f8c84e",
  "#28d17c",
  "#ff8a4c",
  "#00a3ff",
  "#d7d7d7",
  "#050505",
  "#ffffff",
];

const STATUSES = ["draft", "ready", "shot", "posted"];

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "X"];

const BASE_TC = {
  shot: "#ff8a4c",
  transition: "#8f6dff",
  subtitle: "#28d17c",
  voiceover: "#b89cff",
  speech: "#ff4d8d",
  direction: "#f8c84e",
};

const CUSTOM_TYPE_COLORS = [
  "#00cbbf",
  "#ff4d8d",
  "#f8c84e",
  "#8f6dff",
  "#28d17c",
  "#00a3ff",
  "#ff8a4c",
  "#d9335f",
];

const TC = BASE_TC;

const SC = {
  draft: "#f8c84e",
  ready: "#28d17c",
  shot: "#ff4d8d",
  posted: "#8f6dff",
};

function demoWorkspaceTemplate() {
  const nextWeek = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const soon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  return {
    projects: [
      { id: "demo-launch", name: "Creator Launch", color: "#00cbbf" },
      { id: "demo-retainer", name: "Client Retainers", color: "#8f6dff" },
    ],
    scripts: [
      {
        id: "demo-script-hook",
        projectId: "demo-launch",
        name: "Batch Filming Hook",
        status: "ready",
        due: soon,
        platforms: ["TikTok", "Instagram"],
        notes:
          "Demo script. Edit anything here without affecting real account data.",
        blocks: [
          {
            id: "b1",
            type: "shot",
            shotName: "Cold open",
            desc: "Medium close-up, direct to camera, fast jump cut at the first pause.",
            spoken: "",
            notes: "Film vertical, keep laptop visible in background.",
            done: true,
            cut: false,
          },
          {
            id: "b2",
            type: "speech",
            shotName: "",
            desc: "",
            spoken:
              "If content feels impossible, your system is probably too heavy.",
            notes: "",
            done: true,
            cut: false,
          },
          {
            id: "b3",
            type: "transition",
            shotName: "Desk wipe",
            desc: "Hand crosses lens into a clean desk top-down setup.",
            spoken: "",
            notes: "",
            done: false,
            cut: false,
          },
          {
            id: "b4",
            type: "subtitle",
            shotName: "",
            desc: "",
            spoken: "Batch the thinking. Then batch the filming.",
            notes: "Use bold yellow highlight on Batch.",
            done: false,
            cut: false,
          },
          {
            id: "b5",
            type: "direction",
            shotName: "CTA",
            desc: "Point to pinned comment and ask viewers to save the checklist.",
            spoken: "",
            notes: "End with 1 second hold.",
            done: false,
            cut: false,
          },
        ],
      },
      {
        id: "demo-script-product",
        projectId: "demo-launch",
        name: "Director Product Teaser",
        status: "draft",
        due: nextWeek,
        platforms: ["YouTube", "X"],
        notes:
          "Use this as a visual QA surface for cards, tabs, progress, and block editing.",
        blocks: [
          {
            id: "p1",
            type: "shot",
            shotName: "Screen record",
            desc: "Open dashboard, show project stats and command menu.",
            spoken: "",
            notes: "",
            done: false,
            cut: false,
          },
          {
            id: "p2",
            type: "voiceover",
            shotName: "",
            desc: "",
            spoken:
              "Director turns scattered ideas into a production plan you can actually shoot.",
            notes: "",
            done: false,
            cut: false,
          },
          {
            id: "p3",
            type: "transition",
            shotName: "Zoom",
            desc: "Zoom from script card into full script view.",
            spoken: "",
            notes: "",
            done: false,
            cut: false,
          },
          {
            id: "p4",
            type: "subtitle",
            shotName: "",
            desc: "",
            spoken: "Plan. Shoot. Track. Ship.",
            notes: "",
            done: false,
            cut: false,
          },
        ],
      },
      {
        id: "demo-script-client",
        projectId: "demo-retainer",
        name: "Monthly Results Recap",
        status: "posted",
        due: "",
        platforms: ["Instagram", "X"],
        notes: "Posted demo item for filtered project views.",
        blocks: [
          {
            id: "c1",
            type: "shot",
            shotName: "Metric board",
            desc: "Show three simple before/after stats.",
            spoken: "",
            notes: "",
            done: true,
            cut: false,
          },
          {
            id: "c2",
            type: "speech",
            shotName: "",
            desc: "",
            spoken:
              "Here is what changed after we stopped posting random content.",
            notes: "",
            done: true,
            cut: false,
          },
          {
            id: "c3",
            type: "direction",
            shotName: "Close",
            desc: "End on next-month roadmap card.",
            spoken: "",
            notes: "",
            done: true,
            cut: false,
          },
        ],
      },
    ],
    apid: "demo-launch",
    asid: "demo-script-hook",
    view: "full",
    settings: {
      ...window.DEFAULT_SETTINGS,
      displayName: "Demo Creator",
      accent: "#00cbbf",
      defaultView: "full",
    },
  };
}

function loadDemoWorkspaceSnapshot() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("directorDemoWorkspace") || "null",
    );
    if (
      saved?.demoVersion === 2 &&
      saved?.projects?.length &&
      saved?.scripts?.length
    )
      return {
        ...demoWorkspaceTemplate(),
        ...saved,
        settings: { ...window.DEFAULT_SETTINGS, ...(saved.settings || {}) },
      };
  } catch (e) {}
  return demoWorkspaceTemplate();
}

window.startDemoWorkspace = () => {
  window.isDemoMode = true;
  const data = loadDemoWorkspaceSnapshot();
  window.S = {
    projects: Array.isArray(data.projects) ? data.projects : [],
    scripts: Array.isArray(data.scripts) ? data.scripts : [],
    apid: data.apid || data.projects?.[0]?.id || null,
    asid: data.asid || data.scripts?.[0]?.id || null,
    view: data.view || "full",
    settings: { ...window.DEFAULT_SETTINGS, ...(data.settings || {}) },
  };
  window.currentProfile = {
    email: "demo@director.local",
    displayName: "Demo Creator",
    provider: "demo",
  };
  const signout = document.querySelector(".signout-btn");
  if (signout) signout.textContent = "Exit demo";
  window.showScreen?.("app");
  applySettings();
  renderSb();
  if (S.asid && scr(S.asid)) selScript(S.asid);
  else if (S.apid && proj(S.apid)) selProject(S.apid);
  else if (S.projects[0]) selProject(S.projects[0].id);
  showToast("Demo workspace loaded. Changes stay in this browser.");
};

function demoTitleFromText(text, fallback = "Generated creator script") {
  return (
    String(text || fallback)
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 7)
      .join(" ")
      .replace(/[,.!?;:]+$/g, "") || fallback
  );
}

function demoGeneratedScript(payload = {}) {
  const brief = String(
    payload.instructions ||
      payload.currentScript ||
      payload.currentName ||
      "a practical creator workflow",
  ).trim();
  const topic = demoTitleFromText(brief, "Creator workflow");
  const title = payload.currentName || `${topic} Hook`;
  const script = [
    `Hook: Most creators do not need more ideas. They need a cleaner way to turn one idea into something they can actually shoot.`,
    `Shot: Open on the messy notes, then cut to a clean Director project view.`,
    `Speech: Here is the simple system: capture the idea, split it into shots, mark what is done, and export the final plan.`,
    `Subtitle: Plan it once. Shoot it faster.`,
    `Transition: Quick zoom from the project card into the script blocks.`,
    `Direction: End on a confident CTA to save the workflow and reuse it for the next script.`,
  ].join("\n\n");
  return {
    title: title.slice(0, 80),
    script: `${script}\n\nBrief used: ${brief.slice(0, 240)}`,
  };
}

function demoBlocksFromText(rawScript) {
  const clean = String(rawScript || "")
    .replace(/\s+/g, " ")
    .trim();
  const parts =
    clean
      .match(/[^.!?\n]+[.!?]?/g)
      ?.map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 6) || [];
  const seed = parts.length
    ? parts
    : [
        "Open with a strong hook.",
        "Explain the main idea clearly.",
        "Show the product or process in action.",
        "Finish with a direct CTA.",
      ];
  return [
    {
      type: "shot",
      shotName: "Hook shot",
      desc: "Open with a clean visual setup that makes the topic obvious.",
      spoken: "",
    },
    { type: "speech", shotName: "", desc: "", spoken: seed[0] },
    {
      type: "transition",
      shotName: "Clean cut",
      desc: "Cut from the hook into the proof or workflow moment.",
      spoken: "",
    },
    {
      type: "subtitle",
      shotName: "",
      desc: "",
      spoken: seed[1] || "Keep the main takeaway visible on screen.",
    },
    {
      type: "direction",
      shotName: "CTA",
      desc: seed[2] || "Close with the next step for the viewer.",
      spoken: "",
    },
  ];
}

const uid = () => Math.random().toString(36).substr(2, 9);

const proj = (id) => S.projects.find((p) => p.id === id);

const scr = (id) => S.scripts.find((s) => s.id === id);

const pscripts = (pid) => S.scripts.filter((s) => s.projectId === pid);

const dueSt = (d) => {
  if (!d) return null;
  const diff = (new Date(d) - new Date()) / 86400000;
  return diff < 0 ? "overdue" : diff < 3 ? "soon" : "ok";
};

const fmtDate = (d) => {
  if (!d) return "";
  const st = settings();
  const locale =
    {
      English: "en-GB",
      Spanish: "es-ES",
      French: "fr-FR",
      German: "de-DE",
      Portuguese: "pt-PT",
      Japanese: "ja-JP",
    }[st.language] || "en-GB";
  return new Date(d).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: st.timezone || "Europe/London",
  });
};

const fp = (t) =>
  esc(t || "")
    .replace(/;;;/g, '<span class="pause">PAUSE</span>')
    .replace(/\b(THOUSANDS|DO|Xcode)\b/g, '<span class="emph">$1</span>');

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );

function slugType(label) {
  return String(label || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function customTypes() {
  const list = Array.isArray(settings().customTypes)
    ? settings().customTypes
    : [];
  return list
    .map((type, i) => {
      const label = typeof type === "string" ? type : type?.label;
      const id = slugType(typeof type === "string" ? type : type?.id || label);
      if (!id || BASE_TC[id]) return null;
      return {
        id,
        label: String(label || id).trim(),
        color: type?.color || CUSTOM_TYPE_COLORS[i % CUSTOM_TYPE_COLORS.length],
      };
    })
    .filter(Boolean);
}

function typeMap() {
  return {
    ...BASE_TC,
    ...Object.fromEntries(customTypes().map((t) => [t.id, t.color])),
  };
}

function blockTypeList() {
  return [
    ...Object.keys(BASE_TC).map((id) => ({
      id,
      label: id,
      color: BASE_TC[id],
      custom: false,
    })),
    ...customTypes().map((t) => ({ ...t, custom: true })),
  ];
}

function typeColor(type) {
  return typeMap()[type] || "#d7d7d7";
}

function typeLabel(type) {
  return (
    blockTypeList().find((t) => t.id === type)?.label ||
    String(type || "direction")
  );
}

function typePillClass(type) {
  return BASE_TC[type] ? `pill-${type}` : "pill-custom";
}

function isSpokenType(type) {
  return type === "subtitle" || type === "voiceover" || type === "speech";
}

function blockTypeOptions(selected = "direction") {
  return blockTypeList()
    .map(
      (t) =>
        `<option value="${esc(t.id)}"${selected === t.id ? " selected" : ""}>${esc(t.label)}</option>`,
    )
    .join("");
}

function normalizeClientType(type) {
  const id = slugType(type);
  return typeMap()[id] ? id : "direction";
}

function customTypesPayload() {
  return customTypes().map(({ id, label, color }) => ({ id, label, color }));
}

const settings = () => ({ ...window.DEFAULT_SETTINGS, ...(S.settings || {}) });

let sessionTimer = null;

const collapsedProjects = new Set(
  JSON.parse(localStorage.getItem("directorCollapsedProjects") || "[]"),
);

function saveCollapsedProjects() {
  localStorage.setItem(
    "directorCollapsedProjects",
    JSON.stringify([...collapsedProjects]),
  );
}

function hexToRgb(hex) {
  const clean = String(hex || "#050505").replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function projectStyleVars(color) {
  const { r, g, b } = hexToRgb(color);
  return `--project-color:${color};--project-soft:rgba(${r},${g},${b},0.10);--project-border:rgba(${r},${g},${b},0.30);--project-shadow:rgba(${r},${g},${b},0.13)`;
}

function scriptStyleVars(color) {
  const { r, g, b } = hexToRgb(color);
  return `--script-color:${color};--script-soft:rgba(${r},${g},${b},0.10);--script-border:rgba(${r},${g},${b},0.30);--script-shadow:rgba(${r},${g},${b},0.18)`;
}

function applySettings() {
  const st = settings();
  const darkSystem = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  ).matches;
  document.body.classList.toggle(
    "theme-dark",
    st.theme === "dark" || (st.theme === "system" && darkSystem),
  );
  document.body.classList.toggle(
    "theme-light",
    st.theme === "light" || (st.theme === "system" && !darkSystem),
  );
  document.body.classList.toggle("density-compact", st.density === "compact");
  document.body.classList.toggle("density-spacious", st.density === "spacious");
  document.documentElement.style.setProperty(
    "--accent",
    st.accent || "#00cbbf",
  );
  clearTimeout(sessionTimer);
  if (st.sessionTimeout !== "never" && window.currentProfile?.email) {
    sessionTimer = setTimeout(
      () => doSignout(),
      Number(st.sessionTimeout || 30) * 60000,
    );
  }
  const label =
    st.displayName ||
    st.handle ||
    window.currentProfile?.email ||
    window.currentProfile?.displayName ||
    "User";
  const emailEl = document.getElementById("userEmail");
  const avatarEl = document.getElementById("userAvatar");
  if (emailEl) emailEl.textContent = label;
  if (avatarEl) avatarEl.textContent = label[0]?.toUpperCase() || "?";
}

function notifyUser(title, body) {
  const st = settings();
  if (!st.pushNotifications && !st.importNotifications) return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") new Notification(title, { body });
  else if (Notification.permission !== "denied" && st.pushNotifications)
    Notification.requestPermission();
}

function showToast(message, actionLabel = "", action = "") {
  const toast = document.getElementById("aiJobToast");
  if (!toast) return;
  toast.innerHTML = `${esc(message)}${actionLabel ? `<button onclick="${action}">${esc(actionLabel)}</button>` : ""}`;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(
    () => toast.classList.remove("show"),
    actionLabel ? 12000 : 4200,
  );
}

const mobileNavQuery = window.matchMedia("(max-width: 780px)");

window.openMobileNav = () => {
  document.body.classList.add("sidebar-open");
  document
    .getElementById("mobileMenuBtn")
    ?.setAttribute("aria-expanded", "true");
};

window.closeMobileNav = () => {
  document.body.classList.remove("sidebar-open");
  document
    .getElementById("mobileMenuBtn")
    ?.setAttribute("aria-expanded", "false");
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMobileNav();
  const tag = e.target?.tagName;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (
    !settings().keyboardShortcuts ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  )
    return;
  if (e.key.toLowerCase() === "n") {
    e.preventDefault();
    openNewScriptModal(S.apid);
  }
  if (e.key.toLowerCase() === "i") {
    e.preventDefault();
    openImportScriptModal(S.apid);
  }
  if (e.key === ",") {
    e.preventDefault();
    openSettingsPage();
  }
});

mobileNavQuery.addEventListener?.("change", (e) => {
  if (!e.matches) closeMobileNav();
});

window.renderSb = function (filter = "") {
  let h = "";

  const q = filter.toLowerCase();

  (S.projects || []).forEach((p) => {
    const scripts = pscripts(p.id).filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q),
    );

    const collapsed = !q && collapsedProjects.has(p.id);
    const active = S.apid === p.id && !S.asid;
    const style = projectStyleVars(p.color);

    h += `<div class="nav-project${active ? " active" : ""}${collapsed ? " collapsed" : ""}" style="${style}" onclick="selProject('${p.id}')"><button class="project-toggle" type="button" aria-label="${collapsed ? "Show" : "Hide"} ${esc(p.name)} scripts" onclick="event.stopPropagation();toggleProjectScripts('${p.id}')"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="proj-dot" style="background:${p.color}"></div><div class="proj-name">${esc(p.name)}</div><div class="proj-count">${scripts.length}</div></div>`;

    h += `<div class="project-scripts${collapsed ? " collapsed" : ""}" id="scripts-${p.id}">`;

    scripts.forEach((s) => {
      h += `<div class="nav-script${S.asid === s.id ? " active" : ""}" onclick="selScript('${s.id}')"><div class="script-pip" style="background:${SC[s.status] || "#ccc"}"></div><div class="script-nav-name">${esc(s.name)}</div></div>`;
    });

    h += "</div>";
  });

  if (!S.projects || !S.projects.length)
    h = `<div style="padding:20px 16px;font-size:12px;color:var(--text3)">No projects yet.</div>`;

  document.getElementById("sidebarBody").innerHTML = h;
};

window.filterSb = (v) => renderSb(v);

window.recoverSidebarIfLoading = () => {
  const el = document.getElementById("sidebarBody");
  if (!el || !/Loading/.test(el.textContent || "")) return;
  if (window.S?.projects?.length || window.S?.scripts?.length) renderSb();
};

window.addEventListener("load", () => {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    recoverSidebarIfLoading();
    if (
      attempts >= 20 ||
      !/Loading/.test(document.getElementById("sidebarBody")?.textContent || "")
    )
      clearInterval(timer);
  }, 500);
});

window.toggleProjectScripts = (id) => {
  if (collapsedProjects.has(id)) collapsedProjects.delete(id);
  else collapsedProjects.add(id);
  saveCollapsedProjects();
  renderSb(document.querySelector(".search")?.value || "");
};

function show() {
  document.body.classList.remove("import-open");

  document.getElementById("welcomeScreen").style.display = "none";

  const mv = document.getElementById("mainView");

  mv.style.display = "flex";
  mv.style.flexDirection = "column";
  mv.style.overflow = "hidden";
}

window.selProject = function (id) {
  S.apid = id;
  S.asid = null;
  S.view = "overview";
  renderSb();
  showProject(id);
  closeMobileNav();
};

const PROJECT_FILTERS = {
  all: {
    title: "Scripts",
    label: "All scripts",
    sub: "Every script in this project, collected into one production-ready gallery.",
  },
  ready: {
    title: "Ready",
    label: "Ready scripts",
    sub: "Scripts that are prepared for filming, publishing, or final review.",
  },
  posted: {
    title: "Posted",
    label: "Posted scripts",
    sub: "Published work you can review, reuse, or compare against new drafts.",
  },
  draft: {
    title: "Drafts",
    label: "Draft scripts",
    sub: "Ideas and rough cuts still being shaped into finished content.",
  },
};

function scriptCardHtml(s, style) {
  const done = s.blocks.filter((b) => b.done).length;
  const pct = s.blocks.length ? Math.round((done / s.blocks.length) * 100) : 0;
  const ds = dueSt(s.due);
  return `<div class="osc project-script-card" style="${style}" onclick="selScript('${s.id}')"><div class="osc-top"><div class="osc-name">${esc(s.name)}</div><span class="badge badge-${s.status}">${s.status}</span></div><div class="osc-meta">${s.due ? `<span class="due${ds ? " " + ds : ""}">${fmtDate(s.due)}</span>` : ""} ${(s.platforms || []).map((pl) => `<span class="plat plat-${pl.toLowerCase()}">${esc(pl)}</span>`).join("")}</div><div class="prog-wrap" style="margin-top:10px"><div class="prog-fill" style="width:${pct}%"></div></div><div style="font-size:11px;color:var(--text3);margin-top:4px">${done}/${s.blocks.length} blocks · ${pct}% complete</div></div>`;
}

window.showProjectFilter = (id, filter = "all") => {
  const p = proj(id);
  if (!p) return;
  const style = projectStyleVars(p.color);
  const scripts = pscripts(id);
  const meta = PROJECT_FILTERS[filter] || PROJECT_FILTERS.all;
  const filtered =
    filter === "all" ? scripts : scripts.filter((s) => s.status === filter);
  show();
  S.apid = id;
  S.asid = null;
  S.view = `project-${filter}`;
  document.getElementById("topbarTitle").textContent = p.name;
  document.getElementById("topbarSub").innerHTML =
    `<span style="font-size:12px;color:var(--text3)">${meta.label}</span>`;
  document.getElementById("topbarRight").innerHTML =
    `<button class="btn-ghost" onclick="showProject('${id}')">All scripts</button><button class="btn-ghost" onclick="openEditProjectModal('${id}')">Edit</button>`;
  document.getElementById("tabsRow").innerHTML = "";
  const empty = `<div class="empty" style="${style}"><div class="empty-title">No ${meta.label.toLowerCase()} yet</div><div class="empty-sub">When scripts match this status they will appear here.</div><div class="empty-actions"><button class="action-card create-action" onclick="openNewScriptModal('${id}')"><strong>Create script</strong><span>Start from an idea, title, or quick production brief.</span></button><button class="action-card import-action" onclick="openImportScriptModal('${id}')"><strong>Import script</strong><span>Paste a full draft and let AI sort it into blocks.</span></button></div></div>`;
  document.getElementById("mainContent").innerHTML = `
    <section class="filtered-hero" style="${style}">
      <div class="filtered-hero-inner">
        <div>
          <div class="filtered-kicker">${esc(p.name)}</div>
          <div class="filtered-title">${esc(meta.title)}</div>
          <div class="filtered-sub">${esc(meta.sub)}</div>
        </div>
        <div class="filtered-count"><strong>${filtered.length}</strong><span>${filtered.length === 1 ? "script" : "scripts"}</span></div>
      </div>
    </section>
    <div class="filtered-actions"><button class="btn-ghost" onclick="showProject('${id}')">Back to overview</button><button class="btn" onclick="openNewScriptModal('${id}')">Create script</button></div>
    ${filtered.length ? `<div class="script-gallery">${filtered.map((s) => scriptCardHtml(s, style)).join("")}</div>` : empty}`;
};

function showProject(id) {
  const p = proj(id);
  const scripts = pscripts(id);
  show();

  const style = projectStyleVars(p.color);

  document.getElementById("topbarTitle").textContent = p.name;

  const sc = { draft: 0, ready: 0, shot: 0, posted: 0 };

  scripts.forEach((s) => {
    if (sc[s.status] !== undefined) sc[s.status]++;
  });

  const dueSoon = settings().dueReminders
    ? scripts.filter((s) => ["soon", "overdue"].includes(dueSt(s.due))).length
    : 0;
  document.getElementById("topbarSub").innerHTML =
    `<span style="font-size:12px;color:var(--text3)">${scripts.length} script${scripts.length !== 1 ? "s" : ""}</span>${dueSoon ? `<span class="due soon">${dueSoon} need attention</span>` : ""}`;

  document.getElementById("topbarRight").innerHTML =
    `<button class="btn-ghost" onclick="openEditProjectModal('${id}')">Edit</button>`;

  document.getElementById("tabsRow").innerHTML = "";

  const el = document.getElementById("mainContent");

  if (!scripts.length) {
    el.innerHTML = `<div class="empty" style="${style}"><div class="empty-title">No scripts yet</div><div class="empty-sub">Start clean or bring in a draft and let Director structure it.</div><div class="empty-actions"><button class="action-card create-action" onclick="openNewScriptModal('${id}')"><strong>Create script</strong><span>Start from an idea, title, or quick production brief.</span></button><button class="action-card import-action" onclick="openImportScriptModal('${id}')"><strong>Import script</strong><span>Paste a full draft and let AI sort it into blocks.</span></button></div></div>`;
    return;
  }

  let h = `<div class="stat-grid project-stats" style="${style}"><div class="stat-card project-stat-card" onclick="showProjectFilter('${id}','all')"><div class="stat-label">Scripts</div><div class="stat-val">${scripts.length}</div></div><div class="stat-card project-stat-card" onclick="showProjectFilter('${id}','ready')"><div class="stat-label">Ready</div><div class="stat-val">${sc.ready}</div></div><div class="stat-card project-stat-card" onclick="showProjectFilter('${id}','posted')"><div class="stat-label">Posted</div><div class="stat-val">${sc.posted}</div></div><div class="stat-card project-stat-card" onclick="showProjectFilter('${id}','draft')"><div class="stat-label">Drafts</div><div class="stat-val">${sc.draft}</div></div></div><div class="sec-hd"><div class="sec-title">All scripts</div></div>`;

  scripts.forEach((s) => {
    const done = s.blocks.filter((b) => b.done).length;

    const pct = s.blocks.length
      ? Math.round((done / s.blocks.length) * 100)
      : 0;

    const ds = dueSt(s.due);

    h += scriptCardHtml(s, style);
  });

  el.innerHTML = h;
}

const MY_STUFF_PASSWORD_HASH =
  "4083240aae55fd555b43fafbcc8f3c346210cee31eb9d5cdd3f6ae73831637e2";
const MY_STUFF_UNLOCK_KEY = "directorMyStuffUnlocked";
const MY_STUFF_PAGES_KEY = "directorMyStuffPages";

async function hashText(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function myStuffUnlocked() {
  return localStorage.getItem(MY_STUFF_UNLOCK_KEY) === "yes";
}

function myStuffPages() {
  try {
    return JSON.parse(localStorage.getItem(MY_STUFF_PAGES_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveMyStuffPages(pages) {
  localStorage.setItem(MY_STUFF_PAGES_KEY, JSON.stringify(pages));
}

window.openMyStuff = () => {
  closeMobileNav();
  if (myStuffUnlocked()) {
    showMyStuff();
    return;
  }
  document.getElementById("modalBox").className = "modal premium-modal";
  document.getElementById("modalBox").innerHTML = `
    <div class="premium-modal-shell">
      <div class="premium-modal-content">
        <div class="modal-title">Unlock My stuff</div>
        <div class="modal-subtitle">Enter the password once. After this, My stuff stays open on this browser.</div>
        <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="stuff-pass" type="password" autofocus onkeydown="if(event.key==='Enter')unlockMyStuff()"></div>
        <div class="auth-err" id="stuff-pass-err"></div>
        <div class="modal-actions"><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="unlockMyStuff()">Unlock</button></div>
      </div>
    </div>`;
  document.getElementById("modalOverlay").classList.add("open");
};

window.unlockMyStuff = async () => {
  const input = document.getElementById("stuff-pass");
  const err = document.getElementById("stuff-pass-err");
  const submittedHash = await hashText(input?.value || "");
  if (submittedHash !== MY_STUFF_PASSWORD_HASH) {
    if (err) err.textContent = "Wrong password.";
    return;
  }
  localStorage.setItem(MY_STUFF_UNLOCK_KEY, "yes");
  if (input) input.value = "";
  closeModal();
  showMyStuff();
};

function allStuffPages() {
  return myStuffPages();
}

window.showMyStuff = () => {
  show();
  S.apid = null;
  S.asid = null;
  S.view = "my-stuff";
  renderSb(document.querySelector(".search")?.value || "");
  const pages = allStuffPages();
  document.getElementById("topbarTitle").textContent = "My stuff";
  document.getElementById("topbarSub").innerHTML =
    `<span style="font-size:12px;color:var(--text3)">Unlocked pages and demos</span>`;
  document.getElementById("topbarRight").innerHTML =
    `<button class="btn" onclick="openAddStuffPageModal()">Add page</button>`;
  document.getElementById("tabsRow").innerHTML = "";
  document.getElementById("mainContent").innerHTML = `
    <section class="stuff-hero">
      <div class="stuff-hero-inner">
        <div>
          <div class="stuff-title">My stuff</div>
          <div class="stuff-sub">A private page for your own web pages and demos. Unlock it once with the password and it stays open on this browser.</div>
        </div>
        <div class="stuff-count"><strong>${pages.length}</strong><span>${pages.length === 1 ? "page" : "pages"}</span></div>
      </div>
    </section>
    <div class="stuff-actions"><div class="sec-title">Saved pages</div><button class="btn-ghost" onclick="openAddStuffPageModal()">Add page</button></div>
    <div class="stuff-grid">
      ${pages
        .map(
          (page) => `
        <button class="stuff-card ${page.type === "demo" ? "demo" : ""}" onclick="openStuffPage('${esc(page.id)}')">
          <div>
            <div class="stuff-card-title">${esc(page.title)}</div>
            <div class="stuff-card-desc">${esc(page.desc || page.url || "")}</div>
          </div>
          <div class="stuff-card-meta"><span>${page.type === "demo" ? "Built in demo" : esc(page.url || "Web page")}</span><span class="stuff-chip">Open</span></div>
        </button>`,
        )
        .join("")}
    </div>`;
};

window.openAddStuffPageModal = () => {
  document.getElementById("modalBox").className = "modal premium-modal";
  document.getElementById("modalBox").innerHTML = `
    <div class="premium-modal-shell">
      <div class="premium-modal-content">
        <div class="modal-title">Add page</div>
        <div class="modal-subtitle">Add one of your web pages to My stuff. Pages are saved on this browser.</div>
        <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="stuff-title" placeholder="My website"></div>
        <div class="form-group"><label class="form-label">URL</label><input class="form-input" id="stuff-url" placeholder="https://example.com"></div>
        <div class="form-group"><label class="form-label">Short note</label><input class="form-input" id="stuff-desc" placeholder="What this page is for"></div>
        <div class="auth-err" id="stuff-add-err"></div>
        <div class="modal-actions"><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveStuffPage()">Save page</button></div>
      </div>
    </div>`;
  document.getElementById("modalOverlay").classList.add("open");
};

window.saveStuffPage = () => {
  const title = document.getElementById("stuff-title").value.trim();
  let url = document.getElementById("stuff-url").value.trim();
  const desc = document.getElementById("stuff-desc").value.trim();
  const err = document.getElementById("stuff-add-err");
  if (!title || !url) {
    err.textContent = "Add a name and URL.";
    return;
  }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const pages = myStuffPages();
  pages.push({ id: uid(), title, url, desc, type: "url" });
  saveMyStuffPages(pages);
  closeModal();
  showMyStuff();
};

window.openStuffPage = (id) => {
  const page = myStuffPages().find((item) => item.id === id);
  if (!page) return;
  show();
  document.getElementById("topbarTitle").textContent = page.title;
  document.getElementById("topbarSub").innerHTML =
    `<span style="font-size:12px;color:var(--text3)">${esc(page.url)}</span>`;
  document.getElementById("topbarRight").innerHTML =
    `<button class="btn-ghost" onclick="showMyStuff()">Back</button><a class="btn" href="${esc(page.url)}" target="_blank" rel="noopener">Open tab</a>`;
  document.getElementById("tabsRow").innerHTML = "";
  document.getElementById("mainContent").innerHTML =
    `<div class="stuff-viewer"><div class="stuff-viewer-bar"><div class="stuff-viewer-title">${esc(page.title)}</div><button class="btn-ghost" onclick="showMyStuff()">Back to My stuff</button></div><iframe class="stuff-frame" src="${esc(page.url)}" title="${esc(page.title)}"></iframe></div>`;
};

function scriptPlainText(s) {
  if (!s) return "";
  const lines = [
    s.name,
    "",
    `Status: ${s.status || "draft"}`,
    s.due ? `Due: ${fmtDate(s.due)}` : "",
    (s.platforms || []).length
      ? `Platforms: ${(s.platforms || []).join(", ")}`
      : "",
    s.notes ? `Notes: ${s.notes}` : "",
    "",
    "Blocks",
  ].filter(Boolean);
  (s.blocks || []).forEach((b, i) => {
    const label = typeLabel(normalizeClientType(b.type));
    const body = isSpokenType(b.type)
      ? b.spoken
      : [b.shotName, b.desc].filter(Boolean).join(" - ");
    lines.push(
      `${String(i + 1).padStart(2, "0")}. [${label}] ${body || "Untitled block"}`,
    );
    if (b.notes) lines.push(`    Notes: ${b.notes}`);
  });
  return lines.join("\n");
}

window.copyScriptText = async (id) => {
  const s = scr(id);
  if (!s) return;
  const text = scriptPlainText(s);
  try {
    await navigator.clipboard.writeText(text);
    showToast("Script copied to clipboard.");
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("Script copied to clipboard.");
  }
};

window.downloadScriptText = (id) => {
  const s = scr(id);
  if (!s) return;
  const blob = new Blob([scriptPlainText(s)], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slugType(s.name) || "director-script"}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Script download started.");
};

window.selScript = function (id) {
  S.asid = id;
  S.apid = scr(id)?.projectId;
  S.view = settings().defaultView || "full";
  renderSb();
  showScript(id);
  closeMobileNav();
};

function showScript(id) {
  const s = scr(id);
  if (!s) return;
  show();

  document.getElementById("topbarTitle").textContent = s.name;

  const ds = dueSt(s.due);

  document.getElementById("topbarSub").innerHTML =
    `<span class="badge badge-${s.status}" style="cursor:pointer" onclick="cycleStatus('${id}')">${s.status}</span>${s.due ? `<span class="due${ds ? " " + ds : ""}">${fmtDate(s.due)}</span>` : ""} ${(s.platforms || []).map((p) => `<span class="plat plat-${esc(p).toLowerCase()}">${esc(p)}</span>`).join("")}`;

  document.getElementById("topbarRight").innerHTML =
    `<button class="btn-ghost" onclick="openAddBlock('${id}')">Add block</button><button class="btn-ghost" onclick="copyScriptText('${id}')">Copy</button><button class="btn-ghost" onclick="downloadScriptText('${id}')">Export</button><button class="btn-ghost" onclick="openEditScriptModal('${id}')">Edit</button><button class="btn-ghost" onclick="resetBlocks('${id}')">Reset</button>`;

  const TABS = [
    { id: "full", label: "Full script" },
    { id: "shots", label: "Shots" },
    { id: "transitions", label: "Transitions" },
    { id: "subtitles", label: "Subtitles" },
    { id: "timeline", label: "Timeline" },
    { id: "notes", label: "Notes" },
  ];

  document.getElementById("tabsRow").innerHTML = TABS.map(
    (t) =>
      `<div class="tab${S.view === t.id ? " active" : ""}" onclick="switchTab('${t.id}','${id}')">${t.label}</div>`,
  ).join("");

  renderContent(id);
}

window.switchTab = (v, id) => {
  S.view = v;
  showScript(id);
};

window.cycleStatus = (id) => {
  const s = scr(id);
  s.status = STATUSES[(STATUSES.indexOf(s.status) + 1) % STATUSES.length];
  save();
  showScript(id);
};

window.resetBlocks = (id) => {
  scr(id).blocks.forEach((b) => {
    b.done = false;
    b.cut = false;
  });
  save();
  renderContent(id);
};

function renderContent(id) {
  const s = scr(id);
  const el = document.getElementById("mainContent");

  if (S.view === "full") renderFull(s, el);
  else if (S.view === "shots") renderShots(s, el);
  else if (S.view === "transitions") renderTransitions(s, el);
  else if (S.view === "subtitles") renderSubtitles(s, el);
  else if (S.view === "timeline") renderTimeline(s, el);
  else if (S.view === "notes") renderNotes(s, el);
}

function renderFull(s, el) {
  const done = s.blocks.filter((b) => b.done).length;

  const cut = s.blocks.filter((b) => b.cut).length;

  const shots = s.blocks.filter((b) => b.type === "shot").length;

  const lines = s.blocks.filter((b) => isSpokenType(b.type)).length;

  const pct = s.blocks.length ? Math.round((done / s.blocks.length) * 100) : 0;

  let h = `<div class="script-summary">
    <div class="script-summary-main">
      <div class="script-summary-title"><strong>Shoot progress</strong><span style="font-size:12px;font-weight:800" data-pct>${pct}%</span></div>
      <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
      <div class="script-summary-meta" data-prog-sub>${done} of ${s.blocks.length} blocks marked done${cut ? ` · ${cut} cut` : ""}. Use Copy or Export when the plan is ready to share.</div>
    </div>
    <div class="script-summary-stat"><span>Blocks</span><strong>${s.blocks.length}</strong></div>
    <div class="script-summary-stat"><span>Shots</span><strong>${shots}</strong></div>
    <div class="script-summary-stat"><span>Lines</span><strong>${lines}</strong></div>
  </div>`;

  h += `<div class="legend">${blockTypeList()
    .map(
      (t) =>
        `<div class="legend-item"><div class="legend-pip" style="background:${t.color}"></div>${esc(t.label)}</div>`,
    )
    .join("")}</div>`;

  s.blocks.forEach((b) => {
    b.type = normalizeClientType(b.type);
    const isSp = isSpokenType(b.type);

    const txt = isSp
      ? fp(b.spoken)
      : fp(b.shotName + (b.desc ? " — " + b.desc : ""));

    h += `<div class="block-row${b.done ? " done" : ""}${b.cut ? " cut" : ""}" id="bl-${b.id}" onclick="openBlockDetail('${s.id}','${b.id}')"><span class="type-pill ${typePillClass(b.type)}" style="--type-color:${typeColor(b.type)}">${esc(typeLabel(b.type))}${b.shotName && !isSp ? " · " + esc(b.shotName) : ""}</span><div class="block-main ${isSp ? "block-spoken" : "block-desc"}">${txt}${b.notes ? `<div class="block-note-preview">${esc(b.notes)}</div>` : ""}</div><button class="block-tick${b.done ? " on" : ""}" onclick="event.stopPropagation();toggle('${s.id}','${b.id}','done')" aria-label="Mark done"><svg viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1"/></svg></button><button class="block-x${b.cut ? " on" : ""}" onclick="event.stopPropagation();toggle('${s.id}','${b.id}','cut')" aria-label="Cut"><svg viewBox="0 0 12 12" fill="none"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg></button></div>`;
  });

  el.innerHTML = h;
}

function renderShots(s, el) {
  const shots = s.blocks.filter((b) => b.type === "shot");

  let h = `<div class="sec-hd"><div class="sec-title">Shots (${shots.length})</div></div><div class="shots-grid">`;

  shots.forEach((b, i) => {
    const idx = s.blocks.indexOf(b);

    const rel = s.blocks
      .slice(idx + 1)
      .filter((x) => isSpokenType(x.type))
      .slice(0, 2)
      .map((x) => x.spoken)
      .join(" ");

    h += `<div class="shot-card${b.done ? " done" : ""}${b.cut ? " cut" : ""}" id="bl-${b.id}" onclick="openBlockDetail('${s.id}','${b.id}')"><div class="shot-num">0${i + 1}</div><span class="type-pill pill-shot">${esc(b.shotName)}</span>${b.desc ? `<div style="font-size:12px;color:var(--text2);margin-top:6px;font-style:italic">${esc(b.desc)}</div>` : ""} ${rel ? `<div class="shot-spoken-box">${fp(rel)}</div>` : ""}${b.notes ? `<div class="block-note-preview">${esc(b.notes)}</div>` : ""}<div class="shot-btns"><button class="tb${b.done ? " on" : ""}" onclick="event.stopPropagation();toggle('${s.id}','${b.id}','done')">✓ Done</button><button class="xb${b.cut ? " on" : ""}" onclick="event.stopPropagation();toggle('${s.id}','${b.id}','cut')">✕ Cut</button></div></div>`;
  });

  el.innerHTML = h + "</div>";
}

function renderTransitions(s, el) {
  const trans = s.blocks.filter((b) => b.type === "transition");

  const groups = {};

  trans.forEach((b) => {
    if (!groups[b.shotName]) groups[b.shotName] = [];
    groups[b.shotName].push(b);
  });

  let h = `<div class="sec-hd"><div class="sec-title">Transitions (${trans.length} total)</div></div>`;

  Object.entries(groups).forEach(([name, blocks]) => {
    h += `<div style="margin-bottom:18px"><div style="font-size:13px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px">${esc(name)} <span style="font-size:11px;color:var(--text3);font-weight:400">×${blocks.length}</span></div>`;

    blocks.forEach((b, i) => {
      h += `<div class="block-row${b.done ? " done" : ""}${b.cut ? " cut" : ""}" id="bl-${b.id}" onclick="openBlockDetail('${s.id}','${b.id}')"><span class="type-pill pill-transition">#${i + 1}</span><div class="block-main block-desc">${esc(b.desc || "—")}${b.notes ? `<div class="block-note-preview">${esc(b.notes)}</div>` : ""}</div><button class="block-tick${b.done ? " on" : ""}" onclick="event.stopPropagation();toggle('${s.id}','${b.id}','done')" aria-label="Mark done"><svg viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1"/></svg></button><button class="block-x${b.cut ? " on" : ""}" onclick="event.stopPropagation();toggle('${s.id}','${b.id}','cut')" aria-label="Cut"><svg viewBox="0 0 12 12" fill="none"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg></button></div>`;
    });

    h += "</div>";
  });

  el.innerHTML = h;
}

function renderSubtitles(s, el) {
  const lines = s.blocks.filter((b) => isSpokenType(b.type));

  let h = `<div class="sec-hd"><div class="sec-title">Dialogue & subtitles (${lines.length} lines)</div></div>`;

  lines.forEach((b, i) => {
    const short =
      b.type === "voiceover" ? "VO" : b.type === "speech" ? "SP" : "SUB";
    h += `<div class="sub-line" onclick="openBlockDetail('${s.id}','${b.id}')"><div class="sub-idx">${String(i + 1).padStart(2, "0")}</div><span class="type-pill ${typePillClass(b.type)}" style="flex-shrink:0;align-self:flex-start;margin-top:1px">${short}</span><div class="sub-text">${fp(b.spoken)}${b.notes ? `<div class="block-note-preview">${esc(b.notes)}</div>` : ""}</div></div>`;
  });

  el.innerHTML = h;
}

function renderTimeline(s, el) {
  let h = `<div class="sec-hd"><div class="sec-title">Shot timeline (${s.blocks.length} events)</div></div><div class="timeline">`;

  s.blocks.forEach((b, i) => {
    b.type = normalizeClientType(b.type);
    const label = isSpokenType(b.type)
      ? b.spoken
      : b.shotName + (b.desc ? " — " + b.desc : "");

    h += `<div class="tl-item"><div class="tl-dot" style="background:${typeColor(b.type)}"></div><div class="tl-card" onclick="openBlockDetail('${s.id}','${b.id}')"><div class="tl-meta">${String(i + 1).padStart(2, "0")} · ${esc(typeLabel(b.type))}${b.shotName ? " · " + esc(b.shotName) : ""}</div><div class="tl-text">${fp(label)}${b.notes ? `<div class="block-note-preview">${esc(b.notes)}</div>` : ""}</div></div></div>`;
  });

  el.innerHTML = h + "</div>";
}

function renderNotes(s, el) {
  const done = s.blocks.filter((b) => b.done).length;

  const cut = s.blocks.filter((b) => b.cut).length;

  el.innerHTML = `<div class="sec-hd"><div class="sec-title">Notes</div></div><textarea class="notes-ta" placeholder="Notes, reminders, shoot checklist…" oninput="saveNotes('${s.id}',this.value)">${esc(s.notes || "")}</textarea><div class="divider"></div><div class="sec-hd"><div class="sec-title">Script info</div></div><div class="stat-grid"><div class="stat-card"><div class="stat-label">Total blocks</div><div class="stat-val">${s.blocks.length}</div></div><div class="stat-card"><div class="stat-label">Shots</div><div class="stat-val" style="color:#ff8a4c">${s.blocks.filter((b) => b.type === "shot").length}</div></div><div class="stat-card"><div class="stat-label">Transitions</div><div class="stat-val" style="color:var(--violet)">${s.blocks.filter((b) => b.type === "transition").length}</div></div><div class="stat-card"><div class="stat-label">Lines</div><div class="stat-val" style="color:var(--mint)">${s.blocks.filter((b) => isSpokenType(b.type)).length}</div></div><div class="stat-card"><div class="stat-label">Done</div><div class="stat-val" style="color:var(--green)">${done}</div></div><div class="stat-card"><div class="stat-label">Cut</div><div class="stat-val" style="color:var(--red)">${cut}</div></div></div>`;
}

window.openBlockDetail = (sid, bid) => {
  const s = scr(sid);
  const b = s?.blocks.find((x) => x.id === bid);
  if (!b) return;
  b.type = normalizeClientType(b.type);
  openModal(`<div class="modal-title">Edit block</div>
    <div class="block-detail-grid">
      <div class="form-group"><label class="form-label">Type</label><div class="type-control"><select class="form-select" id="bd-type">${blockTypeOptions(b.type)}</select><button class="btn-ghost" type="button" onclick="openCustomTypeCreator('bd-type')">Custom</button></div></div>
      <div class="form-group"><label class="form-label">Shot label</label><input class="form-input" id="bd-shot" value="${esc(b.shotName || "")}" placeholder="Hook, Product shot, CTA"></div>
    </div>
    <div class="form-group"><label class="form-label">Detail / direction</label><textarea class="notes-ta" id="bd-desc" style="min-height:96px" placeholder="Camera move, framing, transition, action, edit detail...">${esc(b.desc || "")}</textarea></div>
    <div class="form-group"><label class="form-label">Spoken / on-screen text</label><textarea class="notes-ta" id="bd-spoken" style="min-height:96px" placeholder="Voiceover, subtitle, caption, hook line...">${esc(b.spoken || "")}</textarea></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="notes-ta" id="bd-notes" style="min-height:120px" placeholder="Props, reminders, timing, retakes, extra context...">${esc(b.notes || "")}</textarea></div>
    <div class="modal-actions"><button class="btn-ghost btn-danger" onclick="deleteBlock('${sid}','${bid}')">Delete block</button><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveBlockDetail('${sid}','${bid}')">Save block</button></div>`);
};

window.openAddBlock = (sid) => {
  openModal(`<div class="modal-title">Add block</div>
    <div class="block-detail-grid">
      <div class="form-group"><label class="form-label">Type</label><div class="type-control"><select class="form-select" id="ab-type">${blockTypeOptions()}</select><button class="btn-ghost" type="button" onclick="openCustomTypeCreator('ab-type')">Custom</button></div></div>
      <div class="form-group"><label class="form-label">Shot label</label><input class="form-input" id="ab-shot" placeholder="Hook, Product shot, CTA"></div>
    </div>
    <div class="form-group"><label class="form-label">Detail / direction</label><textarea class="notes-ta" id="ab-desc" style="min-height:96px" placeholder="Camera move, framing, transition, action, edit detail..."></textarea></div>
    <div class="form-group"><label class="form-label">Spoken / on-screen text</label><textarea class="notes-ta" id="ab-spoken" style="min-height:96px" placeholder="Voiceover, subtitle, caption, hook line..."></textarea></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="notes-ta" id="ab-notes" style="min-height:90px" placeholder="Props, reminders, timing, retakes..."></textarea></div>
    <div class="modal-actions"><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="createBlock('${sid}')">Add block</button></div>`);
};

window.createBlock = (sid) => {
  const s = scr(sid);
  if (!s) return;
  s.blocks.push({
    id: uid(),
    type: normalizeClientType(document.getElementById("ab-type").value),
    shotName: document.getElementById("ab-shot").value.trim(),
    desc: document.getElementById("ab-desc").value.trim(),
    spoken: document.getElementById("ab-spoken").value.trim(),
    notes: document.getElementById("ab-notes").value.trim(),
    done: false,
    cut: false,
  });
  save();
  closeModal();
  showScript(sid);
};

window.saveBlockDetail = (sid, bid) => {
  const s = scr(sid);
  const b = s?.blocks.find((x) => x.id === bid);
  if (!b) return;
  b.type = normalizeClientType(document.getElementById("bd-type").value);
  b.shotName = document.getElementById("bd-shot").value.trim();
  b.desc = document.getElementById("bd-desc").value.trim();
  b.spoken = document.getElementById("bd-spoken").value.trim();
  b.notes = document.getElementById("bd-notes").value.trim();
  save();
  closeModal();
  showScript(sid);
};

window.deleteBlock = (sid, bid) => {
  if (!confirm("Delete this block?")) return;
  const s = scr(sid);
  if (!s) return;
  s.blocks = s.blocks.filter((b) => b.id !== bid);
  save();
  closeModal();
  showScript(sid);
};

window.saveNotes = (id, v) => {
  const s = scr(id);
  if (s) {
    s.notes = v;
    save();
  }
};

window.toggle = (sid, bid, field) => {
  const s = scr(sid);
  const b = s.blocks.find((x) => x.id === bid);
  if (!b) return;
  b[field] = !b[field];
  if (field === "done" && b.done) b.cut = false;
  if (field === "cut" && b.cut) b.done = false;
  save();

  const el = document.getElementById(`bl-${bid}`);
  if (!el) {
    renderContent(sid);
    return;
  }

  el.classList.toggle("done", b.done);
  el.classList.toggle("cut", b.cut);

  const tickBtn = el.querySelector(".block-tick,.tb");
  const xBtn = el.querySelector(".block-x,.xb");

  if (tickBtn) {
    tickBtn.classList.toggle("on", b.done);
    if (b.done) {
      void tickBtn.offsetWidth;
      tickBtn.classList.remove("on");
      void tickBtn.offsetWidth;
      tickBtn.classList.add("on");
    }
  }
  if (xBtn) {
    xBtn.classList.toggle("on", b.cut);
    if (b.cut) {
      void xBtn.offsetWidth;
      xBtn.classList.remove("on");
      void xBtn.offsetWidth;
      xBtn.classList.add("on");
    }
  }
  if (field === "done" && b.done && xBtn) xBtn.classList.remove("on");
  if (field === "cut" && b.cut && tickBtn) tickBtn.classList.remove("on");

  const done2 = s.blocks.filter((b2) => b2.done).length;
  const pct2 = s.blocks.length
    ? Math.round((done2 / s.blocks.length) * 100)
    : 0;
  const fill = document.querySelector(".prog-fill");
  if (fill) fill.style.width = pct2 + "%";
  const pctEl = document.querySelector("[data-pct]");
  if (pctEl) pctEl.textContent = pct2 + "%";
  const subEl = document.querySelector("[data-prog-sub]");
  if (subEl)
    subEl.textContent =
      done2 + " of " + s.blocks.length + " blocks marked done";
};

window.openModal = (html, extraClass = "") => {
  const box = document.getElementById("modalBox");
  delete box.dataset.jobId;
  box.removeAttribute("style");
  box.className = `modal${extraClass ? ` ${extraClass}` : ""}`;
  box.innerHTML = html;
  document.getElementById("modalOverlay").classList.add("open");
};

window.closeModal = () => {
  document.getElementById("modalOverlay").classList.remove("open");
  document.getElementById("modalBox").className = "modal";
  document.getElementById("modalBox").removeAttribute("style");
};

window.closeModalOutside = (e) => {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
};

window.selColor = (el) => {
  document
    .querySelectorAll(".color-dot")
    .forEach((e) => e.classList.remove("sel"));
  el.classList.add("sel");
};

window.selStatus = (el) => {
  document
    .querySelectorAll(".status-chip")
    .forEach((e) => e.classList.remove("sel"));
  el.classList.add("sel");
};

window.openCustomTypeCreator = (selectId) => {
  const name = prompt(
    "Name this custom type, for example Hook, B-roll, CTA, or Proof.",
  );
  const label = String(name || "")
    .trim()
    .slice(0, 28);
  const id = slugType(label);
  if (!id) return;
  if (BASE_TC[id]) {
    const select = document.getElementById(selectId);
    if (select) select.value = id;
    return;
  }
  const existing = customTypes().find((t) => t.id === id);
  if (!existing) {
    const next = customTypes().length;
    S.settings = {
      ...settings(),
      customTypes: [
        ...customTypes(),
        {
          id,
          label,
          color: CUSTOM_TYPE_COLORS[next % CUSTOM_TYPE_COLORS.length],
        },
      ],
    };
    save();
  }
  const select = document.getElementById(selectId);
  if (select) {
    select.innerHTML = blockTypeOptions(id);
    select.value = id;
  }
};

function commandItems() {
  const base = [
    {
      kind: "action",
      id: "new-project",
      icon: "+",
      title: "Create project",
      sub: "Start a new colour-coded workspace",
      tag: "Action",
    },
    {
      kind: "action",
      id: "new-script",
      icon: "S",
      title: "Create script",
      sub: "Open the guided script creator",
      tag: "Action",
    },
    {
      kind: "action",
      id: "import-script",
      icon: "I",
      title: "Import script",
      sub: "Paste or generate a script and sort it with Gemini",
      tag: "Action",
    },
    {
      kind: "action",
      id: "generate-script",
      icon: "G",
      title: "Generate script",
      sub: "Create a draft from a brief",
      tag: "AI",
    },
    {
      kind: "action",
      id: "settings",
      icon: ",",
      title: "Settings",
      sub: "Profile, appearance, AI, shortcuts, data",
      tag: "View",
    },
    {
      kind: "action",
      id: "my-stuff",
      icon: "M",
      title: "My stuff",
      sub: "Private pages and built-in demos",
      tag: "View",
    },
    {
      kind: "action",
      id: "export",
      icon: "E",
      title: "Export workspace",
      sub: "Download all projects, scripts, and settings",
      tag: "Data",
    },
  ];
  if (S.asid && scr(S.asid)) {
    base.splice(
      4,
      0,
      {
        kind: "action",
        id: "copy-active",
        icon: "C",
        title: "Copy active script",
        sub: scr(S.asid).name,
        tag: "Script",
      },
      {
        kind: "action",
        id: "download-active",
        icon: "D",
        title: "Download active script",
        sub: scr(S.asid).name,
        tag: "Script",
      },
    );
  }
  if (!window.isDemoMode)
    base.push({
      kind: "action",
      id: "demo",
      icon: "P",
      title: "Preview demo workspace",
      sub: "Explore Director without signing in",
      tag: "Demo",
    });
  const projects = (S.projects || []).map((p) => ({
    kind: "project",
    id: p.id,
    icon: "P",
    title: p.name,
    sub: `${pscripts(p.id).length} script${pscripts(p.id).length !== 1 ? "s" : ""}`,
    tag: "Project",
  }));
  const scripts = (S.scripts || []).map((s) => ({
    kind: "script",
    id: s.id,
    icon: "S",
    title: s.name,
    sub: `${proj(s.projectId)?.name || "No project"} · ${s.status}`,
    tag: "Script",
  }));
  return [...base, ...projects, ...scripts];
}

window.openCommandPalette = () => {
  closeMobileNav();
  openModal(
    `<div class="command-shell">
    <div class="command-head"><strong>Command menu</strong><span class="kbd">⌘K</span></div>
    <input class="command-search" id="commandSearch" placeholder="Search actions, projects, and scripts..." oninput="renderCommandResults(this.value)" onkeydown="if(event.key==='Enter')runFirstCommandResult()">
    <div class="command-list" id="commandList"></div>
  </div>`,
    "command-modal",
  );
  renderCommandResults("");
  setTimeout(() => document.getElementById("commandSearch")?.focus(), 30);
};

window.renderCommandResults = (q) => {
  const query = String(q || "")
    .trim()
    .toLowerCase();
  const items = commandItems()
    .filter(
      (item) =>
        !query ||
        `${item.title} ${item.sub} ${item.tag}`.toLowerCase().includes(query),
    )
    .slice(0, 18);
  const list = document.getElementById("commandList");
  if (!list) return;
  list.innerHTML = items.length
    ? items
        .map(
          (item) => `
    <button class="command-item" data-kind="${esc(item.kind)}" data-id="${esc(item.id)}" onclick="runCommand('${esc(item.kind)}','${esc(item.id)}')">
      <span class="command-icon">${esc(item.icon)}</span>
      <span><span class="command-title">${esc(item.title)}</span><span class="command-sub">${esc(item.sub)}</span></span>
      <span class="command-tag">${esc(item.tag)}</span>
    </button>`,
        )
        .join("")
    : '<div class="command-empty">No matching commands.</div>';
};

window.runFirstCommandResult = () => {
  const first = document.querySelector(".command-item");
  if (first) runCommand(first.dataset.kind, first.dataset.id);
};

window.runCommand = (kind, id) => {
  closeModal();
  if (kind === "project") {
    selProject(id);
    return;
  }
  if (kind === "script") {
    selScript(id);
    return;
  }
  if (id === "new-project") openNewProjectModal();
  if (id === "new-script") openNewScriptModal(S.apid);
  if (id === "import-script") openImportScriptModal(S.apid);
  if (id === "generate-script") openGenerateScriptModal(S.apid);
  if (id === "settings") openSettingsPage();
  if (id === "my-stuff") window.location.href = "index.html";
  if (id === "export") exportWorkspace();
  if (id === "demo") startDemoWorkspace();
  if (id === "copy-active") copyScriptText(S.asid);
  if (id === "download-active") downloadScriptText(S.asid);
};

window.scrollSettings = (id) => {
  document
    .getElementById(`settings-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  document
    .querySelectorAll(".settings-nav button")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.target === id),
    );
};

function toggleLine(id, title, sub, checked) {
  return `<div class="setting-line"><div><strong>${title}</strong><span>${sub}</span></div><label class="toggle"><input id="${id}" type="checkbox"${checked ? " checked" : ""}><span></span></label></div>`;
}

function settingsSelect(id, label, value, options) {
  return `<div class="form-group"><label class="form-label">${label}</label><select class="form-select" id="${id}">${options.map((opt) => `<option value="${esc(opt)}"${value === opt ? " selected" : ""}>${esc(opt)}</option>`).join("")}</select></div>`;
}

window.openSettingsPage = () => {
  const st = settings();
  const profile = window.currentProfile || {};
  show();
  closeMobileNav();
  S.view = "settings";
  document.getElementById("topbarTitle").textContent = "Settings";
  document.getElementById("topbarSub").innerHTML =
    `<span style="font-size:12px;color:var(--text3)">Profile, workspace, AI, notifications, privacy, billing, and data</span>`;
  document.getElementById("topbarRight").innerHTML =
    `<button class="btn-ghost" onclick="exitSettingsPage()">Done</button>`;
  document.getElementById("tabsRow").innerHTML = "";
  document.getElementById("mainContent").innerHTML = `
    <div class="settings-shell">
      <div class="settings-nav">
        ${["account", "appearance", "workspace", "ai", "notifications", "privacy", "integrations", "billing", "data", "shortcuts"].map((id, i) => `<button class="${i === 0 ? "active" : ""}" data-target="${id}" onclick="scrollSettings('${id}')">${id[0].toUpperCase() + id.slice(1)}</button>`).join("")}
      </div>
      <div class="settings-stack">
        <section class="settings-section" id="settings-account">
          <h3>Account</h3>
          <p>Control the identity Director uses across scripts, exports, collaboration, and generated production notes.</p>
          <div class="settings-grid">
            <div class="form-group"><label class="form-label">Display name</label><input class="form-input" id="set-displayName" value="${esc(st.displayName || profile.displayName || "")}" placeholder="Your name"></div>
            <div class="form-group"><label class="form-label">Creator handle</label><input class="form-input" id="set-handle" value="${esc(st.handle)}" placeholder="@yourhandle"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${esc(profile.email || "")}" disabled></div>
            <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="set-role" value="${esc(st.role)}" placeholder="Creator, Producer, Editor"></div>
            ${settingsSelect("set-language", "Language", st.language, ["English", "Spanish", "French", "German", "Portuguese", "Japanese"])}
            ${settingsSelect("set-timezone", "Timezone", st.timezone, ["Europe/London", "America/New_York", "America/Los_Angeles", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"])}
          </div>
        </section>

        <section class="settings-section" id="settings-appearance">
          <h3>Appearance</h3>
          <p>Choose how dense, bright, and branded the app should feel while you are planning shoots.</p>
          <div class="settings-grid">
            ${settingsSelect("set-theme", "Theme", st.theme, ["system", "light", "dark"])}
            ${settingsSelect("set-density", "Density", st.density, ["comfortable", "compact", "spacious"])}
            ${settingsSelect("set-defaultView", "Default script view", st.defaultView, ["full", "shots", "transitions", "subtitles", "timeline", "notes"])}
            <div class="form-group"><label class="form-label">Accent colour</label><div class="color-row">${COLORS.map((c) => `<div class="color-dot${st.accent === c ? " sel" : ""}" style="background:${c}" data-c="${c}" onclick="selColor(this)"></div>`).join("")}</div></div>
          </div>
        </section>

        <section class="settings-section" id="settings-workspace">
          <h3>Workspace</h3>
          <p>Set the defaults that shape new scripts, project routing, saves, and the app startup state.</p>
          <div class="settings-grid">
            ${settingsSelect("set-defaultProject", "Default project", st.defaultProject || "", ["", ...(S.projects || []).map((p) => p.id)])}
            ${toggleLine("set-autosave", "Autosave changes", "Save edits automatically while you work.", st.autosave)}
            ${toggleLine("set-smartTitles", "Smart script titles", "Let Director suggest clearer names for imported scripts.", st.smartTitles)}
            <div class="form-group"><label class="form-label">New script template</label><textarea class="notes-ta" id="set-template" style="min-height:88px" placeholder="Hook, setup, payoff, CTA...">${esc(st.template || "")}</textarea></div>
          </div>
        </section>

        <section class="settings-section" id="settings-ai">
          <h3>AI assistant</h3>
          <p>Tune how Gemini turns raw drafts into shootable blocks and how much creative structure it should add.</p>
          <div class="settings-grid">
            ${settingsSelect("set-aiTone", "AI tone", st.aiTone, ["punchy", "cinematic", "clean", "high-energy", "educational", "luxury"])}
            <div class="form-group"><label class="form-label">Creativity</label><div class="range-row"><input id="set-aiCreativity" type="range" min="0" max="100" value="${esc(st.aiCreativity)}" oninput="document.getElementById('set-aiCreativityVal').textContent=this.value"><span id="set-aiCreativityVal">${esc(st.aiCreativity)}</span></div></div>
            ${toggleLine("set-aiAutoShots", "Auto-create shot plan", "Split raw text into shots, transitions, captions, voiceover, and directions.", st.aiAutoShots)}
            ${toggleLine("set-aiBackgroundImports", "Background imports", "Keep Gemini working when the import window is closed.", st.aiBackgroundImports)}
          </div>
        </section>

        <section class="settings-section" id="settings-notifications">
          <h3>Notifications</h3>
          <p>Pick which reminders are worth interrupting you for during planning, filming, and posting.</p>
          <div class="settings-grid">
            ${toggleLine("set-emailNotifications", "Email notifications", "Important account, billing, and workspace updates.", st.emailNotifications)}
            ${toggleLine("set-pushNotifications", "Push notifications", "Browser alerts for time-sensitive script work.", st.pushNotifications)}
            ${toggleLine("set-dueReminders", "Due reminders", "Warnings when scripts are close to their due date.", st.dueReminders)}
            ${toggleLine("set-importNotifications", "AI import finished", "Tell me when background Gemini imports are ready.", st.importNotifications)}
            ${toggleLine("set-weeklyDigest", "Weekly digest", "A short summary of progress, blockers, and ready scripts.", st.weeklyDigest)}
          </div>
        </section>

        <section class="settings-section" id="settings-privacy">
          <h3>Privacy & security</h3>
          <p>Manage session behaviour, sharing defaults, account protection, and product analytics.</p>
          <div class="settings-grid">
            ${toggleLine("set-twoFactor", "Two-factor authentication", "Require an extra verification step on sign in.", st.twoFactor)}
            ${toggleLine("set-publicProfile", "Public creator profile", "Allow shared script packs to show your profile.", st.publicProfile)}
            ${toggleLine("set-analytics", "Product analytics", "Share anonymous usage signals to improve Director.", st.analytics)}
            ${settingsSelect("set-sessionTimeout", "Session timeout", st.sessionTimeout, ["15", "30", "60", "never"])}
          </div>
        </section>

        <section class="settings-section" id="settings-integrations">
          <h3>Integrations</h3>
          <p>Connect the services a production workflow usually needs. These controls are ready for provider wiring.</p>
          <div class="settings-grid three">
            ${toggleLine("set-drive", "Google Drive", "Sync exports and backup script packs.", st.drive)}
            ${toggleLine("set-notion", "Notion", "Send approved scripts into a content calendar.", st.notion)}
            ${toggleLine("set-slack", "Slack", "Post ready-to-shoot scripts to your team.", st.slack)}
          </div>
        </section>

        <section class="settings-section" id="settings-billing">
          <h3>Billing</h3>
          <p>Review plan controls, receipts, AI usage, invoices, seats, and upgrade state.</p>
          <div class="settings-grid">
            ${settingsSelect("set-plan", "Plan", st.plan, ["Starter", "Creator", "Studio", "Agency"])}
            <div class="setting-line"><div><strong>Gemini usage</strong><span>${S.scripts?.filter((s) => s.notes === "Imported with Gemini.").length || 0} AI imports saved in this workspace.</span></div><button class="btn-ghost" type="button" onclick="showUsageModal()">Usage</button></div>
            <div class="setting-line"><div><strong>Invoices</strong><span>Download receipts and manage billing email.</span></div><button class="btn-ghost" type="button" onclick="showBillingModal()">Manage</button></div>
          </div>
        </section>

        <section class="settings-section" id="settings-data">
          <h3>Data</h3>
          <p>Export, restore, or remove account data when you need to move work between production systems.</p>
          <div class="mini-action-row">
            <button class="btn-ghost" onclick="exportWorkspace()">Export workspace</button>
            <button class="btn-ghost" onclick="document.getElementById('workspaceImport').click()">Restore workspace</button>
            <input id="workspaceImport" type="file" accept="application/json" style="display:none" onchange="importWorkspaceFile(this.files?.[0])">
            <button class="btn-ghost" onclick="openImportScriptModal()">Import script</button>
            <button class="btn-ghost btn-danger" onclick="alert('Account deletion needs a backend confirmation flow before it can run safely.')">Delete account</button>
          </div>
        </section>

        <section class="settings-section" id="settings-shortcuts">
          <h3>Shortcuts</h3>
          <p>Keep the common app movements discoverable for fast editing and shooting sessions.</p>
          <div class="settings-grid">
            ${toggleLine("set-keyboardShortcuts", "Keyboard shortcuts", "N creates a script, I opens import, and comma opens settings.", st.keyboardShortcuts)}
            <div class="setting-line"><div><strong>Create script</strong><span>Press N from a project view.</span></div><span class="settings-chip">N</span></div>
            <div class="setting-line"><div><strong>Import script</strong><span>Press I anywhere in the workspace.</span></div><span class="settings-chip">I</span></div>
            <div class="setting-line"><div><strong>Open settings</strong><span>Click your profile or press comma.</span></div><span class="settings-chip">,</span></div>
          </div>
        </section>

        <div class="settings-savebar">
          <button class="btn-ghost" onclick="openSettingsPage()">Reset changes</button>
          <button class="btn" onclick="saveSettings()">Save settings</button>
        </div>
      </div>
    </div>`;

  const dp = document.getElementById("set-defaultProject");
  if (dp) {
    [...dp.options].forEach((opt) => {
      if (!opt.value) opt.textContent = "Most recent project";
      else opt.textContent = proj(opt.value)?.name || opt.value;
    });
  }
};

window.exitSettingsPage = () => {
  if (S.asid && scr(S.asid)) selScript(S.asid);
  else if (S.apid && proj(S.apid)) selProject(S.apid);
  else {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("welcomeScreen").style.display = "flex";
  }
};

window.saveSettings = () => {
  const bool = (id) => !!document.getElementById(id)?.checked;
  const val = (id) => document.getElementById(id)?.value || "";
  S.settings = {
    ...settings(),
    displayName: val("set-displayName"),
    role: val("set-role"),
    handle: val("set-handle"),
    language: val("set-language"),
    timezone: val("set-timezone"),
    theme: val("set-theme"),
    density: val("set-density"),
    defaultView: val("set-defaultView"),
    defaultProject: val("set-defaultProject"),
    accent:
      document.querySelector(".color-dot.sel")?.dataset.c || settings().accent,
    template: val("set-template"),
    autosave: bool("set-autosave"),
    smartTitles: bool("set-smartTitles"),
    aiTone: val("set-aiTone"),
    aiCreativity: val("set-aiCreativity"),
    aiAutoShots: bool("set-aiAutoShots"),
    aiBackgroundImports: bool("set-aiBackgroundImports"),
    emailNotifications: bool("set-emailNotifications"),
    pushNotifications: bool("set-pushNotifications"),
    dueReminders: bool("set-dueReminders"),
    importNotifications: bool("set-importNotifications"),
    weeklyDigest: bool("set-weeklyDigest"),
    twoFactor: bool("set-twoFactor"),
    publicProfile: bool("set-publicProfile"),
    analytics: bool("set-analytics"),
    sessionTimeout: val("set-sessionTimeout"),
    drive: bool("set-drive"),
    notion: bool("set-notion"),
    slack: bool("set-slack"),
    plan: val("set-plan"),
    keyboardShortcuts: bool("set-keyboardShortcuts"),
  };
  applySettings();
  if (
    S.settings.pushNotifications &&
    "Notification" in window &&
    Notification.permission === "default"
  )
    Notification.requestPermission();
  save();
  document.getElementById("topbarSub").innerHTML =
    `<span style="font-size:12px;color:var(--green)">Settings saved</span>`;
};

window.exportWorkspace = () => {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          projects: S.projects || [],
          scripts: S.scripts || [],
          settings: S.settings || {},
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "director-workspace.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

window.importWorkspaceFile = (file) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.projects) || !Array.isArray(data.scripts))
        throw new Error("Invalid workspace file.");
      S.projects = data.projects;
      S.scripts = data.scripts;
      S.settings = { ...settings(), ...(data.settings || {}) };
      save();
      applySettings();
      renderSb();
      if (S.projects[0]) selProject(S.projects[0].id);
    } catch (e) {
      alert(e.message || "Could not restore workspace.");
    }
  };
  reader.readAsText(file);
};

window.showUsageModal = () => {
  const aiImports =
    S.scripts?.filter((s) => s.notes === "Imported with Gemini.").length || 0;
  const blocks =
    S.scripts?.reduce((sum, s) => sum + (s.blocks?.length || 0), 0) || 0;
  openModal(
    `<div class="modal-title">Usage</div><div class="stat-grid"><div class="stat-card"><div class="stat-label">AI imports</div><div class="stat-val">${aiImports}</div></div><div class="stat-card"><div class="stat-label">Scripts</div><div class="stat-val">${S.scripts?.length || 0}</div></div><div class="stat-card"><div class="stat-label">Blocks</div><div class="stat-val">${blocks}</div></div></div><div class="modal-actions"><button class="btn" onclick="closeModal()">Done</button></div>`,
  );
};

window.showBillingModal = () => {
  const st = settings();
  openModal(
    `<div class="modal-title">Billing</div><div class="setting-line"><div><strong>${esc(st.plan)} plan</strong><span>Your selected plan changes the workspace label and usage context. Payment processing can be connected later.</span></div><span class="settings-chip">${esc(st.plan)}</span></div><div class="divider"></div><div class="mini-action-row"><button class="btn-ghost" onclick="exportWorkspace()">Download data</button><button class="btn-ghost" onclick="showUsageModal()">View usage</button></div><div class="modal-actions"><button class="btn" onclick="closeModal()">Done</button></div>`,
  );
};

const COLOR_LABELS = [
  "Ink",
  "Signal",
  "Mint",
  "Gold",
  "Blue",
  "Peach",
  "Violet",
  "Leaf",
  "Coral",
  "Aqua",
];

function colorPickerHtml(selected = COLORS[0]) {
  return `<div class="color-grid">${COLORS.map((c, i) => `<div class="color-dot color-orb${selected === c ? " sel" : ""}" style="background:${c};color:${c}" data-c="${c}" data-label="${COLOR_LABELS[i] || "Tone"}" onclick="selColor(this)"></div>`).join("")}</div>`;
}

window.openNewProjectModal = () => {
  openModal(
    `<div class="premium-modal-shell"><div class="premium-modal-content"><div class="modal-title">New project</div><div class="modal-subtitle">Create a colour-coded production space. The colour drives the project cards, filtered pages, and script accents.</div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="np-name" placeholder="e.g. Curate Launch" autofocus></div><div class="form-group"><label class="form-label">Colour system</label>${colorPickerHtml(COLORS[0])}</div><div class="modal-actions"><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="createProject()">Create</button></div></div></div>`,
    "premium-modal",
  );
};

window.createProject = () => {
  const name = document.getElementById("np-name").value.trim();
  if (!name) return;
  const color =
    document.querySelector(".color-dot.sel")?.dataset.c || COLORS[0];
  const p = { id: uid(), name, color };
  if (!S.projects) S.projects = [];
  S.projects.push(p);
  save();
  closeModal();
  renderSb();
  selProject(p.id);
};

window.openEditProjectModal = (id) => {
  const p = proj(id);
  openModal(
    `<div class="premium-modal-shell"><div class="premium-modal-content"><div class="modal-title">Edit project</div><div class="modal-subtitle">Tune the project identity without changing its scripts or saved progress.</div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="ep-name" value="${esc(p.name)}"></div><div class="form-group"><label class="form-label">Colour system</label>${colorPickerHtml(p.color)}</div><div class="modal-actions"><button class="btn-ghost btn-danger" onclick="deleteProject('${id}')">Delete project</button><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveProject('${id}')">Save</button></div></div></div>`,
    "premium-modal",
  );
};

window.saveProject = (id) => {
  const p = proj(id);
  p.name = document.getElementById("ep-name").value.trim() || p.name;
  p.color = document.querySelector(".color-dot.sel")?.dataset.c || p.color;
  save();
  closeModal();
  renderSb();
  showProject(id);
};

window.deleteProject = (id) => {
  if (!confirm("Delete this project and all its scripts?")) return;
  S.projects = S.projects.filter((p) => p.id !== id);
  S.scripts = S.scripts.filter((s) => s.projectId !== id);
  if (S.apid === id) {
    S.apid = null;
    S.asid = null;
  }
  save();
  closeModal();
  renderSb();
  document.getElementById("mainView").style.display = "none";
  document.getElementById("welcomeScreen").style.display = "flex";
};

window.updateNewScriptAccent = (projectId) => {
  const p = proj(projectId);
  const box = document.getElementById("modalBox");
  if (p && box) box.setAttribute("style", scriptStyleVars(p.color));
};

window.selectScriptPreset = (el) => {
  document
    .querySelectorAll(".preset-chip")
    .forEach((btn) => btn.classList.remove("sel"));
  el.classList.add("sel");
  const idea = document.getElementById("ns-idea");
  if (idea && !idea.value.trim()) idea.value = el.dataset.idea || "";
};

window.openNewScriptModal = (projId) => {
  const pid = projId || S.apid || S.projects?.[0]?.id;
  if (!S.projects || !S.projects.length) {
    openNewProjectModal();
    return;
  }
  const p = proj(pid) || S.projects[0];
  const projectOptions = (S.projects || [])
    .map(
      (project) =>
        `<option value="${project.id}"${project.id === p.id ? " selected" : ""}>${esc(project.name)}</option>`,
    )
    .join("");
  openModal(
    `<div class="script-create-shell">
    <div class="script-create-visual">
      <div class="script-create-kicker">Create script</div>
      <h2>Turn a rough idea into a shoot plan.</h2>
      <p>Only the idea is optional. Pick a project, add a quick brief if you have one, and Director will open a clean script workspace.</p>
    </div>
    <div class="script-create-panel">
      <div class="modal-title">New script</div>
      <div class="form-group"><label class="form-label">Script title</label><input class="form-input" id="ns-name" placeholder="Optional, e.g. Founder launch hook" autofocus></div>
      <div class="form-group"><label class="form-label">What is it about?</label><textarea class="notes-ta script-idea" id="ns-idea" placeholder="Optional brief, hook, angle, talking points, or anything you already know..."></textarea></div>
      <div class="form-group"><label class="form-label">Quick starts</label><div class="preset-row">
        <button type="button" class="preset-chip" data-idea="Talking head video with a sharp hook, one clear point, and a direct CTA." onclick="selectScriptPreset(this)">Talking head</button>
        <button type="button" class="preset-chip" data-idea="Product demo showing the problem, the product in action, and the payoff." onclick="selectScriptPreset(this)">Product demo</button>
        <button type="button" class="preset-chip" data-idea="Launch announcement with context, proof, benefits, and next step." onclick="selectScriptPreset(this)">Launch post</button>
        <button type="button" class="preset-chip" data-idea="Short ad with hook, problem, solution, proof, and CTA." onclick="selectScriptPreset(this)">Short ad</button>
      </div></div>
      <div class="script-create-grid">
        <div class="form-group"><label class="form-label">Project</label><select class="form-select" id="ns-proj" onchange="updateNewScriptAccent(this.value)">${projectOptions}</select></div>
        <div class="form-group"><label class="form-label">Due date</label><input class="form-input" id="ns-due" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">Status</label><div class="status-row">${STATUSES.map((s, i) => `<div class="status-chip badge badge-${s}${i === 0 ? " sel" : ""}" data-s="${s}" onclick="selStatus(this)">${s}</div>`).join("")}</div></div>
      <div class="form-group"><label class="form-label">Platforms</label><div class="plats-row script-platforms">${PLATFORMS.map((platform) => `<label><input type="checkbox" value="${platform}" checked style="accent-color:var(--script-color)"> ${platform}</label>`).join("")}</div></div>
      <div class="modal-actions"><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="createScript()">Create script</button></div>
    </div>
  </div>`,
    "script-create-modal",
  );
  updateNewScriptAccent(p.id);
};

window.createScript = () => {
  const rawName = document.getElementById("ns-name").value.trim();
  const idea = document.getElementById("ns-idea")?.value.trim() || "";
  const name =
    rawName ||
    idea
      .split(/\s+/)
      .slice(0, 7)
      .join(" ")
      .replace(/[,.!?;:]+$/, "") ||
    "Untitled script";
  const projectId = document.getElementById("ns-proj").value;
  const status =
    document.querySelector(".status-chip.sel")?.dataset.s || "draft";
  const due = document.getElementById("ns-due").value;
  const platforms = [
    ...document.querySelectorAll("#modalBox input[type=checkbox]:checked"),
  ].map((c) => c.value);
  const template = settings().template?.trim();
  const blocks = template
    ? template
        .split("\n")
        .filter(Boolean)
        .map((line) => ({
          id: uid(),
          type: "direction",
          shotName: "Template",
          desc: line.trim(),
          spoken: "",
          notes: "",
          done: false,
          cut: false,
        }))
    : [];
  if (idea)
    blocks.unshift({
      id: uid(),
      type: "direction",
      shotName: "Brief",
      desc: idea,
      spoken: "",
      notes: "",
      done: false,
      cut: false,
    });
  const s = {
    id: uid(),
    projectId,
    name,
    status,
    due,
    platforms,
    notes: idea,
    blocks,
  };
  if (!S.scripts) S.scripts = [];
  S.scripts.push(s);
  save();
  closeModal();
  renderSb();
  selScript(s.id);
};

let activeAiJob = null;
let lastImportedScriptId = null;
let generatedScriptPreview = null;

window.toggleBrainstormMode = (el) => {
  document
    .querySelectorAll(".brainstorm-chip")
    .forEach((btn) => btn.classList.remove("sel"));
  el.classList.add("sel");
};

window.openGenerateScriptModal = (projId) => {
  const pid = projId || S.apid || S.projects?.[0]?.id;
  if (!S.projects || !S.projects.length) {
    openNewProjectModal();
    return;
  }
  const p = proj(pid) || S.projects[0];
  const projectOptions = (S.projects || [])
    .map(
      (project) =>
        `<option value="${project.id}"${project.id === p.id ? " selected" : ""}>${esc(project.name)}</option>`,
    )
    .join("");
  generatedScriptPreview = null;
  openModal(
    `<div class="generate-script-shell">
    <div class="generate-script-copy">
      <div>
        <div class="script-create-kicker">Generate Script</div>
        <h2>Build the idea before you film it.</h2>
        <p>Describe the topic, choose the shape, preview the result, then save it only when it feels right.</p>
      </div>
      <div class="ai-meter" aria-hidden="true"><div class="ai-meter-line"><span></span></div><div class="ai-meter-line"><span></span></div><div class="ai-meter-line"><span></span></div></div>
    </div>
    <div class="generate-script-panel">
      <div class="modal-title">Generate a new script</div>
      <div class="script-create-grid">
        <div class="form-group"><label class="form-label">Project</label><select class="form-select" id="gs-proj">${projectOptions}</select></div>
        <div class="form-group"><label class="form-label">Length</label><select class="form-select" id="gs-length"><option value="short">Short: 15-30 sec</option><option value="medium" selected>Medium: 30-60 sec</option><option value="long">Long: 60-120 sec</option></select></div>
      </div>
      <div class="script-create-grid">
        <div class="form-group"><label class="form-label">Tone</label><select class="form-select" id="gs-tone"><option>punchy</option><option>cinematic</option><option>clean</option><option>high-energy</option><option>educational</option><option>luxury</option></select></div>
        <div class="form-group"><label class="form-label">Format</label><select class="form-select" id="gs-format"><option value="talking-head">Talking to camera</option><option value="voiceover">Voiceover with b-roll</option><option value="product-demo">Product demo</option><option value="short-ad">Short ad</option><option value="story">Story-driven</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Mode</label><div class="preset-row"><button type="button" class="preset-chip brainstorm-chip sel" data-mode="script" onclick="toggleBrainstormMode(this)">Write script</button><button type="button" class="preset-chip brainstorm-chip" data-mode="brainstorm" onclick="toggleBrainstormMode(this)">Brainstorm ideas</button></div></div>
      <div class="form-group"><label class="form-label">What should it be about?</label><textarea class="notes-ta" id="gs-brief" style="min-height:120px" placeholder="Example: a punchy TikTok about why creators should batch film content, with a strong hook and CTA to follow for more."></textarea></div>
      <div class="form-group"><label class="form-label">Platforms</label><div class="plats-row script-platforms">${PLATFORMS.map((platform) => `<label><input type="checkbox" value="${platform}" checked style="accent-color:var(--teal)"> ${platform}</label>`).join("")}</div></div>
      <div class="modal-msg" id="gs-msg"></div>
      <div class="generate-preview" id="gs-preview">
        <div class="generate-preview-head"><div><div class="generate-preview-title" id="gs-preview-title"></div><div style="font-size:11px;color:var(--text3)">Preview before saving</div></div><button class="btn-ghost" type="button" onclick="generatedScriptPreview=null;document.getElementById('gs-preview').classList.remove('open')">Clear</button></div>
        <div class="generate-preview-body" id="gs-preview-body"></div>
      </div>
      <div class="modal-actions"><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn-ghost" id="gs-generate-btn" onclick="generateScriptPreview()">Generate preview</button><button class="btn" id="gs-save-btn" onclick="saveGeneratedScript()" disabled>Save draft</button></div>
    </div>
  </div>`,
    "generate-script-modal",
  );
};

window.generateScriptPreview = async () => {
  const msg = document.getElementById("gs-msg");
  const btn = document.getElementById("gs-generate-btn");
  const brief = document.getElementById("gs-brief")?.value.trim() || "";
  if (!brief) {
    msg.textContent = "Tell Gemini what the script should be about first.";
    return;
  }
  const platforms = [
    ...document.querySelectorAll("#modalBox input[type=checkbox]:checked"),
  ].map((c) => c.value);
  const mode =
    document.querySelector(".brainstorm-chip.sel")?.dataset.mode || "script";
  btn.disabled = true;
  btn.textContent = "Generating...";
  msg.textContent = "Gemini is drafting your preview...";
  if (window.isDemoMode) {
    const data = demoGeneratedScript({
      instructions: brief,
      brainstorm: mode === "brainstorm",
    });
    generatedScriptPreview = {
      title: data.title,
      script: data.script,
      platforms,
      projectId: document.getElementById("gs-proj").value,
    };
    document.getElementById("gs-preview-title").textContent =
      generatedScriptPreview.title;
    document.getElementById("gs-preview-body").textContent =
      generatedScriptPreview.script;
    document.getElementById("gs-preview").classList.add("open");
    document.getElementById("gs-save-btn").disabled = false;
    msg.textContent = "Demo preview ready. Save it when you are happy with it.";
    btn.disabled = false;
    btn.textContent = "Generate preview";
    return;
  }
  try {
    const res = await fetch("/api/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "custom",
        instructions: brief,
        length: document.getElementById("gs-length").value,
        tone: document.getElementById("gs-tone").value,
        format: document.getElementById("gs-format").value,
        brainstorm: mode === "brainstorm",
        platforms,
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      throw new Error(
        "AI endpoint returned HTML. Check that api/generate-script.js is deployed.",
      );
    }
    if (!res.ok) throw new Error(data.error || "Could not generate script.");
    generatedScriptPreview = {
      title: data.title || "Generated script",
      script: data.script || "",
      platforms,
      projectId: document.getElementById("gs-proj").value,
    };
    document.getElementById("gs-preview-title").textContent =
      generatedScriptPreview.title;
    document.getElementById("gs-preview-body").textContent =
      generatedScriptPreview.script;
    document.getElementById("gs-preview").classList.add("open");
    document.getElementById("gs-save-btn").disabled = false;
    msg.textContent = "Preview ready. Save it when you are happy with it.";
  } catch (e) {
    msg.textContent = e.message || "Gemini could not generate this script.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate preview";
  }
};

window.saveGeneratedScript = async () => {
  const msg = document.getElementById("gs-msg");
  const btn = document.getElementById("gs-save-btn");
  if (!generatedScriptPreview?.script) {
    msg.textContent = "Generate a preview first.";
    return;
  }
  btn.disabled = true;
  btn.textContent = "Saving...";
  msg.textContent = "Sorting the preview into Director blocks...";
  if (window.isDemoMode) {
    const blocks = demoBlocksFromText(generatedScriptPreview.script).map(
      (b) => ({
        id: uid(),
        type: normalizeClientType(b.type),
        shotName: b.shotName || "",
        desc: b.desc || "",
        spoken: b.spoken || "",
        notes: "",
        done: false,
        cut: false,
      }),
    );
    const s = {
      id: uid(),
      projectId: generatedScriptPreview.projectId,
      name: generatedScriptPreview.title || "Generated script",
      status: "draft",
      due: "",
      platforms: generatedScriptPreview.platforms,
      notes: "Generated in demo mode.",
      blocks,
    };
    if (!S.scripts) S.scripts = [];
    S.scripts.push(s);
    save();
    closeModal();
    renderSb();
    selScript(s.id);
    return;
  }
  try {
    const st = settings();
    const res = await fetch("/api/sort-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawScript: generatedScriptPreview.script,
        tone: st.aiTone,
        creativity: Number(st.aiCreativity),
        autoShots: st.aiAutoShots,
        customTypes: customTypesPayload(),
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      throw new Error(
        "AI endpoint returned HTML. Check that api/sort-script.js is uploaded and Vercel redeployed.",
      );
    }
    if (!res.ok)
      throw new Error(data.error || "Could not sort generated script.");
    const blocks = (data.blocks || []).map((b) => ({
      id: uid(),
      type: normalizeClientType(b.type),
      shotName: b.shotName || "",
      desc: b.desc || "",
      spoken: b.spoken || "",
      notes: "",
      done: false,
      cut: false,
    }));
    const s = {
      id: uid(),
      projectId: generatedScriptPreview.projectId,
      name: generatedScriptPreview.title || data.title || "Generated script",
      status: "draft",
      due: "",
      platforms: generatedScriptPreview.platforms,
      notes: "Generated with Gemini.",
      blocks,
    };
    if (!S.scripts) S.scripts = [];
    S.scripts.push(s);
    save();
    closeModal();
    renderSb();
    selScript(s.id);
  } catch (e) {
    msg.textContent = e.message || "Could not save generated script.";
    btn.disabled = false;
    btn.textContent = "Save draft";
  }
};

window.selectImportProject = (el) => {
  document
    .querySelectorAll(".project-choice")
    .forEach((btn) => btn.classList.remove("sel"));
  el.classList.add("sel");
  document.getElementById("is-proj").value = el.dataset.projectId;
};

window.selectGenerateMode = (mode) => {
  const menu = document.getElementById("importGenerateMenu");
  if (!menu) return;
  menu.dataset.mode = mode;
  menu
    .querySelectorAll(".generate-option")
    .forEach((btn) => btn.classList.toggle("sel", btn.dataset.mode === mode));
  const instructions = document.getElementById("generateInstructions");
  if (instructions) {
    instructions.style.display = mode === "custom" ? "block" : "none";
    if (mode === "custom") instructions.focus();
  }
};

window.openImportGenerateMenu = (source, trigger) => {
  const menu = document.getElementById("importGenerateMenu");
  if (!menu) return;
  menu.dataset.source = source;
  menu.classList.toggle("open");
  if (!menu.classList.contains("open")) return;
  if (trigger && !window.matchMedia("(max-width: 780px)").matches) {
    const rect = trigger.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${Math.max(12, rect.bottom + 8)}px`;
    menu.style.left = `${Math.min(Math.max(12, rect.right - 340), window.innerWidth - 352)}px`;
    menu.style.right = "auto";
  } else {
    menu.removeAttribute("style");
  }
  selectGenerateMode(menu.dataset.mode || "auto");
};

window.closeImportGenerateMenu = () => {
  const menu = document.getElementById("importGenerateMenu");
  if (!menu) return;
  menu.classList.remove("open");
  menu.removeAttribute("style");
};

window.generateImportScript = async () => {
  const menu = document.getElementById("importGenerateMenu");
  const msg = document.getElementById("is-msg");
  const btn = document.getElementById("generateScriptBtn");
  const mode = menu?.dataset.mode || "auto";
  const instructions =
    document.getElementById("generateInstructions")?.value.trim() || "";
  if (mode === "custom" && !instructions) {
    msg.textContent = "Tell Gemini what you want first.";
    document.getElementById("generateInstructions")?.focus();
    return;
  }
  const currentName = document.getElementById("is-name")?.value.trim() || "";
  const currentScript = document.getElementById("is-raw")?.value.trim() || "";
  const platforms = [
    ...document.querySelectorAll(".import-panel input[type=checkbox]:checked"),
  ].map((c) => c.value);
  msg.textContent = "Gemini is generating a name and script...";
  btn.disabled = true;
  btn.textContent = "Generating...";
  if (window.isDemoMode) {
    const data = demoGeneratedScript({
      mode,
      instructions,
      currentName,
      currentScript,
      platforms,
    });
    document.getElementById("is-name").value = data.title || "";
    document.getElementById("is-raw").value = data.script || "";
    msg.textContent =
      "Demo script generated. Review it, then press Continue to sort it into blocks.";
    closeImportGenerateMenu();
    btn.disabled = false;
    btn.textContent = "Generate script";
    return;
  }
  try {
    const res = await fetch("/api/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        instructions,
        currentName,
        currentScript,
        platforms,
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      throw new Error(
        "AI endpoint returned HTML. Check that api/generate-script.js is deployed.",
      );
    }
    if (!res.ok) throw new Error(data.error || "Could not generate script.");
    document.getElementById("is-name").value = data.title || "";
    document.getElementById("is-raw").value = data.script || "";
    msg.textContent =
      "Generated. Review it, then press Continue to sort it into blocks.";
    closeImportGenerateMenu();
  } catch (e) {
    msg.textContent = e.message || "Gemini could not generate this script.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate script";
  }
};

window.openImportScriptModal = (projId) => {
  const pid = projId || S.apid || S.projects?.[0]?.id;
  if (!S.projects || !S.projects.length) {
    openNewProjectModal();
    return;
  }
  show();
  closeMobileNav();
  document.body.classList.add("import-open");
  document.getElementById("topbarTitle").textContent = "Import script";
  document.getElementById("topbarSub").innerHTML = "";
  document.getElementById("topbarRight").innerHTML = "";
  document.getElementById("tabsRow").innerHTML = "";
  document.getElementById("mainContent").innerHTML = `
    <section class="fullscreen-import">
      <div class="flow-ribbons" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="import-top-actions">
        <button class="glass-btn" onclick="closeImportPage()">Back</button>
      </div>
      <div class="import-shell">
        <div class="import-copy">
          <h1>Time for AI to take over.</h1>
          <p>Send your script. Gemini will automatically sort it into a clean, shootable Director plan with shots, transitions, subtitles, voiceover, directions, and notes you can actually follow.</p>
        </div>
        <div class="import-panel">
          <input type="hidden" id="is-proj" value="${esc(pid)}">
          <div class="ai-step">01 · Choose the project</div>
          <div class="project-choice-grid import-full">
            ${(S.projects || []).map((p) => `<button type="button" class="project-choice import-card${p.id === pid ? " sel" : ""}" data-project-id="${p.id}" onclick="selectImportProject(this)"><div class="project-choice-top"><span class="proj-dot" style="background:${p.color}"></span>${esc(p.name)}</div><small>${pscripts(p.id).length} script${pscripts(p.id).length !== 1 ? "s" : ""}</small></button>`).join("")}
          </div>
          <div class="divider"></div>
          <div class="ai-step">02 · Script identity</div>
          <div class="form-group"><label class="form-label">Script name</label><div class="generate-field"><input class="form-input" id="is-name" placeholder="${settings().smartTitles ? "Leave blank and Gemini will name it" : "Imported script"}"><button class="tiny-generate-btn" type="button" onclick="openImportGenerateMenu('name', this)">Generate</button></div></div>
          <div class="form-group"><label class="form-label">Platforms</label><div class="plats-row">${PLATFORMS.map((p) => `<label><input type="checkbox" value="${p}" checked style="accent-color:var(--teal)"> ${p}</label>`).join("")}</div></div>
          <div class="divider"></div>
          <div class="ai-step">03 · Paste the full script</div>
          <div class="script-drop-zone full generate-field"><textarea class="import-ta" id="is-raw" placeholder="Paste the messy version: bullets, captions, ideas, shot notes, voiceover, everything. Gemini will sort the structure." autofocus></textarea><button class="tiny-generate-btn" type="button" onclick="openImportGenerateMenu('script', this)">Generate</button>
            <div class="generate-menu" id="importGenerateMenu" data-mode="auto">
              <div class="generate-menu-title">Generate with Gemini</div>
              <div class="generate-menu-sub">Gemini will create a new script name and full script, then place both into this import form.</div>
              <div class="generate-options">
                <button type="button" class="generate-option sel" data-mode="auto" onclick="selectGenerateMode('auto')">Let Gemini choose</button>
                <button type="button" class="generate-option" data-mode="custom" onclick="selectGenerateMode('custom')">Tell Gemini</button>
              </div>
              <textarea id="generateInstructions" style="display:none" placeholder="Example: write a punchy TikTok script about my new productivity app, with a bold hook and CTA to join the waitlist."></textarea>
              <div class="generate-menu-actions"><button class="btn-ghost" type="button" onclick="closeImportGenerateMenu()">Cancel</button><button class="btn" id="generateScriptBtn" type="button" onclick="generateImportScript()">Generate script</button></div>
            </div>
          </div>
          <div class="modal-msg" id="is-msg"></div>
          <div class="modal-actions">
            <button class="glass-btn" onclick="closeImportPage()">Cancel</button>
            <button class="btn" id="is-btn" onclick="importScriptWithAI()">Continue</button>
          </div>
        </div>
      </div>
    </section>`;
};

window.closeImportPage = () => {
  const importEl = document.querySelector(".fullscreen-import");
  const doClose = () => {
    document.body.classList.remove("import-open");
    if (S.asid && scr(S.asid)) selScript(S.asid);
    else if (S.apid && proj(S.apid)) selProject(S.apid);
    else {
      document.getElementById("mainView").style.display = "none";
      document.getElementById("welcomeScreen").style.display = "flex";
    }
  };
  if (importEl) {
    importEl.classList.add("closing");
    setTimeout(doClose, 280);
  } else {
    doClose();
  }
};

function showAiToast(message, canOpen = false) {
  showToast(
    message,
    canOpen ? "Open" : "",
    canOpen ? "openLastImportedScript()" : "",
  );
}

window.openLastImportedScript = () => {
  document.getElementById("aiJobToast").classList.remove("show");
  if (lastImportedScriptId && scr(lastImportedScriptId))
    selScript(lastImportedScriptId);
};

window.closeAiWorking = () => {
  if (!settings().aiBackgroundImports) {
    showAiToast("Background imports are disabled in settings.");
    return;
  }
  if (activeAiJob) activeAiJob.background = true;
  closeImportPage();
  showAiToast("Gemini is sorting in the background.");
};

function renderAiWorking(job) {
  document.body.classList.add("import-open");
  document.getElementById("mainContent").innerHTML = `
    <section class="fullscreen-import" data-job-id="${job.id}">
      <div class="flow-ribbons" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="import-top-actions"><button class="glass-btn" onclick="closeAiWorking()">${settings().aiBackgroundImports ? "× Work in background" : "Background off"}</button></div>
      <div class="import-shell working-stage">
        <div>
          <div class="ai-spinner" aria-hidden="true"><div class="ai-spinner-dot"></div></div>
          <h1>Gemini is working.</h1>
          <p>Scanning the full script, detecting filming beats, and rebuilding everything into a fluent Director plan ready to shoot.</p>
          <div class="working-steps"><span>Reading pacing</span><span>Mapping shots &amp; dialogue</span><span>Building Director blocks</span></div>
        </div>
      </div>
    </section>`;
}

function renderAiComplete(job, scriptId) {
  document.getElementById("mainContent").innerHTML = `
    <section class="fullscreen-import" data-job-id="${job.id}">
      <div class="flow-ribbons" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="import-shell working-stage">
        <div>
          <div class="ai-result-icon ai-result-success" aria-hidden="true">
            <svg viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="42" stroke-width="1.5" class="result-circle" stroke-dashoffset="264"/>
              <path d="M24 45l14 14 28-28" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="result-mark"/>
            </svg>
          </div>
          <h1>Your script is ready.</h1>
          <p>Gemini sorted it into a Director-friendly plan with blocks for filming, captions, voiceover, transitions, and edit notes.</p>
          <div class="modal-actions" style="justify-content:center;margin-top:28px"><button class="glass-btn" onclick="closeImportPage()">Close</button><button class="btn" onclick="document.body.classList.remove('import-open');selScript('${scriptId}')">Open script</button></div>
        </div>
      </div>
    </section>`;
}

function renderAiError(job, message) {
  document.getElementById("mainContent").innerHTML = `
    <section class="fullscreen-import" data-job-id="${job.id}">
      <div class="flow-ribbons" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="import-shell working-stage">
        <div>
          <div class="ai-result-icon ai-result-error" aria-hidden="true">
            <svg viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="42" stroke-width="1.5" class="result-circle" stroke-dashoffset="264"/>
              <line x1="28" y1="28" x2="62" y2="62" stroke-width="3" stroke-linecap="round" class="result-mark"/>
              <line x1="62" y1="28" x2="28" y2="62" stroke-width="3" stroke-linecap="round" class="result-mark" style="animation-delay:0.52s"/>
            </svg>
          </div>
          <h1>Gemini hit a problem.</h1>
          <p>${esc(message || "Could not sort the script.")}</p>
          <div class="modal-actions" style="justify-content:center;margin-top:28px"><button class="glass-btn" onclick="closeImportPage()">Close</button><button class="btn" onclick="openImportScriptModal('${job.projectId}')">Try again</button></div>
        </div>
      </div>
    </section>`;
}

window.importScriptWithAI = async () => {
  const msg = document.getElementById("is-msg");
  const rawScript = document.getElementById("is-raw").value.trim();
  if (!rawScript) {
    msg.textContent = "Paste your full script first.";
    return;
  }
  const job = {
    id: uid(),
    projectId: document.getElementById("is-proj").value,
    name: document.getElementById("is-name").value.trim(),
    platforms: [
      ...document.querySelectorAll("#modalBox input[type=checkbox]:checked"),
    ].map((c) => c.value),
    rawScript,
    background: false,
  };
  activeAiJob = job;
  renderAiWorking(job);
  if (window.isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const name =
      job.name || demoTitleFromText(job.rawScript, "Imported demo script");
    const blocks = demoBlocksFromText(job.rawScript).map((b) => ({
      id: uid(),
      type: normalizeClientType(b.type),
      shotName: b.shotName || "",
      desc: b.desc || "",
      spoken: b.spoken || "",
      done: false,
      cut: false,
    }));
    const s = {
      id: uid(),
      projectId: job.projectId,
      name,
      status: "draft",
      due: "",
      platforms: job.platforms,
      notes: "Imported in demo mode.",
      blocks,
    };
    if (!S.scripts) S.scripts = [];
    S.scripts.push(s);
    lastImportedScriptId = s.id;
    save();
    renderSb();
    activeAiJob = null;
    renderAiComplete(job, s.id);
    return;
  }
  try {
    const st = settings();
    const res = await fetch("/api/sort-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawScript: job.rawScript,
        tone: st.aiTone,
        creativity: Number(st.aiCreativity),
        autoShots: st.aiAutoShots,
        customTypes: customTypesPayload(),
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      throw new Error(
        "AI endpoint returned HTML. Check that api/sort-script.js is uploaded and Vercel redeployed.",
      );
    }
    if (!res.ok) throw new Error(data.error || "Could not sort script.");
    const name =
      job.name ||
      (settings().smartTitles ? data.title : "") ||
      "Imported script";
    const blocks = (data.blocks || []).map((b) => ({
      id: uid(),
      type: normalizeClientType(b.type),
      shotName: b.shotName || "",
      desc: b.desc || "",
      spoken: b.spoken || "",
      done: false,
      cut: false,
    }));
    const s = {
      id: uid(),
      projectId: job.projectId,
      name,
      status: "draft",
      due: "",
      platforms: job.platforms,
      notes: "Imported with Gemini.",
      blocks,
    };
    if (!S.scripts) S.scripts = [];
    S.scripts.push(s);
    lastImportedScriptId = s.id;
    save();
    renderSb();
    if (activeAiJob?.id === job.id) activeAiJob = null;
    const modalOpen =
      document.body.classList.contains("import-open") &&
      document.querySelector(`[data-job-id="${job.id}"]`);
    if (modalOpen && !job.background) renderAiComplete(job, s.id);
    else {
      showAiToast("Gemini finished sorting your script.", true);
      notifyUser("Director import ready", `${name} is ready to open.`);
    }
  } catch (e) {
    if (activeAiJob?.id === job.id) activeAiJob = null;
    const modalOpen =
      document.body.classList.contains("import-open") &&
      document.querySelector(`[data-job-id="${job.id}"]`);
    if (modalOpen && !job.background) renderAiError(job, e.message);
    else showAiToast(e.message || "Gemini could not sort the script.");
  }
};

window.openEditScriptModal = (id) => {
  const s = scr(id);
  openModal(
    `<div class="modal-title">Edit script</div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="es-name" value="${esc(s.name)}"></div><div class="form-group"><label class="form-label">Status</label><div class="status-row">${STATUSES.map((opt) => `<div class="status-chip badge badge-${opt}${s.status === opt ? " sel" : ""}" data-s="${opt}" onclick="selStatus(this)">${opt}</div>`).join("")}</div></div><div class="form-group"><label class="form-label">Due date</label><input class="form-input" id="es-due" type="date" value="${esc(s.due || "")}"></div><div class="form-group"><label class="form-label">Platforms</label><div class="plats-row">${PLATFORMS.map((p) => `<label><input type="checkbox" value="${esc(p)}" ${(s.platforms || []).includes(p) ? "checked" : ""} style="accent-color:var(--text)"> ${esc(p)}</label>`).join("")}</div></div><div class="modal-actions"><button class="btn-ghost btn-danger" onclick="deleteScript('${id}')">Delete script</button><button class="btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveScript('${id}')">Save</button></div>`,
  );
};

window.saveScript = (id) => {
  const s = scr(id);
  s.name = document.getElementById("es-name").value.trim() || s.name;
  s.status = document.querySelector(".status-chip.sel")?.dataset.s || s.status;
  s.due = document.getElementById("es-due").value;
  s.platforms = [
    ...document.querySelectorAll("input[type=checkbox]:checked"),
  ].map((c) => c.value);
  save();
  closeModal();
  renderSb();
  showScript(id);
};

window.deleteScript = (id) => {
  const s = scr(id);
  const pid = s.projectId;
  S.scripts = S.scripts.filter((x) => x.id !== id);
  if (S.asid === id) S.asid = null;
  save();
  closeModal();
  renderSb();
  selProject(pid);
};
