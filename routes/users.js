const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');

/* GET users listing. */
router.put('/pushToken', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    console.log(req.user);
    const { pushToken } = req.body;
    console.log(pushToken, 'pushtoken')
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
