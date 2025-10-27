// pages/index.jsx
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

  // Status badge (bottom-right): "live" | "upcoming" | "offline"
  const [streamStatus, setStreamStatus] = useState("offline");
  // Optional channel label (shown next to tick)
  const [channelTitle, setChannelTitle] = useState(null);

  const canvasRef = useRef(null);

  // scale to window like the Vercel version
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

  // load entries
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    })();
  }, []);

  // status badge (prefer scraper status, fall back to old check-youtube)
  useEffect(() => {
    (async () => {
      // try scraper-based status first
      try {
        const r = await fetch("/api/scraper/status");
        if (r.ok) {
          const d = await r.json();
          // expected: { status: 'live'|'upcoming'|'offline', channelTitle?: string }
          if (d && typeof d.status === "string") {
            setStreamStatus(d.status);
            if (d.channelTitle) setChannelTitle(d.channelTitle);
            return;
          }
        }
      } catch {}
      // fall back to legacy check-youtube (treat exists=true as "live" for badge)
      try {
        const r2 = await fetch("/api/check-youtube");
        const d2 = await r2.json();
        if (d2?.exists) {
          setStreamStatus("live");
          if (d2.channelTitle) setChannelTitle(d2.channelTitle);
        } else {
          setStreamStatus("offline");
        }
      } catch {
        setStreamStatus("offline");
      }
    })();
  }, []);

  // add entry (manual; UI inputs remain disabled like before)
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

  // clear entries — prompt for deletion token (as requested)
  const clearEntries = async () => {
    const token = window.prompt("Enter deletion token to clear the wheel:");
    if (!token) return;
    try {
      const res = await fetch("/api/entries", {
        method: "DELETE",
        headers: { "X-Delete-Token": token },
      });
      if (res.ok) {
        setEntries([]);
        setWinnerIndex(null);
        setFlash(false);
        setShowWinnerModal(false);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.message || "Not allowed");
      }
    } catch {}
  };

  // idle slow rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) setRotation((prev) => (prev + 0.1) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // winner flash
  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(flashInterval);
    }
  }, [winnerIndex]);

  // draw wheel
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

  // If you want the UI to auto-refresh entries after scraper adds them,
  // uncomment this polling (kept off to avoid duplicates):
  // useEffect(() => {
  //   const i = setInterval(async () => {
  //     try {
  //       const r = await fetch("/api/entries");
  //       const d = await r.json();
  //       if (Array.isArray(d.entries)) setEntries(d.entries);
  //     } catch {}
  //   }, 10000);
  //   return () => clearInterval(i);
  // }, []);

  // badge text
  const badgeText =
    streamStatus === "live"
      ? "LIVE"
      : streamStatus === "upcoming"
      ? "UPCOMING"
      : "OFFLINE";

  // badge color
  const badgeDot = streamStatus === "live" ? "rgba(0,255,0,0.85)" :
                   streamStatus === "upcoming" ? "rgba(255,200,0,0.9)" :
                   "rgba(255,255,255,0.7)";

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

        {/* Connected/status badge at bottom-right (like tick, moved up a bit) */}
        <div
          style={{
            position: "absolute",
            bottom: "90px",
            right: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "999px",
            zIndex: 9999,
          }}
          title={
            channelTitle
              ? `${badgeText}${badgeText ? " · " : ""}${channelTitle}`
              : badgeText
          }
        >
          <div
            style={{
              background: badgeDot,
              color: "#000",
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: "0.95em", fontWeight: 600 }}>
            {badgeText}
            {channelTitle ? ` · ${channelTitle}` : ""}
          </span>
        </div>

        {/* Left-side text */}
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

        {/* Right-side counter */}
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

        {/* Spin button */}
        <div className="controls" style={{ justifyContent: "center" }}>
          <button
            className="spin-btn"
            onClick={spinWheel}
            style={{ padding: "12px 24px", fontSize: "1.15em" }}
          >
            Spin
          </button>
        </div>

        {/* Manual entry (visible but disabled) */}
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
            title={"Clear all entries (requires deletion token)"}
          >
            Clear Wheel
          </button>
        </div>

        {/* Winner Modal */}
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
                src="/grimreaper.jpg"
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

        {/* Global styles: background, custom font, animations */}
        <style jsx global>{`
          @font-face {
            font-family: 'Tooth and Nail Regular';
            src: url('/fonts/ToothAndNail-Regular.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          html, body, #__next {
            height: 100%;
          }
          body {
            margin: 0;
            background: url('/background.jpg') center center / cover no-repeat fixed;
            color: #fff;
            overflow: hidden;
          }
          @keyframes swing {
            0% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
            100% { transform: rotate(-10deg); }
          }
          .grim-swing {
            animation: swing 1.2s ease-in-out infinite;
            transform-origin: top center;
          }
          @keyframes popBounce {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); }
          }
          @keyframes textBounce {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); }
          }
          .spin-btn, .clear-btn, input, button {
            font-family: Arial, sans-serif;
          }
          .wheel-container, .controls, .manual-entry {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .wheel-container {
            margin-top: 20px;
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
