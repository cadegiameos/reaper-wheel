// server.js
import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import tokenRoutes from "./routes/tokens.js";
app.use("/api/tokens", tokenRoutes);


// ✅ Utility for ES module pathing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Serve the built Next.js frontend (after `npm run build`)
app.use(express.static(path.join(__dirname, ".next", "static")));

// ✅ Fallback for frontend pages
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, ".next", "server", "pages", "index.html"));
});

// ✅ Start scraper process
console.log("🚀 Starting YouTube scraper...");
const scraperProcess = spawn("node", ["scraper.js"], {
  cwd: __dirname,
  stdio: "inherit",
});

scraperProcess.on("exit", (code) => {
  console.error(`❌ Scraper exited with code ${code}`);
});

// ✅ Start Express server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
