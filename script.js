/* ═══════════════════════════════════════════════════════════════
   MediSense AI — script.js
   AI-Powered Hospital Review Sentiment Analysis (3-Class)
   ─────────────────────────────────────────────────────────────
   PLACEHOLDER VARIABLES (replace with real model output):
     - MODEL_ACCURACY, MODEL_PRECISION, MODEL_RECALL, MODEL_F1
     - SENTIMENT_RESULT ("Positive" | "Neutral" | "Negative")
     - CONFIDENCE_SCORE (0–1 float)
     - 3×3 Confusion matrix: CM_PP, CM_PN, CM_PNg,
                              CM_NP, CM_NN, CM_NNg,
                              CM_NgP, CM_NgN, CM_NgNg
     - Chart arrays: ROC_FPR, ROC_TPR, PR_REC, PR_PREC, ACC_TRAIN, ACC_VAL
     - ROC_AUC, PR_AP
═══════════════════════════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────────────────────────
   1. MODEL PERFORMANCE DATA
   Replace these constants with real outputs from your trained model.
───────────────────────────────────────────────────────────────*/

const MODEL_ACCURACY  = 0.924;   // ← Replace: MODEL_ACCURACY
const MODEL_PRECISION = 0.918;   // ← Replace: MODEL_PRECISION (macro)
const MODEL_RECALL    = 0.931;   // ← Replace: MODEL_RECALL    (macro)
const MODEL_F1        = 0.924;   // ← Replace: MODEL_F1        (macro)

// ── 3×3 Confusion Matrix ──────────────────────────────────────
// Rows = Actual class, Columns = Predicted class
// Order: Positive (P), Neutral (N), Negative (Ng)
const CM_PP  = 910;  // Actual Pos  → Predicted Pos  (True Positive)
const CM_PN  = 42;   // Actual Pos  → Predicted Neu
const CM_PNg = 28;   // Actual Pos  → Predicted Neg
const CM_NP  = 38;   // Actual Neu  → Predicted Pos
const CM_NN  = 895;  // Actual Neu  → Predicted Neu  (True Neutral)
const CM_NNg = 47;   // Actual Neu  → Predicted Neg
const CM_NgP = 22;   // Actual Neg  → Predicted Pos
const CM_NgN = 55;   // Actual Neg  → Predicted Neu
const CM_NgNg= 913;  // Actual Neg  → Predicted Neg  (True Negative)

// ── 3-Class Sentiment Distribution (%) ───────────────────────
const SENT_POSITIVE_PCT = 33.3; // ← Replace with real dataset split
const SENT_NEUTRAL_PCT  = 33.3; // ← Replace with real dataset split
const SENT_NEGATIVE_PCT = 33.4; // ← Replace with real dataset split

// ── ROC Curve (macro one-vs-rest average) ─────────────────────
const ROC_FPR = [0, 0.02, 0.06, 0.12, 0.20, 0.30, 0.42, 0.58, 0.74, 1.00];
const ROC_TPR = [0, 0.35, 0.62, 0.78, 0.87, 0.92, 0.95, 0.97, 0.99, 1.00];
const ROC_AUC = 0.967; // ← Replace: macro-avg AUC

// ── Precision-Recall Curve (macro average) ────────────────────
const PR_REC  = [0, 0.10, 0.22, 0.38, 0.52, 0.65, 0.78, 0.88, 0.95, 1.00];
const PR_PREC = [1.00, 0.98, 0.96, 0.94, 0.92, 0.88, 0.82, 0.74, 0.62, 0.50];
const PR_AP   = 0.951; // ← Replace: macro average precision

// ── Accuracy curves (one value per epoch) ─────────────────────
const EPOCHS    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ACC_TRAIN = [0.62, 0.72, 0.79, 0.84, 0.87, 0.89, 0.91, 0.92, 0.924, 0.926];
const ACC_VAL   = [0.60, 0.70, 0.77, 0.82, 0.85, 0.87, 0.89, 0.90, 0.915, 0.912];


/* ─────────────────────────────────────────────────────────────
   2. API INTEGRATION POINT
   Replace callSentimentAPI() stub with your real endpoint.
   Expected: POST /predict → { sentiment: "Positive"|"Neutral"|"Negative", confidence: 0.94 }
───────────────────────────────────────────────────────────────*/

const API_URL = "https://your-model-endpoint.com/predict"; // ← Replace with real URL

