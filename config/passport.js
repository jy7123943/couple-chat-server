const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require('../model/User');

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
    try {
      const user = await User.findOne({ id: username });

      let isValidPassword;
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (err) {
        console.log(err);
        return done(null, false);
      }

      if (!user || !isValidPassword) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET_KEY
  }, async (jwtPayload, cb) => {
    try {
      const user = await User.findOne({ id: jwtPayload });
      if (user) {
        return cb(null, user);
      }
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  }));
};
