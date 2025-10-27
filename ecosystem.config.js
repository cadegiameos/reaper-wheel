module.exports = {
  apps: [
    {
      name: "gift-scraper",
      script: "./gift-scraper/scraper.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "gift-wheel-ui",
      script: "npm",
      args: "start",
      cwd: "./gift-wheel-ui",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
