module.exports = {
  apps: [
    {
      name: "gift-scraper",
      script: "./scraper.js",
      watch: false,
      max_memory_restart: "200M", // Auto-restart if it exceeds 200 MB RAM
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
