import React, { useState, useEffect, useRef } from "react";
import "./../styles/globals.css";

// 🎨 Constants
const PASTEL_COLORS = [
  "#FFB3BA",
  "#FFDFBA",
  "#FFFFBA",
  "#BAFFC9",
  "#BAE1FF",
  "#D7BAFF",
  "#FFCBAE",
  "#AFF8DB",
];

const WHEEL_RADIUS = 230;
const TEXT_RADIUS = 180;
const ROTATION_SPEED = 10;
const CLEAR_PASSWORD = "2FD1F4AC3897";

// 🎯 Main Component
export default function WheelOfReapers() {
  const canvasRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [spinVelocity, setSpinVelocity] = useState(0);
  const [status, setStatus] = useState("Checking live stream...");
  const [connected, setConnected] = useState(false);
  const [manualName, setManualName] = useState("");
  const [scraperActive, setScraperActive] = useState(false);
  const [channelStatus, setChannelStatus] = useState("offline");
  const animationRef = useRef(null);
  const wheelRef = useRef(null);
  const spinSound = useRef(null);

  // 🕹️ Load persisted entries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("wheelEntries");
    if (stored) setEntries(JSON.parse(stored));
  }, []);

  // 💾 Persist entries to localStorage
  useEffect(() => {
    localStorage.setItem("wheelEntries", JSON.stringify(entries));
  }, [entries]);

  // 🔄 Check live stream status
  useEffect(() => {
    async function checkStream() {
      try {
        const response = await fetch("/api/check-youtube");
        const data = await response.json();
        if (data.isLive) {
          setChannelStatus("live");
          setStatus("Live stream detected!");
        } else if (data.upcoming) {
          setChannelStatus("upcoming");
          setStatus("Upcoming live stream detected.");
        } else {
          setChannelStatus("offline");
          setStatus("Channel is offline.");
        }
      } catch (e) {
        setStatus("Unable to reach scraper backend.");
      }
    }
    checkStream();
    const interval = setInterval(checkStream, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🔊 Load spin sound
  useEffect(() => {
    spinSound.current = new Audio("/spin-sound.mp3");
  }, []);

  // 🌀 Draw Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = WHEEL_RADIUS * 2;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    const sliceAngle = (2 * Math.PI) / Math.max(entries.length, 1);
    entries.forEach((entry, i) => {
      const startAngle = i * sliceAngle + rotation;
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(WHEEL_RADIUS, WHEEL_RADIUS);
      ctx.arc(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS, startAngle, endAngle);
      ctx.fillStyle = PASTEL_COLORS[i % PASTEL_COLORS.length];
      ctx.fill();
      ctx.save();
      ctx.translate(WHEEL_RADIUS, WHEEL_RADIUS);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#222";
      ctx.font = "bold 18px Arial";
      ctx.fillText(entry.name, TEXT_RADIUS, 8);
      ctx.restore();
    });
  }, [entries, rotation]);

  // ⚙️ Spin animation
  const spinWheel = () => {
    if (spinning || entries.length === 0) return;
    setSpinning(true);
    setWinner(null);
    setSpinVelocity(Math.random() * 30 + 40);
  };

  useEffect(() => {
    if (!spinning) return;
    let velocity = spinVelocity;
    const animate = () => {
      setRotation((r) => r + velocity * 0.01);
      velocity *= 0.985;
      if (velocity < 0.3) {
        setSpinning(false);
        const sliceAngle = (2 * Math.PI) / entries.length;
        const index =
          Math.floor(
            ((2 * Math.PI - (rotation % (2 * Math.PI))) / sliceAngle) %
              entries.length
          ) % entries.length;
        const chosen = entries[index];
        setWinner(chosen);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [spinning]);

  // 🧹 Clear Wheel (password protected)
  const clearWheel = () => {
    const input = prompt("Enter the deletion key to clear the wheel:");
    if (input !== CLEAR_PASSWORD) {
      alert("Incorrect key. Wheel not cleared.");
      return;
    }
    setEntries([]);
    localStorage.removeItem("wheelEntries");
  };

  // ✏️ Manual Entry Add
  const addManualEntry = () => {
    if (!manualName.trim()) return;
    const newEntry = { name: manualName.trim() };
    setEntries((prev) => [...prev, newEntry]);
    setManualName("");
  };

  // 💬 Poll Scraper
  useEffect(() => {
    if (channelStatus === "live" || channelStatus === "upcoming") {
      setScraperActive(true);
    } else {
      setScraperActive(false);
    }
  }, [channelStatus]);

  // 📡 UI Render
  return (
    <div className="app-container">
      <div className="wheel-section">
        <canvas ref={canvasRef} className="wheel-canvas" />
        <div className="center-button" onClick={spinWheel}>
          🎯
        </div>
      </div>

      {/* Control Panel */}
      <div className="controls">
        <div className="manual-entry">
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Manual entry (disabled)"
            disabled
          />
          <button onClick={addManualEntry} disabled>
            Add
          </button>
        </div>

        <button className="spin-btn" onClick={spinWheel} disabled={spinning}>
          Spin the Wheel
        </button>

        <button
          className="clear-btn"
          onClick={clearWheel}
          disabled={entries.length === 0}
        >
          Clear Wheel
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <p>
          Scraper Status:{" "}
          <strong
            style={{
              color:
                channelStatus === "live"
                  ? "lime"
                  : channelStatus === "upcoming"
                  ? "gold"
                  : "red",
            }}
          >
            {status}
          </strong>
        </p>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="winner-modal">
          <div className="winner-content">
            <img
              src="/grimreaper.png"
              alt="Grim Reaper"
              className="winner-img"
            />
            <h2 className="winner-title">💀 WINNER 💀</h2>
            <p className="winner-name">{winner.name}</p>
            <button onClick={() => setWinner(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
/* ======= PART B (CONTINUATION OF INDEX.JSX) ======= */

/* 🧭 Responsive + Background Styling Inline Helpers */
const BackgroundLayer = () => (
  <div
    className="background"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundImage: "url('/background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      zIndex: -1,
    }}
  />
);

/* ⚙️ Global Styles (CSS-in-JS fallback for VPS rendering) */
const GlobalStyles = () => (
  <style jsx global>{`
    @font-face {
      font-family: "ToothAndNail";
      src: url("/fonts/ToothAndNail-Regular.otf") format("opentype");
    }

    html,
    body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: #000;
      font-family: "ToothAndNail", Arial, sans-serif;
      color: white;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      height: 100vh;
      position: relative;
    }

    .wheel-section {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .wheel-canvas {
      border-radius: 50%;
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
      background-color: rgba(255, 255, 255, 0.05);
    }

    .center-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      cursor: pointer;
      user-select: none;
    }

    .controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 60px;
    }

    .manual-entry {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .manual-entry input {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      font-size: 14px;
      width: 200px;
      background: rgba(255, 255, 255, 0.1);
      color: #ccc;
    }

    .manual-entry button {
      background: #333;
      border: 1px solid #666;
      color: #aaa;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: not-allowed;
    }

    .spin-btn,
    .clear-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.1s;
    }

    .spin-btn {
      background: linear-gradient(45deg, #00ff99, #00ccff);
      color: #000;
      font-weight: bold;
    }

    .spin-btn:hover {
      transform: scale(1.05);
    }

    .clear-btn {
      background: #aa0000;
      color: white;
      font-weight: bold;
    }

    .clear-btn:hover {
      transform: scale(1.05);
      background: #cc0000;
    }

    .status-bar {
      position: fixed;
      bottom: 10px;
      right: 20px;
      font-size: 14px;
      opacity: 0.8;
      text-align: right;
    }

    .winner-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.85);
      z-index: 100;
      animation: fadeIn 0.6s ease forwards;
    }

    .winner-content {
      background: rgba(30, 30, 30, 0.9);
      border: 2px solid #fff;
      border-radius: 12px;
      padding: 30px 40px;
      text-align: center;
      box-shadow: 0 0 50px rgba(255, 255, 255, 0.4);
      animation: pop 0.6s ease forwards;
    }

    .winner-img {
      width: 120px;
      height: auto;
      margin-bottom: 20px;
      animation: swing 2s ease-in-out infinite;
    }

    .winner-title {
      font-size: 36px;
      color: #ff4d4d;
      margin: 0 0 10px 0;
    }

    .winner-name {
      font-size: 28px;
      color: #fff;
      font-weight: bold;
      text-shadow: 2px 2px 5px #000;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes pop {
      0% {
        transform: scale(0.7);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes swing {
      0% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(3deg);
      }
      50% {
        transform: rotate(-3deg);
      }
      75% {
        transform: rotate(3deg);
      }
      100% {
        transform: rotate(0deg);
      }
    }

    /* 📱 Responsiveness */
    @media (max-width: 768px) {
      .wheel-canvas {
        width: 280px !important;
        height: 280px !important;
      }
      .winner-title {
        font-size: 26px;
      }
      .winner-name {
        font-size: 20px;
      }
    }
  `}</style>
);

/* 🧩 Export Wrapper */
export default function PageWrapper() {
  return (
    <>
      <BackgroundLayer />
      <GlobalStyles />
      <WheelOfReapers />
    </>
  );
}
