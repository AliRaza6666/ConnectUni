const mongoose=require("mongoose")


const mediaModel=new mongoose.Schema(
    { 
        url:{type:String,required:true},
        type:{type:String,enum:["image","video"],required:true},
        likes:{type:Number,default:0},
        createdAt:{type:Date,default:Date.now}
        
    }
)

const userSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email: { type: String, required: true, unique: true },
    password:{type:String,required:true},
    dp:{type:String,default:""},
    bio:{type:String,default:""},
    media:[mediaModel],
},
  
   { timestamps:true},
  
)

module.exports=mongoose.model("User",userSchema)