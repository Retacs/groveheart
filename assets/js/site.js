// Pixel art: each character is one pixel, "." is transparent.
function pixelSvg(rows, palette) {
  let rects = "";
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (palette[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}"/>`;
    });
  });
  return `<svg class="pix" viewBox="0 0 ${rows[0].length} ${rows.length}" width="100%" height="100%">${rects}</svg>`;
}

const SPRITES = {
  letter: { pal: { o: "#6E5836", p: "#F2E6C9", s: "#D2BF94", R: "#C0392B", r: "#8E2420" }, rows: [
    "................", "................", "oooooooooooooooo", "osppppppppppppso",
    "opsppppppppppspo", "oppsppppppppsppo", "opppsppppppspppo", "oppppsRRRRsppppo",
    "opppppRrrRpppppo", "opppppRRRRpppppo", "oppppppppppppppo", "oppppppppppppppo",
    "osssssssssssssso", "oooooooooooooooo", "................", "................"] },
  bed: { pal: { W: "#EDEDED", w: "#C9C9C9", R: "#B3312C", r: "#8A2420", o: "#9C7A48", d: "#6B5230" }, rows: [
    "................", "................", "................", "................",
    "WWWWRRRRRRRRRRRR", "WwwWRRRRRRRRRRRR", "WWWWRRrRRRRrRRRR", "wwwwrrrrrrrrrrrr",
    "oooooooooooooooo", "oddddddddddddddo", "oo............oo", "dd............dd",
    "................", "................", "................", "................"] },
  crown: { pal: { Y: "#FFE27A", y: "#E8B923", o: "#A87A12", r: "#C0392B", b: "#3B7DD8" }, rows: [
    "................", "................", "................", ".Y......Y......Y",
    ".yY....YyY....Yy", ".yyY..YyyyY..Yyy", ".yyyyyyyyyyyyyyy", ".yyryyyybyyyyryy",
    ".yyyyyyyyyyyyyyy", ".ooooooooooooooo", "................", "................",
    "................", "................", "................", "................"] },
  shield: { pal: { i: "#A7A7A7", G: "#0B5A1A", W: "#F1EEDD", T: "#0F3A3B" }, rows: [
    "................", ".iiiiiiiiiiiiii.", ".iGGGGGGGGGGGGi.", ".iGGGGGGGGGGGGi.",
    ".iGGGGGGGGGGGGi.", ".iWWWWWWWWWWWWi.", ".iWWWWWWWWWWWWi.", ".iTTTTTTTTTTTTi.",
    ".iTTTTTTTTTTTTi.", "..iTTTTTTTTTTi..", "..iTTTTTTTTTTi..", "...iTTTTTTTTi...",
    "....iTTTTTTi....", ".....iTTTTi.....", "......iiii......", "................"] },
  hut: { pal: { R: "#3E2912", r: "#2E1F0E", W: "#4A3218", w: "#3A2612", d: "#1E140A", g: "#FFD27A", s: "#5A5A5A", G: "#4E8A2E", S: "#3F7F24", F: "#8FD3F5", y: "#FFFFFF" }, rows: [
    "................", "................", "....rr..........", "...rRRr.........",
    "..rRRRRr........", ".rRRRRRRr.......", "rrrrrrrrrr......", ".WWWWWWWW.......",
    ".WggWWddW....F..", ".WggWWddW...FyF.", ".wwwwwddw....F..", ".WWWWWddW....S..",
    ".wwwwwddw...SS..", "ssssssssss.GGGGG", "................", "................"] },
  ballot: { pal: { b: "#8A6A3F", B: "#6B4F2C", s: "#2B1E10", p: "#F2E6C9", P: "#D2BF94", G: "#2E7D32" }, rows: [
    "................", ".....pppppp.....", ".....pPPPPp.....", ".....pppppp.....",
    ".....pPPPPp.....", "..BBBsssssssBB..", "..bbbbbbbbbbbb..", "..bBBBBBBBBBBb..",
    "..bbbbbbbbbbbb..", "..bbbbbbbbbbbb..", "..bbbbGGGGbbbb..", "..bbbbGGGGbbbb..",
    "..bbbbbbbbbbbb..", "..BBBBBBBBBBBB..", "................", "................"] }
};

for (const node of document.querySelectorAll("[data-pix]")) {
  const sprite = SPRITES[node.dataset.pix];
  if (sprite) node.innerHTML = pixelSvg(sprite.rows, sprite.pal);
}

// Mobile menu
const nav = document.querySelector("nav");
const menuButton = nav.querySelector(".menu-toggle");
menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", open);
});

