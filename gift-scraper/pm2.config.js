module.exports = {
  apps: [
    {
      name: "gift-scraper",
      script: "./server.js",
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
