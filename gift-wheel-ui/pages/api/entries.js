// /gift-wheel-ui/pages/api/entries.js
import { wheelEntries } from "./clear"; // Import shared array

export default function handler(req, res) {
  if (req.method === "GET") {
    // Return current entries
    return res.status(200).json({ entries: wheelEntries });
  }

  if (req.method === "POST") {
    // Add multiple entries (e.g., 5 gifted = 5 entries)
    const { name, amount } = req.body;
    if (!name || !amount || amount < 1) {
      return res.status(400).json({ message: "Invalid entry data." });
    }

    for (let i = 0; i < amount; i++) {
      wheelEntries.push(name);
    }

    return res.status(200).json({ entries: wheelEntries });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
