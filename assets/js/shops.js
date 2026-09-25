// Shop directory, filled from assets/data/shops.json:
// [{ "name": "", "owner": "", "location": "x y z", "icon": "diamond", "items": [{ "item": "", "price": "" }] }]
// "icon" is the name of a texture in assets/items.

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

async function loadShops() {
  const list = document.getElementById("shop-list");
  let shops;
  try {
    shops = await (await fetch("assets/data/shops.json", { cache: "no-cache" })).json();
  } catch {
    return;
  }
  if (!Array.isArray(shops) || !shops.length) return;

  list.previousElementSibling.hidden = false;
  list.replaceChildren(...shops.map(shop => {
    const card = el("article", "shop");

    const slot = el("div", "node sm");
    const icon = el("img", "item icon");
    const name = /^[a-z_]+$/.test(shop.icon) ? shop.icon : "emerald";
    icon.src = `assets/items/${name}.png`;
    icon.alt = "";
    slot.append(icon);

    const info = el("div");
    info.append(el("h3", null, shop.name), el("p", "muted", `by ${shop.owner}`));
    if (shop.location) {
      const coords = el("span", "coords", `${shop.location} `);
      const copy = el("button", "copy", "Copy");
      copy.type = "button";
      copy.dataset.copy = shop.location;
      coords.append(copy);
      info.append(coords);
    }
    const items = el("ul");
    for (const { item, price } of shop.items || []) {
      const row = el("li");
      row.append(el("span", null, item), el("span", "mc", price));
      items.append(row);
    }
    info.append(items);

    card.append(slot, info);
    return card;
  }));
}

loadShops();
