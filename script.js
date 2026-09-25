const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => document.body.classList.add("loaded"), 900);
  $("#year").textContent = new Date().getFullYear();

  setupReveal();
  setupCursor();
  setupProgress();
  setupGallery();
  setupVideos();
  setupGuess();
  setupRandom();
  setupFinal();

  $("#surpriseNav").addEventListener("click", () => secretSurprise());
});

/* ---------- placeholder image ---------- */
function placeholder(img, label) {
  const c = document.createElement("canvas");
  c.width = 800; c.height = 900;
  const x = c.getContext("2d");
  x.fillStyle = "#171a20"; x.fillRect(0, 0, 800, 900);
  x.fillStyle = "#c9b98f";
  x.font = "600 24px Arial";
  x.textAlign = "center";
  x.fillText(label, 400, 450);
  img.src = c.toDataURL();
  img.removeAttribute("onerror");
}

/* ---------- reveal on scroll ---------- */
function setupReveal() {
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(e => io.observe(e));
}

/* ---------- custom cursor ---------- */
function setupCursor() {
  let x = 0, y = 0, rx = 0, ry = 0;
  document.addEventListener("mousemove", e => {
    x = e.clientX; y = e.clientY;
    $("#cursorDot").style.left = x + "px";
    $("#cursorDot").style.top = y + "px";
  });
  (function loop() {
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    $("#cursorRing").style.left = rx + "px";
    $("#cursorRing").style.top = ry + "px";
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", e => {
    if (e.target.closest("button,a,.memory-card,.person,.video-thumb,.guess-photo"))
      document.body.classList.add("cursor-hover");
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest("button,a,.memory-card,.person,.video-thumb,.guess-photo"))
      document.body.classList.remove("cursor-hover");
  });
}

/* ---------- scroll progress ---------- */
function setupProgress() {
  addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    $("#progress span").style.width = (scrollY / h * 100) + "%";
  });
}

/* ---------- photo gallery / modal ---------- */
const cards = [...$$("#memoryGallery .memory-card")];
let active = 0;

function setupGallery() {
  cards.forEach(c => c.addEventListener("click", () => openGallery(+c.dataset.index)));
  $(".modal-close").addEventListener("click", closeGallery);
  $(".modal").addEventListener("click", e => {
    if (e.target.classList.contains("modal")) closeGallery();
  });
  $(".prev").addEventListener("click", () => openGallery((active - 1 + cards.length) % cards.length));
  $(".next").addEventListener("click", () => openGallery((active + 1) % cards.length));
  addEventListener("keydown", e => {
    if (!$(".modal").classList.contains("open")) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowRight") openGallery((active + 1) % cards.length);
    if (e.key === "ArrowLeft") openGallery((active - 1 + cards.length) % cards.length);
  });
}

