import { catchAsyncError } from "../middlewares/catchAsynchError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";


export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const file = req.file;

  if (!name || !email || !password || !file || !role)
    return next(new ErrorHandler("please enter all the field", 400));
  let user = await User.findOne({ email });
  if (user) return next(new ErrorHandler("user already exist", 409));

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    role,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });
  sendToken(res, user, "Registered Successfully", 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("please enter your email and password", 400));
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("incorrect email or Password"), 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return next(new ErrorHandler("incorrect email or Password"), 401);

  sendToken(res, user, `welcome back, ${user.name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "log out successfully",
    });
});
export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user,
  });
});
export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("please enter all fields", 400));
  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) return next(new ErrorHandler("incorrect old Password"), 400);
  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "password changed successfully",
  });
});

export const updataProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    message: "profile updated successfully",
  });
});
export const updataProfilePicture = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const file = req.file;
  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  user.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  await user.save();
  res.status(200).json({
    success: true,
    message: "profile picture updated successfully",
  });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("no user with this mail id", 400));
  const resetToken = await user.getResetToken();
  await user.save();
  const url = `${process.env.FRONTEND_URL}/api/v1/resetpassword/${resetToken}`;
  //http://localhost:3000/resettoken/dnkjvhkjdfskvhkjshd
  const message = `<h2>hii</h2>
  ${url} this is your reset password link
  <p>Regard</p>
  <p>Dipu</p>`;
  // `click on the link to reset your password ${url} . If you have not request then please ignore`;
  //send token via email
  await sendEmail(user.email, "course bundler reset password", message);

  res.status(200).json({
    success: true,
    message: `reset token has been sent to ${user.email}`,
  });
});
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });
  if (!user)
    return next(new ErrorHandler("TOKEN IS INVALID OR HAS BEEN EXPIRED", 400));
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: "password changed successfully",
  });
});


//Admin controllers
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    success: true,
    users,
  });
});

//update user role
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user.role === "user") user.role = "admin";
  else user.role = "user";
  await user.save();
  res.status(200).json({
    success: true,
    message: "Role updated",
  });
});

//delete user
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  //cancel subscription
  await User.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "user deleted successfully",
  });
});

//delete profile
export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  //cancel subscription
  await User.deleteOne({ _id: req.user.id });
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "user deleted successfully",
    });
});

// User.watch().on("change", async () => {
//   const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

//   const subscription = await User.find({ "subscription.status": "active" });
//   stats[0].users = await User.countDocuments();
//   stats[0].subscriptions = subscription.length;
//   stats[0].createdAt = new Date(Date.now());
  
//   await stats[0].save();
// });