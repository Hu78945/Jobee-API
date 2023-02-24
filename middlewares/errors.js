const ErrorHandler = require("../util/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errorMessage: err.message,
      stack: err.stack,
    });
  }

  if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    //Wrong Mongoose Onject Id Error
    if (err.name === "CastError") {
      const message = `Resource not found. Invalid: ${err.path}`;
      error = new ErrorHandler(message, 404);
    }

    //Handling mongoose duplicate key error
    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
      error = new ErrorHandler(message, 400);
    }

    //Handling Mongoose Validation Error
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      error = new ErrorHandler(message, 400);
    }

    //Handling the wrong jwt error
    if (err.name === "JsonWebTokenError") {
      const message = "Json Web Token is invalid. Try Again";
      error = new ErrorHandler(message, 500);
    }

    //Handling the expired JWT token error
    if (err.name === "TokenExpiredError") {
      const message = "Json web token is expired. Try Again!";
      error = new ErrorHandler(message, 500);
    }

    res.status(error.statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
