const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');

/* GET users listing. */
router.get('/pushToken', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    console.log(req.user);
    const { pushToken } = req.body;
    const { _id: userId } = req.user;

    await User.findByIdAndUpdate(userId, {
      push_token: pushToken
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
