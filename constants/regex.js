exports.REGEX_ID = /^[A-za-z0-9]{6,12}$/;
exports.REGEX_PASSWORD = /^.*(?=^.{6,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/;
exports.REGEX_NAME = /^[가-힣a-zA-Z]+$/;
exports.REGEX_PHONE_NUM = /^(?:(010\d{4})|(01[1|6|7|8|9]\d{3,4}))(\d{4})$/;
exports.REGEX_DATE = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;

exports.REQUIRED_ID = 'Id required';
exports.REQUIRED_PASSWORD = 'Password required';
exports.REQUIRED_NAME = 'Name required';
exports.REQUIRED_FIRST_MEET_DAY = 'First meet day required';
exports.REQUIRED_ALL = 'id/name/password/first meet day is all required';
exports.MATCH_PASSWORD = 'Password confirmation does not match';

exports.INVALID_ID = 'Not a valid id';
exports.INVALID_PASSWORD = 'Password required';
exports.INVALID_NAME = 'Not a valid name';
exports.INVALID_PHONE_NUM = 'Not a valid phone number';

exports.DUPLICATE_ID = 'A user already exists with this email';

exports.MIN_NAME_LENGTH = 1;
exports.MAX_NAME_LENGTH = 10;

exports.MAX_PERSONAL_MESSAGE_LENGTH = 50;

exports.INVALID_NAME_LENGTH = 'Name should be between 1 and 10 characters long';
exports.INVALID_IMAGE_TYPE = 'Invalid image type, only jpg, jpeg, png files can be uploaded'

exports.INVALID_PERSONAL_MESSAGE_LENGTH = 'Name should be between 0 and 50 characters long';
