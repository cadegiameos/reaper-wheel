// gift-scraper/utils/updateEntries.js
import fs from "fs";
import path from "path";

const ENTRIES_FILE = path.resolve("storage/entries.json");

/**
 * Loads current entries from local JSON storage.
 */
function loadEntries() {
  try {
    const data = fs.readFileSync(ENTRIES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Saves updated entries to local JSON storage.
 */
function saveEntries(entries) {
  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));
}

/**
 * Updates entries based on gifted chat data.
 */
export default function updateEntries(giftedMessages) {
  let entries = loadEntries();

  for (const { author, gifted } of giftedMessages) {
    if (gifted > 0) {
      for (let i = 0; i < gifted; i++) {
        entries.push(author);
      }
    }
  }

  saveEntries(entries);
  return entries;
}
