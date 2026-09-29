// Seasonal themes. Loaded in <head> so the theme is set before the page is drawn.
//
// A theme is active from `from` to `to` (month-day, both days included). A range may run over
// the new year, e.g. "12-01" to "01-06". The first matching entry wins, so special events go
// above the seasons. `base` layers an event on top of a season: Halloween keeps the autumn look
// and adds its own extras. Easter moves every year, so its week before and after is worked out
// from the date of Easter Sunday. The styles live in assets/css/themes.css under
// [data-theme~="<name>"].
//
// Preview: add ?theme=halloween (or any other name) to a URL. The choice is kept while you
// browse the site in that tab; ?theme=none switches themes off, ?theme=auto goes back to the
// calendar.
const SEASONS = [
  { theme: "halloween", base: "autumn", from: "10-24", to: "11-07" },
  { theme: "christmas", base: "winter", from: "12-18", to: "12-27" },
  { theme: "newyear", base: "winter", from: "12-28", to: "01-07" },
  { theme: "easter", base: "spring", ...aroundEaster(7) },
  { theme: "spring", from: "03-20", to: "06-20" },
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

  const day = monthDay(new Date());
  const active = ({ from, to }) => from <= to ? day >= from && day <= to : day >= from || day <= to;

  const season = preview === "none" ? null
    : SEASONS.find(entry => entry.theme === preview) || SEASONS.find(active);
  if (season) document.documentElement.dataset.theme = [season.base, season.theme].filter(Boolean).join(" ");
}

function monthDay(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// The days around Easter Sunday this year (Western date, Meeus/Jones/Butcher algorithm)
function aroundEaster(days) {
  const year = new Date().getFullYear();
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), sunday = (h + l - 7 * m + 114) % 31 + 1;
  const shifted = offset => monthDay(new Date(year, month - 1, sunday + offset));
  return { from: shifted(-days), to: shifted(days) };
}

// Decorations for the active themes. The page headers get the most; the roadmap, the book pages,
// the invitation, the buttons, the footer and the section titles get a few touches each.
document.addEventListener("DOMContentLoaded", () => {
  const themes = (document.documentElement.dataset.theme || "").split(" ");
  const headers = [...document.querySelectorAll(".hero, .page-hero")];
  if (themes.includes("autumn")) addAutumn(headers);
  if (themes.includes("halloween")) addHalloween(headers);
  if (themes.includes("winter")) addWinter(headers);
  if (themes.includes("christmas")) addChristmas(headers);
  if (themes.includes("newyear")) addNewYear(headers);
  if (themes.includes("spring")) addSpring(headers);
  if (themes.includes("easter")) addEaster(headers);
});

let themeSeed = 7;
const themeRandom = () => (themeSeed = (themeSeed * 16807) % 2147483647) / 2147483647;
const small = () => innerWidth < 600;
// Pixel art is only turned in quarter turns or mirrored; at other angles it loses pixels
const quarterTurn = () => `rotate(${Math.floor(themeRandom() * 4) * 90}deg)${themeRandom() < .5 ? " scaleX(-1)" : ""}`;

