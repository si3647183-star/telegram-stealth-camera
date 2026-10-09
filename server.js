const express = require("express");
const path = require("path");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Telegram Camera Bot is running." });
});

app.post("/api/send-photo", async (req, res) => {
  try {
    const { botToken, chatId, imageData } = req.body;

    if (!botToken || !chatId || !imageData) {
      return res.status(400).json({
        ok: false,
        error: "botToken, chatId, and imageData are required."
      });
    }

    const match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
    const base64Data = match ? match[2] : imageData;
    const buffer = Buffer.from(base64Data, "base64");

    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("photo", buffer, {
      filename: "capture.jpg",
      contentType: "image/jpeg",
      knownLength: buffer.length
    });

    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const telegramResponse = await fetch(url, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });

    const responseText = await telegramResponse.text();

    res.status(telegramResponse.status).json({
      ok: telegramResponse.ok,
      status: telegramResponse.status,
      response: responseText
    });
  } catch (error) {
    console.error("Telegram send failed:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
