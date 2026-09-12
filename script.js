/* =============================================
   RGB MASTER — Game Engine (Vanilla JS)
   ============================================= */

// ─── DOM Elements ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    colorBox: $("#colorBox"),
    colorBoxLabel: $("#colorBoxLabel"),
    currentScore: $("#currentScore"),
    highScore: $("#highScore"),
    streak: $("#streak"),
    round: $("#round"),
    timerContainer: $("#timerContainer"),
    timerProgress: $("#timerProgress"),
    timerText: $("#timerText"),
    resultMessage: $("#resultMessage"),
    resultIcon: $("#resultIcon"),
    resultText: $("#resultText"),
    resultDetail: $("#resultDetail"),
    newGameBtn: $("#newGameBtn"),
    // Easy
    easyPanel: $("#easyPanel"),
    optionBtns: $$(".option-btn"),
    // Medium
    mediumPanel: $("#mediumPanel"),
    sliderR: $("#sliderR"),
    sliderG: $("#sliderG"),
    sliderB: $("#sliderB"),
    sliderRVal: $("#sliderRVal"),
    sliderGVal: $("#sliderGVal"),
    sliderBVal: $("#sliderBVal"),
    mediumPreview: $("#mediumPreview"),
    mediumCheckBtn: $("#mediumCheckBtn"),
    // Hard
    hardPanel: $("#hardPanel"),
    hardR: $("#hardR"),
    hardG: $("#hardG"),
    hardB: $("#hardB"),
    hintR: $("#hintR"),
    hintG: $("#hintG"),
    hintB: $("#hintB"),
    hardPreview: $("#hardPreview"),
    hardCheckBtn: $("#hardCheckBtn"),
    attempts: $("#attempts"),
    // Expert
    expertPanel: $("#expertPanel"),
    hexInput: $("#hexInput"),
    expertPreview: $("#expertPreview"),
    expertCheckBtn: $("#expertCheckBtn"),
};

// ─── Game State ───
const state = {
    mode: "easy",
    targetColor: { r: 0, g: 0, b: 0 },
    score: 0,
    highScore: parseInt(localStorage.getItem("rgb_highscore")) || 0,
    streak: 0,
    roundNum: 1,
    gameOver: false,
    timerInterval: null,
    timeLeft: 0,
    maxTime: 0,
    attempts: 0,
};

// ─── Mode Configurations ───
const MODE_CONFIG = {
    easy:   { timer: 15, options: 6, points: 10,  label: "Kolay" },
    medium: { timer: 30, tolerance: 15, points: 20, label: "Orta" },
    hard:   { timer: 0,  points: 30, label: "Zor" },   // 0 = no timer
    expert: { timer: 10, points: 50, label: "Uzman" },
};

// ─── Constants ───
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 45; // ~283

// ──────────────────────────────────────────────
//  UTILITY FUNCTIONS
// ──────────────────────────────────────────────

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRGB() {
    return { r: randomInt(0, 255), g: randomInt(0, 255), b: randomInt(0, 255) };
}

function rgbString(c) {
    return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

function rgbToHex(c) {
    const hex = (n) => n.toString(16).padStart(2, "0").toUpperCase();
    return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
}

function hexToRGB(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length !== 6) return null;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
}

function colorsMatch(a, b, tolerance = 0) {
    return (
        Math.abs(a.r - b.r) <= tolerance &&
        Math.abs(a.g - b.g) <= tolerance &&
        Math.abs(a.b - b.b) <= tolerance
    );
}

/** Generate a decoy color that's different enough from the target */
function randomDecoy(target) {
    let decoy;
    do {
        decoy = randomRGB();
    } while (colorsMatch(decoy, target, 30)); // make sure it's different enough
    return decoy;
}

function animateElement(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // force reflow
    el.classList.add(className);
}

function celebrate(intensity = 1) {
    if (typeof confetti !== "function") return;

    confetti({
        particleCount: Math.floor(150 * intensity),
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#ff4d6a", "#4dff91", "#4d8aff", "#ffd84d", "#ff8c4d"],
    });

    if (intensity > 1) {
        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#ff4d6a", "#4dff91", "#4d8aff"],
            });
            confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#ff4d6a", "#4dff91", "#4d8aff"],
            });
        }, 300);
    }
}

