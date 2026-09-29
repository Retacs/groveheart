// Seasonal themes. Loaded in <head> so the theme is set before the page is drawn.
//
// A theme is active from `from` to `to` (month-day, both days included). A range may run over
// the new year, e.g. "12-01" to "01-06". The first matching entry wins, so special events go
// above the seasons. `base` layers an event on top of a season: Halloween keeps the autumn look
// and adds its own extras. The styles live in assets/css/themes.css under [data-theme~="<name>"].
//
// Preview: add ?theme=halloween (or any other name) to a URL. The choice is kept while you
// browse the site in that tab; ?theme=none switches themes off, ?theme=auto goes back to the
// calendar.
const SEASONS = [
  { theme: "halloween", base: "autumn", from: "10-24", to: "11-07" },
  { theme: "autumn", from: "09-22", to: "11-14" },
  // Winter starts on 15 November
];

{
  let preview = new URLSearchParams(location.search).get("theme");
  try {
    if (preview === "auto") sessionStorage.removeItem("theme");
    else if (preview) sessionStorage.setItem("theme", preview);
    else preview = sessionStorage.getItem("theme");
  } catch {}

  const now = new Date();
  const day = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const active = ({ from, to }) => from <= to ? day >= from && day <= to : day >= from || day <= to;

  const season = preview === "none" ? null
    : SEASONS.find(entry => entry.theme === preview) || SEASONS.find(active);
  if (season) document.documentElement.dataset.theme = [season.base, season.theme].filter(Boolean).join(" ");
}

// Autumn: a few falling pixel leaves and pumpkins along the bottom edge of every page header
document.addEventListener("DOMContentLoaded", () => {
  const themes = (document.documentElement.dataset.theme || "").split(" ");
  if (!themes.includes("autumn")) return;

  const LEAF = [".##..", "####.", "#####", ".####", "..##.", "...#."];
  const COLOURS = ["#E0822F", "#C9502C", "#E9B23D", "#A8612A"];
  const leafSvg = colour => {
    let rects = "";
    LEAF.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell === "#") rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }));
    return `<svg viewBox="0 0 5 6" shape-rendering="crispEdges" fill="${colour}">${rects}</svg>`;
  };

  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  for (const header of document.querySelectorAll(".hero, .page-hero")) {
    const falling = document.createElement("div");
    falling.className = "falling";
    falling.setAttribute("aria-hidden", "true");
    const count = innerWidth < 600 ? 4 : 8;
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement("span");
      leaf.style.left = `${Math.round(4 + random() * 92)}%`;
      leaf.style.setProperty("--dur", `${(14 + random() * 10).toFixed(1)}s`);
      leaf.style.setProperty("--delay", `${(-random() * 24).toFixed(1)}s`);
      leaf.innerHTML = leafSvg(COLOURS[i % COLOURS.length]);
      falling.append(leaf);
    }
    header.prepend(falling);

    const pumpkins = document.createElement("div");
    pumpkins.className = "pumpkins";
    pumpkins.setAttribute("aria-hidden", "true");
    // They drop in one after another when the page opens, then the middle one lights up
    pumpkins.innerHTML = `
      <img src="assets/blocks/carved_pumpkin.png" alt="" style="left:7%;--i:0">
      <span class="lantern" style="right:calc(7% + 52px);--i:1">
        <img src="assets/blocks/carved_pumpkin.png" alt=""><img class="lit" src="assets/blocks/jack_o_lantern.png" alt="">
      </span>
      <img src="assets/blocks/carved_pumpkin.png" alt="" style="right:7%;--i:2">`;
    header.append(pumpkins);

    // Start the animation once the pumpkins are on screen, so it is not over before anyone sees it
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          pumpkins.classList.add("go");
          observer.disconnect();
        }
      });
      observer.observe(pumpkins);
    } else {
      pumpkins.classList.add("go");
    }
  }

  if (themes.includes("halloween")) addHalloween();
});

// Halloween: a full moon, cobwebs in the corners, a drifting ghast and a few bats
function addHalloween() {
  // Two frames of a small pixel bat, wings up and wings down
  const BAT = [
    ["#.......#", "##.#.#.##", ".#######.", "...###..."],
    ["...#.#...", ".#######.", "##.###.##", "#.......#"],
  ];
  const batFrame = (rows, className) => {
    let rects = "";
    rows.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell === "#") rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }));
    return `<svg class="${className}" viewBox="0 0 9 4" shape-rendering="crispEdges">${rects}</svg>`;
  };
  // The ghast's tentacles hang at different lengths (in ghast pixels)
  const TENTACLES = [9, 12, 8, 11, 10];

  for (const header of document.querySelectorAll(".hero, .page-hero")) {
    const night = document.createElement("div");
    night.className = "night";
    night.setAttribute("aria-hidden", "true");
    night.innerHTML = `
      <img class="moon" src="assets/items/moon.png" alt="">
      <img class="cobweb" src="assets/blocks/cobweb.png" alt="">
      <img class="cobweb right" src="assets/blocks/cobweb.png" alt="">
      <div class="ghast"><div class="ghast-body">
        <img src="assets/items/ghast.png" alt="">
        <div class="tentacles">${TENTACLES.map((length, i) => `<i style="--len:${length};--i:${i}"></i>`).join("")}</div>
      </div></div>
      <div class="bat" style="--top:22%;--delay:-3s">${batFrame(BAT[0], "up")}${batFrame(BAT[1], "down")}</div>
      <div class="bat" style="--top:34%;--delay:-14s">${batFrame(BAT[0], "up")}${batFrame(BAT[1], "down")}</div>`;
    header.prepend(night);
  }
}