// Pixel art as inline SVG. `colours` maps each character to a colour ("#" if it is a string).
// With a `scale`, the sprite gets a fixed size of that many screen pixels per pixel.
function pixelSprite(rows, colours, className = "", scale = 0) {
  const palette = typeof colours === "string" ? { "#": colours } : colours;
  const size = scale ? ` width="${rows[0].length * scale}" height="${rows.length * scale}"` : "";
  let rects = "";
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (palette[cell]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[cell]}"/>`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" viewBox="0 0 ${rows[0].length} ${rows.length}"${size} shape-rendering="crispEdges">${rects}</svg>`;
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

// Cargo for the minecart on the roadmap (home.js builds the cart, 21 by 17 units). The cart is
// seen from above, so blocks show their top. An event replaces the season's.
function loadCart(html) {
  const cart = document.querySelector("#minecart g g");
  if (!cart) return;
  cart.querySelector(".cargo")?.remove();
  cart.insertAdjacentHTML("beforeend", `<g class="cargo">${html}</g>`);
}
const cargo = src => `<image href="${src}" x="4" y="2" width="13" height="13" style="image-rendering: pixelated"/>`;

// Things in and beside the roadmap's track, under the rails and the minecart. `at` runs from
// 0 to 1 along the track and `side` moves a thing that many pixels above (-) or below (+) it.
// Things that `stand` have their bottom edge there instead of their centre. Only the home page
// has the track.
function alongTrack(things) {
  const path = document.getElementById("trail-path");
  if (!path) return;
  const length = path.getTotalLength();
  const deco = document.createElement("div");
  deco.className = "track-deco";
  deco.setAttribute("aria-hidden", "true");
  for (const { at, side, html, stand } of things) {
    const point = path.getPointAtLength(at * length);
    deco.insertAdjacentHTML("beforeend", `<span${stand ? ' class="stand"' : ""} `
      + `style="left:${(point.x / 10).toFixed(2)}%;top:calc(${(point.y / 4).toFixed(2)}% + ${side}px)">${html}</span>`);
  }
  path.closest("svg").before(deco);
}
// The stretches of track between the stops (the stops are at 0, 1/3, 2/3 and 1)
const TRACK_SPOTS = [.09, .15, .21, .27, .41, .47, .53, .59, .74, .8, .86, .92];
const nearStop = at => Math.abs(at * 3 - Math.round(at * 3)) < .14;

// A small block the way the inventory shows it, turned so the top, front and side are visible
const block = (top, front, side) => `<span class="block"><span class="cube"><i class="top" style="background-image:url(${top})"></i>`
  + `<i class="front" style="background-image:url(${front})"></i><i class="side" style="background-image:url(${side})"></i></span></span>`;

// Something for King Gidein to wear on his head (only on the home page)
function onKingsHead(html) {
  const head = document.querySelector(".grove .head");
  if (!head) return;
  const wrap = document.createElement("span");
  wrap.className = "hat-wrap";
  head.replaceWith(wrap);
  wrap.append(head);
  wrap.insertAdjacentHTML("beforeend", html);
}

// A small sprite on both sides of each section title. Through a CSS variable the same sprite
// also sits on top of each button and on each step of the roadmap. An event replaces the season's.
function addOrnaments(rows, colours) {
  const sprite = pixelSprite(rows, colours, "", 2);
  document.documentElement.style.setProperty("--button-sprite", `url("data:image/svg+xml,${encodeURIComponent(sprite)}")`);
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
    `<span style="left:${left};top:${top}px;transform:${turn}">${pixelSprite(LEAF, colour)}</span>`;
  decorate(".book", "fallen-leaves", lying("-30px", -36, "rotate(-90deg)", LEAF_COLOURS[1]) + lying("-8px", -40, "scaleX(-1)", LEAF_COLOURS[2]));
  decorate("footer", "fallen-leaves", () => {
    let html = "";
    for (let i = 0, count = small() ? 5 : 10; i < count; i++) {
      const left = `${(1 + themeRandom() * 97).toFixed(1)}%`;
      html += lying(left, Math.round(-10 + themeRandom() * 8), quarterTurn(), LEAF_COLOURS[i % 4]);
    }
    return html;
  });
  loadCart(cargo("assets/blocks/pumpkin_top.png"));
  alongTrack(TRACK_SPOTS.map((at, i) => ({ at: at + themeRandom() * .03, side: Math.round(-14 + themeRandom() * 28),
    html: `<i class="leaf" style="transform:${quarterTurn()}">${leaves[i % leaves.length]}</i>` })));
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
  // The pumpkin in the minecart glows, and a few carved pumpkins stand beside the track
  loadCart(`<g class="glow">${cargo("assets/blocks/pumpkin_top.png")}</g>`);
  const pumpkin = block("assets/blocks/pumpkin_top.png", "assets/blocks/carved_pumpkin.png", "assets/blocks/pumpkin_side.png");
  alongTrack([.2, .5, .83].map(at => ({ at, side: -8, stand: true, html: pumpkin })));
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
  loadCart(cargo("assets/blocks/snow.png"));
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

  const HAT = [
    ".........WW..",
    "......RRRWG..",
    "....DRRRRR...",
    "...DRRRRRRR..",
    "..DDRRRRRRRR.",
    "WWWWWWWWWWWWW",
    "GGGGGGGGGGGGG",
  ];
  onKingsHead(pixelSprite(HAT, { R: "#C8322D", D: "#9E2522", W: "#F4F4F0", G: "#D8D8D0" }, "santa-hat"));

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
  // The present rides along in the minecart, with a string of lights beside the track
  loadCart(cargo("assets/items/christmas_chest_top.png"));
  const BULBS = ["#E0514A", "#F0C040", "#58B6E0", "#7ACB5B"];
  alongTrack(Array.from({ length: 40 }, (_, i) =>
    ({ at: .02 + i * .024, side: -16, html: `<b class="bulb" style="--c:${BULBS[i % BULBS.length]};--i:${i % 4}"></b>` })));
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

  loadCart(cargo("assets/items/firework_rocket.png"));
  const SPARKLE = ["...#...", "...#...", "..###..", "#######", "..###..", "...#...", "...#..."];
  alongTrack([.12, .24, .45, .56, .77, .89].map((at, i) => ({ at, side: i % 2 ? -34 : -26,
    html: `<i class="sparkle" style="--i:${i}">${pixelSprite(SPARKLE, COLOURS[i % COLOURS.length], "", 2)}</i>` })));

  // A firework rocket ready on each book page
  decorate(".book", "rocket", `<img src="assets/items/firework_rocket.png" alt="">`);
  addOrnaments(SPARKLE, "#F0C040");
}

const FLOWERS = ["poppy", "dandelion", "cornflower", "allium", "oxeye_daisy", "pink_tulip"];
const plant = (name, style) => `<img src="assets/blocks/${name}.png" alt="" style="${style}">`;

// A meadow: grass and ferns in different sizes and shades, some of them mirrored, with a
// flower here and there. The back row is smaller and darker. Every plant sways in the wind,
// a little later the further right it is, so the gusts move through from left to right.
function meadow(count, [min, max]) {
  let html = "";
  for (let i = 0; i < count; i++) {
    const x = (i + themeRandom()) * 100 / count;
    const flower = themeRandom() < .14;
    const name = flower ? FLOWERS[Math.floor(themeRandom() * FLOWERS.length)] : themeRandom() < .3 ? "fern" : "short_grass";
    const back = !flower && i % 2 === 0;
    const size = Math.round((min + themeRandom() * (max - min)) * (back ? .75 : 1));
    html += `<img${back ? ' class="back"' : ""} src="assets/blocks/${name}.png" alt="" style="left:${x.toFixed(1)}%;`
      + `width:${size}px;height:${size}px;--x:${Math.round(x)};--sway:${(3 + themeRandom() * 4).toFixed(1)};`
      + `--flip:${themeRandom() < .5 ? -1 : 1}">`;
  }
  return html;
}

