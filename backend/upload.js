const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    
    return {
      folder: "connectuni",
      resource_type: "auto",
      // Optimize images
      transformation: !isVideo ? [
        { quality: "auto:good", fetch_format: "auto" },
        { width: 1080, height: 1080, crop: "limit" }
      ] : undefined,
      // Video optimization
      ...(isVideo && {
        eager: [
          { quality: "auto:good", fetch_format: "auto" }
        ],
        eager_async: true
      })
    };
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

module.exports = upload;
