const User = require("../models/userModel");

// Add a new post (media upload)
const addPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      res.send({
        status: 404,
        msg: "user not found"
      });
      return;
    }
    if (!req.file) {
      res.send({
        status: 400,
        msg: "No file uploaded"
      });
      return;
    }
    user.media.push({
      url: req.file.path, // Cloudinary URL
      type: req.file.mimetype.startsWith("video") ? "video" : "image"
    });

    await user.save();
    res.send({
      status: 200,
      msg: "Post Uploaded Successfully",
      url: req.file.path
    });
  } catch (err) {
    res.send({
      status: 500,
      msg: err.message
    });
  }
};

// Get all media from all users
const getAllMedia = async (req, res) => {
  try {
    const media = await User.find().select("name dp media");
    res.send({
      status: 200,
      media
    });
  } catch (err) {
    res.send(err.message);
  }
};

// Get current user's posts
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await User.findById(userId);

    const posts = data.media;
    res.status(200).json({ msg: "Post retrieved Successfully", posts });
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
    console.log(err);
  }
};

// Delete a post by its ID
const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, msg: "User not found" });
    }

    // Find the post index
    const postIndex = user.media.findIndex(post => post._id.toString() === postId);
    
    if (postIndex === -1) {
      return res.status(404).json({ status: 404, msg: "Post not found" });
    }

    // Remove the post from the media array
    user.media.splice(postIndex, 1);
    await user.save();

    res.status(200).json({ 
      status: 200, 
      msg: "Post deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ status: 500, msg: err.message });
  }
};

module.exports = {
  addPost,
  getAllMedia,
  getMyPosts,
  deletePost
};




