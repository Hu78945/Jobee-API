const User = require("../modles/users");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../util/errorHandler");
const sendToken = require("../util/jwtToken");
const sendEmail = require("../util/sendEmail");
const crypto = require("crypto");

//Register a new user => /api/v1/register
const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });

  sendToken(user, 200, res);
});

//Login user => /api/v1/login
const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //Check if the user have nterd emal and password
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password."), 400);
  }

  //Finding the user in the database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  //check if the password is correcct
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  sendToken(user, 200, res);
});

//Forgot password => /api/v1/password/forgot
const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  console.log(user);

  //Check user email in database
  if (!user) {
    return next(new ErrorHandler("No user found with this email.", 404));
  }

  //Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  //Create reset password url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset link is as follow:\n\n${resetUrl}\n\n If you hav not requested this, then ignore this please`;

  try {
    await sendEmail({
      email: user.email,
      subject: "JobeApi-Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent successfully to : ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Email is not sent.", 500));
  }
});

//Reset Password => /api/v1/password/reset/:token
const resetPassword = catchAsyncErrors(async (req, res, next) => {
  //Hash url token
  console.log(req.params.token);
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  console.log(resetPasswordToken);

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Password reset token is invalid. or token has been expired",
        400
      )
    );
  }

  //setup new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

//logot user => /api/v1/logout
const logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logout,
};
