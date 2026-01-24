const Story = require("../models/storyModel");
const User = require("../models/userModel");

// Add or update user story
const addStory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const story = await Story.findOneAndUpdate(
      { user: userId },
      { mediaUrl: req.file.path, mediaType, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ msg: "Story uploaded", story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Get all stories with user info
const getAllStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("user", "name dp")
      .sort({ createdAt: -1 });

    const storiesWithUserInfo = stories.map(story => ({
      _id: story._id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      createdAt: story.createdAt,
      userName: story.user?.name || "",
      userDp: story.user?.dp || ""
    }));

    res.status(200).json({ status: 200, stories: storiesWithUserInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = {
  addStory,
  getAllStories
};




