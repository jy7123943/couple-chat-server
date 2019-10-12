const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { upload } = require('./middleware/image_upload');
const { validateUser } = require('./middleware/validation');

router.post('/signUp', validateUser, async (req, res, next) => {
  try {
    console.log('body: ', req.body);

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
      console.log(req.user);
      if (!req.user) {
        throw res.status(401).json({ loginError: 'login failed' });
      }

      const token = jwt.sign(req.user.id, process.env.JWT_SECRET_KEY);
      return res.json({ result: "ok", token });
    } catch (err) {
      console.log(err);
    }
});

router.post('/test', passport.authenticate('jwt', {session: false}), (req, res) => {
  return res.json({ login: 'success' });
});

router.put('/profileUpload', (req, res, next) => { console.log(req.headers); next() }, passport.authenticate('jwt', { session: false }), upload.single('profile_image_url'), async (req, res, next) => {
  try {
    console.log(req.file.location);
    console.log(req.user);
    await User.findByIdAndUpdate(req.user._id, { profile_image_url: req.file.location });

    return res.json({ result: 'ok' });
  } catch (err) {
    console.log(err);
    return res.json({ uploadError: 'failed' });
  }
  // try {
  //   console.log('file: ',req.file);
  //   const userData = {
  //     ...req.body
  //   };
  //   if (req.file) {
  //     userData.profile_image_url = req.file.location
  //   }
  //   const newUser = new User(userData);
  //   const error = newUser.validateSync();

  //   if (error && error.name === 'ValidationError') {
  //     const errorObj = error.errors.id
  //       || error.errors.password
  //       || error.errors.name
  //       || error.errors.first_meet_day
  //       || error.errors.phone_number;

  //     const errorMessage = errorObj ? errorObj.message : 'some field is not valid';

  //     return res.status(400).json({ validationError: errorMessage });
  //   }

  //   await newUser.save();
  //   res.json({ result: 'ok' });
  // } catch (err) {
  //   next(err);
  // }
});

module.exports = router;