// ──────────────────────────────────────────────
//  TIMER
// ──────────────────────────────────────────────

function startTimer() {
    const config = MODE_CONFIG[state.mode];
    stopTimer();

    if (config.timer === 0) {
        // No timer for this mode
        DOM.timerContainer.classList.add("no-timer");
        DOM.timerText.textContent = "";
        DOM.timerProgress.style.strokeDasharray = TIMER_CIRCUMFERENCE;
        DOM.timerProgress.style.strokeDashoffset = 0;
        return;
    }

    DOM.timerContainer.classList.remove("no-timer", "warning", "critical");
    state.maxTime = config.timer;
    state.timeLeft = config.timer;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            stopTimer();
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const { timeLeft, maxTime } = state;
    DOM.timerText.textContent = timeLeft;

    const progress = timeLeft / maxTime;
    const offset = TIMER_CIRCUMFERENCE * (1 - progress);
    DOM.timerProgress.style.strokeDasharray = TIMER_CIRCUMFERENCE;
    DOM.timerProgress.style.strokeDashoffset = offset;

    // Color warning
    DOM.timerContainer.classList.remove("warning", "critical");
    if (progress <= 0.25) {
        DOM.timerContainer.classList.add("critical");
    } else if (progress <= 0.5) {
        DOM.timerContainer.classList.add("warning");
    }
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

function handleTimeUp() {
    state.gameOver = true;
    showResult(false, "Süre doldu!");
    disableInputs();

    // Reveal correct answer in easy mode
    if (state.mode === "easy") {
        revealCorrectOption();
    }
}

// ──────────────────────────────────────────────
//  SCORE
// ──────────────────────────────────────────────

function addScore(points) {
    // Streak bonus
    const streakMultiplier = 1 + state.streak * 0.1;
    const earned = Math.round(points * streakMultiplier);

    state.score += earned;
    state.streak++;
    state.roundNum++;

    updateScoreDisplay();
    saveHighScore();

    return earned;
}

function resetStreak() {
    state.streak = 0;
    state.roundNum++;
    document.querySelector(".game-wrapper").classList.remove("on-fire");
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const animate = (el, val) => {
        if (!el) return;
        el.textContent = val;
        animateElement(el, "pop");
    };

    animate(DOM.currentScore, state.score);
    animate(DOM.highScore, state.highScore);
    animate(DOM.streak, state.streak);
    animate(DOM.round, state.roundNum);

    // Fire effect for 3+ streak
    if (state.streak >= 3) {
        document.querySelector(".game-wrapper").classList.add("on-fire");
    }
}

function saveHighScore() {
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem("rgb_highscore", state.highScore);
    }
}

// ──────────────────────────────────────────────
//  RESULT DISPLAY
// ──────────────────────────────────────────────

function showResult(success, detail = "") {
    DOM.resultMessage.classList.remove("hidden", "success", "failure");

    if (success) {
        DOM.resultMessage.classList.add("success");
        DOM.resultIcon.textContent = "🎉";
        DOM.resultText.textContent = "Tebrikler!";
        DOM.resultText.style.color = "var(--success)";
    } else {
        DOM.resultMessage.classList.add("failure");
        DOM.resultIcon.textContent = "😔";
        DOM.resultText.textContent = "Tekrar Dene!";
        DOM.resultText.style.color = "var(--error)";
    }

    DOM.resultDetail.textContent = detail;

    // Re-trigger animation
    animateElement(DOM.resultMessage, "fadeSlideIn");
}

function hideResult() {
    DOM.resultMessage.classList.add("hidden");
    DOM.resultMessage.classList.remove("success", "failure");
}

// ──────────────────────────────────────────────
//  PANEL MANAGEMENT
// ──────────────────────────────────────────────

function showPanel(mode) {
    const panels = { easy: DOM.easyPanel, medium: DOM.mediumPanel, hard: DOM.hardPanel, expert: DOM.expertPanel };
    Object.values(panels).forEach((p) => p.classList.add("hidden"));
    panels[mode].classList.remove("hidden");
}

