// src/index.js
import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("TNAP BOT OK");
});

app.post("/api/telegram", (req, res) => {
  console.log("WEBHOOK HIT", req.body);
  res.status(200).json({ ok: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("SERVER UP ON", PORT);
});

