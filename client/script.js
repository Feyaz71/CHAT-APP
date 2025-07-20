let socket;       // WebSocket connection
let username;     // Current user's name
let room;         // Current chat room name

// 🔁 Load active rooms when the page loads
window.onload = loadRooms;

// ✅ FORCE LOCALHOST (for development only)
const API_BASE = 'http://localhost:8081';
const WS_BASE = 'ws://localhost:8081';

// 📥 Fetch active rooms from the backend
function loadRooms() {
  fetch(`${API_BASE}/rooms`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("roomDropdown");
      dropdown.innerHTML = '<option value="">-- Select existing room --</option>';

      if (data.rooms.length === 0) {
        const noRoom = document.createElement("option");
        noRoom.textContent = "No active rooms yet";
        noRoom.disabled = true;
        dropdown.appendChild(noRoom);
      }

      data.rooms.forEach(room => {
        const option = document.createElement("option");
        option.value = room;
        option.textContent = room;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Could not fetch rooms:", err));
}

// 🧠 Handle user clicking "Join Chat"
function joinChat() {
  username = document.getElementById('username').value.trim();
  const dropdownRoom = document.getElementById('roomDropdown').value;
  const manualRoom = document.getElementById('room').value.trim();
  room = dropdownRoom || manualRoom;

  if (!username || !room) {
    alert("⚠️ Please enter both username and room.");
    return;
  }

  // 🔀 Switch to chat interface
  document.querySelector('.main-wrapper').style.display = 'none';
  document.getElementById('chatPage').style.display = 'block';
  document.getElementById('roomName').textContent = room;

  // 🌐 Establish WebSocket connection
  socket = new WebSocket(WS_BASE);

  // ✅ Once connected, join the room
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join', username, room }));
    setTimeout(loadRooms, 500); // Refresh room list
  };

  // 📩 Handle incoming messages
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const messageElement = document.createElement("div");

    if (msg.type === 'error') {
      alert(msg.message);
      socket.close();
      location.reload();
      return;
    }

    if (msg.type === 'message') {
      messageElement.textContent = `${msg.username} (${msg.time}): ${msg.message}`;
    } else if (msg.type === 'info') {
      messageElement.textContent = msg.message;
      messageElement.style.fontStyle = "italic";
    }

    const chatBox = document.getElementById("chatBox");
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  // ❌ WebSocket error
  socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
  };

  // 📴 WebSocket closed
  socket.onclose = () => {
    console.warn("⚠️ WebSocket connection closed.");
  };
}

// 📤 Send message to server
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (message && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'message', message }));
    input.value = '';
  }
}

// ⏎ Send message on pressing Enter
function handleKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}

// 😊 Placeholder for future emoji support
function openEmojiPicker() {
  alert("😊 Emoji picker coming soon!");
}

// 🎞️ Placeholder for future GIF support
function sendGif() {
  alert("🎞️ GIF support coming soon!");
}
