const express = require("express");
const router = express.Router();
const auth = require("../middleware.js/authMiddleware");
const {getAllUsers, searchUser}=require("../controllers/userController")



router.get("/getAllUsers",auth,getAllUsers);
router.get("/searchUser", searchUser);

module.exports = router;