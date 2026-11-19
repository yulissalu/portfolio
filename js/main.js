// Shared behavior for every page. Each piece mirrors a component from the
// original Framer site: smooth scroll, theme toggle, live clock, custom
// cursor, falling pills (Matter.js), and the entrance/scroll animations.

// ============================================================================
// MOTION SETTINGS — every tunable number for scroll, cursor and physics.
// Change values here; the code below only reads them.
// ============================================================================
const MOTION = {
  // Smooth scrolling (Lenis). Applies to mouse wheel and trackpad only;
  // touch scrolling stays native. Turned off for prefers-reduced-motion.
  scroll: {
    // Share of the remaining distance covered per 60fps frame (0–1).
    // Lower = more glide and lag, higher = snappier. Frame-rate independent.
    // 0.1 is Lenis's default and what Framer's Smooth Scroll uses at its
    // default intensity.
    lerp: 0.1,
    wheelMultiplier: 1,   // scales distance per wheel tick / trackpad delta
    touchMultiplier: 1,   // only used if smoothTouch is true
    smoothTouch: false,   // keep native momentum on phones and tablets
  },

  // Custom cursor ring: a spring follows the pointer. Same units as Framer's
  // spring transition (stiffness, damping, mass).
  cursor: {
    stiffness: 808,
    damping: 100,
    mass: 0.2,
    size: 28,        // ring diameter in px (keep in sync with .cursor in CSS)
    offsetX: 20,     // ring's left edge sits this far right of the pointer
    offsetY: 20,     // ring's center sits this far below the pointer
  },

  // Falling pills in the homepage hero (Matter.js).
  physics: {
    gravityY: 0.3,         // Matter gravity scale; 1 = Matter's default
    density: 0.001,
    friction: 0.05,        // pill-on-pill and pill-on-wall sliding friction
    frictionAir: 0.01,     // air drag; higher = slower fall, faster settle
    restitution: 0,        // bounciness; 0 = no bounce (Matter default)
    wallFriction: 2,
    dragStiffness: 1,      // 1 = a dragged pill sticks to the pointer
    dragAngularStiffness: 0, // 0 = a dragged pill swings freely around the grab point
    stepMs: 1000 / 60,     // fixed physics step, so speed is the same on 60/120Hz screens
    maxStepsPerFrame: 4,   // catch-up limit after a dropped frame
    spawnTries: 40,        // attempts to find a non-overlapping start spot per pill
  },
};

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const desktopCursor = matchMedia("(hover: hover) and (pointer: fine)");

// ---------- Smooth scrolling ----------
let lenis = null;
if (window.Lenis && !reducedMotion.matches) {
  lenis = new Lenis({
    lerp: MOTION.scroll.lerp,
    wheelMultiplier: MOTION.scroll.wheelMultiplier,
    touchMultiplier: MOTION.scroll.touchMultiplier,
    syncTouch: MOTION.scroll.smoothTouch,
    anchors: true,      // same-page #links glide instead of jumping
    autoRaf: true,
  });
}

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
// Exact solution of a damped spring (the same model as Framer's spring
// transition), advanced by the real frame time. Because it's exact rather
// than stepped, it can't blow up at any frame rate.
function springStep(d, v, dt, k, c, m) {
  // d = position minus target, v = velocity. Returns [d, v] after dt seconds.
  const a = c / m, w2 = k / m, disc = a * a - 4 * w2;
  if (disc > 1e-6) {                       // overdamped (the cursor's case)
    const s = Math.sqrt(disc), r1 = (-a + s) / 2, r2 = (-a - s) / 2;
    const A = (v - r2 * d) / (r1 - r2), B = d - A;
    const e1 = Math.exp(r1 * dt), e2 = Math.exp(r2 * dt);
    return [A * e1 + B * e2, A * r1 * e1 + B * r2 * e2];
  }
  if (disc < -1e-6) {                      // underdamped (bouncy)
    const wd = Math.sqrt(-disc) / 2, h = -a / 2, e = Math.exp(h * dt);
    const C2 = (v - h * d) / wd, cos = Math.cos(wd * dt), sin = Math.sin(wd * dt);
    return [e * (d * cos + C2 * sin), e * ((h * d + wd * C2) * cos + (h * C2 - wd * d) * sin)];
  }
  const r = -a / 2, C2 = v - r * d, e = Math.exp(r * dt); // critically damped
  return [e * (d + C2 * dt), e * (r * (d + C2 * dt) + C2)];
}

