"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socket";

interface Message {
  user: string;
  text: string;
  time: string;
  room: string | null;
}

export default function Chat() {
  const [roomInput, setRoomInput] = useState<string>("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [username, setUsername] = useState<string>("");


  useEffect(() => {
    const username = sessionStorage.getItem("username");
    if (!username)
      {return;}
    else {
      setUsername(username);
    }

    socket.connect();

    socket.emit("load_messages", (history: Message[]) => {
    console.log("GLOBAL HISTORY:", history);
    setMessages(history);
    });

    socket.on("message", (msg: Message) => {
      console.log("FROM SERVER:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, []);

  const sendMessage = (): void => {
    const username = sessionStorage.getItem("username");
    if (!username || !input.trim()) return;

    const newMessage: Message = {
      user: username,
      text: input,
      time: new Date().toLocaleTimeString(),
      room: activeRoom || null,
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit("message", newMessage);

    setInput("");
  };

  const loadGlobalHistory = () => {
  if (!socket.connected) {
    console.warn("Socket not connected yet");
    return;
  }
  socket.emit("load_messages", (history: Message[]) => {
    setMessages(history);
  });
  };

  const joinRoom = () => {
    const cleanRoom = roomInput.trim();
    if (!cleanRoom) return;

    socket.emit("join_room", { room: cleanRoom });

    socket.emit(
      "load_room_history",
      { room: cleanRoom },
      (history: Message[]) => {
        setMessages(history);
        setActiveRoom(cleanRoom);
      }
    );
  };

  const goBackToGlobal = () => {
    if (!activeRoom) return;
    socket.emit("leave_room", { room: activeRoom });
    setActiveRoom(null);
    socket.emit("load_messages", (history: Message[]) => {
    setMessages(history);
  });
  };

  return (
    <div style={{ padding: 20 }}>
      <div className="flex justify-between w-full">
        <h1>{activeRoom ? `Private Room: ${activeRoom}` : "Global Chat"}</h1> <h1>Logged in as: <mark>{username}</mark></h1>
      </div>
      <div
  style={{ background:"white", height:300, overflowY: "auto", border:"1px solid black",
    padding:8, marginBottom:10}}>
        {messages.filter(m => activeRoom? m.room === activeRoom : m.room === null).map((m, i) => (
          <div key={i}>
            <strong>{m.user}</strong>: {m.text}
            <span style={{ marginLeft: 8, fontSize: "0.8em" }}>
              {m.time}
            </span>
          </div>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
      />

      <button onClick={sendMessage}>Send</button>
      <h1></h1>

      <div style={{ marginBottom: 10 }}>
      <input
        placeholder="Enter room name"
        value={roomInput}
        onChange={(e) => setRoomInput(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
      </div>
      <div>{activeRoom &&<button onClick={goBackToGlobal}>Back</button>}</div>
    </div>
  );
}
