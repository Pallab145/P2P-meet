import { io } from "socket.io-client";

const URL = "http://localhost:5000"; 
const socket = io(URL);

socket.on('connection-success',({ socketId }) => {
    console.log(`socket id is ${socketId}`);
})

export default socket;
