import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
  OAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteField,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCaq7I65QuHhhrK3QfoaR5dbJ_M98kA6U4",

  authDomain: "social-media-script.firebaseapp.com",

  projectId: "social-media-script",

  storageBucket: "social-media-script.firebasestorage.app",

  messagingSenderId: "410934655457",

  appId: "1:410934655457:web:a5da63291a623ddf563aa0",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

let currentUser = null;

let saveTimeout = null;

let unsubscribe = null;

let redirectChecked = false;

function renderLoadedWorkspace() {
  if (!window.renderSb) {
    setTimeout(renderLoadedWorkspace, 50);

    return;
  }

  window.renderSb();

  // Report against the requested ID before a fallback selection rewrites the URL.
  window.reportNovasFlowScriptStatus?.();

  if (!window.selProject || !window.selScript) {
    setTimeout(renderLoadedWorkspace, 50);

    return;
  }

  const requestedScriptId = window.getRequestedScriptId?.();

  if (
    requestedScriptId &&
    window.S.scripts.some((script) => script.id === requestedScriptId)
  ) {
    window.selScript(requestedScriptId);
  } else if (
    window.S.asid &&
    window.S.scripts.some((s) => s.id === window.S.asid)
  ) {
    window.selScript(window.S.asid);
  } else if (
    window.S.apid &&
    window.S.projects.some((p) => p.id === window.S.apid)
  ) {
    window.selProject(window.S.apid);
  } else {
    const preferredProject =
      window.S.settings?.defaultProject &&
      window.S.projects.find((p) => p.id === window.S.settings.defaultProject);

    if (preferredProject) window.selProject(preferredProject.id);
    else if (window.S.scripts.length > 0)
      window.selScript(window.S.scripts[0].id);
    else if (window.S.projects.length > 0)
      window.selProject(window.S.projects[0].id);
    else {
      document.getElementById("mainView").style.display = "none";
      document.getElementById("welcomeScreen").style.display = "flex";
    }
  }

  window.beginNovasFlowConnection?.();
}

function sidebarEsc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}

function renderSidebarFallback() {
  const el = document.getElementById("sidebarBody");

  if (!el || !window.S) return;

  const projects = Array.isArray(window.S.projects) ? window.S.projects : [];

  const scripts = Array.isArray(window.S.scripts) ? window.S.scripts : [];

  const statusColors = {
    draft: "#c18a36",
    ready: "#4f9470",
    shot: "#d36752",
    posted: "#806bab",
  };

  if (!projects.length) {
    el.innerHTML = `<div style="padding:20px 16px;font-size:12px;color:var(--text3)">No projects yet.</div>`;

    return;
  }

  el.innerHTML = projects
    .map((project) => {
      const projectScripts = scripts.filter(
        (script) => script.projectId === project.id,
      );

      const color = project.color || "#050505";

      const active =
        window.S.apid === project.id && !window.S.asid ? " active" : "";

      return `<div class="nav-project${active}" style="--project-color:${color};--project-soft:color-mix(in srgb, ${color} 12%, transparent);--project-border:color-mix(in srgb, ${color} 34%, transparent);--project-shadow:color-mix(in srgb, ${color} 16%, transparent)" onclick="window.selProject&&selProject('${sidebarEsc(project.id)}')"><button class="project-toggle" type="button" aria-label="Toggle scripts"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="proj-dot" style="background:${color};color:${color}"></div><div class="proj-name">${sidebarEsc(project.name || "Untitled project")}</div><div class="proj-count">${projectScripts.length}</div></div><div class="project-scripts">${projectScripts.map((script) => `<div class="nav-script${window.S.asid === script.id ? " active" : ""}" onclick="window.selScript&&selScript('${sidebarEsc(script.id)}')"><div class="script-pip" style="background:${statusColors[script.status] || "#ccc"};color:${statusColors[script.status] || "#ccc"}"></div><div class="script-nav-name">${sidebarEsc(script.name || "Untitled script")}</div></div>`).join("")}</div>`;
    })
    .join("");
}

