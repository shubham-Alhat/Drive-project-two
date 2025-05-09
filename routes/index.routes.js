const express = require("express");
const multer = require("multer");
const router = express.Router();
const supabase = require("../config/supabase");
const fileModel = require("../models/file.models");
const authMiddleware = require("../middlewares/auth");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/home", authMiddleware, async (req, res) => {
  // showing files on frontend
  const userFiles = await fileModel.find({
    user: req.user.userId,
  });

  res.render("home", {
    files: userFiles,
  });
});

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file selected for upload" });
    }

    // Generate public URL for the file
    const { data: publicUrlData, error: publicUrlError } =
      await supabase.storage
        .from("drive-storage")
        .getPublicUrl(`uploads/${file.originalname}`);

    if (publicUrlError) {
      throw publicUrlError;
    }

    // store file details in database
    const newFile = await fileModel.create({
      orignalname: req.file.originalname,
      user: req.user.userId,
      url: publicUrlData.publicUrl,
      path: `uploads/${file.originalname}`, // Save the file path
      size: req.file.size,
    });

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("drive-storage")
        .upload(`uploads/${file.originalname}`, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
          cacheControl: "3600",
          contentDisposition: `attachment; filename="${file.originalname}"`, // force download
        });

      if (uploadError) {
        throw uploadError;
      }

      res
        .status(200)
        .json({ message: "File uploaded successfully", data: uploadData });
    } catch (error) {
      res
        .status(500)
        .json({ message: "File upload failed", error: error.message });
    }
  }
);

router.get("/download/:id", authMiddleware, async (req, res) => {
  try {
    const fileId = req.params.id;
    const loggedInUserId = req.user.userId;

    const file = await fileModel.findOne({
      user: loggedInUserId,
      _id: fileId,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found in database",
      });
    }

    // Fetch the file from Supabase storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("drive-storage")
      .download(file.path); // Ensure `file.path` contains the correct file path

    if (fileError) {
      throw fileError;
    }

    // Set headers to force download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.orignalname}"`
    );
    res.setHeader("Content-Type", fileData.type);

    // Send the file data to the client
    const buffer = Buffer.from(await fileData.arrayBuffer()); // Convert Blob to Buffer
    res.send(buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to download file", error: error.message });
  }
});

router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const fileId = req.params.id;
    const loggedInUserId = req.user.userId;

    // find files in database
    const file = await fileModel.findOne({
      user: loggedInUserId,
      _id: fileId,
    });

    if (!file) {
      return res.status(404).json({
        message: "file not found in database",
      });
    }

    // delete file from supabase
    const { error: deleteError } = await supabase.storage
      .from("drive-storage")
      .remove([file.path]);

    if (deleteError) {
      throw deleteError;
    }

    // delete file metadata from database
    await fileModel.findByIdAndDelete(fileId);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete file", error: error.message });
  }
});

module.exports = router;
