let socket;       // WebSocket connection
let username;     // Current user's name
let room;         // Current chat room name
let messageInput;
let emojiBtn;
let emojiPanel; 
let emojiGrid;  
let isEmojiPanelOpen = false; 

// Array of common emojis
const emojis = [
    '😀', '😂', '🤣', '😊', '🥰', '😍', '🤩', '😘', '😋', '😎',
    '😭', '😢', '🤯', '🥳', '🤔', '🤫', '😶', '😴', '👋', '👍', 
    '👎', '👏', '🙏', '🙌', '💪', '🔥', '💖', '💔', '🍕', '🍔', 
    '🍟', '☕', '🍺', '🎁', '🎂', '🎈', '🎉', '🎃', '🐶', '🐱', 
    '🏡', '🚀', '⭐', '💯', '✅'
];


// 💥💥💥 CRITICAL FIX: DYNAMIC CONNECTION SETUP 💥💥💥
// This dynamically determines the host and protocol based on where the page is loaded.
const host = window.location.host; 
const protocol = window.location.protocol; 

// For REST (API) calls (like fetching /rooms), use the same protocol/host as the page.
const API_BASE = `${protocol}//${host}`; 

// For WebSocket (WS) connection: use 'wss:' if the site is HTTPS (like on Render), otherwise 'ws:'.
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
const WS_BASE = `${wsProtocol}//${host}`; 
// 💥💥💥 END CRITICAL FIX 💥💥💥


// --- UTILITY FUNCTIONS ---

// 1. 🕒 Formats Unix timestamp to HH:MM AM/PM
function formatTime(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes} ${ampm}`;
}

// 2. 🔔 Function to display floating notifications (Used instead of alert())
function showFloatingNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    // DEFENSIVE CHECK: If the container is null, log and stop.
    if (!container) {
        console.error("Notification container not found. Cannot show:", message);
        return;
    }

    const alertDiv = document.createElement('div');
    
    alertDiv.classList.add('notification', type); 
    alertDiv.textContent = message;

    container.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 50);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (container.contains(alertDiv)) {
                container.removeChild(alertDiv);
            }
        }, 550); 
    }, 3000); 
}

// 3. Appends a message to the chat box
function appendMessage(sender, content, isMine, timestamp) {
    const chatBox = document.getElementById("chatBox");
    // Defensive check for the chat container
    if (!chatBox) {
        console.error("Chat box element 'chatBox' not found. Message lost:", content);
        return;
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add('chat-message', isMine ? 'my-message' : 'other-message');

    const formattedTime = formatTime(timestamp);

    messageDiv.innerHTML = `
        <div class="chat-message-bubble">
            <span class="message-username">${sender || 'System'}</span>
            <div class="message-content">
                <p class="message-text">${content || 'Empty Message'}</p>
                <span class="timestamp-label">${formattedTime}</span>
            </div>
        </div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- EMOJI FUNCTIONS ---

// 1. Populates the grid with emoji buttons
function populateEmojiPanel() {
    if (!emojiGrid) return;
    
    emojiGrid.innerHTML = ''; 
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji-item';
        span.textContent = emoji;
        span.addEventListener('click', () => insertEmoji(emoji));
        emojiGrid.appendChild(span);
    });
}

// 2. Toggles the visibility of the panel
function openEmojiPicker() {
    if (!emojiPanel) return;

    isEmojiPanelOpen = !isEmojiPanelOpen;
    emojiPanel.style.display = isEmojiPanelOpen ? 'grid' : 'none';

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

    messageInput.value = value.substring(0, start) + emoji + value.substring(end);

    const newCursorPos = start + emoji.length;
    messageInput.selectionStart = newCursorPos;
    messageInput.selectionEnd = newCursorPos;

    messageInput.focus();
}

// --- END EMOJI FUNCTIONS ---


// 📥 Fetch active rooms from the backend
function loadRooms() {
    fetch(`${API_BASE}/rooms`)
    .then(res => res.json())
    .then(data => {
        const dropdown = document.getElementById("roomDropdown");
        if (!dropdown) return; 
        dropdown.innerHTML = '<option value="">-- Select existing room --</option>';

        if (data.rooms.length === 0) {
            const noRoom = document.createElement("option");
            noRoom.textContent = "No active rooms yet";
            noRoom.disabled = true;
            dropdown.appendChild(noRoom);
        }

        data.rooms.forEach(r => {
            const option = document.createElement("option");
            option.value = r;
            option.textContent = r;
            dropdown.appendChild(option);
        });
    })
    .catch(err => console.error("❌ Could not fetch rooms (This is expected if server isn't running):", err));
}

// 🧠 Handle user clicking "Join Chat"
function joinChat() {
    username = document.getElementById('username').value.trim();
    const dropdownRoom = document.getElementById('roomDropdown').value;
    const manualRoom = document.getElementById('room').value.trim();
    room = dropdownRoom || manualRoom;

    if (!username || !room) {
        showFloatingNotification("⚠️ Please enter both username and room.", 'error');
        return;
    }

    // 🔀 Switch to chat interface
    const mainWrapper = document.querySelector('.main-wrapper');
    const chatPage = document.getElementById('chatPage');
    const roomNameDisplay = document.getElementById('roomName'); 

    if (mainWrapper) mainWrapper.style.display = 'none';
    if (chatPage) chatPage.style.display = 'flex'; 
    if (roomNameDisplay) roomNameDisplay.textContent = `Room: ${room}`; 

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

        if (msg.type === 'error') {
            showFloatingNotification(msg.message, 'error');
            socket.close();
            setTimeout(() => location.reload(), 1500); 
            return;
        }

        if (msg.type === 'info') {
            showFloatingNotification(msg.message, 'info');
            return; 
        }
        
        if (msg.type === 'message') {
            const isMine = msg.username === username;
            appendMessage(msg.username, msg.message, isMine, msg.timestamp);
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
    if (!messageInput) return; 
    const message = messageInput.value.trim();

    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'message', message }));
        messageInput.value = '';
        if (isEmojiPanelOpen) openEmojiPicker(); // Close panel after sending
    }
}

// ⏎ Send message on pressing Enter
function handleKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

// 🎞️ Placeholder for future GIF support
function sendGif() {
    showFloatingNotification("🎞️ GIF support coming soon!", 'info');
}

// 🔁 Initialize DOM elements and load rooms when the page loads
window.onload = function() {
    // 1. Initialize DOM elements
    messageInput = document.getElementById('messageInput');
    emojiBtn = document.getElementById('emojiBtn');
    emojiPanel = document.getElementById('emojiPanel');
    emojiGrid = document.getElementById('emojiGrid');
    
    // 2. Populate the emoji grid once
    populateEmojiPanel();

    // 3. Attach EMOJI listener
    if (emojiBtn) {
        emojiBtn.addEventListener('click', openEmojiPicker);
    }

    // 4. Attach ENTER key listener (using keydown for better control)
    if (messageInput) {
        messageInput.addEventListener('keydown', handleKey);
    }
    
    // 5. Load rooms
    loadRooms();
};
