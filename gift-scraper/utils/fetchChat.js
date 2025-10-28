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
