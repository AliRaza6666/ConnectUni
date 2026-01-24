const mongoose=require("mongoose")

const messageSchema=mongoose.Schema({
    roomId:{
        type:String,
        ref:"ChatRoom"
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    text:{
        type:String,
        required:true
    },
    isDeleted:{
       type:Boolean,
       default:false
    },
    edited:{
       type:Boolean,
       default:false
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

})

module.exports=mongoose.model("Message",messageSchema)