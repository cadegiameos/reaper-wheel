// pages/api/status.js
import fetch from "node-fetch";

const CHANNEL_ID = "UCRh4qe6HGD10ZsyG56eUdHA"; // Replace with your channel ID

export default async function handler(req, res) {
  try {
    // Fetch channel info (used to get channel name for display)
    const channelRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
    );

    if (!channelRes.ok) {
      return res.status(500).json({ status: "error", channel: null });
    }

    const text = await channelRes.text();

    // Check for LIVE marker
    const isLive = text.includes('yt:liveBroadcast="live"');
    const isUpcoming = text.includes('yt:liveBroadcast="upcoming"');

    let status = "none";
    if (isLive) status = "live";
    else if (isUpcoming) status = "upcoming";

    // Extract channel title (optional, improves UI)
    let channelTitle = "";
    const titleMatch = text.match(/<title>(.*?)<\/title>/);
    if (titleMatch && titleMatch[1]) channelTitle = titleMatch[1];

    return res.status(200).json({
      status,
      channel: channelTitle || "Channel",
    });
  } catch (err) {
    console.error("Error detecting stream:", err);
    return res.status(500).json({ status: "error", channel: null });
  }
}
