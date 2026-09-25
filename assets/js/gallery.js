// Gallery, filled from assets/data/gallery.json:
// [{ "src": "assets/gallery/photo.jpg", "caption": "Short description" }]
// Only images inside assets/gallery/ are shown.

async function loadGallery() {
  const grid = document.getElementById("photos");
  let photos;
  try {
    photos = await (await fetch("assets/data/gallery.json", { cache: "no-cache" })).json();
  } catch {
    return;
  }
  if (!Array.isArray(photos)) return;
  photos = photos.filter(p => /^assets\/gallery\/[\w\-.]+\.(jpe?g|png|webp)$/i.test(p.src));
  if (!photos.length) return;

  grid.replaceChildren(...photos.map(({ src, caption }) => {
    const figure = document.createElement("figure");
    const link = document.createElement("a");
    link.className = "map-tile";
    link.href = src;
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption || "";
    img.loading = "lazy";
    link.append(img);
    figure.append(link);
    if (caption) {
      const text = document.createElement("figcaption");
      text.textContent = caption;
      figure.append(text);
    }
    return figure;
  }));
}

loadGallery();
