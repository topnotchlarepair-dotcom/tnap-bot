// FILE: utils/streetview.js

export function getStreetViewUrl(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY is missing!");
    return null;
  }

  if (!address) {
    console.error("Address is empty!");
    return null;
  }

  const encoded = encodeURIComponent(address.trim());

  return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${encoded}&key=${apiKey}`;
}

