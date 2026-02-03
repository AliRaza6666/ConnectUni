const express = require("express");
const router = express.Router();
const auth = require("../middleware.js/authMiddleware");
const upload = require("../upload");
const { addPost, getAllMedia, getMyPosts, deletePost } = require("../controllers/postController");

router.post("/addPost", auth, upload.single("media"), addPost);
router.get("/getAllMedia", auth, getAllMedia);
router.get("/getMyPosts", auth, getMyPosts);
router.delete("/deletePost/:postId", auth, deletePost);

module.exports = router;




