// /gift-scraper/storage.js
import fs from "fs-extra";

const FILE_PATH = "./entries.json";

/**
 * Load entries from local JSON file, or return empty array if file doesn't exist.
 */
export async function loadEntries() {
  try {
    if (await fs.pathExists(FILE_PATH)) {
      return await fs.readJson(FILE_PATH);
    }
    return [];
  } catch (err) {
    console.error("Error loading entries:", err);
    return [];
  }
}

/**
 * Save entries back to local JSON file.
 */
export async function saveEntries(entries) {
  try {
    await fs.writeJson(FILE_PATH, entries, { spaces: 2 });
  } catch (err) {
    console.error("Error saving entries:", err);
  }
}
