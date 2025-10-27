// /gift-wheel-ui/pages/api/clear.js
let wheelEntries = []; // Local in-memory entries
let storedToken = process.env.DELETION_TOKEN; // Loaded from .env.local or VPS env

export default function handler(req, res) {
  if (req.method === "POST") {
    const { token } = req.body;

    if (!token || token !== storedToken) {
      return res.status(403).json({ message: "Invalid deletion token." });
    }

    wheelEntries.length = 0; // Clear array
    return res.status(200).json({ message: "Wheel cleared successfully." });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

// Export the entries array so index.jsx can import it
export { wheelEntries };
