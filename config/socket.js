const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const waitingList = {};
const userSocketList = {};

module.exports = (io) => {
  io.on('connection', socket => {
    console.log('socket connected', socket.id);

    /** COUPLE CONNECT */
    socket.on('requestConnection', async (userId, partnerId) => {
      userSocketList[userId] = socket;
      console.log('requestConnection', userId, partnerId);

      try {
        const partnerDbInfo = await User.findOne({ id: partnerId });

        if (!partnerDbInfo) {
          return io.to(socket.id).emit('partnerNotMatched', {
            failed: '상대방의 정보가 없습니다. 가입한 사용자들만 연결이 가능합니다'
          });
        }
        const partnerDbId = partnerDbInfo._id.toString();
        console.log(userId, partnerDbId);

        if (partnerDbId === userId) {
          delete userSocketList[userId];

          return io.to(socket.id).emit('partnerNotMatched', {
            failed: '본인 아이디는 연결 불가능합니다'
          });
        }

        if (partnerDbInfo.partner_id) {
          delete userSocketList[userId];

          return io.to(socket.id).emit('partnerNotMatched', {
            failed: '상대방이 이미 다른 사용자와 연결중입니다'
          });
        }

        if (!waitingList[partnerDbId]) {
          if (Object.values(waitingList).includes(userId)) {
            return io.to(socket.id).emit('partnerNotMatched');
          }

          waitingList[userId] = partnerDbId;
          return io.to(socket.id).emit('waitingPartner');
        }

        if (waitingList[partnerDbId] !== userId) {
          const partnerSocket = userSocketList[partnerDbId];

          if (partnerSocket) {
            io.to(partnerSocket.id).emit('partnerNotMatched');
          }

          io.to(socket.id).emit('partnerNotMatched');

          delete waitingList[userId];
          delete waitingList[partnerDbId];
          return;
        }

        const partnerSocket = userSocketList[partnerDbId];
        const roomKey = userId + partnerDbId;

        delete waitingList[userId];
        delete waitingList[partnerDbId];
        delete userSocketList[userId];

        const newRoom = await ChatRoom.create({
          id: roomKey,
          chats: []
        });

        console.log('newRoom', newRoom);

        await User.findByIdAndUpdate(userId, {
          chatroom_id: newRoom._id,
          partner_id: partnerDbId
        });

        await User.findByIdAndUpdate(partnerDbId, {
          chatroom_id: newRoom._id,
          partner_id: userId
        });

        io.to(socket.id).emit('completeConnection', {
          roomKey,
          partnerDbId
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
      console.log('cancelConnection',waitingList, userId);
    });
  });
};
