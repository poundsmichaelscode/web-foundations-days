const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const DRAFT_KEY = "quicknotes-draft";
const THEME_KEY = "quicknotes-theme";

/*
  Updates the character and word counters.

  - More than 180 characters: warning class
  - More than 200 characters: over class
*/
function updateCounts() {
  const text = noteText.value;
  const characters = text.length;

  const trimmedText = text.trim();

  const words =
    trimmedText === ""
      ? 0
      : trimmedText.split(/\s+/).length;

  charCount.textContent = `${characters} / 200 characters`;
  wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;

  charCount.classList.remove("warning", "over");

  if (characters > 200) {
    charCount.classList.add("over");
  } else if (characters > 180) {
    charCount.classList.add("warning");
  }
}

/*
  Clears the textarea, counters,
  and saved draft.
*/
function clearNote() {
  noteText.value = "";

  localStorage.removeItem(DRAFT_KEY);

  updateCounts();

  noteText.focus();
}

/*
  Saves the note and updates counters
  whenever the user types.
*/
noteText.addEventListener("input", () => {
  updateCounts();

  localStorage.setItem(DRAFT_KEY, noteText.value);
});

/*
  Clear button
*/
clearBtn.addEventListener("click", clearNote);

/*
  Pressing Escape inside the textarea
  also clears the note.
*/
noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearNote();
  }
});

/*
  Theme toggle
*/
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const darkModeEnabled =
    document.body.classList.contains("dark");

  if (darkModeEnabled) {
    themeToggle.textContent = "Light mode";
    localStorage.setItem(THEME_KEY, "dark");
  } else {
    themeToggle.textContent = "Dark mode";
    localStorage.setItem(THEME_KEY, "light");
  }
});

/*
  Restore saved draft and theme
  when the page loads.
*/
const savedDraft = localStorage.getItem(DRAFT_KEY);

if (savedDraft !== null) {
  noteText.value = savedDraft;
}

const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
} else {
  document.body.classList.remove("dark");
  themeToggle.textContent = "Dark mode";
}

updateCounts();
