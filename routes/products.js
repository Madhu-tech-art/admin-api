import express from "express";
import { pool } from "../db.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// 📂 Configure multer for uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ GET all products
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

// ✅ POST create new product (with optional image upload)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { collection_id, name, description, base_price, vendor_url } = req.body;

    if (!collection_id || !name || !base_price) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO products (collection_id, name, description, base_price, image_url, vendor_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [collection_id, name, description, base_price, image_url, vendor_url]
    );

    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({ success: false, error: "Failed to add product" });
  }
});

// ✅ UPDATE product (PUT /products/:id)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { collection_id, name, description, base_price, vendor_url } = req.body;

    if (!collection_id || !name || !base_price) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;

    const result = await pool.query(
      `UPDATE products 
       SET collection_id=$1, name=$2, description=$3, base_price=$4, image_url=$5, vendor_url=$6
       WHERE id=$7 RETURNING *`,
      [collection_id, name, description, base_price, image_url, vendor_url, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, error: "Product not found" });

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({ success: false, error: "Failed to update product" });
  }
});

// ✅ DELETE product (DELETE /products/:id)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, error: "Product not found" });

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ success: false, error: "Failed to delete product" });
  }
});

export default router;
