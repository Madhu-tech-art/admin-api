import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ✅ GET all variants
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM variants");
    res.json({ success: true, variants: result.rows });
  } catch (error) {
    console.error("❌ Error fetching variants:", error);
    res.status(500).json({ success: false, error: "Failed to fetch variants" });
  }
});

// ✅ POST create new variant
router.post("/", async (req, res) => {
  try {
    const { product_id, color, size, stock, price } = req.body;

    if (!product_id || !color || !size || !stock || !price) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO variants (product_id, color, size, stock, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, color, size, stock, price]
    );

    res.status(201).json({ success: true, variant: result.rows[0] });
  } catch (error) {
    console.error("❌ Error adding variant:", error);
    res.status(500).json({ success: false, error: "Failed to add variant" });
  }
});

export default router;
