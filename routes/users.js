const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    const userProfile = await User.findById(userId).populate('partner_id').populate('chatroom_id');

    return res.status(200).json({ userProfile });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.put('/pushToken', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    // console.log(req.user);
    const { pushToken } = req.body;
    // console.log(pushToken, 'pushtoken')
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
