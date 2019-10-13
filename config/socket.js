const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const waitingList = {};
const userSocketList = {};

module.exports = (io) => {
  io.on('connection', socket => {
    console.log('socket connected', socket.id);
    socket.on('hello', () => {
      console.log('hello!!')
    });

    /** COUPLE CONNECT */
    socket.on('requestConnect', async (userId, partnerId) => {
      userSocketList[userId] = socket;

      if (waitingList[userId]) {
        if (waitingList[userId] !== partnerId) {
          const partnerSocketId = userSocketList[partnerId].id;

          io.to(partnerSocketId.id).emit('partnerNotMatched');
          io.to(socket.id).emit('partnerNotMatched');
          return;
        }

        // matched
        const partnerSocket = userSocketList[partnerId];

        const roomKey = userId + partnerId;
        socket.join(roomKey);
        partnerSocket.join(roomKey);

        delete waitingList[userId];
        delete waitingList[partnerId];

        const newRoom = await ChatRoom.create({
          id: roomKey,
          chats: []
        });

        const partnerDbId = await User.findOne({ id: partnerId })._id;
        const userDbId = await User.findOne({ id: userId })._id;

        await User.findOneAndUpdate({ id: userId }, {
          partner_id: partnerDbId,
          chatroom_id: newRoom._id
        });

        await User.findOneAndUpdate({ id: partnerId }, {
          partner_id: userDbId,
          chatroom_id: newRoom._id
        });

        return io.sockets.in(roomKey).emit('completeConnection', roomKey);
      }

      // waiting partner
      waitingList[partnerId] = userId;
      return io.to(socket.id).emit('waitingPartner');
    });
  });
};
