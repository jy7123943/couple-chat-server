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
        const roomKey = userId + partnerId;

        delete waitingList[userId];
        delete waitingList[partnerId];

        const newRoom = await ChatRoom.create({
          id: roomKey,
          chats: []
        });

        console.log('newRoom', newRoom);

        await User.findOneAndUpdate({ id: userId }, {
          chatroom_id: newRoom._id
        });

        await User.findOneAndUpdate({ id: partnerId }, {
          chatroom_id: newRoom._id
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
      console.log('cancelConnection',waitingList, userId);
    });
  });
};