function hydrateWorkspaceData(data, previous = window.S || {}) {
  window.S = { ...data };

  window.S.projects = Array.isArray(data.projects) ? data.projects : [];

  window.S.scripts = Array.isArray(data.scripts) ? data.scripts : [];

  window.S.view = data.view || previous.view || "full";

  window.S.settings = {
    ...(window.DEFAULT_SETTINGS || {}),
    ...(previous.settings || {}),
    ...(data.settings || {}),
  };

  const hasProject = (id) => !!id && window.S.projects.some((p) => p.id === id);

  const hasScript = (id) => !!id && window.S.scripts.some((s) => s.id === id);

  window.S.asid = hasScript(data.asid)
    ? data.asid
    : hasScript(previous.asid)
      ? previous.asid
      : null;

  window.S.apid = hasProject(data.apid)
    ? data.apid
    : hasProject(previous.apid)
      ? previous.apid
      : null;

  if (window.S.asid && !window.S.apid)
    window.S.apid =
      window.S.scripts.find((s) => s.id === window.S.asid)?.projectId || null;

  renderSidebarFallback();
}

function showScreen(name) {
  document.getElementById("loadingScreen").style.display =
    name === "loading" ? "flex" : "none";

  document.getElementById("loginScreen").style.display =
    name === "login" ? "flex" : "none";

  document.getElementById("verifyScreen").style.display =
    name === "verify" ? "flex" : "none";

  document.getElementById("appScreen").style.display =
    name === "app" ? "block" : "none";
}

window.showScreen = showScreen;

function friendlyError(code, message = "") {
  const map = {
    "auth/invalid-email": "Invalid email address.",

    "auth/user-not-found": "No account found with that email.",

    "auth/wrong-password": "Incorrect password.",

    "auth/email-already-in-use": "An account with this email already exists.",

    "auth/weak-password": "Password must be at least 6 characters.",

    "auth/invalid-credential": "Email or password is incorrect.",

    "auth/too-many-requests": "Too many attempts. Please try again later.",

    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different sign-in method.",

    "auth/operation-not-allowed":
      "This sign-in provider is not enabled in Firebase.",

    "auth/unauthorized-domain":
      "This domain is not authorized in Firebase Authentication.",

    "auth/popup-blocked":
      "The sign-in popup was blocked. Allow popups for this site and try again.",

    "auth/popup-closed-by-user":
      "The sign-in popup was closed before finishing.",

    "auth/network-request-failed":
      "Network request failed. Check the domain and try again.",

    "auth/internal-error":
      "Firebase returned an internal auth error. Check this provider setup in Firebase.",

    "auth/cancelled-popup-request":
      "Another sign-in popup was already open. Close it and try again.",
  };

  return (
    map[code] ||
    `Something went wrong${code ? ` (${code})` : ""}${message ? `: ${message}` : ""}`
  );
}

async function startProviderSignIn(provider) {
  const err = document.getElementById("loginErr");

  if (err) err.textContent = "";

  showScreen("loading");

  try {
    const cred = await signInWithPopup(auth, provider);

    await loadUser(cred.user);
  } catch (e) {
    console.error("Provider sign-in error:", e);

    if (err) err.textContent = friendlyError(e.code, e.message);

    showScreen("login");
  }
}

window.doGoogle = () => startProviderSignIn(new GoogleAuthProvider());

window.doGitHub = () => startProviderSignIn(new GithubAuthProvider());

window.doApple = () => {
  const provider = new OAuthProvider("apple.com");

  provider.addScope("email");

  provider.addScope("name");

  startProviderSignIn(provider);
};

