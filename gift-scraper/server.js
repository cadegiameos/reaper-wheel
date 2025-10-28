// /gift-scraper/server.js
import express from "express";
import fs from "fs-extra";
import { loadEntries } from "./storage.js";

const app = express();
const PORT = process.env.SCRAPER_PORT || 3001;

// ✅ Endpoint to get entries
app.get("/entries", async (req, res) => {
  const entries = await loadEntries();
  res.json({ entries });
});

// ✅ Endpoint to clear entries (simple password)
app.delete("/entries", async (req, res) => {
  const password = req.query.password;
  if (password !== "2FD1F4AC3897") {
    return res.status(403).json({ error: "Invalid password" });
  }
  await fs.writeJson("./entries.json", []);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Gift scraper API running on port ${PORT}`);
});
