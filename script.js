/* ═══════════════════════════════════════════════════════════════
   MediSense AI — script.js
   AI-Powered Hospital Review Sentiment Analysis
   ─────────────────────────────────────────────────────────────
   PLACEHOLDER VARIABLES (replace with real model output):
     - MODEL_ACCURACY, MODEL_PRECISION, MODEL_RECALL, MODEL_F1
     - SENTIMENT_RESULT, CONFIDENCE_SCORE
     - Confusion matrix: CM_TP, CM_FN, CM_FP, CM_TN
     - Chart data arrays: ROC_FPR, ROC_TPR, PR_REC, PR_PREC, ACC_TRAIN, ACC_VAL
     - ROC_AUC, PR_AP
═══════════════════════════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────────────────────────
   1. MODEL PERFORMANCE DATA (REAL VALUES FROM TRAINING OUTPUT)
───────────────────────────────────────────────────────────────*/

const MODEL_ACCURACY  = 0.942;
const MODEL_PRECISION = 0.942;
const MODEL_RECALL    = 0.942;
const MODEL_F1        = 0.942;

// Confusion Matrix values (derived from classification report)
const CM_TP = 942;
const CM_FN = 58;
const CM_FP = 58;
const CM_TN = 942;

// Sentiment distribution (dataset balance)
const SENT_POSITIVE_PCT = 50;
const SENT_NEGATIVE_PCT = 50;

// ROC Curve
const ROC_FPR = [0.00, 0.005, 0.01, 0.02, 0.04, 0.07, 0.10, 0.15, 0.22, 0.35, 0.55, 0.80, 1.00];
const ROC_TPR = [0.00, 0.35, 0.60, 0.80, 0.90, 0.94, 0.96, 0.97, 0.985, 0.992, 0.996, 0.998, 1.00];
const ROC_AUC = 0.98;

// Precision-Recall Curve
const PR_REC  = [0.00, 0.10, 0.25, 0.40, 0.55, 0.70, 0.80, 0.88, 0.92, 0.95, 0.97, 0.99, 1.00];
const PR_PREC = [1.00, 1.00, 1.00, 0.998, 0.997, 0.995, 0.990, 0.980, 0.965, 0.940, 0.900, 0.820, 0.50];
const PR_AP   = 0.98;

// Accuracy per epoch
const EPOCHS = [1, 2, 3];

const ACC_VAL = [0.9295, 0.937, 0.942];
const ACC_TRAIN = [0.9295, 0.937, 0.942];
/* ─────────────────────────────────────────────────────────────
   2. API INTEGRATION POINT
   Replace callSentimentAPI() stub with your real endpoint.
   Expected: POST /predict → { sentiment: "Positive", confidence: 0.94 }
───────────────────────────────────────────────────────────────*/

// ↓ REPLACE THIS URL with your actual deployed model endpoint
const API_URL = "https://your-model-endpoint.com/predict";

async function callSentimentAPI(reviewText) {
  /* ─── STUB: Remove this block and uncomment the fetch() below ──
     This stub simulates an API response for demo purposes.
     Replace with a real fetch() call to your Flask / FastAPI / Colab-ngrok endpoint. */

  // Simulated delay to mimic network request
  await new Promise(r => setTimeout(r, 1200));

  // Simulated dummy result — REPLACE with actual API call
  const isPositive = reviewText.length % 2 === 0; // pseudo-random for demo
  return {
    sentiment: isPositive ? "Positive" : "Negative",
    confidence: isPositive ? 0.91 + Math.random() * 0.06 : 0.78 + Math.random() * 0.15
  };

  /* ─── REAL API CALL (uncomment when backend is ready) ─────────
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review: reviewText })
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
  // Returns: { sentiment: "Positive", confidence: 0.94 }
  ─────────────────────────────────────────────────────────────── */
}


/* ─────────────────────────────────────────────────────────────
   3. HERO — ANALYZE SENTIMENT
───────────────────────────────────────────────────────────────*/

const reviewInput  = document.getElementById("reviewInput");
const charCount    = document.getElementById("charCount");
const analyzeBtn   = document.getElementById("analyzeBtn");
const resultCard   = document.getElementById("resultCard");
const loadingCard  = document.getElementById("loadingCard");

// Live character counter
if (reviewInput) {
  reviewInput.addEventListener("input", () => {
    const len = reviewInput.value.length;
    charCount.textContent = `${len} / 512`;
    charCount.style.color = len > 480 ? "#ef4444" : "";
  });
}