async function loadUser(user) {
  currentUser = user;

  const needsVerify =
    user.providerData.length === 1 &&
    user.providerData[0].providerId === "password" &&
    !user.emailVerified;

  if (needsVerify) {
    document.getElementById("verifyEmailDisplay").textContent = user.email;

    showScreen("verify");

    return;
  }

  const userRef = doc(db, "users", user.uid);

  try {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email || "",

        displayName: user.displayName || "",

        projects: [],

        scripts: [],

        view: "full",

        settings: window.DEFAULT_SETTINGS || {},

        createdAt: new Date().toISOString(),
      });
    } else {
      hydrateWorkspaceData(userSnap.data(), window.S || {});
    }
  } catch (e) {
    console.error("Could not create/load user document:", e);

    document.getElementById("loginErr").textContent =
      e.code === "permission-denied"
        ? "Signed in, but Firestore blocked saving your profile. Check Firestore rules for users/{uid}."
        : "Signed in, but could not save your profile. Try again.";

    showScreen("login");

    return;
  }

  document.getElementById("userEmail").textContent =
    user.email || user.displayName || "User";

  document.getElementById("userAvatar").textContent = (user.email ||
    user.displayName ||
    "U")[0].toUpperCase();

  window.currentProfile = {
    email: user.email || "",
    displayName: user.displayName || "",
    provider: user.providerData?.[0]?.providerId || "password",
  };

  showScreen("app");

  applySettings();

  renderLoadedWorkspace();

  if (unsubscribe) {
    unsubscribe();

    unsubscribe = null;
  }

  unsubscribe = onSnapshot(
    userRef,
    (snap) => {
      const keepSettingsOpen = window.S?.view === "settings";
      hydrateWorkspaceData(snap.exists() ? snap.data() : {}, window.S || {});

      applySettings();

      if (keepSettingsOpen && window.openSettingsPage) {
        window.S.view = "settings";
        window.openSettingsPage();
      } else {
        renderLoadedWorkspace();
      }
    },
    (error) => {
      console.error("Workspace listener error:", error);

      const sb = document.getElementById("sidebarBody");

      if (sb)
        sb.innerHTML = `<div style="padding:20px 16px;font-size:12px;color:var(--red)">Could not load workspace. Refresh and try again.</div>`;
    },
  );
}

onAuthStateChanged(auth, async (user) => {
  if (window.isDemoMode) return;

  if (!user) {
    currentUser = null;

    if (unsubscribe) {
      unsubscribe();

      unsubscribe = null;
    }

    if (!redirectChecked) {
      showScreen("loading");

      return;
    }

    showScreen("login");

    return;
  }

  await loadUser(user);
});

async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);

    redirectChecked = true;

    if (result?.user) {
      await loadUser(result.user);

      return;
    }

    if (!auth.currentUser && !currentUser) showScreen("login");
  } catch (e) {
    redirectChecked = true;

    console.error("Redirect error:", e);

    document.getElementById("loginErr") &&
      (document.getElementById("loginErr").textContent = friendlyError(
        e.code,
        e.message,
      ));

    showScreen("login");
  }
}

handleRedirectResult();

window.doLogin = async () => {
  const email = document.getElementById("loginEmail").value.trim();

  const pass = document.getElementById("loginPassword").value;

  const err = document.getElementById("loginErr");

  const btn = document.getElementById("loginBtn");

  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    err.textContent = friendlyError(e.code, e.message);
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
};

window.doSignup = async () => {
  const email = document.getElementById("signupEmail").value.trim();

  const pass = document.getElementById("signupPassword").value;

  const err = document.getElementById("signupErr");

  const btn = document.getElementById("signupBtn");

  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Creating account…";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    await sendEmailVerification(cred.user);
  } catch (e) {
    err.textContent = friendlyError(e.code, e.message);
    btn.disabled = false;
    btn.textContent = "Create account";
  }
};

window.doSignout = async () => {
  window.setMobileActions?.([]);
  document.body.classList.remove(
    "has-mobile-actions",
    "modal-open",
    "sidebar-open",
    "import-open",
  );

  if (window.isDemoMode) {
    window.isDemoMode = false;
    currentUser = null;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    const signout = document.querySelector(".signout-btn");
    if (signout) signout.textContent = "Sign out";
    showScreen("login");
    return;
  }

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  await signOut(auth);
};

window.getDirectorIdToken = async () => {
  if (window.isDemoMode || !currentUser) return null;
  return currentUser.getIdToken();
};

