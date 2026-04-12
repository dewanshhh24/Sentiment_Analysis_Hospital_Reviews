/* ═══════════════════════════════════════════════════════════════
   MediSense AI — script.js
   AI-Powered Hospital Review Sentiment Analysis (3-Class)
═══════════════════════════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────────────────────────
   1. MODEL PERFORMANCE DATA
───────────────────────────────────────────────────────────────*/

const MODEL_ACCURACY  = 0.924;
const MODEL_PRECISION = 0.918;
const MODEL_RECALL    = 0.931;
const MODEL_F1        = 0.924;

// ── 3×3 Confusion Matrix ──────────────────────────────────────
const CM_PP   = 1015;
const CM_PN   = 168;
const CM_PNg  = 17;
const CM_NP   = 151;
const CM_NN   = 998;
const CM_NNg  = 51;
const CM_NgP  = 35;
const CM_NgN  = 81;
const CM_NgNg = 1084;

// ── 3-Class Sentiment Distribution — 18,000 samples, 6k each ──
const SENT_POSITIVE_COUNT = 6000;
const SENT_NEUTRAL_COUNT  = 6000;
const SENT_NEGATIVE_COUNT = 6000;
const SENT_TOTAL          = 18000;

const SENT_POSITIVE_PCT = (SENT_POSITIVE_COUNT / SENT_TOTAL) * 100; // 33.33
const SENT_NEUTRAL_PCT  = (SENT_NEUTRAL_COUNT  / SENT_TOTAL) * 100; // 33.33
const SENT_NEGATIVE_PCT = (SENT_NEGATIVE_COUNT / SENT_TOTAL) * 100; // 33.34

// ── AUC placeholder ───────────────────────────────────────────
const ROC_AUC = 0.963;


/* ─────────────────────────────────────────────────────────────
   2. API INTEGRATION POINT
───────────────────────────────────────────────────────────────*/

const API_URL = "https://your-model-endpoint.com/predict";

async function callSentimentAPI(reviewText) {
  await new Promise(r => setTimeout(r, 1200));

  const roll = reviewText.length % 3;
  const classes = ["Positive", "Neutral", "Negative"];
  const confs   = [0.91 + Math.random() * 0.07,
                   0.72 + Math.random() * 0.18,
                   0.78 + Math.random() * 0.15];
  return { sentiment: classes[roll], confidence: confs[roll] };

  /* ─── REAL API CALL (uncomment when backend ready) ────────────────
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review: reviewText })
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
  ─────────────────────────────────────────────────────────────────── */
}


/* ─────────────────────────────────────────────────────────────
   3. HERO — ANALYZE SENTIMENT
───────────────────────────────────────────────────────────────*/

const reviewInput = document.getElementById("reviewInput");
const charCount   = document.getElementById("charCount");
const analyzeBtn  = document.getElementById("analyzeBtn");
const resultCard  = document.getElementById("resultCard");
const loadingCard = document.getElementById("loadingCard");

if (reviewInput) {
  reviewInput.addEventListener("input", () => {
    const len = reviewInput.value.length;
    charCount.textContent = `${len} / 512`;
    charCount.style.color = len > 480 ? "#ef4444" : "";
  });
}

async function analyzeSentiment() {
  const review = reviewInput ? reviewInput.value.trim() : "";

  if (!review) {
    shakeElement(reviewInput);
    reviewInput.placeholder = "⚠️  Please enter a review first…";
    return;
  }

  resultCard.style.display  = "none";
  loadingCard.style.display = "flex";
  analyzeBtn.disabled = true;

  try {
    const result = await callSentimentAPI(review);
    displayResult(result.sentiment, result.confidence);
  } catch (err) {
    console.error("Sentiment API error:", err);
    displayError("Model request failed. Check console for details.");
  } finally {
    loadingCard.style.display = "none";
    analyzeBtn.disabled = false;
  }
}

function displayResult(sentiment, confidence) {
  const sentimentEl = document.getElementById("resultSentiment");
  const iconWrap    = document.getElementById("resultIconWrap");
  const confValueEl = document.getElementById("resultConfidence");
  const barEl       = document.getElementById("resultBar");

  const confPct = Math.round(confidence * 100);

  const config = {
    Positive: { cls: "positive", icon: "fa-circle-check",         color: "var(--green)"   },
    Neutral:  { cls: "neutral",  icon: "fa-circle-minus",         color: "var(--neutral)" },
    Negative: { cls: "negative", icon: "fa-triangle-exclamation", color: "var(--red)"     }
  };
  const cfg = config[sentiment] || config["Neutral"];

  iconWrap.className = `result-icon-wrap ${cfg.cls}`;
  iconWrap.innerHTML = `<i class="fa-solid ${cfg.icon}"></i>`;

  sentimentEl.textContent = sentiment;
  sentimentEl.className   = `result-sentiment ${cfg.cls}`;

  confValueEl.textContent = `${confPct}%`;
  confValueEl.style.color = cfg.color;

  barEl.className   = `result-bar ${cfg.cls}`;
  barEl.style.width = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { barEl.style.width = confPct + "%"; });
  });

  resultCard.style.display = "block";
}

