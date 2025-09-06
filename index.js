import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import productsRouter from "./routes/products.js";
import variantsRouter from "./routes/variants.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// 🎨 Console colors
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Ensure uploads folder exists
const UPLOADS_DIR = "./uploads";
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ✅ Middlewares
app.use("/uploads", express.static("uploads"));
app.use(cors());
app.use(express.json());

// 📝 Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const color =
      res.statusCode >= 500
        ? COLORS.red
        : res.statusCode >= 400
        ? COLORS.yellow
        : COLORS.green;

    console.log(
      `${color}${req.method} ${req.originalUrl} → ${res.statusCode}${COLORS.reset} (${duration}ms)`
    );
  });
  next();
});

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// ✅ File upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    console.log(`${COLORS.red}❌ No file received${COLORS.reset}`);
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  console.log(`${COLORS.green}✅ File uploaded:${COLORS.reset} ${fileUrl}`);
  res.json({ success: true, url: fileUrl });
});

// ✅ Test DB endpoint
app.get("/test-db", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    next(err); // Pass to global error handler
  }
});

// ✅ Routes
app.use("/products", productsRouter);
app.use("/variants", variantsRouter);

// 🔥 Global error handler
app.use((err, req, res, next) => {
  console.error(`${COLORS.red}❌ Server Error:${COLORS.reset}`, err.stack || err);
  res.status(500).json({
    success: false,
    error: "Something went wrong on the server. Please try again later.",
  });
});

// ✅ Start server only if DB is alive
(async () => {
  try {
    console.log(`${COLORS.cyan}⏳ Checking database connection...${COLORS.reset}`);
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log(`${COLORS.green}✅ Database connected successfully${COLORS.reset}`);

    app.listen(PORT, () =>
      console.log(`${COLORS.green}🚀 Server running:${COLORS.reset} http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error(`${COLORS.red}❌ Cannot start server - DB connection failed:${COLORS.reset}`, err.message);
    process.exit(1);
  }
})();