window.checkVerification = async () => {
  const btn = document.getElementById("checkVerifyBtn");

  const status = document.getElementById("verifyStatus");

  btn.disabled = true;
  btn.textContent = "Checking…";

  status.style.display = "block";
  status.className = "verify-status checking";
  status.textContent = "Checking…";

  try {
    await reload(auth.currentUser);

    if (auth.currentUser.emailVerified) {
      status.className = "verify-status success";
      status.textContent = "Verified! Loading…";
    } else {
      status.style.display = "none";

      document.getElementById("verifyErr").textContent =
        "Not verified yet. Check your inbox and click the link first.";

      btn.disabled = false;
      btn.textContent = "I've verified my email";
    }
  } catch (e) {
    status.style.display = "none";

    document.getElementById("verifyErr").textContent =
      "Something went wrong. Try again.";

    btn.disabled = false;
    btn.textContent = "I've verified my email";
  }
};

window.resendVerification = async () => {
  try {
    await sendEmailVerification(auth.currentUser);

    const status = document.getElementById("verifyStatus");

    status.style.display = "block";
    status.className = "verify-status success";
    status.textContent = "Resent — check your inbox.";
  } catch (e) {
    document.getElementById("verifyErr").textContent =
      "Could not resend. Try again in a minute.";
  }
};

window.switchAuthTab = (tab) => {
  document
    .getElementById("tabLogin")
    .classList.toggle("active", tab === "login");

  document
    .getElementById("tabSignup")
    .classList.toggle("active", tab === "signup");

  document.getElementById("loginForm").style.display =
    tab === "login" ? "block" : "none";

  document.getElementById("signupForm").style.display =
    tab === "signup" ? "block" : "none";
};

function stateForSave() {
  const data = { ...window.S };

  data.projects = Array.isArray(window.S.projects) ? window.S.projects : [];

  data.scripts = Array.isArray(window.S.scripts) ? window.S.scripts : [];

  const validScript = data.asid && data.scripts.find((s) => s.id === data.asid);

  const validProject =
    data.apid && data.projects.find((p) => p.id === data.apid);

  const scriptProject =
    validScript && data.projects.find((p) => p.id === validScript.projectId);

  data.asid = validScript ? validScript.id : deleteField();

  data.apid = validProject
    ? validProject.id
    : scriptProject
      ? scriptProject.id
      : deleteField();

  return data;
}

function demoStateForSave() {
  return {
    demoVersion: 2,
    projects: window.S.projects || [],
    scripts: window.S.scripts || [],
    settings: window.S.settings || {},
    apid: window.S.apid || null,
    asid: window.S.asid || null,
    view: window.S.view || "full",
  };
}

window.saveNow = async () => {
  const ind = document.getElementById("savingIndicator");
  clearTimeout(saveTimeout);
  ind.classList.remove("error", "unsaved");
  ind.classList.add("show");
  ind.textContent = "Saving…";
  try {
    if (window.isDemoMode) {
      localStorage.setItem(
        "directorDemoWorkspace",
        JSON.stringify(demoStateForSave()),
      );
    } else {
      if (!currentUser) return false;
      await setDoc(doc(db, "users", currentUser.uid), stateForSave(), {
        merge: true,
      });
    }
  } catch (e) {
    console.error("Workspace save failed.");
    ind.textContent = "Save failed";
    ind.classList.add("error");
    window.showToast?.(
      "ScriptAI could not save. Check your connection and try again.",
    );
    setTimeout(() => {
      ind.classList.remove("show", "error");
      ind.textContent = "Saving…";
    }, 2400);
    return false;
  }
  ind.textContent = "Saved";
  ind.classList.remove("show");
  setTimeout(() => {
    ind.textContent = "Saving…";
  }, 400);
  return true;
};

window.save = () => {
  const ind = document.getElementById("savingIndicator");
  if (window.S?.settings?.autosave === false) {
    clearTimeout(saveTimeout);
    ind.textContent = "Save changes";
    ind.classList.remove("error");
    ind.classList.add("show", "unsaved");
    return;
  }
  if (!window.isDemoMode && !currentUser) return;
  ind.classList.remove("error", "unsaved");
  ind.classList.add("show");
  ind.textContent = "Saving…";
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(
    () => {
      void window.saveNow();
    },
    window.isDemoMode ? 220 : 800,
  );
};
