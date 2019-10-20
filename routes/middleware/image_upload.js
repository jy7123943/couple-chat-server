const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const s3 = new aws.S3();
const regex = require('../../constants/regex');

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region : 'ap-northeast-2'
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/png") {
    return cb(null, true);
  }
  cb(new Error(regex.INVALID_IMAGE_TYPE), false);
};

exports.convertFormData = multer();

exports.upload = multer({
  fileFilter: fileFilter,
  storage: multerS3({
    s3: s3,
    bucket: 'couple-chat/user-profile',
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.deleteImage = (key, next) => {
  s3.deleteObject({
    Bucket: 'couple-chat',
    Key: key
  }, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
}
