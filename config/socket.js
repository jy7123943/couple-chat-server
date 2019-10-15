const { Expo } = require('expo-server-sdk');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const waitingList = {};
const userSocketList = {};
const expo = new Expo();

module.exports = (io) => {
  io.on('connection', async (socket) => {
    console.log('socket connected', socket.id);

    /** COUPLE CONNECT */
    socket.on('requestConnection', async (userId, partnerId) => {
      userSocketList[userId] = socket;
      console.log('requestConnection', userId, partnerId);

      try {
        const userDbInfo = await User.findOne({ id: userId });
        const partnerDbInfo = await User.findOne({ id: partnerId });

        if (!userDbInfo) {
          delete userSocketList[userId];
          return io.to(socket.id).emit('partnerNotMatched', {
            failed: 'unAuthorized'
          });
        }

        if (!partnerDbInfo) {
          return io.to(socket.id).emit('partnerNotMatched', {
            failed: '상대방의 정보가 없습니다. 가입한 사용자들만 연결이 가능합니다'
          });
        }

        const userDbId = userDbInfo._id.toString();
        const partnerDbId = partnerDbInfo._id.toString();
        console.log(userDbId, partnerDbId);

        if (partnerDbId === userDbId) {
          return io.to(socket.id).emit('partnerNotMatched', {
            failed: '본인 아이디는 연결 불가능합니다'
          });
        }

        if (partnerDbInfo.partner_id) {
          console.log(partnerDbInfo.partner_id, '다른 사용자')
          return io.to(socket.id).emit('partnerNotMatched', {
            failed: '상대방이 이미 다른 사용자와 연결중입니다'
          });
        }

        if (!waitingList[partnerId]) {
          if (Object.values(waitingList).includes(userId)) {
            return io.to(socket.id).emit('partnerNotMatched');
          }

          waitingList[userId] = partnerId;
          return io.to(socket.id).emit('waitingPartner');
        }

        if (waitingList[partnerId] !== userId) {
          const partnerSocket = userSocketList[partnerId];

          if (partnerSocket) {
            io.to(partnerSocket.id).emit('partnerNotMatched');
          }

          io.to(socket.id).emit('partnerNotMatched');

          delete waitingList[userId];
          delete waitingList[partnerId];
          return;
        }

        const partnerSocket = userSocketList[partnerId];
        const roomKey = userDbId.slice(0, 5) + partnerDbId.slice(0, 5);

        delete waitingList[userId];
        delete waitingList[partnerId];
        delete userSocketList[userId];

        const newRoom = await ChatRoom.create({
          id: roomKey,
          chats: []
        });

        console.log('newRoom', newRoom);

        await User.findByIdAndUpdate(userDbId, {
          chatroom_id: newRoom._id,
          partner_id: partnerDbId
        });

        await User.findByIdAndUpdate(partnerDbId, {
          chatroom_id: newRoom._id,
          partner_id: userDbId
        });

        io.to(socket.id).emit('completeConnection', {
          roomKey,
          partnerId
        });

        io.to(partnerSocket.id).emit('completeConnection', {
          roomKey,
          partnerId: userId
        });
      } catch (err) {
        console.log(err);
        next(err);
      }
    });

    socket.on('cancelConnection', userId => {
      delete userSocketList[userId];
      delete waitingList[userId];
      delete userSocketList[userId];
      console.log('cancelConnection',waitingList, userId);
    });

    /** CHATTING */
    socket.on('startChatApp', async (userId, roomKey) => {
      userSocketList[userId] = socket;
      socket.join(roomKey);
    });

    socket.on('sendMessage', async ({ roomKey, userId, text, time }) => {
      try {
        const user = await User.findOne({ id: userId })
          .populate('partner_id')
          .exec((err, user) => {
            if (err) {
              return console.log(err);
            }

            console.log(user.partner_id);
            if (!userSocketList[user.partner_id.id]) {
              // 상대방이 소켓 연결을 끊음 (즉, 앱을 나간 상태)
            }
          });

        io.sockets.in(roomKey).emit('sendTextMessage', {
          chat: newChat
        });

        const newChat = {
          user_id: user._id,
          created_at: time,
          text
        };

        await ChatRoom.findByIdAndUpdate(roomKey, {
          '$push': { 'chats': newChat }
        });
      } catch (err) {

      }
    });
  });
};
