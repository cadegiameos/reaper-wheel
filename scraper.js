/**
 * scraper.js
 * -------------------------------------
 * Standalone YouTube live chat scraper for a fixed channel ID.
 * Uses puppeteer to launch a headless browser, load the livestream page,
 * and watch for gifted membership or superchat messages in real time.
 *
 * ✅ This file runs independently (e.g. on a VPS)
 * ✅ Feeds new gift entries to Redis for the wheel frontend
 * ✅ Works without user logging into YouTube via OAuth
 */

import puppeteer from "puppeteer";
import { Redis } from "@upstash/redis";

// ✅ Configure this to your target channel
const CHANNEL_ID = process.env.TARGET_CHANNEL_ID; // e.g. "UCRh4qe6HGD10ZsyG56eUdHA"
if (!CHANNEL_ID) {
  console.error("❌ Missing TARGET_CHANNEL_ID in env!");
  process.exit(1);
}

// ✅ Redis setup
const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// ✅ Utility: Append entries to wheel
async function addGiftEntry(author, amount) {
  const entries = (await redis.get("wheelEntries")) || [];
  const updated = [...entries, ...Array(amount).fill(author)];
  await redis.set("wheelEntries", updated);
  console.log(`✅ Added ${amount} entries for: ${author}`);
}

// ✅ Start scraper
(async () => {
  console.log(`🚀 Launching scraper for channel: ${CHANNEL_ID}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/channel/${CHANNEL_ID}/live`, {
    waitUntil: "networkidle2",
  });

  console.log(`📡 Live page loaded. Waiting for chat...`);

  // ✅ Wait for chat frame to load
  try {
    await page.waitForSelector("iframe#chatframe", { timeout: 20000 });
  } catch (e) {
    console.error("❌ No active livestream found yet. Retrying in 60 seconds...");
    await browser.close();
    setTimeout(() => process.exit(1), 1000);
    return;
  }

  const frameHandle = await page.$("iframe#chatframe");
  const chatFrame = await frameHandle.contentFrame();

  console.log(`✅ Chat detected. Watching for messages...`);

  const processed = new Set();

  await chatFrame.exposeFunction("handleGiftMessage", async (msg, author) => {
    // Dedupe
    if (processed.has(msg)) return;
    processed.add(msg);

    const match = msg.match(/gifted\s+(\d+)\s+membership/i);
    if (match) {
      const amount = parseInt(match[1], 10);
      if (amount > 0) {
        await addGiftEntry(author, amount);
      }
    }

    // Keep processed set to manageable size
    if (processed.size > 500) {
      const arr = Array.from(processed).slice(-300);
      processed.clear();
      arr.forEach((m) => processed.add(m));
    }
  });

  await chatFrame.evaluate(() => {
    const observer = new MutationObserver(() => {
      document.querySelectorAll("yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer")
        .forEach((msgEl) => {
          const msgId = msgEl.getAttribute("id");
          const text = msgEl.querySelector("#message")?.innerText || "";
          const author = msgEl.querySelector("#author-name")?.innerText || "Unknown";
          if (text.toLowerCase().includes("gifted")) {
            window.handleGiftMessage(text, author);
          }
        });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });

  console.log("✅ Scraper is running in real-time.");
})();
