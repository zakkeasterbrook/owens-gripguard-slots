const symbolSet = [
  { icon: "🪙", payout: 25 },
  { icon: "💎", payout: 0, scatter: true },
  { icon: "🚀", payout: 15 },
  { icon: "🧊", payout: 12 },
  { icon: "💹", payout: 10 },
  { icon: "🎛️", payout: 8 },
  { icon: "🔗", payout: 6 },
];

const reelsEl = document.querySelectorAll(".reel-column");
const bankrollEl = document.getElementById("bankroll");
const lastWinEl = document.getElementById("lastWin");
const multiplierEl = document.getElementById("multiplier");
const betValueEl = document.getElementById("betValue");
const spinBtn = document.getElementById("spinBtn");
const autoBtn = document.getElementById("autoBtn");
const betDownBtn = document.getElementById("betDown");
const betUpBtn = document.getElementById("betUp");
const bonusModal = document.getElementById("bonusModal");
const bonusTiles = document.getElementById("bonusTiles");
const closeBonusBtn = document.getElementById("closeBonus");

let bankroll = 500;
let bet = 10;
let lastWin = 0;
let multiplier = 1;
let isSpinning = false;
let autoPlay = false;
let autoTimeout;

function randomSymbol() {
  return symbolSet[Math.floor(Math.random() * symbolSet.length)].icon;
}

function buildInitialReels() {
  reelsEl.forEach((column) => {
    const strip = column.querySelector(".reel-strip");
    strip.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = randomSymbol();
      strip.appendChild(tile);
    }
  });
}

function toggleControls(disabled) {
  spinBtn.disabled = disabled;
  autoBtn.disabled = disabled;
  betDownBtn.disabled = disabled;
  betUpBtn.disabled = disabled;
}

function updateUI() {
  bankrollEl.textContent = bankroll;
  lastWinEl.textContent = lastWin;
  multiplierEl.textContent = `x${multiplier}`;
  betValueEl.textContent = bet;
  if (bankroll <= 0) {
    autoPlay = false;
    autoBtn.textContent = "Auto play";
  }
}

function adjustBet(delta) {
  bet = Math.min(Math.max(5, bet + delta), 100);
  if (bet > bankroll) {
    bet = bankroll;
  }
  updateUI();
}

async function spinReel(column, finalSymbol, reelIndex) {
  return new Promise((resolve) => {
    const strip = column.querySelector(".reel-strip");
    const sequence = [];
    const cycles = 14 + reelIndex * 4;
    for (let i = 0; i < cycles; i++) {
      sequence.push(randomSymbol());
    }
    const tail = [randomSymbol(), finalSymbol, randomSymbol()];
    sequence.push(...tail);

    strip.innerHTML = "";
    sequence.forEach((symbol) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = symbol;
      strip.appendChild(tile);
    });

    const tileHeight = strip.firstElementChild.getBoundingClientRect().height;
    const offset = -(tileHeight * (sequence.length - 3));

    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${1.1 + reelIndex * 0.1}s cubic-bezier(0.2, 0.7, 0.15, 1)`;
        strip.style.transform = `translateY(${offset}px)`;
      });
    });

    const handleEnd = () => {
      strip.removeEventListener("transitionend", handleEnd);
      const finalView = sequence.slice(-3);
      strip.innerHTML = "";
      finalView.forEach((symbol) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.textContent = symbol;
        strip.appendChild(tile);
      });
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
      resolve(finalView[1]);
    };

    strip.addEventListener("transitionend", handleEnd, { once: true });
  });
}

async function runBonusRound() {
  return new Promise((resolve) => {
    bonusTiles.innerHTML = "";
    const options = [3, 5, 8, 10, 12, 15].sort(() => Math.random() - 0.5).slice(0, 3);
    let resolved = false;

    const finalize = (value) => {
      if (resolved) return;
      resolved = true;
      if (value) {
        const win = bet * value;
        bankroll += win;
        lastWin = win;
        multiplier = value;
        updateUI();
      }
      bonusModal.close();
      resolve();
    };

    options.forEach((value) => {
      const btn = document.createElement("button");
      btn.className = "tile-btn";
      btn.textContent = "?";
      btn.addEventListener("click", () => {
        btn.textContent = `x${value}`;
        btn.disabled = true;
        btn.style.background = "linear-gradient(120deg, #ffed6f, #ff7ac3)";
        setTimeout(() => finalize(value), 700);
      });
      bonusTiles.appendChild(btn);
    });

    closeBonusBtn.onclick = () => finalize(null);
    bonusModal.addEventListener(
      "close",
      () => {
        if (!resolved) finalize(null);
      },
      { once: true }
    );

    bonusModal.showModal();
  });
}

async function evaluateResults(results) {
  const counts = results.reduce((acc, symbol) => {
    acc[symbol] = (acc[symbol] || 0) + 1;
    return acc;
  }, {});

  multiplier = 1;
  let winAmount = 0;

  Object.entries(counts).forEach(([symbol, count]) => {
    const entry = symbolSet.find((item) => item.icon === symbol);
    if (!entry) return;
    if (count === 3 && entry.payout) {
      winAmount = bet * entry.payout;
      multiplier = entry.payout;
    }
  });

  const scatters = counts["💎"] || 0;
  if (scatters >= 2) {
    await runBonusRound();
  }

  bankroll += winAmount;
  lastWin = winAmount;
  updateUI();
}

async function spinMachine() {
  if (isSpinning || bet > bankroll || bet <= 0) return;
  isSpinning = true;
  toggleControls(true);
  bankroll -= bet;
  updateUI();

  const targets = Array.from({ length: 3 }, () => randomSymbol());
  const results = await Promise.all(
    Array.from(reelsEl).map((column, index) => spinReel(column, targets[index], index))
  );

  await evaluateResults(results);
  isSpinning = false;
  toggleControls(false);

  if (autoPlay && bankroll >= bet) {
    autoTimeout = setTimeout(spinMachine, 400);
  } else if (autoPlay && bankroll < bet) {
    autoPlay = false;
    autoBtn.textContent = "Auto play";
  }
}

spinBtn.addEventListener("click", spinMachine);
autoBtn.addEventListener("click", () => {
  if (isSpinning) return;
  autoPlay = !autoPlay;
  autoBtn.textContent = autoPlay ? "Stop" : "Auto play";
  if (autoPlay) {
    spinMachine();
  } else {
    clearTimeout(autoTimeout);
  }
});

betDownBtn.addEventListener("click", () => adjustBet(-5));
betUpBtn.addEventListener("click", () => adjustBet(5));

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    spinMachine();
  }
});

buildInitialReels();
updateUI();