// Spring: cherry blossom petals drifting down, a meadow along the edge and a bee flying over it.
// Further down, flowers on the book pages and the meadow again along the footer.
function addSpring(headers) {
  const petals = ["#F6B3CF", "#F9D2E2", "#EE95BA"].flatMap(colour =>
    [pixelSprite(["##", "#."], colour, "", 3), pixelSprite([".#", "##"], colour, "", 3)]);
  const BEE_UP = ["...ww.ww..", "...wwwww..", ".YYDDYYDK.", "SYYDDYYDYK", ".YYDDYYDY.", "..d...d..."];
  const BEE_DOWN = ["..........", "..wwwww...", ".YwwwwYDK.", "SYYDDYYDYK", ".YYDDYYDY.", "..d...d..."];
  const BEE_COLOURS = { w: "#DCEFFF", Y: "#F2C230", D: "#4A2F1B", K: "#141414", S: "#3A2414", d: "#2A1B10" };
  const bee = pixelSprite(BEE_UP, BEE_COLOURS, "up") + pixelSprite(BEE_DOWN, BEE_COLOURS, "down");
  const plants = Math.max(30, Math.min(160, Math.round(innerWidth / 12)));
  for (const header of headers) {
    addFalling(header, "petals", petals, small() ? 6 : 12, [12, 20]);
    addGround(header, "meadow", meadow(plants, [22, 40]) + `<div class="bee" style="left:7%">${bee}</div>`);
  }

  decorate(".book", "posy",
    plant("pink_tulip", "top:-58px;left:-50px;transform:rotate(-90deg)") + plant("cornflower", "top:-66px;left:-14px"));
  decorate("footer", "meadow", meadow(plants, [16, 28]));
  loadCart(cargo("assets/blocks/pink_tulip.png"));
  // Low tufts of grass along both edges of the track, with a flower here and there
  const TUFTS = [
    [".L...L.", ".G.L.G.", "LG.G.GL", "GD.GDGG", "DGDGDGD"],
    ["....L....", ".L..G..L.", ".G.LG..G.", "LG.GD.LGL", "GDLGDGGDG", "DGDDGDDGD"],
    [".L.L.", "LG.GL", "GDLGD", "DGDGD"],
  ].map(rows => pixelSprite(rows, { L: "#8BC45E", G: "#5E9A3E", D: "#3F6E2C" }, "", 2));
  const verge = [];
  for (let at = .03; at < .98; at += .014 + themeRandom() * .012) {
    if (nearStop(at)) continue;
    for (const side of [-9, 22]) {
      const html = themeRandom() < .1
        ? `<img class="plant" src="assets/blocks/${FLOWERS[Math.floor(themeRandom() * FLOWERS.length)]}.png" alt="">`
        : TUFTS[Math.floor(themeRandom() * TUFTS.length)];
      verge.push({ at: at + themeRandom() * .006, side: side + Math.round(themeRandom() * 2), stand: true,
        html: `<i class="tuft" style="--x:${Math.round(at * 100)};--sway:${(4 + themeRandom() * 5).toFixed(1)};--flip:${themeRandom() < .5 ? -1 : 1}">${html}</i>` });
    }
  }
  alongTrack(verge);
  addOrnaments([".PP.PP.", "PPPPPPP", "PPpYpPP", ".PYYYP.", "PPpYpPP", "PPPPPPP", ".PP.PP."],
    { P: "#F4A7C6", p: "#F9CFE0", Y: "#F2C94C" });
}

