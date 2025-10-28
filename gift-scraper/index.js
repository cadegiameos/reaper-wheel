// /gift-scraper/index.js
import { liveChatProcessor } from "./src/livechat.js";
import dotenv from "dotenv";

dotenv.config();

const CREATOR_CHANNEL_ID = process.env.CHANNEL_ID;

if (!CREATOR_CHANNEL_ID) {
  console.error("❌ Missing CHANNEL_ID in environment variables.");
  process.exit(1);
}

async function startScraping() {
  console.log("🚀 Starting scraper for channel:", CREATOR_CHANNEL_ID);
  await liveChatProcessor(CREATOR_CHANNEL_ID);
}

startScraping();
