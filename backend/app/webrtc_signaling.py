"""
WebRTC signaling server for peer-to-peer connections.
"""
from fastapi import WebSocket
from typing import Dict, Set
import json


class WebRTCSignalingManager:
    """Manages WebRTC signaling for video/audio calls."""

    def __init__(self):
        # Store call rooms: {room_id: {user_id: websocket}}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        # Store user to room mapping: {user_id: room_id}
        self.user_rooms: Dict[str, str] = {}

    async def join_room(self, room_id: str, user_id: str, websocket: WebSocket):
        """Add a user to a call room."""
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        
        self.rooms[room_id][user_id] = websocket
        self.user_rooms[user_id] = room_id
        
        # Notify other users in the room
        await self.broadcast_to_room(room_id, {
            "type": "user_joined_call",
            "room_id": room_id,
            "user_id": user_id,
            "participants": list(self.rooms[room_id].keys())
        }, exclude_user=user_id)

    async def leave_room(self, user_id: str):
        """Remove a user from their current room."""
        if user_id not in self.user_rooms:
            return
        
        room_id = self.user_rooms[user_id]
        
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            del self.rooms[room_id][user_id]
            
            # Notify other users
            await self.broadcast_to_room(room_id, {
                "type": "user_left_call",
                "room_id": room_id,
                "user_id": user_id,
                "participants": list(self.rooms[room_id].keys())
            })
            
            # Clean up empty rooms
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
        del self.user_rooms[user_id]

    async def relay_signal(self, room_id: str, from_user: str, to_user: str, signal: dict):
        """Relay WebRTC signal from one user to another."""
        if room_id not in self.rooms:
            return
        
        # If to_user is specified, send only to that user
        if to_user and to_user in self.rooms[room_id]:
            websocket = self.rooms[room_id][to_user]
            await websocket.send_json({
                "type": "webrtc_signal",
                "from_user": from_user,
                "signal": signal
            })
        else:
            # Broadcast to all users in room except sender
            await self.broadcast_to_room(room_id, {
                "type": "webrtc_signal",
                "from_user": from_user,
                "signal": signal
            }, exclude_user=from_user)

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):
        """Broadcast a message to all users in a room."""
        if room_id not in self.rooms:
            return
        
        disconnected_users = []
        
        for user_id, websocket in self.rooms[room_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending to user {user_id} in room {room_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            if user_id in self.user_rooms:
                await self.leave_room(user_id)

    def get_room_participants(self, room_id: str) -> list:
        """Get list of participants in a room."""
        if room_id not in self.rooms:
            return []
        return list(self.rooms[room_id].keys())


# Global signaling manager instance
signaling_manager = WebRTCSignalingManager()