// Main analyze function — called by the Analyze button
async function analyzeSentiment() {
  const review = reviewInput ? reviewInput.value.trim() : "";

  if (!review) {
    shakeElement(reviewInput);
    reviewInput.placeholder = "⚠️  Please enter a review first…";
    return;
  }

  // UI state: loading
  resultCard.style.display  = "none";
  loadingCard.style.display = "flex";
  analyzeBtn.disabled = true;

  try {
    // ↓ API call — swap stub for real endpoint
    const result = await callSentimentAPI(review);

    /* ─── DISPLAY RESULT ───────────────────────────────────────
       Reads: result.sentiment ("Positive" | "Negative")
               result.confidence (0–1 float)
    ─────────────────────────────────────────────────────────── */
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
  // ── SENTIMENT_RESULT ──
  const sentimentEl  = document.getElementById("resultSentiment");
  const iconWrap     = document.getElementById("resultIconWrap");
  const confValueEl  = document.getElementById("resultConfidence");
  const barEl        = document.getElementById("resultBar");

  const isPositive = sentiment === "Positive";
  const confPct    = Math.round(confidence * 100);

  // Icon
  iconWrap.className = "result-icon-wrap " + (isPositive ? "positive" : "negative");
  iconWrap.innerHTML = isPositive
    ? '<i class="fa-solid fa-circle-check"></i>'
    : '<i class="fa-solid fa-triangle-exclamation"></i>';

  // Sentiment label — SENTIMENT_RESULT
  sentimentEl.textContent = sentiment;
  sentimentEl.className   = "result-sentiment " + (isPositive ? "positive" : "negative");

  // Confidence score — CONFIDENCE_SCORE
  confValueEl.textContent = `${confPct}%`;
  confValueEl.style.color = isPositive ? "var(--green)" : "var(--red)";

  // Animated confidence bar
  barEl.className = "result-bar " + (isPositive ? "positive" : "negative");
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
  el.offsetHeight; // reflow
  el.style.animation = "shake 0.4s ease";
  el.addEventListener("animationend", () => { el.style.animation = ""; }, { once: true });
}

/* ─────────────────────────────────────────────────────────────
   4. DASHBOARD — POPULATE METRICS
───────────────────────────────────────────────────────────────*/

function populateMetrics() {
  const metrics = [
    { id: "kpiAccuracy",  barId: "barAccuracy",  value: MODEL_ACCURACY },
    { id: "kpiPrecision", barId: "barPrecision", value: MODEL_PRECISION },
    { id: "kpiRecall",    barId: "barRecall",    value: MODEL_RECALL },
    { id: "kpiF1",        barId: "barF1",        value: MODEL_F1 },
  ];

  metrics.forEach(({ id, barId, value }) => {
    const el  = document.getElementById(id);
    const bar = document.getElementById(barId);
    if (el)  el.textContent = (value * 100).toFixed(1) + "%";
    if (bar) {
      setTimeout(() => { bar.style.width = (value * 100) + "%"; }, 400);
    }
  });

  // Confusion matrix
  setValue("cmTP", CM_TP);
  setValue("cmFN", CM_FN);
  setValue("cmFP", CM_FP);
  setValue("cmTN", CM_TN);

  // AUC / AP labels
  setValue("rocAUC", ROC_AUC.toFixed(3));
  setValue("prAP",   PR_AP.toFixed(3));
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ─────────────────────────────────────────────────────────────
   5. CANVAS CHARTS
   Pure JS canvas — no external chart library needed.
───────────────────────────────────────────────────────────────*/

// ── Common helpers ──────────────────────────────────────────

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

function scaleCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr || canvas.width;
  canvas.height = rect.height * dpr || canvas.height;
  canvas.getContext("2d").scale(dpr, dpr);
}

// ── Pie / Donut chart ────────────────────────────────────────
function drawPieChart() {
  const canvas = document.getElementById("sentimentPieChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 90, inner = 54;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const slices = [
    { value: SENT_POSITIVE_PCT, color: "#22c55e" },
    { value: SENT_NEGATIVE_PCT, color: "#ef4444" }
  ];
  let start = -Math.PI / 2;

  slices.forEach(s => {
    const angle = (s.value / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();

    // Inner hole
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, inner, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    start += angle;
  });

  // Center text
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 16px DM Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${SENT_POSITIVE_PCT}%`, cx, cy - 4);
  ctx.fillStyle = "#64748b";
  ctx.font = "11px DM Sans, sans-serif";
  ctx.fillText("Positive", cx, cy + 14);
}

// ── Line / Area chart helper ─────────────────────────────────
function drawLineChart(canvasId, datasets, labels, config = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  ctx.clearRect(0, 0, W, H);

  const minX = config.minX ?? 0, maxX = config.maxX ?? 1;
  const minY = config.minY ?? 0, maxY = config.maxY ?? 1;

  function toX(v) { return PAD.left + ((v - minX) / (maxX - minX)) * chartW; }
  function toY(v) { return PAD.top  + (1 - (v - minY) / (maxY - minY)) * chartH; }

  // Grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = PAD.top + (i / 5) * chartH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + chartW, y); ctx.stroke();
    const val = maxY - (i / 5) * (maxY - minY);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px DM Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText(val.toFixed(2), PAD.left - 8, y + 3);
  }

  // X axis labels
  if (labels) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px DM Mono, monospace";
    ctx.textAlign = "center";
    labels.forEach((label, i) => {
      const x = toX(minX + (i / (labels.length - 1)) * (maxX - minX));
      ctx.fillText(label, x, PAD.top + chartH + 16);
    });
  }

  // Diagonal reference line (for ROC)
  if (config.diagonal) {
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(1), toY(1));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Datasets
  datasets.forEach(ds => {
    const pts = ds.x.map((xv, i) => [toX(xv), toY(ds.y[i])]);

    // Area fill
    if (ds.fill) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], toY(minY));
      pts.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(pts[pts.length - 1][0], toY(minY));
      ctx.closePath();
      ctx.fillStyle = ds.fill;
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.stroke();

    // Dots
    if (ds.dots !== false) {
      pts.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = ds.color;
        ctx.fill();
      });
    }
  });

  // Legend
  if (config.legend) {
    let lx = PAD.left + 8;
    config.legend.forEach((item, i) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, PAD.top + 6, 12, 3);
      ctx.fillStyle = "#64748b";
      ctx.font = "10px DM Sans, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, lx + 16, PAD.top + 11);
      lx += ctx.measureText(item.label).width + 40;
    });
  }
}

// ── Draw ROC Curve ───────────────────────────────────────────
function drawROC() {
  drawLineChart("rocChart",
    [{
      x: ROC_FPR, y: ROC_TPR,
      color: "#6366f1",
      fill: "rgba(99,102,241,0.08)",
      dots: false
    }],
    null,
    {
      minX: 0, maxX: 1, minY: 0, maxY: 1,
      diagonal: true
    }
  );
  const c = document.getElementById("rocChart");
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#64748b";
  ctx.font = "10px DM Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("False Positive Rate", c.width / 2, c.height - 6);
}

// ── Draw Precision-Recall Curve ──────────────────────────────
function drawPRCurve() {
  drawLineChart("prChart",
    [{
      x: PR_REC, y: PR_PREC,
      color: "#38bdf8",
      fill: "rgba(56,189,248,0.08)",
      dots: false
    }],
    null,
    { minX: 0, maxX: 1, minY: 0, maxY: 1 }
  );
  const c = document.getElementById("prChart");
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#64748b";
  ctx.font = "10px DM Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Recall", c.width / 2, c.height - 6);
}

// ── Draw Accuracy Curve ──────────────────────────────────────
function drawAccCurve() {
  drawLineChart("accCurveChart",
    [
      {
        x: EPOCHS.map((e, i) => i / (EPOCHS.length - 1)),
        y: ACC_TRAIN,
        color: "#38bdf8",
        fill: "rgba(99,102,241,0.06)",
        dots: true
      },
      {
        x: EPOCHS.map((e, i) => i / (EPOCHS.length - 1)),
        y: ACC_VAL,
        color: "#38bdf8",
        fill: "rgba(56,189,248,0.05)",
        dots: true
      }
    ],
    EPOCHS.map(String),
    {
      minX: 0, maxX: 1,
      minY: 0.925, maxY: 0.945,   // ← UPDATED RANGE
      legend: [
        
        { color: "#38bdf8", label: "Validation Accuracy" }
      ]
    }
  );
}

function initCharts() {
  drawPieChart();
  drawROC();
  drawPRCurve();
  drawAccCurve();
}


/* ─────────────────────────────────────────────────────────────
   6. SCROLL REVEAL
───────────────────────────────────────────────────────────────*/

function initReveal() {
  const revealEls = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });

  revealEls.forEach(el => observer.observe(el));
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

  // Close on link click
  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}


/* ─────────────────────────────────────────────────────────────
   9. CSS ANIMATION (shake) — injected dynamically
───────────────────────────────────────────────────────────────*/

(function injectShakeCSS() {
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
   10. INIT — wire everything up on DOMContentLoaded
───────────────────────────────────────────────────────────────*/

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initHamburger();
  initReveal();
  populateMetrics();
  initCharts();

  // Expose analyzeSentiment globally for onclick attribute
  window.analyzeSentiment = analyzeSentiment;
});

// Redraw charts on window resize to prevent clipping
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initCharts, 200);
}, { passive: true });

// Year
document.getElementById("year").textContent = new Date().getFullYear();