function disableInputs() {
    // Disable all interactive elements based on mode
    DOM.optionBtns.forEach((btn) => btn.classList.add("disabled"));
    DOM.mediumCheckBtn.disabled = true;
    DOM.hardCheckBtn.disabled = true;
    DOM.expertCheckBtn.disabled = true;
    DOM.sliderR.disabled = true;
    DOM.sliderG.disabled = true;
    DOM.sliderB.disabled = true;
}

function enableInputs() {
    DOM.optionBtns.forEach((btn) => {
        btn.classList.remove("disabled", "correct-pick", "wrong-pick", "reveal-correct");
    });
    DOM.mediumCheckBtn.disabled = false;
    DOM.hardCheckBtn.disabled = false;
    DOM.expertCheckBtn.disabled = false;
    DOM.sliderR.disabled = false;
    DOM.sliderG.disabled = false;
    DOM.sliderB.disabled = false;
}

// ──────────────────────────────────────────────
//  GAME INITIALIZATION
// ──────────────────────────────────────────────

function newRound() {
    state.gameOver = false;
    state.attempts = 0;
    state.targetColor = randomRGB();

    hideResult();
    enableInputs();

    // Color box
    DOM.colorBox.style.backgroundColor = rgbString(state.targetColor);
    DOM.colorBox.classList.remove("correct", "wrong", "reveal");
    DOM.colorBoxLabel.textContent = "?";

    // Reset mode-specific UI
    resetModeUI();

    // Show correct panel
    showPanel(state.mode);

    // Start timer
    startTimer();

    // Setup mode
    switch (state.mode) {
        case "easy":
            setupEasyMode();
            break;
        case "medium":
            setupMediumMode();
            break;
        case "hard":
            setupHardMode();
            break;
        case "expert":
            setupExpertMode();
            break;
    }
}

function resetModeUI() {
    // Medium sliders
    DOM.sliderR.value = 128;
    DOM.sliderG.value = 128;
    DOM.sliderB.value = 128;
    DOM.sliderRVal.textContent = "128";
    DOM.sliderGVal.textContent = "128";
    DOM.sliderBVal.textContent = "128";
    DOM.mediumPreview.style.backgroundColor = "rgb(128,128,128)";

    // Hard inputs
    DOM.hardR.value = "";
    DOM.hardG.value = "";
    DOM.hardB.value = "";
    DOM.hintR.textContent = "";
    DOM.hintG.textContent = "";
    DOM.hintB.textContent = "";
    DOM.hintR.className = "hint-arrow";
    DOM.hintG.className = "hint-arrow";
    DOM.hintB.className = "hint-arrow";
    DOM.hardPreview.style.backgroundColor = "#000";
    DOM.attempts.textContent = "0";

    // Expert
    DOM.hexInput.value = "";
    DOM.expertPreview.style.backgroundColor = "#000";
}

// ──────────────────────────────────────────────
//  EASY MODE
// ──────────────────────────────────────────────

function setupEasyMode() {
    const correctIndex = randomInt(0, 5);

    DOM.optionBtns.forEach((btn, i) => {
        if (i === correctIndex) {
            btn.textContent = rgbString(state.targetColor);
            btn.dataset.correct = "true";
        } else {
            btn.textContent = rgbString(randomDecoy(state.targetColor));
            btn.dataset.correct = "false";
        }
    });
}

function revealCorrectOption() {
    DOM.optionBtns.forEach((btn) => {
        if (btn.dataset.correct === "true") {
            btn.classList.add("reveal-correct");
        }
    });
}

function handleEasyClick(btn) {
    if (state.gameOver) return;

    if (btn.dataset.correct === "true") {
        // Correct!
        state.gameOver = true;
        stopTimer();
        btn.classList.add("correct-pick");
        DOM.colorBox.classList.add("correct");

        // Disable others
        DOM.optionBtns.forEach((b) => {
            if (b !== btn) b.classList.add("disabled");
        });

        const earned = addScore(MODE_CONFIG.easy.points);
        showResult(true, "Doğru rengi buldun!");

        const intensity = state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1;
        celebrate(intensity);

        // Reveal the RGB on the box
        DOM.colorBoxLabel.textContent = rgbToHex(state.targetColor);
        DOM.colorBox.classList.add("reveal");
    } else {
        // Wrong
        btn.classList.add("wrong-pick");
        setTimeout(() => btn.classList.add("disabled"), 400);
        DOM.colorBox.classList.add("wrong");
        setTimeout(() => DOM.colorBox.classList.remove("wrong"), 500);
    }
}

