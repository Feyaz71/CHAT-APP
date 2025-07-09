<!-- 💬 Chat App
A simple, real-time chat application built with HTML, CSS, JavaScript on the frontend and Node.js + WebSocket on the backend. This app allows users to join or create chat rooms, send messages, and enjoy a modern, responsive UI.

🚀 Features

1) Create or Join Rooms: Users can join existing chat rooms or create new ones.
2) Real-Time Messaging: Send and receive messages instantly via WebSocket.
3) Message Details: Displays usernames and timestamps with each message.
4) No Authentication Required: Simply enter a username to start chatting.
5) Modern UI: Sleek design with blur effects and custom fonts (Poppins + 2 custom .ttf fonts).
6) Responsive Design: Works seamlessly on both desktop and mobile devices.

📁 Project Structure
CHAT_APP/
│
├── client/
│   ├── index.html       # Homepage
│   ├── chat.html        # Chat room UI
│   ├── style.css        # Styles for chat page
│   ├── style2.css       # Styles for homepage
│   ├── script.js        # Frontend JavaScript logic for chat functionality
│   └── fonts/           # Custom .ttf fonts
    └── images/           # Background image and other used icons
│
├── server/
│   └── server.js        # Node.js WebSocket + Express backend
│
└── LICENSE              # MIT LICENSE
├── package.json         # Node.js dependencies and scripts
├── package-lock.json    # Dependency lock file
└── README.md            # Project documentation


<--  💡 How to Run  -->

<!-- Follow these steps to set up and run the chat app locally:

* Prerequisites

    # Node.js installed on your machine .
    # A modern web browser (Chrome, Firefox, etc.).
    # (Optional) VS Code with the Live Server extension for easy frontend testing.

Steps

1) Clone the repository (if hosted on a platform like GitHub):
    git clone https://github.com/your-username/chat-app.git


2) Navigate to the project directory:
    cd chat-app


3) Install backend dependencies:

    Go to the server/ folder:cd server


    - Install required packages:npm install
        npm install


4) Run the server:

    From the server/ folder, start the Node.js server:node server.js




<--   Access the frontend:    -->

<!-- Open client/index.html in a browser:
Use VS Code’s Live Server extension (right-click index.html and select "Open with Live Server").
Alternatively, open index.html directly in a browser (note: some features may require a local server due to CORS). -->



<!-- 🌐 Server Info

Server URL: http://localhost:8081
WebSocket: Handles real-time chat functionality.
Express: Serves the frontend and provides available chat rooms.

📝 Notes

Room Creation/Joining: Enter an existing room name or create a new one by typing a unique name.
Username Restrictions: Duplicate usernames in the same room are not allowed.
Fonts: Uses Poppins (Google Fonts) and two custom .ttf fonts located in the client/fonts/ directory.
Mobile Support: The UI is fully responsive for a smooth experience on mobile devices. -->



<!-- 📜 License
This project is licensed under the MIT License. See the LICENSE file for details. --> -->