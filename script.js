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

let currentWord = "";
let displayedLetters = [];
let guessedLetters = [];
let wrongGuesses = 0;
let correctGuesses = 0;
let gameOver = false;

const hebrewLetters = /^[אבגדהוזחטיכלמנסעפצקרשתץףןך]+$/u;

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
  } else {
    wrongGuesses += 1;
    setMessage(`האות ${letter} אינה במילה. נסה שוב.`, "error");
  }

  updateWordDisplay();
  updateLetterPanel();
  updateStatus();
  checkGameState();
}

function checkGameState() {
  if (displayedLetters.every((letter) => letter !== "_")) {
    setMessage(`ניצחת! המילה היא: ${currentWord}`, "success");
    gameOver = true;
  } else if (wrongGuesses >= maxWrong) {
    setMessage(`הפסדת. המילה היתה: ${currentWord}`, "error");
    displayedLetters = Array.from(currentWord);
    updateWordDisplay();
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
