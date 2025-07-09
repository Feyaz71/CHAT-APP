// 🔹 importing required modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());

// 🔹 Serve static files from 'client' folder
app.use(express.static(path.join(__dirname, '../client')));

// 🔹 Root route for testing
app.get('/', (req, res) => {
  res.send('✅ WebSocket + Express server is running!');
});

// 🔹 create 2 things for managing chat:
let users = new Map(); // Map<socket, {username, room}>
let rooms = {};        // { roomName: [socket] }

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'join') {
      const { username, room } = msg;

      const duplicate = rooms[room]?.some(s => users.get(s)?.username === username);
      if (duplicate) {
        socket.send(JSON.stringify({
          type: 'error',
          message: `Username "${username}" is already taken in room "${room}".`
        }));
        socket.close();
        return;
      }

      users.set(socket, { username, room });

      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(socket);

      rooms[room].forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify({
            type: 'info',
            message: `${username} joined ${room}`
          }));
        }
      });
    }

    if (msg.type === 'message') {
      const user = users.get(socket);
      if (!user) return;

      const { username, room } = user;
      const time = new Date().toLocaleTimeString();

      rooms[room].forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify({
            type: 'message',
            username,
            message: msg.message,
            time
          }));
        }
      });
    }
  });

  socket.on('close', () => {
    const user = users.get(socket);
    if (user) {
      const { username, room } = user;
      users.delete(socket);

      if (rooms[room]) {
        rooms[room] = rooms[room].filter(s => s !== socket);

        rooms[room].forEach(s => {
          if (s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify({
              type: 'info',
              message: `${username} left the chat`
            }));
          }
        });

        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

// 🔹 Endpoint to return all room names
app.get('/rooms', (req, res) => {
  res.json({ rooms: Object.keys(rooms) });
});

// 🔹 start server — use environment PORT or fallback to 8081
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
