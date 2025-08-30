async function getPlayerNumber() {
    const response = await fetch("https://script.google.com/macros/s/AKfycbyvxKuVPfAydGyqMXfHUz7EuLxLik5OuPVVLlJBAf2xN0LbVWZGLR5K7TWqpimfp6iA/exec");
    const lastRow = await response.text(); // returns the total rows
    let lastPlayerNum = parseInt(lastRow) || 0;
    lastPlayerNum++; // increment for new player
    return `Player${lastPlayerNum}`;
}

function sendResultToSheet(player, timeDiff, feedback, result) {
  document.getElementById("playerInput").value = player;
  document.getElementById("timeDiffInput").value = timeDiff;
  document.getElementById("feedbackInput").value = feedback;
  document.getElementById("resultInput").value = result;
  document.getElementById("resultForm").submit();
  console.log("Data sent via form POST");
}

let timerStart, timerEnd;
let hearts = 3;
let currentGameIndex = 0;
const gamesOrder = ["game2", "game5", "game1", "game4", "game3"];
let dragged;
let activeIntervals = [];

function clearAllIntervals() {
    activeIntervals.forEach(i => clearInterval(i));
    activeIntervals = [];
}

function goToScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    const heartsEl = document.getElementById("hearts");
    heartsEl.style.display = (id.startsWith("game") || id === "screen6") ? "block" : "none";
    document.getElementById("stopBtn").style.display = (id.startsWith("game") || id === "screen6") ? "block" : "none";
}

async function startGame() {
    playerName = await getPlayerNumber();
    console.log("Current player:", playerName);

    timerStart = new Date();
    hearts = 3;
    document.getElementById("hearts").textContent = "❤️❤️❤️";
    currentGameIndex = 0;
    goToScreen("countdownScreen");

    let count = 3;
    let countdownEl = document.getElementById("countdownNumber");
    countdownEl.textContent = count;

    let interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(interval);
            goToGame(gamesOrder[currentGameIndex]);
        }
    }, 1000);
}

function showPopup(message, nextGameId) {
    const popupScreen = document.getElementById("popupScreen");
    const popup = document.getElementById("popupMessage");
    const heartsEl = document.getElementById("hearts");

    // Hide hearts
    heartsEl.style.display = "none";

    // Set message and animate
    popup.textContent = message;
    popup.style.animation = "none";
    void popup.offsetWidth; // restart animation
    popup.style.animation = "popupZoom 1.5s ease forwards";

    // Show popup
    goToScreen("popupScreen");
    popupScreen.style.display = "flex";

    setTimeout(() => {
        popupScreen.style.display = "none";
        goToScreen(nextGameId);
        startSpecificGame(nextGameId);
    }, 1500);
}

// Start games by ID
function startSpecificGame(gameId) {
    switch (gameId) {
        case "game1": startEmojiGame(); break;
        case "game2": startBatteryGame(); break;
        case "game3": startSpamGame(); break;
        case "game4": break;
        case "game5": startCatchGame(); break;
    }
}

function goToGame(gameId) {
    let message = "";
    switch (gameId) {
        case "game1": message = "تذكر!"; break;
        case "game2": message = "اشحن!"; break;
        case "game3": message = "امسح!"; break;
        case "game4": message = "اختر!"; break;
        case "game5": message = "التقط!"; break;
    }
    showPopup(message, gameId);
}

function goToNextGame() {
    currentGameIndex++;
    if (currentGameIndex >= gamesOrder.length) {
        goToScreen("screen6");
        return;
    }
    goToGame(gamesOrder[currentGameIndex]);
}

function loseHeart() {
    hearts--;
    document.getElementById("hearts").textContent = "❤️".repeat(hearts);
    if (hearts <= 0) {
        goToScreen("screen6");
    } else {
        goToNextGame();
    }
}

