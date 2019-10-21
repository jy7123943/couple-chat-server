const User = require('../../model/User');
const regex = require('../../constants/regex');

exports.validateUser = async (req, res, next) => {
  try {
    const {
      id,
      name,
      password,
      password_confirm: passwordConfirm,
      first_meet_day: firstMeetDay,
      phone_number: phoneNumber
    } = req.body;
    console.log(req.body);

    if (!id || !id.trim()) {
      return res.status(400).json({ validationError: regex.REQUIRED_ID });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ validationError: regex.REQUIRED_NAME });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ validationError: regex.REQUIRED_PASSWORD });
    }

    if (!firstMeetDay || !firstMeetDay.trim()) {
      return res.status(400).json({ validationError: regex.REQUIRED_FIRST_MEET_DAY });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ validationError: regex.MATCH_PASSWORD });
    }

    if (!regex.REGEX_ID.test(id)) {
      return res.status(400).json({ validationError: regex.INVALID_ID });
    }

    if (!regex.REGEX_NAME.test(name)) {
      return res.status(400).json({ validationError: regex.INVALID_NAME });
    }

    if (!regex.REGEX_PASSWORD.test(password)) {
      return res.status(400).json({ validationError: regex.INVALID_PASSWORD });
    }

    if (phoneNumber && !regex.REGEX_PHONE_NUM.test(phoneNumber)) {
      return res.status(400).json({ validationError: regex.INVALID_PHONE_NUM });
    }

    if (name.trim().length < regex.MIN_NAME_LENGTH || name.trim().length > regex.MAX_NAME_LENGTH) {
      return res.status(400).json({ validationError: regex.INVALID_NAME_LENGTH });
    }

    const user = await User.findOne({ id: req.body.id });

    if (user) {
      return res.status(400).json({ validationError: regex.DUPLICATE_ID });
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateProfile = (req, res, next) => {
  try {
    const {
      name,
      phone_number: phoneNumber,
      personal_message: personalMessage
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ validationError: regex.REQUIRED_NAME });
    }

    if (name.trim().length < regex.MIN_NAME_LENGTH || name.trim().length > regex.MAX_NAME_LENGTH) {
      return res.status(400).json({ validationError: regex.INVALID_NAME_LENGTH });
    }

    if (phoneNumber && !regex.REGEX_PHONE_NUM.test(phoneNumber)) {
      return res.status(400).json({ validationError: regex.INVALID_PHONE_NUM });
    }

    if (personalMessage && personalMessage.trim().length > regex.MAX_PERSONAL_MESSAGE_LENGTH) {
      return res.status(400).json({ validationError: regex.INVALID_PERSONAL_MESSAGE_LENGTH });
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};
