const express = require("express");
const app = express();
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");
const errorMiddleware = require("./middlewares/errors");
const ErrorHandler = require("./util/errorHandler");
const cookieParser = require("cookie-parser");

//Setting up config.env file variable
dotenv.config({ path: "./config/config.env" });

//Handling Unchaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down due to unchaught exception");
  process.exit(1);
});

//connecting to the database
connectDatabase();

//  creating own middleware
const middleware = (req, res, next) => {
  console.log("Hello from the middleware");

  //setting up global user name
  req.user = "Behzad"; // this user can be naything we can set it up as any word
  next();
};

app.use(express.json());
// app.use(middleware);

//Setup cookie parser
app.use(cookieParser());

//Importing all of the routes
const jobs = require("./routes/jobes");
const auth = require("./routes/auth");
const user = require("./routes/user");

app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);

//Handle Unhandled route
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

//Middleware to handle errors
app.use(errorMiddleware);

const PORT = process.env.port;
const server = app.listen(PORT, () => {
  console.log(`Server started at port ${PORT} in ${process.env.NODE_ENV} mode`);
});

//Handling ynhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log("Shutting down the server due to Unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
