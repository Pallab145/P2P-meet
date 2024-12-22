import { io } from "socket.io-client";

// const URL = "https://p2-p-meet-backend.vercel.app"; 
const URL = "http://localhost:5000";
const socket = io(URL);

socket.on('connection-success',({ socketId }) => {
    console.log(`socket id is ${socketId}`);
})

export default socket;
