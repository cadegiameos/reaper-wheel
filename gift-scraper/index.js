import { liveChatProcessor } from "./src/livechat.js";

// ✅ Replace with YOUR creator’s actual YouTube channel ID:
const CREATOR_CHANNEL_ID = process.env.CREATOR_CHANNEL_ID;

if (!CREATOR_CHANNEL_ID) {
  console.error("❌ Missing CREATOR_CHANNEL_ID in environment variables.");
  process.exit(1);
}

async function startScraping() {
  try {
    console.log("🚀 Starting scraper for channel:", CREATOR_CHANNEL_ID);
    // Begin monitoring for an *active or upcoming* livestream.
    await liveChatProcessor(CREATOR_CHANNEL_ID);
  } catch (err) {
    console.error("❌ Fatal error in scraper:", err);
    // Optional retry logic:
    setTimeout(startScraping, 10_000); // Retry after 10s
  }
}

startScraping();
