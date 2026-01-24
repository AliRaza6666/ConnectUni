const express = require("express");
const router = express.Router();
const auth = require("../middleware.js/authMiddleware");
const upload = require("../upload");
const { uploadDp, getDp, getProfile, updateProfile } = require("../controllers/profileController");

router.post("/uploadDp", auth, upload.single("dp"), uploadDp);
router.get("/getDp", auth, getDp);
router.get("/getProfile", auth, getProfile);
router.put("/updateProfile", auth, updateProfile);

module.exports = router;

