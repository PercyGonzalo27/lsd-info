/* =====================================================================
   config.js
   ---------------------------------------------------------------------
   How to update:
     1. Copy last week's talk into ARCHIVE.
     2. Overwrite the fields inside SEMINAR with this week's talk.

   Time format:  "2026-10-16 12:45"  means 12:45 Japan time (JST).
   (The older UTC format such as "2026-10-16T03:45:00Z" still works too.)
   ===================================================================== */

const LAB = { name: "Ikeuchi Lab", series: "Lunch Science Discussion", short: "LSD", language: "English" };

/* ---------------------------------------------------------------------
   THIS WEEK'S SESSION
   --------------------------------------------------------------------- */
const SEMINAR = {
  title: "Introduction to human brain development",
  hook: "Where do the regions of the brain come from? What is ventral/dorsal, anterior/posterior?",
  start: "2026-10-16T03:45:00Z",   // = 2026-10-16 12:45 JST
  duration: 45,                     // minutes
  location: "As Room 302, IIS",
  topic: "How does the human bran develop and what are the major factors driving this?",
  takeaways: [
    { num: "01", icon: "i-electrode", text: "Embryonic development of brain vesicles" },
    { num: "02", icon: "i-brain",     text: "Standard axes of anatomical direction" },
    { num: "03", icon: "i-synapse",   text: "Open questions remain: what is 'conciousness' and when does it appear?" }
  ],
  speaker: { name: "Gonzalo Sifuentes", role: "Masters 2nd year", affiliation: "Ikeuchi Lab, IIS, University of Tokyo", bio: "Researcher on brain organoid circuits as models for psychiatric disorders.", photo: "gonzalo.jpg" },
  faq: [
    { q: "Who can attend?", a: "Any member of the Ikeuchi Lab — professors, graduate students, and postdocs. No registration required." },
    { q: "Do I need to prepare anything?", a: "Nothing. Bring curiosity and maybe your own lunch." },
    { q: "Can I sign up to present?", a: "Yes! Please contact Gonzalo Sifuentes directly to get on the schedule." },
    { q: "What language is it in?", a: "English, so every lab member can participate." }
  ],
  contact: "sifuentesgonzalo@g.ecc.u-tokyo.ac.jp",

  /* Optional: collect "Save my seat" names in a Google Form.
     formUrl   = the form's address ending in /formResponse
     formEntry = the name-question id, looks like  entry.1234567890
     Leave both "" to only show the on-page confirmation. */
  formUrl: "https://script.google.com/macros/s/AKfycbzOTWaBTRI7GSCCz9d8bpNrRPgP-4bZZ4gC_mpaPskUz8fUGsdy9kQAyrnbfExVqxxTsQ/exec",
  formEntry: ""
};

/* ---------------------------------------------------------------------
   PAST AND UPCOMING SESSIONS (newest order does not matter)
   Template to copy for each new session:
   { title:"", start:"2026-10-23 12:45", duration:45, topic:"", speaker:"Full Name", link:"" },
   ("link" is optional: slides or notes shown in the pop-up of a finished session)
   --------------------------------------------------------------------- */
const ARCHIVE = [
  { title:"Neural decoding of motor intent",start:"2026-03-19T03:00:00Z",duration:45,topic:"BCI signal processing and primate cortex — from spike sorting to decoded intention.",speaker:"K. Watanabe",link:"" },
  { title:"Synaptic plasticity and memory formation",start:"2026-03-26T03:00:00Z",duration:45,topic:"LTP, STDP, and the molecular basis of learning. What Hebb got right and what he missed.",speaker:"Y. Hashimoto",link:"" },
  { title:"fMRI beyond BOLD: new acquisition methods",start:"2026-04-09T03:00:00Z",duration:45,topic:"VASO, ASL, and diffusion MRI advances — imaging what the BOLD signal can't see.",speaker:"R. Ikeuchi",link:"" },
  { title:"Topological data analysis in neuroscience",start:"2026-10-21T03:00:00Z",duration:45,topic:"Persistent homology and neural manifolds — extracting shape from high-dimensional data.",speaker:"H. Kimura",link:"" },
  { title:"The connectome: mapping every synapse at scale",start:"2026-10-28T03:00:00Z",duration:45,topic:"Electron microscopy reconstruction and graph analysis of the full fruit-fly connectome.",speaker:"A. Sato",link:"" }
];

/* ---------------------------------------------------------------------
   SPEAKER PHOTOS  (one photo per person, reused for EVERY session)
   • Put the picture files in the  images/  folder of the repository.
   • Write the speaker's name exactly as in the sessions above, then the file name.
   • Any picture size or shape works; it is cropped to fit automatically.
   • Gonzalo's photo is already linked through SEMINAR.speaker.photo above,
     so he needs no entry here. Add other speakers like this:
   --------------------------------------------------------------------- */
const PHOTO_FOLDER = "images/";
const SPEAKER_PHOTOS = {
  // "K. Watanabe": "watanabe.jpg",
  // "Y. Hashimoto": "hashimoto.jpg",
};
