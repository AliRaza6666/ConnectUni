const express = require("express");
const router = express.Router();
const auth = require("../middleware.js/authMiddleware");
const {getAllUsers}=require("../controllers/userController")



router.get("/getAllUsers",auth,getAllUsers);

module.exports = router;