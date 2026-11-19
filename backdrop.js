/* =====================================================================
   backdrop.js — "neurons" drifting behind the page (decoration only).
   Draws faint dots on the fixed <canvas id="bdCanvas">. Now and then one
   dot "fires": it flashes and links briefly to its neighbours, like a
   spike spreading through a network.
   Colours come from styles.css :root (--text, --accent-1, --accent-2),
   so change them there. Density: AREA (px² per dot) and MAX below.
   Pauses when the tab is hidden; draws one still frame with reduced motion.
   ===================================================================== */
(function () {
  "use strict";
  var cv = document.getElementById("bdCanvas");
  var ctx = cv && cv.getContext && cv.getContext("2d");
  if (!ctx) return;                         // CSS gradient + hazes still show

  var AREA = 15000, MAX = 120, LINK = 140, FIRE = 0.012;
  var still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var css = getComputedStyle(document.documentElement);
  var COL = ["--text", "--accent-1", "--accent-2"].map(function (v) {
    return css.getPropertyValue(v).trim() || "#fff";
  });
  var W = 0, H = 0, P = [], raf = 0, timer = 0;

  function make() {
    var k = Math.random();
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12, vy: -(0.03 + Math.random() * 0.12),
      r: 0.6 + Math.random() * 0.9,
      c: k < 0.78 ? 0 : k < 0.92 ? 1 : 2,              // mostly text colour, a few accents
      a: k < 0.78 ? 0.14 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3,
      f: 0                                               // firing level 1 → 0
    };
  }

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(MAX, Math.round(W * H / AREA));
    while (P.length < n) P.push(make());
    P.length = n;
  }

  function step() {
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      p.x += p.vx; p.y += p.vy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
      if (p.f > 0) p.f = Math.max(0, p.f - 0.014);
    }
    if (P.length && Math.random() < FIRE * P.length / 20) P[(Math.random() * P.length) | 0].f = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (p.f > 0) {                                     // links to nearby dots while firing
        ctx.strokeStyle = COL[p.c === 2 ? 2 : 1];
        ctx.lineWidth = 0.6;
        for (var j = 0; j < P.length; j++) {
          var q = P[j], dx = q.x - p.x, dy = q.y - p.y, d = dx * dx + dy * dy;
          if (j === i || d > LINK * LINK) continue;
          ctx.globalAlpha = p.f * 0.35 * (1 - Math.sqrt(d) / LINK);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = Math.min(1, p.a + p.f * 0.6);
      ctx.fillStyle = COL[p.f > 0 ? (p.c === 2 ? 2 : 1) : p.c];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + p.f * 1.4, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame() { step(); draw(); raf = requestAnimationFrame(frame); }
  function start() { if (!raf && !still && !document.hidden) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { size(); draw(); }, 200);
  });
  size(); draw(); start();
})();
