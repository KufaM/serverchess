const express = require('express');
const {
  createServer
} = require('node:http');
const {
  join
} = require('node:path');
const {
  Server
} = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 3000;

app.use(express.static(join(__dirname, 'static')))

// URL adresy
app.get('/form', (req, res) => {
  res.sendFile(join(__dirname, 'static', 'index.html'));
});

app.get('/:roomId', (req, res) => {
  res.sendFile(join(__dirname, 'static', 'room.html'));
});

let rooms = {};

io.on('connection', (socket) => {
  console.log(`${socket.id} user connected`);
  socket.on('disconnect', () => {
    console.log(`${socket.id} user disconnected`);
  });
  socket.on('createRoom', (response) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      players: [socket.id],
      playerNames: {
        white: socket.id,
        black: 'Waiting...'
      }
    };
    socket.join(roomId);
    response({
      roomId
    });
  });

  socket.on('joinRoom', (roomId, response) => {
    if (rooms[roomId] && rooms[roomId].players.length < 2) {
      rooms[roomId].players.push(socket.id);
      rooms[roomId].playerNames.black = socket.id;
      socket.join(roomId);
      response({
        success: true
      });
    } else {
      response({
        success: false,
        message: 'Room is full or does not exist.'
      });
    }
  });
  socket.on('player_names', (roomId, playerId, response) => {
    console.log('player names triggered');
    io.to(roomId).emit('new_player_names', {
      white: rooms[roomId].playerNames.white,
      black: rooms[roomId].playerNames.black
    });
    response({
      white: rooms[roomId].playerNames.white,
      black: rooms[roomId].playerNames.black
    });
  });
});

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});

function generateRoomId() {
  return Math.random().toString(36).substr(2, 9);
}