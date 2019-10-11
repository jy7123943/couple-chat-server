const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'password'
  }, async (username, password, done) => {
    const user = await User.findOne({ id: username });

    if (!user) {
      return done(null, false, { message: 'Incorrect username or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return done(null, false, { message: 'Incorrect username or password' });
    }

    return done(null, user);
  }));
};
