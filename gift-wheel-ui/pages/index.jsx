import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [scale, setScale] = useState(1);

  const [scrapeStatus, setScrapeStatus] = useState("Checking live status...");
  
  const canvasRef = useRef(null);

  // ✅ Resize scaling to match original 1920x1080 design
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

  // ✅ Fetch entries initially
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    })();
  }, []);

  // ✅ Poll scraper status from backend
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch("/api/scraper-status");
        const data = await res.json();
        if (data.status) setScrapeStatus(data.status);
      } catch {
        setScrapeStatus("Scraper Offline");
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Poll new gifted entries
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  // ✅ Clear wheel with password
  const clearEntriesWithPassword = async () => {
    const password = prompt("Enter the clear password:");
    if (!password) return;
    try {
      const res = await fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntries([]);
        setWinnerIndex(null);
        setFlash(false);
        setShowWinnerModal(false);
      } else {
        alert(data.message || "Invalid password");
      }
    } catch (err) {
      alert("Error clearing entries");
    }
  };

  // ✅ Spin wheel
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

  // ✅ Flash effect on winner
  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => {
        setFlash((prev) => !prev);
      }, 500);
      return () => clearInterval(flashInterval);
    }
  }, [winnerIndex]);

  // ✅ Draw wheel
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
      ctx.font = `bold 22px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      ctx.fillText(entry, radius * 0.6, 0);
      ctx.restore();
    });
  }, [entries, rotation, winnerIndex, flash]);

  return (
    <div
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

        <div className="subtitle-left">1 GIFTED{"\n"}={"\n"}1 Entry</div>

        <div className="subtitle-right">GIFTED ENTRIES:{"\n"}{entries.length}</div>

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
          <input type="text" placeholder="Enter name" disabled />
          <input type="number" value={1} disabled />
          <button disabled>Add Entry</button>
          <button onClick={clearEntriesWithPassword} className="clear-btn">Clear Wheel</button>
        </div>

        <div className="scraper-status">{scrapeStatus}</div>

        {showWinnerModal && winnerIndex !== null && (
          <div className="winner-modal">
            <div className="winner-content">
              <img src="/grimreaper.png" className="grim-swing" />
              <h2>💀 Winner! 💀</h2>
              <p>{entries[winnerIndex]}</p>
              <button onClick={() => setShowWinnerModal(false)}>Close</button>
            </div>
          </div>
        )}

        <footer>Developed By Shkrimpi - v1.1.2</footer>
      </div>
    </div>
  );
}
