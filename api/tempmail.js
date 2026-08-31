const { createTempEmail, getTempMailMessages } = require("../lib/scraper");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST" && req.body?.action === "create") {
      const result = await createTempEmail();
      return res.status(200).json(result);
    }

    if (req.method === "POST" && req.body?.action === "messages" && req.body?.tempMail) {
      const result = await getTempMailMessages(req.body.tempMail);
      return res.status(200).json(result);
    }

    if (req.method === "GET") {
      const result = await createTempEmail();
      return res.status(200).json(result);
    }

    return res.status(400).json({ status: false, error: "Invalid request" });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};
