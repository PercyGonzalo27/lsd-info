/* =====================================================================
   app.js  —  page logic. You never need to edit this file.
   Everything you change each week lives in config.js.
   ===================================================================== */
(function () {
"use strict";

window.__lsdReady = false;

/* ---------- 0. Stop early, with a visible message, if config.js is broken ---------- */
if (typeof LAB === "undefined" || typeof SEMINAR === "undefined" || typeof ARCHIVE === "undefined") {
  const banner = document.createElement("div");
  banner.className = "config-error";
  banner.setAttribute("role", "alert");
  banner.innerHTML = 'The page could not read <code>config.js</code>. Make sure it sits next to ' +
    '<code>index.html</code> and that no quote <code>"</code> or comma <code>,</code> is missing in it.';
  document.body.appendChild(banner);
  console.error("[LSD] config.js did not load or has a syntax error.");
  return;
}

/* ---------- Small helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const on = (id, evt, fn) => { const el = $(id); if (el) el.addEventListener(evt, fn); };
const unique = a => { const seen = new Set(), out = []; a.forEach(x => { if (!seen.has(x)) { seen.add(x); out.push(x); } }); return out; };
/* One broken block must never stop the others (this is what keeps the FAQ alive). */
const safe = (name, fn) => { try { fn(); } catch (e) { console.error("[LSD] " + name + " failed:", e); } };

const TZ = "Asia/Tokyo";
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Dates ---------- */
/* "2026-10-16 12:45" is read as Japan time; full ISO strings (with Z or +09:00) work as before. */
function parseWhen(v) {
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    let t = s.replace(" ", "T");
    if (t.length === 16) t += ":00";
    return new Date(t + "+09:00");
  }
  return new Date(s);
}
const fmtDate = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const fmtTime = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) + " JST";
const yearOf = d => d.toLocaleDateString("en-GB", { year: "numeric", timeZone: TZ });