// ──────────────────────────────────────────────
//  MEDIUM MODE
// ──────────────────────────────────────────────

function setupMediumMode() {
    updateMediumPreview();
}

function updateMediumPreview() {
    const r = parseInt(DOM.sliderR.value);
    const g = parseInt(DOM.sliderG.value);
    const b = parseInt(DOM.sliderB.value);
    DOM.sliderRVal.textContent = r;
    DOM.sliderGVal.textContent = g;
    DOM.sliderBVal.textContent = b;
    DOM.mediumPreview.style.backgroundColor = `rgb(${r},${g},${b})`;
}

function handleMediumCheck() {
    if (state.gameOver) return;

    const guess = {
        r: parseInt(DOM.sliderR.value),
        g: parseInt(DOM.sliderG.value),
        b: parseInt(DOM.sliderB.value),
    };

    const tol = MODE_CONFIG.medium.tolerance;

    if (colorsMatch(guess, state.targetColor, tol)) {
        // Correct!
        state.gameOver = true;
        stopTimer();
        DOM.colorBox.classList.add("correct");
        disableInputs();

        const earned = addScore(MODE_CONFIG.medium.points);
        showResult(true, `Harika! Fark: R±${Math.abs(guess.r - state.targetColor.r)}, G±${Math.abs(guess.g - state.targetColor.g)}, B±${Math.abs(guess.b - state.targetColor.b)}`);
        celebrate(state.streak >= 3 ? 1.5 : 1);

        DOM.colorBoxLabel.textContent = rgbToHex(state.targetColor);
        DOM.colorBox.classList.add("reveal");
    } else {
        // Wrong
        DOM.colorBox.classList.add("wrong");
        setTimeout(() => DOM.colorBox.classList.remove("wrong"), 500);
        showResult(false, `Daha yaklaş! Tolerans: ±${tol}`);
    }
}

// ──────────────────────────────────────────────
//  HARD MODE
// ──────────────────────────────────────────────

function setupHardMode() {
    updateHardPreview();
}

function updateHardPreview() {
    const r = parseInt(DOM.hardR.value) || 0;
    const g = parseInt(DOM.hardG.value) || 0;
    const b = parseInt(DOM.hardB.value) || 0;
    DOM.hardPreview.style.backgroundColor = `rgb(${r},${g},${b})`;
}

function updateHint(hintEl, guess, target) {
    hintEl.className = "hint-arrow";
    if (guess < target) {
        hintEl.textContent = "▲";
        hintEl.classList.add("up");
    } else if (guess > target) {
        hintEl.textContent = "▼";
        hintEl.classList.add("down");
    } else {
        hintEl.textContent = "✓";
        hintEl.classList.add("correct");
    }
    animateElement(hintEl, "fadeSlideIn");
}

function handleHardCheck() {
    if (state.gameOver) return;

    state.attempts++;
    DOM.attempts.textContent = state.attempts;

    const r = parseInt(DOM.hardR.value) || 0;
    const g = parseInt(DOM.hardG.value) || 0;
    const b = parseInt(DOM.hardB.value) || 0;

    updateHint(DOM.hintR, r, state.targetColor.r);
    updateHint(DOM.hintG, g, state.targetColor.g);
    updateHint(DOM.hintB, b, state.targetColor.b);

    if (r === state.targetColor.r && g === state.targetColor.g && b === state.targetColor.b) {
        // Correct!
        state.gameOver = true;
        stopTimer();
        DOM.colorBox.classList.add("correct");
        disableInputs();

        // Bonus for fewer attempts
        const attemptBonus = Math.max(0, 10 - state.attempts) * 5;
        const basePoints = MODE_CONFIG.hard.points + attemptBonus;
        const earned = addScore(basePoints);
        showResult(true, `${state.attempts} denemede buldun!`);
        celebrate(state.attempts <= 3 ? 2 : 1);

        DOM.colorBoxLabel.textContent = rgbToHex(state.targetColor);
        DOM.colorBox.classList.add("reveal");
    } else {
        DOM.colorBox.classList.add("wrong");
        setTimeout(() => DOM.colorBox.classList.remove("wrong"), 500);
    }
}

