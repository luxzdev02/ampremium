const { autoCreateWithTempMail } = require("../lib/scraper");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ status: false, error: "Method not allowed" });
  }

  try {
    const options = req.body || {};
    const result = await autoCreateWithTempMail(options);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};
