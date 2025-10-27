// gift-scraper/utils/fetchChat.js
import fetch from "node-fetch";
import { LIVE_CHAT_ID } from "../config.js";

/**
 * Simulates fetching chat messages.
 * In a real-world scenario, this would connect to an external service
 * or relay bot that forwards live chat messages.
 */
export default async function fetchChat(channelId) {
  console.log(`📡 Fetching chat for channel: ${channelId}`);

  // ✅ Placeholder for future scraping (relay bot, browser automation, etc.)
  // This demo returns mock data for now:
  return [
    { author: "UserA", message: "I gifted 5 memberships!", gifted: 5 },
    { author: "UserB", message: "I gifted 1 membership!", gifted: 1 },
  ];
}
