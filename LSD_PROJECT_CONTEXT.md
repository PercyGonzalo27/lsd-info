# Ikeuchi Lab — Lunch Science Discussion (LSD) · Project Context

> Last updated: 19 November 2026
> Maintained by: Gonzalo Sifuentes (sifuentesgonzalo@g.ecc.u-tokyo.ac.jp)
> Repository: `github.com/PercyGonzalo27/lsd-info`
> Live site: `https://percygonzalo27.github.io/lsd-info/`

---

## 1. What this project is

A static landing page hosted on **GitHub Pages** for a weekly event called the **Lunch Science Discussion (LSD)**, organised by Gonzalo Sifuentes at the **Ikeuchi Laboratory, Institute of Industrial Science (IIS), University of Tokyo**.

**What LSD is:**
- Held every week during the lunch break
- 45 minutes long
- Open to every Ikeuchi Lab member equally (professors, students, postdocs)
- Discussion format — not a one-way lecture; everyone shares what they know
- Held in English
- Attendees bring and eat their lunch during the session

The name is intentionally playful: **L**unch **S**cience **D**iscussion.

---

## 2. Repository file structure

```
lsd-info/
├── index.html               ← HTML skeleton. Never edit for content changes.
├── config.js                ← THE ONLY FILE THAT CHANGES (SITE, SPEAKERS, EVENTS)
├── app.js                   ← All page logic. Edit only for feature changes.
├── styles.css               ← All CSS (HUD look). Edit only for design changes.
├── backdrop.js              ← Animated "neuron" background (decoration only)
├── images/                  ← Speaker photos: firstname-lastname.jpg
│   └── gonzalo.jpg
├── tools/check-events.mjs   ← Validates config.js before a push (not loaded by the site)
├── CLAUDE.md                ← Instructions Claude Code follows ("add an LSD event")
└── LSD_PROJECT_CONTEXT.md   ← This file
```

**Rule:** `config.js` is the only file that changes for content. Everything else is infrastructure.

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Hosting | GitHub Pages (free) | Zero cost, deploys on git push |
| CSS | Plain CSS, mobile-first (no framework, no build step) | Light and fast |
| Fonts | Archivo 400/600/800 (Google Fonts) + system monospace for HUD labels | No extra font downloads |
| Icons | Custom inline SVG sprite in `index.html` | Neuroscience icons |
| Hero visual | Inline SVG neural network (4 → 5 → 3 nodes) with travelling pulses | |
| Background | `backdrop.js`: canvas of drifting dots that occasionally "fire" and link to neighbours, plus CSS colour hazes | ~4 kB, pauses when tab hidden, still with reduced motion |
| Attendance | Google Apps Script → Google Sheets | Public webhook URL, no secrets |

---

## 4. Visual design ("HUD glass", dark only)

Colours are defined once in `:root` in `styles.css`:

| Token | Hex | Role | Contrast on `--bg` |
|---|---|---|---|
| `--bg` | `#0B0F19` | Page background | — |
| `--surface` | `#161D30` | Cards (as semi-transparent glass) | — |
| `--cyan` | `#00F2FE` | Actions, signals, active states | 13.8:1 |
| `--purple` | `#9B51E0` | Glows, outlines, large text only | 4.2:1 |
| `--purple-text` | `#BE92E9` | Tint of purple for small text (badges, pills) | 7.7:1 |
| `--green` | `#0FFF95` | "Done" badges, live dot | 14.4:1 |
| `--text` | `#F3F4F6` | Headings, primary text | 17.4:1 |
| `--muted` | `#9CA3AF` | Body and secondary text | 7.5:1 |

Style elements: glass cards (rounded 16 px), pill buttons, gradient headings, mono channel labels
above each section (`CH01 · _THIS_WEEK`, `CH02 · _WHAT_IS_LSD`, `CH03 · _ARCHIVE`, `CH04 · _FAQ`),
and a nav "channel tray" (`01 This week · 02 What is LSD · 03 Archive · 04 FAQ`) that highlights the
section on screen. The "Save my seat" band is the only solid-cyan block (single call to action).

---

## 5. Section order (as it appears on the page)

