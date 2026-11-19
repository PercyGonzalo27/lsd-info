# LSD site — instructions for Claude Code

Static GitHub Pages site for the Ikeuchi Lab **Lunch Science Discussion (LSD)**.
Live: https://percygonzalo27.github.io/lsd-info/ · Repo: `PercyGonzalo27/lsd-info`, branch `main` only.
Background and design rules: `LSD_PROJECT_CONTEXT.md`.

## Ground rules

- **Content lives only in `config.js`**: `SITE` (settings), `SPEAKERS` (one entry per person), `EVENTS` (every session, any order).
- Do **not** touch `index.html`, `styles.css`, `app.js` or `backdrop.js` for content changes. The visual design is fixed.
- The page works out everything else from `EVENTS`: the featured session (nearest one that has not ended), Done/Coming up status, the three counts, and calendar links.
- Times are JST, written `"YYYY-MM-DD HH:MM"` (e.g. `"2026-11-24 12:45"`).
- Pushing requires the `gh` account `PercyGonzalo27` to be active (`gh auth switch -u PercyGonzalo27`).

## "Add an LSD event"

When the user says **"add an LSD event"** (or similar), do this:

1. **Collect the details from the message.**
   Required: **title, date, time, speaker**. If any is missing, **ask before doing anything**.
   Optional: topic, 3 takeaways, room, duration, link.
   Defaults: `duration` = `SITE.defaultDuration` (45), `location` = `SITE.defaultRoom` ("As Room 302, IIS").
   A relative date ("next Tuesday") → work out the absolute date in JST and state it in the report.
2. **Speaker.** If the name is not a key in `SPEAKERS`, add an entry
   (`role`, `affiliation`, `bio` from the message, or ask) and **ask the user for a photo**.
   Save it as `images/firstname-lastname.jpg` (lowercase, ASCII, hyphen), JPG not HEIC, about 800 px wide:
   ```bash
   sips -s format jpeg --resampleWidth 800 "<their file>" --out images/firstname-lastname.jpg
   ```
   (only resample down; if the photo is narrower than 800 px, just convert.) Set `photo: "images/firstname-lastname.jpg"`.
   No photo yet → `photo: ""` (initials show); say so in the report.
3. **Append one entry to `EVENTS`.** Change nothing else in the file.
   ```js
   {
     title: "…",
     start: "YYYY-MM-DD HH:MM",
     duration: 45,
     location: "As Room 302, IIS",
     topic: "…",
     takeaways: ["…", "…", "…"],
     speaker: "Full Name",
     link: ""
   }
   ```
4. **Check** (all must pass — see "Checks" below).
5. **Commit and push**:
   `git add config.js images/ && git commit -m "Add LSD event: <title> (<YYYY-MM-DD>)" && git push`
6. **Confirm the deploy**: `gh api repos/PercyGonzalo27/lsd-info/pages/builds/latest --jq '.status+" "+.commit'`
   until it shows `built` and the new commit, then **report the live URL**
   https://percygonzalo27.github.io/lsd-info/ plus what the checker printed (featured session, counts).

## Edit or cancel a session

- **Edit**: change the fields of that entry in `EVENTS` (find it by title/date). Keep the format above.
  Commit `"Edit LSD event: <title> (<YYYY-MM-DD>)"`.
- **Cancel** (not held): delete its entry from `EVENTS`. Commit `"Cancel LSD event: <title> (<YYYY-MM-DD>)"`.
  The next session becomes featured automatically.
- **Add slides/notes after a talk**: set its `link`; the pop-up then shows "Open notes".
- **Speaker details** (role, bio, photo): edit their entry in `SPEAKERS`; every session updates.
- Never delete a session that already happened unless the user asks — it feeds the archive and counts.

## Checks (before every push)

```bash
node --check config.js && node --check app.js
node tools/check-events.mjs          # validates config.js, prints featured session + counts; exit 1 = fix first
```

Then serve and look in a browser (headless Chrome is fine):

```bash
python3 -m http.server 8000          # pick a free port; 8765 is used by another app on this Mac
```

Confirm: the hero shows the session the checker calls "Featured"; the counts match the checker;
FAQ items open and close; the session's pop-up shows "Add to Google Calendar" and "Save my seat";
"Save my seat" in the pop-up fills the RSVP band with that session; no console errors; no sideways
scroll at 390 px.

`config.js` is loaded as `config.js?v=N` from `index.html`; GitHub Pages caches files for ~10 minutes,
so a new event can take that long to appear for returning visitors. Only bump `?v=N` (on all four
assets) when `app.js`, `styles.css`, `backdrop.js` or the structure of `config.js` changes.

## Other rules

- RSVP posts `name`, `title`, `date` to the Google Apps Script in `SITE.formUrl`. Never submit the
  real form while testing — stub `window.fetch` in the browser.
- Commit messages end with the co-author line the harness provides.
