// /gift-wheel-ui/pages/api/set-token.js
import fs from "fs";
import path from "path";

const tokenPath = path.join(process.cwd(), "data", "deleteToken.txt");

// Ensure data folder exists
if (!fs.existsSync(path.dirname(tokenPath))) {
  fs.mkdirSync(path.dirname(tokenPath));
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token } = req.body;

  if (!token || token.length < 4) {
    return res.status(400).json({ message: "Token must be at least 4 characters" });
  }

  fs.writeFileSync(tokenPath, token, "utf8");
  return res.status(200).json({ message: "Token saved successfully" });
}
