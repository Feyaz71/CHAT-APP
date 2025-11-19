let socket;       // WebSocket connection
let username;     // Current user's name
let room;         // Current chat room name

// 🔁 Load active rooms when the page loads
window.onload = loadRooms;

// ✅ FORCE LOCALHOST (for development only)
const API_BASE = 'http://localhost:8081';
const WS_BASE = 'ws://localhost:8081';

// --- NEW UTILITY FUNCTIONS ---

// 1. 🕒 Formats Unix timestamp to HH:MM AM/PM (WhatsApp Style)
function formatTime(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes} ${ampm}`;
}

// 2. 🔔 Function to display floating notifications
function showFloatingNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    const alertDiv = document.createElement('div');
    
    // Assign classes: 'info' for join/system, 'error' for failure
    alertDiv.classList.add('notification', type); 
    alertDiv.textContent = message;

    container.appendChild(alertDiv);

    // 1. Show the notification (triggers the CSS transition)
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 50);

    // 2. Hide (fade out) and remove after 3 seconds
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-50px)';
        
        // Remove the element from the DOM after the animation completes
        setTimeout(() => {
            if (container.contains(alertDiv)) {
                container.removeChild(alertDiv);
            }
        }, 550); 
    }, 3000); 
}

// --- END UTILITY FUNCTIONS ---


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
    const chatBox = document.getElementById("chatBox");

    if (msg.type === 'error') {
      // Use floating notification for error
      showFloatingNotification(msg.message, 'error');
      socket.close();
      // Give time for notification before reload
      setTimeout(() => location.reload(), 1500); 
      return;
    }

    if (msg.type === 'info') {
      // Use floating notification for join/leave
      showFloatingNotification(msg.message, 'info');
      return; // Do not append to chatBox
    }
    
    if (msg.type === 'message') {
      // 💡 MODIFICATION: Create structured message bubble
      const messageDiv = document.createElement("div");
      // Use "my-message" or "other-message" class for different styling
      messageDiv.classList.add('chat-message', msg.username === username ? 'my-message' : 'other-message');

      // Format time using the new function (msg.timestamp comes from the server)
      const formattedTime = formatTime(msg.timestamp);

      // Construct the message bubble content with timestamp in a small span
      messageDiv.innerHTML = `
        <div class="chat-message-bubble">
            <span class="message-username">${msg.username}</span>
            <div class="message-content">
                <p class="message-text">${msg.message}</p>
                <span class="timestamp-label">${formattedTime}</span>
            </div>
        </div>
      `;
    
      chatBox.appendChild(messageDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  };

  // ❌ WebSocket error
  socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
    showFloatingNotification("Connection error! See console for details.", 'error');
  };

  // 📴 WebSocket closed
  socket.onclose = () => {
    console.warn("⚠️ WebSocket connection closed.");
    showFloatingNotification("Connection lost. Please rejoin.", 'error');
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

// --- EMOJI Functionality (Corrected) ---

/**
 * Focuses the message input to trigger the native emoji picker on the OS/Browser.
 * This is the fixed version to prevent focus issues.
 */
function openEmojiPicker() {
    // CRITICAL FIX: Ensure the correct element is targeted and available.
    if (messageInput) {
        messageInput.focus(); 
    } else {
        // Log an error if the element isn't found to help with debugging.
        console.error("Error: messageInput element not found or initialized.");
    }
}

// --- Event Listener Fix ---

// Ensure the listener is properly attached to the emoji button element.
if (emojiBtn) {
    emojiBtn.addEventListener('click', openEmojiPicker);
}

// Note: You must ensure 'messageInput' and 'emojiBtn' are correctly
// initialized using document.getElementById(...) at the start of your script.

// 🎞️ Placeholder for future GIF support
function sendGif() {
  alert("🎞️ GIF support coming soon!");
}

let isEmojiPanelOpen = false; // State tracker for the panel
let emojiPanel; // Reference to the panel div
let emojiGrid;  // Reference to the grid div

// Array of common emojis
const emojis = [
    '😀', '😂', '🤣', '😊', '🥰', '😍', '🤩', '😘', '😋', '😎',
    '😭', '😢', '🤯', '🥳', '🤔', '🤫', '😶', '😴', '👋', '👍', 
    '👎', '👏', '🙏', '🙌', '💪', '🔥', '💖', '💔', '🍕', '🍔', 
    '🍟', '☕', '🍺', '🎁', '🎂', '🎈', '🎉', '🎃', '🐶', '🐱', 
    '🏡', '🚀', '⭐', '💯', '✅'
];

// 🔁 Load active rooms when the page loads
window.onload = function() {
    // 1. Initialize EMOJI DOM elements
    messageInput = document.getElementById('messageInput');
    emojiBtn = document.getElementById('emojiBtn');
    emojiPanel = document.getElementById('emojiPanel'); // NEW
    emojiGrid = document.getElementById('emojiGrid');   // NEW
    
    // 2. Attach EMOJI listener
    if (emojiBtn) {
        emojiBtn.addEventListener('click', openEmojiPicker);
    }

    // 3. Populate the emoji grid
    populateEmojiPanel();

    // 4. Load rooms (your existing logic)
    loadRooms();
    
    // You should also ensure your other variables (like messageInput) are 
    // initialized here using document.getElementById('messageInput');
};

// --- EMOJI FUNCTIONS ---

// 1. Populates the grid with emoji buttons
function populateEmojiPanel() {
    if (!emojiGrid) return;
    
    emojiGrid.innerHTML = ''; // Clear existing
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji-item';
        span.textContent = emoji;
        // Attach click listener to insert the emoji
        span.addEventListener('click', () => insertEmoji(emoji));
        emojiGrid.appendChild(span);
    });
}

// 2. Toggles the visibility of the panel
function openEmojiPicker() {
    if (!emojiPanel) return;

    isEmojiPanelOpen = !isEmojiPanelOpen;
    emojiPanel.style.display = isEmojiPanelOpen ? 'grid' : 'none';

    // If opening, ensure the input is focused 
    if (isEmojiPanelOpen && messageInput) {
        messageInput.focus();
    }
}

// 3. Inserts the emoji into the message input at the current cursor position
function insertEmoji(emoji) {
    if (!messageInput) return;

    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const value = messageInput.value;

    // Insert the emoji at the cursor position
    messageInput.value = value.substring(0, start) + emoji + value.substring(end);

    // Move the cursor after the inserted emoji
    const newCursorPos = start + emoji.length;
    messageInput.selectionStart = newCursorPos;
    messageInput.selectionEnd = newCursorPos;

    // Keep the input focused for immediate typing
    messageInput.focus();
}

// 🎞️ Placeholder for future GIF support (Updated to use notification instead of alert)
function sendGif() {
    showFloatingNotification("🎞️ GIF support coming soon!", 'info');
}
