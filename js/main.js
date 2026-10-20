// Shared behavior for every page. Each piece mirrors a component from the
// original Framer site: theme toggle, live clock, custom cursor, falling
// pills (Matter.js), and the entrance/scroll animations.

const desktopCursor = matchMedia("(hover: hover) and (pointer: fine)");

// ---------- Light/dark toggle ----------
// The saved choice is applied early by the inline script in each page's <head>.
function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

document.querySelectorAll(".theme-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
});

// ---------- Live clock in the footer ----------
const clocks = document.querySelectorAll("[data-clock]");
function tick() {
  const t = new Date().toLocaleTimeString("en-US");
  clocks.forEach((el) => (el.textContent = t));
}
if (clocks.length) { tick(); setInterval(tick, 1000); }

// ---------- Custom cursor ----------
// 28px ring that trails the pointer on a spring, 20px right of it.
const cursor = document.querySelector(".cursor");
if (cursor && desktopCursor.matches) {
  let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, shown = false;
  const stiffness = 808, damping = 100, mass = 0.2;
  addEventListener("mousemove", (e) => {
    tx = e.clientX + 20;
    ty = e.clientY - 14 + 20;
    if (!shown) {
      x = tx; y = ty; shown = true;
      cursor.style.opacity = 1;
      document.documentElement.classList.add("cursor-none");
    }
  });
  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = 0; shown = false;
    document.documentElement.classList.remove("cursor-none");
  });
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      vx += ((stiffness * (tx - x) - damping * vx) / mass) * h;
      vy += ((stiffness * (ty - y) - damping * vy) / mass) * h;
      x += vx * h;
      y += vy * h;
    }
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(loop);
  })(last);
}

// ---------- Falling pills (homepage hero) ----------
// Port of the Framer "Physics" component: random start positions, gravity 0.3,
// walls on all sides, drag with mouse or touch.
function startPhysics(stage, { sleeping }) {
  const { Engine, World, Bodies, Composites, Mouse, MouseConstraint, Composite } = Matter;
  const rect = stage.getBoundingClientRect();
  const engine = Engine.create({ enableSleeping: sleeping, gravity: { x: 0, y: 0.3 } });

  const wall = { isStatic: true, friction: 2 };
  World.add(engine.world, [
    Bodies.rectangle(rect.width / 2, rect.height + 50, rect.width + 100, 100, wall),
    Bodies.rectangle(rect.width / 2, -50, rect.width + 100, 100, wall),
    Bodies.rectangle(rect.width + 50, rect.height / 2, 100, rect.height, wall),
    Bodies.rectangle(-50, rect.height / 2, 100, rect.height, wall),
  ]);

  const mouse = Mouse.create(stage);
  const drag = MouseConstraint.create(engine, {
    mouse,
    constraint: { angularStiffness: 0, stiffness: 1 },
  });
  Composite.add(engine.world, drag);
  ["mousewheel", "DOMMouseScroll", "touchstart", "touchmove", "touchend"].forEach((type) =>
    drag.mouse.element.removeEventListener(type, drag.mouse[type])
  );
  stage.addEventListener("touchstart", drag.mouse.mousedown, { passive: true });
  stage.addEventListener("touchmove", (e) => { if (drag.body) drag.mouse.mousemove(e); });
  stage.addEventListener("touchend", (e) => { if (drag.body) drag.mouse.mouseup(e); });
  stage.addEventListener("mouseleave", (e) => drag.mouse.mouseup(e));

  const els = [...stage.children];
  const stack = Composites.stack(0, 0, els.length, 1, 0, 0, (sx, sy, i) => {
    const { width, height } = els[i].getBoundingClientRect();
    const x = Math.floor(Math.random() * (rect.width - width));
    const y = Math.floor(Math.random() * (rect.height - height));
    return Bodies.rectangle(x, y, width, height, {
      isStatic: false, density: 0.001, friction: 0.05, frictionAir: 0.01,
    });
  });
  World.add(engine.world, stack);

  (function frame() {
    requestAnimationFrame(frame);
    stack.bodies.forEach((body, i) => {
      const el = els[i];
      const { x, y } = body.vertices[0];
      el.style.visibility = "visible";
      el.style.top = `${y}px`;
      el.style.left = `${x}px`;
      el.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad) translate(50%, 50%)`;
    });
    Engine.update(engine);
  })();
}

if (window.Matter) {
  const stages = [...document.querySelectorAll("[data-physics]")];
  const started = new Set();
  const startVisible = () => {
    stages.forEach((stage) => {
      if (started.has(stage) || stage.offsetParent === null) return;
      started.add(stage);
      startPhysics(stage, { sleeping: stage.dataset.physics === "sleep" });
    });
  };
  if (document.fonts) document.fonts.ready.then(startVisible); else startVisible();
  addEventListener("resize", startVisible);
}

// ---------- Homepage project list fades in after 1.2s ----------
const worksList = document.querySelector(".works-list");
if (worksList) setTimeout(() => worksList.classList.add("is-visible"), 1200);

// ---------- Project page entrance animations ----------
// Title words slide up, "OVERVIEW" letters rise in, the paragraph floats up.
function animate(el, keyframes, options) {
  if (!el.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(keyframes, { fill: "backwards", ...options });
}

document.querySelectorAll("[data-split-words]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span style="display:inline-block">${w}</span>`).join(" ");
  el.querySelectorAll("span").forEach((span, i) =>
    animate(span, [{ transform: "translateY(91px)" }, { transform: "none" }], {
      duration: 900, delay: 75 + i * 75, easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    })
  );
});

document.querySelectorAll("[data-split-letters]").forEach((el) => {
  const letters = [...el.textContent];
  el.innerHTML = letters.map((c) => `<span style="display:inline-block">${c === " " ? "&nbsp;" : c}</span>`).join("");
  el.querySelectorAll("span").forEach((span, i) =>
    animate(span, [{ opacity: 0.62, transform: "translateY(100px)" }, { opacity: 1, transform: "none" }], {
      duration: 1000, delay: i * 10, easing: "cubic-bezier(0.25, 0.45, 0.3, 0.73)",
    })
  );
});

document.querySelectorAll("[data-rise]").forEach((el) =>
  animate(el, [
    { opacity: 0.2, transform: "perspective(1200px) translateY(150px)" },
    { opacity: 1, transform: "perspective(1200px) translateY(0)" },
  ], { duration: 1200, delay: 200, easing: "cubic-bezier(0.25, 0.45, 0.26, 0.95)" })
);

// ---------- YouTube: show the thumbnail, load the player on click ----------
document.querySelectorAll("[data-youtube]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.className = btn.className;
    iframe.style.cssText = btn.style.cssText;
    iframe.src = `https://www.youtube.com/embed/${btn.dataset.youtube}?autoplay=1&iv_load_policy=3&rel=0&modestbranding=1&playsinline=1`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    btn.replaceWith(iframe);
  });
});

// ---------- Playground: images settle from 110% to 100% while scrolling ----------
const zooms = [...document.querySelectorAll(".archive-image .zoom")];
if (zooms.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const update = () => {
    const vh = innerHeight;
    zooms.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.transform = `perspective(1200px) translateY(${44 * p}px) scale(${1.1 - 0.1 * p})`;
    });
  };
  // Like the original, images start at 110% and only react once you scroll.
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
}
