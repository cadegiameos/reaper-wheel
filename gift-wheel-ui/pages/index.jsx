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
  const [scrapeStatus, setScrapeStatus] = useState("Offline");

  const canvasRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      document.documentElement.style.setProperty(
        "--scale",
        Math.min(scaleX, scaleY)
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    };
    loadEntries();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        setScrapeStatus(data.status || "Offline");
      } catch {
        setScrapeStatus("Offline");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const clearEntries = async () => {
    const password = prompt("Enter wheel clear password:");
    if (!password) return alert("No password entered. Clearing cancelled.");

    try {
      const res = await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setEntries([]);
        setWinnerIndex(null);
        setFlash(false);
        setShowWinnerModal(false);
      } else {
        alert("Incorrect password. Wheel not cleared.");
      }
    } catch {
      alert("Error clearing entries.");
    }
  };

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/gift-updates");
        const data = await res.json();
        if (data.added > 0) {
          const resEntries = await fetch("/api/entries");
          const updated = await resEntries.json();
          if (Array.isArray(updated.entries)) setEntries(updated.entries);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, []);

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

  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(flashInterval);
    }
  }, [winnerIndex]);

  return (
    <div className="scale-container">
      <h1 className="title">Lolcow Reapers Gifted Member Wheel.</h1>

      <div className="status-badge">
        <span>{scrapeStatus}</span>
      </div>

      <div className="subtitle-left">
        1 GIFTED{"\n"}={"\n"}1 Entry
      </div>

      <div className="subtitle-right">
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
        <button className="spin-btn" onClick={spinWheel}>
          Spin
        </button>
        <button className="clear-btn" onClick={clearEntries}>
          Clear Wheel
        </button>
      </div>

      {showWinnerModal && winnerIndex !== null && (
        <div className="winner-modal">
          <div className="winner-box">
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

      <footer className="footer">
        Developed By Shkrimpi - v1.1.2 - FUCK OFF RASTOV
      </footer>
    </div>
  );
}
