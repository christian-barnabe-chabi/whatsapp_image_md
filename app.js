var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const uploadRouter = require("./routes/upload");
const configRouter = require("./routes/settings");
require("dotenv").config();

var http = require("http");

/**
 * Create HTTP server.
 */

var app = express();
var server = http.createServer(app);
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("Connection from " + socket.id);
});

app.set("socketio", io);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(require("./config/folders.json").outFolder));

app.use("/", uploadRouter);
app.use("/upload", uploadRouter);
app.use("/config", configRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  console.log("================ ERROR ========================");
  // console.log(err);
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, server };
