const express = require('express');
// Importuje funkci pro vytvoření HTTP serveru z Node.js
const { createServer } = require('node:http');
const { join } = require('node:path');
// Importuje knihovnu socket.io pro real-time komunikaci
const { Server } = require('socket.io');
// Vytvoří instanci Express aplikace
const app = express();
// Vytvoří HTTP server pomocí Express aplikace
const server = createServer(app);

// Vytvoří instanci Socket.IO serveru připojenou k HTTP serveru
const io = new Server(server);
const port = 3000;

// Nastaví statickou složku pro Express aplikaci
app.use(express.static(join(__dirname, 'static')))

// URL adresy
app.get('/form', (req, res) => {
  res.sendFile(join(__dirname, 'static', 'index.html'));
});

app.get('/:roomId', (req, res) => {
  res.sendFile(join(__dirname, 'static', 'room.html'));
});

let rooms = {};

//připojení nového uživatele
io.on('connection', (socket) => {
  console.log(`${socket.id} user connected`);
  
   // Nastaví událost pro odpojení uživatele
  socket.on('disconnect', () => {
    console.log(`${socket.id} user disconnected`);
  });
   // vytvoření nové místnosti
  socket.on('createRoom', (response) => {
    const roomId = generateRoomId();  // Vygeneruje unikátní ID pro místnost
    rooms[roomId] = {
      players: [socket.id],     // Přidá aktuálního uživatele jako prvního hráče
      playerNames: {
        white: socket.id,    
        black: 'Waiting...'
      }
    };
    socket.join(roomId);         // Připojí uživatele k místnosti
    response({        // Vrátí ID místnosti klientovi
      roomId
    });
  });
  // Nastaví událost pro připojení k existující místnosti
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

  / Nastaví událost pro získání jmen hráčů
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

// Funkce co generuje unikátní ID místnosti
function generateRoomId() {
  return Math.random().toString(36).substr(2, 9);
}
