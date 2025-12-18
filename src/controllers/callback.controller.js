export async function handleCallback(req, res) {
  console.log("⚠️ Callback ignored by Cloud Run — handled by Apps Script");
  return res.sendStatus(200);
}

