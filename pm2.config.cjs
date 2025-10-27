// pm2.config.cjs

module.exports = {
  apps: [
    {
      name: "wheel-frontend",
      script: "npm",
      args: "run start",     // Must run: next build && next start beforehand
      cwd: "/root/reaper-wheel",  // Adjust path to your project folder
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "yt-scraper",
      script: "scraper.js",
      cwd: "/root/reaper-wheel",
      interpreter: "node",
      watch: false,
      autorestart: true,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
