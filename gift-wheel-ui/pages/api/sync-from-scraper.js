import fs from "fs";
import path from "path";

const entriesFilePath = path.join(process.cwd(), "data", "entries.json");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1️⃣ Fetch scraped entries from scraper service
    const scraperUrl = process.env.SCRAPER_URL; // e.g., http://localhost:4000/latest
    const response = await fetch(scraperUrl);
    const scrapedData = await response.json();

    if (!Array.isArray(scrapedData)) {
      return res.status(200).json({ message: "No valid data from scraper", added: 0 });
    }

    // 2️⃣ Load current entries
    let currentEntries = [];
    if (fs.existsSync(entriesFilePath)) {
      currentEntries = JSON.parse(fs.readFileSync(entriesFilePath, "utf8"));
    }

    // 3️⃣ Filter new donations not yet recorded
    const newEntries = scrapedData.filter((item) => {
      return !currentEntries.includes(item);
    });

    // 4️⃣ Append them
    const updatedEntries = [...currentEntries, ...newEntries];

    // 5️⃣ Save to file
    fs.writeFileSync(entriesFilePath, JSON.stringify(updatedEntries, null, 2));

    return res.status(200).json({
      message: "Sync complete",
      added: newEntries.length,
      total: updatedEntries.length,
    });
  } catch (err) {
    console.error("Error syncing from scraper:", err);
    return res.status(500).json({ message: "Failed to sync from scraper" });
  }
}