const cursor = document.querySelector(".cursor");
if (cursor && desktopCursor.matches) {
  const C = MOTION.cursor;
  // Pointer target (where the ring wants to be) vs. rendered ring position.
  let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0;
  let shown = false, running = false, last = 0;

  const render = () => (cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`);
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    [x, vx] = springStep(x - tx, vx, dt, C.stiffness, C.damping, C.mass); x += tx;
    [y, vy] = springStep(y - ty, vy, dt, C.stiffness, C.damping, C.mass); y += ty;
    render();
    // Sleep once the ring has caught up; the next mousemove wakes it.
    if (Math.abs(x - tx) + Math.abs(y - ty) < 0.05 && Math.abs(vx) + Math.abs(vy) < 0.05) {
      x = tx; y = ty; vx = vy = 0; render(); running = false; return;
    }
    requestAnimationFrame(loop);
  };
  const wake = () => {
    if (running) return;
    running = true; last = performance.now(); requestAnimationFrame(loop);
  };

  addEventListener("mousemove", (e) => {
    tx = e.clientX + C.offsetX;
    ty = e.clientY - C.size / 2 + C.offsetY;
    if (!shown) {
      x = tx; y = ty; vx = vy = 0; shown = true; render();
      cursor.style.opacity = 1;
      document.documentElement.classList.add("cursor-none");
    }
    wake();
  }, { passive: true });

  const hideRing = () => {
    cursor.style.opacity = 0; shown = false;
    document.documentElement.classList.remove("cursor-none");
  };
  document.addEventListener("mouseleave", hideRing);
  // The page stops getting mousemove inside an iframe (Glyph Clock, the
  // interactive embeds), so hide the ring there instead of leaving it frozen.
  document.querySelectorAll("iframe").forEach((f) => f.addEventListener("mouseenter", hideRing));
}

// ---------- Falling pills (homepage hero) ----------
// Port of the Framer "Physics" component: random start positions, gravity,
// walls on all sides, drag with mouse or touch. Pills are the real DOM
// elements, moved with transforms.
function startPhysics(stage, { sleeping }) {
  const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Composite, Bounds, Sleeping } = Matter;
  const P = MOTION.physics;
  const engine = Engine.create({ enableSleeping: sleeping, gravity: { x: 0, y: P.gravityY } });
  let W = stage.clientWidth, H = stage.clientHeight;

  // Walls: 100px thick, just outside the visible stage on all four sides.
  const T = 100;
  const wallOpts = { isStatic: true, friction: P.wallFriction };
  const walls = [0, 1, 2, 3].map(() => Bodies.rectangle(0, 0, 1, 1, wallOpts));
  const placeWalls = () => {
    const spec = [
      [W / 2, H + T / 2, W + 2 * T, T], [W / 2, -T / 2, W + 2 * T, T],
      [W + T / 2, H / 2, T, H + 2 * T], [-T / 2, H / 2, T, H + 2 * T],
    ];
    walls.forEach((wall, i) => {
      const [cx, cy, w, h] = spec[i];
      Body.setVertices(wall, [{ x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy + h / 2 }, { x: cx - w / 2, y: cy + h / 2 }]);
      Body.setPosition(wall, { x: cx, y: cy });
    });
  };
  placeWalls();
  World.add(engine.world, walls);

  // Pills: measured once (they're rigid), spawned at random spots inside the
  // stage, retrying so they don't start overlapping each other or a wall.
  const els = [...stage.children];
  const sizes = els.map((el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  const bodies = [];
  sizes.forEach(({ w, h }) => {
    let x, y;
    for (let t = 0; t < P.spawnTries; t++) {
      x = w / 2 + Math.random() * Math.max(0, W - w);
      y = h / 2 + Math.random() * Math.max(0, H - h);
      const box = { min: { x: x - w / 2, y: y - h / 2 }, max: { x: x + w / 2, y: y + h / 2 } };
      if (!bodies.some((b) => Bounds.overlaps(b.bounds, box))) break;
    }
    bodies.push(Bodies.rectangle(x, y, w, h, {
      density: P.density, friction: P.friction, frictionAir: P.frictionAir, restitution: P.restitution,
    }));
  });
  World.add(engine.world, bodies);

  // Dragging. Matter's wheel/touch listeners are removed so the page still
  // scrolls over the hero; touch is re-added so a pill can be dragged on phones.
  const mouse = Mouse.create(stage);
  const drag = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: P.dragStiffness, angularStiffness: P.dragAngularStiffness, render: { visible: false } },
  });
  Composite.add(engine.world, drag);
  ["mousewheel", "DOMMouseScroll", "wheel", "touchstart", "touchmove", "touchend"].forEach((type) =>
    mouse.element.removeEventListener(type, mouse[type])
  );
  stage.addEventListener("touchstart", mouse.mousedown, { passive: true });
  stage.addEventListener("touchmove", (e) => {
    if (!drag.body) return;
    e.preventDefault();       // dragging a pill shouldn't also scroll the page
    mouse.mousemove(e);
  }, { passive: false });
  stage.addEventListener("touchend", (e) => { if (drag.body) mouse.mouseup(e); });
  stage.addEventListener("mouseleave", (e) => mouse.mouseup(e));

  // Keep every pill inside the stage, even after a very fast throw or a resize.
  // Uses the rotated bounding box, with a little slack for normal contact.
  const SLACK = 4;
  const contain = (body) => {
    const { min, max } = body.bounds;
    let dx = 0, dy = 0;
    if (min.x < -SLACK) dx = -min.x; else if (max.x > W + SLACK) dx = W - max.x;
    if (min.y < -SLACK) dy = -min.y; else if (max.y > H + SLACK) dy = H - max.y;
    if (dx || dy) {
      Body.translate(body, { x: dx, y: dy });
      Body.setVelocity(body, { x: 0, y: 0 });
      Sleeping.set(body, false);
    }
  };

  const render = () => {
    bodies.forEach((body, i) => {
      const { w, h } = sizes[i];
      els[i].style.transform =
        `translate3d(${body.position.x - w / 2}px, ${body.position.y - h / 2}px, 0) rotate(${body.angle}rad)`;
    });
  };
  render();
  els.forEach((el) => (el.style.visibility = "visible"));

  // Fixed-step loop: same fall speed on 60Hz and 120Hz screens. Paused while
  // the hero is off-screen, hidden by a breakpoint, or the tab is hidden.
  let running = false, onScreen = false, last = 0, acc = 0;
  const loop = (now) => {
    if (!running) return;
    acc += Math.min(now - last, P.stepMs * P.maxStepsPerFrame);
    last = now;
    while (acc >= P.stepMs) { Engine.update(engine, P.stepMs); acc -= P.stepMs; }
    bodies.forEach(contain);
    render();
    requestAnimationFrame(loop);
  };
  const setRunning = () => {
    const want = onScreen && !document.hidden;
    if (want && !running) { running = true; last = performance.now(); acc = 0; requestAnimationFrame(loop); }
    if (!want) running = false;
  };
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; setRunning(); }).observe(stage);
  document.addEventListener("visibilitychange", setRunning);

  // On resize, move the walls to the new edges and nudge pills back inside —
  // no restart, so whatever the visitor arranged stays put.
  new ResizeObserver(() => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h || (w === W && h === H)) return;
    W = w; H = h;
    placeWalls();
    bodies.forEach(contain);
    bodies.forEach((b) => Sleeping.set(b, false));
    render();
  }).observe(stage);
}

if (window.Matter) {
  const stages = [...document.querySelectorAll("[data-physics]")];
  const started = new Set();
  // Desktop and phone each have their own pill set; start a set the first
  // time it's actually displayed (it may only appear after a resize).
  const startVisible = () => {
    stages.forEach((stage) => {
      if (started.has(stage) || stage.offsetParent === null || !stage.clientHeight) return;
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
