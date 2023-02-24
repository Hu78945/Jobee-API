const User = require("../modles/users");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../util/errorHandler");
const sendToken = require("../util/jwtToken");

//Get current user profile => /api/v1/me
const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

//Update current User password => /api/v1/password/update
const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  //check previous user password
  const isMatched = await user.comparePassword(req.body.currentPassword);
  if (!isMatched) {
    return next(new ErrorHandler("Password is incorrct.", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendToken(user, 200, res);
});

//Update the current user data => /api/v1/me/update
const updateUser = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//Delete current User => /api/v1/me/delete
const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user.id);

  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Your account have been deleted.",
  });
});

module.exports = { getUserProfile, updatePassword, updateUser, deleteUser };
