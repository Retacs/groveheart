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
  { theme: "christmas", base: "winter", from: "12-18", to: "12-27" },
  { theme: "newyear", base: "winter", from: "12-28", to: "01-07" },
  { theme: "autumn", from: "09-22", to: "11-14" },
  { theme: "winter", from: "11-15", to: "03-19" },
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

// Decorations for the active themes: the page headers get the most, the book pages, the
// invitation letter, the footer and the small section titles a few touches of their own
document.addEventListener("DOMContentLoaded", () => {
  const themes = (document.documentElement.dataset.theme || "").split(" ");
  const headers = [...document.querySelectorAll(".hero, .page-hero")];
  if (themes.includes("autumn")) addAutumn(headers);
  if (themes.includes("halloween")) addHalloween(headers);
  if (themes.includes("winter")) addWinter(headers);
  if (themes.includes("christmas")) addChristmas(headers);
  if (themes.includes("newyear")) addNewYear(headers);
});

let themeSeed = 7;
const themeRandom = () => (themeSeed = (themeSeed * 16807) % 2147483647) / 2147483647;
const small = () => innerWidth < 600;

// Pixel art as inline SVG. `colours` maps each character to a colour ("#" if it is a string).
// With a `scale`, the sprite gets a fixed size of that many screen pixels per pixel.
function pixelSprite(rows, colours, className = "", scale = 0) {
  const palette = typeof colours === "string" ? { "#": colours } : colours;
  const size = scale ? ` width="${rows[0].length * scale}" height="${rows.length * scale}"` : "";
  let rects = "";
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (palette[cell]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[cell]}"/>`;
  }));
  return `<svg class="${className}" viewBox="0 0 ${rows[0].length} ${rows.length}"${size} shape-rendering="crispEdges">${rects}</svg>`;
}

// Things drifting down through a header, behind its content
function addFalling(header, kind, sprites, count, [minDur, maxDur]) {
  const falling = document.createElement("div");
  falling.className = `falling ${kind}`;
  falling.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    const dur = minDur + themeRandom() * (maxDur - minDur);
    piece.style.left = `${Math.round(2 + themeRandom() * 96)}%`;
    piece.style.setProperty("--dur", `${dur.toFixed(1)}s`);
    piece.style.setProperty("--delay", `${(-themeRandom() * dur).toFixed(1)}s`);
    piece.innerHTML = sprites[i % sprites.length];
    falling.append(piece);
  }
  header.prepend(falling);
}

// Props along the bottom edge of a header. They drop in once the edge is on screen,
// so the animation is not over before anyone sees it.
function addGround(header, className, html) {
  const ground = document.createElement("div");
  ground.className = `ground ${className}`;
  ground.setAttribute("aria-hidden", "true");
  ground.innerHTML = html;
  header.append(ground);
  if (!("IntersectionObserver" in window)) return ground.classList.add("go");
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      ground.classList.add("go");
      observer.disconnect();
    }
  });
  observer.observe(ground);
}

// A decoration inside every element matching `selector`, e.g. on each book page.
// `html` can be a function, so every copy can be a little different.
function decorate(selector, className, html) {
  for (const target of document.querySelectorAll(selector)) {
    const deco = document.createElement("div");
    deco.className = `deco ${className}`;
    deco.setAttribute("aria-hidden", "true");
    deco.innerHTML = typeof html === "function" ? html() : html;
    target.append(deco);
  }
}

// A small sprite on both sides of each section title. An event replaces the season's.
function addOrnaments(rows, colours) {
  const sprite = pixelSprite(rows, colours, "", 2);
  for (const kicker of document.querySelectorAll(".kicker")) {
    kicker.querySelectorAll(".ornament").forEach(old => old.remove());
    kicker.insertAdjacentHTML("afterbegin", `<span class="ornament" aria-hidden="true">${sprite}</span>`);
    kicker.insertAdjacentHTML("beforeend", `<span class="ornament" aria-hidden="true">${sprite}</span>`);
  }
}

const LEAF = [".##..", "####.", "#####", ".####", "..##.", "...#."];
const LEAF_COLOURS = ["#E0822F", "#C9502C", "#E9B23D", "#A8612A"];

