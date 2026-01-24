const ChatRoom=require("../models/chatRoomModel")

const createOrGetChatRoom=async(req,res)=>{
    try{
        const {otherUserID}=req.body
        const currentUserID=req.user.id    //from auth middleware

        let chatRoom=await ChatRoom.findOne({
            members:{$all:[currentUserID,otherUserID]}
        })
        if(!chatRoom){
                chatRoom=await ChatRoom.create({
                members:[currentUserID,otherUserID]
            })
        }
        res.status(200).json(chatRoom)
    }

    catch(error){
        res.status(500).json({"message":error.message})
    }

}

module.exports={createOrGetChatRoom}