// ──────────────────────────────────────────────
//  EXPERT MODE
// ──────────────────────────────────────────────

function setupExpertMode() {
    DOM.hexInput.value = "";
    DOM.expertPreview.style.backgroundColor = "#000";
}

function updateExpertPreview() {
    const hex = DOM.hexInput.value.trim();
    const c = hexToRGB(hex);
    if (c) {
        DOM.expertPreview.style.backgroundColor = rgbString(c);
    } else {
        DOM.expertPreview.style.backgroundColor = "#000";
    }
}

function handleExpertCheck() {
    if (state.gameOver) return;

    const hex = DOM.hexInput.value.trim();
    const guess = hexToRGB(hex);

    if (!guess) {
        showResult(false, "Geçerli bir HEX kodu gir! (ör: FF5733)");
        return;
    }

    state.gameOver = true;
    stopTimer();
    disableInputs();

    // Calculate distance
    const dist = Math.sqrt(
        (guess.r - state.targetColor.r) ** 2 +
        (guess.g - state.targetColor.g) ** 2 +
        (guess.b - state.targetColor.b) ** 2
    );

    if (dist <= 20) {
        // Very close = success
        DOM.colorBox.classList.add("correct");
        const closeness = Math.max(0, Math.round(100 - dist));
        const points = Math.round(MODE_CONFIG.expert.points * (closeness / 100));
        const earned = addScore(points);
        showResult(true, `Mükemmel! Mesafe: ${dist.toFixed(1)} (doğru: ${rgbToHex(state.targetColor)})`);
        celebrate(dist <= 5 ? 2 : 1);
    } else {
        // Fail
        DOM.colorBox.classList.add("wrong");
        setTimeout(() => DOM.colorBox.classList.remove("wrong"), 500);
        resetStreak();
        showResult(false, `Mesafe: ${dist.toFixed(1)} — Doğru cevap: ${rgbToHex(state.targetColor)}`);
    }

    DOM.colorBoxLabel.textContent = rgbToHex(state.targetColor);
    DOM.colorBox.classList.add("reveal");
}

// ──────────────────────────────────────────────
//  EVENT LISTENERS
// ──────────────────────────────────────────────

// Mode tabs
$$(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        if (tab.classList.contains("active")) return;
        $$(".mode-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        state.mode = tab.dataset.mode;
        stopTimer();
        newRound();
    });
});

// Easy mode options
DOM.optionBtns.forEach((btn) => {
    btn.addEventListener("click", () => handleEasyClick(btn));
});

// Medium mode sliders
[DOM.sliderR, DOM.sliderG, DOM.sliderB].forEach((slider) => {
    slider.addEventListener("input", updateMediumPreview);
});
DOM.mediumCheckBtn.addEventListener("click", handleMediumCheck);

// Hard mode inputs
[DOM.hardR, DOM.hardG, DOM.hardB].forEach((input) => {
    input.addEventListener("input", updateHardPreview);
});
DOM.hardCheckBtn.addEventListener("click", handleHardCheck);

// Hard mode: Enter key support
[DOM.hardR, DOM.hardG, DOM.hardB].forEach((input) => {
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleHardCheck();
    });
});

// Expert mode
DOM.hexInput.addEventListener("input", updateExpertPreview);
DOM.expertCheckBtn.addEventListener("click", handleExpertCheck);
DOM.hexInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleExpertCheck();
});

// New game
DOM.newGameBtn.addEventListener("click", () => {
    newRound();
});

// ──────────────────────────────────────────────
//  INITIALIZE
// ──────────────────────────────────────────────

function init() {
    state.highScore = parseInt(localStorage.getItem("rgb_highscore")) || 0;
    updateScoreDisplay();
    newRound();
}

init();
