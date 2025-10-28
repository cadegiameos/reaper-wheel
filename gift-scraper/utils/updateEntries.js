// /gift-scraper/utils/updateEntries.js
import fs from "fs";
import path from "path";

const ENTRIES_FILE = path.resolve("/root/reaper-wheel/gift-wheel-ui/data/entries.json");
const PROCESSED_FILE = path.resolve("/root/reaper-wheel/gift-scraper/data/processed.json");

/**
 * Load JSON safely
 */
function loadJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
  }
  return fallback;
}

/**
 * Save JSON safely
 */
function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

/**
 * Update wheel entries — add each gifter’s name per amount,
 * but skip messages already processed by ID.
 */
export default function updateEntries(giftedMessages) {
  // Load current entries and processed message IDs
  const currentData = loadJSON(ENTRIES_FILE, { entries: [] });
  let entries = currentData.entries || [];
  let processedIds = loadJSON(PROCESSED_FILE, []);

  for (const { id, author, gifted } of giftedMessages) {
    // Skip if already processed
    if (processedIds.includes(id)) continue;

    // Add gifter once per gifted membership
    if (gifted > 0) {
      for (let i = 0; i < gifted; i++) {
        entries.push(author);
      }
      processedIds.push(id);
      console.log(`🎁 Added ${gifted} entries for ${author}`);
    }
  }

  // Limit processed IDs list to last 500 messages
  processedIds = [...new Set(processedIds)].slice(-500);

  // Save both files
  saveJSON(ENTRIES_FILE, { entries });
  saveJSON(PROCESSED_FILE, processedIds);

  console.log(`✅ Wheel updated — total entries: ${entries.length}`);
  return entries;
}
