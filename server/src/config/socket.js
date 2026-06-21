const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room for specific order updates
    socket.on('join_order_room', (orderId) => {
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave_order_room', (orderId) => {
      const room = `order_${orderId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

// Helper function to emit order updates to a specific room
const emitOrderStatusUpdate = (orderId, data) => {
  if (io) {
    const room = `order_${orderId}`;
    io.to(room).emit('order_status_updated', data);
    console.log(`WebSocket: Emitted status update to room ${room}`, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitOrderStatusUpdate
};
