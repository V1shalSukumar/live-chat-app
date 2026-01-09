"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket"; 

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  const enterChat = (): void => {
    if (!username.trim()) return;

    if (!socket.connected) {
      socket.connect();
    }
    
    socket.emit("login",{username},(response: any)=> {
      
      if (!response || response.error) {
        alert("Login failed");
        return;
      }
      
      sessionStorage.setItem("token",response.token);
      sessionStorage.setItem("username", username);
      router.push("/chat");
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-100">
      <h1 className="text-xl">Real-time chat application</h1>

      <input
        type="text"
        value={username}
        placeholder="Enter username"
        onChange={(e) => setUsername(e.target.value)}
        className="border rounded p-2 text-center placeholder-gray"
      />

      <button
        className="bg-blue-300 rounded p-2"
        onClick={enterChat}
      >
        Enter
      </button>
    </div>
  );
}
