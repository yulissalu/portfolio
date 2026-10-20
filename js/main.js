// Shared behavior for every page: theme toggle, live clock, scroll fade-ins,
// hover videos, playground lightbox, and the falling pills on the homepage.

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

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();

// ---------- Fade in on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));

// ---------- Play preview videos on hover ----------
document.querySelectorAll(".work-card").forEach((card) => {
  const video = card.querySelector("video");
  if (!video) return;
  card.addEventListener("mouseenter", () => video.play().catch(() => {}));
  card.addEventListener("mouseleave", () => video.pause());
});

// ---------- Playground lightbox ----------
const lightbox = document.querySelector(".lightbox");
if (lightbox) {
  const big = lightbox.appendChild(document.createElement("img"));
  document.querySelectorAll(".archive-grid img").forEach((img) => {
    img.addEventListener("click", () => {
      big.src = img.src;
      big.alt = img.alt;
      lightbox.classList.add("open");
    });
  });
  lightbox.addEventListener("click", () => lightbox.classList.remove("open"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.classList.remove("open");
  });
}

// ---------- Falling pills (homepage hero) ----------
// Uses Matter.js. Each .pill element gets a physics body; the DOM element
// follows it every frame. Pills drop once the hero scrolls into view.
const stage = document.querySelector(".physics");
if (stage && window.Matter) {
  const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;
  const engine = Engine.create();
  engine.gravity.y = 1;

  const pills = [...stage.querySelectorAll(".pill")];
  let bodies = [];
  let walls = [];
  let started = false;

  function buildWalls() {
    Composite.remove(engine.world, walls);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const t = 200;
    walls = [
      Bodies.rectangle(w / 2, h + t / 2, w * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, h / 2, t, h * 4, { isStatic: true }),
      Bodies.rectangle(w + t / 2, h / 2, t, h * 4, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);
  }

  function drop() {
    if (started) return;
    started = true;
    const w = stage.clientWidth;
    bodies = pills.map((el, i) => {
      const bw = el.offsetWidth;
      const bh = el.offsetHeight;
      const x = (w / (pills.length + 1)) * (i + 1);
      const y = -100 - i * 90;
      const opts = { restitution: 0.4, friction: 0.3, angle: (Math.random() - 0.5) * 0.6 };
      const body = el.classList.contains("dot")
        ? Bodies.circle(x, y, bw / 2, opts)
        : Bodies.rectangle(x, y, bw, bh, { ...opts, chamfer: { radius: Math.min(bh / 2, el.classList.contains("square") ? 19 : bh / 2) } });
      body.el = el;
      return body;
    });
    Composite.add(engine.world, bodies);
    Runner.run(Runner.create(), engine);
  }

  Events.on(engine, "afterUpdate", () => {
    bodies.forEach((b) => {
      const { x, y } = b.position;
      b.el.style.transform =
        `translate(${x - b.el.offsetWidth / 2}px, ${y - b.el.offsetHeight / 2}px) rotate(${b.angle}rad)`;
    });
  });

  // Drag pills with the mouse (or a finger)
  const mouse = Mouse.create(stage);
  mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
  mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
  mouse.element.removeEventListener("wheel", mouse.mousewheel);
  Composite.add(engine.world, MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } },
  }));

  // Hide pills above the stage until they drop
  pills.forEach((el) => (el.style.transform = "translate(-9999px, -9999px)"));

  buildWalls();
  window.addEventListener("resize", buildWalls);

  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { drop(); obs.disconnect(); }
  }, { threshold: 0.3 }).observe(stage);
}
