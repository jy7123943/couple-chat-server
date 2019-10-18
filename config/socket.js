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

        console.log('waiting list: =====', waitingList);

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
          partner_id: partnerDbInfo._id
        });

        await User.findByIdAndUpdate(partnerDbId, {
          chatroom_id: newRoom._id,
          partner_id: userDbInfo._id
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
      console.log('cancelConnection');
    });

    /** CHATTING */
    socket.on('joinRoom', (roomKey) => {
      console.log('join Room', roomKey);
      socket.join(roomKey);
      // socket.leave(socket.id);

      const userRoomLength = socket.adapter.rooms[roomKey].length;
      console.log('user Room length' ,)
      if (userRoomLength > 1) {
        socket.broadcast.to(roomKey).emit('partnerConnect');
      }

      console.log(socket.adapter.rooms[roomKey]);
      console.log('room status when join',socket.adapter.rooms);
    });

    socket.on('sendMessage', async ({ roomKey, userId, text, time }) => {
      try {
        socket.join(roomKey);
        io.to(roomKey).emit('sendMessage', {
          chat: { userId, text, time }
        });

        const user = await User.findOne({ id: userId }).populate('partner_id');

        const userRoomLength = socket.adapter.rooms[roomKey].length;
        console.log('ROOM LENGTH', userRoomLength)

        if (userRoomLength < 2) {
          const messages = [];

          const pushToken = user.partner_id.push_token;
          if (!Expo.isExpoPushToken(pushToken)) {
            console.log('pushToken is not valid');
            throw new Error('invalid push token');
          }

          messages.push({
            'to': pushToken,
            // 'title': 'couple chat app',
            'priority': 'high',
            'body': text,
            'sound': 'default',
            'channelId': 'chat-messages',
          });

          let chunks = expo.chunkPushNotifications(messages);

          let tickets = [];
          (async () => {
            for (let chunk of chunks) {
              try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
              } catch (error) {
                console.error(error);
              }
            }
          })();
        }

        const newChat = {
          user_id: user.id,
          created_at: time,
          text
        };

        await ChatRoom.findByIdAndUpdate(user.chatroom_id, {
          '$push': { 'chats': newChat }
        });
      } catch (err) {
        socket.emit('error');
      }
    });

    socket.on('leaveRoom', (roomKey) => {
      console.log('leaveRoom', roomKey);
      socket.broadcast.to(roomKey).emit('partnerDisconnect');
      socket.leave(roomKey);
      console.log('room status when leave',socket.adapter.rooms);
    });

    socket.on('disconnect', (reason) => {
      console.log('disconnected', socket.id, reason);
      console.log('room!!!',socket.adapter.rooms);
    });

    socket.on('error', (err) => {
      socket.emit('error', err);
    })
  });
};
