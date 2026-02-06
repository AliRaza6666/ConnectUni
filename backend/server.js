const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require('http')
const { Server } = require('socket.io');
const mongoose = require("mongoose");
const cors = require("cors");

const Message=require("./models/message")
const jwt=require("jsonwebtoken")




const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const storyRoutes = require("./routes/storyRoutes");
const userRoutes=require("./routes/userRoutes")
const chatRoomRoutes=require("./routes/chatRoomRoutes")
const messageRoutes=require("./routes/message")

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});
// Use routes
app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", profileRoutes);
app.use("/", storyRoutes);
app.use("/", userRoutes)
app.use("/",chatRoomRoutes)
app.use("/",messageRoutes)

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("database connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`server running on ${PORT}`);
    });
    
  })
  .catch((err) => {
    console.log(err);
  });

app.set("io", io);

// Socket.io middleware for JWT auth
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.id
    next()
  }
  catch (err) {
    console.log(err.message)
  }
})

const onlineUsers = new Map()

//io is main circuit for all sockets
//jb b koi soceket(user) connect hoga ye connection event automatically call hojye ga
io.on("connection",(socket)=>{
  
  socket.on("mark_seen", async ({ senderId, roomId }) => {
    try {
      const updateMsg = await Message.updateMany(
        { senderId, roomId, isSeen: { $ne: true } },
        { $set: { isSeen: true } }
      )
      const senderSocketId = onlineUsers.get(senderId)
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", roomId)
      }
    }
    catch (err) {
      console.log("error while updating msgs to seen")
    }
  })

  onlineUsers.set(socket.userId, socket.id)

  socket.on("join_room",(roomId)=>{
      socket.join(roomId)
  })

  // Leave room handler to fix cross-chat message issue
  socket.on("leave_room",(roomId)=>{
      socket.leave(roomId)
  })

  socket.on("send_message",async (data)=>{
    const msg=await Message.create(data)
    io.to(data.roomId).emit("receive_message",msg)
  })

  io.emit("online_users", Array.from(onlineUsers.keys()))
  console.log(onlineUsers.keys())

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId)
    io.emit("online_users", Array.from(onlineUsers.keys()))
    console.log(onlineUsers.keys())
  })
})
