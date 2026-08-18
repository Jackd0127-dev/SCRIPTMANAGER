(() => {
  const PASSWORD_HASH =
    "7c7646930be4c20afbccb78374e9b49e8ed3de0a2395c3c13289ee1b0b087906";
  const STORAGE_KEY = "scriptai-main-unlocked";
  const authScreen = document.getElementById("authScreen");
  const launcherPage = document.getElementById("launcherPage");
  const authForm = document.getElementById("authForm");
  const passwordInput = document.getElementById("sitePassword");
  const authError = document.getElementById("authError");
  const signOutButton = document.getElementById("signOutButton");

  const toHex = (buffer) =>
    [...new Uint8Array(buffer)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  const hashText = async (value) => {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toHex(digest);
  };

  const showLauncher = () => {
    document.body.classList.remove("is-locked");
    authScreen.hidden = true;
    launcherPage.hidden = false;
  };

  const showAuth = () => {
    document.body.classList.add("is-locked");
    launcherPage.hidden = true;
    authScreen.hidden = false;
    requestAnimationFrame(() => passwordInput.focus());
  };

  if (localStorage.getItem(STORAGE_KEY) === PASSWORD_HASH) {
    showLauncher();
  } else {
    showAuth();
  }

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authError.textContent = "";
    const submittedHash = await hashText(passwordInput.value);

    if (submittedHash === PASSWORD_HASH) {
      localStorage.setItem(STORAGE_KEY, PASSWORD_HASH);
      passwordInput.value = "";
      showLauncher();
      return;
    }

    authError.textContent = "That password is not right.";
    passwordInput.select();
  });

  signOutButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    showAuth();
  });
})();
