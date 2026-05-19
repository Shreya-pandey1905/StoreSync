const express = require("express");
const router = express.Router();
const Store = require("../models/store.js");

// ✅ GET all stores
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find().populate("managers", "name email"); 
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET single store
router.get("/:id", async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate("managers", "name email");
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ CREATE new store
router.post("/", async (req, res) => {
  try {
    const { name, address, contactNumber, managers } = req.body;

    const newStore = new Store({
      name,
      address,
      contactNumber,
      managers
    });

    const store = await newStore.save();
    res.status(201).json(store);
  } catch (err) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// ✅ UPDATE store
router.put("/:id", async (req, res) => {
  try {
    req.body.updatedAt = Date.now();

    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("managers", "name email");

    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// ✅ DELETE store
router.delete("/:id", async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json({ message: "Store deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
