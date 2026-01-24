
const message = require("../models/message")
const Message=require("../models/message")


const createMessage=async(req,res)=>{
  try{
    const currentUser=req.user.id 
    const {roomId,text} =req.body
    const msg=await Message.create({
         "roomId":roomId,
        "senderId":currentUser,
        "text":text
    })
    res.status(200).json({
        "message":"Message Created Successfully",
        msg

    })

  }
  catch(err){
    res.status(500).json({"message":err.message})
  }

}

const getMessages=async(req,res)=>{
    try{
       const roomId=req.params.roomId
       const msgs=await Message.find({roomId}).sort({createdAt:1})
       res.status(200).json(msgs)
    }
    catch(error){
        res.status(500).json({"msg":error.msg})
    }
}

const deleteMessage=async(req,res)=>{
  try{
     
      const io = req.app.get("io");
      const msg=await Message.findById(req.body._id)
      
      
      if(msg.senderId.toString()!==req.user.id) {
        console.log("returning due to user not same as of message sender")
        return 
      } 
      msg.isDeleted=true
      msg.text="This message was deleted"
      await msg.save()
    
      
      io.to(req.body.roomId).emit("message_Deleted",msg)
      
      res.status(200).json(msg)
  }
  catch(err){
    res.status(500).json({
      "msg":"error while deleting message",
      "error":err.message
    })
  }
 

}

const updateMessage=async(req,res)=>{
  try{
      
      const io = req.app.get("io");
      const msg=await Message.findById(req.params.id)
      if(!msg) {
        console.log("no msg found ")
        return
      }
     
      msg.edited=true
      msg.text=req.body.text
      
      await msg.save()
      console.log(msg)
      io.to(msg.roomId).emit("message_updated",msg)
      console.log("message updated successfully and sent to all")
      res.status(200).json(msg)
      
  }
  catch(err){
    console.log("inside catch")
    res.status(500).json(err)
  }
}

module.exports={createMessage,getMessages,deleteMessage,updateMessage}