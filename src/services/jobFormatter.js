export function formatJobCard(job) {
  const {
    clientName = "N/A",
    phone = "N/A",
    address = "N/A",
    appliance = "N/A",
    description = "N/A",
    visitDate = "N/A",
    timeWindow = "N/A",
    technician = null,
    status = "Waiting for technician"
  } = job;

  return `🔥 <b>NEW JOB REQUEST</b>

👤 <b>Client:</b> ${clientName}
📞 <b>Phone:</b> ${phone}
📍 <b>Address:</b> ${address}

🔧 <b>Appliance:</b> ${appliance}
📝 <b>Issue:</b> ${description}

📅 <b>Date:</b> ${visitDate}
⏰ <b>Time:</b> ${timeWindow}

<b>Status:</b> ${technician ? `Assigned to <u>${technician}</u>` : status}`;
}

