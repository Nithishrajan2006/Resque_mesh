"""WebSocket endpoint router"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket_manager import websocket_manager
import uuid, logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.send_to_client(client_id, {"type": "ack", "data": data})
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
