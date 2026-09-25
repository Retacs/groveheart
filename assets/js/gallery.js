// Gallery, filled from assets/data/gallery.json:
// [{ "src": "assets/gallery/01.jpg", "thumb": "assets/gallery/01-thumb.jpg", "caption": "Optional" }]
// Only images inside assets/gallery/ are shown.

const isGalleryImage = path => /^assets\/gallery\/[\w\-.]+\.(jpe?g|png|webp)$/i.test(path || "");

async function loadGallery() {
  const grid = document.getElementById("photos");
  let photos;
  try {
    photos = await (await fetch("assets/data/gallery.json", { cache: "no-cache" })).json();
  } catch {
    return;
  }
  if (!Array.isArray(photos)) return;
  photos = photos.filter(p => isGalleryImage(p.src));
  if (!photos.length) return;

  grid.replaceChildren(...photos.map((photo, index) => {
    const figure = document.createElement("figure");
    const link = document.createElement("a");
    link.className = "map-tile";
    link.href = photo.src;
    const img = document.createElement("img");
    img.src = isGalleryImage(photo.thumb) ? photo.thumb : photo.src;
    img.alt = photo.caption || `Groveheart screenshot ${index + 1}`;
    img.loading = "lazy";
    img.decoding = "async";
    link.append(img);
    link.addEventListener("click", event => {
      event.preventDefault();
      lightbox.open(photos, index);
    });
    figure.append(link);
    if (photo.caption) {
      const text = document.createElement("figcaption");
      text.textContent = photo.caption;
      figure.append(text);
    }
    return figure;
  }));
}

// Full-screen viewer with arrow keys, swipe and Esc
const lightbox = {
  build() {
    this.el = document.createElement("div");
    this.el.className = "lightbox";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Photo viewer");
    this.el.innerHTML = `
      <button class="lb-close" type="button" aria-label="Close">&times;</button>
      <button class="lb-prev" type="button" aria-label="Previous photo">&#8249;</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" type="button" aria-label="Next photo">&#8250;</button>
      <span class="lb-count"></span>`;
    document.body.append(this.el);
    this.img = this.el.querySelector("img");
    this.caption = this.el.querySelector("figcaption");
    this.count = this.el.querySelector(".lb-count");

    this.el.querySelector(".lb-close").addEventListener("click", () => this.close());
    this.el.querySelector(".lb-prev").addEventListener("click", () => this.show(this.index - 1));
    this.el.querySelector(".lb-next").addEventListener("click", () => this.show(this.index + 1));
    this.el.addEventListener("click", event => { if (event.target === this.el) this.close(); });
    document.addEventListener("keydown", event => {
      if (this.el.hidden) return;
      if (event.key === "Escape") this.close();
      if (event.key === "ArrowLeft") this.show(this.index - 1);
      if (event.key === "ArrowRight") this.show(this.index + 1);
    });
    let startX = null;
    this.el.addEventListener("touchstart", event => { startX = event.touches[0].clientX; }, { passive: true });
    this.el.addEventListener("touchend", event => {
      if (startX === null) return;
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) this.show(this.index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  },

  open(photos, index) {
    if (!this.el) this.build();
    this.photos = photos;
    this.el.hidden = false;
    document.body.style.overflow = "hidden";
    this.show(index);
  },

  show(index) {
    const total = this.photos.length;
    this.index = (index + total) % total;
    const photo = this.photos[this.index];
    this.img.src = photo.src;
    this.img.alt = photo.caption || `Groveheart screenshot ${this.index + 1}`;
    this.caption.textContent = photo.caption || "";
    this.count.textContent = `${this.index + 1} / ${total}`;
    // Preload the neighbours so browsing feels instant
    for (const step of [1, -1]) new Image().src = this.photos[(this.index + step + total) % total].src;
  },

  close() {
    this.el.hidden = true;
    document.body.style.overflow = "";
  },
};

// Gallery page: build the grid. Other pages: any links marked data-lightbox open in the viewer.
if (document.getElementById("photos")) {
  loadGallery();
} else {
  const links = [...document.querySelectorAll("a[data-lightbox]")];
  const photos = links.map(link => ({ src: link.getAttribute("href").split("?")[0] }));
  links.forEach((link, index) => link.addEventListener("click", event => {
    event.preventDefault();
    lightbox.open(photos, index);
  }));
}
