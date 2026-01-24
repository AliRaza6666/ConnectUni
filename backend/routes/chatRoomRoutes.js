const express = require("express");
const router=express.Router()
const {createOrGetChatRoom}=require("../controllers/chatRoomController")
const auth=require("../middleware.js/authMiddleware")


router.post("/createOrGetChatRoom",auth,createOrGetChatRoom)


module.exports=router;
