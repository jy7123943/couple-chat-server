const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { upload } = require('./middleware/image_upload');
const { validateUser } = require('./middleware/validation');

router.post('/signUp', validateUser, async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    const error = newUser.validateSync();

    if (error && error.name === 'ValidationError') {
      const errorObj = error.errors.id
        || error.errors.password
        || error.errors.name
        || error.errors.first_meet_day
        || error.errors.phone_number;

      const errorMessage = errorObj ? errorObj.message : 'some field is not valid';

      return res.status(400).json({ validationError: errorMessage });
    }

    await newUser.save();
    res.json({ result: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.post('/login',
  passport.authenticate('local', { session: false }),
  async (req, res, next) => {
    try {
      if (!req.user) {
        throw res.status(401).json({ Error: 'login failed' });
      }

      const token = jwt.sign(req.user.id, process.env.JWT_SECRET_KEY);
      return res.json({ result: "ok", token, userId: req.user.id });
    } catch (err) {
      console.log(err);
    }
});

router.put('/profileUpload', passport.authenticate('jwt', { session: false }), upload.single('profile_image_url'), async (req, res, next) => {
  try {
    console.log(req.file.location);
    await User.findByIdAndUpdate(req.user._id, { profile_image_url: req.file.location });

    return res.json({ result: 'ok' });
  } catch (err) {
    console.log(err);
    return res.json({ uploadError: 'failed' });
  }
});

module.exports = router;
