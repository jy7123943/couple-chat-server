const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');

require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const chatsRouter = require('./routes/chats');

const app = express();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_ATLAS_URL, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  socketTimeoutMS: 45000,
  keepAlive: true,
  reconnectTries: 10
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection-error:'));

db.once('open', function () {
  console.log('Couple Chat DB connected!!!');
});

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

require('./config/passport')(passport);
app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/chats', chatsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ err });
});

module.exports = app;
