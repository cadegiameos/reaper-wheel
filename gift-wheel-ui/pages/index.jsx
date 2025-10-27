import React, { useEffect, useState, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState("Checking…");
  const canvasRef = useRef(null);

  // 📌 Scaling for any resolution
  const [scale, setScale] = useState(1);
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

  // 📌 Load initial entries
  useEffect(() => {
    fetch("/api/entries")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.entries)) setEntries(data.entries);
      })
      .catch(() => {});
  }, []);

  // 📌 Poll gift scraper every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await fetch("/api/status").then((res) => res.json());
        setScrapeStatus(status.state || "Checking…");

        const update = await fetch("/api/entries").then((res) => res.json());
        if (Array.isArray(update.entries)) setEntries(update.entries);
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 📌 Draw wheel
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
      fontSize = Math.max(fontSize, 12);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";

      const textRadius = radius * 0.6;
      ctx.fillText(entry, textRadius, 0);

      ctx.restore();
    });
  }, [entries, rotation, winnerIndex, flash]);

  // 📌 Spin wheel
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

  // 📌 Flash winner
  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(flashInterval);
    }
  }, [winnerIndex]);

  // 📌 Clear entries with password prompt
  const clearEntries = async () => {
    const password = prompt("Enter password to clear the wheel:");
    if (!password) return;

    const res = await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) return alert(data.message || "Invalid password");
    setEntries([]);
    setWinnerIndex(null);
    setShowWinnerModal(false);
    setFlash(false);
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
        <h1
          className="title"
          style={{
            fontFamily: "'ToothAndNail-Regular', Arial, sans-serif",
            fontSize: "9.19em",
          }}
        >
          Lolcow Reapers Gifted Member Wheel.
        </h1>

        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "24px",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "999px",
            fontSize: "1em",
          }}
        >
          {scrapeStatus === "live"
            ? "🔴 Live"
            : scrapeStatus === "upcoming"
            ? "🟡 Upcoming"
            : "⚫ Offline"}
        </div>

        <div className="subtitle left-area">1 GIFTED = 1 Entry</div>
        <div className="subtitle right-area">GIFTED ENTRIES: {entries.length}</div>

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

        <footer style={{ marginTop: "20px", fontFamily: "Arial", fontSize: "1em" }}>
          Developed By Shkrimpi - v1.1.2
        </footer>

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
      </div>
    </div>
  );
}