// Autumn: falling leaves and pumpkins; the middle pumpkin lights up after they land.
// Further down, leaves have settled on the book pages and along the footer.
function addAutumn(headers) {
  const leaves = LEAF_COLOURS.map(colour => pixelSprite(LEAF, colour));
  for (const header of headers) {
    addFalling(header, "leaves", leaves, small() ? 4 : 8, [14, 24]);
    addGround(header, "pumpkins", `
      <img src="assets/blocks/carved_pumpkin.png" alt="" style="left:7%;--i:0">
      <span class="lantern" style="right:calc(7% + 52px);--i:1">
        <img src="assets/blocks/carved_pumpkin.png" alt=""><img class="lit" src="assets/blocks/jack_o_lantern.png" alt="">
      </span>
      <img src="assets/blocks/carved_pumpkin.png" alt="" style="right:7%;--i:2">`);
  }

  const lying = (left, top, turn, colour) =>
    `<span style="left:${left};top:${top}px;transform:rotate(${turn}deg)">${pixelSprite(LEAF, colour)}</span>`;
  decorate(".book", "fallen-leaves", lying("-30px", -36, -70, LEAF_COLOURS[1]) + lying("-8px", -40, 20, LEAF_COLOURS[2]));
  decorate("footer", "fallen-leaves", () => {
    let html = "";
    for (let i = 0, count = small() ? 5 : 10; i < count; i++) {
      const left = `${(1 + themeRandom() * 97).toFixed(1)}%`;
      html += lying(left, Math.round(-10 + themeRandom() * 8), Math.round(themeRandom() * 360), LEAF_COLOURS[i % 4]);
    }
    return html;
  });
  addOrnaments(LEAF, "#E9953A");
}