/* ===== Emoji Game ===== */
function startEmojiGame() {
    const emojis = ["⌨️", "🖱️", "💻", "🎤", "📱"];
    const correctOrder = [...emojis];

    const emojiBox = document.getElementById("emojiBox");
    const dropBox = document.getElementById("dropBox");
    if (!emojiBox || !dropBox) return;

    emojiBox.innerHTML = "";
    dropBox.innerHTML = "";

    // Show correct order first
    correctOrder.forEach(e => {
        const box = document.createElement("div");
        box.classList.add("emoji-slot");
        box.textContent = e;
        emojiBox.appendChild(box);
    });

    setTimeout(() => {
        // Reset slots
        emojiBox.innerHTML = "";
        correctOrder.forEach(() => {
            const slot = document.createElement("div");
            slot.classList.add("emoji-slot");
            slot.dataset.filled = "false";
            emojiBox.appendChild(slot);
        });

        // Shuffle emojis
        const shuffled = [...emojis].sort(() => Math.random() - 0.5);
        shuffled.forEach(e => {
            const span = document.createElement("span");
            span.textContent = e;
            span.classList.add("draggable-emoji");
            span.draggable = true;

            // Mouse drag
            span.addEventListener("dragstart", ev => dragged = ev.target);

            // Touch drag
            span.addEventListener("touchstart", ev => {
                ev.preventDefault();
                dragged = ev.target;
                dragged.style.position = "absolute";
                dragged.style.zIndex = 1000;
            });

            span.addEventListener("touchmove", ev => {
                ev.preventDefault();
                const touch = ev.touches[0];
                dragged.style.left = touch.pageX - dragged.offsetWidth / 2 + "px";
                dragged.style.top = touch.pageY - dragged.offsetHeight / 2 + "px";
            });

            span.addEventListener("touchend", ev => {
                ev.preventDefault();
                const touch = ev.changedTouches[0];
                let dropped = false;
                document.querySelectorAll(".emoji-slot").forEach(slot => {
                    const rect = slot.getBoundingClientRect();
                    if (
                        touch.clientX >= rect.left &&
                        touch.clientX <= rect.right &&
                        touch.clientY >= rect.top &&
                        touch.clientY <= rect.bottom &&
                        slot.dataset.filled === "false"
                    ) {
                        slot.textContent = dragged.textContent;
                        slot.dataset.filled = "true";
                        dropped = true;
                    }
                });
                if (dropped) dragged.remove();

                const attempt = Array.from(document.querySelectorAll(".emoji-slot")).map(s => s.textContent);
                if (attempt.every(val => val !== "")) {
                    attempt.join("") === correctOrder.join("") ? goToNextGame() : loseHeart();
                }
            });

            dropBox.appendChild(span);
        });

        // Mouse drop events
        document.querySelectorAll(".emoji-slot").forEach(slot => {
            slot.addEventListener("dragover", e => e.preventDefault());
            slot.addEventListener("drop", e => {
                e.preventDefault();
                if (!dragged) return;
                if (slot.dataset.filled === "false") {
                    slot.textContent = dragged.textContent;
                    slot.dataset.filled = "true";
                    dragged.remove();
                }
                const attempt = Array.from(document.querySelectorAll(".emoji-slot")).map(s => s.textContent);
                if (attempt.every(val => val !== "")) attempt.join("") === correctOrder.join("") ? goToNextGame() : loseHeart();
            });
        });

    }, 3000);
}

/* ===== Battery Game ===== */
function startBatteryGame() {
    const battery = document.getElementById("battery");
    const batteryLevel = document.getElementById("batteryLevel");
    let levelPercent = 45;
    batteryLevel.style.height = levelPercent + "%";
    batteryLevel.style.background = "red";

    let drainInterval = setInterval(() => {
        levelPercent -= 2;
        if (levelPercent <= 0) {
            levelPercent = 0;
            batteryLevel.style.height = levelPercent + "%";
            clearInterval(drainInterval);
            loseHeart();
        } else {
            batteryLevel.style.height = levelPercent + "%";
            updateBatteryColor(levelPercent);
        }
    }, 200);
    activeIntervals.push(drainInterval);

    battery.onclick = () => {
        levelPercent += 10;
        if (levelPercent > 100) levelPercent = 100;
        batteryLevel.style.height = levelPercent + "%";
        updateBatteryColor(levelPercent);
        if (levelPercent >= 100) {
            clearInterval(drainInterval);
            goToNextGame();
        }
    };

    function updateBatteryColor(level) {
        if (level >= 70) batteryLevel.style.background = "green";
        else if (level >= 40) batteryLevel.style.background = "orange";
        else batteryLevel.style.background = "red";
    }
}

/* ===== Spam Emails Game ===== */
function startSpamGame() {
    const emails = document.getElementById("emails");
    emails.innerHTML = "";

    let list = [
        {text:"You won $$$!", spam:true},
        {text:"Project deadline tomorrow", spam:false},
        {text:"Win a million!!!", spam:true},
        {text:"Meeting at 3pm", spam:false},
        {text:"You won prize", spam:true},
        {text:"Class cancelled today", spam:false},
        {text:"Claim your reward now!", spam:true}
    ];

    let shown = 0;
    let remainingSpam = list.filter(m => m.spam).length;

    function showNextEmail() {
        if (shown >= list.length) {
            if (remainingSpam <= 0) goToNextGame();
            return;
        }

        let mail = list[shown];
        let div = document.createElement("div");
        div.classList.add("email-card");
        div.textContent = mail.text;

        let areaWidth = emails.offsetWidth;
        let areaHeight = emails.offsetHeight;
        div.style.left = Math.random() * (areaWidth - 200) + "px";
        div.style.top = Math.random() * (areaHeight - 100) + "px";
        emails.appendChild(div);

        enableSwipe(div, direction => {
            if (direction === "left") {
                div.style.opacity = "0";
                div.remove();
                if (mail.spam) {
                    remainingSpam--;
                    if (remainingSpam <= 0) setTimeout(goToNextGame, 500);
                } else {
                    loseHeart();
                }
            }
        });

        shown++;
        if (shown < list.length) setTimeout(showNextEmail, 1200);
    }

    showNextEmail();
}

