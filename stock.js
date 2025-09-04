// Simple in-memory state
const DEFAULT_STATE = {
  walletInRupees: 10000,
  holdings: {},
  prices: {
    "Taylor Swift": 150,
    Drake: 110,
    "Billie Eilish": 130,
  },
  history: {
    "Taylor Swift": generateMockHistory(150),
    Drake: generateMockHistory(110),
    "Billie Eilish": generateMockHistory(130),
  },
  points: 0, // ✅ added points into default state
};

function loadState() {
  try {
    const raw = localStorage.getItem("app-state");
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);

    // Deep merge to avoid reset
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      holdings: { ...DEFAULT_STATE.holdings, ...parsed.holdings },
      prices: { ...DEFAULT_STATE.prices, ...parsed.prices },
      history: { ...DEFAULT_STATE.history, ...parsed.history },
    };
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem("app-state", JSON.stringify(state));
}

function generateMockHistory(start) {
  const arr = [];
  let price = start;
  for (let i = 0; i < 60; i++) {
    price = Math.max(10, price + (Math.random() - 0.5) * 4);
    arr.push(Number(price.toFixed(2)));
  }
  return arr;
}

const state = loadState();

function formatINR(value) {
  return `₹ ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

// KPIs
function updateKPIs() {
  const totalArtists = Object.keys(state.prices).length;
  const portfolioValue = Object.entries(state.holdings).reduce(
    (sum, [name, qty]) => {
      const price = state.prices[name] || 0;
      return sum + qty * price;
    },
    0
  );
  const wallet = state.walletInRupees;

  qs("#kpi-artists").textContent = String(totalArtists);
  qs("#kpi-portfolio").textContent = formatINR(portfolioValue);
  qs("#kpi-wallet").textContent = formatINR(wallet);

  // ✅ Show points if you have an element for it
  const pointsEl = document.getElementById("kpi-points");
  if (pointsEl) pointsEl.textContent = String(state.points);

  const pill = document.getElementById("wallet-pill");
  if (pill) pill.textContent = `Wallet: ${formatINR(wallet)}`;
}

// Modal helpers
const modal = qs("#buy-modal");
const modalArtist = qs("#modal-artist");
const modalTitle = qs("#modal-title");
const buyQtyInput = qs("#buy-qty");
const buyQuote = qs("#buy-quote");

let activeArtist = null;

function openModal(artistName) {
  activeArtist = artistName;
  modal.setAttribute("aria-hidden", "false");
  modalTitle.textContent = "Buy Shares";
  modalArtist.textContent = `Artist: ${artistName}`;
  buyQtyInput.value = "1";
  updateQuote();
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  activeArtist = null;
}

function updateQuote() {
  const qty = Math.max(1, Number(buyQtyInput.value || "1"));
  const price = state.prices[activeArtist] || 0;
  buyQuote.textContent = `Total: ${formatINR(qty * price)}`;
}

function adjustQty(delta) {
  const current = Number(buyQtyInput.value || "1");
  const next = Math.max(1, current + delta);
  buyQtyInput.value = String(next);
  updateQuote();
}

// Simple sparkline drawing
function drawSparkline(canvas, series) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // gradient line
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "#8da2fb");
  grad.addColorStop(1, "#7f6bdf");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;

  // axes
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 6);
  ctx.lineTo(28, h - 16);
  ctx.lineTo(w - 6, h - 16);
  ctx.stroke();

  // series
  const min = Math.min(...series);
  const max = Math.max(...series);
  const x0 = 30;
  const y0 = 6;
  const x1 = w - 6;
  const y1 = h - 18;
  const range = Math.max(1, max - min);

  // price labels
  const label = (v) => v.toFixed(0);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = "10px sans-serif";
  ctx.fillText(label(max), 4, y0 + 8);
  ctx.fillText(label(min), 4, y1 + 12);

  // line
  const grad2 = ctx.createLinearGradient(x0, 0, x1, 0);
  grad2.addColorStop(0, "#a78bfa");
  grad2.addColorStop(1, "#7c3aed");
  ctx.strokeStyle = grad2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  series.forEach((p, i) => {
    const x = x0 + (i / (series.length - 1)) * (x1 - x0);
    const y = y1 - ((p - min) / range) * (y1 - y0);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function initSparklines() {
  qsa("canvas.sparkline").forEach((c) => {
    const symbol = c.getAttribute("data-symbol");
    const series =
      state.history[symbol] || generateMockHistory(state.prices[symbol] || 100);
    drawSparkline(c, series);
  });
}

// Event wiring
function wireEvents() {
  // open modal from Buy buttons
  qsa("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const artist = btn.getAttribute("data-buy");
      openModal(artist);
    });
  });

  // navigate to artist details when clicking card
  qsa(".card.clickable").forEach((card) => {
    card.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest("button")) return;
      const name = card.getAttribute("data-artist");
      const params = new URLSearchParams({ name });
      window.location.href = `artist.html?${params.toString()}`;
    });
  });

  // modal controls
  qsa("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  qs("#qty-inc").addEventListener("click", () => adjustQty(1));
  qs("#qty-dec").addEventListener("click", () => adjustQty(-1));
  buyQtyInput.addEventListener("input", updateQuote);

  // confirm buy
  qs("#confirm-buy").addEventListener("click", () => {
    if (!activeArtist) return;
    const qty = Math.max(1, Number(buyQtyInput.value || "1"));
    const price = state.prices[activeArtist] || 0;
    const cost = qty * price;
    if (cost > state.walletInRupees) {
      alert("Insufficient rupee balance.");
      return;
    }
    state.walletInRupees -= cost;
    state.holdings[activeArtist] = (state.holdings[activeArtist] || 0) + qty;

    const last =
      state.history[activeArtist][state.history[activeArtist].length - 1] ||
      state.prices[activeArtist];
    const impact = Math.min(5, Math.max(-5, qty * 0.2));
    state.history[activeArtist].push(Number((last + impact).toFixed(2)));
    if (state.history[activeArtist].length > 90)
      state.history[activeArtist].shift();

    saveState();
    updateKPIs();
    initSparklines();
    closeModal();
  });

  // confirm sell
  qs("#confirm-sell").addEventListener("click", () => {
    if (!activeArtist) return;
    const qty = Math.max(1, Number(buyQtyInput.value || "1"));
    const have = state.holdings[activeArtist] || 0;
    if (qty > have) {
      alert("You do not have enough shares.");
      return;
    }
    const price = state.prices[activeArtist] || 0;
    const revenue = qty * price;
    state.holdings[activeArtist] = have - qty;
    state.walletInRupees += revenue;

    const last =
      state.history[activeArtist][state.history[activeArtist].length - 1] ||
      state.prices[activeArtist];
    const impact = -Math.min(5, Math.max(-5, qty * 0.2));
    state.history[activeArtist].push(Number((last + impact).toFixed(2)));
    if (state.history[activeArtist].length > 90)
      state.history[activeArtist].shift();

    saveState();
    updateKPIs();
    initSparklines();
    closeModal();
  });

  // in-card activities add points ✅
  qsa("[data-activity]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pts = Number(btn.getAttribute("data-points") || "0");
      state.points = (state.points || 0) + pts;
      saveState();
      updateKPIs();
      btn.disabled = true;
      btn.textContent = `+${pts} TP Earned`;
    });
  });
}

function init() {
  updateKPIs();
  initSparklines();
  wireEvents();
}

document.addEventListener("DOMContentLoaded", init);
