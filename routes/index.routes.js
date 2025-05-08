const express = require("express");
const multer = require("multer");
const router = express.Router();
const supabase = require("../config/supabase");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/home", (req, res) => {
  res.render("home");
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file selected for upload" });
  }

  try {
    const { data, error } = await supabase.storage
      .from("drive-storage")
      .upload(`uploads/${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    res.status(200).json({ message: "File uploaded successfully", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "File upload failed", error: error.message });
  }
});

module.exports = router;
