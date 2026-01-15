"""
Main FastAPI application for NearMeet backend.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
import os
from dotenv import load_dotenv

from .database import get_db, init_db
from .models import User, Channel, Message, File as FileModel
from .schemas import (
    UserCreate, UserResponse, ChannelCreate, ChannelResponse,
    MessageCreate, MessageResponse, FileResponse as FileResponseSchema
)
from .websocket_manager import manager
from .webrtc_signaling import signaling_manager
from .file_handler import file_handler
from .encryption import encryption_manager

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="NearMeet API",
    description="Local communication platform with real-time chat, video calls, and file sharing",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    # Create default channel if it doesn't exist
    db = next(get_db())
    default_channel = db.query(Channel).filter(Channel.name == "general").first()
    if not default_channel:
        # Create a system user first
        system_user = db.query(User).filter(User.username == "system").first()
        if not system_user:
            system_user = User(username="system", is_online=False)
            db.add(system_user)
            db.commit()
            db.refresh(system_user)
        
        default_channel = Channel(name="general", description="General discussion", created_by=system_user.id)
        db.add(default_channel)
        db.commit()
    db.close()


# ==================== REST API Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "NearMeet API is running", "version": "1.0.0"}


# User Endpoints
@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(username=user.username, is_online=False)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/users", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    """Get all users."""
    users = db.query(User).all()
    return users


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Channel Endpoints
@app.post("/api/channels", response_model=ChannelResponse)
async def create_channel(channel: ChannelCreate, user_id: int = Form(...), db: Session = Depends(get_db)):
    """Create a new channel."""
    # Check if channel name already exists
    existing_channel = db.query(Channel).filter(Channel.name == channel.name).first()
    if existing_channel:
        raise HTTPException(status_code=400, detail="Channel name already exists")
    
    new_channel = Channel(
        name=channel.name,
        description=channel.description,
        created_by=user_id
    )
    db.add(new_channel)
    db.commit()
    db.refresh(new_channel)
    return new_channel


@app.get("/api/channels", response_model=List[ChannelResponse])
async def get_channels(db: Session = Depends(get_db)):
    """Get all channels."""
    channels = db.query(Channel).all()
    return channels


# Message Endpoints
@app.get("/api/channels/{channel_id}/messages", response_model=List[MessageResponse])
async def get_messages(channel_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Get messages for a channel."""
    messages = (
        db.query(Message)
        .filter(Message.channel_id == channel_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    
    # Add username to each message
    result = []
    for msg in reversed(messages):
        msg_dict = {
            "id": msg.id,
            "user_id": msg.user_id,
            "channel_id": msg.channel_id,
            "content": msg.content,
            "message_type": msg.message_type,
            "file_id": msg.file_id,
            "created_at": msg.created_at,
            "username": msg.user.username if msg.user else "Unknown"
        }
        result.append(msg_dict)
    
    return result


# File Endpoints
@app.post("/api/files/upload", response_model=FileResponseSchema)
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Upload a file."""
    # Save file to disk
    file_info = await file_handler.save_file(file, user_id)
    
    # Save file metadata to database
    new_file = FileModel(
        filename=file_info["filename"],
        original_filename=file_info["original_filename"],
        filepath=file_info["filepath"],
        size=file_info["size"],
        mime_type=file_info["mime_type"],
        uploaded_by=user_id
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return new_file


@app.get("/api/files/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    """Download a file."""
    file_record = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not os.path.exists(file_record.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_record.filepath,
        filename=file_record.original_filename,
        media_type=file_record.mime_type
    )


# ==================== WebSocket Endpoints ====================

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time chat."""
    # Get user info
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=4004, reason="User not found")
        return
    
    # Update user status
    user.is_online = True
    user.last_seen = datetime.utcnow()
    db.commit()
    
    # Connect to WebSocket manager
    await manager.connect(websocket, user_id, user.username)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "message":
                # Save message to database
                content = message_data.get("content", "")
                channel_id = message_data.get("channel_id", 1)
                file_id = message_data.get("file_id")
                msg_type = message_data.get("message_type", "text")
                
                new_message = Message(
                    user_id=user_id,
                    channel_id=channel_id,
                    content=content,
                    message_type=msg_type,
                    file_id=file_id
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)
                
                # Broadcast message to all users
                await manager.broadcast({
                    "type": "message",
                    "id": new_message.id,
                    "user_id": user_id,
                    "username": user.username,
                    "channel_id": channel_id,
                    "content": content,
                    "message_type": msg_type,
                    "file_id": file_id,
                    "timestamp": new_message.created_at.isoformat()
                })
            
            elif message_type == "typing":
                # Broadcast typing indicator
                channel_id = message_data.get("channel_id", 1)
                is_typing = message_data.get("is_typing", False)
                await manager.set_typing(user_id, channel_id, is_typing)
    
    except WebSocketDisconnect:
        # Update user status
        user.is_online = False
        user.last_seen = datetime.utcnow()
        db.commit()
        
        # Disconnect from manager
        username = manager.disconnect(user_id)
        
        # Notify others
        await manager.broadcast({
            "type": "user_left",
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.utcnow().isoformat(),
            "online_users": manager.get_online_users()
        })


@app.websocket("/ws/webrtc/{room_id}/{user_id}")
async def websocket_webrtc_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    """WebSocket endpoint for WebRTC signaling."""
    await websocket.accept()
    await signaling_manager.join_room(room_id, user_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            signal_data = json.loads(data)
            
            signal_type = signal_data.get("type")
            to_user = signal_data.get("to_user")
            signal = signal_data.get("signal")
            
            # Relay signal to other user(s)
            await signaling_manager.relay_signal(room_id, user_id, to_user, signal)
    
    except WebSocketDisconnect:
        await signaling_manager.leave_room(user_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
