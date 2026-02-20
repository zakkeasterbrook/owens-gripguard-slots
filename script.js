const symbols = ["7️⃣", "💎", "💰", "🔧", "⚡", "🍀"];
const payouts = {
  "7️⃣": 20,
  "💎": 0, // scatter logic handled separately
  "💰": 12,
  "🔧": 10,
  "⚡": 8,
  "🍀": 6,
};

const reelsElement = document.getElementById("reels");
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
let autoPlay = false;
let autoInterval;

function createReels() {
  reelsElement.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const column = document.createElement("div");
    column.className = "reel-column";
    const list = document.createElement("ul");
    column.appendChild(list);
    reelsElement.appendChild(column);
  }
}

function spinReels() {
  const results = [];
  document.querySelectorAll(".reel-column ul").forEach((ul) => {
    ul.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const li = document.createElement("li");
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      li.textContent = symbol;
      ul.appendChild(li);
      if (i === 2) {
        results.push(symbol);
      }
    }
  });
  return results;
}

function evaluate(results) {
  const counts = results.reduce((acc, symbol) => {
    acc[symbol] = (acc[symbol] || 0) + 1;
    return acc;
  }, {});

  let winAmount = 0;
  multiplier = 1;

  Object.entries(counts).forEach(([symbol, count]) => {
    if (count === 3 && payouts[symbol]) {
      winAmount = bet * payouts[symbol];
      multiplier = payouts[symbol];
    }
  });

  const scatters = counts["💎"] || 0;
  if (scatters >= 2) {
    triggerBonus();
  }

  bankroll += winAmount;
  lastWin = winAmount;
  updateUI();
}

function updateUI() {
  bankrollEl.textContent = bankroll;
  lastWinEl.textContent = lastWin;
  multiplierEl.textContent = `x${multiplier}`;
  betValueEl.textContent = bet;
  spinBtn.disabled = bankroll <= 0 || bet > bankroll;
}

function playSpin() {
  if (bet > bankroll) return;
  bankroll -= bet;
  updateUI();
  const results = spinReels();
  setTimeout(() => evaluate(results), 600);
}

function triggerBonus() {
  bonusTiles.innerHTML = "";
  const multipliers = [3, 5, 8, 10, 12, 15];
  const choices = multipliers.sort(() => 0.5 - Math.random()).slice(0, 3);
  choices.forEach((value, index) => {
    const btn = document.createElement("button");
    btn.className = "tile-btn";
    btn.textContent = "?";
    btn.addEventListener("click", () => revealBonus(btn, value));
    bonusTiles.appendChild(btn);
  });
  bonusModal.showModal();
}

function revealBonus(btn, value) {
  btn.textContent = `x${value}`;
  btn.disabled = true;
  const bonusWin = bet * value;
  bankroll += bonusWin;
  lastWin = bonusWin;
  multiplier = value;
  updateUI();
  setTimeout(() => bonusModal.close(), 1000);
}

spinBtn.addEventListener("click", playSpin);
autoBtn.addEventListener("click", () => {
  autoPlay = !autoPlay;
  autoBtn.textContent = autoPlay ? "Stop Auto" : "Auto Play";
  if (autoPlay) {
    autoInterval = setInterval(() => {
      if (bankroll <= 0) {
        autoPlay = false;
        autoBtn.textContent = "Auto Play";
        clearInterval(autoInterval);
        return;
      }
      playSpin();
    }, 1200);
  } else {
    clearInterval(autoInterval);
  }
});

betDownBtn.addEventListener("click", () => {
  bet = Math.max(5, bet - 5);
  updateUI();
});

betUpBtn.addEventListener("click", () => {
  bet = Math.min(100, bet + 5);
  updateUI();
});

closeBonusBtn.addEventListener("click", () => bonusModal.close());

createReels();
updateUI();
