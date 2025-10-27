// routes/tokens.js
import express from "express";
import { Redis } from "@upstash/redis";

const router = express.Router();
const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// ✅ Get current selected YouTube channel (for UI)
router.get("/channel", async (req, res) => {
  try {
    const title = await redis.get("yt_channel_title");
    const id = await redis.get("yt_channel_id");
    return res.json({ exists: !!id, channelTitle: title || null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch channel info" });
  }
});

// ✅ Set new channel details (owner only)
router.post("/channel", async (req, res) => {
  try {
    const { channelId, channelTitle } = req.body;
    if (!channelId) {
      return res.status(400).json({ error: "Missing channelId" });
    }

    await redis.set("yt_channel_id", channelId);
    await redis.set("yt_channel_title", channelTitle || "Unknown Channel");

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save channel data" });
  }
});

// ✅ Admin route to clear all tokens (for owner reset only)
router.post("/clear", async (req, res) => {
  try {
    await redis.del("yt_access_token");
    await redis.del("yt_refresh_token");
    await redis.del("yt_channel_id");
    await redis.del("yt_channel_title");
    await redis.del("processedGiftIds");
    return res.json({ ok: true, message: "All tokens cleared" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to clear tokens" });
  }
});

export default router;
