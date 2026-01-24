const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "connectuni",
    resource_type: "auto", // image or video
  },
});

const upload = multer({ storage });

module.exports = upload;
