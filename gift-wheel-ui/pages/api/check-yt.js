export default async function handler(req, res) {
  try {
    // You'll update this logic later to check scraper heartbeat (e.g., Redis or server ping)
    // For now, assume scraper sets a heartbeat flag somewhere like Redis or a local file.
    // Placeholder: always return disconnected.
    return res.status(200).json({ connected: false });
  } catch (err) {
    return res.status(500).json({ connected: false });
  }
}
