// /pages/api/check-youtube.js
export default async function handler(req, res) {
  const CHANNEL_ID = process.env.CHANNEL_ID || "UCRh4qe6HGD10ZsyG56eUdHA";
  const url = `https://www.youtube.com/channel/${CHANNEL_ID}/live`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }, // Pretend to be a browser
    });
    const html = await response.text();

    // --- Detect active livestream ---
    if (html.includes('"isLive":true') || html.includes('"liveBroadcastContent":"live"')) {
      return res.status(200).json({ status: "live" }); // 🟢 Live
    }

    // --- Detect upcoming livestream ---
    if (html.includes('"upcomingEventData"')) {
      return res.status(200).json({ status: "upcoming" }); // 🟡 Upcoming
    }

    // --- Default to offline ---
    return res.status(200).json({ status: "offline" }); // 🔴 Offline
  } catch (err) {
    console.error("Error checking YouTube stream status:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
