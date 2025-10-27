// gift-scraper/scraper.js
import fetchChat from "./utils/fetchChat.js";
import updateEntries from "./utils/updateEntries.js";
import fs from "fs";
import path from "path";

const CHANNEL_ID = process.env.CHANNEL_ID; // e.g. UCRh4qe6HGD10ZsyG56eUdHA
const POLL_INTERVAL = 10000; // 10 seconds

// Storage for processed message IDs to avoid duplicates
const PROCESSED_FILE = path.resolve("storage/processed.json");

function loadProcessed() {
  try {
    return JSON.parse(fs.readFileSync(PROCESSED_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveProcessed(ids) {
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(ids, null, 2));
}

async function getLiveChatId(channelId) {
  // Fetch page HTML for channel livestream or upcoming streams
  const response = await fetch(`https://www.youtube.com/channel/${channelId}/live`);
  const html = await response.text();

  const liveChatIdMatch = html.match(/"liveChatId":"(.*?)"/);
  if (liveChatIdMatch) {
    return liveChatIdMatch[1];
  }

  console.log("⚠ No active or upcoming livestream found.");
  return null;
}

async function startScraping() {
  console.log("🔍 Searching for live chat...");
  const liveChatId = await getLiveChatId(CHANNEL_ID);

  if (!liveChatId) {
    setTimeout(startScraping, POLL_INTERVAL);
    return;
  }

  console.log(`✅ Live chat found: ${liveChatId}`);
  let processedIds = loadProcessed();

  async function poll() {
    try {
      const messages = await fetchChat(liveChatId);

      const newGifts = messages.filter(
        (msg) =>
          !processedIds.includes(msg.id) &&
          msg.gifted > 0
      );

      if (newGifts.length > 0) {
        console.log("🎁 New gifted memberships detected:", newGifts);
        updateEntries(newGifts);
      }

      // Update processed IDs
      processedIds.push(...newGifts.map((g) => g.id));
      processedIds = [...new Set(processedIds)].slice(-500);
      saveProcessed(processedIds);
    } catch (err) {
      console.error("❌ Error while polling:", err.message);
    }

    setTimeout(poll, POLL_INTERVAL);
  }

  poll();
}

startScraping();
