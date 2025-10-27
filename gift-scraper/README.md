# Gift Scraper (Local VPS Version)

This script continuously scrapes the live chat of a specific YouTube channel's active livestream and extracts gifted membership events. It updates two JSON files:

- `entries.json` → Stores all gift-based entries (e.g., someone gifts 5 members = 5 entries).
- `processed.json` → Stores processed message IDs to prevent duplication.

---

## 📌 Prerequisites

✅ You must know the channel ID (already set in `.env`).

✅ You must have Node.js installed on the VPS.

✅ You must run this scraper using PM2 (or via `node scraper.js` for testing).

---

## ⚙️ Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
