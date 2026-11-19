/* =====================================================================
   config.js — the only file you edit to run LSD.
   ---------------------------------------------------------------------
   • SITE      settings for the whole site (rarely change)
   • SPEAKERS  one entry per person: role, bio, photo (used everywhere)
   • EVENTS    every session, past and future, in any order

   To add a session: append one entry to EVENTS (template below).
   The page works out by itself which session is next, which are done,
   and the counts. Nothing else needs to change.

   Time format: "2026-11-24 12:45" means 12:45 Japan time (JST).
   ===================================================================== */

const SITE = {
  name: "Ikeuchi Lab",
  series: "Lunch Science Discussion",
  short: "LSD",
  language: "English",
  defaultRoom: "As Room 302, IIS",        // used when an event has no location
  defaultDuration: 45,                    // minutes, used when an event has no duration
  contact: "sifuentesgonzalo@g.ecc.u-tokyo.ac.jp",
  /* "Save my seat" sends name, title and date to this Google Apps Script. */
  formUrl: "https://script.google.com/macros/s/AKfycbzOTWaBTRI7GSCCz9d8bpNrRPgP-4bZZ4gC_mpaPskUz8fUGsdy9kQAyrnbfExVqxxTsQ/exec",
  faq: [
    { q: "Who can attend?", a: "Any member of the Ikeuchi Lab — professors, graduate students, and postdocs. No registration required." },
    { q: "Do I need to prepare anything?", a: "Nothing. Bring curiosity and maybe your own lunch." },
    { q: "Can I sign up to present?", a: "Yes! Please contact Gonzalo Sifuentes directly to get on the schedule." },
    { q: "What language is it in?", a: "English, so every lab member can participate." }
  ]
};

/* ---------------------------------------------------------------------
   SPEAKERS — key = full name, exactly as written in EVENTS.
   Every speaker needs all of:
     role        their position          e.g. "Masters 2nd year", "Assistant Professor"
     affiliation where they are          e.g. "Ikeuchi Lab, IIS, University of Tokyo"
     bio         the research they do    one sentence
     photo       images/firstname-lastname.jpg (JPG, about 800 px wide)
   Optional:
     focus       where the face is in the photo, "x% y%" from the top-left
                 (e.g. "50% 40%"), so wide boxes never crop it. Default "50% 35%".
   --------------------------------------------------------------------- */
const SPEAKERS = {
  "Gonzalo Sifuentes": {
    role: "Masters 2nd year",
    affiliation: "Ikeuchi Lab, IIS, University of Tokyo",
    bio: "Researcher on brain organoid circuits as models for psychiatric disorders.",
    photo: "images/gonzalo-sifuentes.jpg",
    focus: "50% 40%"
  }
};

/* ---------------------------------------------------------------------
   EVENTS — order does not matter. Template:
   {
     title: "",
     start: "YYYY-MM-DD HH:MM",          // JST
     duration: 45,                        // optional, default SITE.defaultDuration
     location: "As Room 302, IIS",        // optional, default SITE.defaultRoom
     topic: "",
     takeaways: ["", "", ""],
     speaker: "Full Name",                // must match a key in SPEAKERS
     link: ""                             // optional: slides/notes, shown once done
   },
   --------------------------------------------------------------------- */
const EVENTS = [
  {
    title: "Introduction to human brain development",
    start: "2026-11-24 12:45",
    duration: 45,
    location: "As Room 302, IIS",
    topic: "How does the human brain develop and what are the major factors driving this?",
    takeaways: [
      "Embryonic development of brain vesicles",
      "Standard axes of anatomical direction",
      "Open questions remain: what is 'consciousness' and when does it appear?"
    ],
    speaker: "Gonzalo Sifuentes",
    link: ""
  }
];
