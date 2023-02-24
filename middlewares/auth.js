const jwt = require("jsonwebtoken");
const User = require("../modles/users");
const catchAsyncErrors = require("./catchAsyncErrors");
const ErrorHandler = require("../util/errorHandler");

const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler("Login first to access this resource", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECREAT);
  req.user = await User.findById(decoded.id);
  next();
});

//Handling user roles
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    console.log(req.user);
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role(${req.user.role}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { isAuthenticatedUser, authorizeRole };