function enableSwipe(element, onSwipe) {
    let startX, startY;

    element.addEventListener("mousedown", startDrag);
    element.addEventListener("touchstart", startDrag);

    function startDrag(e) {
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        startY = e.touches ? e.touches[0].clientY : e.clientY;

        document.addEventListener("mousemove", onDrag);
        document.addEventListener("touchmove", onDrag);
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchend", endDrag);
    }

    function onDrag(e) {
        e.preventDefault();
        let x = e.touches ? e.touches[0].clientX : e.clientX;
        let dx = x - startX;
        element.style.transform = `translateX(${dx}px)`;
    }

    function endDrag(e) {
        let x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        let dx = x - startX;
        if (dx < -100) onSwipe("left");
        else element.style.transform = "translateX(0)";

        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("touchmove", onDrag);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchend", endDrag);
    }
}

/* ===== Password Game ===== */
function checkPassword(strength) {
    strength === "strong" ? goToNextGame() : loseHeart();
}

/* ===== Catch Game ===== */
function startCatchGame() {
    const area = document.getElementById("catchArea");
    area.innerHTML = "";

    let emojis = ["💻", "📱", "🤖", "🕹️", "🐱", "🍕", "🕶️", "🎈"];
    let count = 0, target = 6;

    let interval = setInterval(() => {
        let span = document.createElement("span");
        span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.position = "absolute";
        span.style.left = Math.random() * 90 + "%";
        span.style.top = "0";
        span.style.fontSize = "30px";
        span.style.cursor = "pointer";
        area.appendChild(span);

        let fall = setInterval(() => {
            let top = parseInt(span.style.top);
            span.style.top = (top + 5) + "px";
            if (top > 350) {
                span.remove();
                clearInterval(fall);
            }
        }, 100);
        activeIntervals.push(fall);

        span.onclick = () => {
            if (["💻","📱","🤖","🕹️"].includes(span.textContent)) {
                count++;
                span.remove();
                if (count >= target) {
                    clearAllIntervals();
                    goToNextGame();
                }
            } else {
                clearAllIntervals();
                loseHeart();
            }
        };

    }, 800);
    activeIntervals.push(interval);
}

/* ===== Results ===== */
function stopTimer() {
    clearAllIntervals();
    timerEnd = new Date();
    let elapsed = Math.floor((timerEnd - timerStart) / 1000);
    let diff = Math.abs(60 - elapsed);

    document.getElementById("final-time").textContent = `لقد توقفت عند ${elapsed} ثانية.`;
    document.getElementById("time-diff").textContent = `الفرق من 60 ثانية: ${diff} ثانية.`;

    let feedback = "";
    if (diff <= 2) feedback = "توقيت ممتاز ⏱️";
    else if (diff <= 5) feedback = "👏 جيد جدًا 👏";
    else feedback = "😅 أوه… ضيعت الإحساس بالوقت 😅";

    document.getElementById("time-feedback").textContent = feedback;
    goToScreen("screen7");

    sendResultToSheet(
    playerName,
    elapsed,
    feedback,
    diff <= 5 ? "Win" : "Lose"

);

}

/* ===== Restart Game ===== */
function restartGame() {
    clearAllIntervals();
    hearts = 3;
    currentGameIndex = 0;
    document.getElementById("hearts").textContent = "❤️❤️❤️";
    document.getElementById("stopBtn").style.display = "none";
    document.getElementById("hearts").style.display = "none";

    document.getElementById("emojiBox").innerHTML = "";
    let dropBox = document.getElementById("dropBox");
    dropBox.innerHTML = "";
    dropBox.replaceWith(dropBox.cloneNode(true));

    const battery = document.getElementById("battery");
    document.getElementById("batteryLevel").style.height = "30%";
    battery.replaceWith(battery.cloneNode(true));

    document.getElementById("emails").innerHTML = "";
    document.getElementById("catchArea").innerHTML = "";

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("screen1").classList.add("active");

    timerStart = null;
    timerEnd = null;
}

/* ===== Enforce Landscape Mode ===== */
function enforceLandscape() {
    const rotateMsg = document.getElementById("rotateMessage");

    // Detect tablet/iPad by width range (adjust if needed)
    const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;

    if (isTablet && window.innerHeight > window.innerWidth) {
        // iPad/tablet in portrait
        rotateMsg.style.display = "flex";
        document.body.style.transform = "none"; // optional
    } else {
        // Landscape or not a tablet
        rotateMsg.style.display = "none";
        document.body.style.transform = "none";
    }
}

window.addEventListener("resize", enforceLandscape);
window.addEventListener("orientationchange", enforceLandscape);
window.addEventListener("load", enforceLandscape);