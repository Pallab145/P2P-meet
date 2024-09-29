import { io } from "socket.io-client";

const URL = "http://localhost:5000"; // Replace with your backend URL
const socket = io(URL);

export default socket;
