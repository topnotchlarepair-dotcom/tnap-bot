/**
 * Housecall Pro Webhook Controller
 * This receives raw webhook events before they go into router or services
 */

export async function handleHcpWebhook(req, res) {
  try {
    console.log("📬 HCP Webhook (Controller Level):", JSON.stringify(req.body));

    const hcpEvent = req.body || {};

    if (!hcpEvent.type) {
      console.log("⚠️ HCP webhook missing 'type'");
      return res.status(200).json({ ok: true });
    }

    // Return early, this controller is a forwarder
    return res.status(200).json({
      ok: true,
      received: hcpEvent.type,
    });

  } catch (error) {
    console.error("❌ HCP CONTROLLER ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

