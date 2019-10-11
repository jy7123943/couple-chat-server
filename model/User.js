const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const regex = require('../constants/regex');

const userSchema = new Schema({
  id: {
    type: String,
    trim: true,
    required: [true, regex.REQUIRED_ID],
    match: [regex.REGEX_ID, regex.INVALID_ID]
  },
  password: {
    type: String,
    trim: true,
    required: [true, regex.REQUIRED_PASSWORD]
  },
  name: {
    type: String,
    trim: true,
    required: [true, regex.REQUIRED_NAME],
    min: 1,
    max: 10,
    match: [regex.REGEX_NAME, regex.INVALID_NAME]
  },
  birthday: {
    type: Date
  },
  first_meet_day: {
    type: Date,
    required: [true, regex.REQUIRED_FIRST_MEET_DAY]
  },
  phone_number: {
    type: Number,
    match: [regex.REGEX_PHONE_NUM, regex.INVALID_PHONE_NUM]
  },
  profile_image_url: {
    type: String
  },
  partner_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  personal_message: {
    type: String,
    min: 0,
    max: 50
  },
  chatroom_id: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom'
  }
});

userSchema.pre('save', function (next) {
  try {
    const SALT_ROUNDS = 10;
    const hash = bcrypt.hashSync(this.password, SALT_ROUNDS);

    this.password = hash;
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
