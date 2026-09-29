// A bar at the top of every page for checking the seasonal themes. tools/serve.py adds it to
// the pages it serves, so it only shows in the local preview and never on the live site.
// It uses the ?theme= preview from assets/js/theme.js and reloads the page with the choice.
{
  let chosen = "auto";
  try { chosen = sessionStorage.getItem("theme") || "auto"; } catch {}
  const today = document.documentElement.dataset.theme || "none";

  const style = document.createElement("style");
  style.textContent = `
    .theme-bar { display: flex; align-items: center; gap: 6px; padding: 6px 12px; overflow-x: auto;
                 background: #07100B; border-bottom: 1px solid #2A3A30; font: 12px Monocraft, monospace; color: #9DB0A2; }
    .theme-bar span { margin-right: 6px; white-space: nowrap; }
    .theme-bar button { font: inherit; color: #E8E4D4; background: #16241B; border: 1px solid #2E4235;
                        padding: 3px 9px; cursor: pointer; white-space: nowrap; }
    .theme-bar button:hover { border-color: #6B8A74; }
    .theme-bar button[aria-pressed="true"] { color: #1B1305; background: #FFAA00; border-color: #FFAA00; }`;
  document.head.append(style);

  const bar = document.createElement("div");
  bar.className = "theme-bar";
  const label = document.createElement("span");
  label.textContent = "Theme (local only):";
  bar.append(label);

  // In the order of the year, starting with the earliest start date
  const seasons = [...SEASONS].sort((a, b) => a.from.localeCompare(b.from)).map(season => season.theme);
  for (const name of ["auto", "none", ...seasons]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name === "auto" && chosen === "auto" ? `auto: ${today}` : name;
    button.setAttribute("aria-pressed", String(name === chosen));
    button.addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.set("theme", name);
      location.href = url;
    });
    bar.append(button);
  }
  document.body.prepend(bar);
}