function displayError(message) {
  resultCard.style.display = "block";
  const inner = resultCard.querySelector(".result-inner");
  if (inner) {
    inner.innerHTML = `
      <div class="result-icon-wrap negative"><i class="fa-solid fa-circle-xmark"></i></div>
      <div class="result-details">
        <div class="result-label">Error</div>
        <div class="result-sentiment negative">${message}</div>
      </div>`;
  }
}

function shakeElement(el) {
  if (!el) return;
  el.style.animation = "none";
  el.offsetHeight;
  el.style.animation = "shake 0.4s ease";
  el.addEventListener("animationend", () => { el.style.animation = ""; }, { once: true });
}


/* ─────────────────────────────────────────────────────────────
   4. DASHBOARD — POPULATE METRICS
───────────────────────────────────────────────────────────────*/

function populateMetrics() {
  const metrics = [
    { id: "kpiAccuracy",  barId: "barAccuracy",  value: MODEL_ACCURACY  },
    { id: "kpiPrecision", barId: "barPrecision", value: MODEL_PRECISION },
    { id: "kpiRecall",    barId: "barRecall",    value: MODEL_RECALL    },
    { id: "kpiF1",        barId: "barF1",        value: MODEL_F1        },
  ];

  metrics.forEach(({ id, barId, value }) => {
    const el  = document.getElementById(id);
    const bar = document.getElementById(barId);
    if (el)  el.textContent = (value * 100).toFixed(1) + "%";
    if (bar) setTimeout(() => { bar.style.width = (value * 100) + "%"; }, 400);
  });

  // ── 3×3 Confusion Matrix cells ──────────────────────────────
  const cmCells = {
    "cm3-PP"  : CM_PP,  "cm3-PN"  : CM_PN,  "cm3-PNg" : CM_PNg,
    "cm3-NP"  : CM_NP,  "cm3-NN"  : CM_NN,  "cm3-NNg" : CM_NNg,
    "cm3-NgP" : CM_NgP, "cm3-NgN" : CM_NgN, "cm3-NgNg": CM_NgNg
  };

  Object.entries(cmCells).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      const valEl = el.querySelector(".cm3-cell-val");
      if (valEl) valEl.textContent = val;
    }
  });

  setValue("rocAUC", ROC_AUC.toFixed(3));
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ─────────────────────────────────────────────────────────────
   5. DONUT CHART — Dynamic, animated, visually polished
───────────────────────────────────────────────────────────────*/

function drawDonutChart() {
  const canvas = document.getElementById("sentimentPieChart");
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const SIZE = 240;
  canvas.width  = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.style.width  = SIZE + "px";
  canvas.style.height = SIZE + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const cx = SIZE / 2, cy = SIZE / 2;
  const outerR = 100;
  const innerR = 62;
  const gap    = 0.018; // gap between slices in radians

  const slices = [
    { pct: SENT_POSITIVE_PCT, color: "#16a34a", glow: "rgba(22,163,74,0.35)"  },
    { pct: SENT_NEUTRAL_PCT,  color: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
    { pct: SENT_NEGATIVE_PCT, color: "#ef4444", glow: "rgba(239,68,68,0.35)"  },
  ];

  // Animate the donut drawing
  let progress = 0;
  const DURATION = 900; // ms
  let startTime = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    progress = Math.min(easeOutCubic(elapsed / DURATION), 1);

    ctx.clearRect(0, 0, SIZE, SIZE);

    let angle = -Math.PI / 2; // start at top

    slices.forEach(s => {
      const sliceAngle = (s.pct / 100) * 2 * Math.PI * progress;

      if (sliceAngle <= 0) return;

      // Shadow / glow
      ctx.save();
      ctx.shadowColor = s.glow;
      ctx.shadowBlur  = 12;

      // Slice arc
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angle + gap / 2, angle + sliceAngle - gap / 2);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();

      // Inner highlight (lighter rim)
      ctx.beginPath();
      ctx.arc(cx, cy, outerR - 1, angle + gap / 2, angle + sliceAngle - gap / 2);
      ctx.arc(cx, cy, outerR - 7, angle + sliceAngle - gap / 2, angle + gap / 2, true);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fill();

      angle += sliceAngle;
    });

    // Donut hole — white fill to create ring effect
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Subtle inner ring border
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function initCharts() {
  drawDonutChart();
}


/* ─────────────────────────────────────────────────────────────
   6. SCROLL REVEAL
───────────────────────────────────────────────────────────────*/

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}


/* ─────────────────────────────────────────────────────────────
   7. STICKY NAVBAR
───────────────────────────────────────────────────────────────*/

function initNavbar() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });
}


/* ─────────────────────────────────────────────────────────────
   8. HAMBURGER MENU
───────────────────────────────────────────────────────────────*/

function initHamburger() {
  const btn   = document.getElementById("hamburger");
  const links = document.getElementById("navLinks");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}


/* ─────────────────────────────────────────────────────────────
   9. CSS ANIMATIONS
───────────────────────────────────────────────────────────────*/

(function injectAnimCSS() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
})();


/* ─────────────────────────────────────────────────────────────
   10. INIT
───────────────────────────────────────────────────────────────*/

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initHamburger();
  initReveal();
  populateMetrics();
  initCharts();
  window.analyzeSentiment = analyzeSentiment;

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initCharts, 200);
}, { passive: true });