function openGallery(i) {
  active = i;
  const c = cards[i];
  const img = c.querySelector("img");
  $("#modalImage").src = img.currentSrc || img.src;
  $("#modalImage").alt = img.alt;
  $("#modalTitle").textContent = c.dataset.title;
  $("#modalCaption").textContent = c.dataset.caption;
  $("#modalCount").textContent =
    String(i + 1).padStart(2, "0") + " / " + String(cards.length).padStart(2, "0");
  $("#galleryModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeGallery() {
  $("#galleryModal").classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- video gallery (mixed: local MP4 + YouTube) ---------- */
function setupVideos() {
  const video  = $("#featuredVideo");
  const iframe = $("#featuredIframe");
  const thumbs = [...$$("#videoThumbs .video-thumb")];
  if (!video || !iframe || !thumbs.length) return;

  const countEl = $("#videoCount");
  const titleEl = $("#videoTitle");
  const capEl   = $("#videoCaption");
  const total   = thumbs.length;
  let   current = 0;

  function show(i, autoplay) {
    current = (i + total) % total;
    const t    = thumbs[current];
    const type = t.dataset.type || "local";

    // Reset both players
    try { video.pause(); } catch (_) {}
    video.classList.add("is-hidden");
    iframe.classList.add("is-hidden");
    video.removeAttribute("src");
    video.removeAttribute("poster");
    iframe.src = "about:blank";

    if (type === "youtube") {
      const id = t.dataset.id;
      if (!id) return;
      // Privacy-friendly embed (works better with ad blockers)
      const origin = encodeURIComponent(location.origin);
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}` +
                   `?rel=0&playsinline=1&modestbranding=1&origin=${origin}` +
                   (autoplay ? "&autoplay=1" : "");
      iframe.classList.remove("is-hidden");
    } else {
      video.src = t.dataset.src || "";
      if (t.dataset.poster) video.poster = t.dataset.poster;
      video.load();
      video.classList.remove("is-hidden");
      if (autoplay) {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    }

    countEl.textContent =
      String(current + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    titleEl.textContent = t.dataset.title   || "Class Video";
    capEl.textContent   = t.dataset.caption || "A clip from our ABM journey.";

    thumbs.forEach((x, idx) => x.classList.toggle("is-active", idx === current));
  }

  show(0, false);
  thumbs.forEach((t, i) => t.addEventListener("click", () => show(i, true)));

  document.addEventListener("keydown", e => {
    if ($("#galleryModal").classList.contains("open")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (e.target.matches("input, textarea")) return;

    const activeEl = iframe.classList.contains("is-hidden") ? video : iframe;
    const rect = activeEl.getBoundingClientRect();
    const onScreen = rect.top < innerHeight * 0.85 && rect.bottom > innerHeight * 0.15;
    if (!onScreen) return;

    e.preventDefault();
    show(current + (e.key === "ArrowRight" ? 1 : -1), true);
  });
}

/* ---------- guess game ---------- */
function setupGuess() {
  let revealed = false;
  const photo   = $("#guessPhoto");
  const btn     = $("#revealGuess");

  function reveal() {
    if (revealed) return;
    revealed = true;
    $(".guess-photo").classList.add("revealed");
    $("#guessAnswer").textContent = "It's Your Ma'am Honey! ✨";
    btn.textContent = "Revealed ✓";
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.style.cursor = "default";
    if (photo) photo.style.cursor = "default";
  }

  btn.addEventListener("click", reveal);
  if (photo) photo.addEventListener("click", reveal);
}

/* ---------- memory machine ---------- */
const memories = [
  ["Dance Performance", "Another little piece of our ABM story."],
  ["Unexpected Laughs", "The kind of laughter that starts from something completely random."],
  ["Group Work", "Somehow the deadline always made everyone work faster."],
  ["Classroom Chaos", "Not everything went according to plan—and that's what made it memorable."],
  ["Small Moments", "Sometimes the best memories weren't planned at all."],
  ["One More Photo", "Because apparently one photo is never enough."]
];

function setupRandom() {
  $("#randomBtn").addEventListener("click", () => {
    const m = memories[Math.floor(Math.random() * memories.length)];
    $("#randomResult").innerHTML = `<span>✦</span><p><b>${m[0]}</b><br>${m[1]}</p>`;
    $("#randomResult").animate(
      [{ opacity: 0.2, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
      { duration: 500 }
    );
  });
}

/* ---------- final reveal ---------- */
function setupFinal() {
  $("#finalReveal").addEventListener("click", () => {
    $(".final").classList.add("revealed");
    makeParticles();
    window.scrollTo({ top: document.querySelector(".final").offsetTop, behavior: "smooth" });
  });
}

function makeParticles() {
  const holder = $("#finalParticles");
  for (let i = 0; i < 90; i++) {
    const p = document.createElement("i");
    p.textContent = Math.random() > 0.7 ? "✦" : "·";
    p.style.position = "absolute";
    p.style.left = (20 + Math.random() * 60) + "%";
    p.style.top = (25 + Math.random() * 50) + "%";
    p.style.color = Math.random() > 0.5 ? "#d5b77a" : "#eee9df";
    p.style.fontSize = (8 + Math.random() * 16) + "px";
    holder.appendChild(p);
    const dx = (Math.random() - 0.5) * 600;
    const dy = (Math.random() - 0.5) * 500;
    p.animate([
      { transform: "translate(0,0) scale(.2)", opacity: 0 },
      { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 0.8 },
      { transform: `translate(${dx * 1.2}px,${dy * 1.2}px) scale(.1)`, opacity: 0 }
    ], { duration: 1800 + Math.random() * 1500, delay: Math.random() * 600, easing: "ease-out" })
     .onfinish = () => p.remove();
  }
}

/* ---------- secret surprise ---------- */
function secretSurprise() {
  toast("✦ You found a hidden shortcut. Keep exploring...");
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("span");
    s.textContent = "✦";
    s.style.position = "fixed";
    s.style.left = "50%";
    s.style.top = "50%";
    s.style.zIndex = 110;
    s.style.color = i % 2 ? "#d5b77a" : "#f2eee5";
    s.style.pointerEvents = "none";
    document.body.appendChild(s);
    const dx = (Math.random() - 0.5) * 600;
    const dy = (Math.random() - 0.5) * 500;
    s.animate([
      { transform: "translate(-50%,-50%) scale(.1)", opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(1.2)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 700 })
     .onfinish = () => s.remove();
  }
}

function toast(t) {
  const x = $("#toast");
  x.textContent = t;
  x.classList.add("show");
  setTimeout(() => x.classList.remove("show"), 2400);
}

/* ---------- secret star under memory gallery ---------- */
$(".secret-hint span").addEventListener("click", () => {
  toast("🎁 Secret found: the ordinary days were the memories.");
  document.querySelector(".secret-hint").animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
    { duration: 500 }
  );
});
