const express = require("express");
const router = express.Router();
const auth = require("../middleware.js/authMiddleware");
const upload = require("../upload");
const { addStory, getAllStories } = require("../controllers/storyController");

router.post("/addStory", upload.single("media"), auth, addStory);
router.get("/getAllStories", auth, getAllStories);

module.exports = router;