/* Google Calendar wants  YYYYMMDDTHHMMSSZ  (no dashes, colons or milliseconds). */
const gcalStamp = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/* ---------- 2. Speakers and their photos (one photo per person, reused everywhere) ---------- */
function nameKeys(name) {
  const clean = String(name || "").toLowerCase()
    .replace(/\b(dr|prof)\.?\s/g, " ").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  const parts = clean.split(" ").filter(Boolean);
  const last = parts.length ? parts[parts.length - 1] : "";
  const firstInitial = parts.length > 1 ? parts[0].charAt(0) : "";
  /* exact: "yuki hashimoto"   loose: "hashimoto|y"  (so "Y. Hashimoto" finds "Yuki Hashimoto") */
  return { exact: clean, loose: last + "|" + firstInitial };
}
function initialsOf(name) {
  const parts = String(name || "?").replace(/\b(Dr|Prof)\.?\s/gi, "").replace(/\./g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase();
}

const photoByExact = new Map(), photoByLoose = new Map();
function registerPhoto(name, file) {
  if (!name || !file) return;
  const k = nameKeys(name);
  photoByExact.set(k.exact, file);
  if (!photoByLoose.has(k.loose)) photoByLoose.set(k.loose, file);
}
if (typeof SPEAKER_PHOTOS !== "undefined" && SPEAKER_PHOTOS) {
  Object.keys(SPEAKER_PHOTOS).forEach(n => registerPhoto(n, SPEAKER_PHOTOS[n]));
}
if (SEMINAR.speaker && typeof SEMINAR.speaker === "object") registerPhoto(SEMINAR.speaker.name, SEMINAR.speaker.photo);

function photoFileFor(name, ownFile) {
  if (ownFile) return ownFile;
  const k = nameKeys(name);
  return photoByExact.get(k.exact) || photoByLoose.get(k.loose) || "";
}

let PHOTO_DIR = (typeof PHOTO_FOLDER === "string") ? PHOTO_FOLDER.trim().replace(/^\.?\//, "") : "images/";
if (PHOTO_DIR && !/\/$/.test(PHOTO_DIR)) PHOTO_DIR += "/";

/* Every place a picture might reasonably be: the folder, then the site root,
   and common extension / capital-letter variants (GitHub file names are case-sensitive). */
function photoCandidates(file) {
  const raw = String(file).trim();
  if (/^(https?:)?\/\//i.test(raw) || /^data:/i.test(raw)) return [raw];
  const clean = raw.replace(/^\.?\//, "");
  const slash = clean.lastIndexOf("/");
  const dir = slash >= 0 ? clean.slice(0, slash + 1) : "";
  const leaf = clean.slice(slash + 1);
  const dot = leaf.lastIndexOf(".");
  const base = dot > 0 ? leaf.slice(0, dot) : leaf;
  const ext = dot > 0 ? leaf.slice(dot + 1) : "";
  const dirs = dir ? [dir] : unique([PHOTO_DIR, ""]);
  const exts = unique([ext, "jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"].filter(Boolean));
  const bases = unique([base, base.toLowerCase()]);
  const out = [];
  dirs.forEach(d => out.push(d + leaf));
  dirs.forEach(d => bases.forEach(b => exts.forEach(e => out.push(d + b + "." + e))));
  return unique(out).map(encodeURI);
}

const probeCache = new Map();   // file name -> Promise(working URL or null): each photo is looked up once
function probe(url) {
  return new Promise(resolve => {
    const im = new Image();
    im.onload = () => resolve(true);
    im.onerror = () => resolve(false);
    im.src = url;
  });
}
function resolvePhoto(file) {
  if (!file) return Promise.resolve(null);
  if (probeCache.has(file)) return probeCache.get(file);
  const p = (async () => {
    const list = photoCandidates(file);
    for (let i = 0; i < list.length; i++) { if (await probe(list[i])) return list[i]; }
    const hint = /\.hei[cf]$/i.test(file) ? " HEIC photos do not display in most browsers: export it as JPG." : "";
    console.warn("[LSD] Photo not found for \"" + file + "\". Tried: " + list.join(", ") + "." + hint);
    return null;
  })();
  probeCache.set(file, p);
  return p;
}

/* Markup for a photo: initials show instantly, the picture fades in when it is found. */
function photoHTML(s) {
  const img = s.photoFile
    ? '<img class="photo" alt="' + esc(s.speaker.name) + '" data-photo="' + esc(s.photoFile) + '" decoding="async">'
    : "";
  return '<div class="photo-wrap"><div class="photo-initials" aria-hidden="true">' + esc(initialsOf(s.speaker.name)) + "</div>" + img + "</div>";
}
function hydratePhotos(root) {
  (root || document).querySelectorAll("img.photo[data-photo]").forEach(img => {
    if (img.getAttribute("data-hydrated")) return;
    img.setAttribute("data-hydrated", "1");
    resolvePhoto(img.getAttribute("data-photo")).then(url => {
      if (!url) { img.remove(); return; }           // keep the initials
      const show = () => {
        img.classList.add("is-loaded");
        const ini = img.parentNode && img.parentNode.querySelector(".photo-initials");
        if (ini) ini.style.display = "none";
      };
      img.addEventListener("load", show);
      img.src = url;
      if (img.complete && img.naturalWidth) show();
    });
  });
}

/* ---------- 3. Sessions ---------- */
function normalise(x, isCurrent) {
  const base = { name: "", role: "", affiliation: "", bio: "", photo: "" };
  const sp = typeof x.speaker === "string" ? Object.assign(base, { name: x.speaker }) : Object.assign(base, x.speaker || {});
  return {
    title: x.title, start: x.start, startDate: parseWhen(x.start),
    duration: x.duration || SEMINAR.duration || 45,
    topic: x.topic || "", speaker: sp, link: x.link || "",
    photoFile: photoFileFor(sp.name, sp.photo),
    isCurrent: !!isCurrent
  };
}
const CURRENT = normalise(SEMINAR, true);
/* If the same session was also pre-filled in ARCHIVE, the richer SEMINAR entry wins. */
const ALL = ARCHIVE.map(x => normalise(x, false))
  .filter(s => s.startDate.getTime() !== CURRENT.startDate.getTime())
  .concat([CURRENT]);
const NOW = new Date();
ALL.forEach(s => {
  s.status = s.startDate < NOW ? "done" : "upcoming";
  s.isThis = s.isCurrent && s.status === "upcoming";
});
const DONE = ALL.filter(s => s.status === "done").sort((a, b) => b.startDate - a.startDate);
const UPCOMING = ALL.filter(s => s.status === "upcoming").sort((a, b) => a.startDate - b.startDate);

function calUrl(s) {
  const end = new Date(s.startDate.getTime() + s.duration * 60000);
  return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(LAB.series + ": " + s.title) +
    "&dates=" + gcalStamp(s.startDate) + "/" + gcalStamp(end) +
    "&details=" + encodeURIComponent((s.topic || "") + "\n\nLeading: " + s.speaker.name + "\nIkeuchi Lab · English · Bring your lunch.") +
    "&location=" + encodeURIComponent(SEMINAR.location);
}
function statusBadge(s) {
  if (s.isThis) return '<span class="badge badge-thisweek">This week</span>';
  if (s.status === "done") return '<span class="badge badge-done">Done</span>';
  return '<span class="badge badge-upcoming">Coming up</span>';
}

/* ---------- 4. Scroll reveal (if anything fails, index.html un-hides all sections after 3.5 s) ---------- */
const metricData = {};
function countUp(el, to) {
  if (reduceMotion) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1200;
  const step = t => {
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function setupReveal() {
  const targets = document.querySelectorAll("[data-reveal],[data-stagger],[data-fan]");
  const showAll = () => {
    targets.forEach(el => el.classList.add("is-in"));
    Object.keys(metricData).forEach(id => setText(id, metricData[id]));
  };
  if (reduceMotion || !("IntersectionObserver" in window)) { showAll(); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      en.target.querySelectorAll('[id^="m-"]').forEach(el => {
        if (metricData[el.id] != null) countUp(el, metricData[el.id]);
      });
      io.unobserve(en.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
  targets.forEach(el => io.observe(el));
}

/* ---------- 5. Fill the page ---------- */
safe("hero + this week", () => {
  const sd = CURRENT.startDate;
  const meta = $("heroMeta");
  if (meta) meta.innerHTML = [["When", fmtDate(sd)], ["Time", fmtTime(sd)], ["Length", SEMINAR.duration + " min"],
    ["Room", SEMINAR.location], ["Language", LAB.language]]
    .map(kv => '<div><dt class="kicker">' + esc(kv[0]) + "</dt><dd>" + esc(kv[1]) + "</dd></div>").join("");

  ["calBtn", "calBtnSp"].forEach(id => { const a = $(id); if (a) a.href = calUrl(CURRENT); });
  setText("ruleLen", SEMINAR.duration + " minutes");
  setText("weekTitle", SEMINAR.title);

  const topic = $("weekTopic");
  if (topic) topic.innerHTML = String(SEMINAR.topic).split(/\n\s*\n/)
    .map(p => '<p style="margin-bottom:12px">' + esc(p) + "</p>").join("");

  const tk = $("takeaways");
  if (tk) tk.innerHTML = (SEMINAR.takeaways || []).map(t =>
    '<div class="takeaway-row"><span class="takeaway-num">' + esc(t.num) + '</span>' +
    '<span style="font-size:14px;line-height:1.6">' + esc(t.text) + "</span></div>").join("");

  setText("spName", CURRENT.speaker.name);
  setText("spRole", CURRENT.speaker.role);
  setText("spAff", CURRENT.speaker.affiliation);
  setText("spBio", CURRENT.speaker.bio);
  const ph = $("speakerPhoto");
  if (ph) { ph.innerHTML = photoHTML(CURRENT); hydratePhotos(ph); }

  setText("footerEmail", SEMINAR.contact);
  const fc = $("footerContact"); if (fc) fc.href = "mailto:" + SEMINAR.contact;
  setText("footerYear", new Date().getFullYear());
});

safe("metrics", () => {
  const speakers = new Set(ALL.map(s => nameKeys(s.speaker.name).loose));
  metricData["m-done"] = DONE.length;
  metricData["m-upcoming"] = UPCOMING.length;
  metricData["m-speakers"] = speakers.size;
});

/* ---------- 6. FAQ (one delegated listener: robust and simple) ---------- */
safe("faq", () => {
  const list = $("faqList");
  if (!list) return;
  list.innerHTML = (SEMINAR.faq || []).map((f, i) => {
    const open = i === 0;
    return '<div class="faq-item' + (open ? " open" : "") + '">' +
      '<button type="button" class="faq-btn" id="faq-q-' + i + '" aria-expanded="' + open + '" aria-controls="faq-a-' + i + '">' +
        "<span>" + esc(f.q) + "</span>" +
        '<svg class="ico faq-chev" aria-hidden="true"><use href="#i-chevron-d"/></svg>' +
      "</button>" +
      '<div class="faq-body" id="faq-a-' + i + '" role="region" aria-labelledby="faq-q-' + i + '">' +
        '<div><p class="faq-answer">' + esc(f.a) + "</p></div></div></div>";
  }).join("");

  list.addEventListener("click", e => {
    const btn = e.target.closest ? e.target.closest(".faq-btn") : null;
    if (!btn || !list.contains(btn)) return;
    const item = btn.closest(".faq-item");
    const isOpen = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });
});

/* ---------- 7. "Save my seat" ---------- */
safe("rsvp", () => {
  const form = $("rsvpForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const input = $("nameInput");
    const name = input ? input.value.trim() : "";
    const status = $("rsvpStatus");
    if (!name) { if (status) status.textContent = "Please type your name first."; return; }

    if (SEMINAR.formUrl) {
      /* Send name + session context so every spreadsheet row is self-contained. */
      const body = new URLSearchParams();
      body.append("name",  name);
      body.append("title", SEMINAR.title);
      body.append("date",  fmtDate(CURRENT.startDate) + " " + fmtTime(CURRENT.startDate));
      fetch(SEMINAR.formUrl, { method: "POST", mode: "no-cors", body: body }).catch(() => {});
    }
    if (status) status.textContent = "Thanks, " + name + ". You're on the list.";
    const after = $("calAfter"); if (after) after.style.display = "block";
    const cal2 = $("calBtn2"); if (cal2) cal2.href = calUrl(CURRENT);
    if (input) input.value = "";
  });
});

/* ---------- 8. Detail pop-up ---------- */
let lastFocus = null;
const modal = $("modal");
function openModal(s) {
  if (!modal) return;
  const done = s.status === "done";
  lastFocus = document.activeElement;
  const img = $("mImg"); if (img) { img.innerHTML = photoHTML(s); hydratePhotos(img); }
  const badge = $("mBadge");
  if (badge) {
    badge.className = "badge " + (s.isThis ? "badge-thisweek" : done ? "badge-done" : "badge-upcoming");
    badge.textContent = s.isThis ? "This week" : done ? "Done" : "Coming up";
  }
  setText("mDate", fmtDate(s.startDate) + " · " + fmtTime(s.startDate));
  setText("mTitle", s.title);
  setText("mSpeaker", [s.speaker.name, s.speaker.role, s.speaker.affiliation].filter(Boolean).join(" · "));
  setText("mTopic", s.topic);
  let actions = "";
  if (done && s.link) actions += '<a href="' + esc(s.link) + '" target="_blank" rel="noopener" class="btn btn-cyan">Open notes</a>';
  if (!done) {
    actions += '<a href="' + esc(calUrl(s)) + '" target="_blank" rel="noopener" class="btn btn-cyan">Add to Calendar</a>';
    actions += '<a href="#join" data-close class="btn btn-ghost">Save my seat</a>';
  }
  const act = $("mActions"); if (act) act.innerHTML = actions;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  const close = $("mClose"); if (close) close.focus();
}
function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  document.body.style.overflow = "";
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
}
safe("modal", () => {
  if (!modal) return;
  on("mClose", "click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal || e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });
});

/* ---------- 9. Previous sessions: stacked carousel ---------- */
let active = 0;
function renderStack() {
  const stack = $("stack");
  if (!stack) return;
  stack.innerHTML = "";
  const n = DONE.length, prev = $("prevBtn"), next = $("nextBtn");
  if (!n) {
    stack.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--muted);font-size:14px">No sessions held yet.</div>';
    if (prev) prev.style.display = "none"; if (next) next.style.display = "none";
    return;
  }
  if (prev) prev.style.display = n < 2 ? "none" : "grid";
  if (next) next.style.display = n < 2 ? "none" : "grid";
  const gap = window.innerWidth < 600 ? 100 : window.innerWidth < 900 ? 150 : 230;

  DONE.forEach((s, i) => {
    let off = ((i - active) % n + n) % n;
    if (off > n / 2) off -= n;
    if (Math.abs(off) > 2) return;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "stack-card";
    card.setAttribute("aria-label", "Open: " + s.title);
    card.style.transform = "translate(calc(-50% + " + (off * gap) + "px),-50%) rotate(" + (off * 5) + "deg) scale(" + (1 - Math.abs(off) * 0.1) + ")";
    card.style.zIndex = 10 - Math.abs(off);
    card.style.opacity = Math.abs(off) === 2 ? 0.4 : 1;
    card.innerHTML =
      '<span style="width:100%;height:100%;background:var(--surface);border:1px solid var(--purple);padding:10px;display:flex;flex-direction:column;box-shadow:0 0 40px -6px rgba(155,81,224,.5)">' +
        '<span style="flex:1;position:relative;overflow:hidden;min-height:0;display:block">' + photoHTML(s) + "</span>" +
        '<span style="display:block;text-align:center;font-size:11px;font-weight:800;color:var(--muted);padding-top:8px;letter-spacing:.08em">' +
          esc(LAB.short) + " · " + esc(yearOf(s.startDate)) + "</span></span>";
    card.addEventListener("click", () => { if (off === 0) openModal(s); else { active = i; renderStack(); } });
    stack.appendChild(card);
  });
  hydratePhotos(stack);
}
safe("carousel", () => {
  on("prevBtn", "click", () => { active = (active - 1 + DONE.length) % DONE.length; renderStack(); });
  on("nextBtn", "click", () => { active = (active + 1) % DONE.length; renderStack(); });
  let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(renderStack, 150); });
  renderStack();
});

/* ---------- 10. All sessions grid: filters, search ---------- */
let activeFilter = "all", shownList = [];
function renderGrid() {
  const grid = $("archGrid");
  if (!grid) return;
  const search = $("archSearch");
  const q = search ? search.value.trim().toLowerCase() : "";
  let list = activeFilter === "done" ? DONE : activeFilter === "upcoming" ? UPCOMING : UPCOMING.concat(DONE);
  list = list.filter(s => !q || (s.title + " " + (s.topic || "") + " " + s.speaker.name).toLowerCase().indexOf(q) !== -1);
  shownList = list;
  grid.innerHTML = list.map((s, i) =>
    '<div class="arch-card' + (s.isThis ? " is-thisweek" : "") + '" role="button" tabindex="0" data-i="' + i + '" aria-label="Open: ' + esc(s.title) + '">' +
      '<div class="arch-card-img">' + photoHTML(s) + "</div>" +
      '<div class="arch-card-body">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px">' +
          '<span style="font-size:12px;color:var(--cyan)">' + esc(fmtDate(s.startDate)) + "</span>" + statusBadge(s) + "</div>" +
        '<div class="arch-card-title">' + esc(s.title) + "</div>" +
        '<div class="arch-card-speaker">' + esc(s.speaker.name) + "</div>" +
      "</div></div>").join("");
  hydratePhotos(grid);
  const empty = $("archEmpty"); if (empty) empty.style.display = list.length ? "none" : "block";
}
safe("archive grid", () => {
  const grid = $("archGrid");
  if (grid) {
    const open = e => {
      const card = e.target.closest ? e.target.closest(".arch-card") : null;
      if (card && shownList[+card.getAttribute("data-i")]) openModal(shownList[+card.getAttribute("data-i")]);
    };
    grid.addEventListener("click", open);
    grid.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); } });
  }
  document.querySelectorAll("#tabs .tab-btn").forEach(btn => btn.addEventListener("click", () => {
    activeFilter = btn.getAttribute("data-filter");
    document.querySelectorAll("#tabs .tab-btn").forEach(b => b.setAttribute("aria-selected", String(b === btn)));
    renderGrid();
  }));
  on("archSearch", "input", renderGrid);
  renderGrid();
});

/* ---------- 11. Nav background on scroll ---------- */
safe("nav", () => {
  const nav = $("nav");
  if (!nav) return;
  window.addEventListener("scroll", () => {
    nav.style.background = window.scrollY > 10 ? "rgba(22,29,48,.98)" : "var(--surface)";
  }, { passive: true });
});

/* ---------- Go ---------- */
safe("reveal", setupReveal);
window.__lsdReady = true;
})();
