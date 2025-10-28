// gift-scraper/server.js
import express from "express";
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.SCRAPER_PORT || 3001;
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

// === File storage ===
const STORAGE_DIR = path.join(__dirname, "storage");
const ENTRIES_FILE = path.join(STORAGE_DIR, "entries.json");
fs.ensureFileSync(ENTRIES_FILE);
if ((await fs.readJson(ENTRIES_FILE).catch(() => null)) === null)
  await fs.writeJson(ENTRIES_FILE, []);

// === Load/save entries ===
async function loadEntries() {
  try {
    return await fs.readJson(ENTRIES_FILE);
  } catch {
    return [];
  }
}
async function saveEntries(entries) {
  await fs.writeJson(ENTRIES_FILE, entries, { spaces: 2 });
}

// === Detect stream status (live/upcoming/offline) ===
async function getStreamStatus() {
  try {
    const live = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`
    );
    if (live.data.items.length > 0) return "live";

    const upcoming = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=upcoming&type=video&key=${API_KEY}`
    );
    if (upcoming.data.items.length > 0) return "upcoming";

    return "offline";
  } catch (err) {
    console.error("Error checking stream status:", err.message);
    return "offline";
  }
}

// === Fetch live chat messages (simplified gift detection) ===
async function fetchGiftedMessages(liveVideoId) {
  try {
    const res = await axios.get(
      `https://www.youtube.com/live_chat?v=${liveVideoId}`
    );
    const html = res.data;

    const giftPattern =
      /(?<author>[A-Za-z0-9_]+)\s+gifted\s+(?<count>\d+)\s+memberships?/gi;

    const matches = [];
    let match;
    while ((match = giftPattern.exec(html)) !== null) {
      matches.push({
        author: match.groups.author,
        gifted: parseInt(match.groups.count),
      });
    }
    return matches;
  } catch (err) {
    console.error("Error fetching chat:", err.message);
    return [];
  }
}

// === Find active video ID ===
async function getLiveVideoId() {
  try {
    const live = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`
    );
    if (live.data.items.length > 0)
      return live.data.items[0].id.videoId || null;

    const upcoming = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=upcoming&type=video&key=${API_KEY}`
    );
    if (upcoming.data.items.length > 0)
      return upcoming.data.items[0].id.videoId || null;

    return null;
  } catch (err) {
    console.error("Error fetching live video ID:", err.message);
    return null;
  }
}

// === Background scraper loop ===
async function pollChat() {
  const status = await getStreamStatus();
  if (status !== "live") return;

  const liveVideoId = await getLiveVideoId();
  if (!liveVideoId) return;

  console.log(`🎥 Polling chat for video ${liveVideoId}`);
  const gifts = await fetchGiftedMessages(liveVideoId);
  if (gifts.length > 0) {
    const entries = await loadEntries();
    for (const g of gifts) {
      for (let i = 0; i < g.gifted; i++) entries.push(g.author);
    }
    await saveEntries(entries);
    console.log(`🎁 Added ${gifts.length} new gift events`);
  }
}

// Poll every 10 s
setInterval(pollChat, 10000);

// === Routes ===

// Current wheel entries
app.get("/entries", async (_, res) => {
  res.json(await loadEntries());
});

// Clear entries (password protected)
app.post("/clear", async (req, res) => {
  const password = req.body.password;
  if (password !== "2FD1F4AC3897")
    return res.status(403).json({ error: "Invalid password" });
  await saveEntries([]);
  res.json({ success: true });
});

// Stream status
app.get("/status", async (_, res) => {
  const status = await getStreamStatus();
  res.json({ status });
});

// === Start server ===
app.listen(PORT, () =>
  console.log(`✅ Gift scraper running on port ${PORT}`)
);
