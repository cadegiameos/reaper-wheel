// pages/index.jsx
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [scale, setScale] = useState(1);

  const canvasRef = useRef(null);

  // ✅ Auto-scale UI to browser
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

  // ✅ Load entries from Redis
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    })();
  }, []);

  // ✅ Slow idle rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) setRotation((prev) => (prev + 0.1) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // ✅ Flash effect for winner
  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
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

  // ✅ Clear wheel with deletion token
  const clearWheel = async () => {
    const token = prompt("Enter deletion token to clear the wheel:");
    if (!token) return;
    try {
      const res = await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to clear");
      setEntries([]);
      setWinnerIndex(null);
      setFlash(false);
      setShowWinnerModal(false);
    } catch {
      alert("Failed to clear the wheel");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: "1920px",
        height: "1080px",
      }}
    >
      <h1
        style={{
          fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
          fontSize: "9.19em",
        }}
      >
        Lolcow Reapers Gifted Member Wheel.
      </h1>

      {/* Left-side text */}
      <div
        style={{
          position: "absolute",
          left: "13.5%",
          top: "45%",
          transform: "translateY(-50%)",
          fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
          fontSize: "5.25em",
          color: "white",
        }}
      >
        1 GIFTED = 1 Entry
      </div>

      {/* Right-side counter */}
      <div
        style={{
          position: "absolute",
          right: "7.5%",
          top: "45%",
          transform: "translateY(-50%)",
          fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
          fontSize: "5.25em",
          color: "white",
        }}
      >
        GIFTED ENTRIES:
        <br />
        {entries.length}
      </div>

      {/* Wheel */}
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

      {/* Spin button */}
      <button onClick={spinWheel} style={{ marginTop: "20px" }}>
        Spin
      </button>

      {/* Clear button */}
      <button onClick={clearWheel} style={{ marginTop: "10px" }}>
        Clear Wheel
      </button>

      {/* Footer */}
      <footer style={{ marginTop: "20px" }}>
        Developed By Shkrimpi - v1.1.2
      </footer>
    </div>
  );
}
