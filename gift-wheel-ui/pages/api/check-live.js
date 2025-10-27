// /gift-wheel-ui/pages/api/check-live.js

export default async function handler(req, res) {
  const channelId = process.env.CHANNEL_ID;
  if (!channelId) {
    return res.status(500).json({ live: false, message: "CHANNEL_ID missing" });
  }

  try {
    // YouTube live URL format for a channel
    const liveURL = `https://www.youtube.com/channel/${channelId}/live`;

    // Use fetch HEAD request to detect if it redirects to an active or upcoming stream
    const response = await fetch(liveURL, { method: "GET", redirect: "follow" });

    if (response.url.includes("watch")) {
      // Stream detected (live or upcoming)
      return res.status(200).json({ live: true, streamUrl: response.url });
    } else {
      return res.status(200).json({ live: false });
    }
  } catch (err) {
    return res.status(500).json({ live: false, error: err.message });
  }
}