// Advancement toasts with a tooltip
for (const law of document.querySelectorAll(".law")) {
  const button = law.querySelector(".toast");
  const setOpen = open => {
    law.classList.toggle("open", open);
    button.setAttribute("aria-expanded", open);
  };
  button.addEventListener("click", event => {
    event.stopPropagation();
    setOpen(!law.classList.contains("open"));
  });
  document.addEventListener("click", event => {
    if (!law.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
}

// Copy buttons
document.addEventListener("click", async event => {
  const button = event.target.closest(".copy[data-copy]");
  if (!button || button.classList.contains("done")) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
  } catch {
    return;
  }
  const label = button.textContent;
  button.textContent = "Copied";
  button.classList.add("done");
  setTimeout(() => {
    button.textContent = label;
    button.classList.remove("done");
  }, 1500);
});

// Leaf canopy: two rows of hanging leaf blocks. Seeded, so it looks the same on every visit.
for (const canopy of document.querySelectorAll(".canopy")) {
  let seed = 3;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tints = ["#3F6B45", "#3A6340", "#466F48", "#35593A", "#4A7550"];
  const columns = Math.ceil(Math.max(innerWidth, screen.width || 0, 3840) / 40) + 1;

  for (const [name, min, max] of [["back", 2, 4], ["front", 1, 3]]) {
    const layer = document.createElement("div");
    layer.className = `layer ${name}`;
    let height = min + 1;
    for (let i = 0; i < columns; i++) {
      height = Math.max(min, Math.min(max, height + Math.round(random() * 2 - 1)));
      const leaf = document.createElement("i");
      leaf.style.left = `${i * 40}px`;
      leaf.style.height = `${height * 40}px`;
      leaf.style.setProperty("--tint", tints[Math.floor(random() * tints.length)]);
      leaf.style.animationDelay = `${(-random() * 6).toFixed(2)}s`;
      layer.append(leaf);
    }
    canopy.append(layer);
  }
}

// Fade sections in as they scroll into view
const revealed = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("shown");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.2 });
  revealed.forEach(node => observer.observe(node));
} else {
  revealed.forEach(node => node.classList.add("shown"));
}

// Anchors for every section heading, so search results can link straight to them
const slug = text => text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
for (const heading of document.querySelectorAll("main h2, section h2")) {
  if (!heading.id) heading.id = slug(heading.textContent);
}

// List filters: an input with data-filter="x" filters every [data-filter-group="x"]
const normalize = text => text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

function applyFilter(input) {
  const name = input.dataset.filter;
  const query = normalize(input.value.trim());
  const groups = [...document.querySelectorAll(`[data-filter-group="${name}"]`)];
  let matches = 0;

  for (const group of groups) {
    const items = group.tBodies?.length ? [...group.tBodies[0].rows] : [...group.children].filter(n => !n.classList.contains("empty"));
    let header = null;
    for (const item of items) {
      if (item.classList.contains("district-row")) {
        header = item;
        header.hidden = Boolean(query);
        continue;
      }
      const hit = !query || normalize(item.textContent).includes(query);
      item.hidden = !hit;
      if (hit) {
        matches++;
        if (header) header.hidden = false;
      }
    }
  }

  // Hide whole sections whose tables have nothing left to show
  for (const scope of new Set(groups.map(g => g.closest("[data-filter-scope]")).filter(Boolean))) {
    scope.hidden = Boolean(query) && !scope.querySelector(`[data-filter-group="${name}"] tbody tr:not([hidden]):not(.district-row)`);
  }

  const empty = document.querySelector(`[data-filter-empty="${name}"]`);
  if (empty) empty.hidden = matches > 0;
}

const params = new URLSearchParams(location.search);
for (const input of document.querySelectorAll("[data-filter]")) {
  input.addEventListener("input", () => applyFilter(input));
  const query = params.get("q");
  if (query) {
    input.value = query;
    applyFilter(input);
    input.closest(".filter").scrollIntoView({ block: "center" });
  }
}

