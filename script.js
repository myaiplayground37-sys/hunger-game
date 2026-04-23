const words = [
  "חקלאי",
  "אינדיאנה",
  "טבעת",
  "מחנה",
  "ברח","גן",
  "אפרטהייד",
  "אדמה",
  "גיבור",
  "חירות",
  "נמר"  
];

const maxWrong = 6;
const wordDisplay = document.getElementById("wordDisplay");
const guessedLettersContainer = document.getElementById("guessedLetters");
const messageBox = document.getElementById("messageBox");
const correctCount = document.getElementById("correctCount");
const wrongCount = document.getElementById("wrongCount");
const remainingCount = document.getElementById("remainingCount");
const letterInput = document.getElementById("letterInput");
const guessButton = document.getElementById("guessButton");
const resetButton = document.getElementById("resetButton");
const confettiContainer = document.getElementById("confettiContainer");

let currentWord = "";
let displayedLetters = [];
let guessedLetters = [];
let wrongGuesses = 0;
let correctGuesses = 0;
let gameOver = false;
let audioCtx = null;

const hebrewLetters = /^[א-ת]+$/u;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration = 0.14, type = "sine", volume = 0.18) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playPattern(notes) {
  for (const note of notes) {
    playTone(note.freq, note.duration, note.type, note.volume);
    await wait((note.duration + (note.pause || 0)) * 1000);
  }
}

function playCorrectSound() {
  playPattern([
    { freq: 440, duration: 0.1, type: "triangle", volume: 0.16 },
    { freq: 550, duration: 0.1, type: "triangle", volume: 0.16, pause: 0.02 },
    { freq: 660, duration: 0.12, type: "triangle", volume: 0.16, pause: 0.02 },
  ]);
}

function playWrongSound() {
  playPattern([
    { freq: 220, duration: 0.16, type: "square", volume: 0.16 },
    { freq: 180, duration: 0.12, type: "square", volume: 0.12, pause: 0.03 },
  ]);
}

function playWinTune() {
  playPattern([
    { freq: 523, duration: 0.18, type: "sine", volume: 0.17 },
    { freq: 660, duration: 0.18, type: "sine", volume: 0.17, pause: 0.04 },
    { freq: 784, duration: 0.24, type: "sine", volume: 0.18, pause: 0.02 },
    { freq: 988, duration: 0.3, type: "sine", volume: 0.18, pause: 0.04 },
  ]);
}

function playSadTune() {
  playPattern([
    { freq: 330, duration: 0.16, type: "sawtooth", volume: 0.16 },
    { freq: 294, duration: 0.16, type: "sawtooth", volume: 0.16, pause: 0.02 },
    { freq: 262, duration: 0.2, type: "sawtooth", volume: 0.14, pause: 0.03 },
    { freq: 220, duration: 0.28, type: "sawtooth", volume: 0.14 },
  ]);
}

function clearConfetti() {
  if (confettiContainer) {
    confettiContainer.innerHTML = "";
  }
}

function burstConfetti() {
  if (!confettiContainer) return;
  clearConfetti();
  const colors = ["#6f9cff", "#ff5ae0", "#3be3a0", "#ffd166", "#ff7f50"];
  const pieces = 80;
  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const size = Math.random() * 10 + 6;
    const x = Math.random() * 100;
    const duration = Math.random() * 1.2 + 2.4;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${x}vw`;
    piece.style.top = "-15px";
    piece.style.setProperty("--x", `${Math.random() * 80 - 40}vw`);
    piece.style.setProperty("--duration", `${duration}s`);
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.opacity = String(0.9 + Math.random() * 0.1);
    confettiContainer.appendChild(piece);
  }
  setTimeout(clearConfetti, 5000);
}

function pickWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function createDisplayArray(word) {
  return Array.from(word).map((letter) => (letter === " " ? " " : "_"));
}

function updateWordDisplay() {
  wordDisplay.innerHTML = "";
  displayedLetters.forEach((letter) => {
    const span = document.createElement("span");
    span.className = "word-letter";
    span.textContent = letter;
    wordDisplay.appendChild(span);
  });
}

function updateLetterPanel() {
  guessedLettersContainer.innerHTML = "";
  guessedLetters.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = `guess-chip ${item.correct ? "correct" : "wrong"}`;
    chip.textContent = item.letter;
    guessedLettersContainer.appendChild(chip);
  });
}

function updateStatus() {
  correctCount.textContent = correctGuesses;
  wrongCount.textContent = wrongGuesses;
  remainingCount.textContent = maxWrong - wrongGuesses;
}

function setMessage(text, type = "info") {
  messageBox.textContent = text;
  if (type === "success") {
    messageBox.style.background = "rgba(56, 211, 159, 0.16)";
  } else if (type === "error") {
    messageBox.style.background = "rgba(255, 90, 224, 0.14)";
  } else {
    messageBox.style.background = "rgba(111, 156, 255, 0.08)";
  }
}

function sanitizeInput(value) {
  return value.trim().replace(/\u200f|\u200e/g, "");
}

function handleGuess() {
  if (gameOver) return;

  const rawValue = sanitizeInput(letterInput.value);
  const letter = rawValue;
  letterInput.value = "";

  if (!letter || !hebrewLetters.test(letter)) {
    setMessage("אנא הזן אות עברית חוקית אחת.", "error");
    return;
  }

  if (guessedLetters.some((item) => item.letter === letter)) {
    setMessage("כבר ניסית את האות הזו. נסה אות אחרת.", "error");
    return;
  }

  const matches = Array.from(currentWord).map((char, index) => ({ char, index })).filter((item) => item.char === letter);
  const isCorrect = matches.length > 0;

  guessedLetters.push({ letter, correct: isCorrect });

  if (isCorrect) {
    matches.forEach((match) => {
      if (displayedLetters[match.index] === "_") {
        displayedLetters[match.index] = letter;
        correctGuesses += 1;
      }
    });
    setMessage("מזל טוב! האות נמצאה במילה.", "success");
    playCorrectSound();
  } else {
    wrongGuesses += 1;
    setMessage(`האות ${letter} אינה במילה. נסה שוב.`, "error");
    playWrongSound();
  }

  updateWordDisplay();
  updateLetterPanel();
  updateStatus();
  checkGameState();
  letterInput.focus();
}

function checkGameState() {
  if (displayedLetters.every((letter) => letter !== "_")) {
    setMessage(`ניצחת! המילה היא: ${currentWord}`, "success");
    burstConfetti();
    playWinTune();
    gameOver = true;
  } else if (wrongGuesses >= maxWrong) {
    setMessage(`הפסדת. המילה היתה: ${currentWord}`, "error");
    displayedLetters = Array.from(currentWord);
    updateWordDisplay();
    playSadTune();
    gameOver = true;
  }
}

function startGame() {
  currentWord = pickWord();
  displayedLetters = createDisplayArray(currentWord);
  guessedLetters = [];
  wrongGuesses = 0;
  correctGuesses = 0;
  gameOver = false;
  updateWordDisplay();
  updateLetterPanel();
  updateStatus();
  setMessage("בחר מילה, והכנס אות בעברית כדי להתחיל לשחק.");
  letterInput.focus();
}

guessButton.addEventListener("click", handleGuess);
letterInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleGuess();
  }
});

resetButton.addEventListener("click", startGame);

startGame();
