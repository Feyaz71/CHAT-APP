// 🔹 importing required modules
const express = require('express');         // for running express web server
const http = require('http');               // to create basic http server
const WebSocket = require('ws');            // WebSocket for real-time chats
const cors = require('cors');               // to allow requests from frontend

const app = express();                      // initialize express app
const server = http.createServer(app);      // create a server using express
const wss = new WebSocket.Server({ server }); // create websocket server

app.use(cors()); // use CORS so frontend can call backend

// 🔹 create 2 things for managing chat:
// 1. users map to store socket with username and room
let users = new Map(); // Map<socket, {username, room}>
// 2. rooms object where each room has array of sockets
let rooms = {};        // { roomName: [socket] }

// when a user connects to websocket
wss.on('connection', (socket) => {

  // when server receives a msg from that socket
  socket.on('message', (data) => {
    const msg = JSON.parse(data); // convert string to object

    if (msg.type === 'join') {
      const { username, room } = msg;

      // 🔹 Check if same username already exist in that room
      const duplicate = rooms[room]?.some(s => users.get(s)?.username === username);
      if (duplicate) {
        socket.send(JSON.stringify({
          type: 'error',
          message: `Username "${username}" is already taken in room "${room}".`
        }));
        socket.close(); // disconnect that person
        return;
      }

      // store user info in users map
      users.set(socket, { username, room });

      // create room if not there already
      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(socket); // add user socket to room

      // broadcast to others that someone joined
      rooms[room].forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify({
            type: 'info',
            message: `${username} joined ${room}`
          }));
        }
      });
    }

    // 🔹 If it's a chat message
    if (msg.type === 'message') {
      const user = users.get(socket);
      if (!user) return;

      const { username, room } = user;
      const time = new Date().toLocaleTimeString(); // get time

      // send message to all users in same room
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

  // 🔹 if user closes socket (disconnects)
  socket.on('close', () => {
    const user = users.get(socket);
    if (user) {
      const { username, room } = user;
      users.delete(socket); // remove user

      if (rooms[room]) {
        // remove socket from room array
        rooms[room] = rooms[room].filter(s => s !== socket);

        // tell others someone left
        rooms[room].forEach(s => {
          if (s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify({
              type: 'info',
              message: `${username} left the chat`
            }));
          }
        });

        // if room empty then delete room
        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

// 🔹 Endpoint to return all room names
app.get('/rooms', (req, res) => {
  res.json({ rooms: Object.keys(rooms) }); // return array of room names
});

// 🔹 start the server on port 8081
server.listen(8081, () => {
  console.log('✅ WebSocket + Express server running on http://localhost:8081');
});
