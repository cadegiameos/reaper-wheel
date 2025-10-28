// /gift-wheel-ui/pages/api/clear.js
import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("./data/entries.json");

export default function handler(req, res) {
  if (req.method === "DELETE") {
    const password = req.headers["x-clear-password"];

    // 🔐 Same password protection as before
    if (password !== "2FD1F4AC3897") {
      return res.status(403).json({ message: "Incorrect password." });
    }

    try {
      // Wipe file contents clean
      fs.writeFileSync(FILE_PATH, JSON.stringify({ entries: [] }, null, 2));
      console.log("🧹 Wheel cleared successfully.");
      return res.status(200).json({ entries: [] });
    } catch (err) {
      console.error("Error clearing wheel:", err);
      return res.status(500).json({ message: "Error clearing entries file" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
