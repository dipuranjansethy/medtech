import express from "express";
import {
  changePassword,
  deleteMyProfile,
  deleteUser,
  forgetPassword,
  getAllUsers,
  getMyProfile,
  login,
  logout,
  register,
  resetPassword,
  updataProfile,
  updataProfilePicture,
  updateUserRole,
} from "../controllers/userController.js";
import { authorizeAdmin, isAuthenticated } from "../middlewares/Auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

//register
router.route("/register").post(singleUpload, register);

//login
router.route("/login").post(login);

//logout
router.route("/logout").get(logout);

//get my prfile
router.route("/profile").get(isAuthenticated, getMyProfile);

//delete my profile
router.route("/profile").delete(isAuthenticated, deleteMyProfile);

//Change Password
router.route("/changepassword").put(isAuthenticated, changePassword);

//update profile
router.route("/updateprofile").put(isAuthenticated, updataProfile);

//update profile picture
router
  .route("/updateprofilepicture")
  .put(isAuthenticated, singleUpload, updataProfilePicture);

//forgetPassword
router.route("/forgetpassword").post(forgetPassword);

//resetPassword
router.route("/resetpassword/:token").put(resetPassword);

//Admin Routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);

//change role
router
  .route("/admin/user/:id")
  .put(isAuthenticated, authorizeAdmin, updateUserRole)
  .delete(isAuthenticated, authorizeAdmin, deleteUser);

export default router;
