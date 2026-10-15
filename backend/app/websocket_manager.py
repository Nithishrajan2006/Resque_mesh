"""
ResQMesh WebSocket Manager
Manages WebSocket connections for real-time updates
"""
import json
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # topic -> set of connection_ids

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket client {client_id} connected")

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        for topic_clients in self.subscriptions.values():
            topic_clients.discard(client_id)
        logger.info(f"WebSocket client {client_id} disconnected")

    async def send_to_client(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast(self, message: dict, topic: Optional[str] = None):
        """Broadcast to all connected clients or those subscribed to a topic"""
        if topic and topic in self.subscriptions:
            targets = list(self.subscriptions[topic])
        else:
            targets = list(self.active_connections.keys())

        disconnected = []
        for client_id in targets:
            if client_id in self.active_connections:
                try:
                    await self.active_connections[client_id].send_json(message)
                except Exception as e:
                    logger.error(f"Broadcast error for {client_id}: {e}")
                    disconnected.append(client_id)

        for client_id in disconnected:
            self.disconnect(client_id)

    async def broadcast_event(self, event_type: str, data: dict):
        """Broadcast a typed event to all clients"""
        message = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.broadcast(message)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


websocket_manager = WebSocketManager()
