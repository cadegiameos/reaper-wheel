// /gift-wheel-ui/components/DeleteModal.jsx
import React, { useState } from "react";

export default function DeleteModal({ onClose, onConfirm }) {
  const [tokenInput, setTokenInput] = useState("");

  const handleConfirm = () => {
    if (!tokenInput.trim()) {
      alert("Please enter the token.");
      return;
    }
    onConfirm(tokenInput.trim());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          width: "300px",
          textAlign: "center",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Enter Deletion Token</h3>
        <input
          type="password"
          placeholder="Token"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleConfirm}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "red",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "5px",
            border: "none",
          }}
        >
          Confirm
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ccc",
            cursor: "pointer",
            borderRadius: "5px",
            border: "none",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
