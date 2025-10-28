// /gift-scraper/utils/fetchChat.js
import { LiveChat } from "youtube-chat";
import { CHANNEL_ID } from "../config.js";

let chat = null;

export default async function fetchChat() {
  if (!chat) {
    chat = new LiveChat({ channelId: CHANNEL_ID });
    await chat.start();
  }

  const messages = [];
  chat.on("message", (msg) => {
    const text = msg.message[0]?.text || "";
    const author = msg.author.name;
    const id = msg.id;

    // Detect gifted membership messages
    const giftMatch = text.match(/gift(ed)? (\d+) memberships?/i);
    if (giftMatch) {
      const gifted = parseInt(giftMatch[2], 10);
      messages.push({ id, author, gifted });
    }
  });

  return messages;
}
// /gift-scraper/utils/fetchChat.js
import { LiveChat } from "youtube-chat";
import { CHANNEL_ID } from "../config.js";

let chat = null;

/**
 * Connects to the YouTube Live Chat and extracts gifted membership messages.
 * Auto-reconnects if chat disconnects or the stream restarts.
 */
export default async function fetchChat() {
  if (!CHANNEL_ID) {
    console.error("❌ Missing CHANNEL_ID in environment variables.");
    return [];
  }

  // Initialize chat connection once
  if (!chat) {
    chat = new LiveChat({ channelId: CHANNEL_ID });
    await chat.start();
    console.log(`✅ Connected to live chat for channel: ${CHANNEL_ID}`);

    chat.on("error", (err) => {
      console.error("⚠️ LiveChat error:", err);
      chat = null;
    });
  }

  const giftedMessages = [];

  // Listen for chat messages and extract gifting info
  chat.on("message", (msg) => {
    try {
      const text = msg.message?.map((m) => m.text).join(" ") || "";
      const author = msg.author.name;
      const id = msg.id;

      // Match text like "gifted 5 memberships" or "gifted 1 membership"
      const giftMatch = text.match(/gift(ed)? (\d+) membership/i);

      if (giftMatch) {
        const gifted = parseInt(giftMatch[2], 10);
        giftedMessages.push({ id, author, gifted });
        console.log(`🎁 ${author} gifted ${gifted} memberships!`);
      }
    } catch (err) {
      console.error("❌ Error parsing chat message:", err);
    }
  });

  return giftedMessages;
}
