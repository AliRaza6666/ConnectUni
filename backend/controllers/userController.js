const User=require("../models/userModel")
const getAllUsers=async(req,res)=>{
    try{
      const users=await User.find()
     res.status(200).json(
        {
            message:"users fetched successfully",
            users
        }
     )
    }
    catch(error){
        res.status(500).json({
            message:"error while fetching users",
            error:error.msg
        })
    }
     

}

module.exports={getAllUsers}
