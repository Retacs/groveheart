// Spruce trees next to the King's head. Each number is one row of leaf blocks, 0 is a log.
{
  const shapes = {
    tall: [1, 1, 3, 1, 3, 5, 3, 5, 7, 0, 0],
    medium: [1, 3, 1, 3, 5, 3, 5, 0, 0],
    small: [1, 3, 1, 3, 5, 0],
  };
  for (const tree of document.querySelectorAll(".spruce")) {
    for (const width of shapes[tree.dataset.shape]) {
      const row = document.createElement("i");
      if (width) row.style.width = `calc(var(--b) * ${width})`;
      else row.className = "log";
      tree.append(row);
    }
  }
}

// Fox walking along the bottom of the hero. It is built in CSS 3D from the fox model's boxes
// (sizes in 1/16 block, y pointing down) and every face uses the matching part of fox.png.
{
  const S = 3;
  const stage = document.querySelector(".critters");
  const fox = stage.querySelector(".fox3d");
  const berries = stage.querySelector(".berries");

  const move = (x, y, z) => `translate3d(${x * S}px, ${y * S}px, ${z * S}px)`;
  const face = (u, v, w, h, transform) =>
    `<i style="width:${w * S}px; height:${h * S}px; background-position:${-u * S}px ${-v * S}px; transform:${transform}"></i>`;

  // A box with Minecraft's texture layout starting at (u, v)
  const box = (x, y, z, w, h, d, u, v) => [
    face(u + d, v + d, w, h, `${move(x + w, y, z)} rotateY(180deg)`),
    face(u + 2 * d + w, v + d, w, h, move(x, y, z + d)),
    face(u + d + w, v + d, d, h, `${move(x, y, z)} rotateY(-90deg)`),
    face(u, v + d, d, h, `${move(x + w, y, z + d)} rotateY(90deg)`),
    face(u + d, v, w, d, `${move(x, y, z)} rotateX(90deg)`),
    face(u + d + w, v, w, d, `${move(x, y + h, z + d)} rotateX(-90deg)`),
  ].join("");

  const part = (pivot, content, rotation = "") =>
    `<div style="transform: ${move(...pivot)} ${rotation}">${content}</div>`;
  const leg = (x, z, u, alt) =>
    part([x, 17.5, z], `<div class="swing${alt ? " alt" : ""}">${box(2, 0.5, -1, 2, 6, 2, u, 24)}</div>`);

  const head = box(-3, -2, -5, 8, 6, 6, 1, 5)
    + box(-3, -4, -4, 2, 2, 1, 8, 1)
    + box(3, -4, -4, 2, 2, 1, 15, 1)
    + box(-1, 2.01, -8, 4, 2, 3, 6, 18);
  const tail = part([-4, 15, -1], box(2, 0, -1, 4, 9, 5, 30, 0), "rotateX(-3deg)");
  const body = box(-3, 4, -3.5, 6, 11, 6, 24, 15) + tail;

  fox.innerHTML = `
    <div class="yaw">
      <div style="transform: translate3d(0, ${-24 * S}px, ${-3.5 * S}px)">
        ${part([-1, 16.5, -3], `<div class="nod">${head}</div>`)}
        ${part([0, 16, -6], body, "rotateX(90deg)")}
        ${leg(-5, 7, 13, false)}${leg(-1, 7, 4, true)}${leg(-5, 0, 13, true)}${leg(-1, 0, 4, false)}
      </div>
    </div>`;
  const yaw = fox.querySelector(".yaw");

  let x = 60;
  let direction = 1;
  let angle = -102;
  let state = "walk";
  let timer = 0;
  let nextSnack = 5;
  let last = performance.now();

  const draw = () => {
    fox.style.transform = `translateX(${x.toFixed(1)}px)`;
    yaw.style.transform = `rotateX(-8deg) rotateY(${angle.toFixed(1)}deg)`;
  };

  const step = now => {
    const dt = Math.min(now - last, 50) / 1000;
    last = now;
    const right = stage.clientWidth - 60;
    const facing = direction > 0 ? -102 : 102;
    angle += (facing - angle) * Math.min(1, dt * 5);

    if (state === "walk") {
      x += direction * 34 * dt;
      nextSnack -= dt;
      if (x > right) { x = right; direction = -1; }
      if (x < 40) { x = 40; direction = 1; }
      if (nextSnack <= 0 && Math.abs(angle - facing) < 5) {
        // Sweet berries appear a little ahead of the fox
        state = "approach";
        timer = 1.2;
        berries.style.left = `${Math.round(x + direction * 70 - 13)}px`;
        berries.className = "berries show";
      }
    } else if (state === "approach") {
      x += direction * 34 * dt;
      timer -= dt;
      if (timer <= 0) {
        state = "eat";
        timer = 3;
        fox.classList.add("eating");
      }
    } else {
      timer -= dt;
      if (timer < 1.2) berries.className = "berries show gone";
      if (timer <= 0) {
        state = "walk";
        nextSnack = 9 + Math.random() * 8;
        fox.classList.remove("eating");
        berries.className = "berries";
      }
    }

    draw();
    requestAnimationFrame(step);
  };

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fox.querySelectorAll(".swing").forEach(legPart => (legPart.style.animation = "none"));
    x = stage.clientWidth * 0.2;
    draw();
  } else {
    requestAnimationFrame(step);
  }
}

// Envelope edges as pixel steps
{
  const steps = (x1, y1, x2, y2, count) => {
    const points = [];
    for (let i = 0; i < count; i++) {
      const xa = x1 + (x2 - x1) * i / count;
      const xb = x1 + (x2 - x1) * (i + 1) / count;
      const y = y1 + (y2 - y1) * (i + 1) / count;
      points.push(`${xa.toFixed(2)}% ${y.toFixed(2)}%`, `${xb.toFixed(2)}% ${y.toFixed(2)}%`);
    }
    return points.join(", ");
  };
  document.querySelector(".pocket-shape").style.clipPath =
    `polygon(0% 0%, ${steps(0, 0, 50, 52, 14)}, ${steps(50, 52, 100, 0, 14)}, 100% 0%, 100% 100%, 0% 100%)`;
  document.querySelector(".flap-face").style.clipPath =
    `polygon(0% 0%, 100% 0%, ${steps(100, 0, 50, 100, 14)}, ${steps(50, 100, 0, 0, 14)})`;
}