// Halloween: a full moon, cobwebs in the corners, a drifting ghast and a few bats
function addHalloween(headers) {
  const BAT_UP = ["#.......#", "##.#.#.##", ".#######.", "...###..."];
  const BAT_DOWN = ["...#.#...", ".#######.", "##.###.##", "#.......#"];
  const bat = pixelSprite(BAT_UP, "#150E1A", "up") + pixelSprite(BAT_DOWN, "#150E1A", "down");
  // The ghast's tentacles hang at different lengths (in ghast pixels)
  const TENTACLES = [9, 12, 8, 11, 10];
  for (const header of headers) {
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
      <div class="bat" style="--top:22%;--delay:-3s">${bat}</div>
      <div class="bat" style="--top:34%;--delay:-14s">${bat}</div>`;
    header.prepend(night);
  }

  // A cobweb in the corner of each book page, with a spider hanging from it
  const SPIDER = [
    "#.........#",
    ".#..###..#.",
    "#.#######.#",
    ".##R###R##.",
    "#.#######.#",
    ".#..###..#.",
    "#.........#",
  ];
  decorate(".book", "web", `
    <img src="assets/blocks/cobweb.png" alt="">
    <span class="spider">${pixelSprite(SPIDER, { "#": "#1C1A1E", R: "#D8342C" }, "", 3)}</span>`);
  addOrnaments([".....G.", "..OOGO.", ".OOOOOO", "OODOODO", "OOOOOOO", "ODDDDDO", ".OOOOO."],
    { G: "#5E7C2A", O: "#E07A24", D: "#3A1C08" });
}

// Winter: falling snow, a snow layer along the edge and a snow golem keeping watch
function addWinter(headers) {
  const flakes = [pixelSprite(["#"], "#F4F8FF"), pixelSprite([".#.", "###", ".#."], "#F4F8FF")];
  for (const header of headers) {
    addFalling(header, "snow", flakes, small() ? 10 : 22, [9, 16]);
    const layer = document.createElement("div");
    layer.className = "snow-layer";
    layer.setAttribute("aria-hidden", "true");
    header.append(layer);
    addGround(header, "golems", `
      <div class="snow-golem" style="right:7%;--i:0">
        <span class="lower"></span><span class="upper"></span>
        <i class="arm left"></i><i class="arm right"></i>
        <img class="head" src="assets/blocks/carved_pumpkin.png" alt="">
      </div>`);
  }

  // Snow on top of the book pages and along the footer. Its surface goes up and down in
  // 2px steps (at most `depth`) and slopes down at both ends.
  const drift = (columns, depth) => () => {
    let top = depth;
    const points = ["0% 100%"];
    for (let i = 0; i < columns; i++) {
      top = Math.max(0, Math.min(depth, top + (Math.floor(themeRandom() * 3) - 1) * 2));
      if (i < 3 || i > columns - 4) top = Math.max(top, depth - Math.min(i, columns - 1 - i) * 2);
      points.push(`${(i * 100 / columns).toFixed(2)}% ${top}px`, `${((i + 1) * 100 / columns).toFixed(2)}% ${top}px`);
    }
    points.push("100% 100%");
    return `<i style="clip-path:polygon(${points.join(",")})"></i>`;
  };
  decorate(".book", "snowcap", drift(36, 6));
  decorate("footer", "snow-layer", drift(small() ? 36 : 120, 6));
  addOrnaments(["...#...", ".#.#.#.", "..###..", "#######", "..###..", ".#.#.#.", "...#..."], "#BFDDF7");
}

// Christmas: fairy lights, the Christmas chest, decorated spruces and a Santa hat for the King
function addChristmas(headers) {
  for (const header of headers) {
    const lights = document.createElement("div");
    lights.className = "lights";
    lights.setAttribute("aria-hidden", "true");
    header.append(lights);
    addGround(header, "presents", `<img src="assets/items/christmas_chest.png" alt="" style="left:7%;--i:0">`);
  }

  const STAR = ["...#...", "..###..", "#######", ".#####.", "..###..", ".##.##.", ".#...#."];
  const BAUBLES = ["#E0514A", "#F0C040", "#58B6E0", "#F4F8FF"];
  for (const tree of document.querySelectorAll(".spruce")) {
    const star = document.createElement("span");
    star.className = "tree-star";
    star.innerHTML = pixelSprite(STAR, "#F4C542");
    tree.prepend(star);
    tree.querySelectorAll("i:not(.log)").forEach((row, index) => {
      if (index === 0) return;
      const bauble = document.createElement("b");
      bauble.className = "bauble";
      bauble.style.left = `${Math.round(15 + themeRandom() * 70)}%`;
      bauble.style.top = `${Math.round(35 + themeRandom() * 35)}%`;
      bauble.style.setProperty("--c", BAUBLES[index % BAUBLES.length]);
      row.append(bauble);
    });
  }

  const head = document.querySelector(".grove .head");
  if (head) {
    const HAT = [
      ".........WW.",
      ".......RRWW.",
      "......RRRR..",
      ".....RRRRR..",
      "....RRRRRR..",
      "...RRRRRRR..",
      "..RRRRRRRRR.",
      "WWWWWWWWWWWW",
      "WWWWWWWWWWWW",
    ];
    const wrap = document.createElement("span");
    wrap.className = "hat-wrap";
    head.replaceWith(wrap);
    wrap.append(head);
    wrap.insertAdjacentHTML("beforeend", pixelSprite(HAT, { R: "#C8322D", W: "#F4F4F0" }, "santa-hat"));
  }

  // Holly on the book pages and next to the seal of the invitation
  const HOLLY = [
    "......RR.RR.....",
    ".....RWRRWRR....",
    "..D.DRRRRRRKD.D.",
    ".DGGGGKRWRKGGGD.",
    "DLLLLLLRRRLLLLLD",
    ".DGGGGGGKGGGGGD.",
    "..D.D.D...D.D.D.",
  ];
  const HOLLY_COLOURS = { G: "#2E7D3A", D: "#1D5A28", L: "#5FAE55", R: "#D8322C", W: "#FF9A8A", K: "#8E1B18" };
  decorate(".book, .envelope", "holly", pixelSprite(HOLLY, HOLLY_COLOURS, "", 4));
  addOrnaments(HOLLY, HOLLY_COLOURS);
}

// New Year: soft pixel fireworks bursting over the header
function addNewYear(headers) {
  const COLOURS = ["#F0C040", "#E0514A", "#58B6E0", "#7ACB5B", "#C15DD1"];
  const sparks = colour => {
    let rects = `<rect x="48" y="48" width="4" height="4" fill="${colour}"/>`;
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      for (const [radius, size] of [[24, 4], [40, 3]]) {
        const x = Math.round(50 + Math.cos(angle) * radius - size / 2);
        const y = Math.round(50 + Math.sin(angle) * radius - size / 2);
        rects += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${colour}"/>`;
      }
    }
    return `<svg viewBox="0 0 100 100" shape-rendering="crispEdges">${rects}</svg>`;
  };
  for (const header of headers) {
    const sky = document.createElement("div");
    sky.className = "fireworks";
    sky.setAttribute("aria-hidden", "true");
    const count = small() ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const burst = document.createElement("span");
      burst.style.left = `${Math.round(8 + themeRandom() * 84)}%`;
      burst.style.top = `${Math.round(12 + themeRandom() * 38)}%`;
      burst.style.setProperty("--delay", `${(i * 1.4 + themeRandom()).toFixed(1)}s`);
      burst.style.setProperty("--c", COLOURS[i % COLOURS.length]);
      burst.innerHTML = sparks(COLOURS[i % COLOURS.length]);
      sky.append(burst);
    }
    header.prepend(sky);
  }

  // A firework rocket ready on each book page
  decorate(".book", "rocket", `<img src="assets/items/firework_rocket.png" alt="">`);
  addOrnaments(["...#...", "...#...", "..###..", "#######", "..###..", "...#...", "...#..."], "#F0C040");
}