// Easter (a week either side of Easter Sunday, on top of spring): a rabbit hopping past,
// painted eggs in the grass and on the spruces, and bunny ears for the King
function addEaster(headers) {
  const EGG = ["..bbb..", ".bbbbb.", ".sssss.", "bbbbbbb", "bsbsbsb", "bbbbbbb", "sssssss", ".bbbbb.", "..bbb.."];
  const PAINTS = [["#F6B8D1", "#FFFFFF"], ["#9FD3F0", "#F7E27A"], ["#FFD86B", "#E77DA8"], ["#B5E08F", "#FFFFFF"], ["#CDB4F0", "#FFD86B"]];
  const egg = (i, scale) => pixelSprite(EGG, { b: PAINTS[i % PAINTS.length][0], s: PAINTS[i % PAINTS.length][1] }, "", scale);
  const RABBIT = [
    ".........BB..",
    "........DBPB.",
    "........DBPB.",
    "........DBPB.",
    "......BBBBB..",
    ".....BBBBKBB.",
    "..BBBBBBBBBBP",
    ".WBBBBBBBBBL.",
    "WWBBBBBBBBLL.",
    ".BBBBBBBBBL..",
    "..BBBBBBBB...",
    "..DD....DD...",
  ];
  const rabbit = pixelSprite(RABBIT, { B: "#9A7552", D: "#6B4E33", L: "#C9A57E", W: "#F4F1EA", P: "#E9A3AE", K: "#1B1410" }, "", small() ? 2 : 3);

  for (const header of headers) {
    const runner = document.createElement("div");
    runner.className = "rabbit";
    runner.setAttribute("aria-hidden", "true");
    runner.innerHTML = rabbit;
    header.append(runner);
    header.querySelector(".meadow")?.insertAdjacentHTML("beforeend", `
      <span class="egg" style="left:calc(7% + 92px);--i:4">${egg(0, 3)}</span>
      <span class="egg" style="left:38%;--i:5">${egg(1, 3)}</span>
      <span class="egg" style="right:calc(7% + 96px);--i:6">${egg(2, 3)}</span>`);
  }

  // Painted eggs hanging on the spruces, like an Easter egg tree
  for (const tree of document.querySelectorAll(".spruce")) {
    tree.querySelectorAll("i:not(.log)").forEach((row, index) => {
      if (index < 2) return;
      row.insertAdjacentHTML("beforeend", `<span class="tree-egg" style="left:${Math.round(20 + themeRandom() * 60)}%;`
        + `top:${Math.round(40 + themeRandom() * 30)}%">${egg(index, 2)}</span>`);
    });
  }

  const EARS = [
    "..WW......WW..",
    ".WWWW....WWWW.",
    ".WPPW....WPPW.",
    ".WPPW....WPPW.",
    ".WPPW....WPPW.",
    ".WPPW...WPPW..",
    "..WPW...WPW...",
    "..WPW...WPW...",
    "..WWW..WWW....",
    "...WW..WW.....",
  ];
  onKingsHead(pixelSprite(EARS, { W: "#F4F1EA", P: "#F2A5B8" }, "bunny-ears"));

  loadCart(`<g transform="translate(7 4)">${egg(1, 1)}</g>`);
  alongTrack([.18, .5, .83].map((at, i) => ({ at, side: -8, stand: true, html: egg(i + 2, 2) })));

  decorate(".book", "easter-egg", egg(2, 4));
  let hidden = "";
  for (let i = 0, count = small() ? 3 : 6; i < count; i++) {
    hidden += `<span class="egg" style="left:${(4 + (i + themeRandom() * .7) * 92 / count).toFixed(1)}%">${egg(i, 2)}</span>`;
  }
  document.querySelector("footer > .meadow")?.insertAdjacentHTML("beforeend", hidden);
  addOrnaments(EGG, { b: "#FFD86B", s: "#E77DA8" });
}
