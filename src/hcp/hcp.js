import express from "express";

const router = express.Router();

/**
 * Housecall Pro → Cloud Run webhook handler
 */
router.post("/", async (req, res) => {
  try {
    console.log("📬 Incoming HCP Webhook:", JSON.stringify(req.body));

    const hcp = req.body || {};

    if (!hcp.type) {
      console.log("⚠️ HCP webhook has no type field");
      return res.status(200).json({ ok: true });
    }

    switch (hcp.type) {
      case "job.created":
        await handleJobCreated(hcp.data);
        break;

      case "job.updated":
        await handleJobUpdated(hcp.data);
        break;

      case "customer.created":
        await handleCustomerCreated(hcp.data);
        break;

      default:
        console.log("⚠️ Unknown HCP event:", hcp.type);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("❌ HCP Webhook Error:", error);
    return res.status(500).json({ ok: false });
  }
});

/**
 * EVENT HANDLERS
 */
async function handleJobCreated(data) {
  console.log("🆕 HCP Job Created:", data);
  return true;
}

async function handleJobUpdated(data) {
  console.log("♻️ HCP Job Updated:", data);
  return true;
}

async function handleCustomerCreated(data) {
  console.log("👤 HCP Customer Created:", data);
  return true;
}

export default router;

