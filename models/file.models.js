const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  orignalname: {
    type: String,
    required: [true, "orignal name is required"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "user is required"],
  },
  path: {
    type: String, // Add this field to store the file path in the bucket
    required: [true, "file path is required"],
  },
  url: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
});

const file = mongoose.model("file", fileSchema);

module.exports = file;
