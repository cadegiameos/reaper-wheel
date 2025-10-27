import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  const canvasRef = useRef(null);

  // Scale to window for full-screen UI
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Fetch current entries
  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      if (Array.isArray(data.entries)) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error("Error loading entries:", err);
    }
  };

  // Check live connection
  const checkLiveStatus = async () => {
    try {
      const res = await fetch("/api/check-live");
      const data = await res.json();
      setIsLiveConnected(data.connected || false);
      setPollingEnabled(data.connected || false);
    } catch (err) {
      console.error("Error checking live status:", err);
    }
  };

  // Load entries and live status on startup
  useEffect(() => {
    fetchEntries();
    checkLiveStatus();
  }, []);

  // Idle slow rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) {
        setRotation((prev) => (prev + 0.1) % 360);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // Flash effect for winner
  useEffect(() => {
    if (winnerIndex !== null) {
      const interval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(interval);
    }
  }, [winnerIndex]);

  // Poll gifts from scraper
  useEffect(() => {
    if (!pollingEnabled) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/poll");
        const data = await res.json();
        if (data.added > 0) {
          fetchEntries();
        }
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, [pollingEnabled]);

  // Draw wheel
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

  const handleClear = async () => {
    const token = prompt("Enter deletion token to clear the wheel:");
    if (!token) return;
    try {
      const res = await fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchEntries();
        setWinnerIndex(null);
        setShowWinnerModal(false);
      } else {
        alert(data.message || "Failed to clear");
      }
    } catch (err) {
      alert("Error clearing entries");
    }
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
      }}
    >
      <div className="container">
        <h1
          className="title"
          style={{
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "9.19em",
          }}
        >
          Lolcow Reapers Gifted Member Wheel.
        </h1>

        {isLiveConnected && (
          <div
            style={{
              position: "absolute",
              bottom: "90px",
              right: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "999px",
              zIndex: 9999,
            }}
          >
            ✅ Live Connected
          </div>
        )}

        {!isLiveConnected && (
          <div
            style={{
              position: "absolute",
              bottom: "90px",
              right: "24px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "999px",
            }}
          >
            ❌ No Live Stream Detected
          </div>
        )}

        <div
          className="subtitle"
          style={{
            position: "absolute",
            left: "13.5%",
            top: "45%",
            transform: "translateY(-50%)",
            whiteSpace: "pre-line",
            textAlign: "center",
            lineHeight: "1.2",
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "5.25em",
            color: "white",
            textShadow: "1px 1px 4px rgba(0,0,0,0.7)",
          }}
        >
          1 GIFTED{"\n"}={"\n"}1 Entry
        </div>

        <div
          className="subtitle"
          style={{
            position: "absolute",
            right: "7.5%",
            top: "45%",
            transform: "translateY(-50%)",
            whiteSpace: "pre-line",
            textAlign: "center",
            lineHeight: "1.2",
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "5.25em",
            color: "white",
            textShadow: "1px 1px 4px rgba(0,0,0,0.7)",
          }}
        >
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

        <div className="controls" style={{ justifyContent: "center" }}>
          <button className="spin-btn" onClick={spinWheel} style={{ padding: "12px 24px", fontSize: "1.15em" }}>
            Spin
          </button>
          <button
            className="clear-btn"
            onClick={handleClear}
            style={{ padding: "12px 24px", fontSize: "1.15em", marginLeft: "20px" }}
          >
            Clear Wheel
          </button>
        </div>

        {showWinnerModal && winnerIndex !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "43px 72px",
                borderRadius: "21px",
                textAlign: "center",
                boxShadow: "0 0 30px rgba(0,0,0,0.5)",
                transform: "scale(0)",
                animation: "popBounce 0.5s forwards",
              }}
            >
              <img
                src="/grimreaper.png"
                alt="Grim Reaper"
                className="grim-swing"
                style={{ width: "120px", marginBottom: "20px" }}
              />
              <h2 style={{ fontSize: "2em" }}>💀 Winner! 💀</h2>
              <p
                style={{
                  fontSize: "3.6em",
                  margin: "30px 0",
                  fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
                  fontWeight: "bold",
                }}
              >
                {entries[winnerIndex]}
              </p>
              <button
                onClick={() => setShowWinnerModal(false)}
                style={{ padding: "14px 28px", fontSize: "1.4em", borderRadius: "11px" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
