const express = require('express');
const router = express.Router();
const User = require('../model/User');
const { upload, convertFormData } = require('./middleware/image_upload');
const { validateUser } = require('./middleware/validation');

router.post('/signUp', convertFormData.single(), validateUser, upload.single('profile_image_url'), async (req, res, next) => {
  try {
    console.log('body: ', req.body);
    console.log('file: ',req.file);
    const userData = {
      ...req.body
    };
    if (req.file) {
      userData.profile_image_url = req.file.location
    }
    const newUser = new User(userData);
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

module.exports = router;
