const express=require('express')
const router=express.Router()
const auth=require("../middleware.js/authMiddleware")
const {createMessage,getMessages,deleteMessage,updateMessage}=require("../controllers/message")

router.post("/createMessage",auth,createMessage)
router.get("/getMessages/:roomId",auth,getMessages)
router.delete("/deleteMessage",auth,deleteMessage)
router.patch("/updateMessage/:id",auth,updateMessage)


module.exports=router