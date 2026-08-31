const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Import API handlers
const createHandler = require("./api/create");
const bulkHandler = require("./api/bulk");
const tempmailHandler = require("./api/tempmail");

// API Routes - sama persis seperti Vercel
app.post("/api/create", createHandler);
app.post("/api/bulk", bulkHandler);
app.post("/api/tempmail", tempmailHandler);
app.get("/api/tempmail", tempmailHandler);

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404
app.use((req, res) => {
  res.status(404).json({ status: false, error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n⚡ SERVER BERJALAN`);
  console.log(`📍 Lokal: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/create\n`);
});
