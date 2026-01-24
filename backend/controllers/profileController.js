const User = require("../models/userModel");

// Upload user profile picture
const uploadDp = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      res.send({
        status: 404,
        msg: "User not found"
      });
      return;
    }
    if (!req.file) {
      res.send({
        status: 400,
        msg: "no file uploaded"
      });
      return;
    }
    user.dp = req.file.path;
    await user.save();
    res.send({
      status: 200,
      msg: "dp uploaded successfully",
      url: req.file.path
    });
  } catch (err) {
    res.send({
      status: 500,
      msg: err.message
    });
  }
};

// Get user profile picture
const getDp = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      res.send({
        status: 400,
        msg: "User not found"
      });
      return;
    }
    const dp = user.dp;
    res.send({
      status: 200,
      dp
    });
  } catch (err) {
    res.send({
      status: 500,
      msg: err.message
    });
  }
};

// Get user profile information
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name email dp bio");
    if (!user) {
      res.status(404).json({
        status: 404,
        msg: "User not found"
      });
      return;
    }
    res.status(200).json({
      status: 200,
      profile: {
        name: user.name,
        email: user.email,
        dp: user.dp,
        bio: user.bio || ""
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      msg: err.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        status: 404,
        msg: "User not found"
      });
      return;
    }

    if (name) {
      user.name = name;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }

    await user.save();

    // Update localStorage user info
    res.status(200).json({
      status: 200,
      msg: "Profile updated successfully",
      profile: {
        name: user.name,
        email: user.email,
        dp: user.dp,
        bio: user.bio || ""
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      msg: err.message
    });
  }
};

module.exports = {
  uploadDp,
  getDp,
  getProfile,
  updateProfile
};