// Site search. Reads the pages listed in the menu, so it always matches what is on the site.
const search = {
  index: null,

  async build() {
    const kinds = { rail: "Station", settlements: "Settlement", shops: "Shop" };
    const pages = [...document.querySelectorAll("#menu a")].map(a => ({ url: a.getAttribute("href"), name: a.textContent }));
    const entries = [];
    await Promise.all(pages.map(async page => {
      let doc;
      try {
        const html = await (await fetch(page.url)).text();
        doc = new DOMParser().parseFromString(html, "text/html");
      } catch {
        return;
      }
      entries.push({ title: page.name, text: doc.querySelector(".lead")?.textContent || "", url: page.url, page: page.name, type: "Page", weight: 3 });
      for (const heading of doc.querySelectorAll("section h2")) {
        const intro = heading.parentElement.querySelector("p")?.textContent || "";
        entries.push({ title: heading.textContent, text: intro, url: `${page.url}#${heading.id || slug(heading.textContent)}`, page: page.name, type: "Section", weight: 2 });
      }
      for (const input of doc.querySelectorAll("[data-filter]")) {
        for (const group of doc.querySelectorAll(`[data-filter-group="${input.dataset.filter}"]`)) {
          for (const row of group.tBodies?.[0]?.rows || []) {
            if (row.classList.contains("district-row")) continue;
            const cells = [...row.cells].map(c => c.textContent.trim()).filter(t => t && t !== "Copy");
            if (!cells.length) continue;
            entries.push({ title: cells[0], text: cells.slice(1).join(" · "), url: `${page.url}?q=${encodeURIComponent(cells[0])}`, page: page.name, type: kinds[input.dataset.filter] || "Entry", weight: 1 });
          }
        }
      }
    }));
    this.index = entries;
  },

  find(query) {
    const q = normalize(query.trim());
    if (!q) return [];
    return this.index
      .map(entry => {
        const title = normalize(entry.title);
        let score = title.startsWith(q) ? 30 : title.includes(q) ? 20 : normalize(entry.text).includes(q) ? 5 : 0;
        return { entry, score: score && score + entry.weight };
      })
      .filter(r => r.score)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(r => r.entry);
  },
};

const ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>`;

function createSearch() {
  const button = document.createElement("button");
  button.className = "search-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Search the site");
  button.innerHTML = ICON_SEARCH;
  const item = document.createElement("li");
  item.append(button);
  document.getElementById("menu").append(item);

  const dialog = document.createElement("div");
  dialog.className = "search";
  dialog.hidden = true;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-label", "Search");
  dialog.innerHTML = `
    <div class="search-box">
      <label class="search-field">
        ${ICON_SEARCH}
        <input type="search" placeholder="Search stations, towns and pages" aria-label="Search" autocomplete="off" spellcheck="false">
        <kbd>Esc</kbd>
      </label>
      <ul class="search-results" role="listbox"></ul>
      <p class="search-empty">Try a station like <em>Avalon</em>, a town like <em>Bayland</em>, or a page.</p>
      <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span></div>
    </div>`;
  document.body.append(dialog);

  const input = dialog.querySelector("input");
  const list = dialog.querySelector(".search-results");
  const empty = dialog.querySelector(".search-empty");
  let active = 0;

  const highlight = index => {
    const links = list.querySelectorAll("a");
    if (!links.length) return;
    active = (index + links.length) % links.length;
    links.forEach((link, i) => link.classList.toggle("active", i === active));
    links[active].scrollIntoView({ block: "nearest" });
  };

  const render = () => {
    const query = input.value.trim();
    const results = search.index ? search.find(query) : [];
    list.replaceChildren(...results.map(entry => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = entry.url;
      const text = document.createElement("span");
      text.className = "result-text";
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const meta = document.createElement("span");
      meta.textContent = entry.text || entry.page;
      text.append(title, meta);
      const type = document.createElement("span");
      type.className = "result-type";
      type.textContent = entry.type === "Page" || entry.type === "Section" ? entry.page : entry.type;
      link.append(text, type);
      li.append(link);
      return li;
    }));
    empty.textContent = query && search.index && !results.length
      ? `Nothing found for “${query}”.`
      : "Try a station like Avalon, a town like Bayland, or a page.";
    empty.hidden = results.length > 0;
    highlight(0);
  };

  const open = async () => {
    dialog.hidden = false;
    requestAnimationFrame(() => dialog.classList.add("visible"));
    input.focus();
    input.select();
    if (!search.index) {
      await search.build();
      render();
    }
  };
  const close = () => {
    dialog.classList.remove("visible");
    setTimeout(() => { dialog.hidden = true; }, 150);
  };

  button.addEventListener("click", open);
  input.addEventListener("input", render);
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      highlight(active + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter") {
      const link = list.querySelectorAll("a")[active];
      if (link) location.href = link.href;
    }
  });
  dialog.addEventListener("click", event => { if (event.target === dialog) close(); });
  document.addEventListener("keydown", event => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (event.key === "Escape" && !dialog.hidden) close();
    else if ((event.key === "/" && !typing) || (event.key === "k" && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      open();
    }
  });
}

createSearch();
