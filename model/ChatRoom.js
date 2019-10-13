const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  image_url: {
    type: String
  }
});

const chatRoomSchema = new Schema({
  id: {
    type: String,
    trim: true,
    required: true
  },
  chats: {
    type: [chatSchema]
  }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
