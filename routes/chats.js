const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const chatRoom = await ChatRoom.findById(req.user.chatroom_id);

    return res.json({ chats: chatRoom.chats });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
