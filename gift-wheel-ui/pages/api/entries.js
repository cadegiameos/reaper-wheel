// /gift-wheel-ui/pages/api/entries.js
import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("./data/entries.json");

export default function handler(req, res) {
  if (req.method === "GET") {
    try {
      if (!fs.existsSync(FILE_PATH)) {
        return res.status(200).json({ entries: [] });
      }
      const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
      return res.status(200).json(data);
    } catch (err) {
      console.error("Error reading entries:", err);
      return res.status(500).json({ message: "Error reading entries file" });
    }
  }

  if (req.method === "POST") {
    const { name, amount } = req.body;
    if (!name || !amount || amount < 1) {
      return res.status(400).json({ message: "Invalid entry data." });
    }

    try {
      const current = fs.existsSync(FILE_PATH)
        ? JSON.parse(fs.readFileSync(FILE_PATH, "utf8")).entries || []
        : [];
      for (let i = 0; i < amount; i++) current.push(name);
      fs.writeFileSync(FILE_PATH, JSON.stringify({ entries: current }, null, 2));
      return res.status(200).json({ entries: current });
    } catch (err) {
      console.error("Error saving entries:", err);
      return res.status(500).json({ message: "Error saving entries" });
    }
  }

  if (req.method === "DELETE") {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ entries: [] }, null, 2));
      return res.status(200).json({ entries: [] });
    } catch (err) {
      console.error("Error clearing entries:", err);
      return res.status(500).json({ message: "Error clearing entries" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
