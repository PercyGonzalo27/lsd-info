#!/usr/bin/env node
/* =====================================================================
   tools/check-events.mjs — check config.js before pushing.
   Usage:   node tools/check-events.mjs [--now "YYYY-MM-DD HH:MM"]
   Reads SITE, SPEAKERS and EVENTS the same way the page does, reports
   mistakes, and prints what the page will show (featured session, counts).
   Exit code 1 if anything must be fixed. Not loaded by the website.
   ===================================================================== */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], warnings = [];

let SITE, SPEAKERS, EVENTS;
try {
  const ctx = vm.createContext({});
  vm.runInContext(readFileSync(join(root, "config.js"), "utf8") +
    "\n;this.__out = { SITE, SPEAKERS: typeof SPEAKERS === 'undefined' ? {} : SPEAKERS, EVENTS };", ctx);
  ({ SITE, SPEAKERS, EVENTS } = ctx.__out);
} catch (e) {
  console.error("✗ config.js cannot be read: " + e.message);
  process.exit(1);
}

const jst = s => new Date(String(s).trim().replace(" ", "T") + ":00+09:00");
const fmt = d => d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) + " JST";
const key = n => String(n || "").toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
const speakerKeys = new Map(Object.keys(SPEAKERS).map(n => [key(n), n]));

if (!Array.isArray(EVENTS)) { console.error("✗ EVENTS must be a list [ ... ]"); process.exit(1); }
for (const f of ["series", "short", "language", "defaultRoom", "defaultDuration", "contact"])
  if (SITE[f] == null || SITE[f] === "") errors.push(`SITE.${f} is empty`);

/* Speakers: photo must exist and be a JPG/PNG/WebP (not HEIC). */
for (const [name, sp] of Object.entries(SPEAKERS)) {
  if (!sp.photo) { warnings.push(`${name}: no photo, initials will be shown`); continue; }
  if (/\.hei[cf]$/i.test(sp.photo)) errors.push(`${name}: photo "${sp.photo}" is HEIC, browsers cannot show it — export as JPG`);
  else if (!/^https?:/i.test(sp.photo) && !existsSync(join(root, sp.photo))) errors.push(`${name}: photo "${sp.photo}" not found in the repository`);
}

/* Events */
const starts = new Map();
const list = EVENTS.map((e, i) => {
  const label = `EVENTS[${i}] "${e.title || "(no title)"}"`;
  if (!e.title) errors.push(`${label}: title is missing`);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(e.start || "")))
    errors.push(`${label}: start "${e.start}" must look like "2026-11-24 12:45"`);
  const start = jst(e.start);
  /* Round-trip so impossible dates such as 2026-11-31 are caught (JS would roll them over). */
  const back = isNaN(start) ? "" : new Date(start.getTime() + 9 * 3600000).toISOString().slice(0, 16).replace("T", " ");
  if (isNaN(start) || back !== String(e.start).trim()) errors.push(`${label}: start "${e.start}" is not a real date/time`);
  if (!e.speaker) errors.push(`${label}: speaker is missing`);
  else if (!speakerKeys.has(key(e.speaker))) warnings.push(`${label}: speaker "${e.speaker}" is not in SPEAKERS (initials will show)`);
  if (e.duration != null && !(+e.duration > 0)) errors.push(`${label}: duration must be a number of minutes`);
  if (e.takeaways != null && !Array.isArray(e.takeaways)) errors.push(`${label}: takeaways must be a list ["", "", ""]`);
  else if ((e.takeaways || []).length !== 3) warnings.push(`${label}: has ${(e.takeaways || []).length} takeaways (3 expected)`);
  if (!e.topic) warnings.push(`${label}: topic is empty`);
  if (!isNaN(start)) {
    const k = start.getTime();
    if (starts.has(k)) warnings.push(`${label}: same start time as "${starts.get(k)}"`);
    starts.set(k, e.title);
  }
  const duration = +e.duration || SITE.defaultDuration || 45;
  return { title: e.title, speaker: e.speaker, start, end: new Date(start.getTime() + duration * 60000),
    location: e.location || SITE.defaultRoom, duration };
}).filter(e => !isNaN(e.start));

/* What the page will show */
const nowArg = process.argv.indexOf("--now");
const NOW = nowArg > 0 ? jst(process.argv[nowArg + 1]) : new Date();
const done = list.filter(e => e.end <= NOW).sort((a, b) => b.start - a.start);
const upcoming = list.filter(e => e.end > NOW).sort((a, b) => a.start - b.start);
const featured = upcoming[0];
const speakersSoFar = new Set(done.map(e => key(e.speaker))).size;

console.log(`Now: ${fmt(NOW)}`);
console.log(featured
  ? `Featured: "${featured.title}" — ${fmt(featured.start)}, ${featured.duration} min, ${featured.location}, ${featured.speaker}`
  : "Featured: none → hero shows \"Next session: to be announced\"");
console.log(`Counts (held / planned / speakers): ${done.length} / ${upcoming.length} / ${speakersSoFar}`);
if (upcoming.length) console.log("Upcoming:\n" + upcoming.map(e => `  • ${fmt(e.start)}  ${e.title} (${e.speaker})`).join("\n"));
if (done.length) console.log("Done:\n" + done.map(e => `  • ${fmt(e.start)}  ${e.title} (${e.speaker})`).join("\n"));
warnings.forEach(w => console.log("⚠ " + w));
errors.forEach(e => console.log("✗ " + e));
console.log(errors.length ? `\n${errors.length} problem(s) to fix.` : "\n✓ config.js is OK.");
process.exit(errors.length ? 1 : 0);
