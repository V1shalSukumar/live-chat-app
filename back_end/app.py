from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from pymongo import MongoClient
from datetime import datetime
import uuid

client = MongoClient("mongodb://localhost:27017")
db = client["chat_app"]
messages = db["messages"]
sessions={}

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def home():
    return "Socket.IO backend is running"

@socketio.on("login")
def login(data):
    username = data.get("username")

    if not username:
        return {"error": "Username required"}

    token = str(uuid.uuid4())
    sessions[token] = username

    print(f"LOGIN: {username} -> {token}")

    return {"token": token} 

@socketio.on("connect")
def handle_connect():
    print("User connected")

@socketio.on("join_room")
def join_private_room(data):
    room = data["room"]
    join_room(room)
    print(f"User joined room: {room}")

@socketio.on("leave_room")
def leave_private_room(data):
    room = data["room"]
    leave_room(room)
    print(f"User left room: {room}")

@socketio.on("load_messages")
def load_messages():
    history = list(messages.find({}, {"_id": 0}))
    for msg in history:
        if isinstance(msg.get("time"), datetime):
            msg["time"] = msg["time"].strftime("%H:%M:%S")
    return history

@socketio.on("message")
def handle_message(data):
    token=data.get("token")
    user=sessions.get(token)

    if not user:
        print("INVALID TOKEN")
        return
    
    message={
        "user":user,
        "text":data["text"],
        "room":data.get("room"),
        "time":data["time"]
    }
    messages.insert_one(data)
    room=message["room"]
    if room:
        emit("message",data,room=room, include_self=False)
    else:
        emit("message", data, broadcast=True, include_self=False)

@socketio.on("load_room_history")
def load_room_history(data):
    room = data["room"]
    print("ROOM REQUESTED:", room)

    history = list(
        messages.find(
            {"room": room},
            {"_id": 0}
        )
    )
    return history

@socketio.on("disconnect")
def handle_disconnect():
    print("User disconnected")

if __name__ == "__main__":
    socketio.run(app, debug=True)