import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [scraperStatus, setScraperStatus] = useState("Checking...");
  const [scale, setScale] = useState(1);

  const canvasRef = useRef(null);
  const CLEAR_PASSWORD = "2FD1F4AC3897";

  // ⛓ scale to window
  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🧠 load entries
  useEffect(() => {
    const stored = localStorage.getItem("entries");
    if (stored) setEntries(JSON.parse(stored));
  }, []);

  // 💾 persist entries
  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  // ♻️ poll scraper status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/scraper-status");
        const data = await res.json();
        setScraperStatus(data.status || "Unknown");
      } catch {
        setScraperStatus("Offline");
      }
    };
    fetchStatus();
    const i = setInterval(fetchStatus, 15000);
    return () => clearInterval(i);
  }, []);

  // 🌀 idle rotation
  useEffect(() => {
    const t = setInterval(() => {
      if (!isSpinning) setRotation((r) => (r + 0.15) % 360);
    }, 20);
    return () => clearInterval(t);
  }, [isSpinning]);

  // ✨ flash animation
  useEffect(() => {
    if (winnerIndex !== null) {
      const t = setInterval(() => setFlash((f) => !f), 500);
      return () => clearInterval(t);
    }
  }, [winnerIndex]);

  // 🎨 draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (entries.length === 0) {
      ctx.fillStyle = "white";
      ctx.font = "28px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No entries yet", radius, radius);
      return;
    }

    const sliceAngle = (2 * Math.PI) / entries.length;

    entries.forEach((entry, i) => {
      const start = i * sliceAngle;
      const end = start + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, start, end);
      ctx.fillStyle = `hsl(${(i * 360) / entries.length},70%,85%)`;
      ctx.fill();
      ctx.closePath();

      if (winnerIndex === i && flash) {
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, start, end);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.closePath();
      }

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(start + sliceAngle / 2);
      const sliceWidth = radius * sliceAngle;
      let fontSize = Math.min(40, sliceWidth / entry.length);
      fontSize = Math.max(fontSize, 10);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(entry, radius * 0.6, 0);
      ctx.restore();
    });
  }, [entries, rotation, winnerIndex, flash]);

  // 🧍‍♂️ add entry
  const addEntry = () => {
    const trimmed = name.trim();
    if (!trimmed || amount < 1) return;
    const newEntries = [...entries, ...Array(Number(amount)).fill(trimmed)];
    setEntries(newEntries);
    setName("");
    setAmount(1);
  };

  // 🧹 clear entries (password protected)
  const clearEntries = async () => {
    const password = prompt("Enter deletion password:");
    if (password !== CLEAR_PASSWORD) {
      alert("Incorrect password. Wheel not cleared.");
      return;
    }
    setEntries([]);
    setWinnerIndex(null);
    setFlash(false);
    setShowWinnerModal(false);
  };

  // 🎯 spin
  const spinWheel = () => {
    if (entries.length === 0) return alert("No entries to spin!");
    setIsSpinning(true);
    const winner = Math.floor(Math.random() * entries.length);
    setWinnerIndex(null);
    setShowWinnerModal(false);
    const spinDeg = 3600 + winner * (360 / entries.length);
    setRotation(spinDeg);
    setTimeout(() => {
      setIsSpinning(false);
      setWinnerIndex(winner);
      setFlash(true);
      setShowWinnerModal(true);
    }, 5000);
  };

  return (
    <div
      className="scale-wrapper"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: "1920px",
        height: "1080px",
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container">
        <h1 className="title">Lolcow Reapers Gifted Member Wheel.</h1>

        {/* Left label */}
        <div className="subtitle-left">1 GIFTED{"\n"}={"\n"}1 Entry</div>

        {/* Right label */}
        <div className="subtitle-right">
          GIFTED ENTRIES:{"\n"}
          {entries.length}
        </div>

        {/* Wheel */}
        <div className="wheel-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s ease-out" : "none",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Buttons */}
        <div className="controls">
          <button className="spin-btn" onClick={spinWheel}>
            Spin
          </button>
          <button className="clear-btn" onClick={clearEntries}>
            Clear Wheel
          </button>
        </div>

        {/* Manual entry */}
        <div className="manual-entry">
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled
          />
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            disabled
          />
          <button onClick={addEntry} disabled>
            Add Entry
          </button>
        </div>

        {/* Scraper status */}
        <div className="scraper-status">
          <div
            style={{
              background:
                scraperStatus === "Online"
                  ? "rgba(0,255,0,0.8)"
                  : "rgba(255,0,0,0.8)",
              width: 20,
              height: 20,
              borderRadius: "50%",
            }}
          />
          {scraperStatus === "Online"
            ? "Connected to Live Chat"
            : "Offline / No Live Stream"}
        </div>

        {/* Winner Modal */}
        {showWinnerModal && winnerIndex !== null && (
          <div className="winner-modal">
            <div className="winner-content">
              <img
                src="/grimreaper.png"
                alt="Grim Reaper"
                className="grim-swing"
              />
              <h2>💀 Winner! 💀</h2>
              <p>{entries[winnerIndex]}</p>
              <button onClick={() => setShowWinnerModal(false)}>Close</button>
            </div>
          </div>
        )}

        <footer>Developed By Shkrimpi - v1.1.3</footer>
      </div>
    </div>
  );
}