async function callSentimentAPI(reviewText) {
  /* ─── STUB (remove and uncomment fetch below when backend is ready) ── */
  await new Promise(r => setTimeout(r, 1200));

  // 3-class pseudo-random for demo — REPLACE with real fetch()
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
  // Returns: { sentiment: "Positive"|"Neutral"|"Negative", confidence: 0.94 }
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

  // Map sentiment → icon, CSS class
  const config = {
    Positive: { cls: "positive", icon: "fa-circle-check",         color: "var(--green)"   },
    Neutral:  { cls: "neutral",  icon: "fa-circle-minus",         color: "var(--neutral)" },
    Negative: { cls: "negative", icon: "fa-triangle-exclamation", color: "var(--red)"     }
  };
  const cfg = config[sentiment] || config["Neutral"];

  // Icon wrapper
  iconWrap.className = `result-icon-wrap ${cfg.cls}`;
  iconWrap.innerHTML = `<i class="fa-solid ${cfg.icon}"></i>`;

  // Sentiment label — SENTIMENT_RESULT
  sentimentEl.textContent = sentiment;
  sentimentEl.className   = `result-sentiment ${cfg.cls}`;

  // Confidence score — CONFIDENCE_SCORE
  confValueEl.textContent = `${confPct}%`;
  confValueEl.style.color = cfg.color;

  // Animated bar
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

  // AUC / AP
  setValue("rocAUC", ROC_AUC.toFixed(3));
  setValue("prAP",   PR_AP.toFixed(3));
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ─────────────────────────────────────────────────────────────
   5. CANVAS CHARTS
───────────────────────────────────────────────────────────────*/

// ── 3-Class Pie / Donut chart ────────────────────────────────
function drawPieChart() {
  const canvas = document.getElementById("sentimentPieChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 90, inner = 54;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const slices = [
    { value: SENT_POSITIVE_PCT, color: "#16a34a", label: "Positive" },
    { value: SENT_NEUTRAL_PCT,  color: "#f59e0b", label: "Neutral"  },
    { value: SENT_NEGATIVE_PCT, color: "#ef4444", label: "Negative" }
  ];
  let start = -Math.PI / 2;

  slices.forEach(s => {
    const angle = (s.value / 100) * 2 * Math.PI;

    // Outer slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();

    // Inner hole (donut)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, inner, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    start += angle;
  });

  // Center label
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px DM Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("3-Class", cx, cy - 6);
  ctx.fillStyle = "#64748b";
  ctx.font = "10px DM Sans, sans-serif";
  ctx.fillText("Distribution", cx, cy + 10);
}

// ── Line / Area chart helper ──────────────────────────────────
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

  // Diagonal reference (ROC)
  if (config.diagonal) {
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0)); ctx.lineTo(toX(1), toY(1));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Datasets
  datasets.forEach(ds => {
    const pts = ds.x.map((xv, i) => [toX(xv), toY(ds.y[i])]);

    if (ds.fill) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], toY(minY));
      pts.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(pts[pts.length - 1][0], toY(minY));
      ctx.closePath();
      ctx.fillStyle = ds.fill;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.stroke();

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
    config.legend.forEach(item => {
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

function drawROC() {
  drawLineChart("rocChart",
    [{ x: ROC_FPR, y: ROC_TPR, color: "#5aa9e6", fill: "rgba(90,169,230,0.08)", dots: false }],
    null,
    { minX: 0, maxX: 1, minY: 0, maxY: 1, diagonal: true }
  );
  const c = document.getElementById("rocChart");
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#64748b";
  ctx.font = "10px DM Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("False Positive Rate (macro OvR)", c.width / 2, c.height - 6);
}

function drawPRCurve() {
  drawLineChart("prChart",
    [{ x: PR_REC, y: PR_PREC, color: "#0284c8", fill: "rgba(2,132,200,0.08)", dots: false }],
    null,
    { minX: 0, maxX: 1, minY: 0, maxY: 1 }
  );
  const c = document.getElementById("prChart");
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#64748b";
  ctx.font = "10px DM Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Recall (macro)", c.width / 2, c.height - 6);
}

function drawAccCurve() {
  drawLineChart("accCurveChart",
    [
      {
        x: EPOCHS.map((_, i) => i / (EPOCHS.length - 1)),
        y: ACC_TRAIN,
        color: "#5aa9e6",
        fill: "rgba(90,169,230,0.07)",
        dots: true
      },
      {
        x: EPOCHS.map((_, i) => i / (EPOCHS.length - 1)),
        y: ACC_VAL,
        color: "#0284c8",
        fill: "rgba(2,132,200,0.05)",
        dots: true
      }
    ],
    EPOCHS.map(String),
    {
      minX: 0, maxX: 1,
      minY: 0.55, maxY: 1.0,
      legend: [
        { color: "#5aa9e6", label: "Training Accuracy" },
        { color: "#0284c8", label: "Validation Accuracy" }
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

  // Footer year
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initCharts, 200);
}, { passive: true });
