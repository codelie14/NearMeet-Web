"""
WebSocket connection manager for real-time communication.
"""
from fastapi import WebSocket
from typing import Dict, List, Set
import json
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections for real-time chat."""

    def __init__(self):
        # Store active connections: {user_id: websocket}
        self.active_connections: Dict[int, WebSocket] = {}
        # Store user info: {user_id: username}
        self.users: Dict[int, str] = {}
        # Store typing status: {channel_id: set(user_ids)}
        self.typing_users: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.users[user_id] = username
        
        # Notify all users that someone joined
        await self.broadcast({
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.utcnow().isoformat(),
            "online_users": self.get_online_users()
        })

    def disconnect(self, user_id: int):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        username = self.users.get(user_id)
        if user_id in self.users:
            del self.users[user_id]
        
        return username

    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

    async def broadcast(self, message: dict, exclude_user: int = None):
        """Broadcast a message to all connected users."""
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)

    async def broadcast_to_channel(self, message: dict, channel_id: int, exclude_user: int = None):
        """Broadcast a message to all users in a specific channel."""
        # For now, broadcast to all (can be enhanced with channel subscriptions)
        await self.broadcast(message, exclude_user)

    def get_online_users(self) -> List[dict]:
        """Get list of online users."""
        return [
            {"user_id": user_id, "username": username}
            for user_id, username in self.users.items()
        ]

    async def set_typing(self, user_id: int, channel_id: int, is_typing: bool):
        """Update typing status for a user in a channel."""
        if channel_id not in self.typing_users:
            self.typing_users[channel_id] = set()
        
        if is_typing:
            self.typing_users[channel_id].add(user_id)
        else:
            self.typing_users[channel_id].discard(user_id)
        
        # Broadcast typing status
        await self.broadcast_to_channel({
            "type": "typing",
            "channel_id": channel_id,
            "user_id": user_id,
            "username": self.users.get(user_id),
            "is_typing": is_typing
        }, channel_id, exclude_user=user_id)


# Global connection manager instance
manager = ConnectionManager()