1. **Sticky nav** — Ikeuchi Lab · LSD + channel tray + "Save my seat"
2. **Hero** — Animated neural network, L/S/D pills, featured session facts, calendar button
3. **This week** (CH01) — featured session: title, topic, 3 takeaways, speaker card with photo
4. **Save your seat** — cyan RSVP band → Google Sheets
5. **What is LSD?** (CH02) — 3 rule cards
6. **Metrics** — sessions held / sessions planned / speakers so far (calculated)
7. **Previously on LSD** (CH03) — carousel of finished sessions + filterable, searchable grid
8. **Good to know** (CH04) — FAQ accordion, first item open
9. **Footer** — contact email

---

## 6. config.js — the only file you edit

```js
const SITE = {
  name: "Ikeuchi Lab", series: "Lunch Science Discussion", short: "LSD", language: "English",
  defaultRoom: "As Room 302, IIS",   // used when an event has no location
  defaultDuration: 45,               // minutes
  contact: "sifuentesgonzalo@g.ecc.u-tokyo.ac.jp",
  formUrl: "https://script.google.com/macros/s/.../exec",   // RSVP → Google Sheets
  faq: [ { q: "...", a: "..." }, ... ]
};

const SPEAKERS = {                     // one entry per person, keyed by full name
  "Gonzalo Sifuentes": { role: "Masters 2nd year", affiliation: "Ikeuchi Lab, IIS, University of Tokyo",
                         bio: "...", photo: "images/gonzalo.jpg" }
};

const EVENTS = [                       // every session, past and future, any order
  { title: "...", start: "2026-11-24 12:45", duration: 45, location: "As Room 302, IIS",
    topic: "...", takeaways: ["...", "...", "..."], speaker: "Gonzalo Sifuentes", link: "" }
];
```

**What the page works out by itself:**
- **Featured session** (hero, This week, RSVP band, calendar buttons) = the nearest session that has not ended. When it ends, the next one takes over automatically.
- Sessions that have ended show as **Done** in the archive; others as **Coming up** (the featured one as **This week**).
- **Counts:** held = finished sessions; planned = upcoming sessions; speakers so far = different speakers of finished sessions.
- **Nothing upcoming:** hero shows "Next session: To be announced", calendar buttons and the speaker card are hidden, RSVP says no session is open.
- **No finished sessions yet:** the carousel and the Done/All lists show one card "(Upcoming) — past sessions will appear here".
- Any upcoming session's pop-up has **Add to Google Calendar** (its own date/room) and **Save my seat**, which switches the RSVP band to that session (the band then names it). Finished sessions show **Open notes** if `link` is set.

**Time format:** `"2026-11-27 12:45"` = 12:45 Japan time.

---

## 7. Adding, editing, cancelling sessions

With Claude Code, say **"add an LSD event"** with title, date, time and speaker (topic and takeaways optional).
`CLAUDE.md` holds the full procedure: it adds the speaker if new (and asks for a photo), appends one entry to
`EVENTS`, runs the checks, commits `Add LSD event: <title> (<date>)`, pushes, and reports the live URL.

- **Edit:** change that entry in `EVENTS`.
- **Cancel:** delete the entry. The next session becomes featured.
- **Notes after a talk:** set its `link`.

By hand: edit `config.js`, run `node tools/check-events.mjs`, then `git commit` and `git push`.

---

## 8. Speaker photos

- One photo per person in `images/`, named `firstname-lastname.jpg`, about 800 px wide, JPG (not HEIC).
- Linked once in `SPEAKERS[...].photo`; reused for every session by that speaker (speaker card, archive cards, carousel, pop-up).
- Missing photo or speaker not in `SPEAKERS` → initials (e.g. "GS") and a console warning; the page never breaks.
- The app also tries `.jpeg`/`.png`/`.webp` and lower-case variants if the exact file is missing.
- **iPhone HEIC:** convert first, e.g. `sips -s format jpeg --resampleWidth 800 photo.heic --out images/name.jpg`.

---

## 9. app.js — key behaviours

