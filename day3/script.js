let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

/*
  1. searchNotes(word)

  Returns all notes whose text contains the supplied word.
  The comparison ignores upper and lower case.
*/
function searchNotes(word) {
  const searchWord = word.toLowerCase();

  return notes.filter((note) =>
    note.text.toLowerCase().includes(searchWord)
  );
}

// Expected: notes containing "day"
console.log(searchNotes("day"));
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]

// Expected: same result because the search is case-insensitive
console.log(searchNotes("DAY"));
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]

// Edge case: no matching notes
console.log(searchNotes("football"));
// Expected: []


/*
  2. longestNote()

  Returns the note object with the longest text.
  Returns null when the notes array is empty.
*/
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}

// Expected: the note with the longest text
console.log(longestNote());
// Expected:
// {
//   id: 3,
//   text: "Email the project report to Grace",
//   category: "work"
// }

// Edge case test using temporary empty array
const savedNotesForLongest = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = savedNotesForLongest;


/*
  3. countByCategory()

  Returns an object showing the number of notes
  in each category.
*/
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

// Normal case
console.log(countByCategory());
// Expected:
// { personal: 2, study: 2, work: 1 }

// Edge case using empty notes
const savedNotesForCount = notes;
notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotesForCount;


/*
  4. getSummary()

  Returns a readable summary of the current notes.
*/
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;

  const noteWord = total === 1 ? "note" : "notes";

  const personal = counts.personal || 0;
  const work = counts.work || 0;
  const study = counts.study || 0;

  return `${total} ${noteWord}: ${personal} personal, ${work} work, ${study} study.`;
}

// Normal case
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

// Edge case: exactly one note
const savedNotesForSummary = notes;

notes = [
  { id: 1, text: "Test note", category: "personal" },
];

console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."

notes = savedNotesForSummary;


/*
  5. isDuplicate(text)

  Returns true if a note already contains the exact same text,
  ignoring upper/lower case and extra spaces at the beginning
  or end.
*/
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();

  return notes.some(
    (note) => note.text.trim().toLowerCase() === cleanedText
  );
}

// Existing note
console.log(isDuplicate("Buy milk and bread"));
// Expected: true

// Same note with different case and extra spaces
console.log(isDuplicate("   BUY MILK AND BREAD   "));
// Expected: true

// New note
console.log(isDuplicate("Go to the gym"));
// Expected: false


/*
  6. addNote(text, category)

  Adds a note only when:
  - text is between 1 and 200 characters
  - note is not a duplicate
  - category is personal, work or study

  Returns true if successfully added.
  Returns false when rejected.
*/
function addNote(text, category) {
  const cleanedText = text.trim();

  const validCategories = ["personal", "work", "study"];

  if (cleanedText.length < 1 || cleanedText.length > 200) {
    console.log("Note must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(cleanedText)) {
    console.log("Note already exists.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category. Use personal, work or study.");
    return false;
  }

  const newNote = {
    id: notes.length > 0
      ? Math.max(...notes.map((note) => note.id)) + 1
      : 1,
    text: cleanedText,
    category: category,
  };

  notes.push(newNote);

  console.log("Note added successfully.");
  return true;
}

// Normal case
console.log(addNote("Practice JavaScript functions", "study"));
// Expected:
// "Note added successfully."
// true

// Confirm the new note exists
console.log(searchNotes("Practice JavaScript"));
// Expected:
// [
//   {
//     id: 6,
//     text: "Practice JavaScript functions",
//     category: "study"
//   }
// ]

// Edge case: duplicate note
console.log(addNote("  PRACTICE JAVASCRIPT FUNCTIONS  ", "study"));
// Expected:
// "Note already exists."
// false

// Edge case: empty text
console.log(addNote("", "personal"));
// Expected:
// "Note must be between 1 and 200 characters."
// false

// Edge case: invalid category
console.log(addNote("Prepare for tomorrow", "school"));
// Expected:
// "Invalid category. Use personal, work or study."
// false

// Final notes array
console.log(notes);
// Expected: original 5 notes plus the new study note
