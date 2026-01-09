import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://127.0.0.1:5000", {
  autoConnect: false,
});

export default socket;
