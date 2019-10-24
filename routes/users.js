const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');

router.get('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { _id: userId } = req.user;

      const userProfile = await User.findById(userId).populate('partner_id');

      return res.status(200).json({ userProfile });
    } catch (err) {
      console.log(err);
      next(err);
    }
});

router.get('/room',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate('partner_id');

      if (user.chatroom_id) {
        const room = await ChatRoom.findById(user.chatroom_id);
        const roomInfo = {
          roomKey: room.id,
          partnerId: user.partner_id.id
        };
        return res.json({ result: 'ok', roomInfo });
      }

      return res.json({ result: 'not found' });
    } catch (err) {
      console.log(err);
      next(err);
    }
});

router.put('/pushToken',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { pushToken } = req.body;
      const { _id: userId } = req.user;

      await User.findByIdAndUpdate(userId, {
        push_token: pushToken
      });

      res.json({ result : 'ok' });
    } catch (err) {
      console.log(err);
      next(err);
    }
});

module.exports = router;
