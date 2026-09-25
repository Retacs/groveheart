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