- **Config guard:** if `config.js` fails to load or `SITE`/`EVENTS` are missing, a red banner explains the problem.
- **Each page block runs separately** (`safe(...)`), so one error cannot break the FAQ or the rest of the page.
- **FAQ:** one delegated click listener; `.faq-item.open .faq-body { grid-template-rows: 1fr }` does the expand.
- **Scroll reveals:** `IntersectionObserver`; if `app.js` fails, `index.html` un-hides everything after 3.5 s.
- **Nav:** stays at the top; the link of the section on screen is highlighted (`aria-current`).
- **Calendar links:** `YYYYMMDDTHHmmssZ` stamps; location = that session's room.

---

## 10. RSVP → Google Sheets

The RSVP form POSTs `name`, `title`, `date` to the Apps Script in `SITE.formUrl`, which appends a row
(Timestamp, Session, Date, Name). `title`/`date` are those of the session the band is set to (the
featured one unless a pop-up switched it).

Apps Script (Extensions → Apps Script in the "LSD Attendance" sheet, deployed as a web app, access: Anyone):

```js
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = e.parameter;
    sheet.appendRow([new Date(), data.title || "", data.date || "", data.name || ""]);
    if (sheet.getLastRow() === 2) {
      sheet.getRange("A1:D1").setValues([["Timestamp","Session","Date","Name"]]);
      sheet.getRange("A1:D1").setFontWeight("bold");
    }
  } catch(err) { Logger.log(err); }
  return ContentService.createTextOutput("ok");
}
function doGet(e) { return ContentService.createTextOutput("LSD attendance endpoint is running."); }
```

The URL is public by design (it only appends rows). Never submit the real form while testing.

---

## 11. Deployment: GitHub Pages

- Settings → Pages → Deploy from branch `main`, folder `/ (root)`.
- Deploys about 60 s after a push. Check: `gh api repos/PercyGonzalo27/lsd-info/pages/builds/latest`.
- Only branch `main` is used. Pushing needs the `gh` account `PercyGonzalo27` active.
- **Caching:** assets load as `file?v=N`. Bump `N` on all four when `app.js`, `styles.css`, `backdrop.js` or the *structure* of `config.js` changes. New events need no bump (Pages caches ~10 min).

---

## 12. Mobile / iPhone

Mobile-first CSS with overrides at 600 / 720 / 900 / 1080 px; safe-area insets for notch and home bar;
44 px touch targets; 16 px inputs (no Safari zoom); no sideways scroll down to 360 px (overflow is clipped
per section because iOS ignores `overflow-x` on `html`); pop-up slides up from the bottom on phones;
`prefers-reduced-motion` stops all drifting and animation.

---

## 13. History of fixes

| Issue | Fix |
|---|---|
| FAQ not opening | Added `.faq-item.open .faq-body { grid-template-rows: 1fr }` |
| Speaker photo not showing | Multi-candidate photo probing; console lists the paths tried |
| Calendar URL had extra digits | `gcalStamp()` produces clean `YYYYMMDDTHHmmssZ` |
| RSVP only sent the name | Sends `name`, `title`, `date` |
| Sections invisible after a JS error | 3.5 s safety timer in `index.html` |
| Broken `config.js` broke the page | Red banner + per-block `safe()` |
| "What is LSD?" grid broken by a stray `</div>` | Fixed (Nov 2026 redesign) |
| Nav stopped sticking after the redesign | `overflow-x` removed from `body`; clipping per section |
| Weekly copy-paste of SEMINAR into ARCHIVE | Replaced by one `EVENTS` list + `SPEAKERS` (Nov 2026) |

---

## 14. Icons in the SVG sprite (index.html)

`i-brain`, `i-synapse`, `i-electrode`, `i-wave`, `i-network`, `i-utensils`, `i-stopwatch`, `i-users`,
`i-message-sq`, `i-bento`, `i-globe`, `i-calendar`, `i-clock`, `i-pin`, `i-search`, `i-arrow-l`,
`i-arrow-r`, `i-x`, `i-chevron-d`, `i-mail`, `i-user`, `i-flask` — use `<svg class="ico"><use href="#i-NAME"/></svg>`.

---

## 15. Open items

- [ ] Add more sessions and speaker photos ("add an LSD event").
- [ ] Verify on a real iPhone after deployments (FAQ, photo, calendar button, Save my seat from a pop-up).
- [ ] Consider a compact section nav on phones (links are hidden below 900 px; only "Save my seat" shows).
- [ ] Consider a "suggest a topic" button and a QR code to the site for showing during sessions.
