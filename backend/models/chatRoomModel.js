const mongoose=require("mongoose")

const chatRoomSchema=new  mongoose.Schema({
     members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
     ]
})

module.exports=mongoose.model("ChatRoom",chatRoomSchema)