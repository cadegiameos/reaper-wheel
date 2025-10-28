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
    (async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    })();
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
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: "1920px",
        height: "1080px",
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
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
          <button
            className="spin-btn"
            onClick={spinWheel}
            style={{ padding: "12px 24px", fontSize: "1.15em" }}
          >
            Spin
          </button>
        </div>

        <div
          className="manual-entry"
          style={{ flexDirection: "column", alignItems: "center" }}
        >
          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              disabled
            />
            <input
              type="number"
              min="1"
              max="20"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              style={{ width: "50px" }}
              disabled
            />
            <button onClick={addEntry} disabled>
              Add Entry
            </button>
          </div>

          <button
            className="clear-btn"
            onClick={clearEntries}
            style={{ marginTop: "10px" }}
          >
            Clear Wheel
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "90px",
            right: "24px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "999px",
            zIndex: 9999,
            fontSize: "0.95em",
            fontWeight: 600,
          }}
        >
          {scraperStatus}
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
                  animation: "textBounce 0.6s ease forwards",
                }}
              >
                {entries[winnerIndex]}
              </p>
              <button
                onClick={() => setShowWinnerModal(false)}
                style={{
                  padding: "14px 28px",
                  fontSize: "1.4em",
                  borderRadius: "11px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes swing {
            0% {
              transform: rotate(-10deg);
            }
            50% {
              transform: rotate(10deg);
            }
            100% {
              transform: rotate(-10deg);
            }
          }
          .grim-swing {
            animation: swing 1.2s ease-in-out infinite;
            transform-origin: top center;
          }
          @keyframes popBounce {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            60% {
              transform: scale(1.2);
              opacity: 1;
            }
            100% {
              transform: scale(1);
            }
          }
          @keyframes textBounce {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            60% {
              transform: scale(1.3);
              opacity: 1;
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>

        <footer
          style={{
            textAlign: "center",
            fontFamily: "Arial",
            marginTop: "20px",
          }}
        >
          Developed By Shkrimpi - v1.1.2
        </footer>
      </div>
    </div>
  );
}
