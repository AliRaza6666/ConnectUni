const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: true,
    unique: true, // Ensures one story per user
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24, // TTL: 24 hours in seconds
  },
});

// Optional: Update story if it exists, otherwise create
storySchema.statics.addOrUpdateStory = async function (userId, mediaUrl, mediaType) {
  return this.findOneAndUpdate(
    { user: userId },
    { mediaUrl, mediaType, createdAt: new Date() },
    { new: true, upsert: true } // Creates new if doesn't exist
  );
};

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
