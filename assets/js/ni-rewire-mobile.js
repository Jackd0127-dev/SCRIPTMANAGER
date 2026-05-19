// Handle resize — clean up mobile drawer state
window.addEventListener("resize", () => {
  if (!isMobile()) {
    closeSidebar();
    const sb = document.getElementById("sidebar");
    sb.classList.remove("mobile-open");
  }
});

// Handle swipe-to-open sidebar on mobile
let touchStartX = 0;
document.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
  },
  { passive: true },
);
document.addEventListener(
  "touchend",
  (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (isMobile() && touchStartX < 30 && dx > 60) {
      const sb = document.getElementById("sidebar");
      if (!sb.classList.contains("mobile-open")) {
        sb.classList.add("mobile-open");
        document.getElementById("sidebar-backdrop").classList.add("visible");
        document.body.style.overflow = "hidden";
      }
    }
  },
  { passive: true },
);
