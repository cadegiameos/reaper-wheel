// gift-wheel-ui/routes/tokens.js

export async function getToken() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/tokens`);
    if (!response.ok) {
      throw new Error("Failed to fetch token");
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
}
