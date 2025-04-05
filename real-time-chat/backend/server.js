require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const users = {}; // Store connected users

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Store username and socket ID
  socket.on('registerUser', (username) => {
    users[socket.id] = username;
    io.emit('usersList', users); // Send updated users list
  });

  // Handle chat messages
  socket.on('sendMessage', ({ username, message }) => {
    io.emit('receiveMessage', { username, message });
  });

  // Handle video call requests
  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('incomingCall', { signal: data.signalData, from: data.from });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
    io.emit('usersList', users); // Send updated users list
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
