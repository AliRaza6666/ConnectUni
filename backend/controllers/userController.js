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

const searchUser = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        message: "Search query is required"
      });
    }

    // Case-insensitive search using regex
    const users = await User.find({
      name: { $regex: name, $options: 'i' }
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error while searching users",
      error: error.message
    });
  }
};

module.exports={getAllUsers, searchUser}
