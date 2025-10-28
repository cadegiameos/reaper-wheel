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

  useEffect(() => {
    let isMounted = true;
    const loadEntries = async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (isMounted && Array.isArray(data.entries)) setEntries(data.entries);
      } catch (err) {
        console.error("Error refreshing entries:", err);
      }
    };
    loadEntries();
    const interval = setInterval(loadEntries, 3000 + Math.random() * 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch("/api/check-youtube");
        const data = await res.json();
        setScraperStatus(
          data.status === "live"
            ? "🟢 Live"
            : data.status === "upcoming"
            ? "🟡 Upcoming"
            : "🔴 Offline"
        );
      } catch {
        setScraperStatus("🔴 Offline");
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const addEntry = async () => {
    const trimmed = name.trim();
    if (!trimmed || amount < 1) return;
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, amount: Number(amount) }),
      });
      const data = await res.json();
      if (Array.isArray(data.entries)) {
        setEntries(data.entries);
        setName("");
        setAmount(1);
      }
    } catch {}
  };

  const clearEntries = async () => {
    const password = prompt("Enter password to clear wheel:");
    if (password !== "2FD1F4AC3897") {
      alert("Incorrect password. Wheel not cleared.");
      return;
    }
    try {
      const res = await fetch("/api/entries", { method: "DELETE" });
      if (res.ok) {
        setEntries([]);
        setWinnerIndex(null);
        setFlash(false);
        setShowWinnerModal(false);
      }
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) setRotation((prev) => (prev + 0.1) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isSpinning]);

  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(flashInterval);
    }
  }, [winnerIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (entries.length === 0) {
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No entries yet", radius, radius);
      return;
    }

    const anglePerSlice = (2 * Math.PI) / entries.length;

    entries.forEach((entry, i) => {
      const startAngle = i * anglePerSlice;
      const endAngle = startAngle + anglePerSlice;

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, startAngle, endAngle);
      ctx.fillStyle = `hsl(${(i * 360) / entries.length}, 70%, 85%)`;
      ctx.fill();
      ctx.closePath();

      if (winnerIndex === i && flash) {
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.closePath();
      }

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + anglePerSlice / 2);
      const sliceWidth = radius * anglePerSlice;
      let fontSize = Math.min(40, sliceWidth / entry.length);
      fontSize = Math.max(fontSize, 10);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      const textRadius = radius * 0.6;
      ctx.fillText(entry, textRadius, 0);
      ctx.restore();
    });
  }, [entries, rotation, winnerIndex, flash]);

  const spinWheel = () => {
    if (entries.length === 0) return alert("No entries to spin!");
    setIsSpinning(true);
    const winner = Math.floor(Math.random() * entries.length);
    setWinnerIndex(null);
    setShowWinnerModal(false);

    const spinDegrees = 3600 + winner * (360 / entries.length);
    setRotation(spinDegrees);

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
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        transform: `scale(${scale})`,
        transformOrigin: "center",
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container">
        <h1 className="title">Lolcow Reapers Gifted Member Wheel.</h1>

        <div className="subtitle left-sub">
          1 GIFTED{"\n"}={"\n"}1 Entry
        </div>

        <div className="subtitle right-sub">
          GIFTED ENTRIES:{"\n"}
          {entries.length}
        </div>

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

        <div className="controls">
          <button className="spin-btn" onClick={spinWheel}>Spin</button>
        </div>

        <div className="manual-entry">
          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
            <input type="text" placeholder="Enter name" disabled />
            <input type="number" min="1" max="20" value={amount} disabled />
            <button disabled>Add Entry</button>
          </div>
          <button className="clear-btn" onClick={clearEntries}>
            Clear Wheel
          </button>
        </div>

        <div className="scraper-status">{scraperStatus}</div>

        {showWinnerModal && winnerIndex !== null && (
          <div className="winner-overlay">
            <div className="winner-box">
              <img src="/grimreaper.png" alt="Grim Reaper" className="grim-swing" />
              <h2>💀 Winner! 💀</h2>
              <p className="winner-name">{entries[winnerIndex]}</p>
              <button onClick={() => setShowWinnerModal(false)}>Close</button>
            </div>
          </div>
        )}

        <footer>Developed By Shkrimpi - v1.1.2</footer>

        <style jsx>{`
          @keyframes swing {
            0% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
            100% { transform: rotate(-10deg); }
          }
          .grim-swing {
            animation: swing 1.2s ease-in-out infinite;
            transform-origin: top center;
          }
        `}</style>
      </div>
    </div>
  );
}
