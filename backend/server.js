const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require('http')
const { Server } = require('socket.io');
const mongoose = require("mongoose");
const cors = require("cors");

const Message=require("./models/message")




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
    origin: "http://localhost:5173", // your React app
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
    server.listen(process.env.PORT, () => {
      console.log(`server running on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.set("io", io);

//io is main circuit for all sockets
//jb b koi soceket(user) connect hoga ye connection event automatically call hojye ga
io.on("connection",(socket)=>{

  socket.on("join_room",(roomId)=>{
      socket.join(roomId)
      
  })

  socket.on("send_message",async (data)=>{
    const msg=await Message.create(data)
    
    io.to(data.roomId).emit("receive_message",msg)


  })

  

})
