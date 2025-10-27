# 🎡 Gifted Membership Wheel (Scraper + UI)

A two-part app that scrapes YouTube live chats for gifted membership events from a specific channel and displays them in a spinning reward wheel.

---

## 📁 Project Structure
project-root/
│
├─ gift-scraper/ # Scrapes YouTube live chat for gifts
│ └─ scraper.js
│
├─ gift-wheel-ui/ # Frontend spinning wheel UI
│ └─ (Next.js code here)
│
├─ ecosystem.config.js # PM2 process config
└─ README.md

---

## ✅ Requirements

- VPS (Ubuntu 22.04 recommended)
- Node.js 18+
- PM2 installed globally
- Nginx (optional but recommended)

---

## 📦 Install Dependencies (First-Time Setup)

```bash
cd gift-scraper
npm install

cd ../gift-wheel-ui
npm install
