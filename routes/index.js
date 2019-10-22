const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const { upload, deleteImage } = require('./middleware/image_upload');
const { validateUser, validateProfile } = require('./middleware/validation');

router.post('/signUp',
  validateUser,
  async (req, res, next) => {
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
  async (req, res) => {
    try {
      if (!req.user) {
        throw res.status(401).json({ Error: 'login failed' });
      }

      const token = jwt.sign(req.user.id, process.env.JWT_SECRET_KEY);

      if (req.user.chatroom_id) {
        const room = await ChatRoom.findById(req.user.chatroom_id);
        const partner = await User.findById(req.user.partner_id);
        const roomInfo = {
          roomKey: room.id,
          partnerId: partner.id
        };

        return res.json({
          result: "ok",
          token,
          userId: req.user.id,
          roomInfo
        });
      }
      return res.json({
        result: "ok",
        token,
        userId: req.user.id
      });
    } catch (err) {
      console.log(err);
    }
});

router.post('/profileImage',
  passport.authenticate('jwt', { session: false }),
  upload.single('profile_image_url'),
  async (req, res) => {
    try {
      console.log(req.file.location);
      await User.findByIdAndUpdate(req.user._id, { profile_image_url: req.file.location });

      return res.json({ result: 'ok' });
    } catch (err) {
      console.log(err);
      return res.json({ uploadError: 'failed' });
    }
});

router.put('/profileImage',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { profile_image_url: profileImageUrl } = req.user;

    if (profileImageUrl) {
      const index = profileImageUrl.indexOf('com/');
      const key = profileImageUrl.slice(index + 4);

      console.log(key);
      return deleteImage(key, next);
    }
    next();
  },
  upload.single('profile_image_url'),
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.user._id, { profile_image_url: req.file.location });

      return res.json({
        result: 'ok',
        profileImageUrl: req.file.location
      });
    } catch (err) {
      console.log(err);
      return res.json({ uploadError: 'failed' });
    }
});

router.put('/profile',
  passport.authenticate('jwt', { session: false }),
  validateProfile,
  async (req, res) => {
    try {
      const { _id: userId } = req.user;

      await User.findByIdAndUpdate(userId, req.body);

      return res.json({ result: 'ok' });
    } catch (err) {
      if (err && err.name === 'ValidationError') {
        const errorObj = err.errors.personal_message
          || err.errors.name
          || err.errors.phone_number;

        const errorMessage = errorObj ? errorObj.message : 'some field is not valid';

        return res.status(400).json({ validationError: errorMessage });
      }

      return res.json({ uploadError: 'failed '});
    }
});

module.exports = router;
