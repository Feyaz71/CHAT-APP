let socket;       // to hold our socket connection
let username;     // username of user
let room;         // room name user joins

// 📌 As soon as page load, we load existing rooms
window.onload = loadRooms;

// 🔁 This function gets the list of active chat rooms from backend
function loadRooms() {
  fetch("/rooms") // request sent to backend
    .then(res => res.json()) // convert response to json
    .then(data => {
      const dropdown = document.getElementById("roomDropdown");
      dropdown.innerHTML = '<option value="">-- Select existing room --</option>'; // default text

      // if no room exist
      if (data.rooms.length === 0) {
        const emptyOption = document.createElement("option");
        emptyOption.textContent = "No active rooms yet";
        emptyOption.disabled = true;
        dropdown.appendChild(emptyOption);
      }

      // add all rooms in dropdown list
      data.rooms.forEach(room => {
        const option = document.createElement("option");
        option.value = room;
        option.textContent = room;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("Could not fetch rooms", err));
}

// 🧠 When user clicks "Join" btn
function joinChat() {
  // get user input and remove extra space
  username = document.getElementById('username').value.trim();
  const dropdownRoom = document.getElementById('roomDropdown').value;
  const manualRoom = document.getElementById('room').value.trim();

  // pick room either selected or typed
  room = dropdownRoom || manualRoom;

  // if user forgets to enter anything
  if (!username || !room) {
    alert("Please enter username and room.");
    return;
  }

  // hide login screen & show chat page
  document.querySelector('.main-wrapper').style.display = 'none';
  document.getElementById('chatPage').style.display = 'block';
  document.getElementById('roomName').textContent = room;

  // open a WebSocket connection
  socket = new WebSocket(`wss://${window.location.host}`);


  // 🔗 When socket connects
  socket.onopen = () => {
    // send user info to server
    socket.send(JSON.stringify({ type: 'join', username, room }));
    setTimeout(loadRooms, 500); // update room list
  };

  // 📥 Handle incoming messages
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data); // convert incoming JSON
    const messageElement = document.createElement("div");

    // if error (like same username)
    if (msg.type === 'error') {
      alert(msg.message);
      socket.close();     // close connection
      location.reload();  // refresh page
      return;
    }

    // actual user message
    if (msg.type === 'message') {
      messageElement.innerText = `${msg.username} (${msg.time}): ${msg.message}`;
    } 
    // system message like user joined
    else if (msg.type === 'info') {
      messageElement.innerText = msg.message;
      messageElement.style.fontStyle = "italic";
    }

    // add msg to chat box
    const chatBox = document.getElementById("chatBox");
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // auto scroll down
  };

  // error while connecting
  socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
  };

  // if user gets disconnected
  socket.onclose = () => {
    console.warn("⚠️ WebSocket connection closed.");
  };
}

// 📨 Send message to server
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (message && socket) {
    socket.send(JSON.stringify({ type: 'message', message }));
    input.value = ''; // clear input
  }
}

// ⌨️ Allow enter key to send message
function handleKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}

// 😊 Emoji button (not done yet)
function openEmojiPicker() {
  alert("😊 Emoji picker coming soon!");
}

// 🎞️ GIF button (not done yet)
function sendGif() {
  alert("🎞️ GIF support coming soon!");
}
