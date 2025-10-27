// gift-scraper/server.js
import express from "express";
import fs from "fs";
import path from "path";
import fetchChat from "./utils/fetchChat.js";
import updateEntries from "./utils/updateEntries.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SCRAPER_PORT || 3001;

// Path to store scraped data
const DATA_FILE = path.join(__dirname, "data", "latest.json");

// Load channel ID from config
import { CHANNEL_ID } from "./config.js";

// Helper to safely read JSON file
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return { entries: [] };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { entries: [] };
  }
};

// Endpoint to get current entries
app.get("/entries", (req, res) => {
  const data = readData();
  res.json(data);
});

// Endpoint to clear entries (requires deletion token)
app.post("/clear", express.json(), (req, res) => {
  const { token, expectedToken } = req.body;
  if (!token || token !== expectedToken) {
    return res.status(403).json({ error: "Invalid token" });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: [] }, null, 2));
  res.json({ success: true });
});

// Poll YouTube chat every 10 seconds
setInterval(async () => {
  console.log("Fetching chat...");
  const messages = await fetchChat(CHANNEL_ID);
  await updateEntries(messages, DATA_FILE);
}, 10000);

app.listen(PORT, () => {
  console.log(`✅ Gift scraper running on port ${PORT}`);
});
