module.exports = {
  apps: [
    {
      name: "web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p " + (process.env.NEXT_PORT || 3000),
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      restart_delay: 2000,
    },
    {
      name: "scraper",
      script: "scripts/scraper.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.SCRAPER_PORT || 4000,
      },
      autorestart: true,
      restart_delay: 2000,
    },
  ],
};
